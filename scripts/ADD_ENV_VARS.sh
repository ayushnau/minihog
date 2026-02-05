#!/bin/bash

# Script to add environment variables to Vercel projects
# Run this from the project root

echo "🚀 Adding Environment Variables to Vercel"
echo ""

# API Project Environment Variables
echo "📦 API Project Environment Variables:"
echo "-----------------------------------"
cd packages/api

echo "1. Adding CORS_ORIGIN..."
vercel env add CORS_ORIGIN production preview development
# When prompted, enter: https://your-dashboard.vercel.app

echo ""
echo "2. Adding DATABASE_URL (if not already set)..."
vercel env add DATABASE_URL production preview development
# When prompted, paste your Supabase connection string

echo ""
echo "3. Adding JWT_SECRET (if not already set)..."
vercel env add JWT_SECRET production preview development
# When prompted, enter a random secret (or use: openssl rand -base64 32)

echo ""
echo "✅ API environment variables added!"
echo ""

# Dashboard Project Environment Variables
echo "📊 Dashboard Project Environment Variables:"
echo "-----------------------------------"
cd ../dashboard

echo "1. Adding NEXT_PUBLIC_API_URL..."
vercel env add NEXT_PUBLIC_API_URL production preview development
# When prompted, enter: https://your-api.vercel.app

echo ""
echo "2. Adding DATABASE_URL (if not already set)..."
vercel env add DATABASE_URL production preview development
# When prompted, paste your Supabase connection string (same as API)

echo ""
echo "3. Adding JWT_SECRET (if not already set)..."
vercel env add JWT_SECRET production preview development
# When prompted, enter the SAME secret as API

echo ""
echo "✅ Dashboard environment variables added!"
echo ""
echo "🎉 Done! Now redeploy:"
echo "   cd packages/api && vercel --prod"
echo "   cd packages/dashboard && vercel --prod"

