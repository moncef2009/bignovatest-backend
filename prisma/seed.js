const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Script de seeding : initialise la base avec des données de test (utilisateur + médecins)
const prisma = new PrismaClient();

async function main() {
  console.log("Début du seeding...");

  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.doctor.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  const user = await prisma.user.create({
    data: {
      fullName: "Mohamed Bensalem",
      email: "mohamed.bensalem@example.com",
      phone: "0550123456",
      password: hashedPassword,
    },
  });

  const doctors = await prisma.doctor.createMany({
    data: [
      {
        firstName: "Amina",
        lastName: "Boukhelifa",
        specialty: "Cardiologie",
        email: "amina.boukhelifa@urdocto.com",
        phone: "0550123457",
        address: "12 Rue Didouche Mourad, Alger",
        avatar: "https://randomuser.me/api/portraits/women/65.jpg",
      },
      {
        firstName: "Khaled",
        lastName: "Saidi",
        specialty: "Dermatologie",
        email: "khaled.saidi@urdocto.com",
        phone: "0550123458",
        address: "45 Avenue Emir Abdelkader, Oran",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      },
      {
        firstName: "Samira",
        lastName: "Belkacem",
        specialty: "Pédiatrie",
        email: "samira.belkacem@urdocto.com",
        phone: "0550123459",
        address: "8 Rue des Frères Bouabsa, Constantine",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      },
      {
        firstName: "Yacine",
        lastName: "Kherbache",
        specialty: "Neurologie",
        email: "yacine.kherbache@urdocto.com",
        phone: "0550123460",
        address: "23 Boulevard Mohamed Boudiaf, Annaba",
        avatar: "https://randomuser.me/api/portraits/men/76.jpg",
      },
      {
        firstName: "Nadia",
        lastName: "Meziane",
        specialty: "Ophtalmologie",
        email: "nadia.meziane@urdocto.com",
        phone: "0550123461",
        address: "17 Rue Larbi Ben M’hidi, Tizi Ouzou",
        avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      },
    ],
  });

  console.log(`${doctors.count} médecins créés`);
  console.log(
    `Utilisateur test créé (email: mohamed.bensalem@example.com, password: password123)`
  );
  console.log("Seeding terminé !");
}

main()
  .catch((e) => {
    console.log("Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
