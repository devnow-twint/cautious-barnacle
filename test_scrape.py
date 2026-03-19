import requests

TARGET_URL = 'http://localhost:3000/api/claim'
TIKTOK_URL = 'https://www.tiktok.com/@bupati_xyz/video/1234567890'
TOKEN = 'test-token-dari-python'

print("--- Mulai Test Scrape (Python) ---")
print(f"> Mencoba request POST ke {TARGET_URL} tanpa header Referer")

# Data payload untuk request
payload = {
    "url": TIKTOK_URL,
    "token": TOKEN
}

# Request menggunakan requests (secara default tidak mengirim header Referer / Origin yang di-allow)
try:
    response = requests.post(TARGET_URL, json=payload)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 403 or response.status_code == 500:
        print("\n✅ BERHASIL DIBLOKIR! Python bot ditolak aksesnya oleh server.")
    else:
        print("\n❌ GAGAL DIBLOKIR! Python bot berhasil mengakses API.")

except Exception as e:
    print(f"Terjadi error saat request: {e}")
