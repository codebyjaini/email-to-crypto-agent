import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email response to a user
 */
export async function sendEmail(to, subject, text, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Jaini <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      text: text,
      html: html
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log(`📤 Email sent to ${to}: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(to, walletAddress) {
  const subject = '🎉 Welcome to Email-to-Crypto!';
  
  const text = `
Welcome to Email-to-Crypto!

Your new wallet has been created successfully.

Your Wallet Address: ${walletAddress}

You can now:
• Check your balance by replying "balance"
• Send crypto by replying "send 0.1 ETH to friend@example.com"
• Get your address by replying "my address"
• View history by replying "history"

Just reply to this email naturally - I understand plain English!

Happy crypto-ing! 🚀
`;

  const html = `
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
    .header {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
      margin-bottom: 20px;
    }
    .wallet-box {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      font-family: monospace;
      word-break: break-all;
      margin: 20px 0;
    }
    .commands {
      background: #fff;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
    }
    .command {
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .command:last-child {
      border-bottom: none;
    }
    .command code {
      background: #e9ecef;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Welcome to Email-to-Crypto!</h1>
    <p>Your gateway to crypto, via email</p>
  </div>
  
  <p>Your new wallet has been created successfully!</p>
  
  <div class="wallet-box">
    <strong>Your Wallet Address:</strong><br>
    ${walletAddress}
  </div>
  
  <div class="commands">
    <h3>📚 Quick Commands</h3>
    <div class="command">
      <code>balance</code> - Check your ETH balance
    </div>
    <div class="command">
      <code>send 0.1 ETH to friend@example.com</code> - Send crypto to someone
    </div>
    <div class="command">
      <code>my address</code> - Get your wallet address
    </div>
    <div class="command">
      <code>history</code> - View your transactions
    </div>
    <div class="command">
      <code>help</code> - See all available commands
    </div>
  </div>
  
  <p style="margin-top: 20px;">Just reply to this email naturally - I understand plain English! 🤖</p>
  
  <div class="footer">
    <p>📧 Email-to-Crypto Agent</p>
    <p>Built for NullShot Hackathon 2024</p>
  </div>
</body>
</html>
`;

  return sendEmail(to, subject, text, html);
}

/**
 * Send a transaction notification email
 */
export async function sendTransactionEmail(to, type, amount, counterparty, txHash, explorerUrl) {
  const isReceive = type === 'receive';
  const subject = isReceive 
    ? `💰 You received ${amount} ETH!`
    : `✅ You sent ${amount} ETH`;
  
  const text = isReceive
    ? `You received ${amount} ETH from ${counterparty}.\n\nTransaction: ${explorerUrl}`
    : `You sent ${amount} ETH to ${counterparty}.\n\nTransaction: ${explorerUrl}`;

  const html = `
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
    .tx-box {
      background: ${isReceive ? '#d4edda' : '#cce5ff'};
      border: 1px solid ${isReceive ? '#c3e6cb' : '#b8daff'};
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: ${isReceive ? '#155724' : '#004085'};
    }
    .details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .btn {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="tx-box">
    <div style="font-size: 48px;">${isReceive ? '💰' : '✅'}</div>
    <div class="amount">${isReceive ? '+' : '-'}${amount} ETH</div>
    <div>${isReceive ? 'Received' : 'Sent'}</div>
  </div>
  
  <div class="details">
    <div class="detail-row">
      <span><strong>${isReceive ? 'From' : 'To'}:</strong></span>
      <span>${counterparty}</span>
    </div>
    <div class="detail-row">
      <span><strong>Amount:</strong></span>
      <span>${amount} ETH</span>
    </div>
    <div class="detail-row">
      <span><strong>Status:</strong></span>
      <span>✅ Confirmed</span>
    </div>
  </div>
  
  <div style="text-align: center;">
    <a href="${explorerUrl}" class="btn">View on Explorer →</a>
  </div>
  
  <p style="margin-top: 30px; color: #666; font-size: 14px; text-align: center;">
    Reply "balance" to check your current balance.
  </p>
</body>
</html>
`;

  return sendEmail(to, subject, text, html);
}
