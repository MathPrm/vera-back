import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_très_sécurisé';

// Interface pour étendre Request
interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  is_admin?: boolean;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
  // Essayer de récupérer le token depuis le header Authorization (pour compatibilité)
  let token = req.headers['authorization']?.split(' ')[1];
  
  // Si pas de token dans le header, essayer depuis le cookie
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

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
    (req as any).is_admin = decoded.is_admin || false;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

