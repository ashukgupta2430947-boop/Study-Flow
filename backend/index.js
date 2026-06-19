require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Todo = require('./models/Todo');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS  // Your Gmail App Password
  }
});

// Connect to MongoDB
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap';

mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    if (err.code === 8000 || (err.name === 'MongoServerError' && err.message.includes('authentication failed'))) {
      console.error('\n💡 HINT: Authentication failed. Please check the following:');
      console.error('   1. Your MONGO_URI in the .env file is correct (username, password, cluster URL).');
      console.error('   2. Your current IP address is whitelisted in MongoDB Atlas (Security -> Network Access).');
      console.error('   3. The database user has the correct read/write permissions.');
    }
  });

// --- Schemas & Models ---
const SubjectSchema = new mongoose.Schema({
  userId: String,
  name: String,
  durationWeeks: Number,
  color: String,
  examDate: { type: Date },
  topics: [{
    id: String,
    name: String,
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    notes: { type: String, default: '' }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

// Skill Schema (from server.js)
const SkillSchema = new mongoose.Schema({
  userName: String,
  title: String,
  category: String,
  level: String,
  desc: String,
  createdAt: { type: Date, default: Date.now }
});

const Skill = mongoose.models.Skill || mongoose.model('Skill', SkillSchema);

// User schema for simple auth (from server.js)
const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  bio: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  coverURL: { type: String, default: '' },
  points: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  sessions: { type: Number, default: 0 },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastTypingTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastTypingAt: { type: Date },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Message Schema
const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['message', 'friend_request', 'update', 'system'], default: 'update' },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// Contact Schema
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

// --- Routes ---

// Root route to check server status
app.get('/', (req, res) => {
  res.send('Server is running successfully!');
});

// --- Subject Routes ---
app.get('/api/subjects', async (req, res) => {
  try {
    const { userId } = req.query;
    // Filter by userId if provided
    const query = userId ? { userId } : {};
    const subjects = await Subject.find(query).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching subjects" });
  }
});

app.post('/api/subjects', async (req, res) => {
  try {
    const newSubject = new Subject(req.body);
    await newSubject.save();
    
    console.log(`[Subject Created] ${newSubject.name}`);
    res.status(201).json(newSubject);
  } catch (err) {
    console.error("Error saving subject:", err);
    res.status(500).json({ message: "Error saving subject", error: err.message });
  }
});

app.put('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { topics, examDate } = req.body;
    
    const updateData = {};
    if (topics) updateData.topics = topics;
    if (examDate) updateData.examDate = examDate;
    
    const updatedSubject = await Subject.findByIdAndUpdate(id, updateData, { new: true });
    
    if (updatedSubject) {
      res.json(updatedSubject);
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (err) {
    res.status(500).json({ message: "Error updating subject" });
  }
});

app.delete('/api/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubject = await Subject.findByIdAndDelete(id);
    
    if (deletedSubject) {
      res.json({ message: 'Subject deleted successfully' });
    } else {
      res.status(404).json({ message: 'Subject not found' });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting subject" });
  }
});

// --- Skill Routes (from server.js) ---
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.post('/api/skills', async (req, res) => {
  try {
    const newSkill = new Skill(req.body);
    await newSkill.save();
    res.status(201).json(newSkill);
  } catch (err) {
    res.status(400).json({ message: "Error saving skill" });
  }
});

// --- AUTH ROUTES ---
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email not found' });
    }

    // 2. Prepare Email
    const mailOptions = {
      from: `"StudyFlow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - StudyFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; text-align: center;">StudyFlow</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>We received a request to reset your password. Use the following One-Time Password (OTP) to proceed:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0f172a; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2026 StudyFlow. All rights reserved.</p>
        </div>
      `
    };

    // 3. Send Email
    console.log(`[OTP SERVICE] Attempting to send OTP to ${email}`);
    await transporter.sendMail(mailOptions);
    console.log(`[OTP SERVICE] OTP sent successfully to ${email}`);
    
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[OTP SERVICE] Error:', err);
    res.status(500).json({ success: false, message: 'Server error during OTP process', error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, username, email, password, bio } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

    if (username) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) return res.status(400).json({ message: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, username: username?.toLowerCase(), email, password: hash, bio });
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    userObj.uid = userObj._id;
    userObj.displayName = userObj.name;
    res.status(201).json(userObj);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const userObj = user.toObject();
    delete userObj.password;
    userObj.uid = userObj._id;
    userObj.displayName = userObj.name;

    // Update lastActive on login
    await User.findByIdAndUpdate(user._id, { lastActive: new Date() });

    res.json(userObj);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { email, name, photoURL } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      const generatedUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);
      user = new User({ 
        name, 
        email, 
        photoURL: photoURL || '',
        password: await bcrypt.hash(Math.random().toString(36), 10), // Placeholder password
        username: generatedUsername.toLowerCase()
      });
      await user.save();
    }

    const userObj = user.toObject();
    delete userObj.password;
    userObj.uid = userObj._id;
    userObj.displayName = userObj.name;
    
    // Update lastActive on Google login
    await User.findByIdAndUpdate(user._id, { lastActive: new Date() });

    res.json(userObj);
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/heartbeat', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    await User.findByIdAndUpdate(userId, { lastActive: new Date() });
    res.json({ success: true });
  } catch (err) {
    console.error('Heartbeat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, username, bio, photoURL } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      return res.status(400).json({ message: 'Invalid User ID format' });
    }
    
    // Check if new username is taken
    if (username && username.trim() !== '') {
      const existing = await User.findOne({ 
        username: username.toLowerCase().trim(), 
        _id: { $ne: uid } 
      });
      if (existing) return res.status(400).json({ message: 'Username already taken' });
    }
    
    const updateData = { name, bio };
    let unsetData = null;
    if (username && username.trim() !== '') {
        updateData.username = username.toLowerCase().trim();
    } else if (username === '') {
        unsetData = { username: 1 };
    }

    if (photoURL !== undefined) updateData.photoURL = photoURL;

    const mongoUpdate = { $set: updateData };
    if (unsetData) mongoUpdate.$unset = unsetData;

    const updatedUser = await User.findByIdAndUpdate(
      uid, 
      mongoUpdate, 
      { new: true, runValidators: true }
    );
    
    if (updatedUser) {
      const userObj = updatedUser.toObject();
      delete userObj.password;
      userObj.uid = userObj._id;
      userObj.displayName = userObj.name;
      res.json(userObj);
    } else {
      res.status(404).json({ message: 'User not found in database' });
    }
  } catch (err) {
    console.error('Update user error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    res.status(500).json({ message: `Error updating profile: ${err.message}` });
  }
});

// Update Password
app.put('/api/users/:uid/password', async (req, res) => {
  try {
    const { uid } = req.params;
    const { newPassword } = req.body;
    
    console.log(`[AUTH] Password update request for UID: ${uid}`);

    if (!mongoose.Types.ObjectId.isValid(uid)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const updatedUser = await User.findByIdAndUpdate(uid, {
       password: hashedPassword
    });
    
    if (!updatedUser) {
      console.log(`[AUTH] User not found: ${uid}`);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log(`[AUTH] Password updated for user: ${updatedUser.email}`);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("[AUTH] Password update error:", err);
    res.status(500).json({ message: "Error updating password" });
  }
});

// --- SOCIAL & MESSAGING ROUTES ---

// Search Users
app.get('/api/users/search', async (req, res) => {
  try {
    let { q, currentUserId } = req.query;
    if (!q) return res.json([]);
    
    q = q.trim();
    const isUsernameSearch = q.startsWith('@');
    const searchTerm = isUsernameSearch ? q.substring(1) : q;
    
    const query = {
      $and: [
        { 
          $or: [
            { username: { $regex: searchTerm, $options: 'i' } },
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        },
        { _id: { $ne: currentUserId } }
      ]
    };
    
    const users = await User.find(query).select('name username email bio _id').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Send Friend Request
app.post('/api/friends/request', async (req, res) => {
  try {
    const { fromId, toId } = req.body;
    if (fromId === toId) return res.status(400).json({ message: 'Cannot add yourself' });

    await User.findByIdAndUpdate(toId, { $addToSet: { friendRequestsReceived: fromId } });
    await User.findByIdAndUpdate(fromId, { $addToSet: { friendRequestsSent: toId } });
    
    // Create Notification
    const sender = await User.findById(fromId);
    const notification = new Notification({
      userId: toId,
      fromId: fromId,
      type: 'friend_request',
      content: `${sender.name} sent you a friend request.`
    });
    await notification.save();
    
    res.json({ success: true, message: 'Request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending request' });
  }
});

// Accept Friend Request
app.post('/api/friends/accept', async (req, res) => {
  try {
    const { userId, requesterId } = req.body;
    
    // Add to friends, remove from requests
    await User.findByIdAndUpdate(userId, { 
      $addToSet: { friends: requesterId },
      $pull: { friendRequestsReceived: requesterId }
    });
    await User.findByIdAndUpdate(requesterId, { 
      $addToSet: { friends: userId },
      $pull: { friendRequestsSent: userId }
    });
    
    res.json({ success: true, message: 'Request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Error accepting request' });
  }
});

// Get Friend List & Requests
app.get('/api/friends', async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId)
      .populate('friends', 'name email bio')
      .populate('friendRequestsReceived', 'name email bio');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      friends: user.friends,
      requests: user.friendRequestsReceived
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching friends' });
  }
});

// Get Messages & Friend Status
app.get('/api/messages/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;
    const { currentUserId } = req.query;
    
    // Check if friend is typing to current user
    const friend = await User.findById(friendId);
    let isTyping = false;
    if (friend && friend.lastTypingTo && friend.lastTypingTo.toString() === currentUserId) {
       // Check if typing happened in the last 5 seconds
       const fiveSecondsAgo = new Date(Date.now() - 5000);
       if (friend.lastTypingAt > fiveSecondsAgo) {
         isTyping = true;
       }
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: friendId },
        { senderId: friendId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });
    
    res.json({ messages, isTyping });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send Message
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const newMessage = new Message({ senderId, receiverId, content });
    await newMessage.save();

    // Create Notification for the receiver
    const sender = await User.findById(senderId);
    const notification = new Notification({
      userId: receiverId,
      fromId: senderId,
      type: 'message',
      content: `New message from ${sender.name}`
    });
    await notification.save();

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

// Update Typing Status
app.post('/api/users/status/typing', async (req, res) => {
  try {
    const { userId, toId } = req.body;
    await User.findByIdAndUpdate(userId, {
      lastTypingTo: toId,
      lastTypingAt: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating typing status' });
  }
});

// Mark Message as Read
app.put('/api/messages/:id/read', async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error marking read' });
  }
});

// Mark All as Read from Friend
app.put('/api/messages/read-all', async (req, res) => {
  try {
    const { currentUserId, friendId } = req.body;
    await Message.updateMany(
      { senderId: friendId, receiverId: currentUserId, isRead: false },
      { isRead: true }
    );
    
    // Also mark notifications as read
    await Notification.updateMany(
      { userId: currentUserId, fromId: friendId, type: 'message', isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error marking all read' });
  }
});

// Edit Message
app.patch('/api/messages/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const updated = await Message.findByIdAndUpdate(req.params.id, {
      content,
      isEdited: true
    }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error editing message' });
  }
});

// Delete Message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting message' });
  }
});

// Toggle Reaction
app.post('/api/messages/:id/react', async (req, res) => {
  try {
    const { userId, emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Msg not found' });
    
    // Check if user already reacted with this emoji
    const existingIndex = message.reactions.findIndex(r => r.userId.toString() === userId && r.emoji === emoji);
    
    if (existingIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ userId, emoji });
    }
    
    await message.save();
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: 'Error reacting to message' });
  }
});

// --- USER PROFILE ROUTES ---
app.put('/api/users/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, username, bio, photoURL, coverURL } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(id, {
      name: displayName,
      username,
      bio,
      photoURL,
      coverURL
    }, { new: true });
    
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// --- NOTIFICATION ROUTES ---

// Get Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark Notification as Read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Mark All as Read
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const { userId } = req.body;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// --- TODO ROUTES ---
app.get('/api/todos', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const todos = await Todo.find(query).sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const todo = new Todo(req.body);
    await todo.save();
    res.status(201).json(todo);
  } catch (err) {
    res.status(400).json({ message: 'Error saving task' });
  }
});

app.patch('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!todo) return res.status(404).json({ message: 'Task not found' });
    res.json(todo);
  } catch (err) {
    res.status(400).json({ message: 'Error updating task' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// --- CONTACT ROUTES ---
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // 1. Save to MongoDB
    const contact = new Contact({ name, email, message });
    await contact.save();
    console.log(`[Contact Form] Message saved from ${name} (${email})`);

    // 2. Try to send email (do not let it block the response if it fails)
    try {
      const mailOptions = {
        from: `"StudyFlow Contact Form" <${process.env.EMAIL_USER || 'ashukgupta2430947@gmail.com'}>`,
        to: 'ashukgupta2430947@gmail.com',
        subject: `New Message from ${name} (via StudyFlow)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #2563eb; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New Contact Message</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; color: #0f172a; white-space: pre-wrap; line-height: 1.5;">
              ${message}
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2026 StudyFlow. All rights reserved.</p>
          </div>
        `
      };

      if (process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_gmail_app_password_here') {
        await transporter.sendMail(mailOptions);
        console.log(`[Contact Form] Email sent successfully`);
      } else {
        console.log(`[Contact Form] Email sending skipped (placeholder/missing EMAIL_PASS)`);
      }
    } catch (emailErr) {
      console.error('[Contact Form] Email sending error:', emailErr.message);
    }

    res.status(201).json({ success: true, message: 'Message sent and saved successfully!' });
  } catch (err) {
    console.error('Contact submit error:', err);
    res.status(500).json({ success: false, message: 'Server error while sending message' });
  }
});

// --- QUIZ ROUTES ---
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { subjectId, subjectName, topics } = req.body;
    
    let quizTopics = topics;
    let name = subjectName;

    // If topics aren't provided (Legacy/Strict DB mode), fetch from DB
    if (!quizTopics && subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        quizTopics = subject.topics;
        name = subject.name;
      }
    }

    if (!quizTopics || !Array.isArray(quizTopics) || quizTopics.length === 0) {
      return res.status(400).json({ message: "No topics found to generate quiz." });
    }

    // AI Generation Simulation: In a real app, this would call OpenAI/Gemini
    const questions = quizTopics.map(topic => {
      const concepts = [
        "Which of the following best describes the core architectural principle of",
        "In a professional production environment, what is the most critical aspect of",
        "When optimizing for performance, how should you approach",
        "Identify the primary advantage of implementing",
        "Which design pattern is most commonly associated with"
      ];
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      
      const topicName = topic.name || topic;
      
      // Create a set of "AI-generated" sounding options
      const correct = `Optimizing the underlying framework and state management for ${topicName}`;
      const wrong1 = `Simplifying the documentation and user interface for ${topicName}`;
      const wrong2 = `Increasing the complexity of the legacy code in ${topicName}`;
      const wrong3 = `Reducing the scope and functionality of ${topicName}`;
      
      const options = [correct, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);

      return {
        id: Math.random().toString(36).substr(2, 9),
        question: `${concept} ${topicName}?`,
        options: options,
        correct: options.indexOf(correct)
      };
    }).slice(0, 10);

    res.json(questions);
  } catch (err) {
    console.error("Quiz Gen Error:", err);
    res.status(500).json({ message: "AI Quiz Generation Failed" });
  }
});

// --- Socket.io WebRTC Signaling Server ---
const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Map userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Register user with their userId
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`[Socket] User registered: ${userId} -> ${socket.id}`);
  });

  // Caller initiates a call to a specific user
  socket.on('call-user', ({ toUserId, fromUserId, fromName, callType, offer }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', {
        fromUserId,
        fromName,
        callType,
        offer
      });
      console.log(`[Call] ${fromUserId} calling ${toUserId} (${callType})`);
    } else {
      // User is offline
      socket.emit('call-rejected', { reason: 'User is offline or unavailable' });
    }
  });

  // Callee accepts and sends answer
  socket.on('call-accepted', ({ toUserId, answer }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-accepted', { answer });
    }
  });

  // Callee rejects the call
  socket.on('call-rejected', ({ toUserId, reason }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-rejected', { reason: reason || 'Call declined' });
    }
  });

  // ICE candidate exchange
  socket.on('ice-candidate', ({ toUserId, candidate }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { candidate });
    }
  });

  // End / hang up the call
  socket.on('end-call', ({ toUserId }) => {
    const targetSocketId = onlineUsers.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended');
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`[Socket] User disconnected: ${socket.userId}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`[Socket.io] WebRTC signaling server active`);
});