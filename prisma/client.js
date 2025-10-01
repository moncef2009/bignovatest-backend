const { PrismaClient } = require("@prisma/client");

// Initialisation et gestion du client Prisma
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

prisma
  .$connect()
  .then(() => {
    console.log("Connecté à la base de données PostgreSQL");
  })
  .catch((error) => {
    console.log("Erreur de connexion à la base de données:", error);
    process.exit(1);
  });

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
