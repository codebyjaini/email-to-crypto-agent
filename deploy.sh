#!/bin/bash

# Email-to-Crypto Agent - Google Cloud Run Deployment Script
# Make sure you have gcloud CLI installed and authenticated

# Configuration - UPDATE THESE
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
SERVICE_NAME="email-to-crypto-agent"

echo "🚀 Deploying Email-to-Crypto Agent to Google Cloud Run"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Build and deploy
echo "🏗️  Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "RESEND_API_KEY=$RESEND_API_KEY" \
    --set-env-vars "OPENAI_API_KEY=$OPENAI_API_KEY" \
    --set-env-vars "RPC_URL=$RPC_URL" \
    --set-env-vars "CHAIN_ID=$CHAIN_ID" \
    --set-env-vars "ENCRYPTION_KEY=$ENCRYPTION_KEY" \
    --set-env-vars "FROM_EMAIL=$FROM_EMAIL" \
    --memory 512Mi \
    --timeout 60

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your webhook URL will be shown above (something like https://email-to-crypto-agent-xxxxx-uc.a.run.app)"
echo ""
echo "Next steps:"
echo "1. Copy the Cloud Run URL"
echo "2. Go to Resend Dashboard > Webhooks"
echo "3. Add webhook: YOUR_CLOUD_RUN_URL/webhook/email"
echo "4. Test by sending an email!"
