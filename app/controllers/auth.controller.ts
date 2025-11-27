// controllers/auth.controller.ts
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
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier le mot de passe
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Créer le token JWT
      const payload: JwtPayload = {
        id: user.id,
        email: user.email
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      } as SignOptions);

      // Réponse
      return res.json({
        success: true,
        message: 'Connexion réussie',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
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

      return res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }

  // Mettre à jour le profil
  static async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;
      const { email, username } = req.body;

      // Vérifier si le nouvel email est déjà utilisé
      if (email) {
        const existingUser = await User.findOne({ 
          where: { email },
          attributes: ['id']
        });
        
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({
            success: false,
            message: 'Cet email est déjà utilisé'
          });
        }
      }

      // Mettre à jour l'utilisateur
      await User.update(
        { email, username },
        { where: { id: userId } }
      );

      // Récupérer l'utilisateur mis à jour
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      return res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
}