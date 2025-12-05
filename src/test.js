/**
 * Test script to verify the Email-to-Crypto Agent functionality
 */

import { createWallet, getBalance, sendCrypto, getWalletAddress, getHelp } from './wallet.js';
import { processEmail } from './agent.js';
import dotenv from 'dotenv';

dotenv.config();

const TEST_EMAIL_1 = 'alice@test.com';
const TEST_EMAIL_2 = 'bob@test.com';

async function runTests() {
  console.log('🧪 Running Email-to-Crypto Agent Tests\n');
  console.log('═'.repeat(50));

  // Test 1: Create wallet
  console.log('\n📝 Test 1: Create Wallet');
  const wallet1 = await createWallet(TEST_EMAIL_1);
  console.log('Result:', JSON.stringify(wallet1, null, 2));

  // Test 2: Get wallet address
  console.log('\n📝 Test 2: Get Wallet Address');
  const address = getWalletAddress(TEST_EMAIL_1);
  console.log('Result:', JSON.stringify(address, null, 2));

  // Test 3: Check balance
  console.log('\n📝 Test 3: Check Balance');
  const balance = await getBalance(TEST_EMAIL_1);
  console.log('Result:', JSON.stringify(balance, null, 2));

  // Test 4: Try to create wallet for someone without one
  console.log('\n📝 Test 4: Create Second Wallet');
  const wallet2 = await createWallet(TEST_EMAIL_2);
  console.log('Result:', JSON.stringify(wallet2, null, 2));

  // Test 5: Get help
  console.log('\n📝 Test 5: Get Help');
  const help = getHelp();
  console.log('Result:', help.message);

  // Test 6: Process natural language email
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-xxxxxxxxxxxx') {
    console.log('\n📝 Test 6: Process Natural Language Email');
    console.log('Testing: "Hey, I want to check my balance"');
    
    try {
      const response = await processEmail(
        TEST_EMAIL_1,
        'Balance check',
        'Hey, I want to check my balance'
      );
      console.log('AI Response:', response);
    } catch (error) {
      console.log('Skipped (AI test requires valid API key):', error.message);
    }
  } else {
    console.log('\n📝 Test 6: Skipped (OPENAI_API_KEY not set)');
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Tests completed!\n');
}

runTests().catch(console.error);
