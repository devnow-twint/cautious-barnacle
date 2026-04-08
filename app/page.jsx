'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [sessionToken, setSessionToken] = useState(null);
  const [delaySeconds, setDelaySeconds] = useState(12);
  const [maxLikes, setMaxLikes] = useState(20);
  const [remainingTime, setRemainingTime] = useState(12);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  
  const timerInterval = useRef(null);

  // Generate background stars
  useEffect(() => {
    const bgStars = document.getElementById('bgStars');
    if (!bgStars) return;
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
  }, []);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch('/api/init');
        const data = await res.json();
        
        if (data.success) {
          setSessionToken(data.token);
          setDelaySeconds(data.delay);
          setMaxLikes(data.maxLikes);
          setRemainingTime(data.delay);
        } else {
          setStatus({ type: 'error', message: 'Gagal menginisialisasi sesi. Refresh halaman.' });
        }
      } catch (err) {
        console.error('Init error:', err);
        setStatus({ type: 'error', message: 'Gagal terhubung ke server. Refresh halaman.' });
      }
    };
    initSession();
  }, []);

  // Timer logic
  useEffect(() => {
    if (sessionToken && remainingTime > 0) {
      timerInterval.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            setIsReady(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [sessionToken]);

  const progress = 1 - (remainingTime / delaySeconds);
  const circumference = 2 * Math.PI * 45;

  const isValidTikTokURL = (val) => {
    const patterns = [
      /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
      /^https?:\/\/vt\.tiktok\.com\/[\w]+/i,
      /^https?:\/\/(vm|vt)\.tiktok\.com\/[\w]+/i,
      /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w]+/i
    ];
    return patterns.some(p => p.test(val));
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!isReady || isSubmitting) return;

    if (!isValidTikTokURL(url.trim())) {
      setStatus({ type: 'error', message: '❌ URL TikTok tidak valid! Pastikan link video TikTok yang benar.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), token: sessionToken })
      });

      const data = await res.json();

      if (data.success) {
        setStatus({ type: 'success', message: data.message });
      } else {
        setStatus({ type: 'error', message: data.message || 'Terjadi kesalahan.' });
      }
    } catch (err) {
      console.error('Claim error:', err);
      setStatus({ type: 'error', message: '⚠️ Gagal terhubung ke server. Periksa koneksi internet kamu.' });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div id="bgStars" className="background-anim"></div>
      
      <div className="decor-shape shape-1"></div>
      <div className="decor-shape shape-2"></div>
      <div className="decor-shape shape-3"></div>

      <div className="container">
        <header className="header">
          <h1 className="title">
            <span className="title-free">YogaxD</span>
            <span className="title-tiktok">Free Like TikTok</span>
          </h1>
          <p className="subtitle amiri">Dapatkan ribuan likes secara instan!</p>
          <div className="badge">
            <span className="badge-icon">🎁</span>
            <span>Gratis <strong>{maxLikes}</strong> Likes!</span>
          </div>
        </header>

        <main className="claim-card">
          <div className="card-header">
            <h2>🎉 Claim Likes Gratis</h2>
            <p>Masukkan link video TikTok kamu di bawah ini</p>
          </div>

          <form id="claimForm" onSubmit={handleClaim} autoComplete="off">
            <div className="input-group">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <input 
                type="url" 
                id="tiktokUrl" 
                placeholder="https://www.tiktok.com/@username/video/..." 
                required
                autoComplete="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={status.type === 'success'}
              />
            </div>

            <div className={`timer-section ${isReady ? 'done' : ''}`} id="timerSection">
              <div className="timer-ring">
                <svg viewBox="0 0 100 100">
                  <circle className="timer-bg" cx="50" cy="50" r="45"/>
                  <circle 
                    className="timer-progress" 
                    cx="50" cy="50" r="45"
                    style={{ strokeDasharray: circumference, strokeDashoffset: circumference * progress }}
                  />
                </svg>
                <div className="timer-text">{isReady ? '✓' : remainingTime || '--'}</div>
              </div>
              <p className="timer-label">
                {isReady ? 'Sip! Siap diklaim! 🚀' : 'Tunggu sebentar ya... ⏳'}
              </p>
            </div>

            <button 
              type="submit" 
              className="claim-btn" 
              disabled={!isReady || isSubmitting || status.type === 'success'}
              style={{ animation: isReady ? 'fadeInUp 0.4s ease-out' : 'none' }}
            >
              <span className="btn-content">
                <span className="btn-icon">
                  {status.type === 'success' ? '✅' : isSubmitting ? '⏳' : isReady ? '🎁' : '🔒'}
                </span>
                <span className="btn-text">
                  {status.type === 'success' ? '✅ Sudah Diklaim!' : isSubmitting ? 'Memproses...' : isReady ? 'Claim Likes Gratis! 🎁' : 'Tunggu Timer...'}
                </span>
              </span>
            </button>
          </form>

          {status.message && (
            <div className={`status-message ${status.type}`}>
              {status.message}
            </div>
          )}
        </main>

        <section className="features">
          <div className="feature-item">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">
              <h3>Instant</h3>
              <p>Likes langsung dikirim</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🛡️</div>
            <div className="feature-text">
              <h3>Aman</h3>
              <p>100% aman & gratis</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">💎</div>
            <div className="feature-text">
              <h3>Eksklusif</h3>
              <p>1x claim per hari</p>
            </div>
          </div>
        </section>

        <footer className="footer">
          <p className="copyright">&copy; 2026 YogaxD Free Like TikTok</p>
        </footer>
      </div>
    </>
  );
}
