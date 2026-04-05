require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const {
  initDatabase,
  canClaim,
  saveClaim,
  updateClaimStatus,
  deleteClaim,
  getConfig,
  savePageLoad,
  validateDelay
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for getting real IP behind reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS and Referer restriction
const allowedDomains = ['yogaxd-tiktok.zone.id', 'yogaxd-tiktok.vercel.app', 'localhost'];

app.use('/api', cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedDomains.some(d => origin.includes(d));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use('/api', (req, res, next) => {
  const referer = req.get('Referer');

  if (!referer) {
    return res.status(403).json({ success: false, message: 'Forbidden: Missing Referer' });
  }

  const isAllowedReferer = allowedDomains.some(d => referer.includes(d));

  if (!isAllowedReferer) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, message: 'Terlalu banyak request. Tunggu sebentar.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Claim-specific rate limiter (stricter)
const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Helper: Get real IP ---
function getRealIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.ip;
}

// --- Anti-VPN Check ---
async function checkVPN(ip) {
  // Skip check for localhost/private IPs
  const privateRanges = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
  if (privateRanges.includes(ip) || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { isVPN: false, reason: 'Private IP' };
  }

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,proxy,hosting`, {
      timeout: 5000
    });

    if (response.data.status === 'success') {
      const isVPN = response.data.proxy || response.data.hosting;
      return {
        isVPN,
        reason: response.data.proxy ? 'VPN/Proxy detected' : response.data.hosting ? 'Hosting/Datacenter IP' : 'Clean IP'
      };
    }

    return { isVPN: false, reason: 'API check inconclusive' };
  } catch (error) {
    console.error('VPN check error:', error.message);
    return { isVPN: false, reason: 'Check failed - allowing' };
  }
}

// --- Validate TikTok URL ---
function isValidTikTokURL(url) {
  const patterns = [
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
    /^https?:\/\/vt\.tiktok\.com\/[\w]+/i,
    /^https?:\/\/(vm|vt)\.tiktok\.com\/[\w]+/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i
  ];
  return patterns.some(pattern => pattern.test(url));
}

// ========================
// API ROUTES
// ========================

app.get('/api/init', async (req, res) => {
  const ip = getRealIP(req);
  const token = crypto.randomBytes(32).toString('hex');
  const delay = Math.floor(Math.random() * 6) + 10; // 10-15 seconds

  try {
    await savePageLoad(ip, token);
    const maxLikesConfig = await getConfig('max_likes');
    const maxLikes = parseInt(maxLikesConfig) || 30;

    res.json({
      success: true,
      token,
      delay,
      maxLikes
    });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/claim', claimLimiter, async (req, res) => {
  const ip = getRealIP(req);
  const { url, token } = req.body;

  if (!url || !token) {
    return res.status(400).json({
      success: false,
      message: 'URL TikTok dan token diperlukan.'
    });
  }

  if (!isValidTikTokURL(url)) {
    return res.status(400).json({
      success: false,
      message: 'URL TikTok tidak valid. Gunakan link video TikTok yang benar.'
    });
  }

  const vpnCheck = await checkVPN(ip);
  if (vpnCheck.isVPN) {
    return res.status(403).json({
      success: false,
      message: '🚫 VPN/Proxy terdeteksi! Matikan VPN kamu dan coba lagi.',
      reason: vpnCheck.reason
    });
  }

  const delayCheck = await validateDelay(ip, token, 10);
  if (!delayCheck.valid) {
    return res.status(429).json({
      success: false,
      message: delayCheck.message
    });
  }

  const claimCheck = await canClaim(ip);
  if (!claimCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: claimCheck.message
    });
  }

  const maxLikesConfig = await getConfig('max_likes');
  const maxLikes = parseInt(maxLikesConfig) || 30;

  try {
    const result = await saveClaim(ip, url, maxLikes, 'processing');
    const claimId = result.lastInsertRowid;

    // Fayupedia Integration
    try {
      const payload = {
        api_id: parseInt(process.env.FAYUPEDIA_API_ID),
        api_key: process.env.FAYUPEDIA_API_KEY,
        service: 1406,
        target: url,
        quantity: maxLikes
      };

      const orderRes = await axios.post('https://fayupedia.id/api/order', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (orderRes.data && orderRes.data.status === true) {
        await updateClaimStatus(claimId, 'success');
        res.json({
          success: true,
          message: `✅ Berhasil! ${maxLikes} likes sedang dikirim ke video kamu! 🎉`,
          likes: maxLikes
        });
      } else {
        await deleteClaim(claimId); // Delete so it doesn't count towards daily limit
        res.status(200).json({
          success: false,
          message: "Stok Free TikTok Like Sedang Kosong."
        });
      }
    } catch (apiError) {
      console.error('Fayupedia API error:', apiError.response ? apiError.response.data : apiError.message);
      await deleteClaim(claimId); // Delete so it doesn't count towards daily limit
      res.status(200).json({
        success: false,
        message: "Stok Free TikTok Like Sedang Kosong."
      });
    }

  } catch (error) {
    console.error('Claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server. Coba lagi nanti.'
    });
  }
});

app.get('/api/config', async (req, res) => {
  const maxLikesConfig = await getConfig('max_likes');
  const maxLikes = parseInt(maxLikesConfig) || 30;
  res.json({ maxLikes });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`
  ╔══════════════════════════════════════════╗
  ║   ✨ YogaxD Free Like TikTok ✨          ║
  ║   Server running on port ${PORT}            ║
  ║   http://localhost:${PORT}                  ║
  ╚══════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
