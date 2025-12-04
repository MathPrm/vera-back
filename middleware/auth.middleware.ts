import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import db from '../app/models';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_très_sécurisé';
const Session = db.Session;

// Interface pour étendre Request
interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  is_admin?: boolean;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  // Debug: Log des cookies reçus
  console.log('[AUTH] Cookies reçus:', req.cookies);
  console.log('[AUTH] Headers authorization:', req.headers['authorization']);
  
  // Essayer de récupérer le token depuis le header Authorization (pour compatibilité)
  let token = req.headers['authorization']?.split(' ')[1];
  
  // Si pas de token dans le header, essayer depuis le cookie
  if (!token && req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
    console.log('[AUTH] Token trouvé dans le cookie');
  } else if (!token) {
    console.log('[AUTH] Aucun token trouvé ni dans header ni dans cookie');
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Vérifier que la session existe et est active
    const session = await Session.findOne({
      where: {
        token,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!session) {
      return res.status(403).json({
        success: false,
        message: 'Session expirée ou invalide'
      });
    }

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

