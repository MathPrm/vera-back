#!/bin/bash

# Script de test du système RAG Memory

echo "🧪 Test du RAG Memory System"
echo "============================"
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Health check
echo "1️⃣  Test health check..."
curl -s "$BASE_URL/api/health" | jq '.'
echo ""

# Test 2: Première conversation (création mémoire)
echo "2️⃣  Test première conversation..."
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cette vidéo TikTok de deepfake est-elle dangereuse?",
    "conversationHistory": []
  }' | jq '.response' | head -n 5
echo ""

# Attendre que l'embedding soit généré et stocké
echo "⏳ Attente stockage (3s)..."
sleep 3

# Test 3: Deuxième conversation similaire (doit trouver la première)
echo "3️⃣  Test recherche mémoire (conversation similaire)..."
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Comment détecter un deepfake sur TikTok?",
    "conversationHistory": []
  }' | jq '.response' | head -n 5
echo ""

# Test 4: Recherche sémantique directe
echo "4️⃣  Test recherche sémantique..."
curl -s -X POST "$BASE_URL/api/memory/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "deepfake detection",
    "limit": 3,
    "threshold": 0.5
  }' | jq '.'
echo ""

# Test 5: Historique (devrait avoir 2 conversations)
echo "5️⃣  Test récupération historique..."
curl -s "$BASE_URL/api/memory/history/web-user-123?limit=10" | jq '.count'
echo ""

echo "✅ Tests terminés !"
echo ""
echo "💡 Pour voir les logs RAG, regarde la console du serveur (npm run api)"
echo "   Tu devrais voir: '🧠 RAG: X conversations similaires trouvées'"
