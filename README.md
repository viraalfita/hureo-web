# HUREO HRIS (Vue 3 + Vite + PrimeVue + Tailwind)

Aplikasi **web dashboard manajemen kehadiran dan karier karyawan**.
Dibangun menggunakan **Vue 3**, **Vite**, **PrimeVue**, **Pinia**, **ApexCharts**, dan **TailwindCSS**.

## 🌐 Live Preview & Implementation
| Tipe                                  | Link                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 🧩 **Web Demo (Frontend Only)**       | [https://demo-hureo.vercel.app](https://demo-hureo.vercel.app) *(Preview Mode)*       |
| ⚙️ **Implementation (Web + Backend)** | [https://hureo.vercel.app](https://hureo.vercel.app) *(Connected with Express API)* |

## 🚀 Features

### 🏠 Dashboard

* Statistik karyawan, absensi, cuti, dan KPI.
* Grafik absensi 7 hari terakhir dan distribusi cuti.
* Aktivitas terbaru karyawan dan status sesi aktif.

---

### 👥 Kehadiran

#### 1. **Absensi**

* Lihat data absensi per karyawan (real-time dari mobile app).
* Filter berdasarkan rentang tanggal dan nama karyawan.
* Ekspor data ke **Excel**.

#### 2. **Izin & Cuti**

* Approve/decline pengajuan cuti langsung dari dashboard.
* Filter berdasarkan status, tanggal, dan karyawan.
* Ekspor data cuti ke **Excel**.

---

### 💼 Karir

#### 1. **Posisi**

* Manajemen jabatan/posisi tiap divisi.
* Mendukung hierarki dan level jabatan.

#### 2. **Karyawan**

* Data profil lengkap karyawan (nama, jabatan, kontak, status aktif).
* Aksi cepat: tambah, edit, nonaktifkan karyawan.
* Filter berdasarkan divisi dan posisi.

#### 3. **KPI (Key Performance Indicator)**

* Input dan pantau KPI karyawan.
* Laporan penilaian performa individual maupun tim.

#### 4. **Rekrutmen**

* Kelola lowongan kerja, pelamar, dan tahapan seleksi.
* Update status pelamar (review, interview, accepted, rejected).
* Upload CV dan dokumen kandidat langsung dari form rekrutmen.

---

### ⚙️ Konfigurasi

#### 1. **Pengguna**

* Manajemen akun pengguna (admin, HR, karyawan).
* Atur peran & hak akses tiap pengguna.

#### 2. **Perusahaan**

* Data profil perusahaan: nama, logo, jam kerja, dan lokasi kantor.
* Konfigurasi jam kerja dan timezone untuk kehadiran.

---

## 📦 Tech Stack

* **Frontend:** [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
* **UI Components:** [PrimeVue](https://primevue.org/), [PrimeFlex](https://primeflex.org/), [TailwindCSS](https://tailwindcss.com/)
* **State Management:** [Pinia](https://pinia.vuejs.org/)
* **Charts:** [ApexCharts](https://apexcharts.com/)
* **Export Excel:** [xlsx](https://www.npmjs.com/package/xlsx)

---

## 🔗 Related Repositories

* **Backend Service (Express + MongoDB)**
  👉 [hureo-service](https://github.com/viraalfita/hureo-service)

* **Mobile App (Flutter)**
  👉 [hureo-app (for Employee Attendance)](https://github.com/viraalfita/hureo-app)

---

## ⚙️ Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/<username>/attendance-web.git
cd attendance-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di:

```
http://localhost:5173
```

### 4. Build untuk Production

```bash
npm run build
```

---

## 🔧 Konfigurasi API

Secara default, web ini terhubung ke service Express (`attendance-service`).
Ubah `baseUrl` API di file `src/api/api.js` sesuai alamat backend kamu, contoh:

```js
// src/api/api.js
export const baseUrl = "http://localhost:5001/api";
```

---

## 📸 Screenshots

<img width="1920" height="960" alt="hureoprev" src="https://github.com/user-attachments/assets/1a7c21dc-d571-4118-b8af-f572a12db2aa" />

