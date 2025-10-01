const tokenService = require("../utils/jwt");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token d'accès manquant",
      });
    }

    const accessToken = authHeader.replace("Bearer ", "");
    const decoded = tokenService.verifyAccessToken(accessToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: "Token d'accès invalide ou expiré",
      });
    }

    const prisma = require("../prisma/client");
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erreur authentification:", error);

    // Déjà géré par l'errorHandler pour les erreurs JWT
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(error);
    }

    res.status(500).json({
      success: false,
      error: "Échec de l'authentification",
    });
  }
};

module.exports = auth;
