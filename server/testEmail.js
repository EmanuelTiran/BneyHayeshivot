// testUsers.js בתיקיית server
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const all = await User.find().lean();
  console.log('כל המשתמשים:', all.map(u => ({
    email: u.email, isActive: u.isActive
  })));
  process.exit();
});