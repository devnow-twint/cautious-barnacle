require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

async function initDatabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials missing in .env');
  }
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('  ✅ Connected to Supabase');
  return supabase;
}

async function canClaim(ip) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('claims')
    .select('claimed_at')
    .eq('ip', ip)
    .gt('claimed_at', twentyFourHoursAgo)
    .order('claimed_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('canClaim error', error);
    return { allowed: false, message: 'Terjadi kesalahan database.' };
  }

  if (data && data.length > 0) {
    return {
      allowed: false,
      lastClaim: data[0].claimed_at,
      message: 'Kamu sudah claim hari ini. Coba lagi besok ya! 💎'
    };
  }
  return { allowed: true };
}

async function saveClaim(ip, url, count, status = 'pending') {
  const { data, error } = await supabase
    .from('claims')
    .insert([{ ip, tiktok_url: url, likes_count: count, status }])
    .select('id');

  if (error) {
    console.error('saveClaim error', error);
    throw error;
  }
  return { lastInsertRowid: data[0].id };
}

async function updateClaimStatus(id, status) {
  const { error } = await supabase
    .from('claims')
    .update({ status })
    .eq('id', id);
  
  if (error) {
    console.error('updateClaimStatus error', error);
  }
}
async function deleteClaim(id) {
  const { error } = await supabase
    .from('claims')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('deleteClaim error', error);
  }
}

async function getConfig(key) {
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', key)
    .single();

  if (error || !data) {
    return null;
  }
  return data.value;
}

async function setConfig(key, value) {
  const { error } = await supabase
    .from('config')
    .upsert([{ key, value }]); 
  
  if (error) {
    console.error('setConfig error', error);
  }
}

async function savePageLoad(ip, token) {
  // Clean old tokens (> 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabase
    .from('page_loads')
    .delete()
    .lt('loaded_at', oneHourAgo);

  const { error } = await supabase
    .from('page_loads')
    .insert([{ ip, token }]);
    
  if (error) {
    console.error('savePageLoad error', error);
  }
}

async function validateDelay(ip, token, minDelaySeconds = 10) {
  const { data, error } = await supabase
    .from('page_loads')
    .select('loaded_at')
    .eq('ip', ip)
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false, message: 'Sesi tidak valid. Refresh halaman dan coba lagi.' };
  }

  const loadedAt = new Date(data.loaded_at);
  const now = new Date();
  const diffSeconds = (now - loadedAt) / 1000;

  if (diffSeconds < minDelaySeconds) {
    return {
      valid: false,
      message: `Terlalu cepat! Tunggu ${Math.ceil(minDelaySeconds - diffSeconds)} detik lagi.`
    };
  }

  // Delete used token
  await supabase
    .from('page_loads')
    .delete()
    .eq('token', token);

  return { valid: true };
}

async function getAllClaims(limit = 50) {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .order('claimed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getAllClaims error', error);
    return [];
  }
  return data;
}

module.exports = {
  initDatabase,
  canClaim,
  saveClaim,
  updateClaimStatus,
  deleteClaim,
  getConfig,
  setConfig,
  savePageLoad,
  validateDelay,
  getAllClaims
};
