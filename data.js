// menudata.js

// --- Data Definitions ---
// Changed to an array of objects to hold more details
const dosenWaliList = [
    {
        nama: "Prof. Dr. Budi Santoso",
        email: "Example.Budi@example.com", // Use actual or placeholder emails
        wa: "091093810293810238",       // Use actual or placeholder WA numbers
        ruangan: "7.4.1"                     // Use actual or placeholder room numbers
    },
    {
        nama: "Dr. Siti Aminah",
        email: "Example.Siti@example.com",
        wa: "091093810293810239", // Example: different number
        ruangan: "5.2.3"            // Example: different room
    },
    {
        nama: "Ir. Joko Susilo, M.Eng.",
        email: "Example.Joko@example.com",
        wa: "091093810293810240", // Example: different number
        ruangan: "4.2.4"            // Example: different room
    },
    {
        nama: "Dr. Retno Wulandari",
        email: "Example.Retno@example.com",
        wa: "091093810293810241", // Example: different number
        ruangan: "7.6.1"            // Example: different room
    },
    // Add more lecturer objects as needed following the same structure
];

// --- Pre-formatted Messages ---
// (Your kemahasiswaanInfo constant remains the same)
const kemahasiswaanInfo = "Untuk urusan kemahasiswaan, silakan hubungi Bagian Kemahasiswaan di Gedung Rektorat lt. 2 atau email ke kemahasiswaan@kampus.ac.id";

// Updated message generation to format the object data
const dosenWaliMessage = `*Daftar Dosen Wali:*\n\n` + dosenWaliList.map(dosen => {
    // Format each lecturer's details using template literals and accessing object properties
    return `- ${dosen.nama}\n  Email: ${dosen.email}\n  WA: ${dosen.wa}\n  Ruangan: ${dosen.ruangan}`;
}).join("\n\n"); // Use join("\n\n") to add a blank line between entries

// --- Menu Text ---
const menuText = `Selamat datang di Prodi Tekkom! Ketik kebutuhan permasalahan mu sesuai nomer(ex:1):\n1. Dosen Wali\n2. Prodi\n3. Kemahasiswaan\n4. Bicara dengan Customer Service`; // Corrected numbering typo

// --- Export the data ---
// We use module.exports to make these variables available to other files
module.exports = {
    // You can export the raw data if needed elsewhere, or just the messages
    dosenWaliList: dosenWaliList, // Exporting the raw data might be useful

    // Export the messages that the bot will send
    dosenWaliMessage: dosenWaliMessage, // Shorthand: dosenWaliMessage,
    // prodInfo: prodInfo, // Assuming you have this defined elsewhere or will add it
    kemahasiswaanInfo: kemahasiswaanInfo, // Shorthand: kemahasiswaanInfo,
    menuText: menuText, // Shorthand: menuText
};

// Example of how the generated dosenWaliMessage string will look:
/*
*Daftar Dosen Wali:*

- Prof. Dr. Budi Santoso
  Email: Example.Budi@example.com
  WA: 091093810293810238
  Ruangan: 108

- Dr. Siti Aminah
  Email: Example.Siti@example.com
  WA: 091093810293810239
  Ruangan: 109

- Ir. Joko Susilo, M.Eng.
  Email: Example.Joko@example.com
  WA: 091093810293810240
  Ruangan: 110

- Dr. Retno Wulandari
  Email: Example.Retno@example.com
  WA: 091093810293810241
  Ruangan: 111
*/