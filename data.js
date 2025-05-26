// data.js

// --- Initial Interaction Prompts ---
const initialGreeting = "Assalamualaikum wr wb\nHalo! Selamat Datang Terimakasih telah menghubungi Layanan Chatbot Prodi Teknik Komputer Universitas AMIKOM Yogyakarta";

// Level 1: Main Menu (Role Selection)
const roleSelectionQuestion = "Anda Terdaftar Sebagai apa di Prodi Teknik Komputer?\n1. Mahasiswa\n2. Dosen\n3. Calon Mahasiswa/Orang Tua Wali";

// --- MAHASISWA SECTION ---
// Level 2: Mahasiswa Menu
const mahasiswaMenu = "Berikut layanan untuk Mahasiswa Program Studi Teknik Komputer:\n" +
    "1. Informasi Layanan Prodi\n" +
    "2. Dosen Wali\n" +
    "3. Jadwal Kuliah\n" +
    "4. Info Tugas Akhir (Skripsi)\n" +
    "5. Hubungi Pengelola Program Studi\n\n" +
    "0. Kembali ke pilihan peran (Menu Utama)";

// Level 3: Ask for NPM or Name (for Dosen Wali lookup)
const askForNpmOrName = "Silakan masukkan Nomor Pokok Mahasiswa (NPM) atau Nama Lengkap Mahasiswa untuk mencari Dosen Wali:\n(Contoh NPM: 21.83.0588 atau Contoh Nama: Budi Santoso)\n\n0. Kembali ke menu sebelumnya\n00. Kembali ke pilihan peran (Menu Utama)";
const npmOrNameNotFound = "Maaf, data Dosen Wali untuk NPM atau Nama Mahasiswa tersebut tidak ditemukan. Pastikan input sudah benar atau hubungi Admin Prodi.";
const multipleStudentsFoundByNameMessage = "Ditemukan beberapa mahasiswa dengan nama tersebut. Mohon masukkan NPM yang lebih spesifik."; // New message
const formatDosenWaliInfo = (dosen) => {
    let info = `Dosen Wali Anda:\nNama: ${dosen.namaDosen || '(tidak tersedia)'}`;
    if (dosen.namaMahasiswa) info += `\nUntuk Mahasiswa: ${dosen.namaMahasiswa} (${dosen.npm || 'N/A'})`; // Display student name and NPM if available
    if (dosen.emailDosen && dosen.emailDosen.trim() !== '') info += `\nEmail Dosen: ${dosen.emailDosen}`;
    else info += `\nEmail Dosen: (tidak tersedia)`;
    if (dosen.waDosen && dosen.waDosen.trim() !== '') info += `\nKontak WA Dosen: ${dosen.waDosen}`;
    else info += `\nKontak WA Dosen: (tidak tersedia)`;
    return info;
};

// Level 3: Layanan Prodi Khusus Mahasiswa Menu
const layananProdiMahasiswaMenu = "Berikut daftar Informasi Layanan Prodi khusus mahasiswa:\n" +
    "1. KRS Manual\n" +
    "2. Layanan Skripsi Non-Reguler\n" +
    "3. Layanan Magang Reguler\n" +
    "4. Pengunduran Diri Mahasiswa\n" +
    "5. Permohonan Cuti Kuliah\n" +
    "6. Penghapusan Mata Kuliah dari Transkrip Nilai\n" +
    "7. Layanan Permohonan Revisi Nilai\n" +
    "8. Layanan Surat Pengantar Penyuluhan dan Sosialisasi Konsentrasi Prodi Tekkom di Sekolah\n" +
    "9. Layanan Konversi Mata Kuliah 2 SKS \n\n" +
    "0. Kembali ke menu Mahasiswa\n" +
    "00. Kembali ke pilihan peran (Menu Utama)";

// Content for Layanan Prodi Khusus Mahasiswa
const infoKrsManual = "Layanan ini digunakan untuk memohon pengesahan KRS Manual.\n" +
    "• Untuk melihat mata kuliah yang ditawarkan, kunjungi: https://bit.ly/krs-manuall\n" +
    "• Format KRS Manual bisa dilihat di web DAAK: https://daak.amikom.ac.id/page/surat-formulir";
const infoSkripsiNonReguler = "Layanan ini digunakan untuk mengajukan proposal jalur non skripsi. \n" +
"• Pastikan anda memahami alur dari layanan ini dengan membaca panduan jalur non skripsi: https://bit.ly/alur-non-skripsi\n" + 
"• Pengajuan surat pengantar Non Skripsi: https://bit.ly/Surat_Pengantar_NonSkripsi-Tekkom";
const infoMagangReguler = "Layanan ini digunakan untuk Pengajuan Nilai Magang Reguler.\n• Pengajuan Nilai Magang Reguler (NON MBKM): https://bit.ly/Konversi-Magang-NonMBKM-Tekkom";
const infoPengunduranDiri = "Layanan ini digunakan untuk memohon pengesahan oleh Kaprodi Teknik Komputer untuk Pengunduran diri mahasiswa\n" +
"• Format formulir dapat diundur di web DAAK: https://daak.amikom.ac.id/page/surat-formulir\n" +
"• Approval Kaprodi Teknik Komputer: https://bit.ly/approval-kaprodi-tekkom";
const infoCutiKuliah = "Layanan ini digunakan untuk memohon pengesahan oleh Kaprodi Teknik Komputer untuk Permohonan Cuti Kuliah mahasiswa.\n" +
"• Format formulir dapat diundur di web DAAk: https://daak.amikom.ac.id/page/surat-formulir\n" + 
"• Approval Kaprodi Teknik Komputer: https://bit.ly/approval-kaprodi-tekkom";
const infoHapusMatkul = "Layanan ini digunakan untuk memohon pengesahan oleh Kaprodi Teknik Komputer untuk Penghapusan Matakuliah dan Trasnkrip Nilai mahasiswa.\n" +
"• Format formulir dapat diunduuh di web DAAK: https://daak.amikom.ac.id/page/surat-formulir\n" +
"• Approval Kaprodi Teknik Komputer: https://bit.ly/approval-kaprodi-tekkom";
const infoRevisiNilaiMahasiswaLayanan = "Layanan ini digunakan untuk Permohonan Revisi Nilai (Hanya untuk mahasiswa aktif semester 14). \n• Pengajuan Permohonan Revisi Nilai: https://bit.ly/Revisi_Nilai-Tekkom";
const infoSuratPengantarPenyuluhan = "Layanan ini digunakan untuk Surat Pengantar Penyuluhan dan Sosialisasi Konsentrasi Prodi Tekkom di Sekolah. \n• Surat Pengantar Penyuluhan dan Sosialisasi Konsentrasi Prodi Tekkom: https://bit.ly/penyuluhan-sosialisasi";
const infoKonversiMatkul = "Layanan ini digunakan untuk Konversi Mata Kuliah 2 SKS. \n• Layanan Konversi Mata Kuliah 2 SKS (Penyuluhan dan Sosialisasi Konsentrasi Prodi): https://bit.ly/Konversi_MK-2SKS_Tekkom";
const infoJadwalKuliah = "Untuk melihat jadwal kuliah lengkap, kunjungi:\nhttps://daak.amikom.ac.id/page/jadwal-kuliah";
const infoTugasAkhirSkripsi = "Info Tugas Akhir (Skripsi) bisa dicek di sini: https://daak.amikom.ac.id/page/pengajuan-judul-taskripsi";

// --- DOSEN SECTION ---
const dosenMenu = "Berikut layanan untuk Dosen Program Studi Teknik Komputer:\n1. Revisi Nilai Mahasiswa\n2. Pengajuan Surat Tugas dan Pengajuan SPD\n3. Form Konfirmasi Tugas Luar Kampus\n4. Berbicara dengan Admin Prodi\n\n0. Kembali ke pilihan peran (Menu Utama);
const revisiNilaiInfoDosen = "Revisi Nilai Mahasiswa: https://bit.ly/approval-kaprodi-tekkom\n" +
"• Form ini digunakan untuk merubah nilai mahasiswa pasca crosscheck diluar jadwal yang telah ditentukan DAAK.\n" +
"• Hanya dosen yang diperbolehkan mengisi form ini.\n" +
"• Pastikan login menggunakan email Amikom.";
const suratTugasSpdInfo = "Form Pengajuan Surat Tugas: https://bit.ly/pengajuan-surat-tugass\n" + 
"• Surat tugas digunakan untuk keperluan seperti lomba, seminar, workshop atau pendampingan kegiatan luar kampus.\n" + 
"• Pengajuan SPD dilakukan ke bagian PSDM dan menyertakan Surat Tugas dari Fakultas sebagai syarat pengajuan. Link Surat: https://bit.ly/PengajuanDisposisi\n" +
"• Pastikan login menggunakan email Amikom";
const formKonfirmasiTugasLuarInfo = "Upload bukti SPD: https://bit.ly/form-upload-SPD\n" + 
"• Setelah selesai melakukan kegiatan diluar kampus, silahkan upload bukti SPD pada link diatas.\n" +
"• Pastikan login menggunakan email Amikom.";

// --- CALON MAHASISWA / ORANG TUA WALI SECTION ---
const calonMahasiswaMenu = "Berikut layanan yang dapat Anda akses:\n1. Informasi Layanan Prodi Teknik Komputer (umum)\n2. Profil Prodi Teknik Komputer\n3. Informasi PMB (Penerimaan Mahasiswa Baru)\n\n0. Kembali ke pilihan peran (Menu Utama);

// "Dosen Wali (Informasi Umum)" is now "Cari Dosen Wali Mahasiswa"
const infoLayananProdiUmumSubMenu = "Berikut layanan yang dapat Anda akses di Informasi Umum Program Studi Teknik Komputer:\n1. Cari Dosen Wali Mahasiswa\n2. Berbicara langsung dengan Admin Prodi\n\n0. Kembali ke menu Calon Mahasiswa/Wali\n00. Kembali ke pilihan peran (Menu Utama)";

// infoDosenWaliUmum is no longer needed as it's now a search function
const profilProdiTekkomInfo = "Profil Prodi Teknik Komputer:\n" +
    "• Kurikulum dan Spesialisasi: [Detail Kurikulum dan Spesialisasi]\n" +
    "• Program Unggulan: IoT & Cyber Security\n" +
    "• Akreditasi: Baik Sekali (BAN-PT)\n" +
    "• Website: https://teknikkomputer.amikom.ac.id\n" +
    "• IG: @teknikkomputeramikom";
const pmbInfo = "Informasi Penerimaan Mahasiswa Baru (PMB):\n" +
    "• Website: https://pmb.amikom.ac.id\n" +
    "• Jalur: Reguler, Beasiswa, Prestasi\n" +
    "• Kontak: 0274-884201\n" +
    "• IG: @pmbamikom\n" +
    "• Brosur Digital: https://brosur.amikom.ac.id/brosur/baca/Teknik_Komputer";

// --- General Info & Messages ---
const csOfflineMessage = "Mohon maaf, layanan Admin Prodi saat ini sedang offline. Jam layanan Admin Prodi adalah pukul 08:00 - 16:00 WIB (Senin - Jumat).\nSilakan hubungi kembali pada jam kerja tersebut.";
const brosurMessage = "Silakan lihat brosur pada link ini: https://brosur.amikom.ac.id/brosur/baca/Teknik_Komputer";

module.exports = {
    initialGreeting,
    roleSelectionQuestion,
    
    mahasiswaMenu,
    askForNpmOrName, 
    npmOrNameNotFound, 
    multipleStudentsFoundByNameMessage, 
    formatDosenWaliInfo,
    infoJadwalKuliah, 
    infoTugasAkhirSkripsi, 
    
    layananProdiMahasiswaMenu, 
    infoKrsManual, infoSkripsiNonReguler, infoMagangReguler, infoPengunduranDiri,
    infoCutiKuliah, infoHapusMatkul, infoRevisiNilaiMahasiswaLayanan, infoSuratPengantarPenyuluhan, infoKonversiMatkul,
    
    dosenMenu,
    revisiNilaiInfoDosen, 
    suratTugasSpdInfo,
    formKonfirmasiTugasLuarInfo,

    calonMahasiswaMenu,
    infoLayananProdiUmumSubMenu, 
    profilProdiTekkomInfo, 
    pmbInfo,
    brosurMessage, 
    csOfflineMessage,
};
