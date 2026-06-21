require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Todo = require('./models/Todo');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap';

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));


// ==================== SCHEMAS ====================

// Skill Schema
const SkillSchema = new mongoose.Schema({
  userName: String,
  title: String,
  category: String,
  level: String,
  desc: String,
  createdAt: { type: Date, default: Date.now }
});

const Skill = mongoose.models.Skill || mongoose.model("Skill", SkillSchema);


// Subject Schema (FOR ROADMAP)
const SubjectSchema = new mongoose.Schema({
  name: String,
  duration: String,
  color: String,
  topics: [String],
  createdAt: { type: Date, default: Date.now }
});

const Subject = mongoose.models.Subject || mongoose.model("Subject", SubjectSchema);


// User Schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  bio: { type: String, default: "" },
  points: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  sessions: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);


// ==================== SKILL ROUTES ====================

// Get skills
app.get("/api/skills", async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });
    res.json(skills);
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
});

// Add skill
app.post("/api/skills", async (req, res) => {
  try {
    const skill = new Skill(req.body);
    await skill.save();
    res.status(201).json(skill);
  } catch {
    res.status(400).json({ message: "Error saving skill" });
  }
});


// ==================== SUBJECT ROUTES ====================

// Save roadmap subject
app.post("/api/subjects", async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    console.error("Error saving subject:", err);
    res.status(500).json({ message: "Error saving subject", error: err.message });
  }
});

// Get all subjects
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});


// ==================== AUTH ROUTES ====================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hash,
      bio
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);

  } catch {
    res.status(500).json({ message: "Server error" });
  }
});


// ==================== TODO ROUTES ====================

// Get all tasks
app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
});

// Add a new task
app.post("/api/todos", async (req, res) => {
  try {
    const todo = new Todo(req.body);
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ message: "Error saving task" });
  }
});

// Update task status (toggle complete)
app.patch("/api/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!todo) return res.status(404).json({ message: "Task not found" });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: "Error updating task" });
  }
});

// Delete a task
app.delete("/api/todos/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});