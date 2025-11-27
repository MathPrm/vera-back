// scripts/test-db.ts
import dotenv from 'dotenv';
import db from '../app/models';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔍 Test de connexion à MySQL...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    
    await db.sequelize.authenticate();
    console.log('✅ Connexion réussie !');
    
    // Créer les tables
    await db.sequelize.sync({ force: true });
    console.log('✅ Tables créées avec succès');
    
    // Créer un utilisateur de test
    const testUser = await db.User.create({
      email: 'admin@vera.com',
      password: 'password123',
      username: 'TestUser'
    });
    
    console.log('✅ Utilisateur de test créé:');
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Username: ${testUser.username}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    process.exit(1);
  }
};

testConnection();