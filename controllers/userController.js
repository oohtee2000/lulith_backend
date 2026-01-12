//user controller
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const transporter = require("../config/mail");
const crypto = require("crypto");


// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body; // include role

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user', // default to 'user' if role is not provided
    });

    const result = await user.save();

    // ✅ SEND WELCOME EMAIL
    await transporter.sendMail({
      from: `"Osmium Blog" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Welcome to Osmium Blog 🎉",
      template: "welcome", // views/email/welcome.hbs
      context: {
        name: name,
      },
    });

    const { password: pwd, ...data } = result.toJSON();
    res.status(201).json(data);

  } catch (error) {
    console.error("Register error:", error);
    res.status(400).json({ message: error.message });
  }
};



// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

    // const token = jwt.sign({ _id: user._id }, "secretKey", {
    //   expiresIn: "1d",
    // });

    const token = jwt.sign(
  { _id: user._id, role: user.role },
  "secretKey",
  { expiresIn: "1d" }
);

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.clearCookie("jwt", { httpOnly: true });
  res.json({ message: "Logged out successfully" });
};


// GET AUTHENTICATED USER
exports.getUser = async (req, res) => {
  try {
    const cookie = req.cookies.jwt;
    if (!cookie)
      return res.status(401).json({ message: "Unauthenticated" });

    const claims = jwt.verify(cookie, "secretKey");

    const user = await User.findById(claims._id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const { password, ...data } = user.toJSON();
    res.json(data);
  } catch (error) {
    res.status(401).json({ message: "Unauthenticated" });
  }
};


// REQUEST PASSWORD RESET
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    // Reset link
    const resetLink = `http://localhost:8080/reset-password/${resetToken}`;

    // Send email
    await transporter.sendMail({
      from: `"Osmium Blog" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request 🔐",
      template: "reset-password",
      context: {
        name: user.name,
        resetLink,
      },
    });

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PROMOTE USER TO ADMIN (ADMIN ONLY)
exports.makeAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from modifying own role
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        message: "User is already an admin",
      });
    }

    user.role = "admin";
    await user.save();

    res.json({
      message: "User promoted to admin successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Make admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


