const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

class TokenService {
  // Génère un access token et un refresh token
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  // Vérifie la validité de l'access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch {
      return null;
    }
  }

  // Vérifie la validité du refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return null;
    }
  }

  // Sauvegarde un refresh token en base et supprime les anciens
  async saveRefreshToken(userId, refreshToken) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.deleteMany({ where: { userId } });

    return await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });
  }

  // Récupère un refresh token en base
  async findRefreshToken(token) {
    return await prisma.refreshToken.findFirst({
      where: { token },
      include: { user: true },
    });
  }

  // Supprime un refresh token en base
  async deleteRefreshToken(token) {
    return await prisma.refreshToken.deleteMany({ where: { token } });
  }

  // Rafraîchit les tokens en générant un nouvel access et refresh token
  async refreshTokens(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);
    if (!decoded) throw new Error("Refresh token invalide");

    const tokenFromDb = await this.findRefreshToken(refreshToken);
    if (!tokenFromDb) throw new Error("Refresh token non trouvé");

    if (new Date() > tokenFromDb.expiresAt) {
      await this.deleteRefreshToken(refreshToken);
      throw new Error("Refresh token expiré");
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenFromDb.userId },
    });

    if (!user) {
      await this.deleteRefreshToken(refreshToken);
      throw new Error("Utilisateur non trouvé");
    }

    const tokens = this.generateTokens({ userId: user.id, email: user.email });
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    };
  }
}

module.exports = new TokenService();
