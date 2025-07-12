#!/bin/bash

echo "🚀 Starting AI Dashboard setup..."

# Check if services are running
echo "📋 Checking service status..."
docker-compose ps

# Pull Llama3 model
echo "📥 Pulling Llama3 model (this might take a while)..."
docker-compose exec ollama ollama pull llama3

# Test Qdrant connection
echo "🔍 Testing Qdrant connection..."
docker-compose exec backend python test_qdrant.py

echo "✅ Setup complete! You can now use the AI dashboard."
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost:3050"
echo "   Backend API: http://localhost:8050"
echo "   Qdrant Dashboard: http://localhost:6333/dashboard"
echo ""
echo "💬 Try these AI commands in the chat:"
echo "   - 'show me users'"
echo "   - 'create user with name John and phone 123456'"
echo "   - 'go to roles page'"
