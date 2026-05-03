const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const helmet = require("helmet");
require('dotenv').config();

const app = express();
connectDB();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://bneyhayeshivot-1.onrender.com'
  ],
  credentials: true
}));

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(express.json());

app.use('/api/prayers', require('./routes/prayers'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/commemorations', require('./routes/commemorations'));
app.use('/api/gallery', require('./routes/gallery'));

app.use('/api/categories', require('./routes/categories'));
app.use('/api/portal-items', require('./routes/portalItems'));
app.use('/api/sponsorships', require('./routes/sponsorships'));
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use(errorHandler);
app.use(cookieParser());


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));