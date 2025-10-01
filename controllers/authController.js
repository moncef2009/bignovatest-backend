const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");
const tokenService = require("../utils/jwt");

class AuthController {
  // Inscription d'un nouvel utilisateur
  async register(req, res, next) {
    try {
      const { fullName, email, phone, password } = req.body;

      // Validation des champs requis
      const requiredFields = { fullName, email, phone, password };
      const missingFields = Object.keys(requiredFields).filter(
        (field) => !requiredFields[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Champs obligatoires manquants: ${missingFields.join(", ")}`,
        });
      }

      // Validation du format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Format d'email invalide",
        });
      }

      // Validation du mot de passe
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Le mot de passe doit contenir au moins 6 caractères",
        });
      }

      // Validation du téléphone
      const phoneRegex = /^[0-9+\-\s()]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Format de téléphone invalide",
        });
      }

      // Vérification de l'unicité email/téléphone
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });

      if (existingUser) {
        const conflictField =
          existingUser.email === email ? "email" : "téléphone";
        return res.status(409).json({
          success: false,
          error: `Un utilisateur avec ce ${conflictField} existe déjà`,
        });
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          password: hashedPassword,
        },
      });

      // Génération des tokens
      const tokens = tokenService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Sauvegarde du refresh token
      await tokenService.saveRefreshToken(user.id, tokens.refreshToken);

      // Réponse succès
      res.status(201).json({
        success: true,
        message: "Utilisateur créé avec succès",
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt,
          },
          tokens,
        },
      });
    } catch (error) {
      console.error("Erreur register:", error);
      next(error); // Passage à l'errorHandler global
    }
  }

  // Connexion d'un utilisateur existant
  async login(req, res, next) {
    try {
      const { email, phone, password } = req.body;

      // Validation des champs requis
      if ((!email && !phone) || !password) {
        return res.status(400).json({
          success: false,
          error: "Email/téléphone et mot de passe requis",
        });
      }

      // Recherche de l'utilisateur
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email: email.toLowerCase().trim() }] : []),
            ...(phone ? [{ phone: phone.trim() }] : []),
          ],
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          error: "Identifiants incorrects",
        });
      }

      // Vérification du mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Identifiants incorrects",
        });
      }

      // Génération des tokens
      const tokens = tokenService.generateTokens({
        userId: user.id,
        email: user.email,
      });

      // Sauvegarde du refresh token
      await tokenService.saveRefreshToken(user.id, tokens.refreshToken);

      // Réponse succès
      res.json({
        success: true,
        message: "Connexion réussie",
        data: {
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt,
          },
          tokens,
        },
      });
    } catch (error) {
      console.error("Erreur login:", error);
      next(error);
    }
  }

  // Rafraîchissement des tokens
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: "Refresh token requis",
        });
      }

      // Validation et rafraîchissement des tokens
      const tokens = await tokenService.refreshTokens(refreshToken);

      res.json({
        success: true,
        message: "Tokens rafraîchis avec succès",
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
          user: tokens.user,
        },
      });
    } catch (error) {
      console.error("Erreur refreshToken:", error);

      // Erreurs spécifiques au refresh token
      if (
        error.message.includes("invalide") ||
        error.message.includes("expiré") ||
        error.message.includes("non trouvé")
      ) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }

      next(error);
    }
  }

  // Déconnexion d'un utilisateur
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: "Refresh token requis pour la déconnexion",
        });
      }

      // Suppression du refresh token
      await tokenService.deleteRefreshToken(refreshToken);

      res.json({
        success: true,
        message: "Déconnexion réussie",
      });
    } catch (error) {
      console.error("Erreur logout:", error);

      // Même en cas d'erreur, on considère la déconnexion comme réussie
      // pour ne pas bloquer l'utilisateur
      res.json({
        success: true,
        message: "Déconnexion effectuée",
      });
    }
  }

  // Récupération du profil utilisateur
  async getProfile(req, res, next) {
    try {
      // L'utilisateur est déjà attaché à req par le middleware d'authentification
      if (!req.user) {
        return res.status(400).json({
          success: false,
          error: "Utilisateur non authentifié",
        });
      }

      res.json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      console.error("Erreur getProfile:", error);
      next(error);
    }
  }

  // Changement de mot de passe (méthode additionnelle utile)
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Mot de passe actuel et nouveau mot de passe requis",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
      }

      // Récupération de l'utilisateur avec le mot de passe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: "Utilisateur non trouvé",
        });
      }

      // Vérification du mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Mot de passe actuel incorrect",
        });
      }

      // Hash du nouveau mot de passe
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Mise à jour du mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      res.json({
        success: true,
        message: "Mot de passe modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur changePassword:", error);
      next(error);
    }
  }

  // Vérification de la disponibilité d'email (méthode additionnelle utile)
  async checkEmailAvailability(req, res, next) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email requis",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Format d'email invalide",
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      res.json({
        success: true,
        data: {
          available: !existingUser,
          email: email,
        },
      });
    } catch (error) {
      console.error("Erreur checkEmailAvailability:", error);
      next(error);
    }
  }

  // Vérification de la disponibilité de téléphone (méthode additionnelle utile)
  async checkPhoneAvailability(req, res, next) {
    try {
      const { phone } = req.query;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: "Téléphone requis",
        });
      }

      const phoneRegex = /^[0-9+\-\s()]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Format de téléphone invalide",
        });
      }

      const existingUser = await prisma.user.findFirst({
        where: { phone: phone.trim() },
      });

      res.json({
        success: true,
        data: {
          available: !existingUser,
          phone: phone,
        },
      });
    } catch (error) {
      console.error("Erreur checkPhoneAvailability:", error);
      next(error);
    }
  }
}

module.exports = new AuthController();
