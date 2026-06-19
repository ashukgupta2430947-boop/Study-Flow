const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

async function checkUser() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    const email = 'ashukgupta2430947@gmail.com';
    const user = await User.findOne({ email });
    
    if (user) {
      console.log('User found:');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Password Hash:', user.password);
    } else {
      console.log('User not found with email:', email);
      const allUsers = await User.find({}, { name: 1, email: 1 });
      console.log('All users in DB:', allUsers);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUser();
