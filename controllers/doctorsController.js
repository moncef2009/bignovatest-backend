const prisma = require("../prisma/client");

class DoctorsController {
  // Liste des médecins avec filtres (spécialité et recherche par nom)
  async getDoctors(req, res, next) {
    try {
      const { specialty, search } = req.query;

      let whereClause = {};

      if (specialty && specialty !== "all") {
        whereClause.specialty = specialty;
      }

      if (search) {
        whereClause.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
        ];
      }

      const doctors = await prisma.doctor.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          avatar: true,
          email: true,
          phone: true,
          address: true,
        },
        orderBy: { lastName: "asc" },
      });

      res.json({
        success: true,
        data: { doctors, count: doctors.length },
      });
    } catch (error) {
      next(error);
    }
  }

  // Récupération de la liste des spécialités disponibles
  async getSpecialties(req, res, next) {
    try {
      const specialties = await prisma.doctor.findMany({
        distinct: ["specialty"],
        select: { specialty: true },
        orderBy: { specialty: "asc" },
      });

      const specialtyList = specialties.map((s) => s.specialty);

      res.json({
        success: true,
        data: { specialties: specialtyList },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorsController();
