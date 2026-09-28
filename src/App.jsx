import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownLeft, ArrowUpRight, Boxes, CalendarDays, ChartNoAxesCombined, Eye, EyeOff,
  Check, ChevronDown, CircleDollarSign, ClipboardList, FileText, HandCoins,
  HeartHandshake, Landmark, LayoutDashboard, LogOut, Menu, Package, Plus,
  Search, Settings2, ShieldCheck, Sparkles, Trash2, TrendingUp, Users, Wallet,
  X, Pencil, Camera, BookOpenCheck, MessageCircle, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import logo from '../logo takora.png'
import { isDemo, request, uploadPhoto } from './api.js'

const roleNames = { Admin: 'Administrator', Ketua: 'Ketua', Bendahara: 'Bendahara', Sekretaris: 'Sekretaris', Publik: 'Anggota / Publik' }
const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'UTAMA' },
  { id: 'iuran', label: 'Iuran anggota', icon: CircleDollarSign, group: 'KEUANGAN' },
  { id: 'sesari', label: 'Sesari', icon: HandCoins, group: 'KEUANGAN' },
  { id: 'sukaduka', label: 'Sukaduka', icon: HeartHandshake, group: 'KEUANGAN' },
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
  Admin: ['dashboard', 'iuran', 'sesari', 'sukaduka', 'punia', 'piodalan', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan', 'laporan', 'users'],
  Ketua: ['dashboard', 'iuran', 'sesari', 'sukaduka', 'punia', 'piodalan', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan', 'laporan'],
  Bendahara: ['dashboard', 'iuran', 'sesari', 'sukaduka', 'punia', 'piodalan', 'kegiatan', 'laporan'],
  Sekretaris: ['dashboard', 'aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan', 'laporan'],
  Publik: ['dashboard', 'kegiatan'],
}
const modules = {
  iuran: { title: 'Iuran anggota', desc: 'Rekap pembayaran berulang, tunggakan per periode, dan kewajiban kembalian.', api: 'TRANSAKSI_IURAN', fields: [], columns: [['date', 'Tanggal'], ['memberName', 'Anggota'], ['periodId', 'Periode'], ['target', 'Target'], ['allocatedContribution', 'Uang untuk iuran'], ['cashPhysical', 'Uang diterima'], ['changeDue', 'Kembalian'], ['changePaid', 'Dibayarkan'], ['arrears', 'Sisa iuran saat itu'], ['refundDebt', 'Sisa kembalian'], ['currentArrears', 'Hutang iuran kini'], ['currentRefundDebt', 'Hutang kembalian kini']] },
  sesari: { title: 'Sesari', desc: 'Arus dana sesari persembahyangan.', api: 'Sesari', fields: [['date', 'Tanggal transaksi', 'date'], ['direction', 'Arus kas', 'select:Masuk|Keluar'], ['category', 'Sumber / kategori', 'text'], ['amount', 'Nominal', 'number'], ['description', 'Keterangan', 'text']], columns: [['date', 'Tanggal'], ['direction', 'Arus'], ['category', 'Kategori'], ['description', 'Keterangan'], ['amount', 'Nominal']] },
  sukaduka: { title: 'Sukaduka', desc: 'Penerimaan per anggota dengan pencatatan kembalian atau pengeluaran sosial.', api: 'Sukaduka', fields: [], columns: [['date', 'Tanggal'], ['direction', 'Arus'], ['memberName', 'Anggota'], ['recipient', 'Penerima / penyetor'], ['purpose', 'Peruntukan'], ['amount', 'Uang untuk sukaduka'], ['cashPhysical', 'Uang fisik'], ['changeDue', 'Kembalian'], ['changePaid', 'Dibayarkan'], ['refundDebt', 'Hutang kembalian'], ['proofPhotoUrl', 'Bukti']] },
  punia: { title: 'Dana punia', desc: 'Donasi uang tunai dan barang inventaris.', api: 'Punia', fields: [['date', 'Tanggal transaksi', 'date'], ['donor', 'Nama pemberi', 'text'], ['donationType', 'Jenis punia', 'select:Uang Tunai|Barang'], ['itemName', 'Nama barang (jika barang)', 'text'], ['amount', 'Nominal / nilai barang', 'number'], ['notes', 'Catatan', 'text']], columns: [['date', 'Tanggal'], ['donor', 'Pemberi'], ['donationType', 'Jenis'], ['itemName', 'Barang'], ['amount', 'Nilai'], ['notes', 'Catatan']] },
  piodalan: { title: 'Kas piodalan', desc: 'Buku kas khusus kepanitiaan piodalan.', api: 'Piodalan', fields: [['date', 'Tanggal transaksi', 'date'], ['eventName', 'Nama piodalan', 'text'], ['category', 'Jenis transaksi', 'select:Saldo awal|Punia uang|Punia barang|Belanja|Sesari piodalan'], ['itemName', 'Nama barang (punia barang)', 'text'], ['quantity', 'Jumlah barang', 'number'], ['direction', 'Arus kas', 'select:Masuk|Keluar'], ['amount', 'Nominal kas / nilai barang', 'number'], ['description', 'Keterangan', 'text']], columns: [['date', 'Tanggal'], ['eventName', 'Piodalan'], ['category', 'Kategori'], ['itemName', 'Barang'], ['quantity', 'Jumlah'], ['direction', 'Arus'], ['description', 'Keterangan'], ['amount', 'Nominal']] },
  aset: { title: 'Aset & sewa alat', desc: 'Daftar alat, jumlah, harga beli, tarif sewa, foto, dan kondisi.', api: 'Aset', fields: [['assetName', 'Nama barang', 'text'], ['category', 'Kategori', 'text'], ['quantity', 'Jumlah item dimiliki', 'number'], ['condition', 'Kondisi', 'select:Baik|Perlu perawatan|Rusak'], ['purchasePrice', 'Harga saat beli / item', 'number'], ['rentalRate', 'Harga sewa / item / hari', 'number'], ['photoFile', 'Foto barang', 'file'], ['photoUrl', 'URL foto (otomatis)', 'text'], ['notes', 'Catatan', 'text']], columns: [['assetName', 'Nama barang'], ['category', 'Kategori'], ['quantity', 'Jumlah'], ['available', 'Tersedia kini'], ['purchasePrice', 'Harga beli'], ['rentalRate', 'Sewa / hari'], ['condition', 'Kondisi'], ['photoUrl', 'Foto']] },
  sewa: { title: 'Transaksi sewa aset', desc: 'Pilih alat berdasarkan stok tersedia dan rentang tanggal sewa.', api: 'SewaAset', fields: [], columns: [['date', 'Tanggal'], ['assetName', 'Barang'], ['renter', 'Penyewa'], ['startDate', 'Mulai'], ['endDate', 'Selesai'], ['quantity', 'Jumlah'], ['rentalIncome', 'Pemasukan'], ['maintenanceCost', 'Perawatan'], ['status', 'Status']] },
  inventaris: { title: 'Log inventaris', desc: 'Riwayat barang masuk dan keluar dari inventaris.', api: 'InventarisLog', fields: [['date', 'Tanggal transaksi', 'date'], ['assetId', 'ID aset', 'text'], ['assetName', 'Nama barang', 'text'], ['movement', 'Pergerakan', 'select:Masuk|Keluar'], ['quantity', 'Jumlah', 'number'], ['condition', 'Kondisi', 'select:Baik|Perlu perawatan|Rusak'], ['notes', 'Catatan', 'text']], columns: [['date', 'Tanggal'], ['assetName', 'Barang'], ['movement', 'Pergerakan'], ['quantity', 'Jumlah'], ['condition', 'Kondisi'], ['notes', 'Catatan']] },
  anggota: { title: 'Manajemen anggota', desc: 'Data keanggotaan organisasi.', api: 'Anggota', fields: [['memberName', 'Nama lengkap', 'text'], ['memberNo', 'Nomor anggota', 'text'], ['phone', 'Nomor telepon', 'text'], ['address', 'Alamat', 'text'], ['status', 'Status', 'select:Aktif|Nonaktif']], columns: [['memberNo', 'Nomor'], ['memberName', 'Nama anggota'], ['phone', 'Telepon'], ['address', 'Alamat'], ['status', 'Status']] },
  notulensi: { title: 'Notulensi', desc: 'Arsip keputusan rapat dengan pesan yang dapat dibagikan ke WhatsApp.', api: 'Notulensi', fields: [['date', 'Tanggal rapat', 'date'], ['title', 'Agenda / judul', 'text'], ['attendees', 'Peserta', 'text'], ['minutes', 'Catatan dan keputusan', 'textarea'], ['followUp', 'Tindak lanjut', 'textarea']], columns: [['date', 'Tanggal'], ['title', 'Agenda'], ['attendees', 'Peserta'], ['minutes', 'Catatan'], ['followUp', 'Tindak lanjut']] },
  kegiatan: { title: 'Galeri kegiatan', desc: 'Dokumentasi foto dan video kegiatan organisasi.', api: 'KegiatanMedia', fields: [], columns: [] },
  users: { title: 'Pengguna & akses', desc: 'Kelola akun dan peran akses sistem.', api: 'Users', fields: [['name', 'Nama', 'text'], ['username', 'Username', 'text'], ['password', 'Kata sandi (min. 12 karakter)', 'password'], ['role', 'Peran', 'select:Admin|Ketua|Bendahara|Sekretaris|Publik'], ['status', 'Status akun', 'select:Aktif|Nonaktif']], columns: [['name', 'Nama'], ['username', 'Username'], ['role', 'Peran'], ['status', 'Status']] },
  laporan: { title: 'Laporan keuangan', desc: 'Rangkuman kas, transaksi, dan transparansi organisasi.', api: 'all', fields: [], columns: [] },
}
const initialRows = {
  iuran: [
    { id: 'IU-104', date: '2026-09-28', periodId: '2026-09', memberId: 'AG-026', memberName: 'I Made Sudarma', target: 50000, allocatedContribution: 50000, cashPhysical: 50000, changeDue: 0, changePaid: 0, arrears: 0, refundDebtAdded: 0, refundDebt: 0 },
    { id: 'IU-103', date: '2026-09-27', periodId: '2026-09', memberId: 'AG-025', memberName: 'Ni Luh Sari', target: 100000, allocatedContribution: 50000, cashPhysical: 100000, changeDue: 50000, changePaid: 30000, arrears: 50000, refundDebtAdded: 20000, refundDebt: 20000 },
    { id: 'IU-102', date: '2026-09-25', periodId: '2026-09', memberId: 'AG-024', memberName: 'I Ketut Sutama', target: 50000, allocatedContribution: 30000, cashPhysical: 30000, changeDue: 0, changePaid: 0, arrears: 20000, refundDebtAdded: 0, refundDebt: 0 },
    { id: 'IU-101', date: '2026-08-28', periodId: '2026-08', memberId: 'AG-025', memberName: 'Ni Luh Sari', target: 50000, allocatedContribution: 0, cashPhysical: 0, changeDue: 0, changePaid: 0, arrears: 50000, refundDebtAdded: 0, refundDebt: 0 },
  ],
  sesari: [
    { id: 'SE-038', date: '2026-09-28', direction: 'Masuk', category: 'Persembahyangan', description: 'Sesari purnama', amount: 350000 },
    { id: 'SE-037', date: '2026-09-25', direction: 'Keluar', category: 'Canang & dupa', description: 'Kebutuhan persembahyangan', amount: 125000 },
  ],
  sukaduka: [{ id: 'SK-014', date: '2026-09-21', direction: 'Keluar', recipient: 'Keluarga I Made Raka', purpose: 'Dana belasungkawa', amount: 500000 }],
  punia: [{ id: 'PU-022', date: '2026-09-19', donor: 'Krama Tiyingtali', donationType: 'Barang', itemName: 'Kursi plastik', amount: 1200000, notes: '10 unit' }],
  piodalan: [{ id: 'PI-009', date: '2026-09-14', eventName: 'Piodalan Pura Desa', category: 'Punia uang', direction: 'Masuk', amount: 2500000, description: 'Punia krama' }],
  aset: [{ id: 'AS-005', assetName: 'Sound system', category: 'Peralatan upacara', quantity: 1, condition: 'Baik', purchasePrice: 6500000, rentalRate: 150000, notes: 'Termasuk 2 speaker' }, { id: 'AS-004', assetName: 'Kursi plastik', category: 'Perlengkapan', quantity: 80, condition: 'Baik', purchasePrice: 85000, rentalRate: 1000 }],
  sewa: [{ id: 'SW-001', date: '2026-09-28', assetId: 'AS-004', assetName: 'Kursi plastik', renter: 'Pura Desa', startDate: '2026-09-29', endDate: '2026-09-29', quantity: 20, rentalIncome: 20000, maintenanceCost: 0, status: 'Berjalan' }],
  anggota: [{ id: 'AG-026', memberNo: 'ST-026', memberName: 'I Made Sudarma', phone: '0812-3456-7890', address: 'Tiyingtali Kelod', status: 'Aktif' }, { id: 'AG-025', memberNo: 'ST-025', memberName: 'Ni Luh Sari', phone: '0813-2468-1357', address: 'Tiyingtali Kelod', status: 'Aktif' }],
  notulensi: [{ id: 'NT-003', date: '2026-09-12', title: 'Persiapan piodalan', attendees: 'Ketua, Bendahara, Sekretaris', minutes: 'Menetapkan jadwal dan pembagian tugas upacara.', followUp: 'Koordinasi perlengkapan' }],
  kegiatan: [],
  users: [{ id: 'US-004', name: 'I Made Sudarma', username: 'bendahara', role: 'Bendahara', status: 'Aktif' }],
}
const initialMasterMembers = [
  { ID: 'AG-026', Nama: 'I Made Sudarma', Sisa_Hutang_Iuran: 0, Sisa_Hutang_Kembalian: 0 },
  { ID: 'AG-025', Nama: 'Ni Luh Sari', Sisa_Hutang_Iuran: 50000, Sisa_Hutang_Kembalian: 20000 },
  { ID: 'AG-024', Nama: 'I Ketut Sutama', Sisa_Hutang_Iuran: 20000, Sisa_Hutang_Kembalian: 0 },
]
const cashBars = [
  { month: 'Apr', masuk: 3.1, keluar: 1.2 }, { month: 'Mei', masuk: 2.6, keluar: 1.7 },
  { month: 'Jun', masuk: 4.2, keluar: 2.1 }, { month: 'Jul', masuk: 3.4, keluar: 1.4 },
  { month: 'Agu', masuk: 5.1, keluar: 2.8 }, { month: 'Sep', masuk: 4.6, keluar: 1.9 },
]
const fundSlices = [{ name: 'Iuran', value: 47, color: '#b5122a' }, { name: 'Sesari', value: 31, color: '#242424' }, { name: 'Punia', value: 22, color: '#8f8f8f' }]
const demoModuleBalances = {
  iuran: { incoming: 130000, outgoing: 30000, balance: 100000, unpaid: 70000 },
  sukaduka: { incoming: 0, outgoing: 500000, balance: -500000, unpaid: 0 },
  sesari: { incoming: 350000, outgoing: 125000, balance: 225000, unpaid: 0 },
  punia: { incoming: 0, outgoing: 0, balance: 0, unpaid: 0 },
  sewa: { incoming: 20000, outgoing: 0, balance: 20000, unpaid: 0 },
  piodalan: { incoming: 2500000, outgoing: 0, balance: 2500000, unpaid: 0 },
}
const moduleLabels = { iuran: 'Iuran', sukaduka: 'Sukaduka', sesari: 'Sesari', punia: 'Punia tunai', sewa: 'Sewa alat', piodalan: 'Piodalan' }
const moduleColors = { iuran: '#b5122a', sukaduka: '#242424', sesari: '#777777', punia: '#2563eb', sewa: '#15803d', piodalan: '#eab308' }
const currency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0)
const readableDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

function App() {
  const savedSession = isDemo ? localStorage.getItem('takora-role') : localStorage.getItem('takora-token')
  const [authenticated, setAuthenticated] = useState(Boolean(savedSession))
  const [role, setRole] = useState(savedSession ? (localStorage.getItem('takora-role') || 'Bendahara') : 'Publik')
  const [token, setToken] = useState(localStorage.getItem('takora-token') || '')
  const [userName, setUserName] = useState(savedSession ? (localStorage.getItem('takora-name') || 'I Made Sudarma') : 'Anggota')
  const [active, setActive] = useState('dashboard')
  const [rows, setRows] = useState(isDemo ? initialRows : Object.fromEntries(Object.keys(initialRows).map((key) => [key, []])))
  const [masterMembers, setMasterMembers] = useState(isDemo ? initialMasterMembers : [])
  const [contacts, setContacts] = useState(isDemo ? initialRows.anggota : [])
  const [rentalAssets, setRentalAssets] = useState(isDemo ? initialRows.aset : [])
  const [rentalRows, setRentalRows] = useState(isDemo ? initialRows.sewa : [])
  const [publicActivities, setPublicActivities] = useState(isDemo ? initialRows.kegiatan : [])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('')
  const [dashboardHidden, setDashboardHidden] = useState(localStorage.getItem('takora-dashboard-hidden') === 'true')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('takora-sidebar-collapsed') === 'true')
  const [login, setLogin] = useState({ username: '', password: '', role: 'Bendahara' })

  const allowed = permission[role] || permission.Publik
  const showSidebar = authenticated && role !== 'Publik'
  const menu = navigation.filter((item) => allowed.includes(item.id))
  const writable = role === 'Admin' || (role === 'Bendahara' && ['iuran', 'sesari', 'sukaduka', 'punia', 'piodalan'].includes(active)) || (role === 'Sekretaris' && ['aset', 'sewa', 'inventaris', 'anggota', 'notulensi', 'kegiatan'].includes(active))
  const page = modules[active]
  const currentRows = rows[active] || []

  useEffect(() => {
    if (!allowed.includes(active)) setActive('dashboard')
  }, [role, active])

  useEffect(() => {
    if (!isDemo) {
      const loadSummary = token ? request('summary', {}, token) : request('publicSummary')
      loadSummary.then((result) => {
        if (result.cards) setSummary(result)
        else if (result.summary) setSummary({ monthly: result.summary.monthly, sources: result.summary.sources, modules: result.summary.modules, outstanding: result.summary.outstanding, cards: [
          { label: 'Saldo kas transparansi', value: result.summary.balance, trend: 'Saldo gabungan' },
          { label: 'Penerimaan tercatat', value: result.summary.income, trend: 'Semua modul kas' },
          { label: 'Pengeluaran tercatat', value: result.summary.expenses, trend: `${result.summary.activeMembers} anggota aktif` },
        ] })
      }).catch((error) => setNotice(error.message))
    }
  }, [token])

  useEffect(() => {
    if (isDemo) return
    request('publicGallery').then((result) => setPublicActivities(result.data || []))
      .catch((error) => setNotice(error.message))
  }, [])

  useEffect(() => {
    if (active === 'dashboard' || active === 'laporan' || active === 'kegiatan' || active === 'users' && role !== 'Admin') return
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
    if (active !== 'iuran' || isDemo || !token) return
    request('masterAnggota', {}, token)
      .then((result) => setMasterMembers(result.members || []))
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
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3500)
    return () => window.clearTimeout(timer)
  }, [notice])

  const filteredRows = useMemo(() => currentRows.filter((row) => {
    const matchesSearch = JSON.stringify(row).toLowerCase().includes(query.toLowerCase())
    const rowPeriod = String(row.periodId || row.date || '').slice(0, 7)
    return matchesSearch && (!periodFilter || rowPeriod === periodFilter)
  }), [currentRows, query, periodFilter])

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
    } catch (error) { setNotice(error.message) }
  }

  function signOut() {
    if (!isDemo && token) request('logout', {}, token).catch(() => {})
    setToken('')
    setRole('Publik')
    setAuthenticated(false)
    setUserName('Anggota')
    localStorage.removeItem('takora-token')
    localStorage.removeItem('takora-role')
    localStorage.removeItem('takora-name')
    setActive('dashboard')
  }

  async function saveRecord(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const values = Object.fromEntries(formData.entries())
    if (active === 'aset' && formData.get('photoFile')?.size) {
      try {
        const uploaded = await uploadPhoto(formData.get('photoFile'), token)
        values.photoUrl = uploaded.url
      } catch (error) { setNotice(error.message); return }
    }
    delete values.photoFile
    if (['amount', 'target', 'cashPhysical', 'changeDue', 'changePaid', 'arrears', 'refundDebt', 'quantity', 'rentalRate', 'purchasePrice', 'rentalIncome', 'maintenanceCost'].some((field) => field in values)) {
      for (const key of Object.keys(values)) if (['amount', 'target', 'cashPhysical', 'changeDue', 'changePaid', 'arrears', 'refundDebt', 'quantity', 'rentalRate', 'purchasePrice', 'rentalIncome', 'maintenanceCost'].includes(key)) values[key] = Number(values[key]) || 0
    }
    const updated = editing ? { ...editing, ...values } : { id: `${active.slice(0, 2).toUpperCase()}-${Date.now()}`, ...values }
    try {
      if (!isDemo) await request(editing ? 'update' : 'create', { module: page.api, record: updated }, token)
      setRows((previous) => ({ ...previous, [active]: editing ? (previous[active] || []).map((row) => row.id === editing.id ? updated : row) : [updated, ...(previous[active] || [])] }))
      if (active === 'aset') setRentalAssets((previous) => editing ? previous.map((row) => row.id === editing.id ? updated : row) : [updated, ...previous])
      if (active === 'sewa') setRentalRows((previous) => editing ? previous.map((row) => row.id === editing.id ? updated : row) : [updated, ...previous])
      setNotice(editing ? 'Data berhasil diperbarui.' : 'Data berhasil disimpan.')
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message) }
  }

  async function saveRental(record) {
    const updated = editing ? { ...editing, ...record } : { id: `SW-${Date.now()}`, ...record }
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
    } catch (error) { setNotice(error.message) }
  }

  async function saveActivity(record) {
    const updated = editing ? { ...editing, ...record } : { id: `KM-${Date.now()}`, ...record }
    try {
      if (record.photoFile?.size) {
        const uploaded = await uploadPhoto(record.photoFile, token, 'activities')
        updated.photoUrl = uploaded.url
      }
      delete updated.photoFile
      let savedRecord = updated
      if (!isDemo) {
        const result = await request(editing ? 'update' : 'create', { module: 'KegiatanMedia', record: updated }, token)
        savedRecord = result.record || updated
      }
      setRows((previous) => ({ ...previous, kegiatan: editing ? previous.kegiatan.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...(previous.kegiatan || [])] }))
      setNotice(editing ? 'Dokumentasi kegiatan diperbarui.' : 'Dokumentasi kegiatan dipublikasikan.')
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message) }
  }

  async function saveSukaduka(record) {
    const updated = editing ? { ...editing, ...record } : { id: `SK-${Date.now()}`, ...record }
    try {
      if (record.proofFile?.size) {
        const uploaded = await uploadPhoto(record.proofFile, token, 'sukaduka')
        updated.proofPhotoUrl = uploaded.url
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
        savedMember = {
          ID: record.memberId,
          Nama: record.memberName,
          Sisa_Hutang_Iuran: Number(previousMember?.Sisa_Hutang_Iuran || 0),
          Sisa_Hutang_Kembalian: Math.max(0, Number(previousMember?.Sisa_Hutang_Kembalian || 0) - Number(editing?.refundDebtAdded || 0)) + record.refundDebtAdded,
        }
      }
      setRows((previous) => ({ ...previous, sukaduka: editing ? previous.sukaduka.map((row) => row.id === editing.id ? savedRecord : row) : [savedRecord, ...(previous.sukaduka || [])] }))
      if (savedMember) setMasterMembers((previous) => previous.map((member) => String(member.ID) === String(savedMember.ID) ? savedMember : member))
      setNotice(editing ? 'Transaksi sukaduka diperbarui.' : 'Transaksi sukaduka disimpan.')
      setModal(false)
      setEditing(null)
    } catch (error) { setNotice(error.message) }
  }

  async function saveIuran(record) {
    const updated = editing ? { ...editing, ...record } : { id: `IU-${Date.now()}`, ...record }
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
      if (savedMember) setMasterMembers((previous) => previous.map((member) => String(member.ID) === String(savedMember.ID) ? savedMember : member))
      setNotice(editing ? 'Transaksi iuran diperbarui dan saldo anggota disinkronkan.' : 'Transaksi iuran disimpan dan saldo anggota diperbarui.')
      setModal(false)
      setEditing(null)
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
        if (transaction) setMasterMembers((previous) => previous.map((member) => String(member.ID) === String(transaction.memberId) ? {
          ...member,
          Sisa_Hutang_Iuran: Number(member.Sisa_Hutang_Iuran || 0) + Number(transaction.allocatedContribution || 0),
          Sisa_Hutang_Kembalian: Math.max(0, Number(member.Sisa_Hutang_Kembalian || 0) - Number(transaction.refundDebtAdded || 0)),
        } : member))
      }
      setRows((previous) => ({ ...previous, [active]: (previous[active] || []).filter((row) => row.id !== id) }))
      if (active === 'sewa') setRentalRows((previous) => previous.filter((row) => row.id !== id))
      if (['iuran', 'sukaduka'].includes(active) && result?.member) setMasterMembers((previous) => previous.map((member) => String(member.ID) === String(result.member.ID) ? result.member : member))
      setNotice('Catatan dihapus.')
    } catch (error) { setNotice(error.message) }
  }

  async function closeBook() {
    const period = window.prompt('Periode baru (contoh: 2026-10). Tunggakan yang belum dibayar otomatis dibawa ke periode ini:')
    if (!period) return
    const monthlyTarget = Number(window.prompt('Target iuran baru per anggota (Rp). Nilai ini ditambahkan ke tunggakan sebelumnya:', '50000'))
    if (!monthlyTarget) return
    try {
      if (!isDemo) await request('closeBook', { period, monthlyTarget, date: new Date().toISOString().slice(0, 10) }, token)
      setNotice(`Tutup buku periode ${period} berhasil dibuat.`)
    } catch (error) { setNotice(error.message) }
  }

  const summaryCards = summary?.cards || [
    { label: 'Saldo kas gabungan', value: 24750000, icon: Landmark, trend: '+8,2%', tone: 'green' },
    { label: 'Penerimaan bulan ini', value: 4680000, icon: ArrowDownLeft, trend: '32 transaksi', tone: 'yellow' },
    { label: 'Pengeluaran bulan ini', value: 1920000, icon: ArrowUpRight, trend: '18 transaksi', tone: 'peach' },
    { label: 'Tunggakan iuran', value: 850000, icon: Activity, trend: '4 anggota', tone: 'rose' },
  ]

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
            <button onClick={signOut} className="rounded p-1.5 text-[#8b978c] hover:bg-[#f0f1e9]" title="Keluar" aria-label="Keluar"><LogOut size={16} /></button>
          </div>
          <p className={`mt-1 px-2 text-[9px] text-[#9aa399] ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{isDemo ? 'MODE DEMO' : 'DATA TERSINKRON'}</p>
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
          {active === 'dashboard' ? dashboardHidden ? <div className="rounded-md border border-[#e6e7dd] bg-white p-6 text-sm text-[#68766b]">Dashboard disembunyikan. <button onClick={toggleDashboard} className="ml-1 font-semibold text-[#b5122a] underline">Tampilkan kembali</button></div> : <Dashboard role={role} cards={summaryCards} analytics={summary} galleryItems={publicActivities} onOpenGallery={() => setActive('kegiatan')} /> : active === 'kegiatan' ? <GalleryPage items={filteredRows} writable={writable} onAdd={() => { setEditing(null); setModal(true) }} onEdit={(row) => { setEditing(row); setModal(true) }} onDelete={deleteRecord} /> : active === 'laporan' ? <Reports rows={rows} summary={summary} role={role} onApprove={async () => { try { if (!isDemo) await request('approveReport', { period: new Date().toISOString().slice(0, 7), notes: 'Disetujui melalui dashboard TAKORA' }, token); setNotice('Laporan periode ini disetujui.'); } catch (error) { setNotice(error.message) } }} /> : <ModulePage active={active} page={page} rows={filteredRows} query={query} setQuery={setQuery} loading={loading} writable={writable} periodFilter={periodFilter} setPeriodFilter={setPeriodFilter} masterMembers={masterMembers} contacts={contacts} assets={rentalAssets} rentalRows={rentalRows} onAdd={() => { setEditing(null); setModal(true) }} onEdit={(row) => { setEditing(row); setModal(true) }} onDelete={deleteRecord} onCloseBook={closeBook} />}
          <footer className="mt-10 flex flex-col gap-1 border-t border-[#e5e6dc] pt-5 text-[10px] text-[#8a968c] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} SENDETAN TAKORA TELAGA BETENG</span><span>Telagabeteng, Banjar Dinas Tiyingtali Kelod, Desa Tiyingtali, Kec. Abang, Kab. Karangasem, Bali</span></footer>
        </div>
      </main>

      {modal && <RecordModal page={page} editing={editing} members={masterMembers} contacts={contacts} assets={rentalAssets} rentalRows={rentalRows} onClose={() => { setModal(false); setEditing(null) }} onSave={saveRecord} onSaveIuran={saveIuran} onSaveSukaduka={saveSukaduka} onSaveRental={saveRental} onSaveActivity={saveActivity} />}
      {loginOpen && <LoginModal login={login} setLogin={setLogin} onClose={() => setLoginOpen(false)} onSubmit={signIn} demo={isDemo} />}
      {notice && <div role="status" className="fixed bottom-5 right-5 z-[60] flex max-w-[calc(100vw-40px)] items-center gap-2 rounded-md bg-[#244332] px-4 py-3 text-sm font-medium text-white shadow-lg"><Check size={16} />{notice}</div>}
    </div>
  )
}

function Dashboard({ role, cards, analytics, galleryItems, onOpenGallery }) {
  const publicMode = role === 'Publik'
  const visibleCards = publicMode ? cards.filter((card) => !/tunggakan/i.test(card.label)) : cards
  const chartData = analytics?.monthly || cashBars
  const sourceData = analytics?.sources?.length ? analytics.sources : fundSlices
  const sourceTotal = sourceData.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const moduleBalances = analytics?.modules || demoModuleBalances
  const outstanding = analytics?.outstanding || { arrears: demoModuleBalances.iuran.unpaid, refundDebt: 20000 }
  const moduleEntries = Object.entries(moduleBalances).map(([key, value]) => ({ key, name: moduleLabels[key] || key, color: moduleColors[key] || '#777777', ...value }))
  const donutBalances = moduleEntries.filter((item) => Number(item.balance) > 0).map((item) => ({ name: item.name, value: Number(item.balance), color: item.color }))
  const donutTotal = donutBalances.reduce((sum, item) => sum + item.value, 0)
  return <div className="animate-rise">
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-[#79877b]">Om Swastyastu, <span className="font-semibold text-[#48644d]">{publicMode ? 'Semeton Sendetan' : roleNames[role]}</span></p><p className="mt-1 text-xs text-[#9aa399]">{publicMode ? 'Ringkasan transparansi dana organisasi.' : 'Berikut ringkasan posisi kas dan aktivitas organisasi.'}</p></div><div className="flex items-center gap-2 self-start rounded-md border border-[#e2e5dc] bg-white px-3 py-2 text-xs font-semibold text-[#6e7f71] sm:self-auto"><CalendarDays size={14} /> Tahun berjalan <ChevronDown size={13} /></div></div>
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${visibleCards.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
      {visibleCards.map((card, index) => { const Icon = card.icon || [Landmark, ArrowDownLeft, ArrowUpRight, Activity][index]; return <div key={card.label} className="animate-rise rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4" style={{ animationDelay: `${index * 55}ms` }}>
        <div className="flex items-start justify-between"><div><p className="text-xs font-medium text-[#849084]">{card.label}</p><p className="font-display mt-3 text-[22px] font-extrabold tracking-[-.02em] text-[#293f33] sm:text-[24px]">{currency(card.value)}</p></div><span className={`flex h-9 w-9 items-center justify-center rounded-md ${['bg-[#e9f0e5] text-[#527956]', 'bg-[#f8efd9] text-[#a98239]', 'bg-[#faeae1] text-[#b56d49]', 'bg-[#f6e6e3] text-[#aa6254]'][index % 4]}`}><Icon size={17} /></span></div>
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[#638367]"><TrendingUp size={12} />{card.trend}<span className="font-normal text-[#9aa399]"> periode ini</span></div>
      </div> })}
    </div>
    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_1fr]">
      <section className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4 sm:p-5"><div className="mb-4 flex items-start justify-between"><div><h2 className="font-display text-sm font-extrabold">Arus kas bulanan</h2><p className="mt-1 text-[11px] text-[#929c91]">Penerimaan dan pengeluaran · dalam juta rupiah</p></div><span className="rounded border border-[#e6e7dd] px-2 py-1 text-[10px] text-[#748174]">Apr – Sep 2026</span></div>
        <div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 3, left: -18, bottom: 0 }} barGap={5}><CartesianGrid vertical={false} stroke="#eceee6" strokeDasharray="3 4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a968b', fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#9aa399', fontSize: 10 }} tickFormatter={(value) => `${value}jt`} /><Tooltip formatter={(value) => [`Rp ${value} jt`, '']} contentStyle={{ border: '1px solid #e5e8df', borderRadius: 6, fontSize: 12 }} /><Bar dataKey="masuk" name="Masuk" fill="#b5122a" radius={[3, 3, 0, 0]} maxBarSize={29} /><Bar dataKey="keluar" name="Keluar" fill="#242424" radius={[3, 3, 0, 0]} maxBarSize={29} /></BarChart></ResponsiveContainer></div>
        <div className="mt-3 flex gap-5 text-[10px] text-[#7e8a7f]"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#b5122a]" /> Dana masuk</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[#242424]" /> Dana keluar</span></div>
      </section>
      <section className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4 sm:p-5"><div><h2 className="font-display text-sm font-extrabold">Sumber dana</h2><p className="mt-1 text-[11px] text-[#929c91]">Proporsi penerimaan enam bulan terakhir</p></div>
        <div className="relative mx-auto mt-2 h-[205px] max-w-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={3} stroke="none">{sourceData.map((slice) => <Cell key={slice.name} fill={slice.color} />)}</Pie><Tooltip formatter={(value) => [`${value}%`, 'Porsi']} contentStyle={{ border: '1px solid #e5e8df', borderRadius: 6, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-[22px] font-extrabold">{sourceTotal}%</span><span className="text-[10px] text-[#8a968b]">penerimaan</span></div></div>
        <div className="space-y-2">{sourceData.map((slice) => <div key={slice.name} className="flex items-center gap-2 text-xs"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: slice.color }} /><span className="flex-1 text-[#788579]">{slice.name}</span><span className="font-bold">{slice.value}%</span></div>)}</div>
      </section>
    </div>
    <section className="mt-5 rounded-md border border-[#e6e7dd] bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-end"><div><h2 className="font-display text-sm font-extrabold">Posisi kas per modul</h2><p className="mt-1 text-[11px] text-[#929c91]">Saldo bersih dari penerimaan dan pengeluaran yang tercatat.</p></div><span className="text-[10px] text-[#8a968b]">Angka rupiah</span></div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><div className="flex items-center justify-between rounded-md border border-[#f1d9dc] bg-[#fff1f2] px-3 py-2.5"><span className="text-[11px] text-[#715d60]">Tunggakan iuran belum dibayar</span><b className="text-xs text-[#b5122a]">{currency(outstanding.arrears)}</b></div><div className="flex items-center justify-between rounded-md border border-[#e6e7dd] bg-[#f7f7f7] px-3 py-2.5"><span className="text-[11px] text-[#6f6f6f]">Kembalian anggota belum diserahkan</span><b className="text-xs text-[#242424]">{currency(outstanding.refundDebt)}</b></div></div>
      <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[250px_1fr]">
        <div className="relative mx-auto h-[220px] w-full max-w-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={donutBalances} dataKey="value" nameKey="name" innerRadius={66} outerRadius={96} paddingAngle={2} stroke="none">{donutBalances.map((slice) => <Cell key={slice.name} fill={slice.color} />)}</Pie><Tooltip formatter={(value) => [currency(value), 'Saldo bersih']} contentStyle={{ border: '1px solid #e5e8df', borderRadius: 6, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-lg font-extrabold">{currency(donutTotal)}</span><span className="text-[10px] text-[#8a968b]">saldo positif</span></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b border-[#eceee6] text-[9px] font-bold uppercase tracking-wide text-[#99a197]"><th className="py-2.5">Modul</th><th className="px-3 py-2.5 text-right">Masuk</th><th className="px-3 py-2.5 text-right">Keluar</th><th className="px-3 py-2.5 text-right">Saldo</th><th className="px-3 py-2.5 text-right">Belum dibayar</th></tr></thead><tbody className="divide-y divide-[#f0f1eb]">{moduleEntries.map((item) => <tr key={item.key}><td className="py-3 font-semibold text-[#3c5043]"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: item.color }} />{item.name}</td><td className="px-3 py-3 text-right text-[#555]">{currency(item.incoming)}</td><td className="px-3 py-3 text-right text-[#555]">{currency(item.outgoing)}</td><td className="px-3 py-3 text-right font-bold">{currency(item.balance)}</td><td className="px-3 py-3 text-right font-semibold text-[#b5122a]">{item.key === 'iuran' ? currency(item.unpaid) : '-'}</td></tr>)}</tbody></table></div>
      </div>
    </section>
    <section className="mt-5 overflow-hidden rounded-md border border-[#e6e7dd] bg-[#fffefa]"><div className="flex items-center justify-between border-b border-[#eceee6] px-4 py-4 sm:px-5"><div><h2 className="font-display text-sm font-extrabold">Aktivitas terakhir</h2><p className="mt-1 text-[11px] text-[#929c91]">Transaksi tercatat di seluruh modul</p></div><span className="rounded bg-[#eef2e9] px-2 py-1 text-[10px] font-semibold text-[#638065]">{isDemo ? 'Data simulasi' : 'Terkini'}</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="text-[10px] font-semibold uppercase tracking-wide text-[#97a096]"><th className="px-5 py-3">Tanggal</th><th className="px-4 py-3">Aktivitas</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Nominal</th></tr></thead><tbody className="divide-y divide-[#f0f1eb]">{[{ date: '2026-09-28', activity: 'Penerimaan sesari purnama', category: 'Sesari', amount: 350000, incoming: true }, { date: '2026-09-27', activity: 'Iuran Ni Luh Sari', category: 'Iuran', amount: 100000, incoming: true }, { date: '2026-09-25', activity: 'Kebutuhan persembahyangan', category: 'Sesari', amount: 125000, incoming: false }, { date: '2026-09-21', activity: 'Dana belasungkawa', category: 'Sukaduka', amount: 500000, incoming: false }].map((item) => <tr key={item.activity}><td className="whitespace-nowrap px-5 py-3.5 text-[#7e8a7f]">{readableDate(item.date)}</td><td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#3c5043]">{item.activity}</td><td className="px-4 py-3.5 text-[#788579]">{item.category}</td><td className="px-4 py-3.5"><span className={`rounded px-2 py-1 text-[10px] font-semibold ${item.incoming ? 'bg-[#e9f0e5] text-[#56785a]' : 'bg-[#f8eee0] text-[#9b793b]'}`}>{item.incoming ? 'Penerimaan' : 'Pengeluaran'}</span></td><td className={`whitespace-nowrap px-5 py-3.5 text-right font-bold ${item.incoming ? 'text-[#4c7653]' : 'text-[#a67842]'}`}>{item.incoming ? '+' : '−'} {currency(item.amount)}</td></tr>)}</tbody></table></div>
    </section>
    <GalleryPreview items={galleryItems} onOpen={onOpenGallery} />
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

function GalleryPage({ items, writable, onAdd, onEdit, onDelete }) {
  const published = items.filter((item) => item.visibility !== 'Draft')
  const drafts = items.filter((item) => item.visibility === 'Draft')
  return <div className="animate-rise">
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-display text-xl font-extrabold">Cerita kegiatan krama</p><p className="mt-1 max-w-2xl text-xs leading-5 text-[#849084]">Dokumentasi kegiatan SENDETAN TAKORA TELAGA BETENG.</p></div>{writable && <button onClick={onAdd} className="flex items-center justify-center gap-2 self-start rounded-md bg-[#b5122a] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#941023]"><Plus size={16} /> Tambah dokumentasi</button>}</div>
    {published.length ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{published.map((item) => <article key={item.id} className="overflow-hidden rounded-md border border-[#e6e7dd] bg-white">
      <div className="relative aspect-[16/10] bg-[#171717]">{item.mediaType === 'youtube' && youtubeEmbedUrl(item.youtubeUrl) ? <iframe className="h-full w-full" src={youtubeEmbedUrl(item.youtubeUrl)} title={item.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /> : item.photoUrl ? <img src={item.photoUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-white/75"><Camera size={25} /><span className="text-xs">Foto kegiatan</span></div>}</div>
      <div className="p-4"><div className="flex items-center justify-between gap-2"><time className="text-[10px] font-semibold uppercase tracking-wide text-[#b5122a]">{readableDate(item.eventDate)}</time>{item.mediaType === 'youtube' && <span className="text-[9px] font-bold uppercase text-[#777]">Video</span>}</div><h2 className="font-display mt-2 text-sm font-extrabold">{item.title}</h2>{item.description && <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-[#68766b]">{item.description}</p>}{writable && <div className="mt-3 flex justify-end gap-1 border-t border-[#f0f1eb] pt-2"><button onClick={() => onEdit(item)} className="rounded px-2 py-1 text-[10px] font-semibold text-[#777] hover:bg-[#f5f5f5]">Ubah</button><button onClick={() => onDelete(item.id)} className="rounded px-2 py-1 text-[10px] font-semibold text-[#b5122a] hover:bg-[#fff1f2]">Hapus</button></div>}</div>
    </article>)}</div> : <div className="rounded-md border border-dashed border-[#d9d9d9] bg-white px-5 py-14 text-center"><Camera size={22} className="mx-auto text-[#999]" /><p className="mt-3 text-sm font-semibold">Belum ada dokumentasi publik</p><p className="mt-1 text-xs text-[#8a8a8a]">Foto dan video kegiatan yang dipublikasikan akan tampil di sini.</p></div>}
    {writable && drafts.length > 0 && <section className="mt-8"><h2 className="font-display mb-3 text-sm font-extrabold">Draft belum dipublikasikan</h2><div className="divide-y divide-[#ececec] border-y border-[#ececec] bg-white">{drafts.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-xs font-semibold">{item.title}</p><p className="mt-1 text-[10px] text-[#888]">{readableDate(item.eventDate)} · {item.mediaType === 'youtube' ? 'Video' : 'Foto'}</p></div><div className="flex gap-2"><button onClick={() => onEdit(item)} className="text-xs font-semibold text-[#666]">Ubah</button><button onClick={() => onDelete(item.id)} className="text-xs font-semibold text-[#b5122a]">Hapus</button></div></div>)}</div></section>}
  </div>
}

function ModulePage({ active, page, rows, query, setQuery, loading, writable, periodFilter, setPeriodFilter, masterMembers, contacts, assets, rentalRows, onAdd, onEdit, onDelete, onCloseBook }) {
  const hasCashSummary = ['iuran', 'sesari', 'sukaduka', 'punia', 'piodalan', 'sewa'].includes(active)
  const cashIn = rows.reduce((sum, row) => sum + (active === 'iuran' ? Number(row.cashPhysical || 0) : active === 'sukaduka' ? (row.direction === 'Masuk' ? Number(row.cashPhysical || row.amount || 0) : 0) : active === 'sewa' ? Number(row.rentalIncome || 0) : active === 'punia' ? (row.donationType === 'Uang Tunai' ? Number(row.amount || 0) : 0) : row.direction === 'Masuk' && row.category !== 'Punia barang' ? Number(row.amount || 0) : 0), 0)
  const cashOut = rows.reduce((sum, row) => sum + (active === 'iuran' ? Number(row.changePaid || 0) : active === 'sewa' ? Number(row.maintenanceCost || 0) : active === 'sukaduka' ? Number(row.direction === 'Keluar' ? row.amount || 0 : row.changePaid || 0) : row.direction === 'Keluar' ? Number(row.amount || 0) : 0), 0)
  const selectedContacts = contacts || []
  return <div className="animate-rise">
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="max-w-2xl text-xs leading-5 text-[#849084]">{page.desc}</p><p className="mt-2 text-[11px] text-[#9aa399]">{rows.length} catatan terdaftar</p></div>
      <div className="flex gap-2">{active === 'iuran' && writable && <button onClick={onCloseBook} className="flex items-center justify-center gap-2 rounded-md border border-[#d9e1d5] bg-white px-3 py-2.5 text-xs font-semibold text-[#4e7053] hover:bg-[#f3f6ef]"><BookOpenCheck size={15} /> Tutup buku</button>}{writable && <button onClick={onAdd} className="flex items-center justify-center gap-2 rounded-md bg-[#355d3f] px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#294d33]"><Plus size={16} /> Tambah data</button>}</div>
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

function RecordModal({ page, editing, members, contacts, assets, rentalRows, onClose, onSave, onSaveIuran, onSaveSukaduka, onSaveRental, onSaveActivity }) {
  if (page.api === 'TRANSAKSI_IURAN') return <IuranModal members={members} editing={editing} onClose={onClose} onSave={onSaveIuran} />
  if (page.api === 'Sukaduka') return <SukadukaModal members={members} editing={editing} onClose={onClose} onSave={onSaveSukaduka} />
  if (page.api === 'SewaAset') return <RentalModal assets={assets} rentalRows={rentalRows} editing={editing} onClose={onClose} onSave={onSaveRental} />
  if (page.api === 'Notulensi') return <NotulensiModal contacts={contacts} editing={editing} onClose={onClose} onSave={onSave} />
  if (page.api === 'KegiatanMedia') return <ActivityMediaModal editing={editing} onClose={onClose} onSave={onSaveActivity} />
  const today = new Date().toISOString().slice(0, 10)
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah catatan' : `Tambah ${page.title.toLowerCase()}`}</h2><p className="mt-1 text-xs text-[#8c978d]">Lengkapi informasi berikut.</p></div><button onClick={onClose} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9]" aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={onSave} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {page.fields.map(([key, label, type]) => <label key={key} className={`block ${type === 'textarea' || key === 'photoFile' ? 'sm:col-span-2' : ''}`}><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">{label}{key === 'purpose' && <span className="ml-1 text-[#c16e52]">*</span>}</span>
          {type.startsWith('select:') ? <select name={key} defaultValue={editing?.[key] || ''} required className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]"><option value="" disabled>Pilih {label.toLowerCase()}</option>{type.slice(7).split('|').map((option) => <option key={option}>{option}</option>)}</select> : type === 'textarea' ? <textarea name={key} defaultValue={editing?.[key] || ''} rows={key === 'minutes' || key === 'followUp' ? '8' : '3'} className="w-full resize-y rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]" /> : type === 'file' ? <input name={key} type="file" accept="image/*" className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-[#e9efe5] file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:text-[#496b4d]" /> : <input name={key} type={type} required={key === 'date' || key === 'memberName' || key === 'amount' || (key === 'password' && !editing)} minLength={key === 'password' ? 12 : undefined} min={type === 'number' ? '0' : undefined} step={type === 'number' ? 'any' : undefined} defaultValue={key === 'password' ? '' : editing?.[key] ?? (key === 'date' ? today : '')} placeholder={key === 'password' && editing ? 'Kosongkan jika tidak diubah' : undefined} readOnly={key === 'photoUrl'} className={`w-full rounded-md border border-[#e1e5dc] px-3 py-2.5 text-xs outline-none focus:border-[#789578] ${key === 'photoUrl' ? 'bg-[#f5f6f1] text-[#809080]' : 'bg-white'}`} />}
        </label>)}
        <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold text-[#68776b] hover:bg-[#f7f8f4]">Batal</button><button className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#294d33]">{editing ? 'Simpan perubahan' : 'Simpan catatan'}</button></div>
      </form>
    </div>
  </div>
}

function SukadukaModal({ members, editing, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: editing?.date || today,
    direction: editing?.direction || 'Masuk',
    memberId: editing?.memberId || '',
    recipient: editing?.recipient || '',
    purpose: editing?.purpose || '',
    amount: Number(editing?.amount || 0),
    cashPhysical: Number(editing?.cashPhysical || 0),
    changePaid: Number(editing?.changePaid || 0),
    notes: editing?.notes || '',
  })
  const [proofFile, setProofFile] = useState(null)
  const member = members.find((entry) => String(entry.ID) === String(form.memberId))
  const amount = Number(form.amount) || 0
  const cash = Number(form.cashPhysical) || 0
  const changeDue = Math.max(0, cash - amount)
  const changePaid = Number(form.changePaid) || 0
  const openingRefundDebt = Math.max(0, Number(member?.Sisa_Hutang_Kembalian || 0) - Number(editing?.refundDebtAdded || 0))
  const valid = Boolean(form.date && form.purpose) && (form.direction === 'Keluar' ? Boolean(form.recipient) && amount > 0 : Boolean(member) && amount > 0 && cash >= amount && changePaid <= openingRefundDebt + changeDue)
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  const readonlyClass = `${inputClass} bg-[#f5f6f1] font-semibold text-[#809080]`

  function setValue(key, value) { setForm((previous) => ({ ...previous, [key]: value })) }
  function submit(event) {
    event.preventDefault()
    if (!valid) return
    const incoming = form.direction === 'Masuk'
    onSave({
      id: editing?.id, date: form.date, direction: form.direction,
      recipient: incoming ? member.Nama : form.recipient,
      memberId: incoming ? member.ID : '', memberName: incoming ? member.Nama : '',
      purpose: form.purpose, amount,
      cashPhysical: incoming ? cash : 0,
      changeDue: incoming ? changeDue : 0,
      changePaid: incoming ? changePaid : 0,
      refundDebtAdded: incoming ? changeDue - changePaid : 0,
      refundDebt: incoming ? openingRefundDebt + changeDue - changePaid : 0,
      notes: form.notes,
      proofFile,
    })
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah transaksi sukaduka' : 'Catat sukaduka'}</h2><p className="mt-1 text-xs text-[#8c978d]">Penerimaan anggota mencatat uang fisik dan kembalian.</p></div><button type="button" onClick={onClose} className="rounded p-1.5 text-[#7d8b7e]" aria-label="Tutup"><X size={18} /></button></div>
    <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal transaksi</span><input type="date" value={form.date} onChange={(event) => setValue('date', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Arus kas</span><select value={form.direction} disabled={Boolean(editing)} onChange={(event) => setValue('direction', event.target.value)} className={inputClass}><option>Masuk</option><option>Keluar</option></select></label>
      {form.direction === 'Masuk' ? <>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Nama anggota</span><select required value={form.memberId} onChange={(event) => setValue('memberId', event.target.value)} disabled={!members.length || Boolean(editing)} className={inputClass}><option value="">{members.length ? 'Pilih anggota' : 'Belum ada anggota pada master'}</option>{members.map((entry) => <option key={entry.ID} value={entry.ID}>{entry.Nama}</option>)}</select></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Uang untuk sukaduka</span><input type="number" min="1" step="1" value={form.amount} onChange={(event) => setValue('amount', event.target.value)} className={inputClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Uang fisik diterima</span><input type="number" min={amount} step="1" value={form.cashPhysical} onChange={(event) => setValue('cashPhysical', event.target.value)} className={inputClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Kembalian seharusnya</span><input readOnly value={changeDue} className={readonlyClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Kembalian diberikan</span><input type="number" min="0" max={openingRefundDebt + changeDue} step="1" value={form.changePaid} onChange={(event) => setValue('changePaid', event.target.value)} className={inputClass} /></label>
        <label><span className="mb-1.5 block text-[11px] font-semibold">Sisa hutang kembalian</span><input readOnly value={openingRefundDebt + changeDue - changePaid} className={readonlyClass} /></label>
      </> : <label><span className="mb-1.5 block text-[11px] font-semibold">Penerima dana</span><input required value={form.recipient} onChange={(event) => setValue('recipient', event.target.value)} className={inputClass} /></label>}
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Catatan / peruntukan <span className="text-[#b5122a]">*</span></span><input required value={form.purpose} onChange={(event) => setValue('purpose', event.target.value)} className={inputClass} /></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Foto bukti serah terima</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setProofFile(event.target.files?.[0] || null)} className={inputClass} /><span className="mt-1 block text-[10px] text-[#888]">Foto tersimpan di folder Drive Foto Sukaduka (maks. 5 MB).{editing?.proofPhotoUrl && <a className="ml-1 font-semibold text-[#b5122a] underline" href={editing.proofPhotoUrl} target="_blank" rel="noreferrer">Lihat bukti saat ini</a>}</span></label>
      {form.direction === 'Keluar' && <label><span className="mb-1.5 block text-[11px] font-semibold">Nominal</span><input type="number" min="1" value={form.amount} onChange={(event) => setValue('amount', event.target.value)} className={inputClass} /></label>}
      {!valid && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Periksa anggota, peruntukan, nominal fisik, dan kembalian yang diberikan.</p>}
      <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold">Batal</button><button disabled={!valid} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Simpan transaksi</button></div>
    </form>
  </div></div>
}

function RentalModal({ assets, rentalRows, editing, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    date: editing?.date || today, assetId: editing?.assetId || '', renter: editing?.renter || '',
    startDate: editing?.startDate || today, endDate: editing?.endDate || today,
    quantity: Number(editing?.quantity || 1), maintenanceCost: Number(editing?.maintenanceCost || 0),
    status: editing?.status || 'Berjalan', notes: editing?.notes || '',
  })
  const asset = assets.find((item) => String(item.id) === String(form.assetId))
  function availableFor(item) {
    if (!item || item.condition === 'Rusak' || !form.startDate || !form.endDate) return 0
    const occupied = rentalRows.filter((row) => String(row.assetId) === String(item.id) && row.id !== editing?.id && row.status !== 'Dibatalkan' && row.startDate && row.endDate && row.startDate <= form.endDate && row.endDate >= form.startDate).reduce((sum, row) => sum + Number(row.quantity || 0), 0)
    return Math.max(0, Number(item.quantity || 0) - occupied)
  }
  const available = availableFor(asset)
  const days = form.startDate && form.endDate ? Math.max(1, Math.floor((new Date(`${form.endDate}T00:00:00`) - new Date(`${form.startDate}T00:00:00`)) / 86400000) + 1) : 0
  const rentalIncome = Number(asset?.rentalRate || 0) * Number(form.quantity || 0) * days
  const valid = Boolean(asset && form.renter && form.startDate && form.endDate && form.endDate >= form.startDate) && Number(form.quantity) > 0 && (form.status === 'Dibatalkan' || Number(form.quantity) <= available)
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  function setValue(key, value) { setForm((previous) => ({ ...previous, [key]: value })) }
  function submit(event) {
    event.preventDefault()
    if (!valid) return
    onSave({ id: editing?.id, date: form.date, assetId: asset.id, assetName: asset.assetName, renter: form.renter, startDate: form.startDate, endDate: form.endDate, quantity: Number(form.quantity), rentalIncome, maintenanceCost: Number(form.maintenanceCost) || 0, status: form.status, notes: form.notes })
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah transaksi sewa' : 'Tambah transaksi sewa'}</h2><p className="mt-1 text-xs text-[#8c978d]">Stok dihitung untuk rentang tanggal yang dipilih.</p></div><button type="button" onClick={onClose} className="rounded p-1.5" aria-label="Tutup"><X size={18} /></button></div>
    <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal transaksi</span><input type="date" value={form.date} onChange={(event) => setValue('date', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Status</span><select value={form.status} onChange={(event) => setValue('status', event.target.value)} className={inputClass}><option>Berjalan</option><option>Selesai</option><option>Dibatalkan</option></select></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Pilih alat</span><select required value={form.assetId} onChange={(event) => setValue('assetId', event.target.value)} className={inputClass}><option value="">Pilih inventaris</option>{assets.map((item) => <option key={item.id} value={item.id}>{item.assetName} · {currency(item.rentalRate)}/hari · stok {availableFor(item)}</option>)}</select></label>
      {asset && <div className="flex items-center gap-3 rounded-md border border-[#e6e7dd] bg-white p-3 sm:col-span-2">{asset.photoUrl && <img src={asset.photoUrl} alt={asset.assetName} className="h-12 w-14 rounded object-cover" />}<div className="text-[11px] text-[#68776b]"><b>{asset.assetName}</b><div>Dimiliki {asset.quantity} · tersedia {available} · {asset.condition}</div><div>Harga beli {currency(asset.purchasePrice)} · sewa {currency(asset.rentalRate)}/item/hari</div></div></div>}
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal mulai</span><input type="date" value={form.startDate} onChange={(event) => setValue('startDate', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal selesai</span><input type="date" min={form.startDate} value={form.endDate} onChange={(event) => setValue('endDate', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Nama penyewa</span><input required value={form.renter} onChange={(event) => setValue('renter', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Jumlah disewa</span><input type="number" min="1" max={available} value={form.quantity} onChange={(event) => setValue('quantity', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Total pemasukan sewa</span><input readOnly value={rentalIncome} className={`${inputClass} bg-[#f5f6f1]`} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Biaya perawatan</span><input type="number" min="0" value={form.maintenanceCost} onChange={(event) => setValue('maintenanceCost', event.target.value)} className={inputClass} /></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Catatan</span><textarea rows="3" value={form.notes} onChange={(event) => setValue('notes', event.target.value)} className={inputClass} /></label>
      {!valid && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Pilih alat dan tanggal yang valid, serta jumlah sewa tidak melebihi stok tersedia.</p>}
      <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold">Batal</button><button disabled={!valid} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Simpan transaksi</button></div>
    </form>
  </div></div>
}

function ActivityMediaModal({ editing, onClose, onSave }) {
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
  const hasPhoto = Boolean(photoFile || editing?.photoUrl)
  const validYoutube = Boolean(youtubeEmbedUrl(form.youtubeUrl))
  const valid = Boolean(form.title.trim() && form.eventDate) && (form.mediaType === 'photo' ? hasPhoto : validYoutube)
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  function setValue(key, value) { setForm((previous) => ({ ...previous, [key]: value })) }
  function submit(event) {
    event.preventDefault()
    if (!valid) return
    onSave({ ...form, title: form.title.trim(), photoFile, photoUrl: editing?.photoUrl || '' })
  }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#151515]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-white p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah dokumentasi' : 'Tambah dokumentasi kegiatan'}</h2><p className="mt-1 text-xs text-[#888]">Foto tersimpan di Drive; video ditampilkan dari YouTube.</p></div><button type="button" onClick={onClose} className="rounded p-1.5" aria-label="Tutup"><X size={18} /></button></div>
    <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Judul kegiatan</span><input required value={form.title} onChange={(event) => setValue('title', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Tanggal kegiatan</span><input type="date" required value={form.eventDate} onChange={(event) => setValue('eventDate', event.target.value)} className={inputClass} /></label>
      <label><span className="mb-1.5 block text-[11px] font-semibold">Jenis media</span><select value={form.mediaType} onChange={(event) => setValue('mediaType', event.target.value)} className={inputClass}><option value="photo">Foto kegiatan</option><option value="youtube">Video YouTube</option></select></label>
      <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Keterangan</span><textarea rows="4" value={form.description} onChange={(event) => setValue('description', event.target.value)} className={`${inputClass} resize-y`} /></label>
      {form.mediaType === 'photo' ? <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">Foto kegiatan {editing?.photoUrl && <span className="font-normal text-[#777]">(unggah baru untuk mengganti)</span>}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPhotoFile(event.target.files?.[0] || null)} className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-[#fff1f2] file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:text-[#b5122a]`} /><span className="mt-1 block text-[10px] text-[#888]">JPG, PNG, WEBP, GIF · maks. 5 MB · Folder Drive: Foto Kegiatan</span></label> : <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold">URL video YouTube</span><input type="url" required placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={(event) => setValue('youtubeUrl', event.target.value)} className={inputClass} /></label>}
      <label><span className="mb-1.5 block text-[11px] font-semibold">Publikasi</span><select value={form.visibility} onChange={(event) => setValue('visibility', event.target.value)} className={inputClass}><option>Publik</option><option>Draft</option></select></label>
      <p className="self-center text-[10px] text-[#777]">{form.visibility === 'Publik' ? 'Tampil di galeri publik.' : 'Hanya dapat dilihat pengelola.'}</p>
      {!valid && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Lengkapi judul/tanggal dan pilih foto atau URL YouTube yang valid.</p>}
      <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold">Batal</button><button disabled={!valid} className="rounded-md bg-[#b5122a] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Simpan dokumentasi</button></div>
    </form>
  </div></div>
}

function NotulensiModal({ contacts, editing, onClose, onSave }) {
  const formRef = useRef(null)
  const [shareMode, setShareMode] = useState('group')
  const [contactId, setContactId] = useState('')
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
  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="max-h-[92vh] w-full max-w-[620px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
    <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah notulensi' : 'Tambah notulensi'}</h2><p className="mt-1 text-xs text-[#8c978d]">Simpan catatan atau buka WhatsApp dengan pesan siap dibagikan.</p></div><button type="button" onClick={onClose} className="rounded p-1.5" aria-label="Tutup"><X size={18} /></button></div>
    <form ref={formRef} onSubmit={onSave} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {[['date', 'Tanggal rapat', 'date'], ['title', 'Agenda / judul', 'text'], ['attendees', 'Peserta', 'text'], ['minutes', 'Catatan dan keputusan', 'textarea'], ['followUp', 'Tindak lanjut', 'textarea']].map(([key, label, type]) => <label key={key} className={type === 'textarea' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-[11px] font-semibold">{label}</span>{type === 'textarea' ? <textarea name={key} rows="8" defaultValue={editing?.[key] || ''} className={`${inputClass} resize-y`} /> : <input name={key} type={type} required={key === 'date' || key === 'title'} defaultValue={editing?.[key] || (key === 'date' ? today : '')} className={inputClass} />}</label>)}
      <div className="rounded-md border border-[#e6e7dd] bg-white p-3 sm:col-span-2"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><MessageCircle size={15} className="text-[#b5122a]" />Bagikan melalui WhatsApp</div><div className="grid gap-2 sm:grid-cols-2"><select value={shareMode} onChange={(event) => setShareMode(event.target.value)} className={inputClass}><option value="group">Grup WhatsApp (pilih grup setelah dibuka)</option><option value="personal">WhatsApp pribadi</option></select>{shareMode === 'personal' && <select value={contactId} onChange={(event) => setContactId(event.target.value)} className={inputClass}><option value="">Pilih anggota</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.memberName} · {contact.phone}</option>)}</select>}</div></div>
      <div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold">Batal</button><button type="button" onClick={share} disabled={shareMode === 'personal' && !contactId} className="flex items-center gap-2 rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold disabled:opacity-50"><MessageCircle size={14} /> Buka WhatsApp</button><button className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white">Simpan catatan</button></div>
    </form>
  </div></div>
}

function IuranModal({ members, editing, onClose, onSave }) {
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
  const valid = Boolean(selectedMember) && allocation <= target && cashReceived >= allocation && changePaid <= openingRefundDebt + changeDue

  function update(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  function submit(event) {
    event.preventDefault()
    if (!valid) return
    onSave({
      id: editing?.id,
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
    })
  }

  const inputClass = 'w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs text-[#344a3a] outline-none focus:border-[#789578]'
  const readOnlyClass = `${inputClass} bg-[#f5f6f1] font-semibold text-[#809080]`

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#16392c]/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-t-lg border border-[#e6e7dd] bg-[#fffefa] p-5 shadow-xl sm:rounded-md sm:p-6">
      <div className="mb-5 flex items-start justify-between"><div><h2 className="font-display text-lg font-extrabold">{editing ? 'Ubah transaksi iuran' : 'Catat pembayaran iuran'}</h2><p className="mt-1 text-xs text-[#8c978d]">Saldo anggota diperbarui setelah transaksi disimpan.</p></div><button type="button" onClick={onClose} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9]" aria-label="Tutup"><X size={18} /></button></div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Tanggal transaksi</span><input type="date" required value={form.date} onChange={(event) => update('date', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Periode</span><input type="month" required value={form.periodId} onChange={(event) => update('periodId', event.target.value)} className={inputClass} /></label>
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Nama anggota</span><select required value={form.memberId} onChange={(event) => setForm((previous) => ({ ...previous, memberId: event.target.value, allocatedContribution: 0, cashPhysical: 0, changePaid: 0 }))} disabled={!members.length || Boolean(editing)} className={inputClass}><option value="" disabled>{members.length ? 'Pilih anggota dari master' : 'Data MASTER_ANGGOTA belum tersedia'}</option>{members.map((member) => <option key={member.ID} value={member.ID}>{member.Nama}</option>)}</select></label>
        {selectedMember && <div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] px-3 py-2.5 text-[10px] text-[#788579] sm:col-span-2">Hutang kembalian sebelumnya: <b>{currency(selectedMember.Sisa_Hutang_Kembalian)}</b></div>}
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Target iuran</span><input readOnly value={target} className={readOnlyClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Uang untuk iuran</span><input type="number" min="0" max={target} step="1" required value={form.allocatedContribution} onChange={(event) => update('allocatedContribution', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Uang fisik diterima</span><input type="number" min={allocation} step="1" required value={form.cashPhysical} onChange={(event) => update('cashPhysical', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Kembalian seharusnya</span><input readOnly value={changeDue} className={readOnlyClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Kembalian diberikan</span><input type="number" min="0" max={openingRefundDebt + changeDue} step="1" required value={form.changePaid} onChange={(event) => update('changePaid', event.target.value)} className={inputClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Sisa hutang kembalian</span><input readOnly value={openingRefundDebt + refundDebtAdded} className={readOnlyClass} /></label>
        <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Sisa hutang iuran (akhir)</span><input readOnly value={arrears} className={readOnlyClass} /></label>
        <label className="block sm:col-span-2"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Catatan</span><input value={form.notes} onChange={(event) => update('notes', event.target.value)} className={inputClass} /></label>
        {!valid && selectedMember && <p className="text-[11px] font-medium text-[#b5122a] sm:col-span-2">Pastikan alokasi tidak melebihi hutang dan uang fisik mencukupi alokasi serta kembalian yang diberikan.</p>}
        <div className="mt-2 flex justify-end gap-2 border-t border-[#eceee6] pt-4 sm:col-span-2"><button type="button" onClick={onClose} className="rounded-md border border-[#e1e5dc] px-4 py-2.5 text-xs font-semibold text-[#68776b] hover:bg-[#f7f8f4]">Batal</button><button disabled={!valid} className="rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#294d33] disabled:cursor-not-allowed disabled:opacity-50">{editing ? 'Simpan perubahan' : 'Simpan transaksi'}</button></div>
      </form>
    </div>
  </div>
}

function LoginModal({ login, setLogin, onClose, onSubmit, demo }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16392c]/40 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="w-full max-w-[420px] rounded-md border border-[#e6e7dd] bg-[#fffefa] p-6 shadow-xl sm:p-7">
    <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-3"><img src={logo} className="h-11 w-11 object-contain" alt="Logo TAKORA" /><div><h2 className="font-display text-base font-extrabold">Akses organisasi</h2><p className="mt-0.5 text-[11px] text-[#89958a]">Masuk ke ruang kerja TAKORA</p></div></div><button onClick={onClose} className="rounded p-1.5 text-[#7d8b7e] hover:bg-[#f0f1e9]" aria-label="Tutup"><X size={17} /></button></div>
    <form onSubmit={onSubmit} className="space-y-3.5"><label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Username</span><input required={!demo} autoComplete="username" value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]" placeholder={demo ? 'Nama pengguna (opsional)' : 'Username'} /></label>
      {demo ? <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Simulasikan peran</span><select value={login.role} onChange={(event) => setLogin({ ...login, role: event.target.value })} className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]">{Object.entries(roleNames).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label> : <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#637367]">Kata sandi</span><input required type="password" autoComplete="current-password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} className="w-full rounded-md border border-[#e1e5dc] bg-white px-3 py-2.5 text-xs outline-none focus:border-[#789578]" /></label>}
      {demo && <p className="rounded bg-[#f3f4ed] px-3 py-2 text-[10px] leading-4 text-[#788579]">Mode demo: pilih peran untuk mencoba batas akses. Akun produksi dibuat melalui Google Apps Script.</p>}
      <button className="mt-1 flex w-full items-center justify-center gap-2 rounded-md bg-[#355d3f] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#294d33]">Masuk <ArrowUpRight size={14} /></button>
    </form>
  </div></div>
}

function Reports({ rows, summary, role, onApprove }) {
  const demoIncome = [rows.sesari, rows.sukaduka, rows.piodalan].flat().filter((row) => row.direction === 'Masuk' && row.category !== 'Punia barang').reduce((total, row) => total + Number(row.amount || 0), 0) + (rows.punia || []).filter((row) => row.donationType === 'Uang Tunai').reduce((total, row) => total + Number(row.amount || 0), 0) + (rows.iuran || []).reduce((total, row) => total + Math.max(0, Number(row.cashPhysical || 0) - Number(row.changeDue || 0)), 0) + (rows.sewa || []).reduce((total, row) => total + Number(row.rentalIncome || 0), 0)
  const demoExpense = [rows.sesari, rows.sukaduka, rows.piodalan].flat().filter((row) => row.direction === 'Keluar' && row.category !== 'Punia barang').reduce((total, row) => total + Number(row.amount || 0), 0) + (rows.sewa || []).reduce((total, row) => total + Number(row.maintenanceCost || 0), 0)
  const totalIncome = summary?.totals?.income ?? demoIncome
  const totalExpense = summary?.totals?.expenses ?? demoExpense
  return <div className="animate-rise"><div className="mb-5"><p className="text-xs text-[#849084]">Ringkasan gabungan berdasarkan transaksi modul keuangan.</p></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4"><p className="text-xs text-[#849084]">Total penerimaan tercatat</p><p className="font-display mt-3 text-xl font-extrabold text-[#426a49]">{currency(totalIncome)}</p></div><div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4"><p className="text-xs text-[#849084]">Total pengeluaran tercatat</p><p className="font-display mt-3 text-xl font-extrabold text-[#a36e3f]">{currency(totalExpense)}</p></div><div className="rounded-md border border-[#e6e7dd] bg-[#fffefa] p-4"><p className="text-xs text-[#849084]">Saldo bersih tercatat</p><p className="font-display mt-3 text-xl font-extrabold text-[#314b38]">{currency(totalIncome - totalExpense)}</p></div></div><div className="mt-5 rounded-md border border-[#e6e7dd] bg-[#fffefa] p-5"><h2 className="font-display text-sm font-extrabold">Persetujuan laporan akhir</h2><p className="mt-2 max-w-xl text-xs leading-5 text-[#849084]">Ketua dapat menyetujui laporan periode berjalan setelah meninjau ringkasan kas. Data sensitif anggota tidak ditampilkan di dashboard publik.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => window.print()} className="rounded-md border border-[#dfe4d9] px-3 py-2 text-xs font-semibold text-[#506854] hover:bg-[#f6f7f2]">Cetak / simpan PDF</button>{['Admin', 'Ketua'].includes(role) && <button onClick={onApprove} className="flex items-center gap-2 rounded-md bg-[#355d3f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#294d33]"><Check size={14} /> Setujui laporan bulan ini</button>}</div></div></div>
}

export default App
