import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import db from '../models';
import { UserCreationAttributes } from '../models/user.model';

const User = db.User;
const JWT_SECRET: string = process.env.JWT_SECRET || 'votre_secret_jwt_très_sécurisé';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

// Interface pour le JWT payload
interface JwtPayload {
  id: number;
  email: string;
  is_admin: boolean;
}

export class AuthController {
  // Inscription
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, username }: UserCreationAttributes = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe sont requis'
        });
      }

      // Validation du mot de passe
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      // Créer l'utilisateur
      const newUser = await User.create({
        email,
        password,
        username: username || email.split('@')[0]
      });

      // Réponse sans le mot de passe
      const userResponse = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      };

      return res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        user: userResponse
      });

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Connexion
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe sont requis'
        });
      }

      // Trouver l'utilisateur
      const user = await User.findOne({ 
        where: { email }
      });
      if (!user) {
        console.log(`[AUTH] ❌ Tentative de connexion échouée - Utilisateur non trouvé: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        console.log(`[AUTH] ❌ Tentative de connexion échouée - Mot de passe incorrect: ${email}`);
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Logique simplifiée : l'utilisateur avec l'ID 2 est admin
      const isAdmin = user.id === 2;
      
      // Logs côté backend pour vérification
      if (isAdmin) {
        console.log(`[AUTH] ✅ Connexion ADMIN réussie - Email: ${email}, ID: ${user.id} (Admin)`);
      } else {
        console.log(`[AUTH] ✅ Connexion UTILISATEUR réussie - Email: ${email}, ID: ${user.id} (Utilisateur)`);
      }

      // Créer le token JWT avec is_admin
      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        is_admin: isAdmin
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      } as SignOptions);

      // Définir le cookie HttpOnly
      const cookieOptions = {
        httpOnly: true,        // Empêche l'accès JavaScript
        secure: process.env.NODE_ENV === 'production', // HTTPS en production
        sameSite: 'strict' as const, // Protection CSRF
        maxAge: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
        path: '/'              // Disponible sur tout le site
      };

      // Définir le cookie
      res.cookie('authToken', token, cookieOptions);

      // Réponse SANS le token dans le body (sécurité)
      return res.json({
        success: true,
        message: isAdmin ? 'Connexion administrateur réussie' : 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          is_admin: isAdmin
        }
      });

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Récupérer le profil
  static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      // L'ID de l'utilisateur est ajouté par le middleware d'authentification
      const userId = (req as any).userId;

      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Logique simplifiée : l'utilisateur avec l'ID 2 est admin
      const isAdmin = user.id === 2;

      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          is_admin: isAdmin
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // Déconnexion
  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      // Supprimer le cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      return res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion'
      });
    }
  }
}

