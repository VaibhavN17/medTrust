#!/bin/bash

# MedTrust Vercel Deployment Script
# This script helps prepare your project for Vercel deployment

set -e

echo "🚀 MedTrust Vercel Deployment Preparation"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed"
    exit 1
fi

echo "✅ Git and Node.js found"
echo ""

# Install Vercel CLI
echo "📦 Installing Vercel CLI..."
npm install -g vercel

echo ""
echo "📝 Next steps:"
echo ""
echo "1. CREATE DATABASE (Choose one):"
echo "   - Neon (PostgreSQL): https://neon.tech"
echo "   - PlanetScale (MySQL): https://planetscale.com"
echo ""
echo "2. PUSH TO GITHUB:"
echo "   git add ."
echo "   git commit -m 'Prepare for Vercel deployment'"
echo "   git push origin main"
echo ""
echo "3. DEPLOY FRONTEND:"
echo "   cd frontend"
echo "   vercel"
echo ""
echo "4. DEPLOY BACKEND:"
echo "   vercel"
echo ""
echo "5. SET ENVIRONMENT VARIABLES in Vercel Dashboard:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - CLIENT_URL (your frontend URL)"
echo "   - AWS credentials (for S3)"
echo "   - Email/Payment credentials"
echo ""
echo "📖 Full guide: See VERCEL_DEPLOYMENT.md"

