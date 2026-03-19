const axios = require('axios');

const TARGET_URL = 'http://localhost:3000/api/claim';
const FAKE_TOKEN = 'test-token-12345';
const TIKTOK_URL = 'https://www.tiktok.com/@username/video/1234567890';

async function testScrape() {
  console.log('--- Mulai Test Scrape (Simulasi Bot/Scraper) ---');
  
  try {
    console.log(`\n> Mencoba menembak API ${TARGET_URL} tanpa Origin / Referer yang benar...`);
    
    // Request tanpa header Origin atau Referer yang valid (seperti layaknya scraper/bot biasa)
    const response = await axios.post(TARGET_URL, {
      url: TIKTOK_URL,
      token: FAKE_TOKEN
    }, {
      // Axios melempar error untuk status code 4xx dan 5xx secara default
      // Kita set validateStatus agar tidak throw exception untuk melihat response dari server
      validateStatus: function (status) {
        return status >= 200 && status <= 500;
      }
    });

    console.log(`Status Code Asli: ${response.status}`);
    console.log('Response Body:', response.data);

    if (response.status === 403 || response.status === 500) {
      console.log('✅ BERHASIL DIBLOKIR! Request bot/scraper ditolak karena restrictions (CORS/Referer).');
    } else {
      console.log('❌ GAGAL DIBLOKIR! Scraper bisa mengakses API.');
    }

  } catch (error) {
    console.error('Terjadi error saat request:', error.message);
  }
}

testScrape();
