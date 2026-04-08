import { NextResponse } from 'next/server';
import axios from 'axios';
import { canClaim, saveClaim, updateClaimStatus, deleteClaim, validateDelay, getConfig } from '@/lib/database';

function getRealIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

async function checkVPN(ip) {
  const privateRanges = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];
  if (privateRanges.includes(ip) || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { isVPN: false, reason: 'Private IP' };
  }

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,proxy,hosting`, { timeout: 5000 });
    if (response.data.status === 'success') {
      const isVPN = response.data.proxy || response.data.hosting;
      return { isVPN, reason: response.data.proxy ? 'VPN/Proxy detected' : response.data.hosting ? 'Hosting/Datacenter IP' : 'Clean IP' };
    }
    return { isVPN: false, reason: 'API check inconclusive' };
  } catch (error) {
    console.error('VPN check error:', error.message);
    return { isVPN: false, reason: 'Check failed - allowing' };
  }
}

function isValidTikTokURL(url) {
  const patterns = [
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
    /^https?:\/\/vt\.tiktok\.com\/[\w]+/i,
    /^https?:\/\/(vm|vt)\.tiktok\.com\/[\w]+/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i
  ];
  return patterns.some(pattern => pattern.test(url));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { url, token } = body;
    const ip = getRealIP(req);

    if (!url || !token) {
      return NextResponse.json({ success: false, message: 'URL TikTok dan token diperlukan.' }, { status: 400 });
    }

    if (!isValidTikTokURL(url)) {
      return NextResponse.json({ success: false, message: 'URL TikTok tidak valid.' }, { status: 400 });
    }

    const vpnCheck = await checkVPN(ip);
    if (vpnCheck.isVPN) {
      return NextResponse.json({ success: false, message: '🚫 VPN/Proxy terdeteksi! Matikan VPN.', reason: vpnCheck.reason }, { status: 403 });
    }

    const delayCheck = await validateDelay(ip, token, 10);
    if (!delayCheck.valid) {
      return NextResponse.json({ success: false, message: delayCheck.message }, { status: 429 });
    }

    const claimCheck = await canClaim(ip);
    if (!claimCheck.allowed) {
      return NextResponse.json({ success: false, message: claimCheck.message }, { status: 429 });
    }

    const maxLikesConfig = await getConfig('max_likes');
    const maxLikes = parseInt(maxLikesConfig) || 20;

    const result = await saveClaim(ip, url, maxLikes, 'processing');
    const claimId = result.lastInsertRowid;

    try {
      const payload = {
        api_id: parseInt(process.env.FAYUPEDIA_API_ID),
        api_key: process.env.FAYUPEDIA_API_KEY,
        service: 1406,
        target: url,
        quantity: maxLikes
      };

      const orderRes = await axios.post('https://fayupedia.id/api/order', payload, { headers: { 'Content-Type': 'application/json' }});

      if (orderRes.data && orderRes.data.status === true) {
        await updateClaimStatus(claimId, 'success');
        return NextResponse.json({ success: true, message: `✅ Berhasil! ${maxLikes} likes sedang dikirim! 🎉`, likes: maxLikes });
      } else {
        await deleteClaim(claimId); 
        return NextResponse.json({ success: false, message: "Stok Free TikTok Like Sedang Kosong." });
      }
    } catch (apiError) {
      await deleteClaim(claimId);
      return NextResponse.json({ success: false, message: "Stok Free TikTok Like Sedang Kosong." });
    }

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
