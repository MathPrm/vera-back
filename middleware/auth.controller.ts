// controllers/auth.controller.ts
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Op } from 'sequelize';
import db from '../app/models';

const User = db.User;
const JWT_SECRET: string = process.env.JWT_SECRET || 'votre_secret_jwt_très_sécurisé';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

export class AuthController {
  // Inscription
  static async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, username } = req.body;

      // Validation des champs requis
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe sont requis'
        });
      }

      // Validation longueur mot de passe
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await User.findOne({
        where: { email }
      });

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

      // Retourner la réponse sans le mot de passe
      const userResponse = {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        createdAt: newUser.createdAt
      };

      return res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        user: userResponse
      });

    } catch (error: any) {
      console.error('Erreur inscription:', error);
      
      // Gestion des erreurs de validation Sequelize
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: error.errors[0].message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'inscription'
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

      // Rechercher l'utilisateur
      const user = await User.findOne({
        where: { email }
      });

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
      const payload = {
        id: user.id,
        email: user.email
      };
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
      } as SignOptions);

      // Réponse avec token et infos utilisateur
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
      console.error('Erreur connexion:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la connexion'
      });
    }
  }

  // Récupérer le profil
  static async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId;

      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'createdAt', 'updatedAt']
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
      console.error('Erreur récupération profil:', error);
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
      const { email, username, currentPassword, newPassword } = req.body;

      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Si changement d'email, vérifier qu'il n'est pas déjà pris
      if (email && email !== user.email) {
        const emailExists = await User.findOne({
          where: { 
            email,
            id: { [Op.ne]: userId }
          }
        });

        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Cet email est déjà utilisé'
          });
        }
      }

      // Si changement de mot de passe
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Le mot de passe actuel est requis'
          });
        }

        const isPasswordValid = await user.validatePassword(currentPassword);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Mot de passe actuel incorrect'
          });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
          });
        }

        user.password = newPassword;
      }

      // Mettre à jour les champs
      if (email) user.email = email;
      if (username) user.username = username;

      await user.save();

      return res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });

    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
  }
}