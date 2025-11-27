// routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyToken, verifyAdmin } from '../../middleware/auth.middleware';

const router = Router();

// Routes publiques
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Routes protégées
router.get('/profile', verifyToken, AuthController.getProfile);
router.put('/profile', verifyToken, AuthController.updateProfile);

// Route admin (exemple - peut être utilisée pour vérifier l'accès admin)
router.get('/admin-check', verifyAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Accès admin autorisé'
  });
});

export default router;