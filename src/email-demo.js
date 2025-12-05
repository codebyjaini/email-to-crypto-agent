/**
 * Email Demo Script
 * 
 * This script demonstrates the full email flow:
 * 1. Simulates receiving an email
 * 2. Processes it with AI
 * 3. Sends a real email response
 * 
 * Usage: node src/email-demo.js
 */

import { processEmail, formatEmailResponse } from './agent.js';
import { sendEmail } from './email.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function runEmailDemo() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   📧 Email-to-Crypto Agent - EMAIL DEMO                       ║
║                                                               ║
║   This will send REAL emails to demonstrate the agent!        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // Get recipient email
  const recipientEmail = await question('\n📬 Enter YOUR email address (to receive the demo): ');
  
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.log('❌ Invalid email address');
    rl.close();
    return;
  }

  console.log(`\n✅ Will send responses to: ${recipientEmail}\n`);

  // Demo scenarios
  const demos = [
    { 
      name: 'Create Wallet',
      subject: 'Getting Started',
      body: 'Hi! I want to create a crypto wallet.'
    },
    {
      name: 'Check Balance', 
      subject: 'Balance Check',
      body: 'What is my current balance?'
    },
    {
      name: 'Get Address',
      subject: 'My Wallet',
      body: 'What is my wallet address?'
    },
    {
      name: 'Get Help',
      subject: 'Help',
      body: 'What can you help me with?'
    }
  ];

  console.log('Available demos:');
  demos.forEach((demo, i) => {
    console.log(`  ${i + 1}. ${demo.name} - "${demo.body}"`);
  });
  console.log(`  5. Custom message`);
  console.log(`  0. Exit\n`);

  while (true) {
    const choice = await question('Select demo (1-5, or 0 to exit): ');
    
    if (choice === '0') {
      console.log('\n👋 Goodbye!\n');
      break;
    }

    let subject, body;
    
    if (choice === '5') {
      subject = await question('Enter email subject: ');
      body = await question('Enter email body: ');
    } else {
      const index = parseInt(choice) - 1;
      if (index < 0 || index >= demos.length) {
        console.log('❌ Invalid choice');
        continue;
      }
      subject = demos[index].subject;
      body = demos[index].body;
    }

    console.log(`\n📧 Simulating incoming email...`);
    console.log(`   From: ${recipientEmail}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);
    console.log(`\n⏳ Processing with AI...\n`);

    try {
      // Process the email with AI
      const response = await processEmail(recipientEmail, subject, body);
      
      console.log('─'.repeat(60));
      console.log('🤖 AI Response:');
      console.log(response);
      console.log('─'.repeat(60));

      // Send real email
      console.log(`\n📤 Sending email to ${recipientEmail}...`);
      
      const htmlResponse = formatEmailResponse(response);
      const result = await sendEmail(
        recipientEmail,
        `Re: ${subject}`,
        response,
        htmlResponse
      );

      if (result.success) {
        console.log(`✅ Email sent successfully! Check your inbox.`);
        console.log(`   Email ID: ${result.id}\n`);
      } else {
        console.log(`❌ Failed to send email: ${result.error}\n`);
      }

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }
  }

  rl.close();
}

runEmailDemo().catch(console.error);
