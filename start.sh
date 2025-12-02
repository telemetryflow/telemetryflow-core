#!/bin/bash

echo "🚀 TelemetryFlow Core - Quick Start"
echo "===================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to setup PostgreSQL manually."
else
    echo "✅ Docker is installed"
    echo ""
    echo "📦 Starting PostgreSQL with Docker Compose..."
    docker-compose up -d
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
fi

echo ""
echo "📥 Installing dependencies..."
pnpm install

echo ""
echo "🗄️  Seeding database..."
pnpm run db:seed:iam

echo ""
echo "✨ Setup complete!"
echo ""
echo "🎯 To start the development server, run:"
echo "   pnpm run dev"
echo ""
echo "📚 API Documentation will be available at:"
echo "   http://localhost:3000/api"
echo ""
