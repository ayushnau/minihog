#!/bin/bash

# Update CORS_ORIGIN in Vercel
# This script removes and re-adds CORS_ORIGIN with the new value

echo "Updating CORS_ORIGIN in Vercel..."

# Remove existing (will prompt for confirmation)
echo "Removing old CORS_ORIGIN..."
vercel env rm CORS_ORIGIN production preview development <<< "y"

# Add new value
echo ""
echo "Adding new CORS_ORIGIN..."
echo "Enter: https://minihog.ayushnautiyal.com,https://your-dashboard.vercel.app"
vercel env add CORS_ORIGIN production <<< "https://minihog.ayushnautiyal.com,https://your-dashboard.vercel.app"
vercel env add CORS_ORIGIN preview <<< "https://minihog.ayushnautiyal.com,https://your-dashboard.vercel.app"
vercel env add CORS_ORIGIN development <<< "http://localhost:3001"

echo ""
echo "✅ CORS_ORIGIN updated!"
echo "Now run: vercel --prod"

