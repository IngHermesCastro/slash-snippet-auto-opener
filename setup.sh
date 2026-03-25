#!/bin/bash
# Quick start setup for Windows / Linux / macOS

echo "🚀 Slash Snippet Extension - Setup Script"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"

# Build the extension
echo ""
echo "🔨 Building extension..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✓ Build successful!"

# Success
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open: chrome://extensions/"
echo "2. Enable: Developer mode (toggle in top right)"
echo "3. Click: Load unpacked"
echo "4. Select: This project folder"
echo ""
echo "For development:"
echo "  npm run dev       # Watch and rebuild on changes"
echo "  npm run build     # One-time build"
echo "  npm run type-check # Check TypeScript types"
echo ""
echo "Happy coding! 🎉"
