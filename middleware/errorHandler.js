const errorHandler = (err, req, res, next) => {
  console.error("Erreur détaillée:", {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
  });

  // Erreur JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Token JWT invalide",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token JWT expiré",
    });
  }

  // Erreurs Prisma
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "champ";
    return res.status(409).json({
      success: false,
      error: `Un utilisateur avec ce ${field} existe déjà`,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: "Enregistrement non trouvé",
    });
  }

  // Erreur de validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Données de validation invalides",
      details: err.errors || err.message,
    });
  }

  // Erreur de syntaxe JSON
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: "JSON mal formé",
    });
  }

  // Erreur par défaut
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Erreur serveur interne",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
};

module.exports = errorHandler;
