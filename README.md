# 📧 Email-to-Crypto Agent

> Send crypto and manage wallets via email - Making Web3 accessible to everyone!

Built for **NullShot Hackathon Season 0** - Track 2: MCPs/Agents using other frameworks

![Email-to-Crypto](https://img.shields.io/badge/Email--to--Crypto-Agent-blueviolet?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![MCP](https://img.shields.io/badge/MCP-Compatible-green?style=for-the-badge)

## 🌟 Overview

Email-to-Crypto Agent bridges the gap between Web2 and Web3 by allowing users to interact with cryptocurrency using just their email. No wallets to install, no seed phrases to remember, no gas fees to understand - just send an email!

### Why Email?

- **Universal Access**: Everyone has an email address
- **Zero Learning Curve**: No new apps or interfaces to learn  
- **Familiar UX**: Works like any email conversation
- **Mobile Friendly**: Works on any device with email

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auto Wallet Creation** | Wallets are automatically created when users first interact |
| 💸 **Send Crypto via Email** | "Send 0.1 ETH to friend@email.com" |
| 📊 **Balance Checks** | Simply ask "What's my balance?" |
| 📜 **Transaction History** | View your recent transactions |
| 🤖 **Natural Language** | AI understands plain English requests |
| 🔒 **Secure Storage** | Private keys are encrypted at rest |

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Email    │────▶│  Resend Webhook  │────▶│   AI Agent      │
│   (Gmail, etc)  │     │  (Inbound)       │     │   (Claude)      │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Email    │◀────│  Resend API      │◀────│  Wallet/Chain   │
│   (Response)    │     │  (Outbound)      │     │  (viem)         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Components

1. **MCP Server** (`mcp-server.js`) - Model Context Protocol server exposing crypto tools
2. **AI Agent** (`agent.js`) - Natural language processing with Claude
3. **Wallet Manager** (`wallet.js`) - Ethereum wallet operations using viem
4. **Email Handler** (`email.js`) - Resend API integration for sending emails
5. **Webhook Server** (`webhook-server.js`) - Receives inbound emails

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- [Resend](https://resend.com) account (for email)
- [OpenAI](https://platform.openai.com) API key (for AI)
- Ethereum RPC endpoint (Infura, Alchemy, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/email-to-crypto-agent.git
cd email-to-crypto-agent

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
```

### Configuration

Edit `.env` with your credentials:

```env
# Resend API for email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=agent@yourdomain.com

# OpenAI API for AI
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# Blockchain RPC (Sepolia testnet by default)
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CHAIN_ID=11155111

# Encryption key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

### Running the Agent

```bash
# Interactive CLI (for testing)
npm start -- --cli

# Production webhook server
npm start -- --server

# Or use shortcuts
npm run webhook    # Start webhook server
npm run mcp        # Start MCP server
```

## 📧 Usage Examples

### Creating a Wallet

Send an email:
```
To: agent@yourdomain.com
Subject: Getting started

Hi! I want to create a crypto wallet.
```

Response:
```
🎉 Your new wallet has been created!

Your Wallet Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f...

You can now receive and send crypto via email!
```

### Checking Balance

```
To: agent@yourdomain.com
Subject: Balance

What's my balance?
```

### Sending Crypto

```
To: agent@yourdomain.com
Subject: Send money

Send 0.1 ETH to alice@example.com
```

### Getting Help

```
To: agent@yourdomain.com
Subject: Help

What can you do?
```

## 🔧 MCP Integration

The agent exposes an MCP server that can be used with Claude Desktop or other MCP clients.

### Available Tools

| Tool | Description |
|------|-------------|
| `create_wallet` | Create a new wallet for a user |
| `get_balance` | Check ETH balance |
| `send_crypto` | Send ETH to email or address |
| `get_transaction_history` | Get recent transactions |
| `get_wallet_address` | Get user's wallet address |
| `get_help` | Show help information |

### Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "email-to-crypto": {
      "command": "node",
      "args": ["/path/to/email-to-crypto-agent/src/mcp-server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your-key",
        "RESEND_API_KEY": "your-key",
        "RPC_URL": "your-rpc-url",
        "ENCRYPTION_KEY": "your-encryption-key"
      }
    }
  }
}
```

## 🔐 Security

- **Encrypted Keys**: Private keys are encrypted with AES-256-GCM before storage
- **No Seed Phrase Exposure**: Users never see or manage seed phrases
- **Email Verification**: Actions are tied to verified email addresses
- **Rate Limiting**: Built-in protection against abuse (configure in production)

### Security Considerations

⚠️ **For Production Use:**
- Use a dedicated domain for email
- Implement additional email verification
- Add transaction limits
- Consider multi-sig for large transactions
- Regular security audits

## 📁 Project Structure

```
email-to-crypto-agent/
├── src/
│   ├── index.js          # Main entry point
│   ├── mcp-server.js     # MCP server implementation
│   ├── agent.js          # AI agent with Claude
│   ├── wallet.js         # Wallet operations
│   ├── email.js          # Resend email functions
│   ├── webhook-server.js # Express webhook server
│   ├── database.js       # SQLite database layer
│   └── test.js           # Test script
├── .env.example          # Environment template
├── package.json
└── README.md
```

## 🛠️ Development

```bash
# Run tests
npm test

# Development with auto-reload
npm run dev -- --cli

# Check wallet info
curl http://localhost:3001/api/wallet/test@example.com

# Test email processing
curl -X POST http://localhost:3001/api/process-email \
  -H "Content-Type: application/json" \
  -d '{"from": "test@example.com", "subject": "Test", "body": "create wallet"}'
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [NullShot](https://nullshot.ai) - Hackathon organizers
- [OpenAI](https://openai.com) - GPT-4 AI
- [Resend](https://resend.com) - Email API
- [viem](https://viem.sh) - Ethereum library

---

<p align="center">
  <strong>Built with ❤️ for NullShot Hackathon Season 0</strong>
</p>
