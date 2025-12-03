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
    (req as any).is_admin = decoded.is_admin || false;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

