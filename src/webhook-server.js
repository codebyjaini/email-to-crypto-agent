import express from 'express';
import crypto from 'crypto';
import { processEmail, formatEmailResponse } from './agent.js';
import { sendEmail } from './email.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Parse raw body for webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

/**
 * Verify Resend webhook signature
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) return true; // Skip verification if no secret configured
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expectedSignature)
  );
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-to-crypto-agent' });
});

/**
 * Webhook endpoint for incoming emails
 * 
 * Note: Resend's inbound email feature sends webhooks when emails are received.
 * You'll need to configure this in your Resend dashboard.
 */
app.post('/webhook/email', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['resend-signature'];
    if (process.env.RESEND_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(
        req.rawBody,
        signature,
        process.env.RESEND_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { type, data } = req.body;
    
    console.log(`📨 Received webhook: ${type}`);
    console.log('Data:', JSON.stringify(data, null, 2));

    // Handle inbound email
    if (type === 'email.received' || type === 'email.delivered') {
      const { from, to, subject, text, html } = data;
      
      // Extract sender email
      const senderEmail = typeof from === 'string' ? from : from?.email || from?.[0]?.email;
      
      if (!senderEmail) {
        console.error('No sender email found');
        return res.status(400).json({ error: 'No sender email' });
      }

      // Process the email with our AI agent
      const response = await processEmail(
        senderEmail,
        subject || '(no subject)',
        text || html || ''
      );

      // Format and send response
      const htmlResponse = formatEmailResponse(response);
      
      await sendEmail(
        senderEmail,
        `Re: ${subject || 'Your Crypto Request'}`,
        response,
        htmlResponse
      );

      console.log(`✅ Responded to ${senderEmail}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manual email processing endpoint (for testing)
 */
app.post('/api/process-email', async (req, res) => {
  try {
    const { from, subject, body } = req.body;
    
    if (!from || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: from, body' 
      });
    }

    // Process the email
    const response = await processEmail(from, subject || '', body);
    const htmlResponse = formatEmailResponse(response);

    // Optionally send the response
    if (req.query.send === 'true') {
      await sendEmail(
        from,
        `Re: ${subject || 'Your Crypto Request'}`,
        response,
        htmlResponse
      );
    }

    res.json({
      success: true,
      response,
      html: htmlResponse
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get wallet info endpoint (for testing)
 */
app.get('/api/wallet/:email', async (req, res) => {
  try {
    const { getWalletByEmail } = await import('./database.js');
    const wallet = getWalletByEmail(req.params.email);
    
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      address: wallet.address,
      chainId: wallet.chain_id,
      createdAt: wallet.created_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server - Cloud Run uses PORT env variable
const PORT = process.env.PORT || process.env.WEBHOOK_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Email-to-Crypto Webhook Server running!

📬 Webhook URL: http://localhost:${PORT}/webhook/email
🔧 Test API: http://localhost:${PORT}/api/process-email
❤️  Health: http://localhost:${PORT}/health

Configure this webhook URL in your Resend dashboard for inbound emails.
  `);
});

export default app;
