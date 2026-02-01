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
  getAllUsers,
  //  makeAdmin,
   promoteRole,
} = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const superAdminMiddleware = require("../middleware/superAdminMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/user", authMiddleware,  getUser);

router.get("/users", authMiddleware, adminMiddleware, getAllUsers);

// 🔐 PASSWORD RESET ROUTES
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

/// 🔐 Promote user role (admin or super-admin)
router.put(
  "/promote/:id",
  authMiddleware,
  adminMiddleware, // both admin and super-admin pass this
  promoteRole
);


module.exports = router;
