const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// פונקציה פרטית ליצירת JWT של המערכת
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
};

exports.register = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid credentials');
  }
  const token = generateToken(user);
  return { token, user };
};

exports.googleLogin = async (idToken) => {
  // 1. אימות ה-token מול שרתי גוגל
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  // 2. חפש משתמש קיים לפי googleId קודם
  let user = await User.findOne({ googleId });

  if (user) {
    // משתמש גוגל קיים - התחבר ישירות
    const token = generateToken(user);
    return { token, user };
  }

  // 3. Account Merging: בדוק אם קיים משתמש עם אותו אימייל (נרשם בעבר רגיל)
  user = await User.findOne({ email });

  if (user) {
    // קיים משתמש רגיל עם אותו מייל - חבר את חשבון הגוגל אליו
    user.googleId = googleId;
    await user.save();
    const token = generateToken(user);
    return { token, user };
  }

  // 4. משתמש חדש לגמרי - צור אותו
  user = new User({
    name: name || email.split('@')[0],
    email,
    googleId,
    // אין password בכלל
  });
  await user.save();

  const token = generateToken(user);
  return { token, user };
};