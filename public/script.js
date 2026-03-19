/**
 * YogaxD Free Like TikTok
 * Frontend Script
 */

(function() {
  'use strict';

  // --- Elements ---
  const claimForm = document.getElementById('claimForm');
  const tiktokUrl = document.getElementById('tiktokUrl');
  const claimBtn = document.getElementById('claimBtn');
  const btnText = document.getElementById('btnText');
  const timerText = document.getElementById('timerText');
  const timerProgress = document.getElementById('timerProgress');
  const timerSection = document.getElementById('timerSection');
  const statusMessage = document.getElementById('statusMessage');
  const maxLikesDisplay = document.getElementById('maxLikesDisplay');
  const bgStars = document.getElementById('bgStars');

  // --- State ---
  let sessionToken = null;
  let delaySeconds = 12;
  let timerInterval = null;
  let isReady = false;
  let isSubmitting = false;

  // --- Generate Stars ---
  function generateStars() {
    const count = 80;
    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.classList.add('star');
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
      star.style.animationDelay = Math.random() * 5 + 's';
      star.style.width = (1 + Math.random() * 3) + 'px';
      star.style.height = star.style.width;
      bgStars.appendChild(star);
    }
  }

  // --- Initialize Session ---
  async function initSession() {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();

      if (data.success) {
        sessionToken = data.token;
        delaySeconds = data.delay;
        maxLikesDisplay.textContent = data.maxLikes;
        startTimer(delaySeconds);
      } else {
        showStatus('error', 'Gagal menginisialisasi sesi. Refresh halaman.');
      }
    } catch (err) {
      console.error('Init error:', err);
      showStatus('error', 'Gagal terhubung ke server. Refresh halaman.');
    }
  }

  // --- Timer ---
  function startTimer(seconds) {
    let remaining = seconds;
    const circumference = 2 * Math.PI * 45; // r=45
    timerText.textContent = remaining;
    timerProgress.style.strokeDasharray = circumference;
    timerProgress.style.strokeDashoffset = 0;

    timerInterval = setInterval(() => {
      remaining--;
      timerText.textContent = remaining;
      
      const progress = 1 - (remaining / seconds);
      timerProgress.style.strokeDashoffset = circumference * progress;

      if (remaining <= 0) {
        clearInterval(timerInterval);
        onTimerComplete();
      }
    }, 1000);
  }

  function onTimerComplete() {
    isReady = true;
    timerText.textContent = '✓';
    timerSection.classList.add('done');
    claimBtn.disabled = false;
    btnText.textContent = 'Claim Likes Gratis! 🎁';
    document.querySelector('.btn-icon').textContent = '🎁';
    
    // Add a little bounce
    claimBtn.style.animation = 'fadeInUp 0.4s ease-out';
  }

  // --- Form Submit ---
  claimForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isReady || isSubmitting) return;

    const url = tiktokUrl.value.trim();

    // Client-side validation
    if (!isValidTikTokURL(url)) {
      showStatus('error', '❌ URL TikTok tidak valid! Pastikan link video TikTok yang benar.');
      return;
    }

    isSubmitting = true;
    claimBtn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Memproses...';
    hideStatus();

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, token: sessionToken })
      });

      const data = await res.json();

      if (data.success) {
        showStatus('success', data.message);
        claimBtn.disabled = true;
        btnText.textContent = '✅ Sudah Diklaim!';
        document.querySelector('.btn-icon').textContent = '✅';
        tiktokUrl.disabled = true;
      } else {
        showStatus('error', data.message || 'Terjadi kesalahan.');
        // Re-enable only if it's not a daily limit issue
        if (res.status !== 429) {
          claimBtn.disabled = false;
          btnText.textContent = 'Claim Likes Gratis! 🎁';
          document.querySelector('.btn-icon').textContent = '🎁';
        } else {
          btnText.textContent = '⏳ Coba Lagi Besok';
          document.querySelector('.btn-icon').textContent = '⏳';
        }
      }
    } catch (err) {
      console.error('Claim error:', err);
      showStatus('error', '⚠️ Gagal terhubung ke server. Periksa koneksi internet kamu.');
      claimBtn.disabled = false;
      btnText.textContent = 'Claim Likes Gratis! 🎁';
      document.querySelector('.btn-icon').textContent = '🎁';
    }

    isSubmitting = false;
  });

  // --- Validate TikTok URL ---
  function isValidTikTokURL(url) {
    const patterns = [
      /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
      /^https?:\/\/vt\.tiktok\.com\/[\w]+/i,
      /^https?:\/\/(vm|vt)\.tiktok\.com\/[\w]+/i,
      /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i
    ];
    return patterns.some(p => p.test(url));
  }

  // --- Status Messages ---
  function showStatus(type, message) {
    statusMessage.className = `status-message ${type}`;
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden');
  }

  function hideStatus() {
    statusMessage.classList.add('hidden');
  }

  // --- Disable right-click (light anti-inspect) ---
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // --- Disable some dev tools shortcuts ---
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') e.preventDefault();
    // Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.key === 'I') e.preventDefault();
    // Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && e.key === 'J') e.preventDefault();
    // Ctrl+U
    if (e.ctrlKey && e.key === 'u') e.preventDefault();
  });

  // --- Init ---
  generateStars();
  initSession();

})();
