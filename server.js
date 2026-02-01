// server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const transporter = require("./config/mail");

const userRoutes = require("./routes/userRoutes");
const ticketRoutes = require("./routes/ticketRoute");
const dashboardRoutes = require("./routes/dashboardRoute");

const app = express();

// CONNECT DATABASE
connectDB();

// MIDDLEWARES
app.use(cookieParser());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS
app.use(
  cors({
    origin:[ "http://localhost:8080", "http://localhost:3000"], // frontend URL
    credentials: true,
  })
);

// STATIC FOLDER FOR UPLOADED FILES
app.use("/uploads", express.static("public/uploads"));

// ROUTES
app.use("/api", userRoutes);
app.use("/api", ticketRoutes);
app.use("/api", dashboardRoutes);

// TEST EMAIL ROUTE
app.get("/send-test-mail", async (req, res) => {
  try {
    await transporter.sendMail({
      from: `"Osmium Blog" <${process.env.SMTP_USER}>`,
      to: "recipient@example.com",
      subject: "Welcome to Osmium Blog",
      template: "welcome",
      context: { name: "Yusuf" },
    });

    res.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Mail error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});




// ---------------- GLOBAL ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL ERROR");
  console.error("Route:", req.method, req.originalUrl);
  console.error("Message:", err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Something went wrong",
  });
});



// START SERVER
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
