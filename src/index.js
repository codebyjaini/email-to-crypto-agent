/**
 * Email-to-Crypto Agent - Main Entry Point
 * 
 * This is the main orchestrator that can run in different modes:
 * 1. Webhook server - Listens for incoming emails from Resend
 * 2. CLI mode - Process emails from command line (for testing)
 */

import { processEmail, formatEmailResponse } from './agent.js';
import { sendEmail } from './email.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const args = process.argv.slice(2);

// CLI mode for testing
async function runCLI() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   📧 Email-to-Crypto Agent - Interactive CLI                  ║
║                                                               ║
║   Test the agent by simulating email conversations.           ║
║   Type 'exit' to quit.                                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let currentEmail = 'test@example.com';

  const askQuestion = () => {
    rl.question(`\n[${currentEmail}] > `, async (input) => {
      if (!input || input.toLowerCase() === 'exit') {
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }

      // Handle special commands
      if (input.startsWith('/email ')) {
        currentEmail = input.replace('/email ', '').trim();
        console.log(`\n✅ Switched to email: ${currentEmail}`);
        askQuestion();
        return;
      }

      if (input === '/help') {
        console.log(`
📚 CLI Commands:
  /email <address>  - Switch to a different email address
  /help             - Show this help message
  exit              - Exit the CLI

💬 Crypto Commands (type naturally):
  create wallet     - Create a new wallet
  balance           - Check your balance
  my address        - Get your wallet address
  send 0.1 ETH to someone@email.com
  history           - View transactions
  help              - Get help from the agent
        `);
        askQuestion();
        return;
      }

      // Process as email
      console.log('\n⏳ Processing...\n');
      
      try {
        const response = await processEmail(currentEmail, 'CLI Test', input);
        console.log('─'.repeat(60));
        console.log(response);
        console.log('─'.repeat(60));
      } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
      }

      askQuestion();
    });
  };

  console.log(`\n📧 Current email: ${currentEmail}`);
  console.log('   (Use "/email your@email.com" to change)');
  console.log('   (Type "/help" for CLI commands)\n');
  
  askQuestion();
}

// Server mode
async function runServer() {
  // Dynamically import and start the webhook server
  await import('./webhook-server.js');
}

// Main entry point
async function main() {
  console.log(`
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│   📧 Email-to-Crypto Agent                                    │
│   Send crypto via email - Web2 friendly!                      │
│                                                               │
│   Built for NullShot Hackathon                               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
  `);

  if (args.includes('--cli') || args.includes('-c')) {
    await runCLI();
  } else if (args.includes('--server') || args.includes('-s')) {
    await runServer();
  } else {
    console.log(`
Usage:
  npm start -- --cli     Run interactive CLI for testing
  npm start -- --server  Run webhook server for production
  npm run webhook        Run webhook server (shortcut)
  npm run mcp           Run as MCP server

For development:
  npm run dev -- --cli   Run CLI with auto-reload
    `);
    
    // Default to CLI for easy testing
    console.log('Starting CLI mode by default...\n');
    await runCLI();
  }
}

main().catch(console.error);
