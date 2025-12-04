import { Request, Response, NextFunction } from 'express';

// Interface pour étendre Request (doit correspondre à celle de verifyToken)
interface AuthRequest extends Request {
  userId?: number;
  userEmail?: string;
  is_admin?: boolean; // C'est cette propriété qui est attachée par verifyToken
}

/**
 * Middleware vérifiant si l'utilisateur est un administrateur.
 * Doit être appelé APRÈS verifyToken.
 */
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    // 1. Vérifier si l'information est présente (cela signifie que verifyToken est passé)
    if (req.is_admin === undefined) {
        // Cas d'erreur ou middleware verifyToken non appelé
        return res.status(500).json({ 
            success: false, 
            message: "Erreur interne: Le statut d'administration n'a pas été vérifié." 
        });
    }

    // 2. Vérifier le rôle
    if (req.is_admin === true) {
        // L'utilisateur est admin, on passe au contrôleur
        next();
    } else {
        // 403 Forbidden : Authentifié, mais ne possède pas le rôle requis
        return res.status(403).json({
            success: false,
            message: "Accès refusé. Autorisation d'administrateur requise."
        });
    }
};