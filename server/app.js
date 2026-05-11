const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/submissions", express.static(path.join(__dirname, "submissions")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err.message));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/submissions", require("./routes/submissionRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/ai", require("./routes/Airoutes"));

app.use("/api/subscription", require("./routes/subscriptionRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));

app.get("/", (req, res) => {
  res.send("Mentora API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});