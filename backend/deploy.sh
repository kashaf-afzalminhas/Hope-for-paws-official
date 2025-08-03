#!/bin/bash

echo "🚀 Deploying Hope for Paws Backend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm install -g vercel"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "app.js" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Deploy to Vercel
echo "📦 Deploying..."
vercel --prod

echo "✅ Deployment completed!"
echo "🔗 Your backend should be available at: https://hope-for-paws-official-backend.vercel.app"
echo ""
echo "🧪 To test the deployment, run:"
echo "node test-deployment.js" 