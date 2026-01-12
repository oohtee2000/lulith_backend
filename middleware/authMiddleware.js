const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const decoded = jwt.verify(token, "secretKey");

    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // contains role
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthenticated" });
  }
};

module.exports = authMiddleware;
