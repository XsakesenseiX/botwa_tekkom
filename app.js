// app.js

// app.js

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// ---- Import data from the separate file ----
const menuData = require('./data'); // Make sure the path is correct

// ---- State Management ----
// -- Human Handover --
const usersInHumanSession = new Set();
const sessionTimers = new Map(); // Map<userId, timerId> for HANDOVER session timeout
const SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes for HANDOVER timeout

// -- General User Inactivity --
const userActivityTimers = new Map(); // Map<userId, timerId> for GENERAL inactivity timeout
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes for GENERAL inactivity

// ---- !! IMPORTANT: Set your Agent's WhatsApp ID here !! ----
const AGENT_WHATSAPP_ID = '6285726106817@c.us'; // <--- REPLACE THIS if needed

if (AGENT_WHATSAPP_ID === 'YOUR_AGENT_WHATSAPP_ID@c.us') {
    console.warn("WARNING: AGENT_WHATSAPP_ID is not set in app.js! Human handover notifications will not work.");
}

// --- Initialize WhatsApp Client ---
console.log("Initializing WhatsApp client...");
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-extensions'
        ]
    }
});

// --- Helper Function to End Human Session ---
async function endHumanSession(userId, reason = "resolved") {
    if (usersInHumanSession.has(userId)) {
        usersInHumanSession.delete(userId);
        console.log(`Human session for ${userId} ended. Reason: ${reason}`);
        // Clear HANDOVER timer
        if (sessionTimers.has(userId)) {
            clearTimeout(sessionTimers.get(userId));
            sessionTimers.delete(userId);
            console.log(`Cleared HANDOVER session timer for ${userId}.`);
        }
        // NOTE: Do NOT restart the general inactivity timer here automatically.
        // Let the user's next message restart it.
        return true;
    }
    return false;
}

// --- Event Listeners ---

client.on('qr', (qr) => {
    console.log('QR Code Received, Scan please!');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
    console.log(`Current location: Salatiga, Central Java, Indonesia`);
    const wibTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    console.log(`Current time: ${wibTime} WIB`);
});

// Fired on incoming message
client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        const userId = message.from;
        const userChoice = message.body.trim();

        // --- Initial Filters ---
        // 1. Ignore group messages entirely
        if (chat.isGroup) {
            // console.log(`Ignoring message from group: ${chat.name} (${userId})`);
            return;
        }
        // 2. Ignore messages from the bot itself
        if (message.fromMe) {
             // console.log(`Ignoring message from self (${userId})`);
             return;
        }
        // 3. Ignore status messages/replies
        if (message.isStatus) {
            // console.log(`Ignoring status reply from ${userId}`);
            return;
        }

        console.log(`Processing message from ${userId}: ${userChoice}`); // Log processing start


        // --- Handle Agent Messages Separately (No inactivity timer for agent) ---
        if (userId === AGENT_WHATSAPP_ID) {
            console.log(`Processing agent command from ${userId}`);
            if (userChoice.toLowerCase().startsWith('/resolve ')) {
                const userIdToResolve = userChoice.substring(9).trim();
                const fullUserIdToResolve = userIdToResolve.includes('@') ? userIdToResolve : userIdToResolve + '@c.us';

                if (!fullUserIdToResolve.endsWith('@c.us') && !fullUserIdToResolve.endsWith('@g.us')) {
                    await client.sendMessage(AGENT_WHATSAPP_ID, `Format User ID tidak dikenal: ${userIdToResolve}. Contoh: 6281234567890@c.us`);
                    return;
                }

                const sessionEnded = await endHumanSession(fullUserIdToResolve, "agent resolved");

                if (sessionEnded) {
                    await client.sendMessage(AGENT_WHATSAPP_ID, `Sesi untuk ${fullUserIdToResolve} telah ditutup.`);
                    await client.sendMessage(fullUserIdToResolve, `Terima kasih! Sesi Anda dengan Customer Service telah berakhir. Bot sekarang aktif kembali.\n\n${menuData.menuText}`);
                } else {
                    await client.sendMessage(AGENT_WHATSAPP_ID, `Error: User ${fullUserIdToResolve} tidak ditemukan dalam sesi aktif.`);
                }
            } else {
                 // Optional: Handle other agent commands or inform agent of invalid command
                 await client.sendMessage(AGENT_WHATSAPP_ID, `Perintah tidak dikenali: ${userChoice}`);
            }
            return; // Stop processing after handling agent message
        }


        // --- Handle Users in Human Session (No processing, No inactivity timer reset) ---
        if (usersInHumanSession.has(userId)) {
            console.log(`Ignoring message from ${userId} (in human session - waiting for agent or handover timeout)`);
            // DO NOT reset any timers here. Let the handover process manage itself.
            return;
        }

        // ================== GENERAL INACTIVITY TIMER (Reset for Active Users) ==================
        // This section runs for any message from a regular user who is NOT in a human session.

        // Clear existing inactivity timer for this user
        if (userActivityTimers.has(userId)) {
            clearTimeout(userActivityTimers.get(userId));
            // console.log(`Cleared previous inactivity timer for ${userId}`); // Optional log
        }

        // Set a new inactivity timer
        const activityTimerId = setTimeout(async () => {
            console.log(`General inactivity timeout check for user ${userId}`);
            // Double-check: Did the user enter human session JUST before this fired?
            if (!usersInHumanSession.has(userId)) {
                try {
                    // Send the inactivity timeout message
                    await client.sendMessage(userId, "Baik karena sudah tidak ada permintaan maka sesi akan di tutup.");
                    console.log(`Sent general inactivity timeout message to ${userId}`);
                } catch (sendError) {
                    console.error(`Failed to send inactivity timeout message to ${userId}:`, sendError);
                }
            } else {
                console.log(`General inactivity timeout for ${userId} suppressed (user entered human session).`);
            }
            // Remove the timer reference from the map AFTER it fires or is suppressed
            userActivityTimers.delete(userId);
        }, INACTIVITY_TIMEOUT_MS);

        // Store the new timer ID
        userActivityTimers.set(userId, activityTimerId);
        // console.log(`General inactivity timer reset/started for user ${userId}`); // Optional log
        // ================== END OF GENERAL INACTIVITY TIMER ==================


        // --- Handle User Choices (Now that timer is reset) ---
        if (userChoice === '1') {
            console.log(`Replying to ${userId} with Dosen Wali info`);
            await message.reply(menuData.dosenWaliMessage);
        } else if (userChoice === '2') {
            console.log(`Replying to ${userId} with Prodi info`);
             if (menuData.prodiInfo) {
                 await message.reply(menuData.prodiInfo);
             } else {
                 await message.reply("Informasi Prodi belum tersedia.");
                 console.warn("menuData.prodiInfo is missing or undefined in data.js.");
             }
        } else if (userChoice === '3') {
            console.log(`Replying to ${userId} with Kemahasiswaan info`);
            await message.reply(menuData.kemahasiswaanInfo);
        } else if (userChoice === '4') {
            // --- Handle Human Handover Request ---
            console.log(`Handover requested by ${userId}`);
            // We already know user is not currently in session from checks above

            // **IMPORTANT: Clear the general inactivity timer before starting handover**
            if (userActivityTimers.has(userId)) {
                clearTimeout(userActivityTimers.get(userId));
                userActivityTimers.delete(userId);
                console.log(`Cleared general inactivity timer for ${userId} due to handover request.`);
            }

            // Add user to human session set
            usersInHumanSession.add(userId);
            await message.reply("Baik, mohon tunggu sebentar. Kami akan segera menghubungkan Anda dengan Customer Service.");

            // Notify agent and start HANDOVER timer
            if (AGENT_WHATSAPP_ID !== 'YOUR_AGENT_WHATSAPP_ID@c.us') {
                const notificationMessage = `Permintaan Bantuan Agen:\n\nPengguna: ${userId}\nSilakan hubungi nomor ini secara manual.\n\nSesi akan otomatis berakhir dalam 2 menit jika tidak di-resolve.\nKetik '/resolve ${userId}' setelah selesai.`;
                await client.sendMessage(AGENT_WHATSAPP_ID, notificationMessage);
                console.log(`Notification sent to agent ${AGENT_WHATSAPP_ID} for user ${userId}`);

                // Start the HANDOVER specific timer
                if (sessionTimers.has(userId)) clearTimeout(sessionTimers.get(userId)); // Clear old handover timer just in case
                const handoverTimerId = setTimeout(async () => {
                    console.log(`HANDOVER session timeout check for ${userId}`);
                    const sessionEnded = await endHumanSession(userId, "timeout"); // Use helper
                    if (sessionEnded) {
                        try {
                            const timeoutMessage = "Baik, karena sudah tidak ada permintaan lebih lanjut maka sesi akan ditutup secara otomatis.";
                            await client.sendMessage(userId, timeoutMessage);
                            console.log(`Sent HANDOVER session timeout message to ${userId}`);
                        } catch (sendError) {
                            console.error(`Failed to send HANDOVER timeout message to ${userId}:`, sendError);
                        }
                    }
                }, SESSION_TIMEOUT_MS);
                sessionTimers.set(userId, handoverTimerId); // Store HANDOVER timer
                console.log(`HANDOVER session timer started for ${userId} (${SESSION_TIMEOUT_MS / 1000}s)`);

            } else {
                console.error("Cannot notify agent: AGENT_WHATSAPP_ID is not set.");
                await message.reply("Maaf, terjadi sedikit kendala dalam sistem notifikasi agen kami. Silakan coba lagi nanti.");
                usersInHumanSession.delete(userId); // Back out if agent notification failed
            }

        } else {
            // --- Send Menu for other inputs ---
             if (!message.isStatus && !message.fromMe) {
                 console.log(`Sending menu to ${userId}`);
                 await client.sendMessage(userId, menuData.menuText);
             } else {
                 if (message.isStatus) console.log(`Ignoring status reply from ${userId}`);
                 if (message.fromMe) console.log(`Ignoring message from self (${userId})`);
             }
        }
    } catch (error) {
        console.error(`Failed to process or reply to message from ${message.from || 'unknown sender'}:`, error);
        const userId = message.from;
        if (userId && !usersInHumanSession.has(userId)) {
             try {
                 const chat = await message.getChat();
                 if (!chat.isGroup) {
                     await client.sendMessage(userId, "Maaf, terjadi kesalahan. Silakan coba lagi.");
                 }
             } catch (sendError) {
                 console.error(`Failed to send error message to ${userId}:`, sendError);
             }
        }
    }
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    // Clear all active timers and sessions on disconnect
    sessionTimers.forEach((timerId, userId) => {
        clearTimeout(timerId);
        console.log(`Cleared timer for ${userId} due to disconnect.`);
    });
    sessionTimers.clear();
    usersInHumanSession.clear();
    console.log("Cleared active sessions and timers.");
});

// --- Start the client ---
console.log("Starting client initialization...");
client.initialize().catch(err => {
    console.error("Client initialization failed:", err);
});

// --- Graceful shutdown ---
process.on('SIGINT', async () => {
    console.log("Shutting down client...");
    // Clear timers on shutdown as well
    sessionTimers.forEach((timerId) => clearTimeout(timerId));
    await client.destroy();
    console.log("Client destroyed.");
    process.exit(0);
});