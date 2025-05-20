
# WhatsApp Bot - Prodi Teknik Komputer AMIKOM Yogyakarta

Chatbot WhatsApp interaktif untuk menyediakan informasi dan layanan terkait Program Studi Teknik Komputer di Universitas AMIKOM Yogyakarta. Bot ini dirancang untuk melayani Mahasiswa, Dosen, serta Calon Mahasiswa dan Orang Tua Wali.

### Requierments
• Node 22.14.0
• npm
• git

### Node.js & npm Installation

Disarankan menggunakan nvm (Node Version Manager)

```bash
sudo apt update
sudo apt install -y curl

#install nvm
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash

#restart terminal

#install the LTS Version
nvm install --lts 
nvm alias default 'lts/*'
```
    
### Puppeteer Installation

```bash
sudo apt update
sudo apt install -y \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 \
    libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    lsb-release wget xdg-utils gconf-service libappindicator1 libdbusmenu-glib4 \
    libdbusmenu-gtk4 libindicator7 libnss3-tools libpango1.0-0 libu2f-udev

```

Catatan: Argumen --no-sandbox yang ada di app.js untuk Puppeteer seringkali diperlukan untuk lingkungan server/kontainer.
### After Cloning
```bash
npm install
```
### How To Run?
```bash
node app.js
```