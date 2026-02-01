const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Only admins/super-admins can access dashboard
router.get("/metrics", authMiddleware, adminMiddleware, dashboardController.getDashboardMetrics);

module.exports = router;
