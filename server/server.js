require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const {
  validateAnalyticsConfiguration,
} = require('./utils/analyticsUtils');

const app = express();

validateAnalyticsConfiguration();
connectDB();

// Render places one reverse proxy in front of the Express service.
// A numeric value is safer for IP-based rate limiting than trust proxy=true.
app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://bneyhayeshivot-1.onrender.com',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allows requests without an Origin, such as PowerShell or Postman,
      // and browser requests from the configured client origins.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
  })
);

app.use(
  helmet({
    crossOriginOpenerPolicy: {
      policy: 'same-origin-allow-popups',
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cookieParser());
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
app.use('/api/analytics', require('./routes/analytics'));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});