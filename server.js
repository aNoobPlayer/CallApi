const express = require('express');
const { AccessToken, VideoGrant } = require('livekit-server-sdk');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 3000
}));
app.use(express.json());

const handler = async (req, res) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { identity, roomName } = req.body;
    if (!identity || !roomName) {
      return res.status(400).json({ error: 'Identity and roomName are required' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: identity,
        ttl: 3600,
      });

      const videoGrant = {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      };

      at.addGrant(videoGrant);

      const token = await at.toJwt();
      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate token', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};

module.exports = handler;