WhatsApp Bot - Prodi Teknik Komputer AMIKOM Yogyakarta
Chatbot WhatsApp interaktif untuk menyediakan informasi dan layanan terkait Program Studi Teknik Komputer di Universitas AMIKOM Yogyakarta. Bot ini dirancang untuk melayani Mahasiswa, Dosen, serta Calon Mahasiswa dan Orang Tua Wali.

Daftar Isi
Fitur Utama

Struktur Proyek

Prasyarat

Instalasi di Server Linux

1. Instalasi Node.js & npm

2. Instalasi Dependensi Puppeteer

3. Dapatkan Kode Proyek

4. Instalasi Dependensi Proyek

Konfigurasi Bot

Menjalankan Bot

Menjalankan Awal & Pemindaian Kode QR

Menjalankan Secara Persisten dengan PM2

Manajemen Sesi

Memperbarui Bot

Pemecahan Masalah

Berkontribusi

Lisensi

Fitur Utama
Menu Berbasis Peran: Layanan yang disesuaikan untuk Mahasiswa, Dosen, dan Calon Mahasiswa/Wali.

Pencarian Dosen Wali: Berdasarkan NPM/NIM atau Nama Mahasiswa (data bersumber dari file CSV).

Informasi Akademik: Akses ke berbagai layanan seperti KRS Manual, Info Skripsi, Layanan Magang, Permohonan Cuti, dll.

Info PMB & Profil Prodi: Detail mengenai Penerimaan Mahasiswa Baru dan profil program studi.

Jadwal & Tugas Akhir: Link dan informasi terkait jadwal kuliah dan tugas akhir.

Eskalasi ke Admin: Fitur untuk berbicara langsung dengan Admin Prodi, dilengkapi dengan pengecekan jam kerja.

Perintah Global "Brosur": Pengguna dapat mengetik "brosur" untuk mendapatkan link brosur digital.

Navigasi Mudah: Opsi "0" untuk kembali ke menu sebelumnya dan "00" untuk kembali ke menu utama (pemilihan peran).

Struktur Proyek
.
├── app.js                   # Logika utama bot
├── data.js                  # String pesan dan menu bot
├── dosen_wali_data/         # Direktori untuk file CSV data Dosen Wali
│   ├── DAFTAR DOSEN WALI - Pak Banu.csv
│   └── ... (file CSV lainnya)
├── package.json             # Dependensi proyek dan skrip
├── package-lock.json        # Versi dependensi yang terkunci
└── README.md                # File ini

Prasyarat
Sebelum melakukan deployment ke server Linux, pastikan Anda memiliki:

Akses SSH ke server Linux Anda (distribusi berbasis Debian/Ubuntu diasumsikan untuk perintah apt).

Node.js versi LTS (misalnya, 20.x atau yang lebih baru).

npm (Node Package Manager, biasanya terinstal bersama Node.js).

(Opsional) Git, jika Anda mengelola kode melalui repositori Git.

Instalasi di Server Linux
Ikuti langkah-langkah ini untuk menyiapkan bot di server Linux Anda.

1. Instalasi Node.js & npm
Disarankan menggunakan nvm (Node Version Manager) untuk kemudahan pengelolaan versi Node.js.

# Perbarui daftar paket sistem
sudo apt update

# Instal curl jika belum ada
sudo apt install -y curl

# Instal nvm
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash

# Aktifkan nvm (atau tutup dan buka kembali terminal Anda)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Verifikasi instalasi nvm
command -v nvm

# Instal versi LTS terbaru Node.js dan atur sebagai default
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'

# Verifikasi instalasi Node.js dan npm
node -v
npm -v

2. Instalasi Dependensi Puppeteer
whatsapp-web.js menggunakan Puppeteer, yang memerlukan beberapa pustaka sistem agar dapat berjalan dengan benar di server headless.

sudo apt update
sudo apt install -y \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
    libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    lsb-release wget xdg-utils gconf-service libappindicator1 libdbusmenu-glib4 \
    libdbusmenu-gtk4 libindicator7 libnss3-tools libpango1.0-0 libu2f-udev

Catatan: Argumen --no-sandbox yang ada di app.js untuk Puppeteer seringkali diperlukan untuk lingkungan server/kontainer.

3. Dapatkan Kode Proyek
Pindahkan file proyek Anda ke server. Anda bisa menggunakan Git atau scp.

Menggunakan Git (Direkomendasikan):

# Buat direktori untuk bot Anda
mkdir -p /home/nama_user_anda/whatsapp-bot-tekkom
cd /home/nama_user_anda/whatsapp-bot-tekkom

# Kloning repositori Anda
git clone [https://github.com/username_anda/nama_repositori_anda.git](https://github.com/username_anda/nama_repositori_anda.git) .

Menggunakan scp (Secure Copy):
Dari mesin lokal Anda, jalankan:

scp -r /path/lokal/proyek_bot/ pengguna_anda@ip_server_anda:/home/pengguna_anda/whatsapp-bot-tekkom

4. Instalasi Dependensi Proyek
Setelah kode berada di server, arahkan ke direktori proyek dan instal paket Node.js yang diperlukan.

cd /home/nama_user_anda/whatsapp-bot-tekkom
npm install

Ini akan menginstal whatsapp-web.js, qrcode-terminal, csv-parse, dan dependensi lain yang tercantum di package.json.

Konfigurasi Bot
Sebelum menjalankan bot, beberapa konfigurasi perlu disesuaikan:

ID WhatsApp Agen (AGENT_WHATSAPP_ID):
Buka file app.js dan temukan konstanta AGENT_WHATSAPP_ID. Ganti nilainya dengan nomor WhatsApp admin/agen yang akan menerima notifikasi eskalasi. Formatnya adalah kode negara diikuti nomor telepon, diakhiri dengan @c.us (misalnya, '6281234567890@c.us').

Data Dosen Wali (File CSV):

Pastikan direktori dosen_wali_data/ ada di lokasi yang sama dengan app.js.

Tempatkan semua file .csv yang berisi data Dosen Wali dan mahasiswa di dalam direktori ini. Bot akan memuat data dari file-file ini saat dimulai. Format nama file diasumsikan seperti DAFTAR DOSEN WALI - Nama Dosen.csv.

Konten Informasi di data.js:

Buka file data.js.

Tinjau semua konstanta string pesan (misalnya, infoKrsManual, pmbInfo, dll.).

Sangat penting: Ganti semua teks placeholder yang ditandai dengan kurung siku (misalnya, [LINK_MATKUL_DITAWARKAN], [Detail Kurikulum dan Spesialisasi]) dengan URL, informasi kontak, dan detail aktual untuk Prodi Teknik Komputer.

Menjalankan Bot
Menjalankan Awal & Pemindaian Kode QR
Untuk penggunaan pertama kali, Anda perlu menjalankan bot secara langsung di terminal untuk memindai kode QR WhatsApp:

cd /home/nama_user_anda/whatsapp-bot-tekkom
node app.js

Sebuah kode QR akan muncul di terminal Anda.

Buka aplikasi WhatsApp di ponsel Anda.

Masuk ke Pengaturan > Perangkat Tertaut > Tautkan perangkat.

Pindai kode QR yang ditampilkan di terminal.

Setelah berhasil, bot akan membuat folder sesi (biasanya .wwebjs_auth/) untuk menyimpan detail autentikasi. Anda akan melihat pesan seperti "Klien WhatsApp siap!" dan "Bot aktif..." di log.

Hentikan bot dengan menekan Ctrl+C setelah autentikasi berhasil dan sesi disimpan.

Menjalankan Secara Persisten dengan PM2
Untuk menjaga bot tetap berjalan di latar belakang dan otomatis restart jika terjadi crash, gunakan manajer proses seperti PM2.

Instal PM2 secara global (jika belum):

sudo npm install pm2 -g

Mulai bot dengan PM2:
Dari direktori proyek Anda:

pm2 start app.js --name "whatsapp-bot-tekkom"

Anda dapat mengganti "whatsapp-bot-tekkom" dengan nama proses yang Anda inginkan.

Perintah PM2 yang Berguna:

pm2 list: Menampilkan semua proses yang dikelola PM2.

pm2 logs whatsapp-bot-tekkom: Melihat log bot secara real-time.

pm2 stop whatsapp-bot-tekkom: Menghentikan bot.

pm2 restart whatsapp-bot-tekkom: Me-restart bot.

pm2 delete whatsapp-bot-tekkom: Menghentikan dan menghapus bot dari daftar PM2.

pm2 startup: Mengkonfigurasi PM2 agar otomatis berjalan saat server reboot (ikuti instruksi yang muncul).

pm2 save: Menyimpan daftar proses PM2 saat ini (gunakan setelah pm2 startup).

Manajemen Sesi
Folder .wwebjs_auth/ (atau nama serupa tergantung konfigurasi LocalAuth Anda) berisi informasi sesi WhatsApp Anda.

Jangan hapus folder ini kecuali Anda ingin melakukan autentikasi ulang dengan memindai kode QR.

Jika Anda menggunakan Git, tambahkan folder ini ke file .gitignore Anda untuk menghindari komitmen data sesi yang sensitif:

# .gitignore
node_modules/
.wwebjs_auth/

Memperbarui Bot
Untuk memperbarui kode bot di server:

Dapatkan kode terbaru:

Jika menggunakan Git: git pull origin <nama-cabang-anda> (misalnya, main atau master).

Jika menggunakan scp: Unggah ulang file-file yang telah diubah ke server.

Instal/Perbarui dependensi (jika ada perubahan pada package.json):

npm install

Restart bot menggunakan PM2:

pm2 restart whatsapp-bot-tekkom

Pemecahan Masalah
Kode QR tidak tampil dengan benar: Pastikan jendela terminal Anda cukup besar dan ukuran font memungkinkan kode QR terlihat jelas.

Error terkait Puppeteer/Chromium: Verifikasi kembali bahwa semua dependensi Puppeteer (lihat Langkah 2 Instalasi) telah terinstal. Argumen --no-sandbox di app.js biasanya diperlukan di server.

Bot crash atau tidak berjalan: Periksa log menggunakan pm2 logs whatsapp-bot-tekkom untuk pesan error. Ini dapat membantu mengidentifikasi masalah dalam kode, file yang hilang (seperti file CSV data Dosen Wali), atau masalah dependensi.

Peringatan "Tidak ada data Dosen Wali yang dimuat": Pastikan direktori dosen_wali_data/ ada di lokasi yang benar (sejajar dengan app.js) dan berisi file CSV yang valid dengan struktur yang diharapkan oleh skrip.
