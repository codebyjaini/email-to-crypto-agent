import OpenAI from 'openai';
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompt for the AI agent
const SYSTEM_PROMPT = `You are a helpful crypto assistant that helps users manage their cryptocurrency via email.
You can help users:
1. Create a new wallet
2. Check their balance
3. Send crypto to others (by email or wallet address)
4. View transaction history
5. Get their wallet address

When a user sends you an email, analyze their intent and use the appropriate tool.
Always be friendly and explain things simply - remember, these are Web2 users who may be new to crypto!

Important rules:
- The user's email address is provided in the context. Use it for wallet operations.
- When sending crypto, parse the amount and recipient from the user's message.
- Amounts should be in ETH (e.g., "0.1", "1.5")
- Be helpful if users make mistakes - suggest corrections.
- Always confirm what action you're about to take.

Available tools:
- create_wallet: Create a new wallet for the user
- get_balance: Check user's ETH balance
- send_crypto: Send ETH to an email or address
- get_transaction_history: Get recent transactions
- get_wallet_address: Get user's wallet address
- get_help: Show help information`;

// Tool definitions for OpenAI
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_wallet',
      description: 'Create a new crypto wallet for the user',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'The email address of the user'
          }
        },
        required: ['email']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_balance',
      description: 'Get the current ETH balance for the user',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'The email address of the user'
          }
        },
        required: ['email']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_crypto',
      description: 'Send ETH from the user to a recipient (email or wallet address)',
      parameters: {
        type: 'object',
        properties: {
          from_email: {
            type: 'string',
            description: 'The sender\'s email address'
          },
          to: {
            type: 'string',
            description: 'The recipient - email address or wallet address (0x...)'
          },
          amount: {
            type: 'string',
            description: 'The amount of ETH to send'
          }
        },
        required: ['from_email', 'to', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_transaction_history',
      description: 'Get recent transaction history for the user',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'The email address of the user'
          }
        },
        required: ['email']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_wallet_address',
      description: 'Get the user\'s wallet address so they can receive crypto',
      parameters: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            description: 'The email address of the user'
          }
        },
        required: ['email']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_help',
      description: 'Show help information about available commands',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  }
];

// Execute tool based on name
async function executeTool(name, args) {
  const input = typeof args === 'string' ? JSON.parse(args) : args;
  
  switch (name) {
    case 'create_wallet':
      return await createWallet(input.email);
    case 'get_balance':
      return await getBalance(input.email);
    case 'send_crypto':
      return await sendCrypto(input.from_email, input.to, input.amount);
    case 'get_transaction_history':
      return await getTransactionHistory(input.email);
    case 'get_wallet_address':
      return getWalletAddress(input.email);
    case 'get_help':
      return getHelp();
    default:
      return { success: false, message: `Unknown tool: ${name}` };
  }
}

/**
 * Process an incoming email and generate a response
 */
export async function processEmail(fromEmail, subject, body) {
  console.log(`\n📧 Processing email from: ${fromEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}\n`);

  const userMessage = `
User email: ${fromEmail}
Email subject: ${subject}
Email body: ${body}

Please help this user with their crypto request.
`;

  try {
    let messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage }
    ];
    
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      tools: TOOLS,
      messages
    });

    let assistantMessage = response.choices[0].message;

    // Process tool calls in a loop
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Add assistant message to history
      messages.push(assistantMessage);

      // Process each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        console.log(`🔧 Executing tool: ${toolCall.function.name}`);
        console.log(`   Input: ${toolCall.function.arguments}`);
        
        const result = await executeTool(toolCall.function.name, toolCall.function.arguments);
        console.log(`   Result: ${JSON.stringify(result)}`);
        
        // Add tool result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // Get next response
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        tools: TOOLS,
        messages
      });

      assistantMessage = response.choices[0].message;
    }

    // Extract final text response
    const finalResponse = assistantMessage.content || 'I processed your request but have no additional message.';

    console.log(`\n📤 Response: ${finalResponse}\n`);
    return finalResponse;

  } catch (error) {
    console.error('Error processing email:', error);
    return `Sorry, I encountered an error processing your request. Please try again later.\n\nError: ${error.message}`;
  }
}

/**
 * Format response for email (convert markdown to HTML)
 */
export function formatEmailResponse(text) {
  // Simple markdown to HTML conversion
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/•/g, '&#8226;');

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div>${html}</div>
  <div class="footer">
    <p>📧 Email-to-Crypto Agent | Powered by AI</p>
    <p>Reply to this email to continue the conversation.</p>
  </div>
</body>
</html>
`;
}
