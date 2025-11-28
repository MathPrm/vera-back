import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyToken } from '../../middleware/auth.middleware';

const router = Router();

// Routes publiques
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Routes protégées
router.get('/profile', verifyToken, AuthController.getProfile);

export default router;

