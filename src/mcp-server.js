import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import {
  createWallet,
  getBalance,
  sendCrypto,
  getTransactionHistory,
  getWalletAddress,
  getHelp
} from './wallet.js';
import dotenv from 'dotenv';

dotenv.config();

// Create MCP Server
const server = new Server(
  {
    name: 'email-to-crypto-agent',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Define available tools
const TOOLS = [
  {
    name: 'create_wallet',
    description: 'Create a new crypto wallet for a user identified by their email address. This generates a secure wallet that the user can use to send and receive cryptocurrency.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The email address of the user to create a wallet for'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'get_balance',
    description: 'Get the current ETH balance for a user\'s wallet identified by their email address.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The email address of the user to check balance for'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'send_crypto',
    description: 'Send ETH from one user to another. The recipient can be specified by email address (if they have a wallet) or by wallet address.',
    inputSchema: {
      type: 'object',
      properties: {
        from_email: {
          type: 'string',
          description: 'The email address of the sender'
        },
        to: {
          type: 'string',
          description: 'The recipient - can be an email address or wallet address (0x...)'
        },
        amount: {
          type: 'string',
          description: 'The amount of ETH to send (e.g., "0.1")'
        }
      },
      required: ['from_email', 'to', 'amount']
    }
  },
  {
    name: 'get_transaction_history',
    description: 'Get the recent transaction history for a user\'s wallet.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The email address of the user'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'get_wallet_address',
    description: 'Get the wallet address for a user so they can receive crypto.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The email address of the user'
        }
      },
      required: ['email']
    }
  },
  {
    name: 'get_help',
    description: 'Get help information about available commands and how to use the email-to-crypto service.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'create_wallet':
        result = await createWallet(args.email);
        break;
      
      case 'get_balance':
        result = await getBalance(args.email);
        break;
      
      case 'send_crypto':
        result = await sendCrypto(args.from_email, args.to, args.amount);
        break;
      
      case 'get_transaction_history':
        result = await getTransactionHistory(args.email);
        break;
      
      case 'get_wallet_address':
        result = getWalletAddress(args.email);
        break;
      
      case 'get_help':
        result = getHelp();
        break;
      
      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`
            }
          ],
          isError: true
        };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Email-to-Crypto MCP Server running on stdio');
}

main().catch(console.error);
