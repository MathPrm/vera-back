// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_très_sécurisé';

// Interface pour étendre Request
interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  isAdmin?: boolean;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.id;
    (req as any).userEmail = decoded.email;
    (req as any).isAdmin = Boolean(decoded.is_admin);
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

// Middleware pour vérifier si l'utilisateur est admin
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  // D'abord vérifier le token
  verifyToken(req, res, () => {
    // Ensuite vérifier si l'utilisateur est admin
    const isAdmin = (req as any).isAdmin;
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas administrateur.'
      });
    }
    
    // L'utilisateur est admin, on continue
    next();
  });
};