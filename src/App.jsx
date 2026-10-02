import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowUpRight, Boxes, CalendarDays, ChartNoAxesCombined, Eye, EyeOff,
  Check, ChevronDown, CircleDollarSign, ClipboardList, FileText, HandCoins,
  HeartHandshake, Landmark, LayoutDashboard, LogOut, Menu, Package, Plus,
  Search, Settings2, ShieldCheck, Sparkles, Trash2, TrendingUp, Users, Wallet, Download, Printer,
  X, Pencil, Camera, BookOpenCheck, MessageCircle, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import logo from '../logo takora.png'
import { backendConfigured, isDemo, request, uploadPhoto } from './api.js'

const DashboardCharts = lazy(() => import('./DashboardCharts.jsx'))

const roleNames = { Admin: 'Administrator', Ketua: 'Ketua', Bendahara: 'Bendahara', Sekretaris: 'Sekretaris', Publik: 'Anggota / Publik' }
const organizationAddress = 'Telagabeteng, Banjar Dinas Tiyingtali Kelod, Desa Tiyingtali, Kec. Abang, Kab. Karangasem, Bali'
const signatories = [
  { title: 'Ketua', name: 'I GEDE SUARDIANA' },
  { title: 'Sekretaris', name: 'I GEDE AGUS SUPARDIANA' },
  { title: 'Bendahara', name: 'KOMANG YASMADIASA' },
]
const FINANCE_MODULES_UI = ['iuran', 'pengeluaranIuran', 'sesari', 'sukaduka', 'punia', 'piodalan']
const ORGANIZATION_MODULES_UI = ['aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan']
const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'UTAMA' },
  { id: 'iuran', label: 'Iuran anggota', icon: CircleDollarSign, group: 'KEUANGAN' },
  { id: 'pengeluaranIuran', label: 'Pengeluaran iuran', icon: ArrowUpRight, group: 'KEUANGAN' },
  { id: 'sesari', label: 'Sesari', icon: HandCoins, group: 'KEUANGAN' },
  { id: 'sukaduka', label: 'Sukaduka', icon: HeartHandshake, group: 'KEUANGAN' },
  { id: 'kewajiban', label: 'Rekap kewajiban', icon: ClipboardList, group: 'KEUANGAN' },
  { id: 'punia', label: 'Dana punia', icon: Wallet, group: 'KEUANGAN' },
  { id: 'piodalan', label: 'Piodalan', icon: Sparkles, group: 'KEUANGAN' },
  { id: 'aset', label: 'Aset & sewa', icon: Boxes, group: 'ORGANISASI' },
  { id: 'sewa', label: 'Transaksi sewa', icon: Landmark, group: 'ORGANISASI' },
  { id: 'inventaris', label: 'Log inventaris', icon: Package, group: 'ORGANISASI' },
  { id: 'anggota', label: 'Anggota', icon: Users, group: 'ORGANISASI' },
  { id: 'notulensi', label: 'Notulensi', icon: ClipboardList, group: 'ORGANISASI' },
  { id: 'kegiatan', label: 'Galeri kegiatan', icon: Camera, group: 'PUBLIK' },
  { id: 'laporan', label: 'Laporan', icon: FileText, group: 'PELAPORAN' },
  { id: 'users', label: 'Pengguna', icon: ShieldCheck, group: 'PENGATURAN' },
]
const permission = {
  Admin: ['dashboard', 'iuran', 'pengeluaranIuran', 'sesari', 'sukaduka', 'kewajiban', 'punia', 'piodalan', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan', 'laporan', 'users'],
  Ketua: ['dashboard', 'iuran', 'pengeluaranIuran', 'sesari', 'sukaduka', 'kewajiban', 'punia', 'piodalan', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan', 'laporan'],
  Bendahara: ['dashboard', 'iuran', 'pengeluaranIuran', 'sesari', 'sukaduka', 'kewajiban', 'punia', 'piodalan', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan', 'laporan'],
  Sekretaris: ['dashboard', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan', 'laporan'],
  Publik: ['dashboard', 'kegiatan'],
}
const modules = {
  iuran: { title: 'Iuran anggota', desc: 'Rekap pembayaran berulang, tunggakan per periode, dan kewajiban kembalian.', api: 'TRANSAKSI_IURAN', fields: [], columns: [['date', 'Tanggal'], ['memberName', 'Anggota'], ['periodId', 'Periode'], ['target', 'Target'], ['allocatedContribution', 'Uang untuk iuran'], ['cashPhysical', 'Uang diterima'], ['changeDue', 'Kembalian'], ['changePaid', 'Dibayarkan'], ['arrears', 'Sisa iuran saat itu'], ['refundDebt', 'Sisa kembalian'], ['currentArrears', 'Hutang iuran kini'], ['currentRefundDebt', 'Hutang kembalian kini']] },
  pengeluaranIuran: { title: 'Pengeluaran iuran', desc: 'Catat belanja dan pembayaran yang diambil dari kas iuran.', api: 'PengeluaranIuran', fields: [['date', 'Tanggal pengeluaran', 'date'], ['category', 'Kategori', 'select:Operasional|Kegiatan|Konsumsi|Perlengkapan|Lainnya'], ['description', 'Uraian pengeluaran', 'text'], ['payee', 'Penerima pembayaran', 'text'], ['amount', 'Nominal', 'number']], columns: [['date', 'Tanggal'], ['category', 'Kategori'], ['description', 'Uraian'], ['payee', 'Penerima'], ['amount', 'Nominal']] },
  sesari: { title: 'Sesari', desc: 'Arus dana sesari persembahyangan.', api: 'Sesari', fields: [['date', 'Tanggal transaksi', 'date'], ['direction', 'Arus kas', 'select:Masuk|Keluar'], ['category', 'Sumber / kategori', 'text'], ['amount', 'Nominal', 'number'], ['description', 'Keterangan', 'text']], columns: [['date', 'Tanggal'], ['direction', 'Arus'], ['category', 'Kategori'], ['description', 'Keterangan'], ['amount', 'Nominal']] },
  sukaduka: { title: 'Sukaduka', desc: 'Tagihan dan pembayaran per anggota dengan saldo tunggakan otomatis.', api: 'Sukaduka', fields: [], columns: [['date', 'Tanggal'], ['direction', 'Arus'], ['memberName', 'Anggota'], ['recipient', 'Penerima / penyetor'], ['purpose', 'Peruntukan'], ['chargeAmount', 'Tagihan baru'], ['amount', 'Dialokasikan'], ['arrears', 'Sisa tunggakan'], ['cashPhysical', 'Uang fisik'], ['changeDue', 'Kembalian'], ['changePaid', 'Dibayarkan'], ['refundDebt', 'Hutang kembalian'], ['proofPhotoUrl', 'Bukti']] },
  punia: { title: 'Dana punia', desc: 'Donasi uang, Wijilan atau setoran wajib piodalan, dan barang.', api: 'Punia', fields: [['date', 'Tanggal transaksi', 'date'], ['donor', 'Nama pemberi', 'text'], ['donationType', 'Jenis punia', 'select:Uang Tunai|Wijilan / Setoran wajib|Barang'], ['eventName', 'Nama piodalan (opsional)', 'text'], ['itemName', 'Nama barang (jika barang)', 'text'], ['quantity', 'Jumlah barang', 'number'], ['unit', 'Satuan (contoh: kg, lusin, bungkus)', 'text'], ['amount', 'Nominal / nilai barang', 'number'], ['notes', 'Catatan', 'text']], columns: [['date', 'Tanggal'], ['donor', 'Pemberi'], ['donationType', 'Jenis'], ['eventName', 'Piodalan'], ['itemName', 'Barang'], ['quantity', 'Jumlah'], ['unit', 'Satuan'], ['amount', 'Nilai'], ['notes', 'Catatan']] },
  piodalan: { title: 'Kas piodalan', desc: 'Buku kas khusus kepanitiaan piodalan.', api: 'Piodalan', fields: [['date', 'Tanggal transaksi', 'date'], ['eventName', 'Nama piodalan', 'text'], ['category', 'Jenis transaksi', 'select:Saldo awal|Punia uang|Punia barang|Wijilan / Setoran wajib|Belanja|Sesari piodalan'], ['donor', 'Nama penyumbang (untuk punia)', 'text'], ['memberId', 'Anggota (khusus Wijilan)', 'member'], ['chargeAmount', 'Tagihan Wijilan', 'number'], ['itemName', 'Nama barang (punia barang)', 'text'], ['quantity', 'Jumlah barang', 'number'], ['unit', 'Satuan (contoh: kg, lusin, bungkus)', 'text'], ['direction', 'Arus kas', 'select:Masuk|Keluar'], ['amount', 'Nominal dibayar / kas', 'number'], ['description', 'Keterangan', 'text']], columns: [['date', 'Tanggal'], ['eventName', 'Piodalan'], ['category', 'Kategori'], ['donor', 'Penyumbang / anggota'], ['chargeAmount', 'Tagihan Wijilan'], ['itemName', 'Barang'], ['quantity', 'Jumlah'], ['unit', 'Satuan'], ['direction', 'Arus'], ['description', 'Keterangan'], ['amount', 'Nominal']] },
  aset: { title: 'Aset & sewa alat', desc: 'Daftar alat, jumlah, dua tarif sewa, foto, dan kondisi.', api: 'Aset', fields: [['assetName', 'Nama barang', 'text'], ['category', 'Kategori', 'text'], ['quantity', 'Jumlah item dimiliki', 'number'], ['condition', 'Kondisi', 'select:Baik|Perlu perawatan|Rusak'], ['purchasePrice', 'Harga saat beli / item', 'number'], ['rentalRateSemeton', 'Tarif Semeton / item / hari', 'number'], ['rentalRateLuar', 'Tarif orang luar / item / hari', 'number'], ['photoFile', 'Foto barang', 'file'], ['photoUrl', 'URL foto (otomatis)', 'text'], ['notes', 'Catatan', 'text']], columns: [['assetName', 'Nama barang'], ['category', 'Kategori'], ['quantity', 'Jumlah'], ['available', 'Tersedia kini'], ['currentRenter', 'Sedang disewa oleh'], ['purchasePrice', 'Harga beli'], ['rentalRateSemeton', 'Sewa Semeton'], ['rentalRateLuar', 'Sewa luar'], ['condition', 'Kondisi'], ['photoUrl', 'Foto']] },
  sewa: { title: 'Transaksi sewa aset', desc: 'Pilih alat berdasarkan stok tersedia, jenis penyewa, dan rentang tanggal sewa.', api: 'SewaAset', fields: [], columns: [['date', 'Tanggal'], ['assetName', 'Barang'], ['renter', 'Penyewa'], ['customerType', 'Jenis penyewa'], ['startDate', 'Mulai'], ['endDate', 'Selesai'], ['quantity', 'Jumlah'], ['rentalIncome', 'Pemasukan'], ['maintenanceCost', 'Perawatan'], ['status', 'Status']] },
  inventaris: { title: 'Log inventaris', desc: 'Riwayat barang masuk dan keluar dari inventaris.', api: 'InventarisLog', fields: [['date', 'Tanggal transaksi', 'date'], ['assetId', 'ID aset', 'text'], ['assetName', 'Nama barang', 'text'], ['movement', 'Pergerakan', 'select:Masuk|Keluar'], ['quantity', 'Jumlah', 'number'], ['condition', 'Kondisi', 'select:Baik|Perlu perawatan|Rusak'], ['notes', 'Catatan', 'text']], columns: [['date', 'Tanggal'], ['assetName', 'Barang'], ['movement', 'Pergerakan'], ['quantity', 'Jumlah'], ['condition', 'Kondisi'], ['notes', 'Catatan']] },
  anggota: { title: 'Manajemen anggota', desc: 'Data keanggotaan organisasi.', api: 'Anggota', fields: [['memberName', 'Nama lengkap', 'text'], ['memberNo', 'Nomor anggota', 'text'], ['phone', 'Nomor telepon', 'text'], ['address', 'Alamat', 'text'], ['status', 'Status', 'select:Aktif|Nonaktif']], columns: [['memberNo', 'Nomor'], ['memberName', 'Nama anggota'], ['phone', 'Telepon'], ['address', 'Alamat'], ['status', 'Status']] },
  notulensi: { title: 'Notulensi', desc: 'Arsip keputusan rapat dengan pesan yang dapat dibagikan ke WhatsApp.', api: 'Notulensi', fields: [['date', 'Tanggal rapat', 'date'], ['title', 'Agenda / judul', 'text'], ['attendees', 'Peserta', 'text'], ['minutes', 'Catatan dan keputusan', 'textarea'], ['followUp', 'Tindak lanjut', 'textarea']], columns: [['date', 'Tanggal'], ['title', 'Agenda'], ['attendees', 'Peserta'], ['minutes', 'Catatan'], ['followUp', 'Tindak lanjut']] },
  kegiatan: { title: 'Galeri kegiatan', desc: 'Dokumentasi foto dan video kegiatan organisasi.', api: 'KegiatanMedia', fields: [], columns: [] },
  users: { title: 'Pengguna & akses', desc: 'Kelola akun dan peran akses sistem.', api: 'Users', fields: [['name', 'Nama', 'text'], ['username', 'Username', 'text'], ['password', 'Kata sandi (min. 12 karakter)', 'password'], ['role', 'Peran', 'select:Admin|Ketua|Bendahara|Sekretaris|Publik'], ['status', 'Status akun', 'select:Aktif|Nonaktif']], columns: [['name', 'Nama'], ['username', 'Username'], ['role', 'Peran'], ['status', 'Status']] },
  laporan: { title: 'Laporan keuangan', desc: 'Rangkuman kas, transaksi, dan transparansi organisasi.', api: 'all', fields: [], columns: [] },
}
const initialRows = {
  iuran: [],
  pengeluaranIuran: [],
  sesari: [],
  sukaduka: [],
  punia: [],
  piodalan: [],
  aset: [],
  sewa: [],
  anggota: [],
  notulensi: [],
  kegiatan: [],
  users: [],
}
const demoModuleBalances = {
  iuran: { incoming: 0, outgoing: 0, balance: 0, unpaid: 0 },
  sukaduka: { incoming: 0, outgoing: 0, balance: 0, unpaid: 0 },
  sesari: { incoming: 0, outgoing: 0, balance: 0, unpaid: 0 },
  punia: { incoming: 0, outgoing: 0, balance: 0, unpaid: 0 },
  sewa: { incoming: 0, outgoing: 0, balance: 0, unpaid: 0 },
  piodalan: { incoming: 0, outgoing: 0, balance: 0, unpaid: 0 },
}
const moduleLabels = { iuran: 'Iuran', sukaduka: 'Sukaduka', sesari: 'Sesari', punia: 'Punia tunai', sewa: 'Sewa alat', piodalan: 'Piodalan' }
const moduleColors = { iuran: '#b5122a', sukaduka: '#242424', sesari: '#777777', punia: '#2563eb', sewa: '#15803d', piodalan: '#eab308' }
const openingBalanceDefaults = { iuran: 0, sukaduka: 0, sesari: 0 }
const emptyOpeningBalances = Object.fromEntries(Object.keys(openingBalanceDefaults).map((module) => [module, { amount: 0, date: '', notes: '', configured: false }]))
const currency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0)
const createTransactionId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
const readableDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
function PrintLetterhead({ title, detail }) {
  return <header className="print-heading"><img src={logo} alt="Logo SENDETAN TAKORA" className="print-logo" /><div className="print-heading-copy"><h1>SENDETAN TELAGA BETENG</h1><p>{organizationAddress}</p><h2>{title}</h2>{detail && <p>{detail}</p>}</div></header>
}
function PrintSignatures() {
  return <footer className="print-signatures">{signatories.map((person) => <div key={person.title}><b>{person.title}</b><span></span><strong>{person.name}</strong></div>)}</footer>
}
function matchesDateFilter(row, filters) {
  const date = String(row.date || row.eventDate || row.periodId || '').slice(0, 10)
  return (!filters.year || date.slice(0, 4) === filters.year)
    && (!filters.month || date.slice(5, 7) === filters.month)
    && (!filters.day || date.slice(8, 10) === filters.day)
}
function App() {
  const savedSession = isDemo ? localStorage.getItem('takora-role') : localStorage.getItem('takora-token')
  const [authenticated, setAuthenticated] = useState(Boolean(savedSession))
  const [role, setRole] = useState(savedSession ? (localStorage.getItem('takora-role') || 'Bendahara') : 'Publik')
  const [token, setToken] = useState(localStorage.getItem('takora-token') || '')
  const [userName, setUserName] = useState(savedSession ? (localStorage.getItem('takora-name') || 'I Made Sudarma') : 'Anggota')
  const [active, setActive] = useState(() => sessionStorage.getItem('takora-active') || 'dashboard')
  const [rows, setRows] = useState(() => Object.fromEntries(Object.keys(initialRows).map((key) => [key, []])))
  const [masterMembers, setMasterMembers] = useState([])
  const [contacts, setContacts] = useState([])
  const [rentalAssets, setRentalAssets] = useState([])
  const [rentalRows, setRentalRows] = useState([])
  const [publicActivities, setPublicActivities] = useState([])
  const [memberDuesData, setMemberDuesData] = useState({ members: [], masterMembers: [], iuran: [], sukaduka: [], piodalan: [] })
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [balanceModal, setBalanceModal] = useState(false)
  const [openingBalanceModal, setOpeningBalanceModal] = useState(false)
  const [openingBalances, setOpeningBalances] = useState(emptyOpeningBalances)
  const [batchModal, setBatchModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('')
  const [dashboardFilter, setDashboardFilter] = useState({ year: '', month: '', day: '' })
  const [busyAction, setBusyAction] = useState('')
  const operationRef = useRef(false)
  const uploadedPhotoUrls = useRef(new Map())
  const [dashboardHidden, setDashboardHidden] = useState(localStorage.getItem('takora-dashboard-hidden') === 'true')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('takora-sidebar-collapsed') === 'true')
  const [login, setLogin] = useState({ username: '', password: '', role: 'Bendahara' })

  const allowed = permission[role] || permission.Publik
  const showSidebar = authenticated && role !== 'Publik'
  const menu = navigation.filter((item) => allowed.includes(item.id))
  const writable = role === 'Admin' || (role === 'Bendahara' && [...FINANCE_MODULES_UI, ...ORGANIZATION_MODULES_UI].includes(active)) || (role === 'Sekretaris' && ORGANIZATION_MODULES_UI.includes(active))
  const page = active === 'kewajiban'
    ? { title: 'Rekap kewajiban anggota', desc: 'Status iuran, Sukaduka, Wijilan, dan input harian per anggota.', api: 'memberDues', duesData: memberDuesData }
    : modules[active]
  const currentRows = rows[active] || []

  useEffect(() => {
    if (!isDemo) return
    localStorage.setItem('takora-demo-rows', JSON.stringify(rows))
    localStorage.setItem('takora-demo-members', JSON.stringify(masterMembers))
    localStorage.setItem('takora-demo-contacts', JSON.stringify(contacts))
    localStorage.setItem('takora-demo-assets', JSON.stringify(rentalAssets))
    localStorage.setItem('takora-demo-rentals', JSON.stringify(rentalRows))
    localStorage.setItem('takora-demo-opening-balances', JSON.stringify(openingBalances))
  }, [rows, masterMembers, contacts, rentalAssets, rentalRows, openingBalances])

  useEffect(() => {
    sessionStorage.setItem('takora-active', active)
  }, [active])

  useEffect(() => {
    if (!allowed.includes(active)) setActive('dashboard')
  }, [role, active])

  useEffect(() => {
    if (!isDemo && active === 'dashboard') {
      let cancelled = false
      const loadSummary = token ? request('summary', { filters: dashboardFilter }, token) : request('publicSummary', { filters: dashboardFilter })
      loadSummary.then((result) => {
        if (cancelled) return
        if (result.cards) setSummary(result)
        else if (result.summary) setSummary({ monthly: result.summary.monthly, sources: result.summary.sources, modules: result.summary.modules, outstanding: result.summary.outstanding, donations: result.summary.donations || [], activities: result.summary.activities || [], piodalanReport: result.summary.piodalanReport || [], assets: result.summary.assets || [], cards: [
          { label: dashboardFilter.year || dashboardFilter.month || dashboardFilter.day ? 'Selisih arus kas sesuai filter' : 'Saldo kas gabungan · semua', value: result.summary.balance, trend: dashboardFilter.year || dashboardFilter.month || dashboardFilter.day ? 'Periode terpilih' : 'Semua' },
          { label: dashboardFilter.year || dashboardFilter.month || dashboardFilter.day ? 'Penerimaan sesuai filter' : 'Penerimaan · semua', value: result.summary.income, trend: dashboardFilter.year || dashboardFilter.month || dashboardFilter.day ? 'Periode terpilih' : 'Semua' },
          { label: dashboardFilter.year || dashboardFilter.month || dashboardFilter.day ? 'Pengeluaran sesuai filter' : 'Pengeluaran · semua', value: result.summary.expenses, trend: dashboardFilter.year || dashboardFilter.month || dashboardFilter.day ? 'Periode terpilih' : 'Semua' },
        ] })
      }).catch((error) => { if (!cancelled) setNotice(error.message) })
      return () => { cancelled = true }
    }
  }, [token, active, dashboardFilter.year, dashboardFilter.month, dashboardFilter.day])

  useEffect(() => {
    if (isDemo) return
    request('publicGallery').then((result) => setPublicActivities(result.data || []))
      .catch((error) => setNotice(error.message))
  }, [])

  useEffect(() => {
    if (active === 'dashboard' || active === 'laporan' || active === 'kegiatan' || active === 'kewajiban' || active === 'users' && role !== 'Admin') return
    if (!isDemo && token && page) {
      setLoading(true)
      request('list', { module: page.api }, token)
        .then((result) => setRows((previous) => ({ ...previous, [active]: result.data || [] })))
        .catch((error) => setNotice(error.message))
        .finally(() => setLoading(false))
    }
  }, [active, token, role])

  useEffect(() => {
    if (active !== 'kegiatan') return
    if (isDemo) {
      setRows((previous) => ({ ...previous, kegiatan: initialRows.kegiatan }))
      return
    }
    const load = token && ['Admin', 'Sekretaris'].includes(role) ? request('list', { module: 'KegiatanMedia' }, token) : request('publicGallery')
    load.then((result) => setRows((previous) => ({ ...previous, kegiatan: result.data || [] })))
      .catch((error) => setNotice(error.message))
  }, [active, token, role])

  useEffect(() => {
    if ((active !== 'iuran' && active !== 'sukaduka' && active !== 'piodalan' && !(active === 'anggota' && role === 'Admin')) || isDemo || !token) return
    request('masterAnggota', {}, token)
      .then((result) => setMasterMembers(result.members || []))
      .catch((error) => setNotice(error.message))
  }, [active, token, role])

  useEffect(() => {
    if (!['iuran', 'sukaduka', 'sesari'].includes(active) || isDemo || !token) return
    request('openingBalances', {}, token)
      .then((result) => setOpeningBalances(result.balances || emptyOpeningBalances))
      .catch((error) => setNotice(error.message))
  }, [active, token, role])

  useEffect(() => {
    if (isDemo || !token) return
    if (active === 'sewa' || active === 'aset') {
      Promise.all([
        request('list', { module: 'Aset' }, token),
        request('list', { module: 'SewaAset' }, token),
      ]).then(([assets, rentals]) => {
        setRentalAssets(assets.data || [])
        setRentalRows(rentals.data || [])
      }).catch((error) => setNotice(error.message))
    }
    if (active === 'sukaduka' || active === 'notulensi') {
      request('list', { module: 'Anggota' }, token)
        .then((result) => setContacts(result.data || []))
        .catch((error) => setNotice(error.message))
    }
  }, [active, token, role])

  useEffect(() => {
    if (active !== 'kewajiban' || !token) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      request('list', { module: 'Anggota' }, token),
      request('masterAnggota', {}, token),
      request('list', { module: 'TRANSAKSI_IURAN' }, token),
      request('list', { module: 'Sukaduka' }, token),
      request('list', { module: 'Piodalan' }, token),
    ]).then(([members, master, iuran, sukaduka, piodalan]) => {
      if (cancelled) return
      setMemberDuesData({
        members: members.data || [],
        masterMembers: master.members || [],
        iuran: iuran.data || [],
        sukaduka: sukaduka.data || [],
        piodalan: piodalan.data || [],
      })
    }).catch((error) => { if (!cancelled) setNotice(error.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [active, token, role])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filteredRows = useMemo(() => currentRows.filter((row) => {
    const matchesSearch = JSON.stringify(row).toLowerCase().includes(query.toLowerCase())
    const rowPeriod = String(row.periodId || row.date || '').slice(0, 7)
    return matchesSearch && (!periodFilter || rowPeriod === periodFilter)
  }), [currentRows, query, periodFilter])

  async function runExclusive(action, callback) {
    if (operationRef.current) return
    operationRef.current = true
    setBusyAction(action)
    try { return await callback() }
    finally {
      operationRef.current = false
      setBusyAction('')
    }
  }

  function toggleDashboard() {
    setDashboardHidden((hidden) => {
      localStorage.setItem('takora-dashboard-hidden', String(!hidden))
      return !hidden
    })
  }

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem('takora-sidebar-collapsed', String(!collapsed))
      return !collapsed
    })
  }

  async function signIn(event) {
    event.preventDefault()
    if (isDemo) {
      setRole(login.role)
      setUserName(login.username || roleNames[login.role])
      setAuthenticated(true)
      setSidebarCollapsed(false)
      localStorage.setItem('takora-sidebar-collapsed', 'false')
      localStorage.setItem('takora-role', login.role)
      localStorage.setItem('takora-name', login.username || roleNames[login.role])
      setLoginOpen(false)
      setActive('dashboard')
      setNotice(`Mode demo aktif sebagai ${roleNames[login.role]}.`)
      return
    }
    try {
      const result = await request('login', { username: login.username, password: login.password })
      setToken(result.token)
      setRole(result.user.role)
      setUserName(result.user.name)
      setAuthenticated(true)
      setSidebarCollapsed(false)
      localStorage.setItem('takora-sidebar-collapsed', 'false')
      localStorage.setItem('takora-token', result.token)
      localStorage.setItem('takora-role', result.user.role)
      localStorage.setItem('takora-name', result.user.name)
      setLoginOpen(false)
      setNotice('Berhasil masuk. Sesi aktif.')
    } catch (error) { setNotice(error.message) }
  }

  async function signOut() {
    let serverLogoutSucceeded = false
    if (!isDemo && token) {
      try { await request('logout', {}, token); serverLogoutSucceeded = true }
      catch { setNotice('Keluar berhasil di perangkat ini. Sesi server akan berakhir otomatis.') }
    }
    setToken('')
    setRole('Publik')
    setAuthenticated(false)
    setUserName('Anggota')
    localStorage.removeItem('takora-token')
    localStorage.removeItem('takora-role')
    localStorage.removeItem('takora-name')
    setActive('dashboard')
    if (isDemo || !token || serverLogoutSucceeded) setNotice('Berhasil keluar.')
  }

  async function saveRecord(event) {
    event.preventDefault()
    const form = event.currentTarget
    if (!editing && !form.dataset.requestId) form.dataset.requestId = createTransactionId(page.api.slice(0, 2).toUpperCase())
    const pendingPayload = form.dataset.requestPayload
    const formData = pendingPayload ? null : new FormData(form)
    const values = pendingPayload ? JSON.parse(pendingPayload) : Object.fromEntries(formData.entries())
    if (active === 'piodalan' && ['Punia uang', 'Punia barang', 'Wijilan / Setoran wajib'].includes(values.category) && !String(values.donor || '').trim()) {
      setNotice('Nama penyumbang wajib diisi untuk transaksi punia piodalan.')
      return
    }
    if (active === 'aset' && formData?.get('photoFile')?.size) {
      try {
        if (!form.dataset.photoUrl) form.dataset.photoUrl = (await uploadPhoto(formData.get('photoFile'), token)).url
        values.photoUrl = form.dataset.photoUrl
      } catch (error) { setNotice(error.message); return }
    }
    if (!pendingPayload) delete values.photoFile
    if (['amount', 'chargeAmount', 'target', 'cashPhysical', 'changeDue', 'changePaid', 'arrears', 'refundDebt', 'quantity', 'rentalRate', 'rentalRateSemeton', 'rentalRateLuar', 'purchasePrice', 'rentalIncome', 'maintenanceCost'].some((field) => field in values)) {
      for (const key of Object.keys(values)) if (['amount', 'chargeAmount', 'target', 'cashPhysical', 'changeDue', 'changePaid', 'arrears', 'refundDebt', 'quantity', 'rentalRate', 'rentalRateSemeton', 'rentalRateLuar', 'purchasePrice', 'rentalIncome', 'maintenanceCost'].includes(key)) values[key] = Number(values[key]) || 0
    }
    const updated = pendingPayload ? values : editing ? { ...editing, ...values } : { id: form.dataset.requestId, ...values }
    try {
      form.dataset.requestPayload = JSON.stringify(updated)
      let savedRecord = updated
      if (!isDemo) {
        const result = await request(editing ? 'update' : 'create', { module: page.api, record: updated }, token)
        savedRecord = result.record || updated
      }
      setRows((previous) => ({ ...previous, [active]: editing ? (previous[active] || []).map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...(previous[active] || [])] }))
      if (active === 'aset') setRentalAssets((previous) => editing ? previous.map((row) => row.id === editing.id ? updated : row) : [updated, ...previous])
      if (active === 'sewa') setRentalRows((previous) => editing ? previous.map((row) => row.id === editing.id ? updated : row) : [updated, ...previous])
      setNotice(editing ? 'Data berhasil diperbarui.' : 'Data berhasil disimpan.')
      delete form.dataset.requestPayload
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message); throw error }
  }

  async function saveRental(record) {
    const updated = editing ? { ...editing, ...record } : { ...record, id: record.id || createTransactionId('SW') }
    try {
      let savedRecord = updated
      if (!isDemo) {
        const result = await request(editing ? 'update' : 'create', { module: 'SewaAset', record: updated }, token)
        savedRecord = result.record || updated
      }
      setRows((previous) => ({ ...previous, sewa: editing ? previous.sewa.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...(previous.sewa || [])] }))
      setRentalRows((previous) => editing ? previous.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...previous])
      setNotice(editing ? 'Transaksi sewa diperbarui.' : 'Transaksi sewa disimpan.')
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message); throw error }
  }

  async function saveActivity(record) {
    const updated = editing ? { ...editing, ...record } : { ...record, id: record.id || createTransactionId('KM') }
    try {
      if (record.photoFile?.size) {
        const uploadKey = `activities:${updated.id}`
        if (!uploadedPhotoUrls.current.has(uploadKey)) uploadedPhotoUrls.current.set(uploadKey, (await uploadPhoto(record.photoFile, token, 'activities')).url)
        updated.photoUrl = uploadedPhotoUrls.current.get(uploadKey)
      }
      delete updated.photoFile
      let savedRecord = updated
      if (!isDemo) {
        const result = await request(editing ? 'update' : 'create', { module: 'KegiatanMedia', record: updated }, token)
        savedRecord = result.record || updated
      }
      setRows((previous) => ({ ...previous, kegiatan: editing ? previous.kegiatan.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...(previous.kegiatan || [])] }))
      setPublicActivities((previous) => editing ? previous.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...previous])
      uploadedPhotoUrls.current.delete(`activities:${updated.id}`)
      setNotice(editing ? 'Dokumentasi kegiatan diperbarui.' : 'Dokumentasi kegiatan dipublikasikan.')
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message); throw error }
  }

  async function saveSukaduka(record) {
    const updated = editing ? { ...editing, ...record } : { ...record, id: record.id || createTransactionId('SK') }
    try {
      if (record.proofFile?.size) {
        const uploadKey = `sukaduka:${updated.id}`
        if (!uploadedPhotoUrls.current.has(uploadKey)) uploadedPhotoUrls.current.set(uploadKey, (await uploadPhoto(record.proofFile, token, 'sukaduka')).url)
        updated.proofPhotoUrl = uploadedPhotoUrls.current.get(uploadKey)
      }
      delete updated.proofFile
      let savedRecord = updated
      let savedMember = null
      if (!isDemo) {
        const result = await request(editing ? 'update' : 'create', { module: 'Sukaduka', record: updated }, token)
        savedRecord = result.record || updated
        savedMember = result.member || null
      } else if (record.direction === 'Masuk') {
        const previousMember = masterMembers.find((member) => String(member.ID) === String(record.memberId))
        const existingTracksArrears = editing && editing.chargeAmount !== '' && editing.chargeAmount !== undefined && editing.chargeAmount !== null
        const oldArrearsEffect = existingTracksArrears ? Number(editing.chargeAmount || 0) - Number(editing.amount || 0) : 0
        savedMember = {
          ID: record.memberId,
          Nama: record.memberName,
          Sisa_Hutang_Iuran: Number(previousMember?.Sisa_Hutang_Iuran || 0),
          Sisa_Hutang_Kembalian: Math.max(0, Number(previousMember?.Sisa_Hutang_Kembalian || 0) - Number(editing?.refundDebtAdded || 0)) + record.refundDebtAdded,
          Sisa_Hutang_Sukaduka: Math.max(0, Number(previousMember?.Sisa_Hutang_Sukaduka || 0) - oldArrearsEffect + Number(record.chargeAmount || 0) - Number(record.amount || 0)),
        }
      }
      setRows((previous) => ({ ...previous, sukaduka: editing ? previous.sukaduka.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...(previous.sukaduka || [])] }))
      if (savedMember) setMasterMembers((previous) => previous.map((member) => String(member.ID) === String(savedMember.ID) ? { ...member, ...savedMember } : member))
      uploadedPhotoUrls.current.delete(`sukaduka:${updated.id}`)
      setNotice(editing ? 'Transaksi sukaduka diperbarui.' : 'Transaksi sukaduka disimpan.')
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message); throw error }
  }

  async function saveIuran(record) {
    const updated = editing ? { ...editing, ...record, id: editing.id } : { ...record, id: record.id || createTransactionId('IU') }
    try {
      let savedRecord = updated
      let savedMember = null
      if (!isDemo) {
        const result = await request(editing ? 'update' : 'create', { module: page.api, record: updated }, token)
        savedRecord = result.record || updated
        savedMember = result.member || null
      } else {
        const previousMember = masterMembers.find((member) => String(member.ID) === String(updated.memberId))
        savedMember = {
          ID: updated.memberId,
          Nama: updated.memberName,
          Sisa_Hutang_Iuran: updated.arrears,
          Sisa_Hutang_Kembalian: Math.max(0, Number(previousMember?.Sisa_Hutang_Kembalian || 0) - Number(editing?.refundDebtAdded || 0)) + updated.refundDebtAdded,
        }
      }
      setRows((previous) => ({
        ...previous,
        iuran: editing ? previous.iuran.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...(previous.iuran || [])],
      }))
      if (savedMember) setMasterMembers((previous) => previous.map((member) => String(member.ID) === String(savedMember.ID) ? { ...member, ...savedMember } : member))
      setNotice(editing ? 'Transaksi iuran diperbarui dan saldo anggota disinkronkan.' : 'Transaksi iuran disimpan dan saldo anggota diperbarui.')
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message); throw error }
  }

  async function refreshActiveModuleData() {
    if (isDemo || !token || !page) return
    if (active === 'iuran' || active === 'sukaduka') {
      const [transactions, members] = await Promise.all([
        request('list', { module: page.api }, token),
        request('masterAnggota', {}, token),
      ])
      setRows((previous) => ({ ...previous, [active]: transactions.data || [] }))
      setMasterMembers(members.members || [])
      return
    }
    if (active === 'aset' || active === 'sewa') {
      const [assets, rentals] = await Promise.all([
        request('list', { module: 'Aset' }, token),
        request('list', { module: 'SewaAset' }, token),
      ])
      setRentalAssets(assets.data || [])
      setRentalRows(rentals.data || [])
      setRows((previous) => ({ ...previous, aset: assets.data || [], sewa: rentals.data || [] }))
      return
    }
    const result = await request('list', { module: page.api }, token)
    setRows((previous) => ({ ...previous, [active]: result.data || [] }))
  }

  function closeRecordModal() {
    if (operationRef.current) return
    setModal(false)
    setEditing(null)
    refreshActiveModuleData().catch((error) => setNotice(error.message))
  }

  function closeBatchModal() {
    if (operationRef.current) return
    setBatchModal(false)
    refreshActiveModuleData().catch((error) => setNotice(error.message))
  }

  async function saveMasterBalance(record) {
    try {
      let member
      if (!isDemo) {
        const action = role === 'Bendahara' ? 'adjustIuranBalance' : 'adjustMemberBalance'
        const payload = role === 'Bendahara'
          ? { memberId: record.memberId, arrears: record.arrears, reason: record.reason }
          : record
        const result = await request(action, payload, token)
        member = result.member
      } else {
        const previous = masterMembers.find((item) => String(item.ID) === String(record.memberId))
        member = { ...previous, Sisa_Hutang_Iuran: record.arrears, ...(role === 'Bendahara' ? {} : { Sisa_Hutang_Kembalian: record.refundDebt }) }
      }
      setMasterMembers((previous) => previous.map((item) => String(item.ID) === String(member.ID) ? { ...item, ...member } : item))
      setNotice('Saldo master diperbarui dan alasan koreksi dicatat di audit.')
      setBalanceModal(false)
    } catch (error) { setNotice(error.message) }
  }

  async function saveSukadukaBalance(record) {
    try {
      const current = masterMembers.find((item) => String(item.ID) === String(record.memberId)) || { Sisa_Hutang_Iuran: 0, Sisa_Hutang_Kembalian: 0, Sisa_Hutang_Sukaduka: 0 }
      let member
      if (!isDemo) {
        const payload = {
          memberId: record.memberId,
          sukadukaArrears: Number(record.sukadukaArrears || 0),
          reason: record.reason,
        }
        const result = await request('adjustSukadukaBalance', payload, token)
        member = result.member
      } else {
        member = { ...current, Sisa_Hutang_Sukaduka: Number(record.sukadukaArrears || 0) }
      }
      setMasterMembers((previous) => previous.map((item) => String(item.ID) === String(member.ID) ? { ...item, ...member } : item))
      setNotice('Saldo tunggakan Sukaduka berhasil diperbarui.')
      setBalanceModal(false)
    } catch (error) { setNotice(error.message) }
  }

  async function saveOpeningBalances(record) {
    try {
      let balances = Object.fromEntries(Object.entries(record.balances).map(([module, amount]) => [module, {
        amount: Number(amount), date: record.date, notes: record.notes, configured: true,
      }]))
      if (!isDemo) {
        const result = await request('setOpeningBalances', record, token)
        balances = result.balances
      }
      setOpeningBalances(balances)
      setOpeningBalanceModal(false)
      setNotice('Saldo awal kas berhasil disimpan.')
      if (!isDemo) request('summary', {}, token).then(setSummary).catch((error) => setNotice(error.message))
    } catch (error) { setNotice(error.message) }
  }

  async function deleteRecord(id) {
    if (!window.confirm('Hapus catatan ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      let result = null
      if (!isDemo) result = await request('delete', { module: page.api, id }, token)
      else if (active === 'iuran' || active === 'sukaduka') {
        const deleted = (rows.iuran || []).find((row) => row.id === id)
        const deletedSukaduka = (rows.sukaduka || []).find((row) => row.id === id)
        const transaction = active === 'iuran' ? deleted : deletedSukaduka
        if (transaction) setMasterMembers((previous) => previous.map((member) => {
          if (String(member.ID) !== String(transaction.memberId)) return member
          const tracksSukadukaArrears = active === 'sukaduka' && transaction.chargeAmount !== '' && transaction.chargeAmount !== undefined && transaction.chargeAmount !== null
          return {
            ...member,
            Sisa_Hutang_Iuran: Number(member.Sisa_Hutang_Iuran || 0) + Number(transaction.allocatedContribution || 0),
            Sisa_Hutang_Kembalian: Math.max(0, Number(member.Sisa_Hutang_Kembalian || 0) - Number(transaction.refundDebtAdded || 0)),
            Sisa_Hutang_Sukaduka: Math.max(0, Number(member.Sisa_Hutang_Sukaduka || 0) - (tracksSukadukaArrears ? Number(transaction.chargeAmount || 0) - Number(transaction.amount || 0) : 0)),
          }
        }))
      }
      setRows((previous) => ({ ...previous, [active]: (previous[active] || []).filter((row) => row.id !== id) }))
      if (active === 'sewa') setRentalRows((previous) => previous.filter((row) => row.id !== id))
      if (active === 'kegiatan') setPublicActivities((previous) => previous.filter((row) => row.id !== id))
      if (['iuran', 'sukaduka'].includes(active) && result?.member) setMasterMembers((previous) => previous.map((member) => String(member.ID) === String(result.member.ID) ? { ...member, ...result.member } : member))
      setNotice('Catatan berhasil dihapus.')
    } catch (error) { setNotice(error.message) }
  }

  async function closeBook() {
    const period = window.prompt('Periode baru (contoh: 2026-10). Tunggakan yang belum dibayar otomatis dibawa ke periode ini:')
    if (!period) return
    const targetInput = window.prompt('Target iuran baru per anggota (Rp). Nilai ini ditambahkan ke tunggakan sebelumnya:', '50000')
    if (targetInput === null || !targetInput.trim()) return
    const monthlyTarget = Number(targetInput)
    if (!Number.isFinite(monthlyTarget) || monthlyTarget < 0) return
    try {
      if (!isDemo) {
        await request('closeBook', { period, monthlyTarget, date: new Date().toISOString().slice(0, 10) }, token)
        const [transactions, members, refreshedSummary] = await Promise.all([
          request('list', { module: 'TRANSAKSI_IURAN' }, token),
          request('masterAnggota', {}, token),
          request('summary', {}, token),
        ])
        setRows((previous) => ({ ...previous, iuran: transactions.data || [] }))
        setMasterMembers(members.members || [])
        setSummary(refreshedSummary)
      } else {
        const date = new Date().toISOString().slice(0, 10)
        setMasterMembers((previous) => previous.map((member) => ({ ...member, Sisa_Hutang_Iuran: Number(member.Sisa_Hutang_Iuran || 0) + monthlyTarget })))
        setRows((previous) => ({ ...previous, iuran: [...(previous.iuran || []), ...masterMembers.map((member) => ({
          id: `IU-${Date.now()}-${member.ID}`, date, periodId: period, memberId: member.ID, memberName: member.Nama,
          target: Number(member.Sisa_Hutang_Iuran || 0) + monthlyTarget, allocatedContribution: 0, cashPhysical: 0,
          changeDue: 0, changePaid: 0, openingArrears: Number(member.Sisa_Hutang_Iuran || 0),
          arrears: Number(member.Sisa_Hutang_Iuran || 0) + monthlyTarget, openingRefundDebt: Number(member.Sisa_Hutang_Kembalian || 0),
          refundDebtAdded: 0, refundDebt: Number(member.Sisa_Hutang_Kembalian || 0), notes: `Tagihan dibuat saat tutup buku ${period}`,
        }))] }))
      }
      setNotice(`Tutup buku periode ${period} berhasil dibuat.`)
    } catch (error) { setNotice(error.message) }
  }

  const dashboardDonations = isDemo
    ? [...(rows.punia || []).map((row) => ({ ...row, module: 'Dana Punia' })), ...(rows.piodalan || []).filter((row) => ['Punia uang', 'Punia barang', 'Wijilan / Setoran wajib'].includes(row.category)).map((row) => ({ ...row, donor: row.donor || row.description, donationType: row.category === 'Punia barang' ? 'Barang' : 'Uang Tunai', module: 'Piodalan' }))]
      .filter((row) => row.donor && matchesDateFilter(row, dashboardFilter)).sort((left, right) => String(right.date || '').localeCompare(String(left.date || ''))).slice(0, 100)
    : summary?.donations || summary?.public?.donations || []
  const dashboardPiodalanReport = isDemo
    ? Object.values((rows.piodalan || []).filter((row) => matchesDateFilter(row, dashboardFilter)).reduce((events, row) => {
      const eventName = String(row.eventName || '').trim()
      if (!eventName) return events
      const event = events[eventName] || { eventName, income: 0, expenses: 0, goodsValue: 0 }
      const amount = Number(row.amount || 0)
      if (row.category === 'Punia barang' && row.direction === 'Masuk') event.goodsValue += amount
      else if (row.direction === 'Masuk') event.income += amount
      else if (row.direction === 'Keluar') event.expenses += amount
      event.balance = event.income - event.expenses
      events[eventName] = event
      return events
    }, {})).sort((left, right) => left.eventName.localeCompare(right.eventName, 'id'))
    : summary?.piodalanReport || summary?.public?.piodalanReport || []
  const demoDashboard = useMemo(() => {
    const entries = []
    function add(row, category, activity, direction, amount, source = '') {
      if (Number(amount) > 0 && matchesDateFilter(row, dashboardFilter)) entries.push({ date: String(row.date || '').slice(0, 10), category, activity, incoming: direction === 'Masuk', amount: Number(amount), source })
    }
    ;(rows.sesari || []).forEach((row) => add(row, 'Sesari', row.description || row.category || 'Transaksi Sesari', row.direction, row.amount, 'Sesari'))
    ;(rows.iuran || []).forEach((row) => add(row, 'Iuran', `Iuran ${row.memberName || 'anggota'}`, 'Masuk', row.cashPhysical, 'Iuran'))
    ;(rows.iuran || []).forEach((row) => add(row, 'Iuran', 'Kembalian iuran', 'Keluar', row.changePaid))
    ;(rows.pengeluaranIuran || []).forEach((row) => add(row, 'Iuran', row.category || 'Pengeluaran iuran', 'Keluar', row.amount))
    ;(rows.sukaduka || []).forEach((row) => {
      add(row, 'Sukaduka', row.purpose || 'Transaksi Sukaduka', row.direction, row.direction === 'Masuk' ? row.cashPhysical || row.amount : row.amount)
      if (row.direction === 'Masuk') add(row, 'Sukaduka', 'Kembalian Sukaduka', 'Keluar', row.changePaid)
    })
    ;(rows.punia || []).forEach((row) => {
      if (['Uang Tunai', 'Wijilan / Setoran wajib'].includes(row.donationType)) add(row, 'Punia', `Punia dari ${row.donor || 'donatur'}`, 'Masuk', row.amount, 'Punia')
    })
    ;(rows.piodalan || []).forEach((row) => {
      if (row.category !== 'Punia barang') add(row, 'Piodalan', row.eventName || row.description || 'Transaksi Piodalan', row.direction, row.amount, row.category === 'Punia uang' ? 'Punia' : row.category === 'Sesari piodalan' ? 'Sesari' : '')
    })
    Object.entries(openingBalances).forEach(([module, balance]) => {
      if (!balance.configured) return
      const category = module === 'iuran' ? 'Iuran' : module === 'sukaduka' ? 'Sukaduka' : 'Sesari'
      add({ date: balance.date }, category, `Saldo awal ${category}`, 'Masuk', balance.amount, category)
    })
    ;(rows.sewa || []).forEach((row) => {
      if (row.status !== 'Dibatalkan') {
        add(row, 'Sewa alat', `Sewa ${row.assetName || 'aset'}`, 'Masuk', row.rentalIncome)
        add(row, 'Sewa alat', 'Perawatan aset', 'Keluar', row.maintenanceCost)
      }
    })
    const modules = Object.fromEntries(Object.keys(demoModuleBalances).map((key) => [key, { incoming: 0, outgoing: 0, balance: 0, unpaid: demoModuleBalances[key].unpaid || 0 }]))
    const sourceTotals = { Iuran: 0, Sesari: 0, Punia: 0 }
    const monthlyTotals = new Map()
    entries.forEach((entry) => {
      const monthKey = entry.date.slice(0, 7)
      const month = monthlyTotals.get(monthKey) || { month: readableDate(`${monthKey}-01`).replace(/\s\d{4}$/, ''), masuk: 0, keluar: 0, income: 0, expenses: 0 }
      const field = entry.incoming ? 'incoming' : 'outgoing'
      const chartField = entry.incoming ? 'masuk' : 'keluar'
      const totalField = entry.incoming ? 'income' : 'expenses'
      month[chartField] += entry.amount / 1000000
      month[totalField] += entry.amount
      monthlyTotals.set(monthKey, month)
      if (entry.category === 'Iuran') modules.iuran[field] += entry.amount
      if (entry.category === 'Sesari') modules.sesari[field] += entry.amount
      if (entry.category === 'Sukaduka') modules.sukaduka[field] += entry.amount
      if (entry.category === 'Punia') modules.punia[field] += entry.amount
      if (entry.category === 'Piodalan') modules.piodalan[field] += entry.amount
      if (entry.category === 'Sewa alat') modules.sewa[field] += entry.amount
      if (entry.incoming && entry.source) sourceTotals[entry.source] += entry.amount
    })
    Object.values(modules).forEach((module) => { module.balance = module.incoming - module.outgoing })
    const sourceTotal = Object.values(sourceTotals).reduce((sum, amount) => sum + amount, 0)
    const colors = { Iuran: '#b5122a', Sesari: '#242424', Punia: '#777777' }
    const sources = Object.entries(sourceTotals).map(([name, amount]) => ({ name, value: sourceTotal ? Math.round(amount / sourceTotal * 100) : 0, color: colors[name] }))
    const selectedYear = dashboardFilter.year || String(new Date().getFullYear())
    const monthKeys = dashboardFilter.year || dashboardFilter.month
      ? (dashboardFilter.month ? [Number(dashboardFilter.month)] : Array.from({ length: 12 }, (_, index) => index + 1)).map((monthNumber) => `${selectedYear}-${String(monthNumber).padStart(2, '0')}`)
      : Array.from({ length: 6 }, (_, index) => {
        const date = new Date()
        date.setDate(1)
        date.setMonth(date.getMonth() - 5 + index)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      })
    const monthly = monthKeys.map((key) => monthlyTotals.get(key) || { month: new Date(`${key}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'short' }), masuk: 0, keluar: 0, income: 0, expenses: 0 })
    const hasDashboardFilter = Boolean(dashboardFilter.year || dashboardFilter.month || dashboardFilter.day)
    return {
      cards: [
        { label: hasDashboardFilter ? 'Selisih arus kas sesuai filter' : 'Saldo kas gabungan · semua', value: entries.reduce((sum, entry) => sum + (entry.incoming ? entry.amount : -entry.amount), 0), icon: Landmark, trend: hasDashboardFilter ? 'Periode terpilih' : 'Semua' },
        { label: hasDashboardFilter ? 'Penerimaan sesuai filter' : 'Penerimaan · semua', value: entries.filter((entry) => entry.incoming).reduce((sum, entry) => sum + entry.amount, 0), icon: ArrowDownLeft, trend: hasDashboardFilter ? 'Periode terpilih' : 'Semua' },
        { label: hasDashboardFilter ? 'Pengeluaran sesuai filter' : 'Pengeluaran · semua', value: entries.filter((entry) => !entry.incoming).reduce((sum, entry) => sum + entry.amount, 0), icon: ArrowUpRight, trend: hasDashboardFilter ? 'Periode terpilih' : 'Semua' },
        { label: 'Tunggakan iuran', value: masterMembers.reduce((sum, member) => sum + Number(member.Sisa_Hutang_Iuran || 0), 0), icon: Activity, trend: 'Saldo kewajiban anggota' },
      ],
      monthly,
      sources,
      modules,
      outstanding: { arrears: masterMembers.reduce((sum, member) => sum + Number(member.Sisa_Hutang_Iuran || 0), 0), refundDebt: masterMembers.reduce((sum, member) => sum + Number(member.Sisa_Hutang_Kembalian || 0), 0) },
      activities: entries.sort((left, right) => right.date.localeCompare(left.date)).slice(0, 12),
    }
  }, [rows, dashboardFilter, masterMembers, openingBalances])
  useEffect(() => {
    if (isDemo) setSummary(demoDashboard)
  }, [demoDashboard])
  const summaryCards = summary?.cards || (isDemo ? demoDashboard.cards : [
    { label: 'Saldo kas gabungan', value: 0, icon: Landmark, trend: 'Menunggu data' },
    { label: 'Penerimaan sesuai filter', value: 0, icon: ArrowDownLeft, trend: 'Menunggu data' },
    { label: 'Pengeluaran sesuai filter', value: 0, icon: ArrowUpRight, trend: 'Menunggu data' },
    { label: 'Tunggakan iuran', value: 0, icon: Activity, trend: 'Menunggu data' },
  ])

  return (
    <div className="tridatu-theme min-h-screen bg-[#f6f5ee] text-[#243a31]">
      {showSidebar && <>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-[#193b2d]/35 lg:hidden" aria-label="Tutup navigasi" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col overflow-hidden border-r border-[#e5e6dc] bg-[#fbfaf6] transition-all lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-0 lg:border-r-0' : 'lg:w-[260px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[82px] items-center gap-3 border-b border-[#e8e8df] px-5">
          <img src={logo} alt="Logo TAKORA" className={`rounded-full object-contain ${sidebarCollapsed ? 'h-10 w-10 lg:mx-auto' : 'h-12 w-12'}`} />
          <div className={sidebarCollapsed ? 'lg:hidden' : ''}><p className="font-display text-[12px] font-extrabold text-[#244332]">SENDETAN TAKORA</p><p className="mt-0.5 text-[10px] font-semibold tracking-[.08em] text-[#829085]">TELAGA BETENG</p></div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto rounded p-1 text-[#718076] lg:hidden" aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className={`mx-4 mt-4 rounded-md border border-[#e5e8df] bg-white px-3 py-3 ${sidebarCollapsed ? 'lg:mx-2 lg:px-0 lg:text-center' : ''}`}>
          <p className={`text-[10px] font-bold tracking-[.1em] text-[#89958a] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>RUANG KERJA</p>
          <div className={`mt-2 flex items-center gap-2 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}><span className="h-2 w-2 rounded-full bg-[#b5122a]" /><span className={`truncate text-xs font-semibold ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{roleNames[role]}</span><ChevronDown size={14} className={`ml-auto text-[#8b978c] ${sidebarCollapsed ? 'lg:hidden' : ''}`} /></div>
        </div>
        <nav className="scrollbar-none flex-1 overflow-y-auto px-3 py-5">
          {['UTAMA', 'KEUANGAN', 'ORGANISASI', 'PUBLIK', 'PELAPORAN', 'PENGATURAN'].map((group) => {
            const items = menu.filter((item) => item.group === group)
            if (!items.length) return null
            return <div key={group} className="mb-5">
              <p className={`mb-2 px-3 text-[9px] font-bold tracking-[.14em] text-[#a0a89e] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{group}</p>
              <div className="space-y-1">{items.map((item) => {
                const Icon = item.icon
                return <button key={item.id} title={sidebarCollapsed ? item.label : undefined} onClick={() => { setActive(item.id); setMobileOpen(false); setQuery(''); setPeriodFilter('') }} className={`flex w-full items-center gap-3 rounded-md py-[10px] text-left text-[13px] font-medium transition-colors ${sidebarCollapsed ? 'px-3 lg:justify-center lg:px-0' : 'px-3'} ${active === item.id ? 'bg-[#fff1f2] text-[#b5122a]' : 'text-[#68766b] hover:bg-[#f0f1e9] hover:text-[#315d3c]'}`}>
                  <Icon size={17} strokeWidth={1.8} /><span className={sidebarCollapsed ? 'lg:hidden' : ''}>{item.label}</span>{item.id === 'iuran' && <span className={`ml-auto rounded-full bg-[#f5e8cd] px-1.5 py-0.5 text-[9px] font-bold text-[#9b712b] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>4</span>}
                </button>
              })}</div>
            </div>
          })}
        </nav>
        <div className="border-t border-[#e8e8df] p-4">
          <div className={`flex items-center gap-3 rounded-md px-2 py-2 ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8eddf] text-xs font-bold text-[#46694b]">{userName.slice(0, 1).toUpperCase()}</div>
            <div className={`min-w-0 flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}><p className="truncate text-xs font-bold">{userName}</p><p className="mt-0.5 truncate text-[10px] text-[#829085]">{roleNames[role]}</p></div>
            <button onClick={() => runExclusive('logout', signOut)} disabled={Boolean(busyAction)} className="rounded p-1.5 text-[#8b978c] hover:bg-[#f0f1e9] disabled:cursor-wait disabled:opacity-50" title="Keluar" aria-label="Keluar"><LogOut size={16} /></button>
          </div>
          <p className={`mt-1 px-2 text-[9px] text-[#9aa399] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{backendConfigured ? 'DATA TERSINKRON' : 'KONEKSI BELUM DIATUR'}</p>
        </div>
      </aside>
      </>}

      <main className={`min-h-screen transition-[padding] ${!showSidebar ? '' : sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-[260px]'}`}>
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#e8e8df] bg-[#f6f5ee]/95 px-4 backdrop-blur-sm sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-3">
            {showSidebar && <button className="rounded-md p-2 text-[#52675a] hover:bg-[#e9eee5] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Buka navigasi"><Menu size={19} /></button>}
            {showSidebar && <button onClick={toggleSidebar} title={sidebarCollapsed ? 'Perlebar sidebar' : 'Lipat sidebar'} aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Lipat sidebar'} className="hidden rounded-md border border-[#dfe4d9] bg-white p-2 text-[#506854] hover:bg-[#f9faf6] lg:inline-flex">{sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}</button>}
            {!showSidebar && <img src={logo} alt="Logo SENDETAN TAKORA TELAGA BETENG" className="h-9 w-9 shrink-0 rounded-full object-contain" />}
            <div className="min-w-0"><p className="truncate text-[10px] font-semibold text-[#89958a]">SENDETAN TAKORA TELAGA BETENG <span className="mx-1">/</span> {navigation.find((item) => item.id === active)?.label.toUpperCase()}</p><h1 className="font-display mt-0.5 truncate text-[17px] font-extrabold text-[#263e32] sm:text-[19px]">{active === 'dashboard' ? 'Ringkasan keuangan' : page?.title}</h1></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden items-center gap-1.5 text-xs font-medium text-[#788579] sm:flex"><CalendarDays size={15} /> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span className="hidden h-7 w-px bg-[#e1e3d9] sm:block" /><button onClick={toggleDashboard} title={dashboardHidden ? 'Tampilkan dashboard' : 'Sembunyikan dashboard'} aria-label={dashboardHidden ? 'Tampilkan dashboard' : 'Sembunyikan dashboard'} className="rounded-md border border-[#dfe4d9] bg-white p-2 text-[#506854] hover:bg-[#f9faf6]">{dashboardHidden ? <Eye size={15} /> : <EyeOff size={15} />}</button><button onClick={() => setLoginOpen(true)} className="flex items-center gap-2 rounded-md border border-[#dfe4d9] bg-white px-2.5 py-2 text-xs font-semibold text-[#506854] hover:bg-[#f9faf6] sm:px-3"><Settings2 size={15} /><span className="hidden sm:inline">{role === 'Publik' ? 'Masuk internal' : 'Ganti peran'}</span></button></div>
        </header>

        <div className="mx-auto min-w-0 max-w-[1440px] overflow-x-clip px-4 pb-10 pt-6 sm:px-7 lg:px-9">
          {!backendConfigured && <div role="status" className="mb-5 rounded-md border border-[#e9d7a7] bg-[#fff9e8] px-4 py-3 text-xs leading-5 text-[#68552b]">Koneksi Google Sheets belum diatur. Semua data ditampilkan kosong atau Rp 0; penyimpanan dinonaktifkan sampai URL Apps Script dikonfigurasi.</div>}
          {['iuran', 'sukaduka', 'sesari'].includes(active) && writable && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#d9e1d5] bg-white px-4 py-3"><div><p className="text-[10px] font-semibold uppercase text-[#849084]">Saldo awal kas {moduleLabels[active]}</p><p className="mt-1 text-sm font-bold text-[#355d3f]">{openingBalances[active]?.configured ? currency(openingBalances[active].amount) : 'Belum diatur'}</p>{openingBalances[active]?.date && <p className="mt-1 text-[10px] text-[#849084]">Per {readableDate(openingBalances[active].date)}</p>}</div><button onClick={() => setOpeningBalanceModal(true)} className="flex items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2 text-xs font-semibold text-[#4e7053] hover:bg-[#f3f6ef]"><CircleDollarSign size={15} /> Atur saldo awal</button></div>}
          {active === 'dashboard' ? dashboardHidden ? <div className="rounded-md border border-[#e6e7dd] bg-white p-6 text-sm text-[#68766b]">Dashboard disembunyikan. <button onClick={toggleDashboard} className="ml-1 font-semibold text-[#b5122a] underline">Tampilkan kembali</button></div> : <Dashboard role={role} cards={summaryCards} analytics={summary} galleryItems={publicActivities} donations={dashboardDonations} piodalanReport={dashboardPiodalanReport} assets={summary?.assets || (isDemo ? rentalAssets.map((asset) => ({ ...asset, available: Math.max(0, Number(asset.quantity || 0) - rentalRows.filter((rental) => String(rental.assetId) === String(asset.id) && rental.status !== 'Dibatalkan' && rental.startDate <= new Date().toISOString().slice(0, 10) && rental.endDate >= new Date().toISOString().slice(0, 10)).reduce((sum, rental) => sum + Number(rental.quantity || 0), 0)), currentRentals: rentalRows.filter((rental) => String(rental.assetId) === String(asset.id) && rental.status !== 'Dibatalkan' && rental.startDate <= new Date().toISOString().slice(0, 10) && rental.endDate >= new Date().toISOString().slice(0, 10)) })) : [])} dashboardFilter={dashboardFilter} onDashboardFilterChange={(key, value) => setDashboardFilter((previous) => ({ ...previous, [key]: value, ...(key === 'year' || key === 'month' ? { day: previous.day } : {}) }))} onOpenOpeningBalance={() => setOpeningBalanceModal(true)} onOpenGallery={() => setActive('kegiatan')} demo={isDemo} /> : active === 'kegiatan' ? <GalleryPage items={filteredRows} writable={writable} busy={Boolean(busyAction)} onAdd={() => { setEditing(null); setModal(true) }} onEdit={(row) => { setEditing(row); setModal(true) }} onDelete={(id) => runExclusive('delete', () => deleteRecord(id))} /> : active === 'laporan' ? <Reports rows={rows} summary={summary} role={role} busy={Boolean(busyAction)} onApprove={() => runExclusive('send', async () => { try { if (!isDemo) await request('approveReport', { period: new Date().toISOString().slice(0, 7), notes: 'Disetujui melalui dashboard TAKORA' }, token); setNotice('Laporan periode ini berhasil disetujui.'); } catch (error) { setNotice(error.message) } })} /> : <ModulePage active={active} page={page} rows={filteredRows} query={query} setQuery={setQuery} loading={loading} writable={writable} busy={Boolean(busyAction)} canEditBalances={role === 'Admin'} periodFilter={periodFilter} setPeriodFilter={setPeriodFilter} masterMembers={masterMembers} contacts={contacts} assets={rentalAssets} rentalRows={rentalRows} onAdd={() => { setEditing(null); setModal(true) }} onBatch={() => setBatchModal(true)} onEdit={(row) => { setEditing(row); setModal(true) }} onDelete={(id) => runExclusive('delete', () => deleteRecord(id))} onCloseBook={() => runExclusive('send', closeBook)} onEditBalance={() => setBalanceModal(true)} />}
          <footer className="mt-10 flex flex-col gap-1 border-t border-[#e5e6dc] pt-5 text-[10px] text-[#8a968c] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} SENDETAN TELAGA BETENG</span><span>Telagabeteng, Banjar Dinas Tiyingtali Kelod, Desa Tiyingtali, Kec. Abang, Kab. Karangasem, Bali</span></footer>
        </div>
      </main>

      {modal && <RecordModal page={page} editing={editing} members={masterMembers} contacts={contacts} assets={rentalAssets} rentalRows={rentalRows} busy={Boolean(busyAction)} onClose={closeRecordModal} onSave={(event) => runExclusive('save', () => saveRecord(event))} onSaveIuran={(record) => runExclusive('save', () => saveIuran(record))} onSaveSukaduka={(record) => runExclusive('save', () => saveSukaduka(record))} onSaveRental={(record) => runExclusive('save', () => saveRental(record))} onSaveActivity={(record) => runExclusive('save', () => saveActivity(record))} />}
      {batchModal && ['iuran', 'sukaduka'].includes(active) && <BatchPaymentModal module={active === 'iuran' ? 'TRANSAKSI_IURAN' : 'Sukaduka'} members={masterMembers} onClose={closeBatchModal} onSave={async (records) => {
        try {
          let savedRecords = records
          let updatedMembers = []
          if (!isDemo) {
            const result = await request('batchPayments', { module: active === 'iuran' ? 'TRANSAKSI_IURAN' : 'Sukaduka', records }, token)
            savedRecords = result.records || []
            updatedMembers = result.members || []
          } else {
            const balances = new Map(masterMembers.map((member) => [String(member.ID), { ...member }]))
            savedRecords = records.map((record) => {
              const member = balances.get(String(record.memberId))
              const openingArrears = Number(active === 'iuran' ? member?.Sisa_Hutang_Iuran : member?.Sisa_Hutang_Sukaduka) || 0
              const openingRefundDebt = Number(member?.Sisa_Hutang_Kembalian || 0)
              const cash = Number(record.cashPhysical)
              const amount = Number(active === 'iuran' ? record.allocatedContribution : record.amount)
              const chargeAmount = Number(record.chargeAmount) || 0
              const changeDue = Math.max(0, cash - amount)
              const refundDebt = Math.max(0, openingRefundDebt + changeDue - Number(record.changePaid || 0))
              if (active === 'iuran') member.Sisa_Hutang_Iuran = Math.max(0, openingArrears - amount)
              else member.Sisa_Hutang_Sukaduka = Math.max(0, openingArrears + chargeAmount - amount)
              member.Sisa_Hutang_Kembalian = refundDebt
              return active === 'iuran' ? { ...record, id: `IU-${Date.now()}-${record.memberId}`, memberName: member.Nama, target: openingArrears, changeDue, openingArrears, arrears: Math.max(0, openingArrears - amount), openingRefundDebt, refundDebtAdded: refundDebt - openingRefundDebt, refundDebt } : { ...record, id: `SK-${Date.now()}-${record.memberId}`, direction: 'Masuk', recipient: member.Nama, memberName: member.Nama, chargeAmount, openingArrears, arrears: Math.max(0, openingArrears + chargeAmount - amount), changeDue, refundDebtAdded: refundDebt - openingRefundDebt, refundDebt }
            })
            updatedMembers = [...balances.values()]
          }
          setRows((previous) => ({ ...previous, [active]: [...savedRecords, ...(previous[active] || [])] }))
          if (updatedMembers.length) setMasterMembers((previous) => previous.map((member) => {
            const updated = updatedMembers.find((item) => String(item.ID) === String(member.ID))
            return updated ? { ...member, ...updated } : member
          }))
          setBatchModal(false)
          setNotice(`${savedRecords.length} pembayaran berhasil disimpan.`)
        } catch (error) { setNotice(error.message); throw error }
      }} />}
      {batchModal && ['punia', 'piodalan'].includes(active) && <BatchLedgerModal module={active} members={masterMembers} onClose={closeBatchModal} onSave={async (records) => {
        try {
          let savedRecords = records
          if (!isDemo) {
            const result = await request('batchCreate', { module: page.api, records }, token)
            savedRecords = result.records || []
          } else {
            const now = new Date().toISOString()
            savedRecords = records.map((record, index) => ({ ...record, id: `${active === 'punia' ? 'PU' : 'PI'}-${Date.now()}-${index}`, createdBy: userName, createdAt: now }))
          }
          setRows((previous) => ({ ...previous, [active]: [...savedRecords, ...(previous[active] || [])] }))
          setBatchModal(false)
          setNotice(`${savedRecords.length} catatan berhasil disimpan.`)
          if (!isDemo) request('summary', {}, token).then(setSummary).catch((error) => setNotice(error.message))
        } catch (error) { setNotice(error.message); throw error }
      }} />}
      {balanceModal && active === 'sukaduka' && <SukadukaBalanceModal members={masterMembers} busy={Boolean(busyAction)} onClose={() => { if (!operationRef.current) setBalanceModal(false) }} onSave={(record) => runExclusive('save', () => saveSukadukaBalance(record))} />}
      {balanceModal && active !== 'sukaduka' && <MasterBalanceModal members={masterMembers} showRefundDebt={role !== 'Bendahara'} busy={Boolean(busyAction)} onClose={() => { if (!operationRef.current) setBalanceModal(false) }} onSave={(record) => runExclusive('save', () => saveMasterBalance(record))} />}
      {openingBalanceModal && <OpeningBalanceModal balances={openingBalances} busy={Boolean(busyAction)} onClose={() => { if (!operationRef.current) setOpeningBalanceModal(false) }} onSave={(record) => runExclusive('save', () => saveOpeningBalances(record))} />}
      {loginOpen && <LoginModal login={login} setLogin={setLogin} busy={Boolean(busyAction)} onClose={() => { if (!operationRef.current) setLoginOpen(false) }} onSubmit={(event) => runExclusive('login', () => signIn(event))} demo={isDemo} />}
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-40px)] items-center gap-2 rounded-md bg-[#244332] px-4 py-3 text-sm font-medium text-white shadow-lg"><Check size={16} />{notice}<button type="button" onClick={() => setNotice('')} className="ml-1 rounded p-1 hover:bg-white/15" aria-label="Tutup notifikasi"><X size={15} /></button></div>}
    </div>
  )
}

function Dashboard({ role, cards, analytics, galleryItems, donations, piodalanReport, assets, dashboardFilter, onDashboardFilterChange, onOpenOpeningBalance, onOpenGallery, demo }) {
  const publicMode = role === 'Publik'
  const visibleCards = publicMode ? cards.filter((card) => !/tunggakan/i.test(card.label)) : cards
  const chartData = analytics?.monthly || (demo ? cashBars : [])
  const sourceData = analytics?.sources?.length ? analytics.sources : demo ? fundSlices : []
  const moduleBalances = analytics?.modules || (demo ? demoModuleBalances : {})
  const outstanding = analytics?.outstanding || (demo ? { arrears: demoModuleBalances.iuran.unpaid, refundDebt: 20000 } : { arrears: 0, refundDebt: 0 })
  const activityItems = analytics?.activities || []
  const chartPeriodLabel = dashboardFilter.year || dashboardFilter.month || dashboardFilter.day ? 'Sesuai filter' : '6 bulan terakhir'
  const moduleEntries = Object.entries(moduleBalances).map(([key, value]) => ({ key, name: moduleLabels[key] || key, color: moduleColors[key] || '#777777', ...value }))
  const cashDataMissing = !demo && cards.length > 0 && cards.slice(0, 3).every((card) => !Number(card.value))
  const donutBalances = moduleEntries.filter((item) => Number(item.balance) > 0).map((item) => ({ name: item.name, value: Number(item.balance), color: item.color }))
  const donutTotal = donutBalances.reduce((sum, item) => sum + item.value, 0)
  const piodalanTotals = piodalanReport.reduce((totals, item) => ({
    income: totals.income + Number(item.income || 0),
    expenses: totals.expenses + Number(item.expenses || 0),
    balance: totals.balance + Number(item.balance || 0),
    goodsValue: totals.goodsValue + Number(item.goodsValue || 0),
  }), { income: 0, expenses: 0, balance: 0, goodsValue: 0 })
  return <div className="animate-rise flex flex-col" data-demo={demo}>
    <div className="order-1 mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-[#79877b]">Om Swastyastu, <span className="font-semibold text-[#48644d]">{publicMode ? 'Semeton Sendetan' : roleNames[role]}</span></p><p className="mt-1 text-xs text-[#9aa399]">{publicMode ? 'Ringkasan transparansi dana organisasi.' : 'Berikut ringkasan posisi kas dan aktivitas organisasi.'}</p></div><div className="flex flex-wrap items-center gap-2 self-start rounded-md border border-[#e2e5dc] bg-white p-2 sm:self-auto"><CalendarDays size={14} className="ml-1 text-[#6e7f71]" /><label className="sr-only" htmlFor="dashboard-year">Filter tahun</label><select id="dashboard-year" aria-label="Filter tahun" value={dashboardFilter.year} onChange={(event) => onDashboardFilterChange('year', event.target.value)} className="rounded border border-[#e6e8df] bg-white px-2 py-1.5 text-xs"><option value="">Semua tahun</option>{Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - index).map((year) => <option key={year} value={year}>{year}</option>)}</select><label className="sr-only" htmlFor="dashboard-month">Filter bulan</label><select id="dashboard-month" aria-label="Filter bulan" value={dashboardFilter.month} onChange={(event) => onDashboardFilterChange('month', event.target.value)} className="rounded border border-[#e6e8df] bg-white px-2 py-1.5 text-xs"><option value="">Semua bulan</option>{['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((month, index) => <option key={month} value={String(index + 1).padStart(2, '0')}>{month}</option>)}</select><label className="sr-only" htmlFor="dashboard-day">Filter tanggal</label><select id="dashboard-day" aria-label="Filter tanggal" value={dashboardFilter.day} onChange={(event) => onDashboardFilterChange('day', event.target.value)} className="rounded border border-[#e6e8df] bg-white px-2 py-1.5 text-xs"><option value="">Semua tanggal</option>{Array.from({ length: 31 }, (_, index) => index + 1).map((day) => <option key={day} value={String(day).padStart(2, '0')}>{day}</option>)}</select></div></div>
    <div className={`order-2 grid grid-cols-1 gap-3 sm:grid-cols-2 ${visibleCards.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
      {visibleCards.map((card, index) => { const Icon = card.icon || [Landmark, ArrowDownLeft, ArrowUpRight, Activity][index]; return <div key={card.label} className="animate-rise rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4" style={{ animationDelay: `${index * 55}ms` }}>
        <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[#849084]">{card.label}</p><p className="font-display mt-3 text-[22px] font-extrabold tracking-[-.02em] text-[#293f33] sm:text-[24px]">{currency(card.value)}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-md ${['bg-[#e9f0e5] text-[#527956]', 'bg-[#f8efd9] text-[#a98239]', 'bg-[#faeae1] text-[#b56d49]', 'bg-[#f6e6e3] text-[#aa6254]'][index % 4]}`}><Icon size={17} /></span></div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[#638367]"><TrendingUp size={12} />{card.trend}<span className="font-normal text-[#9aa399]"> periode ini</span></div>
      </div> })}
    </div>
    {cashDataMissing && <div role="status" className="order-2 mt-3 rounded-md border border-[#e7dfc9] bg-[#fffaf0] px-4 py-3 text-xs leading-5 text-[#725e37]">{role === 'Publik' ? 'Ringkasan kas belum tersedia. Hubungi Bendahara.' : 'Perhitungan ringkasan kas perlu pembaruan backend. Deploy versi Apps Script terbaru untuk memuat kembali saldo awal dan transaksi.'}</div>}
    <section className="order-4 mt-5 overflow-hidden rounded-md border border-[#e6e7dd] bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eceee6] px-4 py-4 sm:px-5"><div><h2 className="font-display text-sm font-extrabold">Inventaris aset</h2><p className="mt-1 text-[11px] text-[#929c91]">Data barang yang sudah dicatat pada menu Aset &amp; sewa alat.</p></div><span className="text-[10px] text-[#849084]">{assets.length} jenis barang</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-xs"><thead className="bg-[#fafaf6] text-[9px] font-bold uppercase text-[#99a197]"><tr><th className="px-4 py-3">Nama barang</th><th className="px-4 py-3 text-right">Jumlah</th><th className="px-4 py-3 text-right">Tersedia kini</th><th className="px-4 py-3">Sedang disewa oleh</th><th className="px-4 py-3 text-right">Harga beli</th><th className="px-4 py-3 text-right">Sewa Semeton</th><th className="px-4 py-3 text-right">Sewa luar</th><th className="px-4 py-3">Kondisi</th><th className="px-4 py-3 text-center">Foto</th></tr></thead><tbody className="divide-y divide-[#eff0ea]">{assets.length ? assets.map((asset) => <tr key={asset.id}><td className="px-4 py-3 font-semibold text-[#3c5043]">{asset.assetName || '-'}</td><td className="px-4 py-3 text-right">{Number(asset.quantity || 0)}</td><td className="px-4 py-3 text-right font-semibold">{Number(asset.available || 0)}</td><td className="px-4 py-3">{asset.currentRentals?.length ? asset.currentRentals.map((rental) => `${rental.renter} (${rental.quantity})`).join(', ') : '-'}</td><td className="whitespace-nowrap px-4 py-3 text-right">{currency(asset.purchasePrice)}</td><td className="whitespace-nowrap px-4 py-3 text-right">{currency(asset.rentalRateSemeton || asset.rentalRate)}</td><td className="whitespace-nowrap px-4 py-3 text-right">{currency(asset.rentalRateLuar || asset.rentalRate)}</td><td className="px-4 py-3">{asset.condition || '-'}</td><td className="px-4 py-2 text-center">{asset.photoUrl ? <a href={asset.photoUrl} target="_blank" rel="noreferrer" className="inline-flex" aria-label={`Lihat foto ${asset.assetName}`}><img src={asset.photoUrl} alt={asset.assetName || 'Foto aset'} loading="lazy" className="h-10 w-14 rounded border border-[#e6e7dd] object-cover" /></a> : '-'}</td></tr>) : <tr><td colSpan="9" className="px-4 py-8 text-center text-[#849084]">Belum ada data aset.</td></tr>}</tbody></table></div>
    </section>
    <section className="order-5 mt-5 overflow-hidden rounded-md border border-[#e6e7dd] bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eceee6] px-4 py-4 sm:px-5"><div><h2 className="font-display text-sm font-extrabold">Laporan keuangan Piodalan</h2><p className="mt-1 text-[11px] text-[#929c91]">Ringkasan per acara · punia barang dicatat sebagai nilai nonkas</p></div><span className="text-[10px] text-[#849084]">{piodalanReport.length} acara</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#fafaf6] text-[9px] font-bold uppercase text-[#99a197]"><tr><th className="px-4 py-3">Nama piodalan</th><th className="px-4 py-3 text-right">Pemasukan kas</th><th className="px-4 py-3 text-right">Pengeluaran</th><th className="px-4 py-3 text-right">Saldo kas</th><th className="px-4 py-3 text-right">Punia barang (nonkas)</th></tr></thead><tbody className="divide-y divide-[#eff0ea]">
        {piodalanReport.length ? piodalanReport.map((event) => <tr key={event.eventName}><td className="px-4 py-3 font-semibold text-[#3c5043]">{event.eventName}</td><td className="px-4 py-3 text-right">{currency(event.income)}</td><td className="px-4 py-3 text-right">{currency(event.expenses)}</td><td className="px-4 py-3 text-right font-semibold">{currency(event.balance)}</td><td className="px-4 py-3 text-right">{currency(event.goodsValue)}</td></tr>) : <tr><td colSpan="5" className="px-4 py-8 text-center text-[#849084]">Belum ada transaksi Piodalan yang tercatat.</td></tr>}
      </tbody>{piodalanReport.length > 0 && <tfoot className="border-t border-[#e6e7dd] bg-[#fafaf6] font-bold"><tr><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right">{currency(piodalanTotals.income)}</td><td className="px-4 py-3 text-right">{currency(piodalanTotals.expenses)}</td><td className="px-4 py-3 text-right">{currency(piodalanTotals.balance)}</td><td className="px-4 py-3 text-right">{currency(piodalanTotals.goodsValue)}</td></tr></tfoot>}</table></div>
    </section>
    <section className="order-6 mt-5 overflow-hidden rounded-md border border-[#e6e7dd] bg-white">
      <div className="flex items-end justify-between gap-3 border-b border-[#eceee6] px-4 py-4 sm:px-5"><div><h2 className="font-display text-sm font-extrabold">Punia uang dan barang</h2><p className="mt-1 text-[11px] text-[#929c91]">Nama pemberi dan sumbangan yang tercatat · terbaru 20 entri</p></div><span className="text-[10px] text-[#849084]">Publik</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="bg-[#fafaf6] text-[9px] font-bold uppercase text-[#99a197]"><tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Nama pemberi</th><th className="px-4 py-3">Bentuk</th><th className="px-4 py-3">Detail</th><th className="px-4 py-3">Piodalan</th><th className="px-4 py-3 text-right">Nilai</th></tr></thead><tbody className="divide-y divide-[#eff0ea]">{donations.length ? donations.slice(0, 20).map((item) => <tr key={`${item.module}-${item.id}`}><td className="whitespace-nowrap px-4 py-3 text-[#788579]">{readableDate(item.date)}</td><td className="px-4 py-3 font-semibold text-[#3c5043]">{item.donor || '-'}</td><td className="px-4 py-3">{item.donationType === 'Barang' ? 'Barang' : item.donationType || 'Uang Tunai'}</td><td className="px-4 py-3">{item.donationType === 'Barang' ? `${item.itemName || '-'}${Number(item.quantity) ? ` · ${item.quantity} ${item.unit || 'unit'}` : ''}` : item.module === 'Piodalan' ? item.category || 'Punia uang' : 'Punia uang'}</td><td className="px-4 py-3">{item.eventName || '-'}</td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{item.donationType === 'Barang' && !Number(item.amount) ? '-' : currency(item.amount)}</td></tr>) : <tr><td colSpan="6" className="px-4 py-8 text-center text-[#849084]">Belum ada punia pada periode filter ini.</td></tr>}</tbody></table></div>
    </section>
    <div className="order-3">
      <Suspense fallback={<div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_1fr]"><div className="h-[280px] animate-pulse rounded-md border border-[#e6e7dd] bg-white" /><div className="h-[280px] animate-pulse rounded-md border border-[#e6e7dd] bg-white" /></div>}>
        <DashboardCharts chartData={chartData} sourceData={sourceData} moduleEntries={moduleEntries} outstanding={outstanding} donutBalances={donutBalances} donutTotal={donutTotal} currency={currency} chartPeriodLabel={chartPeriodLabel} />
      </Suspense>
    </div>
    <section className="order-7 mt-5 overflow-hidden rounded-md border border-[#e6e7dd] bg-[#fffefa]"><div className="flex items-center justify-between border-b border-[#eceee6] px-4 py-4 sm:px-5"><div><h2 className="font-display text-sm font-extrabold">Aktivitas terakhir</h2><p className="mt-1 text-[11px] text-[#929c91]">Transaksi sesuai periode filter</p></div><span className="rounded bg-[#eef2e9] px-2 py-1 text-[10px] font-semibold text-[#638065]">{demo ? 'Data simulasi' : 'Terkini'}</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="text-[10px] font-semibold uppercase tracking-wide text-[#97a096]"><th className="px-5 py-3">Tanggal</th><th className="px-4 py-3">Aktivitas</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Nominal</th></tr></thead><tbody className="divide-y divide-[#f0f1eb]">{activityItems.length ? activityItems.map((item, index) => <tr key={`${item.category}-${item.date}-${index}`}><td className="whitespace-nowrap px-5 py-3.5 text-[#7e8a7f]">{readableDate(item.date)}</td><td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#3c5043]">{item.activity}</td><td className="px-4 py-3.5 text-[#788579]">{item.category}</td><td className="px-4 py-3.5"><span className={`rounded px-2 py-1 text-[10px] font-semibold ${item.incoming ? 'bg-[#e9f0e5] text-[#56785a]' : 'bg-[#f8eee0] text-[#9b793b]'}`}>{item.incoming ? 'Penerimaan' : 'Pengeluaran'}</span></td><td className={`whitespace-nowrap px-5 py-3.5 text-right font-bold ${item.incoming ? 'text-[#4c7653]' : 'text-[#a67842]'}`}>{item.incoming ? '+' : '−'} {currency(item.amount)}</td></tr>) : <tr><td colSpan="5" className="px-5 py-8 text-center text-[#849084]">Tidak ada aktivitas pada periode ini.</td></tr>}</tbody></table></div>
    </section>
    <div className="order-8"><GalleryPreview items={galleryItems} onOpen={onOpenGallery} /></div>
  </div>
}

function GalleryPreview({ items, onOpen }) {
  const featured = items.filter((item) => item.visibility === 'Publik').slice(0, 3)
  return <section className="mt-5 border-t border-[#e6e7dd] pt-5">
    <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="font-display text-sm font-extrabold">Galeri kegiatan</h2><p className="mt-1 text-[11px] text-[#929c91]">Momen kebersamaan SENDETAN TAKORA TELAGA BETENG.</p></div><button onClick={onOpen} className="shrink-0 text-[11px] font-semibold text-[#b5122a] hover:underline">Lihat galeri</button></div>
    {featured.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{featured.map((item) => <button key={item.id} onClick={onOpen} className="group overflow-hidden rounded-md border border-[#e6e7dd] bg-white text-left"><div className="aspect-[16/9] overflow-hidden bg-[#f1f1f1]">{item.mediaType === 'youtube' && youtubeEmbedUrl(item.youtubeUrl) ? <div className="relative h-full w-full"><img src={`https://img.youtube.com/vi/${youtubeEmbedUrl(item.youtubeUrl).split('/').pop()}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" /><span className="absolute inset-0 flex items-center justify-center bg-black/20 text-3xl text-white">▶</span></div> : item.photoUrl ? <img src={item.photoUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center text-[#999]"><Camera size={22} /></div>}</div><div className="p-3"><time className="text-[9px] font-semibold uppercase text-[#b5122a]">{readableDate(item.eventDate)}</time><p className="mt-1 truncate text-xs font-bold">{item.title}</p></div></button>)}</div> : <button onClick={onOpen} className="flex w-full items-center justify-between rounded-md border border-dashed border-[#d8d8d8] bg-white px-4 py-4 text-left"><span className="text-xs text-[#777]">Belum ada foto atau video kegiatan yang dipublikasikan.</span><span className="shrink-0 text-[10px] font-semibold text-[#b5122a]">Buka galeri</span></button>}
  </section>
}

function youtubeEmbedUrl(value) {
  try {
    const url = new URL(value)
    let videoId = ''
    if (url.hostname === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0] || ''
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || ''
    if (!/^[\w-]{11}$/.test(videoId)) return ''
    return `https://www.youtube-nocookie.com/embed/${videoId}`
  } catch { return '' }
}

function GalleryPage({ items, writable, busy, onAdd, onEdit, onDelete }) {
  const published = items.filter((item) => item.visibility !== 'Draft')
  const drafts = items.filter((item) => item.visibility === 'Draft')
  return <div className={`animate-rise ${busy ? 'pointer-events-none opacity-70' : ''}`} aria-busy={busy}>
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-display text-xl font-extrabold">Cerita kegiatan krama</p><p className="mt-1 max-w-2xl text-xs leading-5 text-[#849084]">Dokumentasi kegiatan SENDETAN TAKORA TELAGA BETENG.</p></div>{writable && <button onClick={onAdd} className="flex items-center justify-center gap-2 self-start rounded-md bg-[#b5122a] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#941023]"><Plus size={16} /> Tambah dokumentasi</button>}</div>
    {published.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{published.map((item) => <article key={item.id} className="overflow-hidden rounded-md border border-[#e6e7dd] bg-white">
      <div className="relative aspect-[16/10] bg-[#171717]">{item.mediaType === 'youtube' && youtubeEmbedUrl(item.youtubeUrl) ? <iframe className="h-full w-full" src={youtubeEmbedUrl(item.youtubeUrl)} title={item.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : item.photoUrl ? <img src={item.photoUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-white/75"><Camera size={25} /><span className="text-xs">Foto kegiatan</span></div>}</div>
      <div className="p-4"><div className="flex items-center justify-between gap-2"><time className="text-[10px] font-semibold uppercase tracking-wide text-[#b5122a]">{readableDate(item.eventDate)}</time>{item.mediaType === 'youtube' && <span className="text-[9px] font-bold uppercase text-[#777]">Video</span>}</div><h2 className="font-display mt-2 text-sm font-extrabold">{item.title}</h2>{item.description && <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-[#68766b]">{item.description}</p>}{writable && <div className="mt-3 flex justify-end gap-1 border-t border-[#f0f1eb] pt-2"><button onClick={() => onEdit(item)} className="rounded px-2 py-1 text-[10px] font-semibold text-[#777] hover:bg-[#f5f5f5]">Ubah</button><button onClick={() => onDelete(item.id)} className="rounded px-2 py-1 text-[10px] font-semibold text-[#b5122a] hover:bg-[#fff1f2]">Hapus</button></div>}</div>
    </article>)}</div> : <div className="rounded-md border border-dashed border-[#d9d9d9] bg-white px-5 py-14 text-center"><Camera size={22} className="mx-auto text-[#999]" /><p className="mt-3 text-sm font-semibold">Belum ada dokumentasi publik</p><p className="mt-1 text-xs text-[#8a8a8a]">Foto dan video kegiatan yang dipublikasikan akan tampil di sini.</p></div>}
    {writable && drafts.length > 0 && <section className="mt-8"><h2 className="font-display mb-3 text-sm font-extrabold">Draft belum dipublikasikan</h2><div className="divide-y divide-[#ececec] border-y border-[#ececec] bg-white">{drafts.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-xs font-semibold">{item.title}</p><p className="mt-1 text-[10px] text-[#888]">{readableDate(item.eventDate)} · {item.mediaType === 'youtube' ? 'Video' : 'Foto'}</p></div><div className="flex gap-2"><button onClick={() => onEdit(item)} className="text-xs font-semibold text-[#666]">Ubah</button><button onClick={() => onDelete(item.id)} className="text-xs font-semibold text-[#b5122a]">Hapus</button></div></div>)}</div></section>}
  </div>
}

/*
function ModulePage({ active, page, rows, query, setQuery, loading, writable, canEditBalances, periodFilter, setPeriodFilter, masterMembers, contacts, assets, rentalRows, onAdd, onEdit, onDelete, onCloseBook, onEditBalance }) {
  function ModulePage({ active, page, rows, query, setQuery, loading, writable, canEditBalances, periodFilter, setPeriodFilter, masterMembers, contacts, assets, rentalRows, onAdd, onBatch, onEdit, onDelete, onCloseBook, onEditBalance }) {
  const hasCashSummary = ['iuran', 'pengeluaranIuran', 'sesari', 'sukaduka', 'punia', 'piodalan', 'sewa'].includes(active)
  const cashIn = rows.reduce((sum, row) => sum + (active === 'iuran' ? Number(row.cashPhysical || 0) : active === 'sukaduka' ? (row.direction === 'Masuk' ? Number(row.cashPhysical || row.amount || 0) : 0) : active === 'sewa' ? Number(row.rentalIncome || 0) : active === 'punia' ? (['Uang Tunai', 'Wijilan / Setoran wajib'].includes(row.donationType) ? Number(row.amount || 0) : 0) : row.direction === 'Masuk' && row.category !== 'Punia barang' ? Number(row.amount || 0) : 0), 0)
  const cashOut = rows.reduce((sum, row) => sum + (active === 'pengeluaranIuran' ? Number(row.amount || 0) : active === 'iuran' ? Number(row.changePaid || 0) : active === 'sewa' ? Number(row.maintenanceCost || 0) : active === 'sukaduka' ? Number(row.direction === 'Keluar' ? row.amount || 0 : row.changePaid || 0) : row.direction === 'Keluar' ? Number(row.amount || 0) : 0), 0)
  const selectedContacts = contacts || []
  return <div className="animate-rise">
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="max-w-2xl text-xs leading-5 text-[#849084]">{page.desc}</p><p className="mt-2 text-[11px] text-[#9aa399]">{rows.length} catatan terdaftar</p></div>
      <div className="flex flex-wrap gap-2">{active === 'iuran' && writable && <button onClick={onCloseBook} className="flex items-center justify-center gap-2 rounded-md border border-[#d9e1d5] bg-white px-3 py-2.5 text-xs font-semibold text-[#4e7053] hover:bg-[#f3f6ef]"><BookOpenCheck size={15} /> Tutup buku</button>}{active === 'anggota' && canEditBalances && <button onClick={onEditBalance} className="flex items-center justify-center gap-2 rounded-md border border-[#d9e1d5] bg-white px-3 py-2.5 text-xs font-semibold text-[#4e7053] hover:bg-[#f3f6ef]"><CircleDollarSign size={15} /> Koreksi saldo</button>}{['iuran', 'sukaduka'].includes(active) && writable && <button onClick={onBatch} className="flex items-center justify-center gap-2 rounded-md border border-[#d9e1d5] bg-white px-3 py-2.5 text-xs font-semibold text-[#4e7053] hover:bg-[#f3f6ef]"><FileText size={15} /> Input basket / Excel</button>}{writable && <button onClick={onAdd} className="flex items-center justify-center gap-2 rounded-md bg-[#355d3f] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#294d33]"><Plus size={16} /> Tambah data</button>}</div>
      {loading ? <tr><td colSpan={page.columns.length + 1} className="px-5 py-12 text-center text-[#89958a]">Memuat data...</td></tr> : rows.length === 0 ? <tr><td colSpan={page.columns.length + 1} className="px-5 py-14 text-center"><div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f2ea] text-[#829183]"><Package size={18} /></div><p className="text-xs font-semibold text-[#647568]">Belum ada catatan</p><p className="mt-1 text-[11px] text-[#9aa399]">Data yang dicatat akan tampil di sini.</p></td></tr> : rows.map((row) => <tr key={row.id} className="hover:bg-[#fcfcf8]">{page.columns.map(([key]) => <td key={key} className="max-w-[240px] truncate whitespace-nowrap px-4 py-3.5 text-[#68776b] first:pl-5">{key === 'date' || key === 'startDate' || key === 'endDate' ? readableDate(row[key]) : key === 'available' ? Math.max(0, Number(row.quantity || 0) - (rentalRows || []).filter((rental) => String(rental.assetId) === String(row.id) && rental.status !== 'Dibatalkan' && rental.startDate <= new Date().toISOString().slice(0, 10) && rental.endDate >= new Date().toISOString().slice(0, 10)).reduce((sum, rental) => sum + Number(rental.quantity || 0), 0)) : ['photoUrl', 'proofPhotoUrl'].includes(key) && row[key] ? <a href={row[key]} target="_blank" rel="noreferrer" className="font-semibold text-[#b5122a] underline">Lihat foto</a> : key === 'currentArrears' || key === 'currentRefundDebt' ? currency(masterMembers.find((member) => String(member.ID) === String(row.memberId))?.[key === 'currentArrears' ? 'Sisa_Hutang_Iuran' : 'Sisa_Hutang_Kembalian']) : ['amount', 'target', 'allocatedContribution', 'cashPhysical', 'changeDue', 'changePaid', 'arrears', 'refundDebt', 'rentalRate', 'purchasePrice', 'rentalIncome', 'maintenanceCost'].includes(key) ? currency(row[key]) : row[key] || '-'}</td>)}{writable && <td className="whitespace-nowrap px-4 py-3 text-right"><button onClick={() => onEdit(row)} className="rounded p-1.5 text-[#819082] hover:bg-[#edf1e
    </div>
    {hasCashSummary && <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3"><div className="rounded-md border border-[#e6e7dd] bg-white px-4 py-3"><p className="text-[10px] text-[#849084]">Dana masuk · hasil filter</p><p className="mt-1 text-sm font-bold text-[#b5122a]">{currency(cashIn)}</p></div><div className="rounded-md border border-[#e6e7dd] bg-white px-4 py-3"><p className="text-[10px] text-[#849084]">Dana keluar · hasil filter</p><p className="mt-1 text-sm font-bold text-[#242424]">{currency(cashOut)}</p></div><div className="rounded-md border border-[#e6e7dd] bg-white px-4 py-3"><p className="text-[10px] text-[#849084]">Selisih bersih · hasil filter</p><p className="mt-1 text-sm font-bold text-[#171717]">{currency(cashIn - cashOut)}</p></div></div>}
    <div className="overflow-hidden rounded-md border border-[#e6e7dd] bg-[#fffefa]">
      <div className="flex flex-col gap-3 border-b border-[#eceee6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-2 text-xs font-bold"><span className="flex h-7 w-7 items-center justify-center rounded bg-[#eef2e9] text-[#55765a]"><Package size={15} /></span>Daftar {page.title.toLowerCase()}</div><div className="flex w-full gap-2 sm:w-auto"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#e6e8df] bg-[#fffefa] px-3 py-2 sm:w-[205px]"><Search size={14} className="text-[#9aa399]" /><input className="w-full bg-transparent text-xs outline-none placeholder:text-[#a2aaa1]" placeholder="Cari catatan..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>{hasCashSummary && <label className="flex items-center gap-2 rounded-md border border-[#e6e8df] bg-white px-2"><CalendarDays size={14} className="text-[#929c91]" /><input aria-label="Filter periode" type="month" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="w-[126px] bg-transparent py-1.5 text-[10px] outline-none" /><button type="button" onClick={() => setPeriodFilter('')} aria-label="Hapus filter periode" className="text-[#929c91]">×</button></label>}</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left text-xs"><thead className="bg-[#fafaf6]"><tr className="text-[9px] font-bold uppercase tracking-[.09em] text-[#99a197]">{page.columns.map(([key, label]) => <th key={key} className="whitespace-nowrap px-4 py-3.5 first:pl-5">{label}</th>)}{writable && <th className="px-4 py-3.5 text-right">AKSI</th>}</tr></thead><tbody className="divide-y divide-[#eff0ea]">
        {loading ? <tr><td colSpan={page.columns.length + 1} className="px-5 py-12 text-center text-[#89958a]">Memuat data...</td></tr> : rows.length === 0 ? <tr><td colSpan={page.columns.length + 1} className="px-5 py-14 text-center"><div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f0f2ea] text-[#829183]"><Package size={18} /></div><p className="text-xs font-semibold text-[#647568]">Belum ada catatan</p><p className="mt-1 text-[11px] text-[#9aa399]">Data yang dicatat akan tampil di sini.</p></td></tr> : rows.map((row) => <tr key={row.id} className="hover:bg-[#fcfcf8]">{page.columns.map(([key]) => <td key={key} className="max-w-[240px] truncate whitespace-nowrap px-4 py-3.5 text-[#68776b] first:pl-5">{key === 'date' || key === 'startDate' || key === 'endDate' ? readableDate(row[key]) : key === 'available' ? Math.max(0, Number(row.quantity || 0) - (rentalRows || []).filter((rental) => String(rental.assetId) === String(row.id) && rental.status !== 'Dibatalkan' && rental.startDate <= new Date().toISOString().slice(0, 10) && rental.endDate >= new Date().toISOString().slice(0, 10)).reduce((sum, rental) => sum + Number(rental.quantity || 0), 0)) : ['photoUrl', 'proofPhotoUrl'].includes(key) && row[key] ? <a href={row[key]} target="_blank" rel="noreferrer" className="font-semibold text-[#b5122a] underline">Lihat foto</a> : key === 'currentArrears' || key === 'currentRefundDebt' ? currency(masterMembers.find((member) => String(member.ID) === String(row.memberId))?.[key === 'currentArrears' ? 'Sisa_Hutang_Iuran' : 'Sisa_Hutang_Kembalian']) : ['amount', 'target', 'allocatedContribution', 'cashPhysical', 'changeDue', 'changePaid', 'arrears', 'refundDebt', 'rentalRate', 'purchasePrice', 'rentalIncome', 'maintenanceCost'].includes(key) ? currency(row[key]) : row[key] || '-'}</td>)}{writable && <td className="whitespace-nowrap px-4 py-3 text-right"><button onClick={() => onEdit(row)} className="rounded p-1.5 text-[#819082] hover:bg-[#edf1e9] hover:text-[#426a49]" aria-label="Ubah"><Pencil size={14} /></button><button onClick={() => onDelete(row.id)} className="rounded p-1.5 text-[#a1847a] hover:bg-[#f7eae6] hover:text-[#a25143]" aria-label="Hapus"><Trash2 size={14} /></button></td>}</tr>)}</tbody></table></div>
      <div className="flex items-center justify-between border-t border-[#eceee6] px-5 py-3 text-[10px] text-[#98a096]"><span>Menampilkan {rows.length} catatan</span><span>TAKORA · Data tersimpan sesuai periode</span></div>
    </div>
    {active === 'aset' && <div className="mt-4 flex gap-2 rounded-md border border-[#e8e8df] bg-[#f0f2e9] p-3.5 text-[11px] leading-5 text-[#68796b]"><Camera size={15} className="mt-0.5 shrink-0 text-[#56765a]" /><p>Foto barang dikirim ke Google Drive sebagai file, lalu URL tersimpan pada inventaris. Untuk pencatatan sewa dan biaya perawatan rinci, gunakan sheet <b>SewaAset</b> dan <b>InventarisLog</b>.</p></div>}
    </div>
}

*/
function ModulePage({ active, page, rows, query, setQuery, loading, writable, busy, canEditBalances, periodFilter, setPeriodFilter, masterMembers, rentalRows, onAdd, onBatch, onEdit, onDelete, onCloseBook, onEditBalance }) {
  if (page.api === 'memberDues') return <MemberDuesPage data={page.duesData} loading={loading} />
  const hasCashSummary = ['iuran', 'sesari', 'sukaduka', 'punia', 'piodalan', 'sewa'].includes(active)
  const exportableModules = ['iuran', 'sukaduka', 'pengeluaranIuran', 'sesari', 'punia', 'piodalan', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi']
  const cashIn = rows.reduce((sum, row) => sum + (active === 'iuran' ? Number(row.cashPhysical || 0) : active === 'sukaduka' ? (row.direction === 'Masuk' ? Number(row.cashPhysical || row.amount || 0) : 0) : active === 'sewa' ? Number(row.rentalIncome || 0) : active === 'punia' ? (['Uang Tunai', 'Wijilan / Setoran wajib'].includes(row.donationType) ? Number(row.amount || 0) : 0) : row.direction === 'Masuk' && row.category !== 'Punia barang' ? Number(row.amount || 0) : 0), 0)
  const cashOut = rows.reduce((sum, row) => sum + (active === 'iuran' ? Number(row.changePaid || 0) : active === 'sewa' ? Number(row.maintenanceCost || 0) : active === 'sukaduka' ? Number(row.direction === 'Keluar' ? row.amount || 0 : row.changePaid || 0) : row.direction === 'Keluar' ? Number(row.amount || 0) : 0), 0)
  const memberNumbers = new Map(masterMembers.map((member) => [String(member.ID), String(member.memberNo || member.ID)]))
  const paymentGroups = new Map(masterMembers.map((member) => [String(member.ID), {
    id: String(member.ID),
    name: member.Nama,
    memberNo: memberNumbers.get(String(member.ID)) || String(member.ID),
    payments: [],
    total: 0,
    arrears: Number(active === 'iuran' ? member.Sisa_Hutang_Iuran : member.Sisa_Hutang_Sukaduka) || 0,
  }]))
  rows.forEach((row) => {
    const amount = Number(active === 'iuran' ? row.allocatedContribution : row.amount) || 0
    if (amount <= 0 || active === 'sukaduka' && row.direction !== 'Masuk') return
    const memberId = String(row.memberId || row.memberName || 'tanpa-anggota')
    if (!paymentGroups.has(memberId)) paymentGroups.set(memberId, {
      id: memberId,
      name: row.memberName || row.Nama || 'Anggota tanpa nama',
      memberNo: memberNumbers.get(memberId) || memberId,
      payments: [],
      total: 0,
      arrears: 0,
    })
    const member = paymentGroups.get(memberId)
    member.payments.push({ date: row.date, amount })
    member.total += amount
  })
  const paymentRecap = ['iuran', 'sukaduka'].includes(active)
    ? [...paymentGroups.values()]
      .filter((member) => !query || member.name.toLowerCase().includes(query.toLowerCase()) || member.id.toLowerCase().includes(query.toLowerCase()) || member.payments.length)
      .sort((left, right) => left.memberNo.localeCompare(right.memberNo, 'id', { numeric: true, sensitivity: 'base' }) || left.name.localeCompare(right.name, 'id'))
    : []
  const paymentCountTotal = paymentRecap.reduce((total, member) => total + member.payments.length, 0)
  const paymentTotal = paymentRecap.reduce((total, member) => total + member.total, 0)
  const paymentArrearsTotal = paymentRecap.reduce((total, member) => total + member.arrears, 0)
  const paymentRecapTotalLabel = query ? 'TOTAL ANGGOTA HASIL PENCARIAN' : 'TOTAL SELURUH ANGGOTA'
  async function exportReport() {
    const XLSX = await import('xlsx')
    const exportRows = rows.map((row) => Object.fromEntries(page.columns.map(([key, label]) => {
      let value = row[key] ?? ''
      if (key === 'available') value = Number.isFinite(Number(row.available)) ? Number(row.available) : Math.max(0, Number(row.quantity || 0) - rentalRows.filter((rental) => String(rental.assetId) === String(row.id) && !['Dibatalkan', 'Selesai'].includes(rental.status) && rental.startDate <= new Date().toISOString().slice(0, 10) && rental.endDate >= new Date().toISOString().slice(0, 10)).reduce((sum, rental) => sum + Number(rental.quantity || 0), 0))
      if (key === 'currentArrears' || key === 'currentRefundDebt') value = Number(masterMembers.find((member) => String(member.ID) === String(row.memberId))?.[key === 'currentArrears' ? 'Sisa_Hutang_Iuran' : 'Sisa_Hutang_Kembalian']) || 0
      return [label, value]
    })))
    const workbook = XLSX.utils.book_new()
    const makeReportSheet = (headers, values) => {
      const columnCount = Math.max(5, headers.length)
      const padRow = (row) => [...row, ...Array(Math.max(0, columnCount - row.length)).fill('')]
      const signatureLabels = Array(columnCount).fill('')
      const signatureNames = Array(columnCount).fill('')
      const signatureLines = Array(columnCount).fill('')
      signatureLabels[0] = 'Ketua'
      signatureLabels[Math.floor((columnCount - 1) / 2)] = 'Sekretaris'
      signatureLabels[columnCount - 1] = 'Bendahara'
      signatureNames[0] = signatories[0].name
      signatureNames[Math.floor((columnCount - 1) / 2)] = signatories[1].name
      signatureNames[columnCount - 1] = signatories[2].name
      signatureLines[0] = '(................................)'
      signatureLines[Math.floor((columnCount - 1) / 2)] = '(................................)'
      signatureLines[columnCount - 1] = '(................................)'
      const reportPeriod = `${periodFilter ? `Periode: ${periodFilter}` : 'Periode: Semua'}${query ? ` | Pencarian: ${query}` : ''}${['iuran', 'sukaduka'].includes(active) ? ' | Tunggakan: saldo saat ini' : ''}`
      const sheet = XLSX.utils.aoa_to_sheet([
        padRow(['SENDETAN TELAGA BETENG']),
        padRow([organizationAddress]),
        padRow([page.title]),
        padRow([reportPeriod]),
        Array(columnCount).fill(''),
        padRow(headers),
        ...values.map(padRow),
        Array(columnCount).fill(''),
        Array(columnCount).fill(''),
        signatureLabels,
        signatureNames,
        signatureLines,
      ])
      sheet['!merges'] = [0, 1, 2, 3].map((row) => ({ s: { r: row, c: 0 }, e: { r: row, c: columnCount - 1 } }))
      sheet['!cols'] = Array.from({ length: columnCount }, (_, index) => ({ wch: index < headers.length ? Math.min(32, Math.max(14, String(headers[index]).length + 3)) : 18 }))
      if (headers.length && values.length) sheet['!autofilter'] = { ref: `A6:${XLSX.utils.encode_col(headers.length - 1)}${6 + values.length}` }
      return sheet
    }
    if (['iuran', 'sukaduka'].includes(active)) {
      const recapRows = [
        ...paymentRecap.map((member) => [member.memberNo, member.name, member.payments.length, member.total, member.arrears]),
        ['', paymentRecapTotalLabel, paymentCountTotal, paymentTotal, paymentArrearsTotal],
      ]
      const recapSheet = makeReportSheet(['No. anggota', 'Nama anggota', 'Kali pembayaran', 'Total terbayar', 'Tunggakan saat ini'], recapRows)
      XLSX.utils.book_append_sheet(workbook, recapSheet, 'Rekap per Anggota')
      const paymentDetails = paymentRecap.flatMap((member) => member.payments.map((payment) => [member.memberNo, member.name, payment.date || '', payment.amount]))
      const paymentDetailsSheet = makeReportSheet(['No. anggota', 'Nama anggota', 'Tanggal pembayaran', 'Jumlah pembayaran'], paymentDetails)
      XLSX.utils.book_append_sheet(workbook, paymentDetailsSheet, 'Rincian Pembayaran')
    }
    const detailHeaders = page.columns.map(([, label]) => label)
    const detailValues = exportRows.map((row) => detailHeaders.map((header) => row[header] ?? ''))
    const detailSheet = makeReportSheet(detailHeaders, detailValues)
    XLSX.utils.book_append_sheet(workbook, detailSheet, ['iuran', 'sukaduka'].includes(active) ? 'Rincian Transaksi' : page.title.slice(0, 31))
    const periodSuffix = periodFilter ? `-${periodFilter}` : ''
    XLSX.writeFile(workbook, `laporan-${active}${periodSuffix}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }
  return <div className={`print-report animate-rise ${busy ? 'pointer-events-none opacity-70' : ''}`} aria-busy={busy}>
    <PrintLetterhead title={page.title} detail={`${periodFilter ? `Periode ${periodFilter}` : 'Semua periode'}${query ? ` · Pencarian: ${query}` : ''}`} />
    <div className="module-toolbar mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="max-w-2xl text-xs leading-5 text-[#849084]">{page.desc}</p><p className="mt-2 text-[11px] text-[#9aa399]">{rows.length} catatan terdaftar</p></div><div className="flex flex-wrap gap-2">
      {exportableModules.includes(active) && <><button onClick={() => window.print()} className="no-print flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold"><Printer size={15} /> Cetak</button><button onClick={() => exportReport().catch((error) => window.alert(`Ekspor gagal: ${error.message}`))} className="no-print flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold"><Download size={15} /> Ekspor Excel</button></>}
      {active === 'iuran' && writable && <button onClick={onCloseBook} disabled={busy} className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold disabled:opacity-50">{busy ? 'Memproses...' : <><BookOpenCheck size={15} /> Tutup buku</>}</button>}
      {active === 'anggota' && canEditBalances && <button onClick={onEditBalance} disabled={busy} className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold disabled:opacity-50"><CircleDollarSign size={15} /> Koreksi saldo</button>}
      {active === 'iuran' && writable && <button onClick={onEditBalance} disabled={busy} className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold disabled:opacity-50"><CircleDollarSign size={15} /> Edit saldo tunggakan iuran</button>}
      {active === 'sukaduka' && writable && <button onClick={onEditBalance} disabled={busy} className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold disabled:opacity-50"><CircleDollarSign size={15} /> Edit saldo tunggakan Sukaduka</button>}
      {['iuran', 'sukaduka', 'punia', 'piodalan'].includes(active) && writable && <button onClick={onBatch} disabled={busy} className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold disabled:opacity-50"><FileText size={15} /> Input basket / Excel</button>}
      {writable && <button onClick={onAdd} disabled={busy} className="flex items-center gap-2 rounded-md bg-[#355d3f] px-3.5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Plus size={16} /> Tambah data</button>}
    </div></div>
    {['iuran', 'sukaduka'].includes(active) && <section className="mb-4 overflow-hidden rounded-md border border-[#e6e7dd] bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#eceee6] px-4 py-3 sm:px-5"><div><h2 className="text-xs font-bold">Rekap pembayaran per anggota</h2><p className="mt-1 text-[10px] text-[#849084]">Jumlah transaksi dan total bayar mengikuti filter; tunggakan adalah saldo saat ini.</p><p className="mt-1 text-[10px] text-[#849084]">{periodFilter ? `Periode ${periodFilter}` : 'Semua periode'}{query ? ' · sesuai pencarian' : ''}</p></div><div className="flex gap-5 text-right"><div><p className="text-[10px] text-[#849084]">Total pembayaran</p><p className="mt-1 text-sm font-bold text-[#355d3f]">{currency(paymentTotal)}</p></div><div><p className="text-[10px] text-[#849084]">Total tunggakan kini</p><p className="mt-1 text-sm font-bold text-[#b5122a]">{currency(paymentArrearsTotal)}</p></div></div></div>
      {paymentRecap.length ? <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-[#fafaf6] text-[10px] text-[#849084]"><tr><th className="px-4 py-2.5">No. anggota</th><th className="px-4 py-2.5 sm:px-5">Nama / riwayat pembayaran</th><th className="px-4 py-2.5 text-right">Kali bayar</th><th className="px-4 py-2.5 text-right">Total terbayar</th><th className="px-4 py-2.5 text-right">Tunggakan saat ini</th></tr></thead><tbody className="divide-y divide-[#eff0ea]">{paymentRecap.map((member) => <tr key={member.id}><td className="px-4 py-3 font-medium">{member.memberNo}</td><td className="px-4 py-3 sm:px-5"><b className="text-[#355d3f]">{member.name}</b>{member.payments.length ? <div className="mt-1.5 space-y-1">{member.payments.map((payment, index) => <p key={`${member.id}-${payment.date}-${index}`} className="text-[10px] text-[#68776b]">{readableDate(payment.date)} · {currency(payment.amount)}</p>)}</div> : <p className="mt-1.5 text-[10px] text-[#929c91]">Belum ada pembayaran pada filter ini</p>}</td><td className="px-4 py-3 text-right">{member.payments.length} kali</td><td className="px-4 py-3 text-right font-semibold">{currency(member.total)}</td><td className="px-4 py-3 text-right font-semibold text-[#b5122a]">{currency(member.arrears)}</td></tr>)}</tbody><tfoot className="border-t-2 border-[#dfe4d9] bg-[#fafaf6] font-bold"><tr><td colSpan="2" className="px-4 py-3 sm:px-5">{paymentRecapTotalLabel}</td><td className="px-4 py-3 text-right">{paymentCountTotal} kali</td><td className="px-4 py-3 text-right">{currency(paymentTotal)}</td><td className="px-4 py-3 text-right text-[#b5122a]">{currency(paymentArrearsTotal)}</td></tr></tfoot></table></div> : <p className="px-5 py-6 text-center text-xs text-[#89958a]">Belum ada anggota pada rekap ini.</p>}
    </section>}
    {hasCashSummary && <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3"><div className="rounded-md border bg-white px-4 py-3"><p className="text-[10px]">Dana masuk · hasil filter</p><p className="mt-1 text-sm font-bold">{currency(cashIn)}</p></div><div className="rounded-md border bg-white px-4 py-3"><p className="text-[10px]">Dana keluar · hasil filter</p><p className="mt-1 text-sm font-bold">{currency(cashOut)}</p></div><div className="rounded-md border bg-white px-4 py-3"><p className="text-[10px]">Selisih bersih · hasil filter</p><p className="mt-1 text-sm font-bold">{currency(cashIn - cashOut)}</p></div></div>}
    <section className="overflow-hidden rounded-md border bg-white"><div className="module-filters flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><b className="text-xs">Daftar {page.title.toLowerCase()}</b><div className="flex gap-2"><input aria-label="Cari catatan" placeholder="Cari catatan..." value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-md border px-3 py-2 text-xs" />{hasCashSummary && <input aria-label="Filter periode" type="month" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="rounded-md border px-2 py-2 text-xs" />}</div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[690px] text-left text-xs"><thead><tr>{page.columns.map(([key, label]) => <th key={key} className="px-4 py-3">{label}</th>)}{writable && <th className="no-print px-4 py-3 text-right">Aksi</th>}</tr></thead><tbody>
        {loading ? <tr><td colSpan={page.columns.length + Number(writable)} className="p-8 text-center">Memuat data...</td></tr> : rows.length === 0 ? <tr><td colSpan={page.columns.length + Number(writable)} className="p-8 text-center">Belum ada catatan</td></tr> : rows.map((row) => <tr key={row.id} className="border-t">{page.columns.map(([key]) => {
          let value = row[key]
          if (['date', 'startDate', 'endDate'].includes(key)) value = readableDate(value)
          else if (key === 'available') value = Number.isFinite(Number(row.available)) ? Number(row.available) : Math.max(0, Number(row.quantity || 0) - rentalRows.filter((rental) => String(rental.assetId) === String(row.id) && !['Dibatalkan', 'Selesai'].includes(rental.status) && rental.startDate <= new Date().toISOString().slice(0, 10) && rental.endDate >= new Date().toISOString().slice(0, 10)).reduce((sum, rental) => sum + Number(rental.quantity || 0), 0))
          else if (key === 'currentArrears' || key === 'currentRefundDebt') value = currency(masterMembers.find((member) => String(member.ID) === String(row.memberId))?.[key === 'currentArrears' ? 'Sisa_Hutang_Iuran' : 'Sisa_Hutang_Kembalian'])
              else if (['amount', 'target', 'allocatedContribution', 'chargeAmount', 'openingArrears', 'cashPhysical', 'changeDue', 'changePaid', 'arrears', 'refundDebt', 'rentalRate', 'rentalRateSemeton', 'rentalRateLuar', 'purchasePrice', 'rentalIncome', 'maintenanceCost'].includes(key)) value = currency(value)
          else if (['photoUrl', 'proofPhotoUrl'].includes(key) && value) value = <a href={value} target="_blank" rel="noreferrer" className="text-[#b5122a] underline">Lihat foto</a>
          return <td key={key} className="max-w-[240px] truncate whitespace-nowrap px-4 py-3">{value || '-'}</td>
        })}{writable && <td className="no-print whitespace-nowrap px-4 py-3 text-right"><button onClick={() => onEdit(row)} aria-label="Ubah" className="p-1.5"><Pencil size={14} /></button><button onClick={() => onDelete(row.id)} aria-label="Hapus" className="p-1.5 text-[#b5122a]"><Trash2 size={14} /></button></td>}</tr>)}</tbody></table></div>
      <div className="flex justify-between border-t px-5 py-3 text-[10px] text-[#98a096]"><span>Menampilkan {rows.length} catatan</span><span>Data tersimpan sesuai periode</span></div>
    </section>
    {active === 'aset' && <div className="no-print mt-4 flex gap-2 rounded-md border bg-[#f0f2e9] p-3.5 text-[11px]"><Camera size={15} /><p>Isi tarif Semeton dan orang luar agar hitungan sewa sesuai jenis penyewa.</p></div>}
    <PrintSignatures />
  </div>
}

function MemberDuesPage({ data, loading }) {
  const today = new Date().toISOString().slice(0, 10)
  const [dailyDate, setDailyDate] = useState(today)
  const [deadline, setDeadline] = useState('')
  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState(null)
  const inputClass = 'rounded-md border border-[#e1e5dc] bg-white px-3 py-2 text-xs outline-none focus:border-[#b5122a]'

  const obligations = useMemo(() => {
    const membersById = new Map((data.members || []).map((member) => [String(member.id), member]))
    const masterById = new Map((data.masterMembers || []).map((member) => [String(member.ID), member]))
    const wijilanEvents = new Map()
    ;(data.piodalan || []).filter((row) => row.category === 'Wijilan / Setoran wajib' && row.memberId).forEach((row) => {
      const memberId = String(row.memberId)
      const eventName = String(row.eventName || 'Piodalan tanpa nama')
      const key = `${memberId}\u0000${eventName}`
      const event = wijilanEvents.get(key) || { memberId, eventName, charge: 0, paid: 0 }
      event.charge += Number(row.chargeAmount) || 0
      event.paid += Number(row.amount) || 0
      wijilanEvents.set(key, event)
    })
    const wijilanByMember = new Map()
    const eventsByMember = new Map()
    wijilanEvents.forEach((event) => {
      const remaining = Math.max(0, event.charge - event.paid)
      if (!remaining) return
      wijilanByMember.set(event.memberId, (wijilanByMember.get(event.memberId) || 0) + remaining)
      const events = eventsByMember.get(event.memberId) || []
      events.push({ name: event.eventName, remaining })
      eventsByMember.set(event.memberId, events)
    })
    return [...membersById.values()].map((member) => {
      const master = masterById.get(String(member.id)) || {}
      const iuran = Number(master.Sisa_Hutang_Iuran) || 0
      const sukaduka = Number(master.Sisa_Hutang_Sukaduka) || 0
      const wijilan = wijilanByMember.get(String(member.id)) || 0
      return { ...member, iuran, sukaduka, wijilan, total: iuran + sukaduka + wijilan, wijilanEvents: eventsByMember.get(String(member.id)) || [] }
    }).sort((left, right) => String(left.memberNo || left.id).localeCompare(String(right.memberNo || right.id), 'id', { numeric: true, sensitivity: 'base' }) || left.memberName.localeCompare(right.memberName, 'id'))
  }, [data])

  const visibleObligations = obligations.filter((member) => !query || `${member.memberName} ${member.memberNo || ''} ${member.phone || ''}`.toLowerCase().includes(query.toLowerCase()))
  const totals = obligations.reduce((sum, member) => ({
    iuran: sum.iuran + member.iuran,
    sukaduka: sum.sukaduka + member.sukaduka,
    wijilan: sum.wijilan + member.wijilan,
  }), { iuran: 0, sukaduka: 0, wijilan: 0 })
  totals.all = totals.iuran + totals.sukaduka + totals.wijilan

  const dailyRows = useMemo(() => {
    const byMember = new Map()
    const memberNumbers = new Map(obligations.map((member) => [String(member.id), String(member.memberNo || member.id)]))
    function add(row, module, amount) {
      const memberId = String(row.memberId || '')
      if (!memberId || amount <= 0) return
      const member = obligations.find((item) => String(item.id) === memberId)
      const entry = byMember.get(memberId) || { memberId, memberName: row.memberName || member?.memberName || 'Anggota', iuran: 0, sukaduka: 0, wijilan: 0 }
      entry[module] += amount
      byMember.set(memberId, entry)
    }
    ;(data.iuran || []).filter((row) => String(row.date || '').slice(0, 10) === dailyDate).forEach((row) => add(row, 'iuran', Number(row.cashPhysical || row.allocatedContribution) || 0))
    ;(data.sukaduka || []).filter((row) => String(row.date || '').slice(0, 10) === dailyDate && row.direction === 'Masuk').forEach((row) => add(row, 'sukaduka', Number(row.cashPhysical || row.amount) || 0))
    ;(data.piodalan || []).filter((row) => String(row.date || '').slice(0, 10) === dailyDate && row.category === 'Wijilan / Setoran wajib' && row.direction === 'Masuk').forEach((row) => add(row, 'wijilan', Number(row.amount) || 0))
    return [...byMember.values()].map((entry) => {
      const current = obligations.find((member) => String(member.id) === entry.memberId)
      return { ...entry, total: entry.iuran + entry.sukaduka + entry.wijilan, iuranDue: current?.iuran || 0, sukadukaDue: current?.sukaduka || 0, wijilanDue: current?.wijilan || 0 }
    }).sort((left, right) => (memberNumbers.get(left.memberId) || left.memberId).localeCompare(memberNumbers.get(right.memberId) || right.memberId, 'id', { numeric: true, sensitivity: 'base' }) || left.memberName.localeCompare(right.memberName, 'id'))
  }, [data, dailyDate, obligations])
  const dailyTotals = dailyRows.reduce((sum, row) => ({ iuran: sum.iuran + row.iuran, sukaduka: sum.sukaduka + row.sukaduka, wijilan: sum.wijilan + row.wijilan }), { iuran: 0, sukaduka: 0, wijilan: 0 })
  dailyTotals.all = dailyTotals.iuran + dailyTotals.sukaduka + dailyTotals.wijilan

  function memberMessage(member, daily = null) {
    const dueDate = deadline ? readableDate(deadline) : '[tanggal batas pembayaran]'
    const dailyLines = daily ? `\n\nInput tanggal ${readableDate(dailyDate)}:\n- Iuran: ${currency(daily.iuran)}\n- Sukaduka: ${currency(daily.sukaduka)}\n- Wijilan: ${currency(daily.wijilan)}\n- Total input: ${currency(daily.total)}` : ''
    return `Om Swastyastu, Semeton ${member.memberName}.\nUning-uningan jinah paturunan / swadharma ring Sendetan saking tanggal ${readableDate(today)}:\n\n- Tunggakan Iuran: ${currency(member.iuran)}\n- Tunggakan Wijilan Wajib: ${currency(member.wijilan)}\n- Tunggakan Sukaduka (dados pungkuran): ${currency(member.sukaduka)}\n- Total kewajiban: ${currency(member.total)}${dailyLines}\n\nNunas uratiang mangda puputang naur sadurung tanggal ${dueDate}.\n\nMatur suksma.\nPrajuru Piodalan\nhttps://sendetan.vercel.app/`
  }

  function openPreview(recipient, phone, message, group = false) {
    setPreview({ recipient, phone, message, group })
  }

  function groupReminderMessage() {
    const debtors = obligations.filter((member) => member.total > 0)
    const lines = debtors.map((member) => `${member.memberName}: Iuran ${currency(member.iuran)} · Wijilan ${currency(member.wijilan)} · Sukaduka ${currency(member.sukaduka)}`)
    return `Om Swastyastu, Semeton.\nRekap kewajiban anggota per ${readableDate(today)}:\n${lines.length ? lines.join('\n') : 'Tidak ada tunggakan tercatat.'}\n\nTotal tunggakan: ${currency(totals.all)}\nBatas pembayaran: ${deadline ? readableDate(deadline) : '[tanggal batas pembayaran]'}\n\nMatur suksma. Prajuru Piodalan\nhttps://sendetan.vercel.app/`
  }

  function groupDailyMessage() {
    const lines = dailyRows.map((row) => `${row.memberName}: Iuran ${currency(row.iuran)} · Sukaduka ${currency(row.sukaduka)} · Wijilan ${currency(row.wijilan)} | Sisa kewajiban ${currency(row.iuranDue + row.sukadukaDue + row.wijilanDue)}`)
    return `Om Swastyastu.\nRekap input harian ${readableDate(dailyDate)}:\n${lines.length ? lines.join('\n') : 'Belum ada input transaksi anggota pada tanggal ini.'}\n\nTotal input: ${currency(dailyTotals.all)}\nTotal tunggakan saat ini: ${currency(totals.all)}\nhttps://sendetan.vercel.app/`
  }

  return <div className="animate-rise print-report space-y-5">
    <PrintLetterhead title="Rekap kewajiban anggota" detail={`Diperbarui ${new Date().toLocaleDateString('id-ID')}`} />
    <div className="no-print flex flex-col justify-between gap-3 border-b border-[#e6e7dd] pb-4 lg:flex-row lg:items-end"><div><h2 className="font-display text-lg font-extrabold">Kewajiban & rekap anggota</h2><p className="mt-1 text-xs text-[#849084]">Iuran dan Sukaduka mengikuti saldo master; Wijilan dihitung per piodalan.</p></div><div className="flex flex-wrap items-end gap-2"><label className="grid gap-1 text-[10px] font-semibold text-[#788579]">Batas pembayaran<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputClass} /></label><button onClick={() => window.print()} className="flex items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold"><Printer size={15} /> Cetak rekap</button><button onClick={() => openPreview('Grup WhatsApp', '', groupReminderMessage(), true)} className="flex items-center gap-2 rounded-md bg-[#355d3f] px-3 py-2.5 text-xs font-semibold text-white"><MessageCircle size={15} /> Pratinjau reminder grup</button></div></div>
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{[['Tunggakan iuran', totals.iuran], ['Tunggakan Sukaduka', totals.sukaduka], ['Tunggakan Wijilan', totals.wijilan], ['Total kewajiban', totals.all]].map(([label, amount]) => <div key={label} className="border-l-2 border-[#b5122a] bg-white px-4 py-3"><p className="text-[10px] text-[#849084]">{label}</p><p className="mt-1 font-display text-lg font-extrabold">{currency(amount)}</p></div>)}</div>
    <section className="overflow-hidden border-y border-[#e6e7dd] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#eceee6] px-4 py-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-sm font-bold">Status per anggota</h3><p className="mt-1 text-[10px] text-[#849084]">{obligations.filter((member) => member.total > 0).length} anggota masih memiliki kewajiban</p></div><input type="search" placeholder="Cari nama / nomor anggota" value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} no-print`} /></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#fafaf6] text-[10px] text-[#849084]"><tr><th className="px-4 py-3">Anggota</th><th className="px-3 py-3 text-right">Iuran</th><th className="px-3 py-3 text-right">Sukaduka</th><th className="px-3 py-3 text-right">Wijilan wajib</th><th className="px-3 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Reminder</th></tr></thead><tbody className="divide-y divide-[#eff0ea]">{loading ? <tr><td colSpan="6" className="p-8 text-center text-[#849084]">Memuat saldo dan transaksi...</td></tr> : visibleObligations.map((member) => <tr key={member.id}><td className="px-4 py-3"><p className="font-semibold">{member.memberName}</p><p className="mt-0.5 text-[10px] text-[#929c91]">{member.memberNo || member.id} · {member.phone || 'Nomor WA belum diisi'}{member.wijilanEvents.length > 0 && <span className="block">{member.wijilanEvents.map((event) => `${event.name}: ${currency(event.remaining)}`).join(' · ')}</span>}</p></td><td className="px-3 py-3 text-right">{currency(member.iuran)}</td><td className="px-3 py-3 text-right">{currency(member.sukaduka)}</td><td className="px-3 py-3 text-right">{currency(member.wijilan)}</td><td className="px-3 py-3 text-right font-bold">{currency(member.total)}</td><td className="px-4 py-3 text-right"><button disabled={!member.phone} title={member.phone ? 'Pratinjau pesan pribadi' : 'Isi nomor telepon anggota dahulu'} onClick={() => openPreview(member.memberName, member.phone, memberMessage(member))} className="inline-flex items-center gap-1.5 rounded-md border border-[#d9e1d5] px-2.5 py-2 text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"><MessageCircle size={13} /> WhatsApp</button></td></tr>)}</tbody><tfoot className="border-t-2 border-[#dfe4d9] bg-[#fafaf6] font-bold"><tr><td className="px-4 py-3">TOTAL</td><td className="px-3 py-3 text-right">{currency(totals.iuran)}</td><td className="px-3 py-3 text-right">{currency(totals.sukaduka)}</td><td className="px-3 py-3 text-right">{currency(totals.wijilan)}</td><td className="px-3 py-3 text-right">{currency(totals.all)}</td><td /></tr></tfoot></table></div>
    </section>
    <section className="overflow-hidden border-y border-[#e6e7dd] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#eceee6] px-4 py-3 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="text-sm font-bold">Rekap input harian</h3><p className="mt-1 text-[10px] text-[#849084]">Setoran per anggota pada tanggal terpilih dan total kewajiban terkini.</p></div><div className="no-print flex flex-wrap items-end gap-2"><label className="grid gap-1 text-[10px] font-semibold text-[#788579]">Tanggal input<input type="date" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} className={inputClass} /></label><button onClick={() => window.print()} className="flex items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold"><Printer size={15} /> Cetak rekap</button><button onClick={() => openPreview('Grup WhatsApp', '', groupDailyMessage(), true)} className="flex items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold"><MessageCircle size={15} /> Pratinjau rekap grup</button></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#fafaf6] text-[10px] text-[#849084]"><tr><th className="px-4 py-3">Anggota</th><th className="px-3 py-3 text-right">Iuran masuk</th><th className="px-3 py-3 text-right">Sukaduka masuk</th><th className="px-3 py-3 text-right">Wijilan masuk</th><th className="px-3 py-3 text-right">Total input</th><th className="px-3 py-3 text-right">Total tunggakan</th><th className="px-4 py-3 text-right">Bagikan</th></tr></thead><tbody className="divide-y divide-[#eff0ea]">{dailyRows.length ? dailyRows.map((row) => <tr key={row.memberId}><td className="px-4 py-3 font-semibold">{row.memberName}</td><td className="px-3 py-3 text-right">{currency(row.iuran)}</td><td className="px-3 py-3 text-right">{currency(row.sukaduka)}</td><td className="px-3 py-3 text-right">{currency(row.wijilan)}</td><td className="px-3 py-3 text-right font-bold">{currency(row.total)}</td><td className="px-3 py-3 text-right">{currency(row.iuranDue + row.sukadukaDue + row.wijilanDue)}</td><td className="px-4 py-3 text-right"><button disabled={!obligations.find((member) => String(member.id) === row.memberId)?.phone} onClick={() => { const member = obligations.find((entry) => String(entry.id) === row.memberId); if (member) openPreview(member.memberName, member.phone, memberMessage(member, row)) }} className="inline-flex items-center gap-1.5 rounded-md border border-[#d9e1d5] px-2.5 py-2 text-[10px] font-semibold disabled:opacity-40"><MessageCircle size={13} /> WhatsApp</button></td></tr>) : <tr><td colSpan="7" className="px-4 py-8 text-center text-xs text-[#849084]">Tidak ada input anggota pada tanggal ini.</td></tr>}</tbody>{dailyRows.length > 0 && <tfoot className="border-t-2 border-[#dfe4d9] bg-[#fafaf6] font-bold"><tr><td className="px-4 py-3">TOTAL HARIAN</td><td className="px-3 py-3 text-right">{currency(dailyTotals.iuran)}</td><td className="px-3 py-3 text-right">{currency(dailyTotals.sukaduka)}</td><td className="px-3 py-3 text-right">{currency(dailyTotals.wijilan)}</td><td className="px-3 py-3 text-right">{currency(dailyTotals.all)}</td><td className="px-3 py-3 text-right">{currency(totals.all)}</td><td /></tr></tfoot>}</table></div>
    </section>
    <PrintSignatures />
    {preview && <div className="no-print"><WhatsAppPreviewModal draft={preview} onClose={() => setPreview(null)} /></div>}
  </div>
}

function WhatsAppPreviewModal({ draft, onClose }) {
  const [message, setMessage] = useState(draft.message)
  function openWhatsApp() {
    let phone = String(draft.phone || '').replace(/\D/g, '')
    if (phone.startsWith('0')) phone = `62${phone.slice(1)}`
    else if (phone.startsWith('8')) phone = `62${phone}`
    const url = `https://wa.me/${draft.group ? '' : phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-labelledby="whatsapp-preview-title" className="w-full max-w-2xl rounded-t-lg bg-white p-5 shadow-xl sm:rounded-md"><div className="flex items-start justify-between gap-3"><div><h2 id="whatsapp-preview-title" className="font-display text-lg font-extrabold">Pratinjau WhatsApp</h2><p className="mt-1 text-xs text-[#849084]">Tujuan: {draft.recipient}{draft.phone ? ` · ${draft.phone}` : ' · tautan grup'}</p></div><button onClick={onClose} aria-label="Tutup pratinjau" className="rounded p-1.5 text-[#7d8b7e]"><X size={18} /></button></div><label className="mt-4 block text-[11px] font-semibold text-[#637367]">Pesan<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows="14" className="mt-1 w-full resize-y rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#789578]" /></label><div className="mt-4 flex justify-end gap-2 border-t border-[#eceee6] pt-4"><button onClick={onClose} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold">Batal</button><button onClick={openWhatsApp} disabled={!draft.group && !String(draft.phone || '').replace(/\D/g, '')} className="inline-flex items-center gap-2 rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><MessageCircle size={15} /> Buka WhatsApp</button></div></section></div>
}

function BatchPaymentModal({ module, members, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const periodNow = today.slice(0, 7)
  const isIuran = module === 'TRANSAKSI_IURAN'
  const [date, setDate] = useState(today)
  const [periodId, setPeriodId] = useState(periodNow)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const submitLock = useRef(false)
  const pendingSubmission = useRef(null)
  const [values, setValues] = useState(() => Object.fromEntries(members.map((member) => [String(member.ID), {
    amount: '', chargeAmount: '', cashPhysical: '', changePaid: '', purpose: '', notes: '',
  }])))
  const inputClass = 'w-full min-w-[96px] rounded border border-[#e1e5dc] bg-white px-2 py-2 text-xs outline-none focus:border-[#b5122a]'
  const visibleMembers = members.filter((member) => `${member.Nama} ${member.ID}`.toLowerCase().includes(search.toLowerCase()))
  const readyCount = members.filter((member) => {
    const value = values[String(member.ID)] || {}
    return isIuran ? Number(value.amount) > 0 : Number(value.amount) > 0 || Number(value.chargeAmount) > 0
  }).length

  function setField(memberId, field, value) {
    setValues((previous) => ({ ...previous, [memberId]: { ...previous[memberId], [field]: value } }))
  }

  async function exportTemplate() {
    const XLSX = await import('xlsx')
    const headers = isIuran
      ? ['memberId', 'memberName', 'date', 'periodId', 'allocatedContribution', 'cashPhysical', 'changePaid', 'notes']
      : ['memberId', 'memberName', 'date', 'chargeAmount', 'amount', 'cashPhysical', 'changePaid', 'purpose', 'notes']
    const rows = members.map((member) => isIuran
      ? { memberId: member.ID, memberName: member.Nama, date, periodId, allocatedContribution: '', cashPhysical: '', changePaid: 0, notes: '' }
      : { memberId: member.ID, memberName: member.Nama, date, chargeAmount: '', amount: '', cashPhysical: '', changePaid: 0, purpose: '', notes: '' })
    const sheet = XLSX.utils.json_to_sheet(rows, { header: headers })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Pembayaran')
    XLSX.writeFile(workbook, isIuran ? 'template-pembayaran-iuran.xlsx' : 'template-pembayaran-sukaduka.xlsx')
  }

  function excelDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    if (typeof value === 'number') {
      const dateValue = XLSX.SSF.parse_date_code(value)
      if (dateValue) return `${dateValue.y}-${String(dateValue.m).padStart(2, '0')}-${String(dateValue.d).padStart(2, '0')}`
    }
    const text = String(value || '').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
    return text
  }

  async function importWorkbook(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
      if (!rows.length) throw new Error('File Excel tidak memiliki baris pembayaran.')
      const memberById = new Map(members.map((member) => [String(member.ID).trim(), member]))
      const memberByName = new Map(members.map((member) => [String(member.Nama).trim().toLowerCase(), member]))
      const imported = {}
      rows.forEach((row, index) => {
        const member = memberById.get(String(row.memberId || '').trim()) || memberByName.get(String(row.memberName || '').trim().toLowerCase())
        const amount = Number(isIuran ? row.allocatedContribution : row.amount) || 0
        const chargeAmount = isIuran ? 0 : Number(row.chargeAmount) || 0
        if (!member || (isIuran ? amount <= 0 : amount <= 0 && chargeAmount <= 0)) return
        const memberId = String(member.ID)
        if (imported[memberId]) throw new Error(`Anggota ${member.Nama} muncul lebih dari sekali (baris ${index + 2}).`)
        imported[memberId] = {
          amount,
          chargeAmount,
          cashPhysical: Number(row.cashPhysical) || 0,
          changePaid: Number(row.changePaid) || 0,
          purpose: String(row.purpose || ''),
          notes: String(row.notes || ''),
          date: excelDate(row.date) || date,
          periodId: String(row.periodId || periodId),
        }
      })
      if (!Object.keys(imported).length) throw new Error('Tidak ada pembayaran bernominal di file. Gunakan template dan isi memberId serta nominal.')
      setValues((previous) => ({ ...previous, ...imported }))
      setMessage(`${Object.keys(imported).length} baris pembayaran terbaca.`)
    } catch (error) {
      setMessage(error.message || 'File Excel tidak dapat dibaca.')
    }
  }

  async function submit() {
    if (submitLock.current) return
    const selected = members.filter((member) => {
      const value = values[String(member.ID)] || {}
      return isIuran ? Number(value.amount) > 0 : Number(value.amount) > 0 || Number(value.chargeAmount) > 0
    })
    if (!selected.length) { setMessage('Masukkan nominal untuk minimal satu anggota.'); return }
    const records = selected.map((member) => {
      const value = values[String(member.ID)]
      const amount = Number(value.amount)
      const chargeAmount = Number(value.chargeAmount) || 0
      const cashPhysical = Number(value.cashPhysical) || 0
      const paymentDate = value.date || date
      if (!paymentDate || amount < 0 || cashPhysical < amount || (isIuran && amount <= 0) || (!isIuran && amount + chargeAmount <= 0)) throw new Error(`Periksa nominal dan uang fisik untuk ${member.Nama}.`)
      if (!isIuran && !String(value.purpose || '').trim()) throw new Error(`Peruntukan sukaduka wajib diisi untuk ${member.Nama}.`)
      return isIuran
        ? { memberId: member.ID, memberName: member.Nama, date: paymentDate, periodId: value.periodId || periodId, allocatedContribution: amount, cashPhysical, changePaid: Number(value.changePaid) || 0, notes: value.notes || '' }
        : { memberId: member.ID, memberName: member.Nama, date: paymentDate, chargeAmount, amount, cashPhysical, changePaid: Number(value.changePaid) || 0, purpose: value.purpose, notes: value.notes || '' }
    })
    const fingerprint = JSON.stringify(records)
    const pending = pendingSubmission.current
    if (pending && pending.fingerprint !== fingerprint) {
      setMessage('Pengiriman sebelumnya belum dipastikan. Kirim ulang data yang sama; jangan ubah transaksi sebelum memeriksa daftar iuran.')
      return
    }
    const prefix = isIuran ? 'IU' : 'SK'
    const submittedRecords = pending?.fingerprint === fingerprint
      ? pending.records
      : records.map((record) => ({ ...record, id: createTransactionId(prefix) }))
    pendingSubmission.current = { fingerprint, records: submittedRecords }
    submitLock.current = true
    setBusy(true)
    try {
      await onSave(submittedRecords)
      pendingSubmission.current = null
    } catch (error) {
      if (!error.uncertain) pendingSubmission.current = null
      setMessage(error.message || 'Pembayaran gagal disimpan.')
    } finally { submitLock.current = false; setBusy(false) }
  }

  const submissionUncertain = Boolean(pendingSubmission.current)
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section className="flex max-h-[94vh] w-full max-w-6xl flex-col rounded-t-lg bg-white shadow-xl sm:rounded-md">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e7dd] p-4 sm:px-6"><div><h2 className="font-display text-lg font-extrabold">Input basket {isIuran ? 'iuran' : 'sukaduka'}</h2><p className="mt-1 text-xs text-[#849084]">{isIuran ? 'Isi banyak anggota sekaligus, atau unggah template Excel.' : 'Tagihan baru menambah saldo; alokasi pembayaran melunasi tunggakan sebelumnya dan tagihan baru.'}</p></div><button onClick={onClose} disabled={busy} className="rounded p-1.5 text-[#7d8b7e] disabled:opacity-50" aria-label="Tutup"><X size={18} /></button></header>
      <fieldset disabled={busy || submissionUncertain} className="contents">
      <div className="flex flex-wrap items-end gap-3 border-b border-[#eceee6] p-4 sm:px-6">
        <label className="text-[11px] font-semibold">Tanggal<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={`${inputClass} mt-1`} /></label>
        {isIuran && <label className="text-[11px] font-semibold">Periode<input type="month" value={periodId} onChange={(event) => setPeriodId(event.target.value)} className={`${inputClass} mt-1`} /></label>}
        <label className="min-w-[180px] flex-1 text-[11px] font-semibold">Cari anggota<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama atau ID" className={`${inputClass} mt-1`} /></label>
        <button onClick={exportTemplate} className="flex items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold text-[#4e7053]"><FileText size={15} /> Unduh format Excel</button>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold text-[#4e7053]"><Plus size={15} /> Unggah Excel<input type="file" accept=".xlsx,.xls" onChange={importWorkbook} className="hidden" /></label>
        <button onClick={() => setValues((previous) => Object.fromEntries(members.map((member) => { const due = Number(isIuran ? member.Sisa_Hutang_Iuran : member.Sisa_Hutang_Sukaduka) || 0; return [String(member.ID), { ...previous[String(member.ID)], amount: due || '', cashPhysical: due || '' }] })))} className="rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold text-[#4e7053]">Isi sesuai tunggakan</button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[900px] text-left text-xs"><thead className="sticky top-0 bg-[#fafaf6] text-[10px] uppercase text-[#89958a]"><tr><th className="px-4 py-3">Anggota</th><th className="px-3 py-3">Saldo tunggakan</th>{!isIuran && <th className="px-3 py-3">Tagihan baru</th>}<th className="px-3 py-3">Dialokasikan</th><th className="px-3 py-3">Uang fisik</th><th className="px-3 py-3">Kembalian diberikan</th>{!isIuran && <th className="px-3 py-3">Peruntukan</th>}<th className="px-3 py-3">Catatan</th></tr></thead>
          <tbody className="divide-y divide-[#eff0ea]">{visibleMembers.map((member) => {
            const key = String(member.ID)
            const value = values[key] || {}
            return <tr key={key}><td className="px-4 py-2.5"><b>{member.Nama}</b><span className="ml-2 text-[10px] text-[#929c91]">{member.ID}</span></td><td className="px-3 py-2.5">{currency(isIuran ? member.Sisa_Hutang_Iuran : member.Sisa_Hutang_Sukaduka)}</td>{!isIuran && <td className="px-3 py-2.5"><input type="number" min="0" step="1" value={value.chargeAmount || ''} onChange={(event) => setField(key, 'chargeAmount', event.target.value)} className={inputClass} /></td>}<td className="px-3 py-2.5"><input type="number" min="0" step="1" value={value.amount || ''} onChange={(event) => setField(key, 'amount', event.target.value)} className={inputClass} /></td><td className="px-3 py-2.5"><input type="number" min="0" step="1" value={value.cashPhysical || ''} onChange={(event) => setField(key, 'cashPhysical', event.target.value)} className={inputClass} /></td><td className="px-3 py-2.5"><input type="number" min="0" step="1" value={value.changePaid || ''} onChange={(event) => setField(key, 'changePaid', event.target.value)} className={inputClass} /></td>{!isIuran && <td className="px-3 py-2.5"><input value={value.purpose || ''} onChange={(event) => setField(key, 'purpose', event.target.value)} className={inputClass} /></td>}<td className="px-3 py-2.5"><input value={value.notes || ''} onChange={(event) => setField(key, 'notes', event.target.value)} className={inputClass} /></td></tr>
          })}</tbody>
        </table>
      </div>
      </fieldset>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceee6] p-4 sm:px-6"><div className="text-xs text-[#68776b]">{readyCount} anggota akan dicatat{message && <p role="status" className="mt-1 font-semibold text-[#b5122a]">{message}</p>}</div><div className="flex gap-2"><button onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button onClick={submit} disabled={busy || !readyCount} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : submissionUncertain ? 'Coba kirim ulang' : `Simpan ${readyCount} pembayaran`}</button></div></footer>
    </section>
  </div>
}

function BatchLedgerModal({ module, members, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const isPunia = module === 'punia'
  const [records, setRecords] = useState(() => Array.from({ length: 5 }, () => blankRecord()))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [submissionUncertain, setSubmissionUncertain] = useState(false)
  const submitLock = useRef(false)
  const pendingSubmission = useRef(null)
  const [wijilanMode, setWijilanMode] = useState(false)
  const [wijilanEvent, setWijilanEvent] = useState('')
  const [wijilanCharge, setWijilanCharge] = useState('')
  const inputClass = 'w-full min-w-[110px] rounded border border-[#e1e5dc] bg-white px-2 py-2 text-xs outline-none focus:border-[#b5122a]'

  function blankRecord() {
    return isPunia
      ? { date: today, donor: '', donationType: 'Uang Tunai', eventName: '', itemName: '', quantity: '', unit: '', amount: '', notes: '' }
      : { date: today, eventName: '', category: 'Punia uang', donor: '', memberId: '', chargeAmount: '', itemName: '', quantity: '', unit: '', direction: 'Masuk', amount: '', description: '' }
  }

  function updateRow(index, field, value) {
    setRecords((previous) => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  }

  function hasData(row) {
    if (!isPunia && row.category === 'Wijilan / Setoran wajib' && row.memberId) return Number(row.amount) > 0 || Number(row.chargeAmount) > 0
    const fields = isPunia ? ['donor', 'eventName', 'itemName', 'amount', 'notes'] : ['eventName', 'donor', 'itemName', 'amount', 'description']
    return fields.some((field) => String(row[field] || '').trim())
  }

  const readyCount = records.filter(hasData).length
  const headers = isPunia
    ? ['date', 'donor', 'donationType', 'eventName', 'itemName', 'quantity', 'unit', 'amount', 'notes']
    : ['date', 'eventName', 'category', 'donor', 'memberId', 'chargeAmount', 'itemName', 'quantity', 'unit', 'direction', 'amount', 'description']

  function startWijilanForAll() {
    if (!members.length) { setMessage('Daftar anggota belum dimuat. Buka kembali menu Piodalan lalu coba lagi.'); return }
    setWijilanMode(true)
    setRecords(members.map((member) => ({ ...blankRecord(), eventName: wijilanEvent, category: 'Wijilan / Setoran wajib', donor: member.Nama, memberId: member.ID, chargeAmount: wijilanCharge, direction: 'Masuk' })))
    setMessage(`Daftar ${members.length} anggota disiapkan. Isi tagihan dan pembayaran tiap anggota.`)
  }

  async function exportWijilanTemplate() {
    if (!members.length) { setMessage('Daftar anggota belum dimuat. Buka kembali menu Piodalan lalu coba lagi.'); return }
    try {
      const XLSX = await import('xlsx')
      const rows = members.map((member) => ({
        date: today, eventName: wijilanEvent, category: 'Wijilan / Setoran wajib', donor: member.Nama,
        memberId: member.ID, chargeAmount: wijilanCharge, itemName: '', quantity: 0, unit: '', direction: 'Masuk', amount: '', description: '',
      }))
      const sheet = XLSX.utils.json_to_sheet(rows, { header: headers })
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, 'Wijilan per Anggota')
      XLSX.writeFile(workbook, 'template-wijilan-semua-anggota.xlsx')
    } catch (error) { setMessage(error.message || 'Template Wijilan tidak dapat dibuat.') }
  }

  async function exportTemplate() {
    try {
      const XLSX = await import('xlsx')
      const sheet = XLSX.utils.json_to_sheet(Array.from({ length: 10 }, () => blankRecord()), { header: headers })
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, isPunia ? 'Dana Punia' : 'Piodalan')
      XLSX.writeFile(workbook, isPunia ? 'template-basket-dana-punia.xlsx' : 'template-basket-piodalan.xlsx')
    } catch (error) { setMessage(error.message || 'Template Excel tidak dapat dibuat.') }
  }

  function excelDate(value, XLSX) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value)
      if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
    }
    return String(value || '').trim()
  }

  async function importWorkbook(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true })
      const imported = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' })
        .map((row) => {
          const member = !isPunia && row.memberId ? members.find((item) => String(item.ID) === String(row.memberId)) : null
          return { ...blankRecord(), ...row, donor: member?.Nama || row.donor || '', date: excelDate(row.date, XLSX) || today }
        })
        .filter(hasData)
      if (!imported.length) throw new Error('File belum berisi data donor atau transaksi.')
      if (!isPunia && imported.some((row) => row.category === 'Wijilan / Setoran wajib' && row.memberId)) {
        setWijilanMode(true)
        setWijilanEvent(imported.find((row) => row.eventName)?.eventName || '')
        setWijilanCharge(String(imported.find((row) => row.chargeAmount)?.chargeAmount || ''))
      }
      setRecords([...imported, ...Array.from({ length: 3 }, () => blankRecord())])
      setMessage(`${imported.length} baris terbaca dari Excel.`)
    } catch (error) { setMessage(error.message || 'File Excel tidak dapat dibaca.') }
  }

  function prepareRecords() {
    const filled = records.filter(hasData)
    if (!filled.length) throw new Error('Isi minimal satu baris transaksi.')
    return filled.map((row, index) => {
      const amount = Number(row.amount) || 0
      const quantity = Number(row.quantity) || 0
      if (!row.date) throw new Error(`Tanggal wajib diisi pada baris basket ${index + 1}.`)
      if (isPunia) {
        if (!String(row.donor || '').trim()) throw new Error(`Nama pemberi wajib diisi pada baris ${index + 1}.`)
        if (row.donationType === 'Barang') {
          if (!String(row.itemName || '').trim() || !Number.isInteger(quantity) || quantity < 1) throw new Error(`Nama dan jumlah barang wajib pada baris ${index + 1}.`)
          return { ...row, donor: String(row.donor).trim(), quantity, unit: String(row.unit || 'unit').trim() || 'unit', amount }
        } else if (amount <= 0) throw new Error(`Nominal punia wajib lebih dari nol pada baris ${index + 1}.`)
        return { ...row, donor: String(row.donor).trim(), quantity, unit: '', amount }
      }
      const eventName = String(row.eventName || (wijilanMode ? wijilanEvent : '')).trim()
      if (!eventName || !row.category || !row.direction) throw new Error(`Nama piodalan, kategori, dan arus wajib pada baris ${index + 1}.`)
      if (['Punia uang', 'Punia barang', 'Wijilan / Setoran wajib'].includes(row.category) && !String(row.donor || '').trim()) throw new Error(`Nama penyumbang wajib pada baris ${index + 1}.`)
      if (row.category === 'Wijilan / Setoran wajib' && (!row.memberId || !members.some((member) => String(member.ID) === String(row.memberId)))) throw new Error(`Pilih anggota dari master pada baris ${index + 1}.`)
      if (row.category === 'Punia barang') {
        if (row.direction !== 'Masuk' || !String(row.itemName || '').trim() || !Number.isInteger(quantity) || quantity < 1) throw new Error(`Punia barang perlu nama/jumlah barang dan arus Masuk pada baris ${index + 1}.`)
        return { ...row, eventName, donor: String(row.donor || '').trim(), quantity, unit: String(row.unit || 'unit').trim() || 'unit', amount }
      } else if (row.category === 'Wijilan / Setoran wajib') {
        const chargeAmount = Number(row.chargeAmount) || 0
        if (amount <= 0 && chargeAmount <= 0) throw new Error(`Isi tagihan Wijilan atau nominal bayar pada baris ${index + 1}.`)
        const member = members.find((item) => String(item.ID) === String(row.memberId))
        return { ...row, eventName, donor: member.Nama, memberId: member.ID, chargeAmount, quantity, unit: '', amount }
      } else if (amount <= 0) throw new Error(`Nominal transaksi harus lebih dari nol pada baris ${index + 1}.`)
      return { ...row, eventName, donor: String(row.donor || '').trim(), chargeAmount: 0, quantity, unit: '', amount }
    })
  }

  async function submit() {
    if (submitLock.current) return
    let prepared
    try { prepared = prepareRecords() } catch (error) { setMessage(error.message); return }
    const fingerprint = JSON.stringify(prepared)
    const pending = pendingSubmission.current
    if (pending && pending.fingerprint !== fingerprint) {
      setMessage('Pengiriman sebelumnya belum dipastikan. Kembalikan data seperti semula lalu kirim ulang, atau periksa daftar transaksi sebelum membuat pengiriman baru.')
      return
    }
    const recordsToSave = pending?.records || prepared.map((record) => ({ ...record, id: createTransactionId(isPunia ? 'PU' : 'PI') }))
    pendingSubmission.current = { fingerprint, records: recordsToSave }
    submitLock.current = true
    setBusy(true)
    try { await onSave(recordsToSave); pendingSubmission.current = null; setSubmissionUncertain(false) }
    catch (error) {
      if (!error.uncertain) pendingSubmission.current = null
      setSubmissionUncertain(Boolean(error.uncertain))
      setMessage(error.message || 'Status penyimpanan belum dapat dipastikan.')
    }
    finally { submitLock.current = false; setBusy(false) }
  }

  function textCell(index, field, placeholder = '', type = 'text') {
    return <input type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '1' : undefined} value={records[index][field] ?? ''} onChange={(event) => updateRow(index, field, event.target.value)} placeholder={placeholder} className={inputClass} />
  }

  function selectCell(index, field, options) {
    return <select value={records[index][field]} onChange={(event) => updateRow(index, field, event.target.value)} className={inputClass}>{options.map((option) => <option key={option}>{option}</option>)}</select>
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section className="flex max-h-[94vh] w-full max-w-7xl flex-col rounded-t-lg bg-white shadow-xl sm:rounded-md">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6e7dd] p-4 sm:px-6"><div><h2 className="font-display text-lg font-extrabold">Input basket {isPunia ? 'Dana Punia' : 'Piodalan'}</h2><p className="mt-1 text-xs text-[#849084]">Masukkan beberapa penyumbang/transaksi atau unggah file Excel untuk disimpan sekaligus.</p></div><button onClick={onClose} disabled={busy} aria-label="Tutup" className="rounded p-1.5 disabled:opacity-50"><X size={18} /></button></header>
      <fieldset disabled={busy || submissionUncertain} className="contents">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#eceee6] p-4 sm:px-6"><button onClick={exportTemplate} className="flex items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold"><FileText size={15} /> Unduh format Excel</button><label className="flex cursor-pointer items-center gap-2 rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold"><Plus size={15} /> Unggah Excel<input type="file" accept=".xlsx,.xls" onChange={importWorkbook} className="hidden" /></label>{!isPunia && <><button onClick={startWijilanForAll} disabled={!members.length} className="rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold disabled:opacity-50">Tagihkan Wijilan semua anggota</button><button onClick={exportWijilanTemplate} disabled={!members.length} className="rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold disabled:opacity-50">Template Wijilan anggota</button></>}<button onClick={() => setRecords((previous) => [...previous, blankRecord()])} className="rounded-md border border-[#d9e1d5] px-3 py-2.5 text-xs font-semibold">Tambah baris</button><span className="ml-auto text-xs text-[#849084]">{readyCount} baris terisi</span></div>
      {wijilanMode && <div className="grid grid-cols-1 gap-3 border-b border-[#eceee6] px-4 py-3 sm:grid-cols-2 sm:px-6"><label className="text-[11px] font-semibold">Nama piodalan<input value={wijilanEvent} onChange={(event) => setWijilanEvent(event.target.value)} placeholder="Nama piodalan" className={`${inputClass} mt-1`} /></label><label className="text-[11px] font-semibold">Tagihan standar per anggota<input type="number" min="0" step="1" value={wijilanCharge} onChange={(event) => { const value = event.target.value; setWijilanCharge(value); setRecords((previous) => previous.map((row) => row.category === 'Wijilan / Setoran wajib' ? { ...row, chargeAmount: value } : row)) }} className={`${inputClass} mt-1`} /></label><p className="text-[10px] leading-4 text-[#849084] sm:col-span-2">Tagihan dicatat per anggota dan acara. Isi pembayaran yang sudah diterima; anggota yang belum membayar tetap dapat disimpan dengan nominal bayar 0.</p></div>}
      <div className="min-h-0 flex-1 overflow-auto"><table className="w-full min-w-[1320px] text-left text-xs"><thead className="sticky top-0 bg-[#fafaf6] text-[9px] font-bold uppercase text-[#89958a]"><tr>{(isPunia ? ['Tanggal', 'Nama pemberi', 'Jenis', 'Nama piodalan', 'Barang', 'Jumlah', 'Satuan', 'Nominal/nilai', 'Catatan'] : ['Tanggal', 'Nama piodalan', 'Kategori', 'Nama pemberi', 'Anggota', 'Tagihan wajib', 'Barang', 'Jumlah', 'Satuan', 'Arus', 'Nominal dibayar', 'Keterangan']).map((label) => <th key={label} className="px-2 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#eff0ea]">{records.map((row, index) => <tr key={index}>
        <td className="px-2 py-2">{textCell(index, 'date', '', 'date')}</td>
        {isPunia ? <>
          <td className="px-2 py-2">{textCell(index, 'donor', 'Nama pemberi')}</td>
          <td className="px-2 py-2">{selectCell(index, 'donationType', ['Uang Tunai', 'Wijilan / Setoran wajib', 'Barang'])}</td>
          <td className="px-2 py-2">{textCell(index, 'eventName', 'Opsional')}</td>
          <td className="px-2 py-2">{textCell(index, 'itemName', 'Nama barang')}</td>
          <td className="px-2 py-2">{textCell(index, 'quantity', '', 'number')}</td>
          <td className="px-2 py-2">{textCell(index, 'unit', 'kg / bungkus / unit')}</td>
          <td className="px-2 py-2">{textCell(index, 'amount', '', 'number')}</td>
          <td className="px-2 py-2">{textCell(index, 'notes', 'Catatan')}</td>
        </> : <>
          <td className="px-2 py-2">{wijilanMode ? <input readOnly value={wijilanEvent} placeholder="Nama piodalan di atas" className={`${inputClass} bg-[#f5f6f1]`} /> : textCell(index, 'eventName', 'Nama piodalan')}</td>
          <td className="px-2 py-2">{selectCell(index, 'category', ['Punia uang', 'Punia barang', 'Wijilan / Setoran wajib', 'Saldo awal', 'Sesari piodalan', 'Belanja'])}</td>
          <td className="px-2 py-2">{wijilanMode && row.memberId ? <div className="min-w-[150px] px-2 py-1"><b>{row.donor}</b><span className="ml-2 text-[10px] text-[#929c91]">{row.memberId}</span></div> : textCell(index, 'donor', 'Nama pemberi')}</td>
          <td className="px-2 py-2"><select value={row.memberId} onChange={(event) => { const member = members.find((item) => String(item.ID) === event.target.value); setRecords((previous) => previous.map((entry, rowIndex) => rowIndex === index ? { ...entry, memberId: event.target.value, donor: member?.Nama || entry.donor } : entry)) }} disabled={wijilanMode && Boolean(row.memberId)} className={inputClass}><option value="">Pilih anggota</option>{members.map((member) => <option key={member.ID} value={member.ID}>{member.Nama}</option>)}</select></td>
          <td className="px-2 py-2">{row.category === 'Wijilan / Setoran wajib' ? textCell(index, 'chargeAmount', '0', 'number') : '-'}</td>
          <td className="px-2 py-2">{textCell(index, 'itemName', 'Nama barang')}</td>
          <td className="px-2 py-2">{textCell(index, 'quantity', '', 'number')}</td>
          <td className="px-2 py-2">{textCell(index, 'unit', 'kg / bungkus / unit')}</td>
          <td className="px-2 py-2">{selectCell(index, 'direction', ['Masuk', 'Keluar'])}</td>
          <td className="px-2 py-2">{textCell(index, 'amount', '', 'number')}</td>
          <td className="px-2 py-2">{textCell(index, 'description', 'Keterangan')}</td>
        </>}
      </tr>)}</tbody></table></div>
      </fieldset>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceee6] p-4 sm:px-6"><div className="text-xs text-[#68776b]">{message && <p role="status" className="font-semibold text-[#b5122a]">{message}</p>}Nama pemberi akan ditampilkan pada dashboard publik.</div><div className="flex gap-2"><button onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button onClick={submit} disabled={busy || !readyCount} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : submissionUncertain ? 'Coba kirim ulang' : `Simpan ${readyCount} baris`}</button></div></footer>
    </section>
  </div>
}

function RecordModal({ page, editing, members, contacts, assets, rentalRows, busy, onClose, onSave, onSaveIuran, onSaveSukaduka, onSaveRental, onSaveActivity }) {
  const [submissionUncertain, setSubmissionUncertain] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event) {
    const form = event.currentTarget
    try { await onSave(event) }
    catch (error) {
      if (error.uncertain) setSubmissionUncertain(true)
      else {
        delete form.dataset.requestId
        delete form.dataset.requestPayload
      }
      setMessage(error.message || 'Status penyimpanan belum dapat dipastikan.')
    }
  }
  if (page.api === 'TRANSAKSI_IURAN') return <IuranModal members={members} editing={editing} busy={busy} onClose={onClose} onSave={onSaveIuran} />
  if (page.api === 'Sukaduka') return <SukadukaModal members={members} editing={editing} busy={busy} onClose={onClose} onSave={onSaveSukaduka} />
  if (page.api === 'SewaAset') return <RentalModal assets={assets} rentalRows={rentalRows} editing={editing} busy={busy} onClose={onClose} onSave={onSaveRental} />
  if (page.api === 'Notulensi') return <NotulensiModal contacts={contacts} editing={editing} busy={busy} onClose={onClose} onSave={onSave} />
  if (page.api === 'KegiatanMedia') return <ActivityMediaModal editing={editing} busy={busy} onClose={onClose} onSave={onSaveActivity} />
  const today = new Date().toISOString().slice(0, 10)
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah catatan' : `Tambah ${page.title.toLowerCase()}`}</h2><p className="mt-1 text-xs text-[#8c978d]">Lengkapi informasi berikut.</p></div><button onClick={onClose} disabled={busy} className="rounded p-1.5 text-[#7d8b7e] disabled:opacity-50" aria-label="Tutup"><X size={18} /></button></div>
      {message && <p role="alert" className="mb-3 rounded border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2 text-xs font-semibold text-[#b5122a]">{message}</p>}
      <form onSubmit={(event) => { event.preventDefault(); submit(event) }} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <fieldset disabled={busy || submissionUncertain} className="contents">
        {page.fields.map(([key, label, type]) => <label key={key} className={`block ${type === 'textarea' || key === 'photoFile' ? 'sm:col-span-2' : ''}`}><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">{label}{key === 'purpose' && <span className="ml-1 text-[#c16e52]">*</span>}</span>
          {type === 'member' ? <select name={key} defaultValue={editing?.[key] || ''} className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]"><option value="">Pilih anggota untuk Wijilan</option>{members.map((member) => <option key={member.ID} value={member.ID}>{member.Nama}</option>)}</select> : type.startsWith('select:') ? <select name={key} defaultValue={editing?.[key] || ''} required className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]"><option value="" disabled>Pilih {label.toLowerCase()}</option>{type.slice(7).split('|').map((option) => <option key={option}>{option}</option>)}</select> : type === 'textarea' ? <textarea name={key} defaultValue={editing?.[key] || ''} rows={key === 'minutes' || key === 'followUp' ? '8' : '3'} className="w-full resize-y rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]" /> : type === 'file' ? <input name={key} type="file" accept="image/*" className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-[#e9efe5] file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:text-[#496b4d]" /> : <input name={key} type={type} required={key === 'date' || key === 'memberName' || key === 'amount' || key === 'description' && page.api === 'PengeluaranIuran' || (key === 'password' && !editing)} minLength={key === 'password' ? 12 : undefined} min={type === 'number' ? '0' : undefined} step={type === 'number' ? 'any' : undefined} defaultValue={key === 'password' ? '' : editing?.[key] ?? (key === 'date' ? today : key === 'chargeAmount' ? 0 : '')} placeholder={key === 'password' && editing ? 'Kosongkan jika tidak diubah' : undefined} readOnly={key === 'photoUrl'} className={`w-full rounded-md border border-[#e1e5dc] px-3 py-2.5 text-xs outline-none focus:border-[#789578] ${key === 'photoUrl' ? 'bg-[#f5f6f1] text-[#809080]' : 'bg-white'}`} />}
        </label>)}
        </fieldset>
        <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold text-[#68776b] hover:bg-[#f7f8f4] disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button disabled={busy} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#294d33] disabled:cursor-wait disabled:opacity-50">{busy ? 'Menyimpan...' : submissionUncertain ? 'Coba kirim ulang' : editing ? 'Simpan perubahan' : 'Simpan catatan'}</button></div>
      </form>
    </div>
  </div>
}

function SukadukaModal({ members, editing, busy, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: editing?.date || today,
    direction: editing?.direction || 'Masuk',
    memberId: editing?.memberId || '',
    recipient: editing?.recipient || '',
    purpose: editing?.purpose || '',
    amount: Number(editing?.amount || 0),
    chargeAmount: editing && (editing.chargeAmount === '' || editing.chargeAmount === undefined || editing.chargeAmount === null) ? Number(editing.amount || 0) : Number(editing?.chargeAmount || 0),
    cashPhysical: Number(editing?.cashPhysical || 0),
    changePaid: Number(editing?.changePaid || 0),
    notes: editing?.notes || '',
  })
  const [proofFile, setProofFile] = useState(null)
  const [submissionUncertain, setSubmissionUncertain] = useState(false)
  const [message, setMessage] = useState('')
  const transactionId = useRef(editing?.id || createTransactionId('SK'))
  const member = members.find((entry) => String(entry.ID) === String(form.memberId))
  const amount = Number(form.amount) || 0
  const chargeAmount = Number(form.chargeAmount) || 0
  const cash = Number(form.cashPhysical) || 0
  const changeDue = Math.max(0, cash - amount)
  const changePaid = Number(form.changePaid) || 0
  const openingRefundDebt = Math.max(0, Number(member?.Sisa_Hutang_Kembalian || 0) - Number(editing?.refundDebtAdded || 0))
  const editingTracksArrears = editing && editing.chargeAmount !== '' && editing.chargeAmount !== undefined && editing.chargeAmount !== null
  const openingArrears = Math.max(0, Number(member?.Sisa_Hutang_Sukaduka || 0) - (editingTracksArrears ? Number(editing.chargeAmount || 0) - Number(editing.amount || 0) : 0))
  const totalDue = openingArrears + chargeAmount
  const endingArrears = Math.max(0, totalDue - amount)
  const valid = Boolean(form.date) && (form.direction === 'Keluar' ? Boolean(form.recipient) && amount > 0 : Boolean(member) && chargeAmount >= 0 && amount >= 0 && amount + chargeAmount > 0 && cash >= amount && changePaid <= openingRefundDebt + changeDue)
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  const readonlyClass = `${inputClass} bg-[#f5f6f1] font-semibold text-[#809080]`

  function setValue(key, value) { setForm((previous) => ({ ...previous, [key]: value })) }
  async function submit(event) {
    event.preventDefault()
    if (!valid) return
    const incoming = form.direction === 'Masuk'
    try { await onSave({
      id: transactionId.current, date: form.date, direction: form.direction,
      recipient: incoming ? member.Nama : form.recipient,
      memberId: incoming ? member.ID : '', memberName: incoming ? member.Nama : '',
      purpose: form.purpose, amount, chargeAmount,
      openingArrears: incoming ? openingArrears : 0,
      arrears: incoming ? endingArrears : '',
      cashPhysical: incoming ? cash : 0,
      changeDue: incoming ? changeDue : 0,
      changePaid: incoming ? changePaid : 0,
      refundDebtAdded: incoming ? changeDue - changePaid : 0,
      refundDebt: incoming ? openingRefundDebt + changeDue - changePaid : 0,
      notes: form.notes,
      proofFile,
    }) ; setSubmissionUncertain(false) } catch (error) {
      if (error.uncertain) setSubmissionUncertain(true)
      else transactionId.current = createTransactionId('SK')
      setMessage(error.message || 'Status transaksi belum dapat dipastikan.')
    }
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}><div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah transaksi sukaduka' : 'Catat sukaduka'}</h2><p className="mt-1 text-xs text-[#8c978d]">Tagihan dan pembayaran memperbarui saldo tunggakan anggota otomatis.</p></div><button type="button" onClick={onClose} disabled={busy} className="rounded p-1.5 text-[#7d8b7e] disabled:opacity-50" aria-label="Tutup"><X size={18} /></button></div>
    {message && <p role="alert" className="mb-3 rounded border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2 text-xs font-semibold text-[#b5122a]">{message}</p>}
    <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <fieldset disabled={busy || submissionUncertain} className="contents">
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal transaksi</span><input type="date" value={form.date} onChange={(event) => setValue('date', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Arus kas</span><select value={form.direction} disabled={Boolean(editing)} onChange={(event) => setValue('direction', event.target.value)} className={inputClass}><option>Masuk</option><option>Keluar</option></select></label>
      {form.direction === 'Masuk' ? <>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Nama anggota</span><select required value={form.memberId} onChange={(event) => setValue('memberId', event.target.value)} disabled={!members.length || Boolean(editing)} className={inputClass}><option value="">{members.length ? 'Pilih anggota' : 'Belum ada anggota pada master'}</option>{members.map((entry) => <option key={entry.ID} value={entry.ID}>{entry.Nama}</option>)}</select></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Tunggakan sebelumnya</span><input readOnly value={openingArrears} className={`${inputClass} bg-[#f5f6f1]`} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Tagihan sukaduka baru</span><input type="number" min="0" step="1" value={form.chargeAmount} onChange={(event) => setValue('chargeAmount', event.target.value)} className={inputClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Total tunggakan yang bisa dibayar</span><input readOnly value={totalDue} className={`${inputClass} bg-[#f5f6f1]`} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Setoran sukaduka</span><input type="number" min="0" step="1" value={form.amount} onChange={(event) => setValue('amount', event.target.value)} className={inputClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Uang fisik diterima</span><input type="number" min={amount} step="1" value={form.cashPhysical} onChange={(event) => setValue('cashPhysical', event.target.value)} className={inputClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Kembalian seharusnya</span><input readOnly value={changeDue} className={readonlyClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Kembalian diberikan</span><input type="number" min="0" max={openingRefundDebt + changeDue} step="1" value={form.changePaid} onChange={(event) => setValue('changePaid', event.target.value)} className={inputClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Sisa hutang kembalian</span><input readOnly value={openingRefundDebt + changeDue - changePaid} className={readonlyClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Sisa tunggakan sukaduka</span><input readOnly value={endingArrears} className={readonlyClass} /></label>
      </> : <label><span className="mb-1.5 block text-[11px] font-semibold">Penerima dana</span><input required value={form.recipient} onChange={(event) => setValue('recipient', event.target.value)} className={inputClass} /></label>}
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Catatan / peruntukan</span><input value={form.purpose} onChange={(event) => setValue('purpose', event.target.value)} className={inputClass} /></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Foto bukti serah terima</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className={inputClass} /><span className="mt-1 block text-[10px] text-[#888]">Foto tersimpan di folder Drive Foto Sukaduka (maks. 5 MB).{editing?.proofPhotoUrl && <a className="ml-1 font-semibold text-[#b5122a] underline" href={editing.proofPhotoUrl} target="_blank" rel="noreferrer">Lihat bukti saat ini</a>}</span></label>
      {form.direction === 'Keluar' && <label><span className="mb-1.5 block text-[11px] font-semibold">Nominal</span><input type="number" min="1" value={form.amount} onChange={(event) => setValue('amount', event.target.value)} className={inputClass} /></label>}
      </fieldset>
      {!valid && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Periksa anggota, tagihan, alokasi pembayaran, uang fisik, dan kembalian.</p>}
      <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button disabled={!valid || busy} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : submissionUncertain ? 'Coba konfirmasi transaksi' : 'Simpan transaksi'}</button></div>
    </form>
  </div></div>
}

function RentalModal({ assets, rentalRows, editing, busy, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: editing?.date || today, assetId: editing?.assetId || '', renter: editing?.renter || '',
    startDate: editing?.startDate || today, endDate: editing?.endDate || today,
    customerType: editing?.customerType || 'Semeton',
    quantity: Number(editing?.quantity || 1), maintenanceCost: Number(editing?.maintenanceCost || 0),
    status: editing?.status || 'Berjalan', notes: editing?.notes || '',
  })
  const [submissionUncertain, setSubmissionUncertain] = useState(false)
  const [message, setMessage] = useState('')
  const transactionId = useRef(editing?.id || createTransactionId('SW'))
  const asset = assets.find((item) => String(item.id) === String(form.assetId))
  function availableFor(item) {
    if (!item || item.condition === 'Rusak' || !form.startDate || !form.endDate) return 0
    const occupied = rentalRows.filter((row) => String(row.assetId) === String(item.id) && row.id !== editing?.id && !['Dibatalkan', 'Selesai'].includes(row.status) && row.startDate && row.endDate && row.startDate <= form.endDate && row.endDate >= form.startDate).reduce((sum, row) => sum + Number(row.quantity || 0), 0)
    return Math.max(0, Number(item.quantity || 0) - occupied)
  }
  const available = availableFor(asset)
  const days = form.startDate && form.endDate ? Math.max(1, Math.floor((new Date(`${form.endDate}T00:00:00`) - new Date(`${form.startDate}T00:00:00`)) / 86400000) + 1) : 0
  const rentalRate = Number(form.customerType === 'Luar' ? asset?.rentalRateLuar || asset?.rentalRate : asset?.rentalRateSemeton || asset?.rentalRate) || 0
  const rentalIncome = rentalRate * Number(form.quantity || 0) * days
  const valid = Boolean(asset && form.renter && form.startDate && form.endDate && form.endDate >= form.startDate) && Number(form.quantity) > 0 && (form.status === 'Dibatalkan' || Number(form.quantity) <= available)
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  function setValue(key, value) { setForm((previous) => ({ ...previous, [key]: value })) }
  async function submit(event) {
    event.preventDefault()
    if (!valid) return
    try {
      await onSave({ id: transactionId.current, date: form.date, assetId: asset.id, assetName: asset.assetName, renter: form.renter, customerType: form.customerType, startDate: form.startDate, endDate: form.endDate, quantity: Number(form.quantity), rentalIncome, maintenanceCost: Number(form.maintenanceCost) || 0, status: form.status, notes: form.notes })
      setSubmissionUncertain(false)
    } catch (error) {
      if (error.uncertain) setSubmissionUncertain(true)
      else transactionId.current = createTransactionId('SW')
      setMessage(error.message || 'Status transaksi sewa belum dapat dipastikan.')
    }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}><div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah transaksi sewa' : 'Tambah transaksi sewa'}</h2><p className="mt-1 text-xs text-[#8c978d]">Stok dihitung untuk rentang tanggal yang dipilih.</p></div><button type="button" onClick={onClose} disabled={busy} className="rounded p-1.5 disabled:opacity-50" aria-label="Tutup"><X size={18} /></button></div>
    {message && <p role="alert" className="mb-3 rounded border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2 text-xs font-semibold text-[#b5122a]">{message}</p>}
    <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <fieldset disabled={busy || submissionUncertain} className="contents">
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal transaksi</span><input type="date" value={form.date} onChange={(event) => setValue('date', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Status</span><select value={form.status} onChange={(event) => setValue('status', event.target.value)} className={inputClass}><option>Berjalan</option><option>Selesai</option><option>Dibatalkan</option></select></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Pilih alat</span><select required value={form.assetId} onChange={(event) => setValue('assetId', event.target.value)} className={inputClass}><option value="">Pilih inventaris</option>{assets.map((item) => <option key={item.id} value={item.id}>{item.assetName} · Semeton {currency(item.rentalRateSemeton || item.rentalRate)} / luar {currency(item.rentalRateLuar || item.rentalRate)} · stok {availableFor(item)}</option>)}</select></label>
      {asset && <div className="flex items-center gap-3 rounded-md border border-[#e6e7dd] bg-white p-3 sm:col-span-2">{asset.photoUrl && <img src={asset.photoUrl} alt={asset.assetName} className="h-12 w-14 rounded object-cover" />}<div className="text-[11px] text-[#68776b]"><b>{asset.assetName}</b><div>Dimiliki {asset.quantity} · tersedia {available} · {asset.condition}</div><div>Semeton {currency(asset.rentalRateSemeton || asset.rentalRate)} · luar {currency(asset.rentalRateLuar || asset.rentalRate)} / item / hari</div></div></div>}
      <label><span className="mb-1.5 block text-[11px] font-semibold">Jenis penyewa</span><select value={form.customerType} onChange={(event) => setValue('customerType', event.target.value)} className={inputClass}><option value="Semeton">Semeton</option><option value="Luar">Orang luar</option></select></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal mulai</span><input type="date" value={form.startDate} onChange={(event) => setValue('startDate', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal selesai</span><input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setValue('endDate', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Nama penyewa</span><input required value={form.renter} onChange={(event) => setValue('renter', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Jumlah disewa</span><input type="number" min="1" max={available} value={form.quantity} onChange={(event) => setValue('quantity', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tarif {form.customerType === 'Semeton' ? 'Semeton' : 'orang luar'} / hari</span><input readOnly value={rentalRate} className={`${inputClass} bg-[#f5f6f1]`} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Total pemasukan sewa</span><input readOnly value={rentalIncome} className={`${inputClass} bg-[#f5f6f1]`} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Biaya perawatan</span><input type="number" min="0" value={form.maintenanceCost} onChange={(event) => setValue('maintenanceCost', event.target.value)} className={inputClass} /></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Catatan</span><textarea rows="3" value={form.notes} onChange={(event) => setValue('notes', event.target.value)} className={inputClass} /></label>
      </fieldset>
      {!valid && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Pilih alat dan tanggal yang valid, serta jumlah sewa tidak melebihi stok tersedia.</p>}
      <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button disabled={!valid || busy} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : submissionUncertain ? 'Coba konfirmasi transaksi' : 'Simpan transaksi'}</button></div>
    </form>
  </div></div>
}

function ActivityMediaModal({ editing, busy, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    title: editing?.title || '',
    description: editing?.description || '',
    mediaType: editing?.mediaType || 'photo',
    youtubeUrl: editing?.youtubeUrl || '',
    eventDate: editing?.eventDate || today,
    visibility: editing?.visibility || 'Publik',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [submissionUncertain, setSubmissionUncertain] = useState(false)
  const [message, setMessage] = useState('')
  const transactionId = useRef(editing?.id || createTransactionId('KM'))
  const hasPhoto = Boolean(photoFile || editing?.photoUrl)
  const validYoutube = Boolean(youtubeEmbedUrl(form.youtubeUrl))
  const valid = Boolean(form.title.trim() && form.eventDate) && (form.mediaType === 'photo' ? hasPhoto : validYoutube)
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  function setValue(key, value) { setForm((previous) => ({ ...previous, [key]: value })) }
  async function submit(event) {
    event.preventDefault()
    if (!valid) return
    try { await onSave({ ...form, id: transactionId.current, title: form.title.trim(), photoFile, photoUrl: editing?.photoUrl || '' }) }
    catch (error) {
      if (error.uncertain) setSubmissionUncertain(true)
      setMessage(error.message || 'Status dokumentasi belum dapat dipastikan.')
    }
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#151515]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}><div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-white p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah dokumentasi' : 'Tambah dokumentasi kegiatan'}</h2><p className="mt-1 text-xs text-[#888]">Foto tersimpan di Drive; video ditampilkan dari YouTube.</p></div><button type="button" onClick={onClose} disabled={busy} className="rounded p-1.5 disabled:opacity-50" aria-label="Tutup"><X size={18} /></button></div>
    {message && <p role="alert" className="mb-3 rounded border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2 text-xs font-semibold text-[#b5122a]">{message}</p>}
    <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <fieldset disabled={busy || submissionUncertain} className="contents">
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Judul kegiatan</span><input required value={form.title} onChange={(event) => setValue('title', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal kegiatan</span><input type="date" required value={form.eventDate} onChange={(event) => setValue('eventDate', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Jenis media</span><select value={form.mediaType} onChange={(event) => setValue('mediaType', event.target.value)} className={inputClass}><option value="photo">Foto kegiatan</option><option value="youtube">Video YouTube</option></select></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Keterangan</span><textarea rows="4" value={form.description} onChange={(event) => setValue('description', event.target.value)} className={`${inputClass} resize-y`} /></label>
      {form.mediaType === 'photo' ? <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Foto kegiatan {editing?.photoUrl && <span className="font-normal text-[#777]">(unggah baru untuk mengganti)</span>}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPhotoFile(event.target.files?.[0] || null)} className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-[#fff1f2] file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:text-[#b5122a]`} /><span className="mt-1 block text-[10px] text-[#888]">JPG, PNG, WEBP, GIF · maks. 5 MB · Folder Drive: Foto Kegiatan</span></label> : <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">URL video YouTube</span><input type="url" required placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={(event) => setValue('youtubeUrl', event.target.value)} className={inputClass} /></label>}
      <label><span className="mb-1.5 block text-[11px] font-semibold">Publikasi</span><select value={form.visibility} onChange={(event) => setValue('visibility', event.target.value)} className={inputClass}><option>Publik</option><option>Draft</option></select></label>
      <p className="self-center text-[10px] text-[#777]">{form.visibility === 'Publik' ? 'Tampil di galeri publik.' : 'Hanya dapat dilihat pengelola.'}</p>
      {!valid && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Lengkapi judul/tanggal dan pilih foto atau URL YouTube yang valid.</p>}
      </fieldset>
      <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button disabled={!valid || busy} className="rounded-md bg-[#b5122a] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Mengirim...' : submissionUncertain ? 'Coba konfirmasi dokumentasi' : 'Simpan dokumentasi'}</button></div>
    </form>
  </div></div>
}

function NotulensiModal({ contacts, editing, busy, onClose, onSave }) {
  const formRef = useRef(null)
  const [shareMode, setShareMode] = useState('group')
  const [contactId, setContactId] = useState('')
  const [submissionUncertain, setSubmissionUncertain] = useState(false)
  const [message, setMessage] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  function share() {
    const values = Object.fromEntries(new FormData(formRef.current).entries())
    const text = [`NOTULENSI: ${values.title || ''}`, `Tanggal: ${readableDate(values.date || today)}`, `Peserta: ${values.attendees || '-'}`, '', values.minutes || '', '', `Tindak lanjut: ${values.followUp || '-'}`].join('\n')
    const contact = contacts.find((item) => String(item.id) === String(contactId))
    let phone = shareMode === 'personal' ? String(contact?.phone || '').replace(/\D/g, '') : ''
    if (phone.startsWith('0')) phone = `62${phone.slice(1)}`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    try {
      await onSave(event)
      setSubmissionUncertain(false)
    } catch (error) {
      if (error.uncertain) setSubmissionUncertain(true)
      else {
        delete form.dataset.requestId
        delete form.dataset.requestPayload
      }
      setMessage(error.message || 'Status penyimpanan notulensi belum dapat dipastikan.')
    }
  }
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}><div className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah notulensi' : 'Tambah notulensi'}</h2><p className="mt-1 text-xs text-[#8c978d]">Simpan catatan atau buka WhatsApp dengan pesan siap dibagikan.</p></div><button type="button" onClick={onClose} disabled={busy} className="rounded p-1.5 disabled:opacity-50" aria-label="Tutup"><X size={18} /></button></div>
    {message && <p role="alert" className="mb-3 rounded border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2 text-xs font-semibold text-[#b5122a]">{message}</p>}
    <form ref={formRef} onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <fieldset disabled={busy || submissionUncertain} className="contents">
      {[['date', 'Tanggal rapat', 'date'], ['title', 'Agenda / judul', 'text'], ['attendees', 'Peserta', 'text'], ['minutes', 'Catatan dan keputusan', 'textarea'], ['followUp', 'Tindak lanjut', 'textarea']].map(([key, label, type]) => <label key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-[11px] font-semibold">{label}</span>{type === 'textarea' ? <textarea name={key} rows="8" defaultValue={editing?.[key] || ''} className={`${inputClass} resize-y`} /> : <input name={key} type={type} required={key === 'date' || key === 'title'} defaultValue={editing?.[key] || (key === 'date' ? today : '')} className={inputClass} />}</label>)}
      <div className="rounded-md border border-[#e6e7dd] bg-white p-3 sm:col-span-2"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><MessageCircle size={15} className="text-[#b5122a]" />Bagikan melalui WhatsApp</div><div className="grid gap-2 sm:grid-cols-2"><select value={shareMode} onChange={(event) => setShareMode(event.target.value)} className={inputClass}><option value="group">Grup WhatsApp (pilih grup setelah dibuka)</option><option value="personal">WhatsApp pribadi</option></select>{shareMode === 'personal' && <select value={contactId} onChange={(event) => setContactId(event.target.value)} className={inputClass}><option value="">Pilih anggota</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.memberName} · {contact.phone}</option>)}</select>}</div></div>
      </fieldset>
      <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button type="button" onClick={share} disabled={busy || submissionUncertain || shareMode === 'personal' && !contactId} className="flex items-center gap-2 rounded-md border border-[#e1e5dc] px-3 py-2.5 text-xs font-semibold disabled:opacity-50"><MessageCircle size={14} /> Buka WhatsApp</button><button disabled={busy || submissionUncertain} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : submissionUncertain ? 'Coba konfirmasi catatan' : 'Simpan catatan'}</button></div>
    </form>
  </div></div>
}

function MasterBalanceModal({ members, showRefundDebt = true, busy, onClose, onSave }) {
  const [form, setForm] = useState({ memberId: '', arrears: '', refundDebt: '', reason: '' })
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'

  function chooseMember(memberId) {
    const member = members.find((item) => String(item.ID) === String(memberId))
    setForm((previous) => ({
      ...previous,
      memberId,
      arrears: member ? String(Number(member.Sisa_Hutang_Iuran) || 0) : '',
      refundDebt: member ? String(Number(member.Sisa_Hutang_Kembalian) || 0) : '',
    }))
  }

  function submit(event) {
    event.preventDefault()
    onSave({
      memberId: form.memberId,
      arrears: Number(form.arrears),
      ...(showRefundDebt ? { refundDebt: Number(form.refundDebt) } : {}),
      reason: form.reason.trim(),
    })
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="w-full max-w-[520px] rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">Koreksi saldo master anggota</h2><p className="mt-1 text-xs leading-5 text-[#8c978d]">Perubahan tidak membuat transaksi iuran. Nilai dan alasan koreksi dicatat di audit.</p></div><button type="button" onClick={onClose} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9]" aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Anggota</span><select required value={form.memberId} onChange={(event) => chooseMember(event.target.value)} className={inputClass}><option value="">{members.length ? 'Pilih anggota' : 'Master anggota belum tersedia'}</option>{members.map((member) => <option key={member.ID} value={member.ID}>{member.Nama} · {member.ID}</option>)}</select></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Sisa hutang iuran</span><input required type="number" min="0" step="1" value={form.arrears} onChange={(event) => setForm((previous) => ({ ...previous, arrears: event.target.value }))} className={inputClass} /></label>
        {showRefundDebt && <label><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Sisa hutang kembalian</span><input required type="number" min="0" step="1" value={form.refundDebt} onChange={(event) => setForm((previous) => ({ ...previous, refundDebt: event.target.value }))} className={inputClass} /></label>}
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Alasan koreksi</span><textarea required rows="3" value={form.reason} onChange={(event) => setForm((previous) => ({ ...previous, reason: event.target.value }))} className={inputClass} /></label>
        <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold text-[#68776b] disabled:opacity-50">Batal</button><button disabled={busy || !form.memberId || !form.reason.trim()} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : 'Simpan koreksi'}</button></div>
      </form>
    </div>
  </div>
}

function OpeningBalanceModal({ balances, busy, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const configured = Object.values(balances).some((balance) => balance.configured)
  const [form, setForm] = useState(() => ({
    date: Object.values(balances).find((balance) => balance.configured)?.date || today,
    notes: Object.values(balances).find((balance) => balance.configured)?.notes || 'Saldo kas hasil pembayaran sebelum aplikasi digunakan.',
    balances: Object.fromEntries(Object.keys(openingBalanceDefaults).map((module) => [module, String(balances[module]?.configured ? balances[module].amount : openingBalanceDefaults[module])])),
  }))
  const total = Object.values(form.balances).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'

  function submit(event) {
    event.preventDefault()
    onSave({
      date: form.date,
      notes: form.notes.trim(),
      balances: Object.fromEntries(Object.entries(form.balances).map(([module, amount]) => [module, Number(amount)])),
    })
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="w-full max-w-[520px] rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{configured ? 'Ubah saldo awal kas' : 'Catat saldo awal kas'}</h2><p className="mt-1 text-xs leading-5 text-[#8c978d]">Masukkan kas dari pembayaran sebelum aplikasi digunakan. Tidak mengubah tunggakan anggota.</p></div><button type="button" onClick={onClose} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9]" aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Tanggal saldo awal</span><input required type="date" value={form.date} onChange={(event) => setForm((previous) => ({ ...previous, date: event.target.value }))} className={inputClass} /></label>
        {Object.entries({ iuran: 'Kas Iuran', sukaduka: 'Kas Sukaduka', sesari: 'Kas Sesari' }).map(([module, label]) => <label key={module}><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">{label}</span><input required type="number" min="0" step="1" value={form.balances[module]} onChange={(event) => setForm((previous) => ({ ...previous, balances: { ...previous.balances, [module]: event.target.value } }))} className={inputClass} /></label>)}
        <div className="rounded-md bg-[#f3f5ef] px-3 py-2.5 sm:col-span-2"><p className="text-[10px] text-[#849084]">Total saldo awal</p><p className="mt-1 text-sm font-bold text-[#355d3f]">{currency(total)}</p></div>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Keterangan sumber saldo</span><textarea required rows="2" value={form.notes} onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))} className={inputClass} /></label>
        <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold text-[#68776b] disabled:opacity-50">Batal</button><button disabled={busy} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : 'Simpan saldo awal'}</button></div>
      </form>
    </div>
  </div>
}

function SukadukaBalanceModal({ members, busy, onClose, onSave }) {
  const [form, setForm] = useState({ memberId: '', sukadukaArrears: '', reason: '' })
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'

  function chooseMember(memberId) {
    const member = members.find((item) => String(item.ID) === String(memberId))
    setForm((previous) => ({
      ...previous,
      memberId,
      sukadukaArrears: member ? String(Number(member.Sisa_Hutang_Sukaduka) || 0) : '',
    }))
  }

  function submit(event) {
    event.preventDefault()
    onSave({
      memberId: form.memberId,
      sukadukaArrears: Number(form.sukadukaArrears),
      reason: form.reason.trim(),
    })
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="w-full max-w-[520px] rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">Edit saldo tunggakan Sukaduka</h2><p className="mt-1 text-xs leading-5 text-[#8c978d]">Koreksi langsung saldo tunggakan Sukaduka per anggota. Data dan alasan koreksi dicatat di audit.</p></div><button type="button" onClick={onClose} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9]" aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Anggota</span><select required value={form.memberId} onChange={(event) => chooseMember(event.target.value)} className={inputClass}><option value="">{members.length ? 'Pilih anggota' : 'Master anggota belum tersedia'}</option>{members.map((member) => <option key={member.ID} value={member.ID}>{member.Nama} · {member.ID}</option>)}</select></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Saldo tunggakan Sukaduka</span><input required type="number" min="0" step="1" value={form.sukadukaArrears} onChange={(event) => setForm((previous) => ({ ...previous, sukadukaArrears: event.target.value }))} className={inputClass} /></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Alasan koreksi</span><textarea required rows="3" value={form.reason} onChange={(event) => setForm((previous) => ({ ...previous, reason: event.target.value }))} className={inputClass} /></label>
        <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold text-[#68776b] disabled:opacity-50">Batal</button><button disabled={busy || !form.memberId || !form.reason.trim()} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'Menyimpan...' : 'Simpan saldo'}</button></div>
      </form>
    </div>
  </div>
}

function IuranModal({ members, editing, busy, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: editing?.date || today,
    periodId: editing?.periodId || today.slice(0, 7),
    memberId: editing?.memberId || '',
    allocatedContribution: Number(editing?.allocatedContribution || 0),
    cashPhysical: Number(editing?.cashPhysical || 0),
    changePaid: Number(editing?.changePaid || 0),
    notes: editing?.notes || '',
  })
  const [message, setMessage] = useState('')
  const [submissionUncertain, setSubmissionUncertain] = useState(false)
  const transactionId = useRef(editing?.id || createTransactionId('IU'))
  const pendingRecord = useRef(null)
  const selectedMember = members.find((member) => String(member.ID) === String(form.memberId))
  const target = editing
    ? Number(selectedMember?.Sisa_Hutang_Iuran || 0) + Number(editing.allocatedContribution || 0)
    : Number(selectedMember?.Sisa_Hutang_Iuran || 0)
  const openingRefundDebt = Math.max(0, Number(selectedMember?.Sisa_Hutang_Kembalian || 0) - Number(editing?.refundDebtAdded || 0))
  const allocation = Number(form.allocatedContribution) || 0
  const cashReceived = Number(form.cashPhysical) || 0
  const changeDue = Math.max(0, cashReceived - allocation)
  const changePaid = Number(form.changePaid) || 0
  const refundDebt = Math.max(0, openingRefundDebt + changeDue - changePaid)
  const refundDebtAdded = refundDebt - openingRefundDebt
  const arrears = Math.max(0, target - allocation)
  const valid = Boolean(selectedMember) && cashReceived >= allocation && changePaid <= openingRefundDebt + changeDue

  function update(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!valid) return
    try {
      const record = pendingRecord.current || {
      id: transactionId.current,
      date: form.date,
      periodId: form.periodId,
      memberId: selectedMember.ID,
      memberName: selectedMember.Nama,
      target,
      allocatedContribution: allocation,
      cashPhysical: cashReceived,
      changeDue,
      changePaid,
      openingArrears: target,
      arrears,
      openingRefundDebt,
      refundDebtAdded,
      refundDebt,
      notes: form.notes,
      }
      pendingRecord.current = record
      await onSave(record)
      pendingRecord.current = null
      setSubmissionUncertain(false)
    } catch (error) {
      if (error.uncertain) setSubmissionUncertain(true)
      else {
        pendingRecord.current = null
        transactionId.current = createTransactionId('IU')
      }
      setMessage(error.message || 'Status transaksi belum dapat dipastikan.')
    }
  }

  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  const readOnlyClass = `${inputClass} bg-[#f5f6f1] font-semibold text-[#809080]`

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah transaksi iuran' : 'Catat pembayaran iuran'}</h2><p className="mt-1 text-xs text-[#8c978d]">Saldo anggota diperbarui setelah transaksi disimpan.</p></div><button type="button" onClick={onClose} disabled={busy} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9] disabled:opacity-50" aria-label="Tutup"><X size={18} /></button></div>
      {message && <p role="alert" className="mb-3 rounded border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2 text-xs font-semibold text-[#b5122a]">{message}</p>}
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <fieldset disabled={busy || submissionUncertain} className="contents">
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Tanggal transaksi</span><input type="date" required value={form.date} onChange={(event) => update('date', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Periode</span><input type="month" required value={form.periodId} onChange={(event) => update('periodId', event.target.value)} className={inputClass} /></label>
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Nama anggota</span><select required value={form.memberId} onChange={(event) => setForm((previous) => ({ ...previous, memberId: event.target.value, allocatedContribution: 0, cashPhysical: 0, changePaid: 0 }))} disabled={!members.length || Boolean(editing)} className={inputClass}><option value="" disabled>{members.length ? 'Pilih anggota dari master' : 'Data MASTER_ANGGOTA belum tersedia'}</option>{members.map((member) => <option key={member.ID} value={member.ID}>{member.Nama}</option>)}</select></label>
        {selectedMember && <div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] px-3 py-2.5 text-[10px] text-[#788579] sm:col-span-2">Hutang kembalian sebelumnya: <b>{currency(selectedMember.Sisa_Hutang_Kembalian)}</b></div>}
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Tunggakan sebelum setor</span><input readOnly value={target} className={readOnlyClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Setoran iuran</span><input type="number" min="0" step="1" required value={form.allocatedContribution} onChange={(event) => update('allocatedContribution', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Uang fisik diterima</span><input type="number" min={allocation} step="1" required value={form.cashPhysical} onChange={(event) => update('cashPhysical', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Kembalian seharusnya</span><input readOnly value={changeDue} className={readOnlyClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Kembalian diberikan</span><input type="number" min="0" max={openingRefundDebt + changeDue} step="1" required value={form.changePaid} onChange={(event) => update('changePaid', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Sisa hutang kembalian</span><input readOnly value={openingRefundDebt + refundDebtAdded} className={readOnlyClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Sisa hutang iuran (akhir)</span><input readOnly value={arrears} className={readOnlyClass} /></label>
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Catatan</span><input value={form.notes} onChange={(event) => update('notes', event.target.value)} className={inputClass} /></label>
        </fieldset>
        {!valid && selectedMember && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Pastikan uang fisik mencukupi setoran serta kembalian yang diberikan.</p>}
        <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold text-[#68776b] hover:bg-[#f7f8f4] disabled:opacity-50">{submissionUncertain ? 'Tutup & cek data' : 'Batal'}</button><button disabled={!valid || busy} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#294d33] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Menyimpan...' : submissionUncertain ? 'Coba konfirmasi transaksi' : editing ? 'Simpan perubahan' : 'Simpan transaksi'}</button></div>
      </form>
    </div>
  </div>
}

function LoginModal({ login, setLogin, busy, onClose, onSubmit, demo }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16392c]/40 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="w-full max-w-[420px] rounded-md border border-[#e6e7dd] bg-[#fffefa] p-6 shadow-xl sm:p-7">
    <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><img src={logo} className="h-11 w-11 object-contain" alt="Logo TAKORA" /><div><h2 className="font-display text-base font-extrabold">Akses organisasi</h2><p className="mt-0.5 text-[11px] text-[#89958a]">Masuk ke ruang kerja TAKORA</p></div></div><button onClick={onClose} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9]" aria-label="Tutup"><X size={17} /></button></div>
    <form onSubmit={onSubmit} className="space-y-3.5"><label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Username</span><input required={!demo} autoComplete="username" value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]" placeholder={demo ? 'Nama pengguna (opsional)' : 'Username'} /></label>
      {demo ? <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Simulasikan peran</span><select value={login.role} onChange={(event) => setLogin({ ...login, role: event.target.value })} className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]">{Object.entries(roleNames).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label> : <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Kata sandi</span><input required type="password" autoComplete="current-password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]" /></label>}
      {demo && <p className="rounded bg-[#f3f4ed] px-3 py-2 text-[10px] leading-4 text-[#788579]">Mode demo: pilih peran untuk mencoba batas akses. Akun produksi dibuat melalui Google Apps Script.</p>}
      <button disabled={busy} className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#294d33] disabled:cursor-wait disabled:opacity-50">{busy ? 'Memproses...' : 'Masuk'} <ArrowUpRight size={14} /></button>
    </form>
  </div></div>
}

function Reports({ rows, summary, role, onApprove }) {
  const demoIncome = [rows.sesari, rows.sukaduka, rows.piodalan].flat().filter((row) => row.direction === 'Masuk' && row.category !== 'Punia barang').reduce((total, row) => total + Number(row.amount || 0), 0) + (rows.punia || []).filter((row) => row.donationType === 'Uang Tunai').reduce((total, row) => total + Number(row.amount || 0), 0) + (rows.iuran || []).reduce((total, row) => total + Math.max(0, Number(row.cashPhysical || 0) - Number(row.changeDue || 0)), 0) + (rows.sewa || []).reduce((total, row) => total + Number(row.rentalIncome || 0), 0)
  const demoExpense = [rows.sesari, rows.sukaduka, rows.piodalan].flat().filter((row) => row.direction === 'Keluar' && row.category !== 'Punia barang').reduce((total, row) => total + Number(row.amount || 0), 0) + (rows.sewa || []).reduce((total, row) => total + Number(row.maintenanceCost || 0), 0)
  const totalIncome = summary?.totals?.income ?? demoIncome
  const totalExpense = summary?.totals?.expenses ?? demoExpense
  return <div className="animate-rise print-report"><PrintLetterhead title="Laporan keuangan" detail={`Periode berjalan · ${new Date().toLocaleDateString('id-ID')}`} /><div className="mb-5 no-print"><p className="text-xs text-[#849084]">Ringkasan gabungan berdasarkan transaksi modul keuangan.</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4"><p className="text-xs text-[#849084]">Total penerimaan tercatat</p><p className="font-display mt-3 text-xl font-extrabold text-[#426a49]">{currency(totalIncome)}</p></div><div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4"><p className="text-xs text-[#849084]">Total pengeluaran tercatat</p><p className="font-display mt-3 text-xl font-extrabold text-[#a36e3f]">{currency(totalExpense)}</p></div><div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4"><p className="text-xs text-[#849084]">Saldo bersih tercatat</p><p className="font-display mt-3 text-xl font-extrabold text-[#314b38]">{currency(totalIncome - totalExpense)}</p></div></div><div className="mt-5 rounded-md border border-[#e6e7dd] bg-[#fffefa] p-5"><h2 className="font-display text-sm font-extrabold">Persetujuan laporan akhir</h2><p className="mt-2 max-w-xl text-xs leading-5 text-[#849084]">Ketua dapat menyetujui laporan periode berjalan setelah meninjau ringkasan kas. Data sensitif anggota tidak ditampilkan di dashboard publik.</p><div className="mt-4 flex flex-wrap gap-2 no-print"><button onClick={() => window.print()} className="rounded-md border border-[#dfe4d9] px-3 py-2 text-xs font-semibold text-[#506854] hover:bg-[#f6f7f2]">Cetak / simpan PDF</button>{['Admin', 'Ketua'].includes(role) && <button onClick={onApprove} className="flex items-center gap-2 rounded-md bg-[#355d3f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#294d33]"><Check size={14} /> Setujui laporan bulan ini</button>}</div></div><PrintSignatures /></div>
}

export default App
