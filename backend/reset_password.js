const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillswap';

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

async function resetPassword() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    const email = 'ashukgupta2430947@gmail.com';
    const newPassword = 'Ashuk@1234';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    const result = await User.updateOne({ email }, { $set: { password: hash } });
    
    if (result.matchedCount > 0) {
      console.log(`Password updated successfully for ${email}`);
    } else {
      console.log(`User not found with email: ${email}`);
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

resetPassword();
