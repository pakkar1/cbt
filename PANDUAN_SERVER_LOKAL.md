# PANDUAN MENJALANKAN DI SERVER LOKAL (LAB KOMPUTER / INTRANET SEKOLAH)

Aplikasi **Neotest CBT (Sistem Ujian Berbasis Komputer)** dapat dijalankan **100% di server lokal (komputer server sekolah / laptop proktor)** tanpa harus langsung terhubung ke cloud publik atau Vercel. 

Arsitektur aplikasi ini sudah dirancang mandiri (*self-contained*), sehingga dapat berfungsi baik secara **Semi-Online (LAN / Wi-Fi Lab Komputer)** maupun **Full Online**.

---

## 1. Persyaratan Sistem Komputer Server Lokal

- **Sistem Operasi:** Windows 10/11, Windows Server, Linux (Ubuntu/Debian), atau macOS.
- **Node.js:** Versi 18 ke atas (disarankan Node.js 20 LTS atau 22 LTS). Unduh di [nodejs.org](https://nodejs.org).
- **RAM Minimum:**
  - Untuk uji coba / simulasi: 4 GB RAM.
  - Untuk melayani 60 - 120 siswa simultan di lab: Disarankan 8 GB - 16 GB RAM.
- **Jaringan:** Switch Hub / Router Wi-Fi Lab Komputer (IP satu segmen, misal `192.168.1.xxx` atau `192.168.0.xxx`).

---

## 2. Langkah-Langkah Menjalankan di Server Lokal

### Langkah 1: Ekstrak / Siapkan Folder Project
Buka terminal (Command Prompt / PowerShell / Terminal) di folder aplikasi ini.

### Langkah 2: Pasang Dependencies
Jalankan perintah berikut sekali untuk mengunduh semua library yang dibutuhkan:
```bash
npm install
```

### Langkah 3: Jalankan Server Lokal
Jalankan perintah pengembang:
```bash
npm run dev
```
Secara otomatis, server lokal akan aktif dengan parameter `--host 0.0.0.0 --port 3000`.

Terminal akan menampilkan informasi seperti berikut:
```text
  VITE v8.x.x  ready in 450 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
```

---

## 3. Tautan Terpisah untuk Masing-Masing Role (Keamanan Penuh)

Untuk keamanan data dan kerahasiaan ujian, **tidak ada tombol atau opsi pemilihan role** pada halaman login maupun navigasi. Setiap peran diakses melalui tautan URL yang berbeda:

| Peran (Role) | Tautan URL Akses (Ganti IP Sesuai Server Anda) | Kredensial Bawaan Uji Coba |
| :--- | :--- | :--- |
| **Peserta Ujian (Siswa)** | `http://localhost:3000/` *(atau `http://192.168.1.100:3000/`)* | No. Peserta: `P09-01-001` / NISN: `0091000001` |
| **Proktor Ruang Ujian** | `http://localhost:3000/proktor` *(atau `?portal=proktor`)* | ID Proktor: `proktor` / Password: `123` |
| **Guru Pengampu** | `http://localhost:3000/guru` *(atau `?portal=guru`)* | ID Guru: `guru` / Password: `123` |
| **Administrator CBT** | `http://localhost:3000/admin` *(atau `?portal=admin`)* | ID Admin: `admin` / Password: `123` |
| **Super Administrator** | `http://localhost:3000/superadmin` *(atau `?portal=superadmin`)* | Master ID: `superadmin` / Password: `123` |

> **Catatan Keamanan:**
> - Siswa yang membuka tautan utama (`/`) **hanya akan melihat form login peserta ujian** tanpa petunjuk adanya portal admin/proktor.
> - Jika akun siswa mencoba membuka URL `/admin` atau `/proktor`, sistem akan langsung memblokir akses dan memunculkan peringatan *Akses Tidak Diizinkan*.

---

## 4. Cara Menghubungkan Komputer / Chromebook Siswa di Lab

1. **Catat Alamat IP Komputer Server:**
   - Pada Windows Server: Buka Command Prompt, ketik `ipconfig`, lihat *IPv4 Address* (contoh: `192.168.1.100`).
   - Pada Linux/Mac: Ketik `ip a` atau `ifconfig`.
2. **Buka Browser di Komputer Siswa:**
   - Komputer siswa atau Chromebook yang terhubung ke jaringan kabel (LAN) atau Wi-Fi yang sama tinggal membuka browser (Google Chrome / Microsoft Edge).
   - Ketik URL server pada bilah alamat:
     ```text
     http://192.168.1.100:3000
     ```
3. **Siswa Langsung Masuk:**
   - Halaman Login CBT ANBK akan langsung terbuka di komputer siswa.
   - Siswa memasukkan Nomor Peserta (contoh: `P09-01-001`) dan Password/NISN (contoh: `0091000001`).

---

## 4. Opsi Menjalankan Versi Produksi (Production Build Lebih Cepat & Ringan)

Untuk efisiensi RAM dan performa maksimal saat melayani hingga 120 siswa sekaligus:

1. **Build aplikasi ke bentuk statis produksi:**
   ```bash
   npm run build
   ```
2. **Jalankan preview produksi:**
   ```bash
   npm run preview -- --host 0.0.0.0 --port 3000
   ```
   Atau Anda bisa menggunakan web server lokal seperti **Nginx**, **Caddy**, atau **Apache/XAMPP** dengan mengarahkan *DocumentRoot* ke folder `dist/`.

---

## 5. Tips Kelancaran Ujian di Lab Sekolah (Best Practice)

1. **Firewall Komputer Server:**
   - Pastikan Windows Defender Firewall di komputer server mengizinkan koneksi masuk (*Inbound Rule*) pada port **3000**.
2. **Koneksi Stabil:**
   - Untuk 120 siswa per sesi, utamakan menggunakan kabel LAN (Gigabit Switch) dibanding Wi-Fi agar latency penyimpanan autosave tetap di bawah 200ms.
3. **Backup Data:**
   - Sebelum ujian dimulai dan setelah ujian selesai, proktor/admin dapat mengekspor data rekap hasil ke format CSV melalui tombol **Export CSV** di menu *Rekap Nilai* dan *Data Peserta*.
