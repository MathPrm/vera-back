# 📚 API Historique des Conversations

## Vue d'ensemble

L'API d'historique permet aux utilisateurs connectés de :
- ✅ Sauvegarder leurs conversations avec Vera en base de données
- ✅ Récupérer l'historique complet de leurs conversations
- ✅ Supprimer des conversations individuelles
- ✅ Effacer tout leur historique
- ✅ Permettre à Vera de personnaliser ses réponses avec le nom de l'utilisateur

---

## 🔐 Authentification Requise

Toutes les routes nécessitent un token JWT dans le header :
```
Authorization: Bearer <votre_token_jwt>
```

---

## 📡 Endpoints

### 1. Récupérer l'historique
```http
GET /api/history
```

**Query Parameters:**
- `limit` (optionnel): Nombre de conversations à récupérer (défaut: 20)

**Réponse:**
```json
{
  "success": true,
  "conversations": [
    {
      "id": 1,
      "userId": 5,
      "title": "Comment détecter les deepfakes ?",
      "isDeleted": false,
      "createdAt": "2025-12-03T10:30:00.000Z",
      "updatedAt": "2025-12-03T10:35:00.000Z",
      "messages": [
        {
          "id": 1,
          "conversationId": 1,
          "sender": "user",
          "content": "Comment détecter les deepfakes ?",
          "mediaUrls": [],
          "createdAt": "2025-12-03T10:30:00.000Z"
        },
        {
          "id": 2,
          "conversationId": 1,
          "sender": "vera",
          "content": "Bonjour John ! Pour détecter les deepfakes...",
          "mediaUrls": [],
          "createdAt": "2025-12-03T10:30:15.000Z"
        }
      ]
    }
  ]
}
```

---

### 2. Récupérer une conversation spécifique
```http
GET /api/history/conversations/:conversationId
```

**Réponse:**
```json
{
  "success": true,
  "conversation": {
    "id": 1,
    "userId": 5,
    "title": "Comment détecter les deepfakes ?",
    "messages": [ /* tous les messages */ ]
  }
}
```

---

### 3. Créer une nouvelle conversation
```http
POST /api/history/conversations
```

**Body:**
```json
{
  "title": "Ma nouvelle conversation",
  "firstMessage": "Salut Vera !"
}
```

**Réponse:**
```json
{
  "success": true,
  "conversation": {
    "id": 5,
    "userId": 3,
    "title": "Ma nouvelle conversation",
    "isDeleted": false
  }
}
```

---

### 4. Sauvegarder une conversation complète
*(Utile pour migrer depuis localStorage)*

```http
POST /api/history/conversations/save
```

**Body:**
```json
{
  "title": "Analyse vidéo YouTube",
  "messages": [
    {
      "sender": "user",
      "content": "https://www.youtube.com/watch?v=xyz",
      "mediaUrls": ["https://www.youtube.com/watch?v=xyz"]
    },
    {
      "sender": "vera",
      "content": "J'ai analysé cette vidéo...",
      "mediaUrls": []
    }
  ]
}
```

---

### 5. Ajouter un message à une conversation
```http
POST /api/history/conversations/:conversationId/messages
```

**Body:**
```json
{
  "sender": "user",
  "content": "Et pour les vidéos Instagram ?",
  "mediaUrls": []
}
```

---

### 6. Supprimer une conversation
```http
DELETE /api/history/conversations/:conversationId
```

**Réponse:**
```json
{
  "success": true,
  "message": "Conversation supprimée"
}
```

---

### 7. Effacer tout l'historique
```http
DELETE /api/history/clear
```

**Réponse:**
```json
{
  "success": true,
  "message": "Historique effacé"
}
```

---

## 🎯 Intégration Frontend

### Migration depuis localStorage

```typescript
// Récupérer l'historique du localStorage
const localHistory = JSON.parse(localStorage.getItem('conversationHistory') || '[]');

// Pour chaque conversation locale, l'envoyer au backend
for (const conv of localHistory) {
  await fetch('http://localhost:3000/api/history/conversations/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: conv.query,
      messages: conv.messages
    })
  });
}

// Vider le localStorage
localStorage.removeItem('conversationHistory');
```

### Personnalisation avec le nom utilisateur

```typescript
// Récupérer le profil utilisateur
const response = await fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { user } = await response.json();

// Utiliser user.username dans l'interface
console.log(`Bienvenue ${user.username} !`);

// Vera pourra dire : "Bonjour {user.username}, comment puis-je vous aider ?"
```

---

## 🛠️ Configuration Base de Données

Exécuter le script SQL :
```bash
psql -U votre_user -d votre_db -f database/user-conversations-schema.sql
```

Ou laisser Sequelize créer les tables automatiquement avec `sync({ alter: true })`.

---

## ✨ Fonctionnalités Clés

### Soft Delete
Les conversations ne sont jamais vraiment supprimées, juste marquées comme `isDeleted: true`. Permet une récupération si nécessaire.

### Mise à jour automatique
Quand un message est ajouté, le champ `updated_at` de la conversation est automatiquement mis à jour (trigger PostgreSQL).

### Titre automatique
Si aucun titre n'est fourni, le premier message utilisateur devient le titre (limité à 100 caractères).

---

## 🔒 Sécurité

- ✅ Toutes les routes nécessitent un JWT valide
- ✅ Un utilisateur ne peut accéder qu'à ses propres conversations
- ✅ Validation du `userId` à chaque requête
- ✅ Pas de suppression définitive (soft delete uniquement)
