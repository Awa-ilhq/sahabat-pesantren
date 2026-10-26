# Sahabat Pesantren — Frontend

Ruang aman bagi santri untuk melapor perundungan dan kekerasan di lingkungan
pesantren. Karya UINIC 8.0.

Frontend web dibangun dengan React 19 + Vite. Aplikasi bisa berjalan penuh
dalam **mode mock** (tanpa backend) untuk demo, dan bisa diarahkan ke API
Laravel yang sesungguhnya lewat `VITE_API_URL`.

## Mulai

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

### Skrip

| Perintah          | Kegunaan                                    |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Jalankan server pengembangan (Vite)         |
| `npm run build`   | Bangun bundle produksi ke `dist/`           |
| `npm run preview` | Pratinjau hasil build secara lokal          |
| `npm run lint`    | Jalankan ESLint                             |

> Catatan Windows: bila `npm` tidak dikenali PowerShell, gunakan `npm.cmd`.
> Mesin dengan RAM terbatas: atur `$env:RAYON_NUM_THREADS='2'` sebelum `npm run build`.

## Konfigurasi lingkungan

Salin `.env.example` menjadi `.env` bila perlu menyesuaikan:

| Variabel                          | Default | Fungsi                                        |
| --------------------------------- | ------- | --------------------------------------------- |
| `VITE_API_URL`                    | `''`    | Origin API saja (mis. `https://api.example.com`); boleh kosong bila same-origin. |
| `VITE_USE_MOCK`                   | `true`  | `true` memakai data contoh di dalam aplikasi. |
| `VITE_USE_AI_MOCK`                | ikut `VITE_USE_MOCK` | `false` memakai AI asli backend; `true` memakai balasan tiruan. |
| `VITE_IDLE_TIMEOUT_SECONDS`       | `180`   | Waktu henti otomatis akun santri (detik).     |
| `VITE_STAFF_IDLE_TIMEOUT_SECONDS` | `900`   | Waktu henti otomatis akun petugas (detik).    |

## Akun demo (mode mock)

| Peran     | ID pengguna | Kata sandi   |
| --------- | ----------- | ------------ |
| Santri    | `santri1`   | `santri123`  |
| Santri    | `santri2`   | `santri123`  |
| Pengurus  | `pengurus1` | `pengurus123`|
| Pengurus  | `pengurus3` | `pengurus123`|
| Pimpinan  | `pimpinan1` | `pimpinan123`|
| Pimpinan  | `pimpinan2` | `pimpinan123`|
| Pengawas  | `pengawas1` | `pengawas123`|

Peran **pengawas** hanya melihat laporan sensitif (`menyangkut_pimpinan`),
audit log, dan dashboard ringkasan; aksinya baca-saja. Menonaktifkan akun
pimpinan memerlukan persetujuan melalui halaman **Persetujuan**.

Akun `santri2` dan akun baru hasil impor akan diminta ganti kata sandi saat
masuk pertama kali.

## Checklist sebelum deploy produksi

- Set `VITE_USE_MOCK=false` agar data contoh tidak dipakai.
- Isi `VITE_API_URL` dengan origin API saja, misalnya
  `https://api.example.com`.
- Pastikan `connect-src` CSP di `public/_headers` dan `vercel.json` memuat
  origin API yang dipakai.
- Uji login dan kirim setidaknya satu laporan melalui API online.
- Pastikan banner mode demo tidak tampil pada build produksi.

## Cara bersambung ke API asli

1. Set `VITE_USE_MOCK=false`.
2. Set `VITE_API_URL` ke origin API saja (misal `https://api.example.com`).
3. Pastikan CSP di `public/_headers` dan `vercel.json` memuat origin API pada
   `connect-src` (lihat `API_ASSUMPTIONS.md`).
4. Bangun ulang: `npm run build`.

Kontrak endpoint yang dipakai aplikasi terdokumentasi di `API_ASSUMPTIONS.md`.

## Struktur

```
src/
  api/        # klien HTTP + service (mock/real dipilih otomatis)
  components/ # komponen bersama: ui/ (primitif) + Brand, DemoBanner, dll
  features/   # fitur: auth, reports, conversations, ai-chat, dashboard, accounts,
              # audit, deactivation
  layouts/    # PublicLayout, SantriLayout, StaffLayout
  lib/        # env, konstanta domain, format tanggal, CSV, cn
  pages/      # halaman per peran (santri, staff, pimpinan, pengawas) + umum
  routes/     # AppRouter (rute + proteksi peran)
```

## Keamanan & privasi

- Token disimpan di `localStorage` agar satu browser memakai satu akun dan
  sesi sinkron antar-tab (masuk/keluar di satu tab berlaku untuk semua tab).
  Token dikirim sebagai header `Authorization: Bearer`. Karena bertahan
  setelah browser ditutup, di perangkat bersama wajib memakai keluar cepat
  atau menunggu henti otomatis.
- Halaman dan respons selain aset memakai `Cache-Control: no-store, max-age=0`;
  `/assets/*` memakai cache satu tahun dengan `immutable`. `public/_headers`
  berlaku pada host yang mendukung format Netlify; pastikan host lain diberi
  aturan header yang setara. Pada Netlify, aturan `/assets/*` yang lebih
  spesifik dimaksudkan untuk menggantikan kebijakan cache umum.
- CSP membatasi koneksi ke `'self'` dan origin API yang tercantum pada
  `connect-src` di `public/_headers` dan `vercel.json`.
- Tidak ada `dangerouslySetInnerHTML`, atau aset eksternal. `localStorage`
  dipakai untuk token sesi dan riwayat Teman Cerita per akun (dihapus lewat
  tombol "Mulai ulang"); isi laporan/draf tidak pernah disimpan di browser.
- Identitas pelapor hanya terlihat petugas bila `tampilkan_identitas` aktif.
  Saat ini persetujuan permintaan pimpinan juga mengaktifkan flag itu, sehingga
  pengurus dan pimpinan sama-sama melihat nama; UI petugas tidak pernah
  menampilkan NIS/nomor santri.
- Laporan `menyangkut_pimpinan` hanya dapat dibaca pelapor dan pengawas;
  pengurus/pimpinan tidak menerimanya dari API. Pengawas bersifat baca-saja.
- Semua tanggal di UI petugas hanya menampilkan tanggal (tanpa jam), kecuali
  waktu pada audit log.
- Keluar cepat tersedia di setiap halaman santri tanpa konfirmasi.