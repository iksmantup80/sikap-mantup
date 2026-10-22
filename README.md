# SIKAP MANTUP
### Sistem Informasi Keanggotaan dan Administrasi Persaudaraan
**IKSPI Kera Sakti Ranting Mantup, Kecamatan Mantup, Kabupaten Lamongan, Jawa Timur**

---

## 📌 1. Prinsip Utama & Karakteristik Sistem
1. **Administrasi Internal Ranting:** SIKAP Mantup adalah sistem administrasi internal tingkat ranting, **bukan aplikasi resmi Pusat Madiun**.
2. **Tidak Mengklaim API Pusat:** Tidak mengklaim adanya integrasi otomatis dengan database pusat tanpa izin dan dokumentasi resmi.
3. **Pencatatan KTA Asli:** Nomor KTA wajib dicatat persis sebagaimana tercetak pada fisik kartu resmi yang diterbitkan Pengurus Pusat. Sistem **tidak pernah menerbitkan nomor KTA pengganti**.
4. **Pemisahan Status Keaktifan & Verifikasi:**
   - **Status Keaktifan:** *Aktif, Pasif, Mutasi Keluar, Meninggal (Almarhum).*
   - **Status Verifikasi:** *Draft, Menunggu Verifikasi, Perlu Koreksi, Terverifikasi Sah, Ditolak.*
5. **Data Awal Bersih:** Tidak menggunakan data anggota fiktif. Data contoh untuk pengembangan diberi label eksplisit **DEMO**.
6. **Perlindungan Privasi:** Menerapkan Role-Based Access Control (RBAC) dan Row Level Security (RLS) PostgreSQL. Anggota biasa hanya dapat melihat profilnya sendiri.

---

## 🏛️ 2. Struktur Wilayah 15 Desa (Kecamatan Mantup)
SIKAP Mantup memetakan 15 desa definitif di wilayah kerja Ranting Mantup:
- `MTP-01`: Desa Mantup (Pusat Ranting)
- `MTP-02`: Desa Sukobendu
- `MTP-03`: Desa Kedungsumber
- `MTP-04`: Desa Sumberkerep
- `MTP-05`: Desa Mojosari
- `MTP-06`: Desa Kedukbembem
- `MTP-07`: Desa Tunggunjagir
- `MTP-08`: Desa Plabuhan
- `MTP-09`: Desa Rumpuk
- `MTP-10`: Desa Tugu
- `MTP-11`: Desa Sukosongo
- `MTP-12`: Desa Sumberagung
- `MTP-13`: Desa Sumberdadi
- `MTP-14`: Desa Sidomulyo
- `MTP-15`: Desa Kutorejo

---

## 💻 3. Teknologi yang Digunakan
- **Frontend Framework:** Next.js (App Router, React 19, TypeScript strict mode)
- **Styling:** Tailwind CSS (Mobile-first, responsive, PWA ready)
- **Database & Auth:** Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS)
- **Validasi Formulir:** Zod & React Hook Form
- **Icons:** Lucide Icons & Heroicons

---

## 🚀 4. Cara Menjalankan Proyek Secara Lokal

### A. Prasyarat
- Node.js versi 18+ atau 20+
- Akun Supabase (opsional jika menggunakan mode demo interaktif)

### B. Menjalankan Server Pengembangan
```bash
cd s:\sikap-mantup
npm run dev
```
Buka browser di `http://localhost:3000`.

### C. Menghubungkan ke Supabase (Produksi)
1. Buat project baru di [Supabase Dashboard](https://supabase.com).
2. Masuk ke menu **SQL Editor**, buka file `supabase/schema.sql`, lalu jalankan (*Run*) seluruh perintah SQL.
3. Salin **Project URL** dan **Anon Key** ke file `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......
SUPABASE_SERVICE_ROLE_KEY=eyJh...... (Khusus server)
```

---

## 👥 5. Hak Akses Pengguna (RBAC) & Akun Demo

Aplikasi menyediakan tombol akses cepat (*One-Click Demo Login*) di halaman `/auth/login`:
- **Admin Ranting:** Akses database penuh se-Kecamatan, penanganan duplikasi data (Merge/Tolak), manajemen koordinator desa, dan export data CSV.
- **Verifikator Ranting:** Antrean verifikasi dokumen fisik KTA, pencatatan log audit, serta penetapan keputusan (*Terverifikasi Sah*, *Perlu Koreksi*, atau *Ditolak*).
- **Koordinator Subranting:** Terikat pada desa tugas (contoh: *Desa Sukobendu*), membantu input data anggota di wilayahnya, memantau status anggota desa.
- **Anggota:** Melihat arsip data pribadi, pratinjau kartu digital dengan watermark internal, dan mengajukan usulan pembaruan profil.
