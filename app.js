// app.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const menuData = require('./data');

const usersInHumanSession = new Set();
const sessionTimers = new Map();
const SESSION_TIMEOUT_MS = 2 * 60 * 1000;

const userActivityTimers = new Map();
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

const userState = new Map();

const AGENT_WHATSAPP_ID = '6285726106817@c.us'; // <--- GANTI jika perlu
if (AGENT_WHATSAPP_ID === 'YOUR_AGENT_WHATSAPP_ID@c.us') {
    console.warn("PERINGATAN: AGENT_WHATSAPP_ID tidak diatur di app.js!");
}

let dosenWaliDataStore = new Map(); 

const backToMainMenuPrompt = "\n\nKetik 00 untuk kembali ke menu utama (pilihan peran).";

function getPhoneNumber(fullId) {
    if (fullId && typeof fullId === 'string' && fullId.includes('@')) {
        return fullId.split('@')[0];
    }
    return fullId;
}

async function loadDosenWaliData() {
    console.log("Memuat data Dosen Wali dari file CSV...");
    dosenWaliDataStore.clear(); 
    const dosenWaliCsvDir = path.join(__dirname, 'dosen_wali_data');
    try {
        if (!fs.existsSync(dosenWaliCsvDir)) {
            console.error(`Direktori tidak ditemukan: ${dosenWaliCsvDir}.`);
            return;
        }
        const files = fs.readdirSync(dosenWaliCsvDir);
        for (const file of files) {
            if (path.extname(file).toLowerCase() === '.csv') {
                const filePath = path.join(dosenWaliCsvDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const records = parse(fileContent, { columns: false, skip_empty_lines: true, trim: true, relax_column_count: true });

                if (records.length < 6) continue;

                const namaDosen = records[0]?.[1]?.trim() || 'N/A';
                const waDosen = records[2]?.[1]?.trim() || '';
                const emailDosen = records[3]?.[1]?.trim() || '';

                let studentDataStartIndex = -1;
                for (let i = 0; i < records.length; i++) {
                    if (records[i]?.[0]?.toLowerCase().includes('no') && records[i]?.[1]?.toLowerCase().includes('npm') && records[i]?.[2]?.toLowerCase().includes('nama')) {
                        studentDataStartIndex = i + 1;
                        break;
                    }
                }
                if (studentDataStartIndex === -1 || studentDataStartIndex >= records.length) continue;

                for (let i = studentDataStartIndex; i < records.length; i++) {
                    const record = records[i];
                    if (record && record[1] && record[2]) { 
                        const npm = record[1].trim();
                        const namaMahasiswa = record[2].trim().toLowerCase(); 
                        if (npm && namaMahasiswa) {
                            if (!dosenWaliDataStore.has(npm)) { 
                                dosenWaliDataStore.set(npm, { npm, namaMahasiswa, namaDosen, waDosen, emailDosen });
                            }
                        }
                    }
                }
            }
        }
        console.log(`Pemuatan data Dosen Wali selesai. Total entri unik: ${dosenWaliDataStore.size}`);
        if (dosenWaliDataStore.size === 0) console.warn("Tidak ada data Dosen Wali yang dimuat.");
    } catch (error) {
        console.error("Gagal memuat data Dosen Wali:", error);
    }
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions'] }
});

async function endHumanSession(userId, reason = "resolved") {
    if (usersInHumanSession.has(userId)) {
        usersInHumanSession.delete(userId);
        userState.delete(userId);
        userState.delete(userId + '_previous_menu_before_handover');
        userState.delete(userId + '_return_to_after_dosenwali'); 
        console.log(`Sesi manusia untuk ${getPhoneNumber(userId)} berakhir. Alasan: ${reason}`);
        if (sessionTimers.has(userId)) {
            clearTimeout(sessionTimers.get(userId));
            sessionTimers.delete(userId);
        }
        return true;
    }
    return false;
}

async function triggerHumanHandover(userId, originalMessage, context = "Customer Service") {
    const now = new Date();
    const currentHourWIB = parseInt(now.toLocaleString('id-ID', { hour: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }));
    const currentDayWIB = now.getDay(); // Minggu = 0, Senin = 1, ..., Sabtu = 6
    
    // --- PERUBAHAN JAM KERJA ---
    const workingHoursStart = 8;  // 8 AM
    const workingHoursEnd = 16;   // 4 PM (layanan tersedia hingga 15:59:59)
    // --- AKHIR PERUBAHAN JAM KERJA ---

    const isWorkingDay = currentDayWIB >= 1 && currentDayWIB <= 5; // Senin - Jumat

    if (!isWorkingDay || currentHourWIB < workingHoursStart || currentHourWIB >= workingHoursEnd) {
        // Pesan offline menggunakan csOfflineMessage dari data.js yang sudah diupdate
        await originalMessage.reply(menuData.csOfflineMessage); 
        const previousMenuState = userState.get(userId + '_previous_menu_before_handover');
        
        if (previousMenuState) {
            userState.set(userId, previousMenuState);
            if (previousMenuState === 'mahasiswa_menu') await client.sendMessage(userId, `\n${menuData.mahasiswaMenu}`);
            else if (previousMenuState === 'dosen_menu') await client.sendMessage(userId, `\n${menuData.dosenMenu}`);
            else if (previousMenuState === 'calon_mahasiswa_menu') await client.sendMessage(userId, `\n${menuData.calonMahasiswaMenu}`);
            else if (previousMenuState === 'info_layanan_prodi_umum_submenu') await client.sendMessage(userId, `\n${menuData.infoLayananProdiUmumSubMenu}`);
            else {
                userState.set(userId, 'awaiting_role_at_start');
                await client.sendMessage(userId, `\n${menuData.roleSelectionQuestion}`);
            }
        } else {
            userState.set(userId, 'awaiting_role_at_start');
            await client.sendMessage(userId, `\n${menuData.roleSelectionQuestion}`);
        }
        userState.delete(userId + '_previous_menu_before_handover');
        return;
    }

    if (userActivityTimers.has(userId)) {
        clearTimeout(userActivityTimers.get(userId));
        userActivityTimers.delete(userId);
    }
    usersInHumanSession.add(userId);
    userState.delete(userId); 

    // --- PERUBAHAN PESAN JAM LAYANAN ---
    await originalMessage.reply(`Baik, mohon tunggu sebentar. Kami akan segera menghubungkan Anda dengan ${context}. Jam layanan: 08:00 - 16:00 WIB (Senin-Jumat).`);
    // --- AKHIR PERUBAHAN PESAN JAM LAYANAN ---

    if (AGENT_WHATSAPP_ID && AGENT_WHATSAPP_ID !== 'YOUR_AGENT_WHATSAPP_ID@c.us') {
        const userPhoneNumberForAgent = getPhoneNumber(userId);
        const notificationMessage = `Permintaan Bantuan ${context}:\n\nPengguna: ${userPhoneNumberForAgent}\nWaktu: ${now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\nSilakan hubungi nomor ini secara manual.\n\nSesi akan otomatis berakhir dalam ${SESSION_TIMEOUT_MS / 60000} menit jika tidak di-resolve.\nKetik '/resolve ${userPhoneNumberForAgent}' setelah selesai.`;
        try {
            await client.sendMessage(AGENT_WHATSAPP_ID, notificationMessage);
            console.log(`Notifikasi dikirim ke agen untuk ${userPhoneNumberForAgent}`);
        } catch (agentSendError) {
            console.error(`Gagal mengirim notifikasi ke agen:`, agentSendError);
            await originalMessage.reply("Maaf, terjadi kendala saat menghubungi admin.");
            usersInHumanSession.delete(userId);
            const prevMenu = userState.get(userId + '_previous_menu_before_handover') || 'awaiting_role_at_start';
            userState.set(userId, prevMenu);
            if (prevMenu === 'mahasiswa_menu') await client.sendMessage(userId, `\n${menuData.mahasiswaMenu}`);
            else if (prevMenu === 'dosen_menu') await client.sendMessage(userId, `\n${menuData.dosenMenu}`);
            else if (prevMenu === 'calon_mahasiswa_menu') await client.sendMessage(userId, `\n${menuData.calonMahasiswaMenu}`);
            else if (prevMenu === 'info_layanan_prodi_umum_submenu') await client.sendMessage(userId, `\n${menuData.infoLayananProdiUmumSubMenu}`);
            else await client.sendMessage(userId, `\n${menuData.roleSelectionQuestion}`);
            userState.delete(userId + '_previous_menu_before_handover');
            return;
        }

        if (sessionTimers.has(userId)) clearTimeout(sessionTimers.get(userId));
        const handoverTimerId = setTimeout(async () => {
            if (usersInHumanSession.has(userId)) {
                await endHumanSession(userId, "handover_timeout");
                await client.sendMessage(userId, `Mohon maaf, ${context} tidak merespon. Sesi ditutup.`);
                userState.set(userId, 'awaiting_role_at_start');
                await client.sendMessage(userId, `\n${menuData.roleSelectionQuestion}`);
            }
        }, SESSION_TIMEOUT_MS);
        sessionTimers.set(userId, handoverTimerId);
    } else {
        console.error("AGENT_WHATSAPP_ID tidak diatur.");
        await originalMessage.reply("Maaf, sistem notifikasi admin sedang bermasalah.");
        usersInHumanSession.delete(userId);
        const prevMenu = userState.get(userId + '_previous_menu_before_handover') || 'awaiting_role_at_start';
        userState.set(userId, prevMenu);
        if (prevMenu === 'mahasiswa_menu') await client.sendMessage(userId, `\n${menuData.mahasiswaMenu}`);
        else if (prevMenu === 'dosen_menu') await client.sendMessage(userId, `\n${menuData.dosenMenu}`);
        else if (prevMenu === 'calon_mahasiswa_menu') await client.sendMessage(userId, `\n${menuData.calonMahasiswaMenu}`);
        else if (prevMenu === 'info_layanan_prodi_umum_submenu') await client.sendMessage(userId, `\n${menuData.infoLayananProdiUmumSubMenu}`);
        else await client.sendMessage(userId, `\n${menuData.roleSelectionQuestion}`);
    }
    userState.delete(userId + '_previous_menu_before_handover');
}

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('authenticated', () => console.log('TERAUTENTIKASI'));
client.on('auth_failure', msg => console.error('GAGAL AUTENTIKASI', msg));
client.on('ready', async () => {
    console.log('Klien WhatsApp siap!');
    await loadDosenWaliData();
    console.log(`Bot aktif pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
});

client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const userId = message.from;
        const userChoice = message.body.trim();
        const userChoiceLower = userChoice.toLowerCase();

        if (chat.isGroup || message.fromMe || message.isStatus) return;

        const currentPhoneNumber = getPhoneNumber(userId);
        console.log(`Pesan dari ${currentPhoneNumber} (State: ${userState.get(userId) || 'no_state'}): "${userChoice}"`);

        if (userId === AGENT_WHATSAPP_ID) {
            if (userChoiceLower.startsWith('/resolve ')) {
                const idToResolve = userChoice.substring(9).trim();
                const fullIdToResolve = idToResolve.includes('@') ? idToResolve : idToResolve + '@c.us';
                if (await endHumanSession(fullIdToResolve, "agent resolved")) {
                    await client.sendMessage(AGENT_WHATSAPP_ID, `Sesi untuk ${getPhoneNumber(fullIdToResolve)} ditutup.`);
                    await client.sendMessage(fullIdToResolve, `Sesi Anda dengan Admin Prodi telah berakhir. Bot aktif kembali.\n\n${menuData.initialGreeting}\n${menuData.roleSelectionQuestion}`);
                    userState.set(fullIdToResolve, 'awaiting_role_at_start');
                } else {
                    await client.sendMessage(AGENT_WHATSAPP_ID, `User ${getPhoneNumber(idToResolve)} tidak dalam sesi aktif.`);
                }
            } else {
                 await client.sendMessage(AGENT_WHATSAPP_ID, `Perintah tidak dikenali. Gunakan '/resolve <nomor pengguna>'`);
            }
            return;
        }

        if (usersInHumanSession.has(userId)) return;

        if (userChoiceLower === 'brosur' || userChoiceLower === 'brosus') {
            console.log(`User ${currentPhoneNumber} meminta brosur.`);
            await message.reply(menuData.brosurMessage + backToMainMenuPrompt);
            userState.set(userId, 'awaiting_role_at_start'); 
            if (userActivityTimers.has(userId)) clearTimeout(userActivityTimers.get(userId));
            const activityTimerIdBrosur = setTimeout(async () => { 
                if (!usersInHumanSession.has(userId)) {
                    userState.delete(userId);
                    await client.sendMessage(userId, "Sesi berakhir karena tidak ada aktivitas. Ketik pesan untuk memulai lagi.");
                }
             }, INACTIVITY_TIMEOUT_MS);
            userActivityTimers.set(userId, activityTimerIdBrosur);
            return; 
        }
        
        if (userActivityTimers.has(userId)) clearTimeout(userActivityTimers.get(userId));
        const activityTimerId = setTimeout(async () => {
            if (!usersInHumanSession.has(userId)) {
                userState.delete(userId);
                userState.delete(userId + '_previous_menu_before_handover');
                userState.delete(userId + '_return_to_after_dosenwali');
                await client.sendMessage(userId, "Sesi berakhir karena tidak ada aktivitas. Ketik pesan untuk memulai lagi.");
                console.log(`Timeout inaktivitas untuk ${currentPhoneNumber}.`);
            }
            userActivityTimers.delete(userId);
        }, INACTIVITY_TIMEOUT_MS);
        userActivityTimers.set(userId, activityTimerId);
        
        const currentState = userState.get(userId);

        if (userChoice === '00' && currentState && currentState !== 'awaiting_role_at_start') {
            console.log(`User ${currentPhoneNumber} memilih 00. Reset ke pemilihan peran utama.`);
            userState.set(userId, 'awaiting_role_at_start');
            userState.delete(userId + '_return_to_after_dosenwali'); 
            await client.sendMessage(userId, menuData.roleSelectionQuestion);
            return;
        }

        // --- LOGIKA ALUR PERCAKAPAN ---
        if (!currentState || currentState === 'awaiting_role_at_start') {
            if (!currentState) { 
                await client.sendMessage(userId, menuData.initialGreeting);
            }
            if (userChoice === '1') { 
                userState.set(userId, 'mahasiswa_menu');
                await message.reply(menuData.mahasiswaMenu);
            } else if (userChoice === '2') { 
                userState.set(userId, 'dosen_menu');
                await message.reply(menuData.dosenMenu);
            } else if (userChoice === '3') { 
                userState.set(userId, 'calon_mahasiswa_menu');
                await message.reply(menuData.calonMahasiswaMenu);
            } else { 
                userState.set(userId, 'awaiting_role_at_start'); 
                if (currentState || (!currentState && userChoice !== '')) {
                     await client.sendMessage(userId, menuData.roleSelectionQuestion);
                }
            }
        } else if (currentState === 'mahasiswa_menu') {
            if (userChoice === '0') {
                userState.set(userId, 'awaiting_role_at_start');
                await message.reply(menuData.roleSelectionQuestion);
            } else if (userChoice === '1') { 
                userState.set(userId, 'layanan_prodi_mahasiswa_menu');
                await message.reply(menuData.layananProdiMahasiswaMenu);
            } else if (userChoice === '2') { 
                userState.set(userId, 'awaiting_dosen_wali_input');
                userState.set(userId + '_return_to_after_dosenwali', 'mahasiswa_menu'); 
                await message.reply(menuData.askForNpmOrName);
            } else if (userChoice === '3') { 
                await message.reply(menuData.infoJadwalKuliah + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else if (userChoice === '4') { 
                await message.reply(menuData.infoTugasAkhirSkripsi + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else if (userChoice === '5') { 
                userState.set(userId + '_previous_menu_before_handover', 'mahasiswa_menu');
                await triggerHumanHandover(userId, message, "Pengelola Program Studi (Mahasiswa)");
            } else {
                await message.reply(`Pilihan tidak valid.\n\n${menuData.mahasiswaMenu}`);
            }
        } else if (currentState === 'layanan_prodi_mahasiswa_menu') { 
            let replyMessage = "";
            if (userChoice === '0') {
                userState.set(userId, 'mahasiswa_menu');
                await message.reply(menuData.mahasiswaMenu);
                return; 
            } else if (userChoice === '1') { replyMessage = menuData.infoKrsManual; }
            else if (userChoice === '2') { replyMessage = menuData.infoSkripsiNonReguler; }
            else if (userChoice === '3') { replyMessage = menuData.infoMagangReguler; }
            else if (userChoice === '4') { replyMessage = menuData.infoPengunduranDiri; }
            else if (userChoice === '5') { replyMessage = menuData.infoCutiKuliah; }
            else if (userChoice === '6') { replyMessage = menuData.infoHapusMatkul; }
            else if (userChoice === '7') { replyMessage = menuData.infoRevisiNilaiMahasiswaLayanan; }
            else if (userChoice === '8') { replyMessage = menuData.infoSuratPengantarPenyuluhan; }
            else if (userChoice === '9') { replyMessage = menuData.infoKonversiMatkul; }
            else {
                await message.reply(`Pilihan tidak valid.\n\n${menuData.layananProdiMahasiswaMenu}`);
                return; 
            }

            if (replyMessage) {
                await message.reply(replyMessage + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            }
        }
         else if (currentState === 'awaiting_dosen_wali_input') { 
            const returnToMenu = userState.get(userId + '_return_to_after_dosenwali') || 'awaiting_role_at_start'; 
            userState.delete(userId + '_return_to_after_dosenwali'); 

            if (userChoice === '0') { 
                userState.set(userId, returnToMenu); 
                if (returnToMenu === 'mahasiswa_menu') await message.reply(menuData.mahasiswaMenu);
                else if (returnToMenu === 'info_layanan_prodi_umum_submenu') await message.reply(menuData.infoLayananProdiUmumSubMenu);
                else await message.reply(menuData.roleSelectionQuestion); 
                return;
            }
            
            const searchTerm = userChoice.trim();
            let foundDosenEntries = [];

            if (dosenWaliDataStore.has(searchTerm.replace(/\./g, ''))) { 
                foundDosenEntries.push(dosenWaliDataStore.get(searchTerm.replace(/\./g, '')));
            } else if (dosenWaliDataStore.has(searchTerm)) { 
                foundDosenEntries.push(dosenWaliDataStore.get(searchTerm));
            }

            if (foundDosenEntries.length === 0) {
                for (const entry of dosenWaliDataStore.values()) {
                    if (entry.namaMahasiswa.toLowerCase().includes(searchTerm.toLowerCase())) {
                        foundDosenEntries.push(entry);
                    }
                }
            }

            let replyMsg;
            if (foundDosenEntries.length === 1) {
                replyMsg = menuData.formatDosenWaliInfo(foundDosenEntries[0]);
                await message.reply(replyMsg + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else if (foundDosenEntries.length > 1) {
                replyMsg = menuData.multipleStudentsFoundByNameMessage;
                await message.reply(replyMsg + "\n\n" + menuData.askForNpmOrName); 
                userState.set(userId, 'awaiting_dosen_wali_input'); 
                userState.set(userId + '_return_to_after_dosenwali', returnToMenu); 
            } else {
                replyMsg = menuData.npmOrNameNotFound;
                await message.reply(replyMsg + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            }
        } else if (currentState === 'dosen_menu') {
            if (userChoice === '0') { 
                userState.set(userId, 'awaiting_role_at_start');
                await message.reply(menuData.roleSelectionQuestion);
            } else if (userChoice === '1') { 
                await message.reply(menuData.revisiNilaiInfoDosen + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else if (userChoice === '2') { 
                await message.reply(menuData.suratTugasSpdInfo + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else if (userChoice === '3') { 
                await message.reply(menuData.formKonfirmasiTugasLuarInfo + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else if (userChoice === '4') { 
                userState.set(userId + '_previous_menu_before_handover', 'dosen_menu');
                await triggerHumanHandover(userId, message, "Admin Prodi (Dosen)");
            } else {
                await message.reply(`Pilihan tidak valid.\n\n${menuData.dosenMenu}`);
            }
        } else if (currentState === 'calon_mahasiswa_menu') {
             if (userChoice === '0') { 
                userState.set(userId, 'awaiting_role_at_start');
                await message.reply(menuData.roleSelectionQuestion);
            } else if (userChoice === '1') { 
                userState.set(userId, 'info_layanan_prodi_umum_submenu');
                await message.reply(menuData.infoLayananProdiUmumSubMenu);
            } else if (userChoice === '2') { 
                await message.reply(menuData.profilProdiTekkomInfo + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else if (userChoice === '3') { 
                await message.reply(menuData.pmbInfo + backToMainMenuPrompt);
                userState.set(userId, 'awaiting_role_at_start'); 
            } else { 
                await message.reply(`Pilihan tidak valid. Mohon pilih 1-3, 0, atau 00.\n\n${menuData.calonMahasiswaMenu}`);
            }
        } else if (currentState === 'info_layanan_prodi_umum_submenu') {
            if (userChoice === '0') { 
                userState.set(userId, 'calon_mahasiswa_menu');
                await message.reply(menuData.calonMahasiswaMenu);
            } else if (userChoice === '1') { 
                userState.set(userId, 'awaiting_dosen_wali_input');
                userState.set(userId + '_return_to_after_dosenwali', 'info_layanan_prodi_umum_submenu'); 
                await message.reply(menuData.askForNpmOrName);
            } else if (userChoice === '2') { 
                userState.set(userId + '_previous_menu_before_handover', 'info_layanan_prodi_umum_submenu');
                await triggerHumanHandover(userId, message, "Admin Prodi (Layanan Umum)");
            } else {
                await message.reply(`Pilihan tidak valid.\n\n${menuData.infoLayananProdiUmumSubMenu}`);
            }
        }
         else {
            console.warn(`User ${currentPhoneNumber} dalam state tidak dikenal: ${currentState}. Resetting.`);
            await client.sendMessage(userId, menuData.initialGreeting);
            userState.set(userId, 'awaiting_role_at_start');
            await client.sendMessage(userId, menuData.roleSelectionQuestion);
        }

    } catch (error) {
        console.error(`Gagal memproses pesan dari ${getPhoneNumber(message.from) || 'N/A'}:`, error);
        const userId = message.from;
        if (userId && userId !== AGENT_WHATSAPP_ID && !usersInHumanSession.has(userId) && !message.isStatus && !message.fromMe) {
             try {
                userState.delete(userId);
                userState.delete(userId + '_previous_menu_before_handover');
                userState.delete(userId + '_return_to_after_dosenwali');
                await client.sendMessage(userId, "Maaf, terjadi kesalahan sistem. Ketik pesan untuk memulai ulang.");
             } catch (sendError) {
                 console.error(`Gagal mengirim pesan error ke ${getPhoneNumber(userId)}:`, sendError);
             }
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Klien terputus:', reason);
    sessionTimers.forEach(clearTimeout); sessionTimers.clear();
    userActivityTimers.forEach(clearTimeout); userActivityTimers.clear();
    usersInHumanSession.clear(); userState.clear();
    console.log("Semua sesi aktif, timer, dan state pengguna dibersihkan.");
});

console.log("Menginisialisasi klien...");
client.initialize().catch(err => console.error("Inisialisasi klien gagal:", err));

process.on('SIGINT', async () => { console.log("SIGINT diterima..."); await client.destroy(); process.exit(0); });
process.on('SIGTERM', async () => { console.log("SIGTERM diterima..."); await client.destroy(); process.exit(0); });