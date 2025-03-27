const express = require('express');
const { AccessToken } = require('livekit-server-sdk');
const cors = require('cors');
require('dotenv').config(); // Only needed locally; Render uses its own env vars

const app = express();
const port = process.env.PORT || 3001; // Render assigns PORT dynamically

// Define allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000', // Local dev
  'https://your-site-name.netlify.app', // Replace with your Netlify URL
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow no-origin requests
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400, // Cache preflight response for 24 hours
}));
app.use(express.json({ limit: '1mb' })); // Limit payload size for security

// Token generation endpoint
app.post('/token', async (req, res) => {
  const { identity, roomName } = req.body;

  if (!identity || !roomName) {
    return res.status(400).json({ error: 'Missing identity or roomName' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error('Missing LiveKit API credentials');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: 3600 });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Token generation failed:', error.message);
    return res.status(500).json({ error: 'Token generation failed' });
  }
});

// Health check endpoint for Render monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server and handle shutdown gracefully
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown for Render's container lifecycle
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});