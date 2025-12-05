import { createWalletClient, createPublicClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { sepolia, mainnet, polygon, base } from 'viem/chains';
import {
  getOrCreateUser,
  saveWallet,
  getWalletByEmail,
  getAllUserWallets,
  saveTransaction,
  updateTransactionStatus,
  getTransactionsByEmail,
  getUserByAddress
} from './database.js';
import dotenv from 'dotenv';

dotenv.config();

// Chain configurations
const CHAINS = {
  11155111: sepolia,
  1: mainnet,
  137: polygon,
  8453: base
};

const CHAIN_NAMES = {
  11155111: 'Sepolia Testnet',
  1: 'Ethereum Mainnet',
  137: 'Polygon',
  8453: 'Base'
};

// Create public client for reading blockchain data
function getPublicClient(chainId = 11155111) {
  const chain = CHAINS[chainId] || sepolia;
  return createPublicClient({
    chain,
    transport: http(process.env.RPC_URL)
  });
}

// Create wallet client for sending transactions
function getWalletClient(privateKey, chainId = 11155111) {
  const chain = CHAINS[chainId] || sepolia;
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain,
    transport: http(process.env.RPC_URL)
  });
}

/**
 * Create a new wallet for a user
 */
export async function createWallet(email) {
  try {
    // Get or create user
    const user = getOrCreateUser(email);
    
    // Check if user already has a wallet
    const existingWallet = getWalletByEmail(email);
    if (existingWallet) {
      return {
        success: false,
        message: `You already have a wallet: ${existingWallet.address}`,
        address: existingWallet.address
      };
    }
    
    // Generate new wallet
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    
    // Save wallet to database
    const chainId = parseInt(process.env.CHAIN_ID || '11155111');
    const wallet = saveWallet(user.id, account.address, privateKey, process.env.ENCRYPTION_KEY, chainId);
    
    return {
      success: true,
      message: `🎉 Your new wallet has been created!`,
      address: account.address,
      chainId,
      chainName: CHAIN_NAMES[chainId],
      note: 'This is your personal crypto wallet. You can now receive and send crypto via email!'
    };
  } catch (error) {
    console.error('Error creating wallet:', error);
    return {
      success: false,
      message: `Failed to create wallet: ${error.message}`
    };
  }
}

/**
 * Get wallet balance
 */
export async function getBalance(email) {
  try {
    const wallet = getWalletByEmail(email);
    
    if (!wallet) {
      return {
        success: false,
        message: 'You don\'t have a wallet yet. Reply with "create wallet" to get started!'
      };
    }
    
    const publicClient = getPublicClient(wallet.chain_id);
    const balance = await publicClient.getBalance({ address: wallet.address });
    const balanceInEth = formatEther(balance);
    
    return {
      success: true,
      address: wallet.address,
      balance: balanceInEth,
      token: 'ETH',
      chainName: CHAIN_NAMES[wallet.chain_id],
      message: `💰 Your balance: ${balanceInEth} ETH on ${CHAIN_NAMES[wallet.chain_id]}`
    };
  } catch (error) {
    console.error('Error getting balance:', error);
    return {
      success: false,
      message: `Failed to get balance: ${error.message}`
    };
  }
}

/**
 * Send ETH to another address or email
 */
export async function sendCrypto(fromEmail, toAddressOrEmail, amount) {
  try {
    // Get sender's wallet
    const senderWallet = getWalletByEmail(fromEmail, process.env.ENCRYPTION_KEY);
    
    if (!senderWallet) {
      return {
        success: false,
        message: 'You don\'t have a wallet yet. Reply with "create wallet" to get started!'
      };
    }
    
    // Determine recipient address
    let toAddress;
    let recipientEmail = null;
    
    if (toAddressOrEmail.includes('@')) {
      // It's an email - look up their wallet
      recipientEmail = toAddressOrEmail;
      const recipientWallet = getWalletByEmail(toAddressOrEmail);
      
      if (!recipientWallet) {
        return {
          success: false,
          message: `The recipient (${toAddressOrEmail}) doesn't have a wallet yet. They need to email us first to create one!`
        };
      }
      toAddress = recipientWallet.address;
    } else if (toAddressOrEmail.startsWith('0x')) {
      // It's an address
      toAddress = toAddressOrEmail;
    } else {
      return {
        success: false,
        message: 'Invalid recipient. Please provide an email address or wallet address (0x...)'
      };
    }
    
    // Check balance
    const publicClient = getPublicClient(senderWallet.chain_id);
    const balance = await publicClient.getBalance({ address: senderWallet.address });
    const amountInWei = parseEther(amount.toString());
    
    if (balance < amountInWei) {
      return {
        success: false,
        message: `Insufficient balance. You have ${formatEther(balance)} ETH but tried to send ${amount} ETH`
      };
    }
    
    // Create transaction record
    const user = getOrCreateUser(fromEmail);
    const txRecord = saveTransaction(user.id, 'send', senderWallet.address, toAddress, amount.toString());
    
    // Send transaction
    const walletClient = getWalletClient(senderWallet.privateKey, senderWallet.chain_id);
    
    const hash = await walletClient.sendTransaction({
      to: toAddress,
      value: amountInWei
    });
    
    // Update transaction status
    updateTransactionStatus(txRecord.id, hash, 'confirmed');
    
    const explorerUrl = getExplorerUrl(senderWallet.chain_id, hash);
    
    return {
      success: true,
      message: `✅ Successfully sent ${amount} ETH!`,
      txHash: hash,
      from: senderWallet.address,
      to: toAddress,
      recipientEmail,
      amount: amount.toString(),
      explorerUrl,
      note: recipientEmail ? `${recipientEmail} will be notified of this transfer.` : undefined
    };
  } catch (error) {
    console.error('Error sending crypto:', error);
    return {
      success: false,
      message: `Failed to send: ${error.message}`
    };
  }
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(email) {
  try {
    const transactions = getTransactionsByEmail(email, 10);
    
    if (transactions.length === 0) {
      return {
        success: true,
        message: 'No transactions yet.',
        transactions: []
      };
    }
    
    const formattedTxs = transactions.map(tx => ({
      type: tx.type,
      amount: `${tx.amount} ${tx.token}`,
      from: tx.from_address,
      to: tx.to_address,
      status: tx.status,
      txHash: tx.tx_hash,
      date: tx.created_at
    }));
    
    return {
      success: true,
      message: `📜 Your last ${transactions.length} transactions:`,
      transactions: formattedTxs
    };
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return {
      success: false,
      message: `Failed to get history: ${error.message}`
    };
  }
}

/**
 * Get wallet address for a user
 */
export function getWalletAddress(email) {
  const wallet = getWalletByEmail(email);
  
  if (!wallet) {
    return {
      success: false,
      message: 'You don\'t have a wallet yet. Reply with "create wallet" to get started!'
    };
  }
  
  return {
    success: true,
    address: wallet.address,
    chainName: CHAIN_NAMES[wallet.chain_id],
    message: `📬 Your wallet address: ${wallet.address}`
  };
}

/**
 * Get explorer URL for a transaction
 */
function getExplorerUrl(chainId, txHash) {
  const explorers = {
    11155111: 'https://sepolia.etherscan.io/tx/',
    1: 'https://etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    8453: 'https://basescan.org/tx/'
  };
  return `${explorers[chainId] || explorers[11155111]}${txHash}`;
}

/**
 * Get help message
 */
export function getHelp() {
  return {
    success: true,
    message: `
📧 **Email-to-Crypto Agent Help**

Here's what you can do:

**Wallet Commands:**
• "create wallet" - Create your first crypto wallet
• "my address" or "wallet address" - Get your wallet address
• "balance" - Check your ETH balance

**Send Crypto:**
• "send 0.1 ETH to john@example.com" - Send to another user
• "send 0.05 ETH to 0x..." - Send to any wallet address

**History:**
• "history" or "transactions" - View your recent transactions

**Help:**
• "help" - Show this message

Just reply naturally - I understand plain English! 🤖
    `.trim()
  };
}
