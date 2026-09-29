# TAKORA | Sistem Informasi Keuangan Organisasi

Aplikasi mini-ERP untuk SENDETAN TAKORA TELAGA BETENG. Frontend React + Vite + Tailwind, backend Google Apps Script, penyimpanan Google Sheets, dan foto aset di Google Drive.

Alamat organisasi: Telagabeteng, Banjar Dinas Tiyingtali Kelod, Desa Tiyingtali, Kecamatan Abang, Kabupaten Karangasem, Provinsi Bali.

## Menjalankan frontend

```bash
npm install
npm run dev
```

Tanpa `VITE_APPS_SCRIPT_URL`, aplikasi berjalan dalam **mode demo** memakai data contoh. Perubahan demo disimpan di browser yang sama dan tidak disinkronkan ke perangkat lain. Untuk memakai data Google, salin `.env.example` ke `.env.local`, isi URL Web App berakhiran `/exec`, lalu restart server:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Sebelum backend disiapkan, layar dashboard dan modul tetap dapat dicoba; perubahan mode demo tersimpan di browser yang sama setelah refresh, tetapi tidak menulis ke Sheets atau perangkat lain.

## Arsitektur Google Sheets

Jalankan `setupSheets()` dari editor Apps Script. Header berikut dibuat otomatis dan harus dipertahankan persis. ID di kolom `id` menjadi primary key; kolom `memberId`, `assetId`, dan `periodId` menjadi relasi.

| Sheet | Header kolom berurutan |
| --- | --- |
| `Users` | `id`, `name`, `username`, `passwordHash`, `salt`, `role`, `status`, `createdAt`, `lastLoginAt` |
| `Anggota` | `id`, `memberNo`, `memberName`, `phone`, `address`, `status`, `joinedAt`, `notes` |
| `IuranPeriode` | `id`, `period`, `openedAt`, `closedAt`, `status`, `monthlyTarget`, `memberCount`, `totalBilled`, `carryArrears`, `carryRefundDebt`, `notes`, `createdBy` |
| `MASTER_ANGGOTA` | `ID`, `Nama`, `Sisa_Hutang_Iuran`, `Sisa_Hutang_Kembalian` |
| `TRANSAKSI_IURAN` | `id`, `date`, `periodId`, `memberId`, `memberName`, `target`, `allocatedContribution`, `cashPhysical`, `changeDue`, `changePaid`, `openingArrears`, `arrears`, `openingRefundDebt`, `refundDebtAdded`, `refundDebt`, `notes`, `createdBy`, `createdAt`, `updatedAt` |
| `PengeluaranIuran` | `id`, `date`, `category`, `description`, `amount`, `payee`, `createdBy`, `createdAt`, `updatedAt` |
| `Sesari` | `id`, `date`, `direction`, `category`, `amount`, `description`, `createdBy`, `createdAt` |
| `Sukaduka` | `id`, `date`, `direction`, `recipient`, `purpose`, `amount`, `notes`, `createdBy`, `createdAt`, `memberId`, `memberName`, `cashPhysical`, `changeDue`, `changePaid`, `refundDebtAdded`, `refundDebt`, `arrears`, `proofPhotoUrl`, `chargeAmount`, `openingArrears` |
| `Punia` | `id`, `date`, `donor`, `donationType`, `itemName`, `quantity`, `amount`, `notes`, `createdBy`, `createdAt`, `eventName` |
| `Piodalan` | `id`, `date`, `eventName`, `category`, `itemName`, `quantity`, `direction`, `amount`, `description`, `createdBy`, `createdAt`, `donor` |
| `Aset` | `id`, `assetName`, `category`, `quantity`, `condition`, `rentalRate`, `photoUrl`, `notes`, `createdBy`, `createdAt`, `updatedAt`, `purchasePrice`, `rentalRateSemeton`, `rentalRateLuar` |
| `KegiatanMedia` | `id`, `title`, `description`, `mediaType`, `photoUrl`, `youtubeUrl`, `eventDate`, `visibility`, `createdBy`, `createdAt` |
| `InventarisLog` | `id`, `date`, `assetId`, `assetName`, `movement`, `quantity`, `condition`, `notes`, `createdBy`, `createdAt` |
| `SewaAset` | `id`, `date`, `assetId`, `assetName`, `renter`, `startDate`, `endDate`, `quantity`, `rentalIncome`, `maintenanceCost`, `status`, `notes`, `createdBy`, `createdAt`, `customerType` |
| `Notulensi` | `id`, `date`, `title`, `attendees`, `minutes`, `followUp`, `createdBy`, `createdAt` |
| `LaporanPersetujuan` | `id`, `period`, `status`, `approvedBy`, `approvedAt`, `notes` |
| `AuditLog` | `id`, `timestamp`, `userId`, `username`, `action`, `module`, `recordId`, `details` |

Nominal disimpan sebagai angka rupiah tanpa simbol pemisah. `direction` memakai `Masuk` atau `Keluar`. `Punia.donationType` memakai `Uang Tunai`, `Wijilan / Setoran wajib`, atau `Barang`; Wijilan/setoran wajib dicatat sebagai uang masuk dan dapat diberi nama piodalan pada `eventName`. Nilai barang dicatat di `amount` dan detail unit di `quantity`, tetapi tidak menambah kas. Buku piodalan juga menyimpan `itemName` dan `quantity` untuk punia barang. Pengeluaran perawatan aset dicatat di `SewaAset.maintenanceCost`.

Baris `MASTER_ANGGOTA` menjadi saldo berjalan, sedangkan setiap setoran disimpan sebagai baris baru di `TRANSAKSI_IURAN`; anggota dapat membayar beberapa kali pada periode yang sama. Pengeluaran dari kas iuran dicatat terpisah pada `PengeluaranIuran` dan ikut mengurangi saldo iuran serta saldo kas gabungan. Setelah tutup buku membuka periode berikutnya, tagihan baru ditambahkan ke sisa hutang sehingga anggota yang sudah lunas tetap dapat membayar periode baru. Menu `Anggota` menyinkronkan profil ke master. Jalankan ulang `setupSheets()` setelah pembaruan untuk menambahkan kolom baru di akhir sheet lama dan memigrasikan ledger `IuranTransaksi` sekali saja. Sukaduka kini menghitung tunggakan per anggota: `chargeAmount` menambah tagihan, sementara `amount` membayar tunggakan sebelumnya dan tagihan baru. Baris Sukaduka lama tanpa `chargeAmount` tidak dimasukkan ulang ke saldo tunggakan. Booking `SewaAset` memeriksa ketersediaan dengan rentang tanggal inklusif; tarif per item per hari dipilih dari `Aset.rentalRateSemeton` atau `Aset.rentalRateLuar` menurut jenis penyewa. Kolom `rentalRate` lama menjadi fallback untuk aset yang belum memiliki tarif baru.

### Input basket dan format Excel

Di menu **Iuran anggota** atau **Sukaduka**, pilih **Input basket / Excel**. Basket menampilkan seluruh anggota dan menyimpan semua pembayaran terpilih dalam satu permintaan. Tombol **Unduh format Excel** membuat `.xlsx` dengan `memberId` dan nama anggota sudah terisi; isi nominal pada baris yang dibayar, lalu unggah berkas tersebut. Menu **Dana Punia** dan **Piodalan** juga menyediakan basket dan template Excel untuk input banyak donor/transaksi sekaligus.

- Iuran: `memberId`, `memberName`, `date` (`YYYY-MM-DD`), `periodId` (`YYYY-MM`), `allocatedContribution`, `cashPhysical`, `changePaid`, `notes`.
- Sukaduka: `memberId`, `memberName`, `date` (`YYYY-MM-DD`), `chargeAmount`, `amount`, `cashPhysical`, `changePaid`, `purpose`, `notes`. `chargeAmount` menambah tagihan; `amount` adalah alokasi pembayaran yang boleh digunakan untuk tunggakan lama; `cashPhysical` adalah uang yang benar-benar diterima. Untuk mencatat tagihan tanpa pembayaran, isi tagihan dan set nominal serta uang fisik ke `0`.
- Nominal berupa angka rupiah, bukan teks dengan awalan `Rp`. Baris dengan nominal kosong atau nol dilewati. ID anggota dari template adalah acuan pencocokan; nama dapat dipakai bila ID tidak ada.
- Maksimal 500 pembayaran per pengiriman. Server memvalidasi saldo anggota dan menulis transaksi, saldo master, serta audit secara berkelompok.
- Punia: `date`, `donor`, `donationType`, `eventName`, `itemName`, `quantity`, `amount`, `notes`. Piodalan: `date`, `eventName`, `category`, `donor`, `itemName`, `quantity`, `direction`, `amount`, `description`. Untuk `Punia barang`, isi nama barang dan jumlah; untuk punia uang, isi donor dan nominal.
- Daftar terbaru hingga 100 entri punia uang/barang beserta nama pemberi ditampilkan pada dashboard publik.

### Akses per peran

| Peran | Hak akses |
| --- | --- |
| Admin | Semua modul dan pengelolaan akun |
| Ketua | Membaca seluruh modul, laporan, dan persetujuan akhir |
| Bendahara | CRUD iuran, sesari, sukaduka, punia, dan piodalan |
| Sekretaris | CRUD anggota, aset, log inventaris, sewa aset, notulensi, dan galeri; upload foto aset/kegiatan |
| Anggota / Publik | Ringkasan transparansi agregat, tanpa rincian anggota |

Otorisasi mutasi ditegakkan di Apps Script; menyembunyikan menu di React bukan kontrol keamanan.

## Build dan Deploy: Google Sheets sampai Vercel

Backend dan frontend dirilis terpisah: Google Apps Script menjadi API untuk Google Sheets, sedangkan Vercel meng-host frontend React/Vite.

### 1. Buat spreadsheet dan siapkan Apps Script

1. Buat Google Spreadsheet baru. Salin ID spreadsheet dari URL, yaitu bagian di antara `/d/` dan `/edit`.
2. Dari spreadsheet, buka **Extensions → Apps Script**. Ganti isi file script dengan isi `Code.gs` dari repo ini, lalu simpan project.
3. Di Apps Script, buka **Project Settings → Script Properties** dan tambahkan:

	| Property | Isi |
	| --- | --- |
	| `SPREADSHEET_ID` | ID spreadsheet dari langkah 1 |
	| `INITIAL_ADMIN_USERNAME` | Username admin awal |
	| `INITIAL_ADMIN_PASSWORD` | Password awal, minimal 12 karakter |
	| `INITIAL_ADMIN_NAME` | Nama admin yang ditampilkan |
	| `DRIVE_FOLDER_ID` | Opsional: ID folder induk untuk foto |

	`SPREADSHEET_ID` direkomendasikan meskipun script terikat ke spreadsheet. Jika `DRIVE_FOLDER_ID` tidak diisi, folder foto dibuat di Drive milik akun yang menjalankan script.

4. Dari dropdown fungsi di editor Apps Script, jalankan `createInitialAdmin()` dan setujui permintaan akses Google. Fungsi ini menjalankan `setupSheets()` untuk membuat semua tab/header lalu membuat akun admin awal di tab `Users`.
5. Setelah sukses, hapus nilai `INITIAL_ADMIN_PASSWORD` dari Script Properties. Jangan masukkan password admin ke repo atau ke Environment Variables Vercel.
6. Jika data anggota akan diimpor langsung ke tab `Anggota`, jalankan `setupSheets()` lagi setelah impor agar data anggota disinkronkan ke `MASTER_ANGGOTA`. Alternatifnya, masukkan anggota melalui aplikasi setelah deploy.

### 2. Deploy API sebagai Web App

1. Di Apps Script, pilih **Deploy → New deployment**, pilih jenis **Web app**.
2. Atur **Execute as** ke akun pengelola spreadsheet. Atur akses ke **Anyone** agar frontend publik dan pengguna aplikasi dapat mengakses API; autentikasi peran aplikasi tetap dilakukan oleh backend.
3. Pilih **Deploy**, selesaikan otorisasi, lalu salin URL Web App yang berakhiran `/exec`.
4. Uji URL dengan membuka `<URL_WEB_APP>/exec?action=health`. Respons yang diharapkan berisi `"ok":true`. Endpoint ini dan `publicSummary`/`publicGallery` memang publik; jangan membagikan spreadsheet atau project Apps Script sebagai editor.
5. Untuk foto, backend membuat subfolder `Foto Aset`, `Foto Kegiatan`, dan `Foto Sukaduka` otomatis. Foto aset dan kegiatan dapat dilihat siapa pun yang memiliki tautan; foto bukti Sukaduka mengikuti ACL Drive organisasi.

Jika kode `Code.gs` berubah di kemudian hari, perubahan itu tidak otomatis terbit hanya dengan deploy Vercel. Buka **Deploy → Manage deployments**, edit deployment Web App, pilih **New version**, lalu deploy. URL `/exec` biasanya tetap sama.

### 3. Uji frontend secara lokal

1. Di root repo, salin `.env.example` menjadi `.env.local`, lalu isi URL API:

	```env
	VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
	```

2. Jalankan `npm install`, lalu `npm run dev`. Restart Vite jika `.env.local` diubah.
3. Masuk dengan akun admin awal. Pastikan dashboard membaca API, lalu uji tambah/baca data anggota dan galeri. Tanpa `VITE_APPS_SCRIPT_URL`, aplikasi berjalan dalam mode demo dan tidak menyimpan data ke Sheets.

`.env.local` sudah diabaikan Git. `VITE_APPS_SCRIPT_URL` masuk ke bundle frontend sehingga bukan tempat menyimpan rahasia; keamanan data tetap harus ditegakkan oleh Apps Script dan izin Google Drive.

### 4. Deploy frontend ke Vercel

1. Push repo ke GitHub, lalu masuk ke Vercel dan pilih **Add New → Project**. Import repository tersebut.
2. Untuk aplikasi di root repo, gunakan pengaturan:

	| Pengaturan | Nilai |
	| --- | --- |
	| Framework Preset | Vite |
	| Root Directory | `./` |
	| Build Command | `npm run build` |
	| Output Directory | `dist` |

3. Sebelum deploy, tambahkan **Environment Variable** `VITE_APPS_SCRIPT_URL` dengan URL `/exec` dari langkah 2. Pilih environment **Production**; tambahkan **Preview** juga jika deployment preview perlu memakai backend yang sama.
4. Pilih **Deploy**. Vercel menjalankan build dan memberikan URL produksi. Buka URL itu, login sebagai admin, lalu pastikan dashboard dan data anggota tersambung ke spreadsheet.
5. Setiap push baru ke branch produksi akan memicu deployment baru. Jika Environment Variable berubah, jalankan redeploy agar nilainya masuk ke bundle.

### Pemeriksaan jika belum tersambung

- Jika aplikasi tampil dengan data simulasi, pastikan nama variable tepat `VITE_APPS_SCRIPT_URL`, nilainya berakhiran `/exec`, dan deployment Vercel dijalankan ulang.
- Jika endpoint health tidak merespons `ok: true`, periksa URL Web App, izin akses deployment, dan otorisasi akun pengelola.
- Jika login gagal, pastikan akun admin dibuat sekali oleh `createInitialAdmin()` dan statusnya aktif di tab `Users`.
- Jika data anggota tidak muncul di modul saldo, jalankan `setupSheets()` lagi untuk sinkronisasi ke `MASTER_ANGGOTA`.

Endpoint yang disediakan: `GET ?action=health`, `GET ?action=publicSummary`, `GET ?action=publicGallery`, `GET ?action=list&module=...&token=...`, serta POST JSON untuk `login`, `logout`, `summary`, `list`, `create`, `update`, `delete`, `batchPayments`, `batchCreate`, `closeBook`, `approveReport`, `publicGallery`, dan `uploadFile`.

Foto kegiatan/aset dapat dilihat oleh siapa pun yang memiliki tautan. Foto bukti Sukaduka tidak diberi izin `ANYONE_WITH_LINK`; akses mengikuti ACL Google Drive organisasi. Upload dibuat otomatis ke folder `Foto Aset`, `Foto Kegiatan`, dan `Foto Sukaduka` di bawah `DRIVE_FOLDER_ID` (atau Drive root skrip jika folder induk tidak diatur); ID subfolder tersimpan di `ASSET_PHOTO_FOLDER_ID`, `ACTIVITY_PHOTO_FOLDER_ID`, dan `SUKADUKA_PHOTO_FOLDER_ID`. Galeri publik hanya mengembalikan baris `KegiatanMedia` dengan `visibility=Publik`. Video YouTube disematkan dari ID video tanpa diunggah ulang.

`closeBook` menutup periode terbuka sebelumnya, membebankan target ke semua anggota aktif, membawa tunggakan iuran dan hutang kembalian per anggota, lalu membuat periode baru. Baris iuran menyimpan target, kas fisik diterima, kembalian yang semestinya, kembalian yang sudah diserahkan, saldo tunggakan, dan saldo hutang kembalian. Perhitungan server dilakukan ulang saat baris iuran dibuat atau diubah.

## Catatan operasional

- Apps Script Web App bukan pengganti backend dengan proteksi tingkat tinggi: spreadsheet dan project script tetap harus dibatasi ke pengelola tepercaya. Sesi login disimpan di `CacheService` selama enam jam.
- Upload foto dibatasi 5 MB dan format JPG, PNG, WEBP, GIF.
- Grafik UI memiliki data contoh ketika backend belum dikonfigurasi; siapkan agregasi ringkasan produksi sebelum menjadikan grafik tersebut sebagai laporan resmi.
