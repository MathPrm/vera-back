// app.ts
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './app/models';
import authRoutes from './app/routes/auth.routes';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Route de base
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API Vera Backend - MySQL & Sequelize',
    status: 'En ligne',
    version: '1.0.0'
  });
});

// Route de test de connexion DB
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await db.sequelize.authenticate();
    res.json({
      success: true,
      status: 'Healthy',
      database: 'Connected to MySQL'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'Unhealthy',
      database: 'Disconnected',
      error: process.env.NODE_ENV === 'development' ? error : 'Database connection failed'
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Fonction de démarrage
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    await db.sequelize.authenticate();
    console.log('✅ Connexion à MySQL établie avec succès');

    // Synchroniser les modèles
    await db.sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés avec la base de données');

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📊 Base de données: MySQL @ ${process.env.DB_HOST}/${process.env.DB_NAME}`);
    });

  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

export default app;