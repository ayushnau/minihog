#!/bin/bash

# Setup script for MiniHog SDK Test App

echo "🚀 Setting up MiniHog SDK Test App..."

# Build the SDK first
echo "📦 Building SDK..."
cd ../../packages/sdk
npm run build

if [ $? -ne 0 ]; then
  echo "❌ SDK build failed!"
  exit 1
fi

# Go back to test app
cd ../../examples/sdk-test-app

# Install dependencies
echo "📥 Installing test app dependencies..."
npm install

if [ $? -ne 0 ]; then
  echo "❌ npm install failed!"
  exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "To start development:"
echo "  1. Terminal 1: cd packages/sdk && npm run dev (for auto-rebuild)"
echo "  2. Terminal 2: cd examples/sdk-test-app && npm run dev"
echo ""
echo "Or just run: npm run dev (in this directory)"

