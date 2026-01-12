//server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const transporter = require("./config/mail");

const userRoutes = require("./routes/userRoutes");

const app = express();

// CONNECT DATABASE
connectDB();

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
app.use(express.json());

// Test email route
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

app.use("/api", userRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
