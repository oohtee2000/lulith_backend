//user route

const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getUser,
  logout,
  forgotPassword,
  resetPassword,
   makeAdmin,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/user", authMiddleware, getUser);

// 🔐 PASSWORD RESET ROUTES
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// 🔐 ADMIN: Promote user to admin
router.put(
  "/make-admin/:id",
  authMiddleware,
  adminMiddleware,
  makeAdmin
);

module.exports = router;
