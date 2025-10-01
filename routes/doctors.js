const express = require("express");
const doctorsController = require("../controllers/doctorsController");

const router = express.Router();

router.get("/", doctorsController.getDoctors);
router.get("/specialties", doctorsController.getSpecialties);

module.exports = router;
