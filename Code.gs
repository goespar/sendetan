const SHEETS = {
  Users: ['id', 'name', 'username', 'passwordHash', 'salt', 'role', 'status', 'createdAt', 'lastLoginAt'],
  Anggota: ['id', 'memberNo', 'memberName', 'phone', 'address', 'status', 'joinedAt', 'notes'],
  IuranPeriode: ['id', 'period', 'openedAt', 'closedAt', 'status', 'monthlyTarget', 'memberCount', 'totalBilled', 'carryArrears', 'carryRefundDebt', 'notes', 'createdBy'],
  Sangkep: ['id', 'date', 'title', 'iuranAmount', 'sukadukaAmount', 'memberCount', 'createdBy', 'createdAt'],
  MASTER_ANGGOTA: ['ID', 'Nama', 'Sisa_Hutang_Iuran', 'Sisa_Hutang_Kembalian', 'Sisa_Hutang_Sukaduka'],
  SaldoAwal: ['id', 'module', 'amount', 'date', 'notes', 'updatedBy', 'updatedAt'],
  TRANSAKSI_IURAN: ['id', 'date', 'periodId', 'memberId', 'memberName', 'target', 'allocatedContribution', 'cashPhysical', 'changeDue', 'changePaid', 'openingArrears', 'arrears', 'openingRefundDebt', 'refundDebtAdded', 'refundDebt', 'notes', 'createdBy', 'createdAt', 'updatedAt', 'chargeAmount', 'sangkepId'],
  PengeluaranIuran: ['id', 'date', 'category', 'description', 'amount', 'payee', 'createdBy', 'createdAt', 'updatedAt'],
  Sesari: ['id', 'date', 'direction', 'category', 'amount', 'description', 'createdBy', 'createdAt'],
  Sukaduka: ['id', 'date', 'direction', 'recipient', 'purpose', 'amount', 'notes', 'createdBy', 'createdAt', 'memberId', 'memberName', 'cashPhysical', 'changeDue', 'changePaid', 'refundDebtAdded', 'refundDebt', 'arrears', 'proofPhotoUrl', 'chargeAmount', 'openingArrears', 'sangkepId'],
  Punia: ['id', 'date', 'donor', 'donationType', 'itemName', 'quantity', 'amount', 'notes', 'createdBy', 'createdAt', 'eventName', 'unit'],
  Piodalan: ['id', 'date', 'eventName', 'category', 'itemName', 'quantity', 'direction', 'amount', 'description', 'createdBy', 'createdAt', 'donor', 'memberId', 'unit', 'chargeAmount'],
  Aset: ['id', 'assetName', 'category', 'quantity', 'condition', 'rentalRate', 'photoUrl', 'notes', 'createdBy', 'createdAt', 'updatedAt', 'purchasePrice', 'rentalRateSemeton', 'rentalRateLuar'],
  KegiatanMedia: ['id', 'title', 'description', 'mediaType', 'photoUrl', 'youtubeUrl', 'eventDate', 'visibility', 'createdBy', 'createdAt'],
  InventarisLog: ['id', 'date', 'assetId', 'assetName', 'movement', 'quantity', 'condition', 'notes', 'createdBy', 'createdAt'],
  SewaAset: ['id', 'date', 'assetId', 'assetName', 'renter', 'startDate', 'endDate', 'quantity', 'rentalIncome', 'maintenanceCost', 'status', 'notes', 'createdBy', 'createdAt', 'customerType'],
  Notulensi: ['id', 'date', 'title', 'attendees', 'minutes', 'followUp', 'createdBy', 'createdAt'],
  LaporanPersetujuan: ['id', 'period', 'status', 'approvedBy', 'approvedAt', 'notes'],
  AuditLog: ['id', 'timestamp', 'userId', 'username', 'action', 'module', 'recordId', 'details'],
};

const FINANCE_MODULES = ['IuranPeriode', 'Sangkep', 'TRANSAKSI_IURAN', 'PengeluaranIuran', 'Sesari', 'Sukaduka', 'Punia', 'Piodalan'];
const SECRETARY_MODULES = ['Anggota', 'Aset', 'InventarisLog', 'SewaAset', 'Notulensi', 'KegiatanMedia'];
const PUBLIC_ROLES = ['Publik'];
const SESSION_TTL_SECONDS = 21600;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = params.action || 'health';
    if (action === 'health') return json_({ ok: true, service: 'TAKORA API', version: 1 });
    if (action === 'publicGallery') return json_({ ok: true, data: publicGallery_() });
    if (action === 'publicSummary') return json_({ ok: true, summary: publicSummary_(params) });
    const user = authenticate_(params.token);
    if (action === 'masterAnggota') {
      assertRole_(user, 'list', 'MASTER_ANGGOTA');
      return json_({ ok: true, members: getMasterAnggota_() });
    }
    if (action === 'openingBalances') {
      assertRole_(user, 'list', 'TRANSAKSI_IURAN');
      return json_({ ok: true, balances: getOpeningBalances_() });
    }
    if (action === 'summary') {
      assertRole_(user, 'summary', '');
      return json_({ ok: true, ...summary_() });
    }
    if (action === 'list') {
      assertRole_(user, 'list', params.module);
      return json_({ ok: true, data: publicRecords_(params.module) });
    }
    throw new Error('Aksi GET tidak dikenal.');
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = body.action;
    if (action === 'login') return json_(login_(body.username, body.password));
    if (action === 'publicGallery') return json_({ ok: true, data: publicGallery_() });
    if (action === 'publicSummary') return json_({ ok: true, summary: publicSummary_(body.filters || {}) });

    const user = authenticate_(body.token);
    if (action === 'logout') {
      CacheService.getScriptCache().remove('session:' + body.token);
      return json_({ ok: true });
    }
    if (action === 'summary') {
      assertRole_(user, 'summary', '');
      return json_({ ok: true, ...summary_(body.filters || {}) });
    }
    if (action === 'list') {
      assertRole_(user, 'list', body.module);
      return json_({ ok: true, data: publicRecords_(body.module) });
    }
    if (action === 'masterAnggota') {
      assertRole_(user, 'list', 'MASTER_ANGGOTA');
      return json_({ ok: true, members: getMasterAnggota_() });
    }
    if (action === 'openingBalances') {
      assertRole_(user, 'list', 'TRANSAKSI_IURAN');
      return json_({ ok: true, balances: getOpeningBalances_() });
    }
    if (action === 'backup') {
      if (user.role !== 'Admin') throw new Error('Hanya Admin yang dapat mengunduh backup data.');
      return json_({ ok: true, backup: createBackup_() });
    }
    if (action === 'uploadFile') {
      assertRole_(user, 'upload', body.folder || 'assets');
      return json_({ ok: true, ...uploadFile_(body) });
    }

    lock.waitLock(20000);
    let result;
    if (action === 'restore') {
      if (user.role !== 'Admin') throw new Error('Hanya Admin yang dapat memulihkan backup data.');
      result = restoreBackup_(body.backup, user);
    } else if (action === 'batchPayments') {
      assertRole_(user, 'create', body.module);
      result = batchPayments_(body.module, body.records || [], user);
    } else if (action === 'batchSangkep') {
      assertRole_(user, 'create', 'Sangkep');
      result = batchSangkep_(body.event || {}, body.members || [], user);
    } else if (action === 'batchCreate') {
      assertRole_(user, 'create', body.module);
      result = batchCreateRecords_(body.module, body.records || [], user);
    } else if (action === 'create') {
      assertRole_(user, 'create', body.module);
      result = createRecord_(body.module, body.record || {}, user);
    } else if (action === 'update') {
      assertRole_(user, 'update', body.module);
      result = updateRecord_(body.module, body.record || {}, user);
    } else if (action === 'delete') {
      assertRole_(user, 'delete', body.module);
      result = deleteRecord_(body.module, body.id, user);
    } else if (action === 'adjustMemberBalance') {
      if (user.role !== 'Admin') throw new Error('Hanya Admin yang dapat mengoreksi saldo master anggota.');
      result = adjustMemberBalance_(body, user);
    } else if (action === 'adjustIuranBalance') {
      if (user.role !== 'Admin' && user.role !== 'Bendahara') throw new Error('Hanya Admin atau Bendahara yang dapat mengoreksi tunggakan iuran.');
      result = adjustMemberBalance_({ memberId: body.memberId, arrears: body.arrears, reason: body.reason }, user);
    } else if (action === 'adjustSukadukaBalance') {
      if (user.role !== 'Admin' && user.role !== 'Bendahara') throw new Error('Hanya Admin atau Bendahara yang dapat mengoreksi tunggakan Sukaduka.');
      result = adjustMemberBalance_({
        memberId: body.memberId,
        sukadukaArrears: body.sukadukaArrears,
        reason: body.reason,
      }, user);
    } else if (action === 'setOpeningBalances') {
      if (user.role !== 'Admin' && user.role !== 'Bendahara') throw new Error('Hanya Admin atau Bendahara yang dapat mengatur saldo awal kas.');
      result = setOpeningBalances_(body, user);
    } else if (action === 'closeBook') {
      assertRole_(user, 'create', 'IuranPeriode');
      result = closeBook_(body, user);
    } else if (action === 'approveReport') {
      assertRole_(user, 'approve', 'LaporanPersetujuan');
      result = approveReport_(body, user);
    } else {
      throw new Error('Aksi tidak dikenal.');
    }
    return json_({ ok: true, ...result });
  } catch (error) {
    return json_({ ok: false, error: error.message, uncertain: Boolean(error.uncertain) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function setupSheets() {
  const ss = spreadsheet_();
  Object.keys(SHEETS).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = SHEETS[name];
    const currentColumns = sheet.getLastColumn();
    const existing = currentColumns ? sheet.getRange(1, 1, 1, currentColumns).getValues()[0] : [];
    if (!existing.length || existing.every(function (value) { return value === ''; })) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e9efe5');
    } else if (existing.length <= headers.length && existing.every(function (header, index) { return headers[index] === header; })) {
      if (existing.length < headers.length) {
        const additions = headers.slice(existing.length);
        sheet.getRange(1, existing.length + 1, 1, additions.length).setValues([additions]);
      }
    } else if (headers.some(function (header, index) { return existing[index] !== header; })) {
      throw new Error('Header sheet ' + name + ' tidak sesuai. Tidak ada perubahan dilakukan.');
    }
  });
  readRecords_('Anggota').forEach(function (member) { upsertMasterAnggota_(member); });
  migrateLegacyIuran_();
  return 'Sheet siap: ' + Object.keys(SHEETS).join(', ');
}

function migrateLegacyIuran_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('LEGACY_IURAN_MIGRATED') === 'true') return;
  const ss = spreadsheet_();
  const legacy = ss.getSheetByName('IuranTransaksi');
  if (!legacy || legacy.getLastRow() < 2) {
    props.setProperty('LEGACY_IURAN_MIGRATED', 'true');
    return;
  }
  const headers = legacy.getRange(1, 1, 1, legacy.getLastColumn()).getValues()[0];
  const values = legacy.getRange(2, 1, legacy.getLastRow() - 1, legacy.getLastColumn()).getValues();
  const targetSheet = ss.getSheetByName('TRANSAKSI_IURAN');
  const targetHeaders = SHEETS.TRANSAKSI_IURAN;
  const existingIds = {};
  readRecords_('TRANSAKSI_IURAN').forEach(function (row) { existingIds[String(row.id)] = true; });
  const members = readRecords_('Anggota');

  values.forEach(function (line) {
    if (!line.some(function (value) { return value !== ''; })) return;
    const old = rowToObject_(headers, line);
    const member = members.find(function (item) {
      return old.memberId && String(item.id) === String(old.memberId) || String(item.memberName).trim().toLowerCase() === String(old.memberName || '').trim().toLowerCase();
    });
    if (!member) throw new Error('Migrasi iuran tertahan: anggota ' + (old.memberName || old.memberId || '(tanpa nama)') + ' tidak ditemukan di sheet Anggota.');
    const id = old.id || Utilities.getUuid();
    const openingArrears = Number(old.openingArrears) || 0;
    const monthlyTarget = Number(old.target) || 0;
    const target = openingArrears + monthlyTarget;
    const cashPhysical = Number(old.cashPhysical) || 0;
    const allocatedContribution = Math.min(cashPhysical, target);
    const openingRefundDebt = Number(old.openingRefundDebt) || 0;
    const changeDue = Number(old.changeDue) || Math.max(0, cashPhysical - target);
    const changePaid = Number(old.changePaid) || 0;
    const refundDebt = Number(old.refundDebt) || openingRefundDebt + Math.max(0, changeDue - changePaid);
    const migrated = {
      id: id, date: old.date, periodId: old.periodId || String(old.date || '').slice(0, 7),
      memberId: member.id, memberName: member.memberName, target: target,
      allocatedContribution: allocatedContribution, cashPhysical: cashPhysical,
      changeDue: changeDue, changePaid: changePaid, openingArrears: openingArrears,
      arrears: Number(old.arrears) || Math.max(0, target - allocatedContribution),
      openingRefundDebt: openingRefundDebt,
      refundDebtAdded: Math.max(0, refundDebt - openingRefundDebt), refundDebt: refundDebt,
      notes: old.notes || 'Migrasi otomatis dari IuranTransaksi',
      createdBy: old.createdBy || 'legacy', createdAt: old.createdAt || old.date || '',
      updatedAt: old.updatedAt || old.date || '',
    };
    if (!existingIds[String(id)]) {
      targetSheet.appendRow(targetHeaders.map(function (key) { return normalizeCell_(migrated[key]); }));
      existingIds[String(id)] = true;
    }
  });

  const allByMember = {};
  readRecords_('TRANSAKSI_IURAN').forEach(function (row) {
    const key = String(row.memberId);
    const current = allByMember[key];
    if (!current || String(row.periodId) > String(current.periodId) || String(row.periodId) === String(current.periodId) && String(row.updatedAt || row.createdAt || row.date) >= String(current.updatedAt || current.createdAt || current.date)) {
      allByMember[key] = row;
    }
  });
  Object.keys(allByMember).forEach(function (memberId) {
    updateMasterBalance_(memberId, Number(allByMember[memberId].arrears) || 0, Number(allByMember[memberId].refundDebt) || 0);
  });
  props.setProperty('LEGACY_IURAN_MIGRATED', 'true');
}

function createInitialAdmin() {
  setupSheets();
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty('INITIAL_ADMIN_USERNAME');
  const password = props.getProperty('INITIAL_ADMIN_PASSWORD');
  const name = props.getProperty('INITIAL_ADMIN_NAME') || 'Administrator TAKORA';
  if (!username || !password || password.length < 12) {
    throw new Error('Atur INITIAL_ADMIN_USERNAME dan password minimal 12 karakter di Script Properties sebelum menjalankan fungsi ini.');
  }
  if (readRecords_('Users').some(function (user) { return user.username === username; })) {
    throw new Error('Username admin tersebut sudah ada.');
  }
  const salt = Utilities.getUuid();
  const now = new Date().toISOString();
  appendRecord_('Users', {
    id: Utilities.getUuid(), name: name, username: username,
    passwordHash: hashPassword_(password, salt), salt: salt,
    role: 'Admin', status: 'Aktif', createdAt: now, lastLoginAt: '',
  });
  return 'Admin awal dibuat: ' + username;
}

function login_(username, password) {
  if (!username || !password) throw new Error('Username dan kata sandi wajib diisi.');
  const users = readRecords_('Users');
  const user = users.find(function (item) { return String(item.username).toLowerCase() === String(username).toLowerCase(); });
  if (!user || user.status !== 'Aktif' || hashPassword_(password, user.salt) !== user.passwordHash) {
    throw new Error('Username atau kata sandi tidak valid.');
  }
  const token = Utilities.getUuid() + Utilities.getUuid();
  const safeUser = { id: user.id, name: user.name, username: user.username, role: user.role };
  CacheService.getScriptCache().put('session:' + token, JSON.stringify(safeUser), SESSION_TTL_SECONDS);
  updateRecord_('Users', { ...user, lastLoginAt: new Date().toISOString() }, { id: 'system', username: 'system', role: 'Admin' }, true);
  return { ok: true, token: token, user: safeUser, expiresIn: SESSION_TTL_SECONDS };
}

function authenticate_(token) {
  if (!token) throw new Error('Sesi tidak ditemukan. Silakan masuk kembali.');
  const cached = CacheService.getScriptCache().get('session:' + token);
  if (!cached) throw new Error('Sesi berakhir atau tidak valid. Silakan masuk kembali.');
  const user = JSON.parse(cached);
  const current = readRecords_('Users').find(function (item) { return item.id === user.id; });
  if (!current || current.status !== 'Aktif') {
    CacheService.getScriptCache().remove('session:' + token);
    throw new Error('Akun tidak aktif.');
  }
  return { id: current.id, name: current.name, username: current.username, role: current.role };
}

function assertRole_(user, action, module) {
  const role = user && user.role;
  if (!role) throw new Error('Sesi tidak valid.');
  if (role === 'Admin') return;
  if (action === 'summary' || action === 'list') {
    if (action === 'list' && module === 'MASTER_ANGGOTA' && ['Ketua', 'Bendahara'].indexOf(role) !== -1) return;
    if (role === 'Ketua' || role === 'Bendahara' && (FINANCE_MODULES.indexOf(module) !== -1 || SECRETARY_MODULES.indexOf(module) !== -1) || role === 'Sekretaris' && SECRETARY_MODULES.indexOf(module) !== -1) return;
    throw new Error('Peran Anda tidak memiliki akses baca untuk data ini.');
  }
  if (action === 'approve') {
    if (role === 'Ketua') return;
    throw new Error('Hanya Ketua atau Admin yang dapat menyetujui laporan.');
  }
  if (action === 'upload') {
    const folder = String(module).toLowerCase();
    if (role === 'Sekretaris' && ['assets', 'activities', 'sukaduka'].indexOf(folder) !== -1) return;
    if (role === 'Bendahara' && ['assets', 'activities'].indexOf(folder) !== -1) return;
    if (role === 'Bendahara' && folder === 'sukaduka') return;
    throw new Error('Peran Anda tidak diizinkan mengunggah file ke folder tersebut.');
  }
  if (action === 'create' || action === 'update' || action === 'delete') {
    if (role === 'Bendahara' && (FINANCE_MODULES.indexOf(module) !== -1 || SECRETARY_MODULES.indexOf(module) !== -1)) return;
    if (role === 'Sekretaris' && SECRETARY_MODULES.indexOf(module) !== -1) return;
  }
  throw new Error('Peran Anda tidak diizinkan melakukan tindakan ini.');
}

function closeBook_(input, user) {
  const period = String(input.period || '').trim();
  const monthlyTarget = Number(input.monthlyTarget);
  if (!/^\d{4}-\d{2}$/.test(period) || Number(period.slice(5)) < 1 || Number(period.slice(5)) > 12) throw new Error('Periode harus berformat YYYY-MM.');
  if (!Number.isFinite(monthlyTarget) || monthlyTarget < 0) throw new Error('Target iuran tidak valid.');
  if (readRecords_('IuranPeriode').some(function (row) { return row.period === period; })) throw new Error('Periode tersebut sudah pernah dibuka.');

  const activeIds = {};
  readRecords_('Anggota').filter(function (member) { return member.status === 'Aktif'; }).forEach(function (member) { activeIds[String(member.id)] = true; });
  const members = getMasterAnggota_().filter(function (member) { return activeIds[String(member.ID)]; });
  if (!members.length) throw new Error('Belum ada anggota aktif untuk dibebankan iuran.');
  let carryArrears = 0;
  let carryRefundDebt = 0;
  const now = new Date().toISOString();
  const generated = members.map(function (member) {
    const openingArrears = Number(member.Sisa_Hutang_Iuran || 0);
    const openingRefundDebt = Number(member.Sisa_Hutang_Kembalian || 0);
    carryArrears += openingArrears;
    carryRefundDebt += openingRefundDebt;
    const entry = {
      id: Utilities.getUuid(), date: input.date || now.slice(0, 10), periodId: period,
      memberId: member.ID, memberName: member.Nama, target: openingArrears + monthlyTarget,
      allocatedContribution: 0, cashPhysical: 0, changeDue: 0, changePaid: 0,
      openingArrears: openingArrears, arrears: openingArrears + monthlyTarget,
      openingRefundDebt: openingRefundDebt, refundDebtAdded: 0, refundDebt: openingRefundDebt,
      notes: 'Tagihan dibuat saat tutup buku ' + period,
      createdBy: user.username, createdAt: now, updatedAt: now,
    };
    return entry;
  });
  if (generated.length) {
    const transactionSheet = spreadsheet_().getSheetByName('TRANSAKSI_IURAN');
    transactionSheet.getRange(transactionSheet.getLastRow() + 1, 1, generated.length, SHEETS.TRANSAKSI_IURAN.length)
      .setValues(generated.map(function (entry) { return SHEETS.TRANSAKSI_IURAN.map(function (key) { return normalizeCell_(entry[key]); }); }));
    const masterSheet = spreadsheet_().getSheetByName('MASTER_ANGGOTA');
    const masterValues = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, SHEETS.MASTER_ANGGOTA.length).getValues();
    const billedById = {};
    generated.forEach(function (entry) { billedById[String(entry.memberId)] = entry; });
    masterValues.forEach(function (row) {
      const entry = billedById[String(row[0])];
      if (entry) { row[2] = entry.arrears; row[3] = entry.refundDebt; }
    });
    masterSheet.getRange(2, 1, masterValues.length, SHEETS.MASTER_ANGGOTA.length).setValues(masterValues);
  }
  const periodRecord = {
    id: Utilities.getUuid(), period: period, openedAt: now, closedAt: '', status: 'Terbuka',
    monthlyTarget: monthlyTarget, memberCount: members.length, totalBilled: monthlyTarget * members.length,
    carryArrears: carryArrears, carryRefundDebt: carryRefundDebt,
    notes: input.notes || '', createdBy: user.username,
  };
  readRecords_('IuranPeriode').filter(function (row) { return row.status === 'Terbuka'; }).forEach(function (row) {
    updateRecord_('IuranPeriode', { ...row, status: 'Ditutup', closedAt: now }, user, true);
  });
  appendRecord_('IuranPeriode', periodRecord);
  audit_(user, 'closeBook', 'IuranPeriode', periodRecord.id, period);
  return { period: periodRecord, generated: generated.length, carriedArrears: carryArrears, carriedRefundDebt: carryRefundDebt };
}

function batchPayments_(module, records, user) {
  if (module !== 'TRANSAKSI_IURAN' && module !== 'Sukaduka') throw new Error('Input massal hanya tersedia untuk iuran dan sukaduka.');
  if (!Array.isArray(records) || !records.length || records.length > 500) throw new Error('Pilih 1 sampai 500 pembayaran untuk diproses.');
  const members = getMasterAnggota_();
  const memberById = {};
  members.forEach(function (member) { memberById[String(member.ID)] = member; });
  const existingById = {};
  readRecords_(module).forEach(function (row) { existingById[String(row.id)] = row; });
  const seen = {};
  const seenIds = {};
  const updates = {};
  const now = new Date().toISOString();
  const cleanRows = records.map(function (record) {
    const memberId = String(record.memberId || '').trim();
    const member = memberById[memberId];
    if (!member) throw new Error('Anggota tidak ditemukan pada baris input massal: ' + (record.memberName || memberId || '(tanpa nama)'));
    if (seen[memberId]) throw new Error('Anggota ' + member.Nama + ' tercantum lebih dari sekali. Gabungkan pembayarannya dalam satu baris.');
    seen[memberId] = true;
    const requestId = String(record.id || '').trim();
    if (requestId && seenIds[requestId]) throw new Error('ID transaksi yang sama tercantum lebih dari sekali.');
    if (requestId) seenIds[requestId] = true;
    const existing = requestId ? existingById[requestId] : null;
    if (existing) {
      const matchesRequest = module === 'TRANSAKSI_IURAN'
        ? String(existing.memberId) === memberId
          && String(existing.date) === String(record.date)
          && String(existing.periodId) === String(record.periodId)
          && Number(existing.allocatedContribution) === Number(record.allocatedContribution)
          && Number(existing.chargeAmount || 0) === (Number(record.chargeAmount) || 0)
          && String(existing.sangkepId || '') === String(record.sangkepId || '')
          && Number(existing.cashPhysical) === Number(record.cashPhysical)
          && Number(existing.changePaid || 0) === (Number(record.changePaid) || 0)
          && String(existing.notes || '') === String(record.notes || '')
        : String(existing.memberId) === memberId
          && String(existing.date) === String(record.date)
          && String(existing.purpose || '').trim() === String(record.purpose || '').trim()
          && Number(existing.amount) === Number(record.amount)
          && Number(existing.chargeAmount || 0) === (Number(record.chargeAmount) || 0)
          && String(existing.sangkepId || '') === String(record.sangkepId || '')
          && Number(existing.cashPhysical) === Number(record.cashPhysical)
          && Number(existing.changePaid || 0) === (Number(record.changePaid) || 0)
          && String(existing.notes || '') === String(record.notes || '');
      if (!matchesRequest) throw new Error('ID transaksi iuran sudah dipakai untuk data berbeda. Muat ulang data sebelum membuat transaksi baru.');
      if (module === 'TRANSAKSI_IURAN') {
        const currentArrears = Number(member.Sisa_Hutang_Iuran) || 0;
        const currentRefundDebt = Number(member.Sisa_Hutang_Kembalian) || 0;
        if (currentArrears === (Number(existing.openingArrears) || 0)
          && currentRefundDebt === (Number(existing.openingRefundDebt) || 0)) {
          updates[memberId] = {
            arrears: Number(existing.arrears) || 0,
            refundDebt: Number(existing.refundDebt) || 0,
            sukadukaArrears: Number(member.Sisa_Hutang_Sukaduka) || 0,
          };
        }
      } else {
        const openingRefundDebt = Number(existing.refundDebt) - Number(existing.refundDebtAdded || 0);
        if ((Number(member.Sisa_Hutang_Sukaduka) || 0) === (Number(existing.openingArrears) || 0)
          && (Number(member.Sisa_Hutang_Kembalian) || 0) === openingRefundDebt) {
          updates[memberId] = {
            arrears: Number(member.Sisa_Hutang_Iuran) || 0,
            refundDebt: Number(existing.refundDebt) || 0,
            sukadukaArrears: Number(existing.arrears) || 0,
          };
        }
      }
      return existing;
    }
    if (!record.date) throw new Error('Tanggal wajib diisi untuk ' + member.Nama + '.');
    const balance = updates[memberId] || {
      arrears: Number(member.Sisa_Hutang_Iuran) || 0,
      refundDebt: Number(member.Sisa_Hutang_Kembalian) || 0,
      sukadukaArrears: Number(member.Sisa_Hutang_Sukaduka) || 0,
    };
    let entry;
    if (module === 'TRANSAKSI_IURAN') {
      const periodId = String(record.periodId || '').trim();
      const allocated = Number(record.allocatedContribution);
      const cash = Number(record.cashPhysical);
      const changePaid = Number(record.changePaid) || 0;
      const chargeAmount = Number(record.chargeAmount) || 0;
      const sangkepId = String(record.sangkepId || '');
      if (!/^\d{4}-\d{2}$/.test(periodId)) throw new Error('Periode tidak valid untuk ' + member.Nama + '.');
      if (![allocated, cash, changePaid, chargeAmount].every(Number.isFinite) || allocated < 0 || chargeAmount < 0
        || (sangkepId ? chargeAmount <= 0 || allocated > chargeAmount : allocated <= 0)
        || cash < allocated || changePaid < 0) throw new Error('Nominal iuran tidak valid untuk ' + member.Nama + '.');
      const changeDue = cash - allocated;
      if (changePaid > balance.refundDebt + changeDue) throw new Error('Kembalian yang diberikan melebihi kewajiban untuk ' + member.Nama + '.');
      const refundDebt = Math.max(0, balance.refundDebt + changeDue - changePaid);
      entry = {
        id: requestId || Utilities.getUuid(), date: record.date, periodId: periodId, memberId: member.ID, memberName: member.Nama,
        target: balance.arrears + chargeAmount, allocatedContribution: allocated, cashPhysical: cash, changeDue: changeDue,
        changePaid: changePaid, openingArrears: balance.arrears, arrears: Math.max(0, balance.arrears + chargeAmount - allocated),
        openingRefundDebt: balance.refundDebt, refundDebtAdded: refundDebt - balance.refundDebt,
        refundDebt: refundDebt, notes: String(record.notes || ''), createdBy: user.username,
        chargeAmount: chargeAmount, sangkepId: sangkepId,
        createdAt: now, updatedAt: now,
      };
      balance.arrears = entry.arrears;
      balance.refundDebt = refundDebt;
    } else {
      const amount = Number(record.amount);
      const cash = Number(record.cashPhysical);
      const changePaid = Number(record.changePaid) || 0;
      const chargeAmount = Number(record.chargeAmount) || 0;
      const openingArrears = balance.sukadukaArrears;
      const purpose = String(record.purpose || '').trim();
      if (!purpose || ![amount, cash, changePaid, chargeAmount].every(Number.isFinite) || amount < 0 || chargeAmount < 0 || amount + chargeAmount <= 0 || cash < amount || changePaid < 0) throw new Error('Data pembayaran sukaduka tidak valid untuk ' + member.Nama + '.');
      const changeDue = cash - amount;
      if (changePaid > balance.refundDebt + changeDue) throw new Error('Kembalian yang diberikan melebihi kewajiban untuk ' + member.Nama + '.');
      const refundDebt = Math.max(0, balance.refundDebt + changeDue - changePaid);
      entry = {
        id: requestId || Utilities.getUuid(), date: record.date, direction: 'Masuk', recipient: member.Nama, purpose: purpose,
        amount: amount, notes: String(record.notes || ''), createdBy: user.username, createdAt: now,
        memberId: member.ID, memberName: member.Nama, cashPhysical: cash, changeDue: changeDue,
        changePaid: changePaid, refundDebtAdded: refundDebt - balance.refundDebt,
        refundDebt: refundDebt, chargeAmount: chargeAmount, openingArrears: openingArrears,
        arrears: Math.max(0, openingArrears + chargeAmount - amount), proofPhotoUrl: '',
        sangkepId: String(record.sangkepId || ''),
      };
      balance.refundDebt = refundDebt;
      balance.sukadukaArrears = entry.arrears;
    }
    updates[memberId] = balance;
    return entry;
  });

  const rowsToInsert = cleanRows.filter(function (entry) { return !existingById[String(entry.id)]; });
  try {
    const sheet = spreadsheet_().getSheetByName(module);
    const headers = SHEETS[module];
    if (rowsToInsert.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, headers.length)
        .setValues(rowsToInsert.map(function (entry) { return headers.map(function (key) { return normalizeCell_(entry[key]); }); }));
    }
    const masterSheet = spreadsheet_().getSheetByName('MASTER_ANGGOTA');
    if (Object.keys(updates).length) {
      const masterValues = masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, SHEETS.MASTER_ANGGOTA.length).getValues();
      masterValues.forEach(function (row) {
        const update = updates[String(row[0])];
        if (!update) return;
        row[2] = update.arrears;
        row[3] = update.refundDebt;
        row[4] = update.sukadukaArrears;
      });
      masterSheet.getRange(2, 1, masterValues.length, SHEETS.MASTER_ANGGOTA.length).setValues(masterValues);
    }
    const auditSheet = spreadsheet_().getSheetByName('AuditLog');
    const auditedIds = {};
    readAuditLog_().forEach(function (row) {
      if (row.action === 'batchCreate' && row.module === module) auditedIds[String(row.recordId)] = true;
    });
    const auditRows = cleanRows.filter(function (entry) { return !auditedIds[String(entry.id)]; }).map(function (entry) {
      return [Utilities.getUuid(), now, user.id, user.username, 'batchCreate', module, entry.id, entry.memberName];
    });
    if (auditRows.length) auditSheet.getRange(auditSheet.getLastRow() + 1, 1, auditRows.length, SHEETS.AuditLog.length).setValues(auditRows);
  } catch (error) {
    error.uncertain = true;
    throw error;
  }
  return {
    records: cleanRows,
    members: Object.keys(seen).map(function (id) {
      const source = memberById[id];
      const update = updates[id];
      return { ID: source.ID, Nama: source.Nama, Sisa_Hutang_Iuran: update ? update.arrears : source.Sisa_Hutang_Iuran, Sisa_Hutang_Kembalian: update ? update.refundDebt : source.Sisa_Hutang_Kembalian, Sisa_Hutang_Sukaduka: update ? update.sukadukaArrears : source.Sisa_Hutang_Sukaduka };
    }),
  };
}

function batchSangkep_(input, participants, user) {
  const event = input || {};
  const eventId = String(event.id || '').trim();
  const date = String(event.date || '').trim();
  const title = String(event.title || '').trim();
  const iuranAmount = Number(event.iuranAmount);
  const sukadukaAmount = Number(event.sukadukaAmount);
  if (!eventId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !title) throw new Error('ID, tanggal, dan nama sangkep wajib diisi.');
  if (![iuranAmount, sukadukaAmount].every(Number.isFinite) || iuranAmount < 0 || sukadukaAmount < 0 || iuranAmount + sukadukaAmount <= 0) {
    throw new Error('Nominal iuran sangkep tidak valid.');
  }
  if (!Array.isArray(participants) || !participants.length || participants.length > 500) throw new Error('Pilih minimal satu warga yang ikut ditagih.');

  const events = readRecords_('Sangkep');
  const existingEvent = events.find(function (row) { return String(row.id) === eventId; });
  if (existingEvent) {
    if (String(existingEvent.date) !== date || String(existingEvent.title) !== title
      || Number(existingEvent.iuranAmount) !== iuranAmount || Number(existingEvent.sukadukaAmount) !== sukadukaAmount) {
      throw new Error('ID sangkep sudah digunakan untuk data yang berbeda. Muat ulang sebelum mencoba lagi.');
    }
    const iuranRecords = readRecords_('TRANSAKSI_IURAN').filter(function (row) { return String(row.sangkepId || '') === eventId; });
    const sukadukaRecords = readRecords_('Sukaduka').filter(function (row) { return String(row.sangkepId || '') === eventId; });
    const ids = {};
    iuranRecords.concat(sukadukaRecords).forEach(function (row) { ids[String(row.memberId)] = true; });
    return {
      event: existingEvent, iuranRecords: iuranRecords, sukadukaRecords: sukadukaRecords,
      members: getMasterAnggota_().filter(function (member) { return ids[String(member.ID)]; }),
      duplicate: true,
    };
  }

  const seen = {};
  const iuranRecords = [];
  const sukadukaRecords = [];
  participants.forEach(function (participant) {
    const memberId = String(participant.memberId || '').trim();
    if (!memberId || seen[memberId]) throw new Error('Warga sangkep tidak valid atau tercantum lebih dari sekali.');
    seen[memberId] = true;
    if (iuranAmount > 0) iuranRecords.push({
      id: eventId + '-IU-' + memberId, sangkepId: eventId, memberId: memberId, date: date,
      periodId: date.slice(0, 7), chargeAmount: iuranAmount,
      allocatedContribution: participant.iuranPaid ? iuranAmount : 0,
      cashPhysical: participant.iuranPaid ? iuranAmount : 0,
      changePaid: 0, notes: 'Sangkep: ' + title,
    });
    if (sukadukaAmount > 0) sukadukaRecords.push({
      id: eventId + '-SK-' + memberId, sangkepId: eventId, memberId: memberId, date: date,
      chargeAmount: sukadukaAmount, amount: participant.sukadukaPaid ? sukadukaAmount : 0,
      cashPhysical: participant.sukadukaPaid ? sukadukaAmount : 0,
      changePaid: 0, purpose: 'Iuran Sukaduka Sangkep: ' + title, notes: 'Sangkep: ' + title,
    });
  });

  const savedIuran = iuranRecords.length ? batchPayments_('TRANSAKSI_IURAN', iuranRecords, user).records : [];
  const savedSukaduka = sukadukaRecords.length ? batchPayments_('Sukaduka', sukadukaRecords, user).records : [];
  const eventRecord = {
    id: eventId, date: date, title: title, iuranAmount: iuranAmount, sukadukaAmount: sukadukaAmount,
    memberCount: participants.length, createdBy: user.username, createdAt: new Date().toISOString(),
  };
  try {
    appendRecord_('Sangkep', eventRecord);
  } catch (error) {
    error.uncertain = true;
    throw error;
  }
  const memberIds = {};
  participants.forEach(function (participant) { memberIds[String(participant.memberId)] = true; });
  return {
    event: eventRecord, iuranRecords: savedIuran, sukadukaRecords: savedSukaduka,
    members: getMasterAnggota_().filter(function (member) { return memberIds[String(member.ID)]; }),
  };
}

function batchCreateRecords_(module, records, user) {
  if (module !== 'Punia' && module !== 'Piodalan') throw new Error('Input basket hanya tersedia untuk Dana Punia dan Piodalan.');
  if (!Array.isArray(records) || !records.length || records.length > 500) throw new Error('Pilih 1 sampai 500 baris untuk diproses.');
  const now = new Date().toISOString();
  const membersById = {};
  if (module === 'Piodalan') {
    readRecords_('Anggota').filter(function (member) { return member.status === 'Aktif'; }).forEach(function (member) { membersById[String(member.id)] = member; });
  }
  const existingById = {};
  readRecords_(module).forEach(function (record) { existingById[String(record.id)] = record; });
  const seenIds = {};
  const cleanRows = records.map(function (record, index) {
    const clean = sanitizeRecord_(module, record || {});
    clean.id = clean.id || Utilities.getUuid();
    if (seenIds[String(clean.id)]) throw new Error('ID transaksi yang sama tercantum lebih dari sekali.');
    seenIds[String(clean.id)] = true;
    const existing = existingById[String(clean.id)];
    if (existing) {
      if (!recordPayloadMatches_(existing, clean)) throw new Error('ID transaksi sudah dipakai untuk data berbeda. Muat ulang data sebelum membuat transaksi baru.');
      return existing;
    }
    clean.createdBy = user.username;
    clean.createdAt = now;
    if (module === 'Punia') validatePuniaRecord_(clean, index + 1);
    else {
      if (clean.category === 'Wijilan / Setoran wajib' && clean.memberId) {
        const member = membersById[String(clean.memberId)];
        if (!member) throw new Error('Anggota tidak aktif atau tidak ditemukan pada baris ' + (index + 1) + '.');
        clean.donor = member.memberName;
      }
      validatePiodalanRecord_(clean, index + 1);
    }
    return clean;
  });
  const rowsToInsert = cleanRows.filter(function (record) { return !existingById[String(record.id)]; });
  try {
    const headers = SHEETS[module];
    const sheet = spreadsheet_().getSheetByName(module);
    if (rowsToInsert.length) sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, headers.length)
      .setValues(rowsToInsert.map(function (record) { return headers.map(function (key) { return normalizeCell_(record[key]); }); }));
    const auditSheet = spreadsheet_().getSheetByName('AuditLog');
    const auditedIds = {};
    readAuditLog_().forEach(function (row) {
      if (row.action === 'batchCreate' && row.module === module) auditedIds[String(row.recordId)] = true;
    });
    const auditRows = cleanRows.filter(function (record) { return !auditedIds[String(record.id)]; }).map(function (record) {
      return [Utilities.getUuid(), now, user.id, user.username, 'batchCreate', module, record.id, record.donor || record.eventName || ''];
    });
    if (auditRows.length) auditSheet.getRange(auditSheet.getLastRow() + 1, 1, auditRows.length, SHEETS.AuditLog.length).setValues(auditRows);
  } catch (error) {
    error.uncertain = true;
    throw error;
  }
  return { records: cleanRows };
}

function validatePuniaRecord_(record, rowNumber) {
  if (!record.date || !String(record.donor || '').trim()) throw new Error('Tanggal dan nama pemberi wajib diisi pada baris ' + rowNumber + '.');
  if (['Uang Tunai', 'Wijilan / Setoran wajib', 'Barang'].indexOf(record.donationType) === -1) throw new Error('Jenis punia tidak valid pada baris ' + rowNumber + '.');
  const amount = Number(record.amount);
  const quantity = Number(record.quantity) || 0;
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Nominal/nilai punia tidak valid pada baris ' + rowNumber + '.');
  if (record.donationType === 'Barang') {
    if (!String(record.itemName || '').trim() || !Number.isInteger(quantity) || quantity < 1) throw new Error('Nama dan jumlah barang wajib diisi pada baris ' + rowNumber + '.');
    record.unit = String(record.unit || 'unit').trim() || 'unit';
  } else if (amount <= 0) {
    throw new Error('Nominal punia uang harus lebih dari nol pada baris ' + rowNumber + '.');
  } else {
    record.unit = '';
  }
  record.donor = String(record.donor).trim();
  record.quantity = quantity;
  record.amount = amount;
}

function validatePiodalanRecord_(record, rowNumber) {
  if (!record.date || !String(record.eventName || '').trim() || !record.category || !record.direction) {
    throw new Error('Tanggal, nama piodalan, kategori, dan arus wajib diisi pada baris ' + rowNumber + '.');
  }
  if (['Saldo awal', 'Punia uang', 'Punia barang', 'Wijilan / Setoran wajib', 'Belanja', 'Sesari piodalan'].indexOf(record.category) === -1) {
    throw new Error('Kategori piodalan tidak valid pada baris ' + rowNumber + '.');
  }
  if (['Masuk', 'Keluar'].indexOf(record.direction) === -1) throw new Error('Arus kas tidak valid pada baris ' + rowNumber + '.');
  const amount = Number(record.amount) || 0;
  const chargeAmount = record.chargeAmount === '' || record.chargeAmount === null || record.chargeAmount === undefined ? 0 : Number(record.chargeAmount);
  const quantity = Number(record.quantity) || 0;
  if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(chargeAmount) || chargeAmount < 0) throw new Error('Nominal piodalan tidak valid pada baris ' + rowNumber + '.');
  if (record.category === 'Punia barang') {
    if (record.direction !== 'Masuk' || !String(record.donor || '').trim() || !String(record.itemName || '').trim() || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Punia barang memerlukan nama pemberi, barang, dan jumlah pada baris ' + rowNumber + '.');
    }
    record.unit = String(record.unit || 'unit').trim() || 'unit';
  } else if (record.category === 'Punia uang') {
    if (record.direction !== 'Masuk' || !String(record.donor || '').trim() || amount <= 0) throw new Error('Punia uang memerlukan nama pemberi dan nominal masuk pada baris ' + rowNumber + '.');
    record.unit = '';
  } else if (record.category === 'Wijilan / Setoran wajib') {
    if (record.direction !== 'Masuk' || !record.memberId || !String(record.donor || '').trim() || amount <= 0 && chargeAmount <= 0) {
      throw new Error('Wijilan memerlukan anggota, nama pemberi, dan tagihan atau pembayaran pada baris ' + rowNumber + '.');
    }
    record.unit = '';
  } else if (amount <= 0) {
    throw new Error('Nominal transaksi harus lebih dari nol pada baris ' + rowNumber + '.');
  }
  record.eventName = String(record.eventName).trim();
  record.donor = String(record.donor || '').trim();
  record.quantity = quantity;
  record.amount = amount;
  record.chargeAmount = chargeAmount;
}

function attachActiveWijilanMember_(record) {
  const member = readRecords_('Anggota').find(function (item) {
    return String(item.id) === String(record.memberId) && item.status === 'Aktif';
  });
  if (!member) throw new Error('Anggota Wijilan harus dipilih dari daftar anggota aktif.');
  record.memberId = member.id;
  record.donor = member.memberName;
}

function approveReport_(input, user) {
  const period = String(input.period || '').trim();
  if (!period) throw new Error('Periode laporan wajib diisi.');
  const existing = readRecords_('LaporanPersetujuan').find(function (row) { return row.period === period; });
  const record = {
    id: existing ? existing.id : Utilities.getUuid(), period: period, status: 'Disetujui',
    approvedBy: user.username, approvedAt: new Date().toISOString(), notes: input.notes || '',
  };
  if (existing) updateRecord_('LaporanPersetujuan', record, user);
  else appendRecord_('LaporanPersetujuan', record);
  audit_(user, 'approveReport', 'LaporanPersetujuan', record.id, period);
  return { approval: record };
}

function uploadFile_(input) {
  const mimeType = String(input.mimeType || '');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.indexOf(mimeType) === -1) throw new Error('Format foto harus JPG, PNG, WEBP, atau GIF.');
  const bytes = Utilities.base64Decode(String(input.base64 || ''));
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error('Ukuran foto harus antara 1 byte dan 5 MB.');
  const folder = getUploadFolder_(input.folder || 'assets');
  const safeName = String(input.fileName || 'foto-aset').replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
  const file = folder.createFile(Utilities.newBlob(bytes, mimeType, safeName));
  if (String(input.folder).toLowerCase() !== 'sukaduka') file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { fileId: file.getId(), url: 'https://drive.google.com/uc?export=view&id=' + file.getId(), name: file.getName() };
}

function getUploadFolder_(folderKey) {
  const config = {
    assets: { property: 'ASSET_PHOTO_FOLDER_ID', name: 'Foto Aset' },
    activities: { property: 'ACTIVITY_PHOTO_FOLDER_ID', name: 'Foto Kegiatan' },
    sukaduka: { property: 'SUKADUKA_PHOTO_FOLDER_ID', name: 'Foto Sukaduka' },
  }[String(folderKey).toLowerCase()];
  if (!config) throw new Error('Folder upload tidak dikenal.');
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty(config.property);
  if (savedId) return DriveApp.getFolderById(savedId);
  const parentId = props.getProperty('DRIVE_FOLDER_ID');
  const parent = parentId ? DriveApp.getFolderById(parentId) : DriveApp.getRootFolder();
  const matches = parent.getFoldersByName(config.name);
  const folder = matches.hasNext() ? matches.next() : parent.createFolder(config.name);
  props.setProperty(config.property, folder.getId());
  return folder;
}

function publicGallery_() {
  return readRecords_('KegiatanMedia').filter(function (item) {
    return item.visibility === 'Publik';
  }).sort(function (left, right) {
    return String(right.eventDate || right.createdAt || '').localeCompare(String(left.eventDate || left.createdAt || ''));
  }).map(function (item) {
    delete item.createdBy;
    item.photoUrl = driveImageUrl_(item.photoUrl);
    return item;
  });
}

function driveImageUrl_(value) {
  const url = String(value || '');
  const match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?.*?id=|thumbnail\?id=))([\w-]+)/);
  return match ? 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1200' : url;
}

function assetInventory_(snapshot) {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const rentals = summaryRows_(snapshot, 'SewaAset');
  return summaryRows_(snapshot, 'Aset').map(function (asset) {
    const currentRentals = rentals.filter(function (rental) {
      return String(rental.assetId) === String(asset.id) && !['Dibatalkan', 'Selesai'].includes(rental.status) && String(rental.startDate || '').slice(0, 10) <= today && String(rental.endDate || '').slice(0, 10) >= today;
    });
    const rented = currentRentals.reduce(function (sum, rental) { return sum + Number(rental.quantity || 0); }, 0);
    return {
      id: asset.id,
      assetName: asset.assetName,
      category: asset.category,
      condition: asset.condition,
      quantity: Number(asset.quantity) || 0,
      purchasePrice: Number(asset.purchasePrice) || 0,
      available: Math.max(0, (Number(asset.quantity) || 0) - rented),
      rentalRateSemeton: Number(asset.rentalRateSemeton || asset.rentalRate) || 0,
      rentalRateLuar: Number(asset.rentalRateLuar || asset.rentalRate) || 0,
      photoUrl: driveImageUrl_(asset.photoUrl),
      currentRenter: currentRentals.map(function (rental) { return rental.renter + ' (' + (Number(rental.quantity) || 0) + ')'; }).join(', '),
      currentRentals: currentRentals.map(function (rental) {
        return { renter: rental.renter, quantity: Number(rental.quantity) || 0, startDate: rental.startDate, endDate: rental.endDate };
      }),
    };
  });
}

function validateActivityMedia_(record) {
  if (!record.title || !record.eventDate) throw new Error('Judul dan tanggal kegiatan wajib diisi.');
  if (['photo', 'youtube'].indexOf(record.mediaType) === -1) throw new Error('Jenis media tidak valid.');
  if (record.mediaType === 'photo' && !record.photoUrl) throw new Error('Foto kegiatan harus diunggah terlebih dahulu.');
  if (record.mediaType === 'youtube') {
    let host = '';
    try { host = new URL(String(record.youtubeUrl || '')).hostname.toLowerCase(); } catch (error) {}
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].indexOf(host) === -1) throw new Error('Masukkan URL video YouTube yang valid.');
  }
  if (['Publik', 'Draft'].indexOf(record.visibility || 'Publik') === -1) throw new Error('Visibilitas media tidak valid.');
  record.visibility = record.visibility || 'Publik';
}

function createRecord_(module, record, user) {
  validateModule_(module);
  if (module === 'TRANSAKSI_IURAN') return saveIuranTransaction_('create', record, user);
  if (module === 'Sukaduka' && record.direction === 'Masuk') return saveSukadukaIncoming_('create', record, user);
  const clean = sanitizeRecord_(module, record);
  clean.id = clean.id || Utilities.getUuid();
  const duplicate = readRecords_(module).find(function (row) { return String(row.id) === String(clean.id); });
  if (duplicate) {
    if (!recordPayloadMatches_(duplicate, clean)) throw new Error('ID transaksi sudah dipakai untuk data berbeda. Muat ulang data sebelum membuat transaksi baru.');
    if (!readAuditLog_().some(function (row) { return row.action === 'create' && row.module === module && String(row.recordId) === String(clean.id); })) {
      audit_(user, 'create', module, clean.id, 'Pemulihan audit saat konfirmasi ulang');
    }
    return { record: duplicate };
  }
  if (module === 'Users') {
    const password = String(record.password || '');
    if (password.length < 12) throw new Error('Kata sandi pengguna minimal 12 karakter.');
    if (!clean.username || readRecords_('Users').some(function (item) { return String(item.username).toLowerCase() === String(clean.username).toLowerCase(); })) throw new Error('Username kosong atau sudah digunakan.');
    clean.salt = Utilities.getUuid();
    clean.passwordHash = hashPassword_(password, clean.salt);
    clean.status = clean.status || 'Aktif';
  }
  clean.createdBy = clean.createdBy || user.username;
  clean.createdAt = clean.createdAt || new Date().toISOString();
  if (module === 'SewaAset') validateRentalAvailability_(clean);
  if (module === 'PengeluaranIuran') validateIuranExpense_(clean);
  if (module === 'Punia') validatePuniaRecord_(clean, 1);
  if (module === 'Piodalan') {
    if (clean.category === 'Wijilan / Setoran wajib') attachActiveWijilanMember_(clean);
    validatePiodalanRecord_(clean, 1);
  }
  if (module === 'KegiatanMedia') validateActivityMedia_(clean);
  appendRecord_(module, clean);
  if (module === 'Anggota') upsertMasterAnggota_(clean);
  audit_(user, 'create', module, clean.id, '');
  return { record: clean };
}

function recordPayloadMatches_(existing, record) {
  const ignored = { id: true, createdBy: true, createdAt: true, updatedAt: true, password: true, passwordHash: true, salt: true };
  return Object.keys(record).filter(function (key) { return !ignored[key]; }).every(function (key) {
    const oldValue = existing[key] === null || existing[key] === undefined ? '' : existing[key];
    const newValue = record[key] === null || record[key] === undefined ? '' : record[key];
    return String(oldValue) === String(newValue);
  });
}

function updateRecord_(module, record, user, internal) {
  validateModule_(module);
  if (!internal && module === 'TRANSAKSI_IURAN') return saveIuranTransaction_('update', record, user);
  if (!internal && module === 'Sukaduka') {
    const prior = readRecords_('Sukaduka').find(function (row) { return String(row.id) === String(record.id); });
    if (prior && prior.direction !== record.direction) throw new Error('Jenis arus kas transaksi tidak dapat diganti saat edit. Buat transaksi baru jika arusnya berbeda.');
    if (record.direction === 'Masuk') return saveSukadukaIncoming_('update', record, user);
  }
  if (!record.id) throw new Error('ID data wajib diisi untuk pembaruan.');
  const sheet = spreadsheet_().getSheetByName(module);
  const headers = SHEETS[module];
  const idColumn = headers.indexOf('id') + 1;
  const values = sheet.getDataRange().getValues();
  let rowNumber = -1;
  for (let index = 1; index < values.length; index++) {
    if (String(values[index][idColumn - 1]) === String(record.id)) { rowNumber = index + 1; break; }
  }
  if (rowNumber < 0) throw new Error('Data tidak ditemukan.');
  const existing = rowToObject_(headers, values[rowNumber - 1]);
  const clean = sanitizeRecord_(module, { ...existing, ...record });
  if (module === 'Users') {
    clean.passwordHash = existing.passwordHash;
    clean.salt = existing.salt;
    if (record.password) {
      if (String(record.password).length < 12) throw new Error('Kata sandi pengguna minimal 12 karakter.');
      clean.salt = Utilities.getUuid();
      clean.passwordHash = hashPassword_(record.password, clean.salt);
    }
  }
  if (module === 'SewaAset') validateRentalAvailability_(clean, clean.id);
  if (module === 'PengeluaranIuran') validateIuranExpense_(clean);
  if (module === 'Punia') validatePuniaRecord_(clean, 1);
  if (module === 'Piodalan') {
    if (clean.category === 'Wijilan / Setoran wajib') attachActiveWijilanMember_(clean);
    validatePiodalanRecord_(clean, 1);
  }
  if (module === 'KegiatanMedia') validateActivityMedia_(clean);
  if (headers.indexOf('updatedAt') !== -1) clean.updatedAt = new Date().toISOString();
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map(function (key) { return normalizeCell_(clean[key]); })]);
  if (module === 'Anggota') upsertMasterAnggota_(clean);
  if (!internal) audit_(user, 'update', module, clean.id, '');
  return { record: clean };
}

function deleteRecord_(module, id, user) {
  validateModule_(module);
  if (module === 'TRANSAKSI_IURAN') return deleteIuranTransaction_(id, user);
  if (module === 'Sukaduka') {
    const sukaduka = readRecords_('Sukaduka').find(function (row) { return String(row.id) === String(id); });
    if (sukaduka && sukaduka.memberId) return deleteSukadukaIncoming_(sukaduka, user);
  }
  const sheet = spreadsheet_().getSheetByName(module);
  const headers = SHEETS[module];
  const index = headers.indexOf('id');
  const values = sheet.getDataRange().getValues();
  for (let row = 1; row < values.length; row++) {
    if (String(values[row][index]) === String(id)) {
      sheet.deleteRow(row + 1);
      audit_(user, 'delete', module, id, '');
      return { id: id };
    }
  }
  throw new Error('Data tidak ditemukan.');
}

function getMasterAnggota_(snapshot) {
  const sheet = spreadsheet_().getSheetByName('MASTER_ANGGOTA');
  if (!sheet) throw new Error('Sheet MASTER_ANGGOTA tidak ditemukan. Jalankan setupSheets().');
  const expectedHeaders = SHEETS.MASTER_ANGGOTA;
  const actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  if (expectedHeaders.some(function (header, index) { return actualHeaders[index] !== header; })) {
    throw new Error('Header MASTER_ANGGOTA harus: ' + expectedHeaders.join(', '));
  }
  const currentMembers = snapshot ? snapshot.Anggota : readRecords_('Anggota');
  const currentMemberIds = {};
  const currentMembersById = {};
  currentMembers.forEach(function (member) {
    currentMemberIds[String(member.id)] = true;
    currentMembersById[String(member.id)] = member;
  });
  const master = (snapshot ? snapshot.MASTER_ANGGOTA : readRecords_('MASTER_ANGGOTA')).filter(function (member) {
    return member.ID !== '' && currentMemberIds[String(member.ID)];
  });
  const byId = {};
  master.forEach(function (member) { byId[String(member.ID)] = member; });
  currentMembers.forEach(function (member) {
    const id = String(member.id);
    if (!byId[id]) byId[id] = { ID: member.id, Nama: member.memberName, Sisa_Hutang_Iuran: 0, Sisa_Hutang_Kembalian: 0, Sisa_Hutang_Sukaduka: 0 };
  });
  const latestBalances = {};
  (snapshot ? snapshot.TRANSAKSI_IURAN : readRecords_('TRANSAKSI_IURAN')).forEach(function (row) {
    const id = String(row.memberId);
    const current = latestBalances[id];
    const timestamp = String(row.updatedAt || row.createdAt || row.date || '');
    if (!current || String(row.periodId) > String(current.periodId) || String(row.periodId) === String(current.periodId) && timestamp >= current.timestamp) {
      latestBalances[id] = { periodId: row.periodId, timestamp: timestamp, arrears: row.arrears, refundDebt: row.refundDebt };
    }
  });
  const sukadukaArrears = sukadukaArrearsByMember_(snapshot ? snapshot.Sukaduka : readRecords_('Sukaduka'));
  return Object.keys(byId).map(function (id) {
    const member = byId[id];
    member.memberNo = currentMembersById[id] && currentMembersById[id].memberNo || member.memberNo || id;
    const latest = latestBalances[id];
    member.Nama = member.Nama || '';
    member.Sisa_Hutang_Iuran = member.Sisa_Hutang_Iuran === '' || member.Sisa_Hutang_Iuran === null || member.Sisa_Hutang_Iuran === undefined
      ? Number(latest && latest.arrears) || 0 : Number(member.Sisa_Hutang_Iuran) || 0;
    member.Sisa_Hutang_Kembalian = member.Sisa_Hutang_Kembalian === '' || member.Sisa_Hutang_Kembalian === null || member.Sisa_Hutang_Kembalian === undefined
      ? Number(latest && latest.refundDebt) || 0 : Number(member.Sisa_Hutang_Kembalian) || 0;
    member.Sisa_Hutang_Sukaduka = member.Sisa_Hutang_Sukaduka === '' || member.Sisa_Hutang_Sukaduka === null || member.Sisa_Hutang_Sukaduka === undefined
      ? sukadukaArrears[id] || 0 : Number(member.Sisa_Hutang_Sukaduka) || 0;
    return member;
  });
}

function sukadukaArrearsByMember_(rows) {
  const balances = {};
  rows.forEach(function (row) {
    if (!row.memberId || row.chargeAmount === '' || row.chargeAmount === null || row.chargeAmount === undefined) return;
    const memberId = String(row.memberId);
    balances[memberId] = (balances[memberId] || 0) + (Number(row.chargeAmount) || 0) - (Number(row.amount) || 0);
  });
  Object.keys(balances).forEach(function (memberId) { balances[memberId] = Math.max(0, balances[memberId]); });
  return balances;
}

function latestIuranBalance_(memberId) {
  const rows = readRecords_('TRANSAKSI_IURAN').filter(function (row) { return String(row.memberId) === String(memberId); });
  rows.sort(function (left, right) {
    const leftTime = Date.parse(left.updatedAt || left.createdAt || left.date || '') || 0;
    const rightTime = Date.parse(right.updatedAt || right.createdAt || right.date || '') || 0;
    return leftTime - rightTime;
  });
  return rows.length ? rows[rows.length - 1] : null;
}

function upsertMasterAnggota_(member) {
  const sheet = spreadsheet_().getSheetByName('MASTER_ANGGOTA');
  if (!sheet) throw new Error('Sheet MASTER_ANGGOTA tidak ditemukan. Jalankan setupSheets().');
  const values = sheet.getDataRange().getValues();
  const idColumn = SHEETS.MASTER_ANGGOTA.indexOf('ID');
  const rowIndex = values.findIndex(function (row, index) { return index > 0 && String(row[idColumn]) === String(member.id); });
  if (rowIndex > 0) {
    const nameColumn = SHEETS.MASTER_ANGGOTA.indexOf('Nama') + 1;
    sheet.getRange(rowIndex + 1, nameColumn).setValue(member.memberName);
    return;
  }
  const latest = latestIuranBalance_(member.id);
  appendRecord_('MASTER_ANGGOTA', {
    ID: member.id,
    Nama: member.memberName,
    Sisa_Hutang_Iuran: Number(latest && latest.arrears) || 0,
    Sisa_Hutang_Kembalian: Number(latest && latest.refundDebt) || 0,
    Sisa_Hutang_Sukaduka: 0,
  });
}

function findMasterAnggota_(memberId) {
  const sheet = spreadsheet_().getSheetByName('MASTER_ANGGOTA');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('Sheet MASTER_ANGGOTA belum memiliki anggota.');
  const headers = SHEETS.MASTER_ANGGOTA;
  const values = sheet.getDataRange().getValues();
  const idColumn = headers.indexOf('ID');
  for (let index = 1; index < values.length; index++) {
    if (String(values[index][idColumn]) === String(memberId)) {
      const member = rowToObject_(headers, values[index]);
      const directoryMember = readRecords_('Anggota').find(function (item) { return String(item.id) === String(memberId); });
      member.memberNo = directoryMember && directoryMember.memberNo || String(memberId);
      const latest = latestIuranBalance_(memberId);
      member.Sisa_Hutang_Iuran = member.Sisa_Hutang_Iuran === '' || member.Sisa_Hutang_Iuran === null || member.Sisa_Hutang_Iuran === undefined
        ? Number(latest && latest.arrears) || 0 : Number(member.Sisa_Hutang_Iuran) || 0;
      member.Sisa_Hutang_Kembalian = member.Sisa_Hutang_Kembalian === '' || member.Sisa_Hutang_Kembalian === null || member.Sisa_Hutang_Kembalian === undefined
        ? Number(latest && latest.refundDebt) || 0 : Number(member.Sisa_Hutang_Kembalian) || 0;
      member.Sisa_Hutang_Sukaduka = member.Sisa_Hutang_Sukaduka === '' || member.Sisa_Hutang_Sukaduka === null || member.Sisa_Hutang_Sukaduka === undefined
        ? sukadukaArrearsByMember_(readRecords_('Sukaduka'))[String(memberId)] || 0 : Number(member.Sisa_Hutang_Sukaduka) || 0;
      return { sheet: sheet, rowNumber: index + 1, member: member };
    }
  }
  const legacyMember = readRecords_('Anggota').find(function (member) { return String(member.id) === String(memberId); });
  if (legacyMember) {
    upsertMasterAnggota_(legacyMember);
    return findMasterAnggota_(memberId);
  }
  throw new Error('Anggota tidak ditemukan di MASTER_ANGGOTA.');
}

function updateMasterBalance_(memberId, arrears, refundDebt, sukadukaArrears) {
  const location = findMasterAnggota_(memberId);
  const arrearsColumn = SHEETS.MASTER_ANGGOTA.indexOf('Sisa_Hutang_Iuran') + 1;
  const refundColumn = SHEETS.MASTER_ANGGOTA.indexOf('Sisa_Hutang_Kembalian') + 1;
  const sukadukaColumn = SHEETS.MASTER_ANGGOTA.indexOf('Sisa_Hutang_Sukaduka') + 1;
  location.sheet.getRange(location.rowNumber, arrearsColumn).setValue(arrears);
  location.sheet.getRange(location.rowNumber, refundColumn).setValue(refundDebt);
  if (Number.isFinite(sukadukaArrears)) location.sheet.getRange(location.rowNumber, sukadukaColumn).setValue(sukadukaArrears);
  return {
    ID: location.member.ID,
    Nama: location.member.Nama,
    memberNo: location.member.memberNo,
    Sisa_Hutang_Iuran: arrears,
    Sisa_Hutang_Kembalian: refundDebt,
    Sisa_Hutang_Sukaduka: Number.isFinite(sukadukaArrears) ? sukadukaArrears : Number(location.member.Sisa_Hutang_Sukaduka) || 0,
  };
}

function updateMasterRefundDebt_(memberId, refundDebt) {
  const location = findMasterAnggota_(memberId);
  const refundColumn = SHEETS.MASTER_ANGGOTA.indexOf('Sisa_Hutang_Kembalian') + 1;
  location.sheet.getRange(location.rowNumber, refundColumn).setValue(refundDebt);
  return {
    ID: location.member.ID,
    Nama: location.member.Nama,
    memberNo: location.member.memberNo,
    Sisa_Hutang_Iuran: Number(location.member.Sisa_Hutang_Iuran) || 0,
    Sisa_Hutang_Kembalian: refundDebt,
    Sisa_Hutang_Sukaduka: Number(location.member.Sisa_Hutang_Sukaduka) || 0,
  };
}

function adjustMemberBalance_(input, user) {
  const memberId = String(input.memberId || '').trim();
  const arrears = Number(input.arrears);
  const refundDebt = Number(input.refundDebt);
  const sukadukaArrears = Number(input.sukadukaArrears);
  const reason = String(input.reason || '').trim();
  if (!memberId) throw new Error('Pilih anggota yang akan dikoreksi.');
  if (Number.isFinite(arrears) && arrears < 0) throw new Error('Saldo tunggakan iuran harus berupa angka nol atau lebih.');
  if (Number.isFinite(refundDebt) && refundDebt < 0) throw new Error('Saldo kembalian harus berupa angka nol atau lebih.');
  if (Number.isFinite(sukadukaArrears) && sukadukaArrears < 0) throw new Error('Saldo tunggakan Sukaduka harus berupa angka nol atau lebih.');
  if (!reason) throw new Error('Alasan koreksi wajib diisi.');

  const location = findMasterAnggota_(memberId);
  const before = {
    arrears: Number(location.member.Sisa_Hutang_Iuran) || 0,
    refundDebt: Number(location.member.Sisa_Hutang_Kembalian) || 0,
    sukadukaArrears: Number(location.member.Sisa_Hutang_Sukaduka) || 0,
  };
  const member = updateMasterBalance_(memberId,
    Number.isFinite(arrears) ? arrears : Number(location.member.Sisa_Hutang_Iuran) || 0,
    Number.isFinite(refundDebt) ? refundDebt : Number(location.member.Sisa_Hutang_Kembalian) || 0,
    Number.isFinite(sukadukaArrears) ? sukadukaArrears : Number(location.member.Sisa_Hutang_Sukaduka) || 0
  );
  audit_(user, 'adjustBalance', 'MASTER_ANGGOTA', memberId, JSON.stringify({
    reason: reason,
    before: before,
    after: { arrears: member.Sisa_Hutang_Iuran, refundDebt: member.Sisa_Hutang_Kembalian, sukadukaArrears: member.Sisa_Hutang_Sukaduka },
  }));
  return { member: member };
}

function saveIuranTransaction_(mode, input, user) {
  const record = input || {};
  if (!record.memberId) throw new Error('Pilih anggota terlebih dahulu.');
  if (!record.date || !record.periodId) throw new Error('Tanggal dan periode iuran wajib diisi.');
  const existingRows = readRecords_('TRANSAKSI_IURAN');
  const existing = mode === 'update' ? existingRows.find(function (row) { return String(row.id) === String(record.id); }) : null;
  const duplicate = mode === 'create' && record.id ? existingRows.find(function (row) { return String(row.id) === String(record.id); }) : null;
  if (duplicate) {
    const matchesRequest = String(duplicate.memberId) === String(record.memberId)
      && String(duplicate.date) === String(record.date)
      && String(duplicate.periodId) === String(record.periodId)
      && Number(duplicate.allocatedContribution) === Number(record.allocatedContribution)
      && Number(duplicate.cashPhysical) === Number(record.cashPhysical)
      && Number(duplicate.changePaid || 0) === (Number(record.changePaid) || 0)
      && String(duplicate.notes || '') === String(record.notes || '');
    if (!matchesRequest) throw new Error('ID transaksi iuran sudah dipakai untuk data berbeda. Muat ulang data sebelum membuat transaksi baru.');
    if (!readAuditLog_().some(function (row) { return row.action === 'create' && row.module === 'TRANSAKSI_IURAN' && String(row.recordId) === String(duplicate.id); })) {
      audit_(user, 'create', 'TRANSAKSI_IURAN', duplicate.id, duplicate.memberName);
    }
    const memberLocation = findMasterAnggota_(record.memberId);
    const currentArrears = Number(memberLocation.member.Sisa_Hutang_Iuran) || 0;
    const currentRefundDebt = Number(memberLocation.member.Sisa_Hutang_Kembalian) || 0;
    if (currentArrears === (Number(duplicate.openingArrears) || 0)
      && currentRefundDebt === (Number(duplicate.openingRefundDebt) || 0)) {
      updateMasterBalance_(duplicate.memberId, Number(duplicate.arrears) || 0, Number(duplicate.refundDebt) || 0);
    }
    return { record: duplicate, member: findMasterAnggota_(record.memberId).member };
  }
  if (mode === 'update' && !existing) throw new Error('Transaksi iuran tidak ditemukan.');
  if (existing && String(existing.memberId) !== String(record.memberId)) throw new Error('Anggota pada transaksi tidak dapat diganti.');
  const memberLocation = findMasterAnggota_(record.memberId);

  const openingArrears = (Number(memberLocation.member.Sisa_Hutang_Iuran) || 0) + (existing ? Number(existing.allocatedContribution) || 0 : 0);
  const openingRefundDebt = Math.max(0, (Number(memberLocation.member.Sisa_Hutang_Kembalian) || 0) - (existing ? Number(existing.refundDebtAdded) || 0 : 0));
  const allocatedContribution = Number(record.allocatedContribution);
  const cashPhysical = Number(record.cashPhysical);
  const changePaid = Number(record.changePaid) || 0;
  if (![allocatedContribution, cashPhysical, changePaid].every(Number.isFinite) || allocatedContribution < 0 || cashPhysical < 0 || changePaid < 0) {
    throw new Error('Nominal transaksi harus berupa angka nol atau lebih.');
  }
  if (cashPhysical < allocatedContribution) throw new Error('Uang fisik diterima tidak boleh kurang dari uang yang dialokasikan untuk iuran.');
  const changeDue = cashPhysical - allocatedContribution;
  if (changePaid > openingRefundDebt + changeDue) throw new Error('Kembalian diberikan tidak boleh melebihi hutang kembalian sebelumnya ditambah kembalian transaksi ini.');

  const refundDebt = Math.max(0, openingRefundDebt + changeDue - changePaid);
  const refundDebtAdded = refundDebt - openingRefundDebt;
  const clean = {
    id: existing ? existing.id : record.id || Utilities.getUuid(),
    date: record.date,
    periodId: String(record.periodId),
    memberId: memberLocation.member.ID,
    memberName: memberLocation.member.Nama,
    target: openingArrears,
    allocatedContribution: allocatedContribution,
    cashPhysical: cashPhysical,
    changeDue: changeDue,
    changePaid: changePaid,
    openingArrears: openingArrears,
    arrears: Math.max(0, openingArrears - allocatedContribution),
    openingRefundDebt: openingRefundDebt,
    refundDebtAdded: refundDebtAdded,
    refundDebt: refundDebt,
    notes: String(record.notes || ''),
    createdBy: existing ? existing.createdBy : user.username,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const oldArrears = Number(memberLocation.member.Sisa_Hutang_Iuran) || 0;
  const oldRefundDebt = Number(memberLocation.member.Sisa_Hutang_Kembalian) || 0;
  const sheet = spreadsheet_().getSheetByName('TRANSAKSI_IURAN');
  const headers = SHEETS.TRANSAKSI_IURAN;
  let member;
  try {
    member = updateMasterBalance_(clean.memberId, clean.arrears, clean.refundDebt);
    if (existing) {
      const idColumn = headers.indexOf('id');
      const values = sheet.getDataRange().getValues();
      const rowIndex = values.findIndex(function (row, index) { return index > 0 && String(row[idColumn]) === String(clean.id); });
      if (rowIndex < 1) throw new Error('Baris transaksi iuran tidak ditemukan.');
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([headers.map(function (key) { return normalizeCell_(clean[key]); })]);
    } else {
      appendRecord_('TRANSAKSI_IURAN', clean);
    }
  } catch (error) {
    updateMasterBalance_(clean.memberId, oldArrears, oldRefundDebt);
    throw error;
  }
  audit_(user, mode, 'TRANSAKSI_IURAN', clean.id, member.Nama);
  return { record: clean, member: member };
}

function deleteIuranTransaction_(id, user) {
  const sheet = spreadsheet_().getSheetByName('TRANSAKSI_IURAN');
  const headers = SHEETS.TRANSAKSI_IURAN;
  const idColumn = headers.indexOf('id');
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex(function (row, index) { return index > 0 && String(row[idColumn]) === String(id); });
  if (rowIndex < 1) throw new Error('Transaksi iuran tidak ditemukan.');
  const record = rowToObject_(headers, values[rowIndex]);
  const location = findMasterAnggota_(record.memberId);
  const oldArrears = Number(location.member.Sisa_Hutang_Iuran) || 0;
  const oldRefundDebt = Number(location.member.Sisa_Hutang_Kembalian) || 0;
  const updatedArrears = oldArrears + (Number(record.allocatedContribution) || 0);
  const updatedRefundDebt = Math.max(0, oldRefundDebt - (Number(record.refundDebtAdded) || 0));
  const member = updateMasterBalance_(record.memberId, updatedArrears, updatedRefundDebt);
  try {
    sheet.deleteRow(rowIndex + 1);
  } catch (error) {
    updateMasterBalance_(record.memberId, oldArrears, oldRefundDebt);
    throw error;
  }
  audit_(user, 'delete', 'TRANSAKSI_IURAN', id, record.memberName);
  return { id: id, member: member };
}

function saveSukadukaIncoming_(mode, input, user) {
  const record = input || {};
  if (!record.memberId) throw new Error('Pilih anggota untuk penerimaan sukaduka.');
  if (!record.date) throw new Error('Tanggal transaksi Sukaduka wajib diisi.');
  const location = findMasterAnggota_(record.memberId);
  const rows = readRecords_('Sukaduka');
  const existing = mode === 'update' ? rows.find(function (row) { return String(row.id) === String(record.id); }) : null;
  const duplicate = mode === 'create' && record.id ? rows.find(function (row) { return String(row.id) === String(record.id); }) : null;
  if (duplicate) {
    const matchesRequest = String(duplicate.memberId) === String(record.memberId)
      && String(duplicate.date) === String(record.date)
      && String(duplicate.purpose) === String(record.purpose)
      && Number(duplicate.amount) === Number(record.amount)
      && Number(duplicate.chargeAmount || 0) === (Number(record.chargeAmount) || 0)
      && Number(duplicate.cashPhysical) === Number(record.cashPhysical)
      && Number(duplicate.changePaid || 0) === (Number(record.changePaid) || 0)
      && String(duplicate.notes || '') === String(record.notes || '');
    if (!matchesRequest) throw new Error('ID transaksi Sukaduka sudah dipakai untuk data berbeda. Muat ulang data sebelum membuat transaksi baru.');
    if (!readAuditLog_().some(function (row) { return row.action === mode && row.module === 'Sukaduka' && String(row.recordId) === String(duplicate.id); })) {
      audit_(user, mode, 'Sukaduka', duplicate.id, duplicate.memberName);
    }
    const openingRefundDebt = Number(duplicate.refundDebt) - Number(duplicate.refundDebtAdded || 0);
    if ((Number(location.member.Sisa_Hutang_Kembalian) || 0) === openingRefundDebt
      && (Number(location.member.Sisa_Hutang_Sukaduka) || 0) === (Number(duplicate.openingArrears) || 0)) {
      updateMasterBalance_(duplicate.memberId, location.member.Sisa_Hutang_Iuran, Number(duplicate.refundDebt) || 0, Number(duplicate.arrears) || 0);
    }
    return { record: duplicate, member: findMasterAnggota_(record.memberId).member };
  }
  if (mode === 'update' && (!existing || !existing.memberId)) throw new Error('Transaksi penerimaan sukaduka tidak ditemukan.');
  if (existing && String(existing.memberId) !== String(record.memberId)) throw new Error('Anggota pada transaksi tidak dapat diganti.');
  const amount = Number(record.amount);
  const cashPhysical = Number(record.cashPhysical);
  const changePaid = Number(record.changePaid) || 0;
  const chargeAmount = record.chargeAmount === '' || record.chargeAmount === null || record.chargeAmount === undefined ? 0 : Number(record.chargeAmount);
  const existingTracksArrears = existing && existing.chargeAmount !== '' && existing.chargeAmount !== null && existing.chargeAmount !== undefined;
  const openingArrears = Math.max(0, (Number(location.member.Sisa_Hutang_Sukaduka) || 0) - (existingTracksArrears ? Number(existing.chargeAmount) || 0 : 0) + (existingTracksArrears ? Number(existing.amount) || 0 : 0));
  const openingRefundDebt = Math.max(0, (Number(location.member.Sisa_Hutang_Kembalian) || 0) - (Number(existing && existing.refundDebtAdded) || 0));
  if (![amount, cashPhysical, changePaid, chargeAmount].every(Number.isFinite) || amount < 0 || chargeAmount < 0 || amount + chargeAmount <= 0 || cashPhysical < amount || changePaid < 0) {
    throw new Error('Nominal penerimaan tidak valid atau uang fisik kurang dari uang untuk sukaduka.');
  }
  const changeDue = cashPhysical - amount;
  if (changePaid > openingRefundDebt + changeDue) throw new Error('Kembalian diberikan tidak boleh melebihi hutang kembalian sebelumnya ditambah kembalian transaksi ini.');
  const refundDebt = Math.max(0, openingRefundDebt + changeDue - changePaid);
  const refundDebtAdded = refundDebt - openingRefundDebt;
  const clean = {
    id: existing ? existing.id : record.id || Utilities.getUuid(),
    date: record.date, direction: 'Masuk', recipient: location.member.Nama,
    purpose: String(record.purpose), amount: amount, memberId: location.member.ID,
    memberName: location.member.Nama, cashPhysical: cashPhysical, changeDue: changeDue,
    changePaid: changePaid, refundDebtAdded: refundDebtAdded,
    refundDebt: refundDebt,
    chargeAmount: chargeAmount, openingArrears: openingArrears,
    arrears: Math.max(0, openingArrears + chargeAmount - amount),
    notes: String(record.notes || ''), proofPhotoUrl: String(record.proofPhotoUrl || existing && existing.proofPhotoUrl || ''),
    createdBy: existing ? existing.createdBy : user.username,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
  };
  const sheet = spreadsheet_().getSheetByName('Sukaduka');
  const headers = SHEETS.Sukaduka;
  const oldRefundDebt = Number(location.member.Sisa_Hutang_Kembalian) || 0;
  const oldSukadukaArrears = Number(location.member.Sisa_Hutang_Sukaduka) || 0;
  let member;
  try {
    member = updateMasterBalance_(clean.memberId, location.member.Sisa_Hutang_Iuran, clean.refundDebt, clean.arrears);
    if (existing) {
      const values = sheet.getDataRange().getValues();
      const idColumn = headers.indexOf('id');
      const rowIndex = values.findIndex(function (row, index) { return index > 0 && String(row[idColumn]) === String(clean.id); });
      if (rowIndex < 1) throw new Error('Baris sukaduka tidak ditemukan.');
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([headers.map(function (key) { return normalizeCell_(clean[key]); })]);
    } else {
      appendRecord_('Sukaduka', clean);
    }
    member.Sisa_Hutang_Sukaduka = clean.arrears;
  } catch (error) {
    updateMasterBalance_(clean.memberId, location.member.Sisa_Hutang_Iuran, oldRefundDebt, oldSukadukaArrears);
    throw error;
  }
  audit_(user, mode, 'Sukaduka', clean.id, clean.memberName);
  return { record: clean, member: member };
}

function deleteSukadukaIncoming_(record, user) {
  const location = findMasterAnggota_(record.memberId);
  const oldRefundDebt = Number(location.member.Sisa_Hutang_Kembalian) || 0;
  const oldSukadukaArrears = Number(location.member.Sisa_Hutang_Sukaduka) || 0;
  const sheet = spreadsheet_().getSheetByName('Sukaduka');
  const rows = sheet.getDataRange().getValues();
  const idColumn = SHEETS.Sukaduka.indexOf('id');
  const rowIndex = rows.findIndex(function (row, index) { return index > 0 && String(row[idColumn]) === String(record.id); });
  if (rowIndex < 1) throw new Error('Transaksi penerimaan sukaduka tidak ditemukan.');
  const updatedRefundDebt = Math.max(0, oldRefundDebt - (Number(record.refundDebtAdded) || 0));
  const arrearsEffect = (Number(record.chargeAmount) || 0) - (Number(record.amount) || 0);
  const updatedSukadukaArrears = Math.max(0, oldSukadukaArrears - arrearsEffect);
  const member = updateMasterBalance_(record.memberId, location.member.Sisa_Hutang_Iuran, updatedRefundDebt, updatedSukadukaArrears);
  try {
    sheet.deleteRow(rowIndex + 1);
  } catch (error) {
    updateMasterBalance_(record.memberId, location.member.Sisa_Hutang_Iuran, oldRefundDebt, oldSukadukaArrears);
    throw error;
  }
  audit_(user, 'delete', 'Sukaduka', record.id, record.memberName);
  return { id: record.id, member: member };
}

function validateRentalAvailability_(record, excludeId) {
  const asset = readRecords_('Aset').find(function (row) { return String(row.id) === String(record.assetId); });
  if (!asset) throw new Error('Pilih alat yang terdaftar di inventaris.');
  if (record.status === 'Dibatalkan') {
    record.rentalIncome = 0;
    record.assetName = asset.assetName;
    return;
  }
  record.customerType = record.customerType === 'Luar' ? 'Luar' : 'Semeton';
  if (!record.startDate || !record.endDate || String(record.endDate) < String(record.startDate)) throw new Error('Rentang tanggal sewa tidak valid.');
  const quantity = Number(record.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Jumlah sewa minimal 1 item.');
  if (asset.condition === 'Rusak') throw new Error('Alat dalam kondisi rusak dan tidak tersedia untuk disewa.');

  const overlapping = readRecords_('SewaAset').filter(function (row) {
    if (String(row.id) === String(excludeId || '') || String(row.assetId) !== String(asset.id) || ['Dibatalkan', 'Selesai'].includes(row.status)) return false;
    if (!row.startDate || !row.endDate) return false;
    return String(row.startDate).slice(0, 10) <= String(record.endDate).slice(0, 10) && String(row.endDate).slice(0, 10) >= String(record.startDate).slice(0, 10);
  }).reduce(function (total, row) { return total + (Number(row.quantity) || 0); }, 0);
  const available = Math.max(0, (Number(asset.quantity) || 0) - overlapping);
  if (quantity > available) throw new Error('Stok tidak cukup pada tanggal tersebut. Tersedia ' + available + ' item.');

  const days = Math.max(1, Math.floor((Date.parse(record.endDate + 'T00:00:00') - Date.parse(record.startDate + 'T00:00:00')) / 86400000) + 1);
  const rate = record.customerType === 'Luar'
    ? Number(asset.rentalRateLuar || asset.rentalRate) || 0
    : Number(asset.rentalRateSemeton || asset.rentalRate) || 0;
  record.rentalIncome = rate * quantity * days;
  record.assetName = asset.assetName;
}

function validateIuranExpense_(record) {
  if (!record.date || !record.category || !String(record.description || '').trim()) {
    throw new Error('Tanggal, kategori, dan uraian pengeluaran iuran wajib diisi.');
  }
  const amount = Number(record.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Nominal pengeluaran iuran harus lebih dari nol.');
  record.amount = amount;
  record.description = String(record.description).trim();
  record.payee = String(record.payee || '').trim();
}

function calculateIuran_(record) {
  const target = Math.max(0, Number(record.target) || 0);
  const cash = Math.max(0, Number(record.cashPhysical) || 0);
  const totalDue = Math.max(0, Number(record.openingArrears) || 0) + target;
  record.changeDue = Math.max(0, cash - totalDue);
  record.changePaid = Math.max(0, Number(record.changePaid) || 0);
  record.arrears = Math.max(0, totalDue - cash);
  record.refundDebt = Math.max(0, (Number(record.openingRefundDebt) || 0) + record.changeDue - record.changePaid);
}

function readRecords_(module) {
  validateModule_(module);
  const sheet = spreadsheet_().getSheetByName(module);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = SHEETS[module];
  const timeZone = spreadsheet_().getSpreadsheetTimeZone();
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    .filter(function (row) { return row.some(function (value) { return value !== ''; }); })
    .map(function (row) { return rowToObject_(headers, row, timeZone); });
}

function readAuditLog_() {
  const sheet = spreadsheet_().getSheetByName('AuditLog');
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, SHEETS.AuditLog.length).getValues()
    .filter(function (row) { return row.some(function (value) { return value !== ''; }); })
    .map(function (row) { return rowToObject_(SHEETS.AuditLog, row); });
}

function createBackup_() {
  const sheets = {};
  Object.keys(SHEETS).forEach(function (module) {
    const records = module === 'AuditLog' ? readAuditLog_() : readRecords_(module);
    sheets[module] = module === 'Users'
      ? records.map(function (record) {
        const safeRecord = Object.assign({}, record);
        delete safeRecord.passwordHash;
        delete safeRecord.salt;
        return safeRecord;
      })
      : records;
  });
  return {
    format: 'takora-backup',
    version: 1,
    createdAt: new Date().toISOString(),
    sheets: sheets,
  };
}

function restoreBackup_(backup, user) {
  if (!backup || backup.format !== 'takora-backup' || backup.version !== 1 || !backup.sheets || typeof backup.sheets !== 'object' || Array.isArray(backup.sheets)) {
    throw new Error('Format backup tidak dikenal atau tidak didukung.');
  }

  const modules = Object.keys(SHEETS).filter(function (module) { return module !== 'Users'; });
  const unknownSheets = Object.keys(backup.sheets).filter(function (module) {
    return !Object.prototype.hasOwnProperty.call(SHEETS, module);
  });
  if (unknownSheets.length) throw new Error('Backup berisi sheet yang tidak dikenal: ' + unknownSheets.join(', ') + '.');
  const prepared = {};
  modules.forEach(function (module) {
    const records = backup.sheets[module];
    if (!Array.isArray(records)) throw new Error('Backup tidak memiliki data sheet ' + module + ' yang valid.');
    const headers = SHEETS[module];
    const idColumn = module === 'MASTER_ANGGOTA' ? 'ID' : 'id';
    const seenIds = Object.create(null);
    prepared[module] = records.map(function (record, index) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        throw new Error('Data sheet ' + module + ' baris ' + (index + 1) + ' tidak valid.');
      }
      const id = String(record[idColumn] == null ? '' : record[idColumn]).trim();
      if (!id) throw new Error('ID wajib diisi pada sheet ' + module + ' baris ' + (index + 1) + '.');
      if (seenIds[id]) throw new Error('ID duplikat "' + id + '" pada sheet ' + module + '.');
      seenIds[id] = true;
      return headers.map(function (header) { return normalizeCell_(record[header]); });
    });
  });
  if (!Array.isArray(backup.sheets.Users)) throw new Error('Backup tidak memiliki data sheet Users yang valid.');

  const ss = spreadsheet_();
  const previous = {};
  modules.forEach(function (module) {
    const sheet = ss.getSheetByName(module);
    if (!sheet) throw new Error('Sheet ' + module + ' tidak ditemukan. Jalankan setupSheets() terlebih dahulu.');
    const headers = SHEETS[module];
    const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (headers.some(function (header, index) { return existingHeaders[index] !== header; })) {
      throw new Error('Header sheet ' + module + ' tidak sesuai. Jalankan setupSheets() terlebih dahulu.');
    }
    const lastRow = sheet.getLastRow();
    previous[module] = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, SHEETS[module].length).getValues();
  });

  function writeModule(module, records) {
    const sheet = ss.getSheetByName(module);
    const headers = SHEETS[module];
    const oldRowCount = sheet.getLastRow() - 1;
    if (oldRowCount > 0) sheet.getRange(2, 1, oldRowCount, headers.length).clearContent();
    if (!records.length) return;
    const requiredLastRow = records.length + 1;
    if (sheet.getMaxRows() < requiredLastRow) sheet.insertRowsAfter(sheet.getMaxRows(), requiredLastRow - sheet.getMaxRows());
    sheet.getRange(2, 1, records.length, headers.length).setValues(records);
  }

  try {
    modules.forEach(function (module) { writeModule(module, prepared[module]); });
    audit_(user, 'restore', 'ALL', '', JSON.stringify({
      backupCreatedAt: backup.createdAt || '',
      restoredRecordCounts: Object.keys(prepared).reduce(function (counts, module) {
        counts[module] = prepared[module].length;
        return counts;
      }, {}),
      usersPreserved: true,
    }));
  } catch (error) {
    try {
      modules.forEach(function (module) { writeModule(module, previous[module]); });
    } catch (rollbackError) {
      const failure = new Error('Restore gagal dan pemulihan otomatis data sebelumnya juga gagal. Periksa spreadsheet segera. Kesalahan restore: ' + error.message + ' Kesalahan rollback: ' + rollbackError.message);
      failure.uncertain = true;
      throw failure;
    }
    throw new Error('Restore gagal. Data sebelumnya berhasil dikembalikan. ' + error.message);
  }

  return {
    restoredRecordCounts: Object.keys(prepared).reduce(function (counts, module) {
      counts[module] = prepared[module].length;
      return counts;
    }, {}),
    usersPreserved: true,
  };
}

function appendRecord_(module, record) {
  if (!Object.prototype.hasOwnProperty.call(SHEETS, module)) throw new Error('Sheet tidak dikenal.');
  const headers = SHEETS[module];
  spreadsheet_().getSheetByName(module).appendRow(headers.map(function (key) { return normalizeCell_(record[key]); }));
}

function publicRecords_(module) {
  if (module === 'Aset') {
    const records = readRecords_('Aset');
    const inventory = assetInventory_({ Aset: records, SewaAset: readRecords_('SewaAset') });
    return records.map(function (record) {
      const current = inventory.find(function (item) { return String(item.id) === String(record.id); }) || {};
      return Object.assign({}, record, current, { photoUrl: driveImageUrl_(record.photoUrl) });
    });
  }
  return readRecords_(module).map(function (record) {
    if (module === 'Users') {
      delete record.passwordHash;
      delete record.salt;
    }
    if (module === 'KegiatanMedia') record.photoUrl = driveImageUrl_(record.photoUrl);
    if (module === 'SewaAset') {
      record.startDate = String(record.startDate || '').slice(0, 10);
      record.endDate = String(record.endDate || '').slice(0, 10);
    }
    return record;
  });
}

function rowToObject_(headers, row, timeZone) {
  const result = {};
  headers.forEach(function (header, index) {
    const value = row[index];
    if (value instanceof Date && ['date', 'periodId', 'eventDate', 'startDate', 'endDate'].includes(header)) {
      result[header] = Utilities.formatDate(value, timeZone || Session.getScriptTimeZone(), header === 'periodId' ? 'yyyy-MM' : 'yyyy-MM-dd');
    } else {
      result[header] = value instanceof Date ? value.toISOString() : value;
    }
  });
  return result;
}

function sanitizeRecord_(module, record) {
  validateModule_(module);
  const allowed = SHEETS[module];
  const clean = {};
  allowed.forEach(function (key) {
    if (Object.prototype.hasOwnProperty.call(record, key) && key !== 'passwordHash' && key !== 'salt') clean[key] = record[key];
  });
  if (module === 'Users') {
    delete clean.passwordHash;
    delete clean.salt;
    if (!['Admin', 'Ketua', 'Bendahara', 'Sekretaris', 'Publik'].includes(clean.role)) throw new Error('Peran pengguna tidak valid.');
  }
  return clean;
}

function validateModule_(module) {
  if (!module || !Object.prototype.hasOwnProperty.call(SHEETS, module) || module === 'AuditLog') {
    throw new Error('Modul tidak dikenal atau tidak dapat diakses.');
  }
}

function summarySnapshot_() {
  const names = ['Sesari', 'Sukaduka', 'Punia', 'Piodalan', 'Aset', 'SewaAset', 'TRANSAKSI_IURAN', 'PengeluaranIuran', 'Anggota', 'MASTER_ANGGOTA', 'SaldoAwal'];
  const snapshot = {};
  names.forEach(function (name) { snapshot[name] = readRecords_(name); });
  return snapshot;
}

function getOpeningBalances_() {
  const balances = {
    iuran: { amount: 0, date: '', notes: '', configured: false },
    sukaduka: { amount: 0, date: '', notes: '', configured: false },
    sesari: { amount: 0, date: '', notes: '', configured: false },
  };
  readRecords_('SaldoAwal').forEach(function (record) {
    if (!Object.prototype.hasOwnProperty.call(balances, record.module)) return;
    balances[record.module] = {
      amount: Number(record.amount) || 0,
      date: record.date || '',
      notes: record.notes || '',
      configured: true,
    };
  });
  return balances;
}

function setOpeningBalances_(input, user) {
  const modules = ['iuran', 'sukaduka', 'sesari'];
  const date = String(input.date || '').trim();
  const notes = String(input.notes || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date + 'T00:00:00').getTime())) {
    throw new Error('Tanggal saldo awal tidak valid.');
  }
  if (!notes) throw new Error('Keterangan saldo awal wajib diisi.');
  if (!input.balances || typeof input.balances !== 'object') throw new Error('Nominal saldo awal tidak ditemukan.');

  const sheet = spreadsheet_().getSheetByName('SaldoAwal');
  const headers = SHEETS.SaldoAwal;
  const existing = readRecords_('SaldoAwal');
  const records = modules.map(function (module) {
    const amount = Number(input.balances[module]);
    if (!Number.isFinite(amount) || amount < 0 || Math.floor(amount) !== amount) {
      throw new Error('Saldo awal ' + module + ' harus berupa angka rupiah nol atau lebih.');
    }
    return {
      id: 'SALDO-AWAL-' + module.toUpperCase(),
      module: module,
      amount: amount,
      date: date,
      notes: notes,
      updatedBy: user.username,
      updatedAt: new Date().toISOString(),
    };
  });
  records.forEach(function (record) {
    let index = -1;
    existing.forEach(function (row, rowIndex) {
      if (row.module === record.module) index = rowIndex;
    });
    if (index < 0) {
      sheet.appendRow(headers.map(function (key) { return normalizeCell_(record[key]); }));
    } else {
      sheet.getRange(index + 2, 1, 1, headers.length).setValues([headers.map(function (key) { return normalizeCell_(record[key]); })]);
    }
    audit_(user, 'setOpeningBalance', record.module, record.id, JSON.stringify({ amount: record.amount, date: date, notes: notes }));
  });
  return { balances: getOpeningBalances_() };
}

function summaryRows_(snapshot, module) {
  return snapshot ? snapshot[module] || [] : readRecords_(module);
}

function filteredSummarySnapshot_(snapshot, filters) {
  const year = String(filters.year || '').replace(/\D/g, '').slice(0, 4);
  const rawMonth = String(filters.month || '').replace(/\D/g, '').slice(-2);
  const rawDay = String(filters.day || '').replace(/\D/g, '').slice(-2);
  const month = rawMonth ? rawMonth.padStart(2, '0') : '';
  const day = rawDay ? rawDay.padStart(2, '0') : '';
  if (!year && !month && !day) return snapshot;
  Object.keys(snapshot).forEach(function (module) {
    if (module === 'Aset' || module === 'Anggota' || module === 'MASTER_ANGGOTA') return;
    snapshot[module] = snapshot[module].filter(function (row) {
      const value = String(row.date || row.eventDate || row.periodId || '');
      if (year && value.slice(0, 4) !== year) return false;
      if (month && value.slice(5, 7) !== month) return false;
      if (day && value.slice(8, 10) !== day) return false;
      return true;
    });
  });
  return snapshot;
}

function getOpeningBalancesFromSnapshot_(snapshot) {
  const balances = { iuran: 0, sukaduka: 0, sesari: 0 };
  summaryRows_(snapshot, 'SaldoAwal').forEach(function (record) {
    if (Object.prototype.hasOwnProperty.call(balances, record.module)) {
      balances[record.module] = Number(record.amount) || 0;
    }
  });
  return balances;
}

function summary_(filters) {
  const rawSnapshot = summarySnapshot_();
  const assets = assetInventory_(rawSnapshot);
  const allTotals = summaryTotals_(rawSnapshot);
  const snapshot = filteredSummarySnapshot_(rawSnapshot, filters || {});
  const totals = summaryTotals_(snapshot);
  const masterMembers = getMasterAnggota_(snapshot);
  const arrears = masterMembers.reduce(function (sum, member) { return sum + Number(member.Sisa_Hutang_Iuran || 0); }, 0);
  const sukadukaArrears = masterMembers.reduce(function (sum, member) { return sum + Number(member.Sisa_Hutang_Sukaduka || 0); }, 0);
  const analytics = analytics_(snapshot, filters || {});
  const hasFilter = Boolean(filters && (filters.year || filters.month || filters.day));
  const cards = [
    { label: hasFilter ? 'Saldo kas sesuai filter' : 'Saldo kas gabungan · semua', value: totals.income - totals.expenses, trend: hasFilter ? 'Periode terpilih' : 'Semua' },
    { label: hasFilter ? 'Penerimaan sesuai filter' : 'Penerimaan · semua', value: totals.income, trend: hasFilter ? 'Periode terpilih' : 'Semua' },
    { label: hasFilter ? 'Pengeluaran sesuai filter' : 'Pengeluaran · semua', value: totals.expenses, trend: hasFilter ? 'Periode terpilih' : 'Semua' },
    { label: 'Tunggakan iuran', value: arrears, trend: 'Saldo kewajiban anggota' },
  ];
  const balances = moduleBalances_(snapshot, masterMembers);
  const piodalanReport = piodalanReport_(snapshot);
  const publicData = {
    balance: totals.income - totals.expenses,
    income: totals.income,
    expenses: totals.expenses,
    activeMembers: summaryRows_(snapshot, 'Anggota').filter(function (member) { return member.status === 'Aktif'; }).length,
    monthly: analytics.monthly,
    sources: analytics.sources,
    modules: balances.modules,
    outstanding: balances.outstanding,
    donations: publicDonations_(snapshot),
    activities: recentActivities_(snapshot),
    piodalanReport: piodalanReport,
    assets: assets,
    generatedAt: new Date().toISOString(),
  };
  return {
    cards: cards,
    totals: { income: allTotals.income, expenses: allTotals.expenses, arrears: arrears, refundDebt: balances.refundDebt },
    monthly: analytics.monthly,
    sources: analytics.sources,
    modules: balances.modules,
    outstanding: { arrears: arrears, sukadukaArrears: sukadukaArrears, refundDebt: balances.refundDebt },
    activities: recentActivities_(snapshot),
    piodalanReport: piodalanReport,
    assets: assets,
    public: publicData,
  };
}

function publicSummary_(filters) {
  const rawSnapshot = summarySnapshot_();
  const assets = assetInventory_(rawSnapshot);
  const snapshot = filteredSummarySnapshot_(rawSnapshot, filters || {});
  const totals = summaryTotals_(snapshot);
  const analytics = analytics_(snapshot, filters || {});
  const members = summaryRows_(snapshot, 'Anggota').filter(function (row) { return row.status === 'Aktif'; }).length;
  const masterMembers = getMasterAnggota_(snapshot);
  const balances = moduleBalances_(snapshot, masterMembers);
  const piodalanReport = piodalanReport_(snapshot);
  return {
    balance: totals.income - totals.expenses,
    income: totals.income,
    expenses: totals.expenses,
    activeMembers: members,
    monthly: analytics.monthly,
    sources: analytics.sources,
    modules: balances.modules,
    outstanding: balances.outstanding,
    donations: publicDonations_(snapshot),
    activities: recentActivities_(snapshot),
    piodalanReport: piodalanReport,
    assets: assets,
    generatedAt: new Date().toISOString(),
  };
}

function piodalanReport_(snapshot) {
  const events = {};
  summaryRows_(snapshot, 'Piodalan').forEach(function (row) {
    const eventName = String(row.eventName || '').trim();
    if (!eventName) return;
    if (!events[eventName]) events[eventName] = { eventName: eventName, income: 0, expenses: 0, goodsValue: 0 };
    const event = events[eventName];
    const amount = Number(row.amount) || 0;
    if (row.category === 'Punia barang') {
      if (row.direction === 'Masuk') event.goodsValue += amount;
    } else if (row.direction === 'Masuk') {
      event.income += amount;
    } else if (row.direction === 'Keluar') {
      event.expenses += amount;
    }
  });
  return Object.keys(events).map(function (eventName) {
    const event = events[eventName];
    event.balance = event.income - event.expenses;
    return event;
  }).sort(function (left, right) { return left.eventName.localeCompare(right.eventName, 'id'); });
}

function publicDonations_(snapshot) {
  const punia = summaryRows_(snapshot, 'Punia').map(function (row) {
    return {
      id: row.id, date: row.date, donor: row.donor, donationType: row.donationType,
      eventName: row.eventName || '', itemName: row.itemName || '', quantity: Number(row.quantity) || 0,
      amount: Number(row.amount) || 0, unit: row.unit || 'unit', module: 'Dana Punia',
    };
  });
  const eventDonations = summaryRows_(snapshot, 'Piodalan').filter(function (row) {
    return ['Punia uang', 'Punia barang', 'Wijilan / Setoran wajib'].indexOf(row.category) !== -1;
  }).map(function (row) {
    return {
      id: row.id, date: row.date, donor: row.donor || row.description || '',
      donationType: row.category === 'Punia barang' ? 'Barang' : 'Uang Tunai',
      eventName: row.eventName || '', itemName: row.itemName || '', quantity: Number(row.quantity) || 0, unit: row.unit || 'unit',
      amount: Number(row.amount) || 0, module: 'Piodalan',
    };
  });
  return punia.concat(eventDonations).filter(function (row) { return row.donor; })
    .sort(function (left, right) { return String(right.date || '').localeCompare(String(left.date || '')); })
    .slice(0, 100);
}

function recentActivities_(snapshot) {
  const items = [];
  function add(row, activity, category, incoming, amount) {
    if (!row.date || !(Number(amount) > 0)) return;
    items.push({ date: String(row.date).slice(0, 10), activity: activity, category: category, incoming: incoming, amount: Number(amount) || 0 });
  }
  summaryRows_(snapshot, 'Sesari').forEach(function (row) { add(row, row.description || row.category || 'Transaksi Sesari', 'Sesari', row.direction === 'Masuk', row.amount); });
  summaryRows_(snapshot, 'TRANSAKSI_IURAN').forEach(function (row) { add(row, 'Pembayaran iuran anggota', 'Iuran', true, row.cashPhysical); });
  summaryRows_(snapshot, 'PengeluaranIuran').forEach(function (row) { add(row, row.category || 'Pengeluaran iuran', 'Iuran', false, row.amount); });
  summaryRows_(snapshot, 'Sukaduka').forEach(function (row) { add(row, 'Transaksi Sukaduka', 'Sukaduka', row.direction === 'Masuk', row.direction === 'Masuk' ? row.cashPhysical || row.amount : row.amount); });
  summaryRows_(snapshot, 'Piodalan').forEach(function (row) {
    if (row.category !== 'Punia barang') add(row, row.eventName || row.description || 'Transaksi Piodalan', 'Piodalan', row.direction === 'Masuk', row.amount);
  });
  summaryRows_(snapshot, 'Punia').forEach(function (row) {
    if (isCashPunia_(row)) add(row, 'Punia dari ' + (row.donor || 'donatur'), 'Punia', true, row.amount);
  });
  summaryRows_(snapshot, 'SewaAset').forEach(function (row) {
    if (row.status !== 'Dibatalkan') add(row, 'Sewa ' + (row.assetName || 'aset'), 'Sewa alat', true, row.rentalIncome);
  });
  return items.sort(function (left, right) { return right.date.localeCompare(left.date); }).slice(0, 12);
}

function moduleBalances_(snapshot, suppliedMembers) {
  const sesari = summaryRows_(snapshot, 'Sesari');
  const sukaduka = summaryRows_(snapshot, 'Sukaduka');
  const punia = summaryRows_(snapshot, 'Punia');
  const piodalan = summaryRows_(snapshot, 'Piodalan');
  const iuran = summaryRows_(snapshot, 'TRANSAKSI_IURAN');
  const iuranExpenses = summaryRows_(snapshot, 'PengeluaranIuran');
  const openingBalances = getOpeningBalancesFromSnapshot_(snapshot);
  const rentals = summaryRows_(snapshot, 'SewaAset');
  const masterMembers = suppliedMembers || getMasterAnggota_(snapshot);
  const arrears = masterMembers.reduce(function (sum, member) { return sum + Number(member.Sisa_Hutang_Iuran || 0); }, 0);
  const sukadukaArrears = masterMembers.reduce(function (sum, member) { return sum + Number(member.Sisa_Hutang_Sukaduka || 0); }, 0);
  const refundDebt = masterMembers.reduce(function (sum, member) { return sum + Number(member.Sisa_Hutang_Kembalian || 0); }, 0);
  function total(rows, predicate, valueField) {
    return rows.filter(predicate).reduce(function (sum, row) { return sum + Number(row[valueField] || 0); }, 0);
  }
  function balance(incoming, outgoing, unpaid) {
    return { incoming: incoming, outgoing: outgoing, balance: incoming - outgoing, unpaid: unpaid || 0 };
  }
  const iuranIn = total(iuran, function () { return true; }, 'cashPhysical');
  const iuranOut = total(iuran, function () { return true; }, 'changePaid') + iuranExpenses.reduce(function (sum, row) { return sum + Number(row.amount || 0); }, 0);
  const socialIn = sukadukaCashIn_(sukaduka);
  const socialOut = sukadukaCashOut_(sukaduka);
  const sesariIn = total(sesari, function (row) { return row.direction === 'Masuk'; }, 'amount');
  const sesariOut = total(sesari, function (row) { return row.direction === 'Keluar'; }, 'amount');
  const puniaIn = total(punia, isCashPunia_, 'amount');
  const eventIn = total(piodalan, function (row) { return row.direction === 'Masuk' && row.category !== 'Punia barang'; }, 'amount');
  const eventOut = total(piodalan, function (row) { return row.direction === 'Keluar' && row.category !== 'Punia barang'; }, 'amount');
  const rentalIn = total(rentals, function (row) { return row.status !== 'Dibatalkan'; }, 'rentalIncome');
  const rentalOut = total(rentals, function (row) { return row.status !== 'Dibatalkan'; }, 'maintenanceCost');
  const modules = {
    iuran: balance(iuranIn + openingBalances.iuran, iuranOut, arrears),
    sukaduka: balance(socialIn + openingBalances.sukaduka, socialOut, sukadukaArrears),
    sesari: balance(sesariIn + openingBalances.sesari, sesariOut, 0),
    punia: balance(puniaIn, 0, 0),
    sewa: balance(rentalIn, rentalOut, 0),
    piodalan: balance(eventIn, eventOut, 0),
  };
  return { modules: modules, outstanding: { arrears: arrears, sukadukaArrears: sukadukaArrears, refundDebt: refundDebt }, refundDebt: refundDebt };
}

function analytics_(snapshot, filters) {
  const now = new Date();
  const monthKeys = [];
  const monthLabels = {};
  const selectedYear = Number(filters && filters.year) || now.getFullYear();
  const selectedMonth = Number(filters && filters.month) || 0;
  const monthRange = filters && filters.year ? (selectedMonth ? [selectedMonth] : Array.from({ length: 12 }, (_, index) => index + 1)) : selectedMonth ? [selectedMonth] : null;
  const dates = monthRange
    ? monthRange.map((month) => new Date(selectedYear, month - 1, 1))
    : Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - 5 + index, 1));
  dates.forEach(function (date) {
    const key = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
    monthKeys.push(key);
    monthLabels[key] = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM');
  });
  const monthly = {};
  monthKeys.forEach(function (key) { monthly[key] = { month: monthLabels[key], masuk: 0, keluar: 0, totalMasuk: 0, totalKeluar: 0 }; });
  const sourceTotals = { Iuran: 0, Sesari: 0, Punia: 0 };
  const openingRows = summaryRows_(snapshot, 'SaldoAwal');
  function add(dateValue, direction, amount, source) {
    if (direction !== 'Masuk' && direction !== 'Keluar') return;
    const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue || '').slice(0, 10) + 'T00:00:00');
    if (isNaN(date.getTime())) return;
    const key = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
    if (!monthly[key]) return;
    const value = Math.max(0, Number(amount) || 0);
    const isIncome = direction === 'Masuk';
    monthly[key][isIncome ? 'masuk' : 'keluar'] += value / 1000000;
    monthly[key][isIncome ? 'totalMasuk' : 'totalKeluar'] += value;
    if (direction === 'Masuk' && source && Object.prototype.hasOwnProperty.call(sourceTotals, source)) sourceTotals[source] += value;
  }
  summaryRows_(snapshot, 'Sesari').forEach(function (row) { add(row.date, row.direction, row.amount, 'Sesari'); });
  summaryRows_(snapshot, 'Sukaduka').forEach(function (row) {
    if (row.direction === 'Masuk') {
      add(row.date, 'Masuk', Number(row.cashPhysical || row.amount || 0), '');
      add(row.date, 'Keluar', row.changePaid, '');
    } else {
      add(row.date, row.direction, row.amount, '');
    }
  });
  summaryRows_(snapshot, 'Piodalan').forEach(function (row) {
    if (row.category === 'Punia barang') return;
    const source = row.category === 'Punia uang' ? 'Punia' : row.category === 'Sesari piodalan' ? 'Sesari' : '';
    add(row.date, row.direction, row.amount, source);
  });
  summaryRows_(snapshot, 'Punia').forEach(function (row) {
    if (isCashPunia_(row)) add(row.date, 'Masuk', row.amount, 'Punia');
  });
  summaryRows_(snapshot, 'TRANSAKSI_IURAN').forEach(function (row) {
    add(row.date, 'Masuk', row.cashPhysical, 'Iuran');
    add(row.date, 'Keluar', row.changePaid, '');
  });
  summaryRows_(snapshot, 'PengeluaranIuran').forEach(function (row) { add(row.date, 'Keluar', row.amount, ''); });
  summaryRows_(snapshot, 'SewaAset').forEach(function (row) {
    add(row.date, 'Masuk', row.rentalIncome, '');
    add(row.date, 'Keluar', row.maintenanceCost, '');
  });
  openingRows.forEach(function (row) {
    const source = row.module === 'iuran' ? 'Iuran' : row.module === 'sesari' ? 'Sesari' : '';
    add(row.date, 'Masuk', row.amount, source);
  });
  const sourceTotal = Object.keys(sourceTotals).reduce(function (sum, key) { return sum + sourceTotals[key]; }, 0);
  const colors = { Iuran: '#b5122a', Sesari: '#242424', Punia: '#777777' };
  const sources = Object.keys(sourceTotals).map(function (name) {
    return { name: name, value: sourceTotal ? Math.round(sourceTotals[name] / sourceTotal * 100) : 0, color: colors[name] };
  });
  return { monthly: monthKeys.map(function (key) { return {
    month: monthly[key].month,
    masuk: Number(monthly[key].masuk.toFixed(2)),
    keluar: Number(monthly[key].keluar.toFixed(2)),
    income: monthly[key].totalMasuk,
    expenses: monthly[key].totalKeluar,
  }; }), sources: sources };
}

function summaryTotals_(snapshot) {
  const sesari = summaryRows_(snapshot, 'Sesari');
  const sukaduka = summaryRows_(snapshot, 'Sukaduka');
  const punia = summaryRows_(snapshot, 'Punia');
  const piodalan = summaryRows_(snapshot, 'Piodalan');
  const rentals = summaryRows_(snapshot, 'SewaAset');
  const iuran = summaryRows_(snapshot, 'TRANSAKSI_IURAN');
  const iuranExpenses = summaryRows_(snapshot, 'PengeluaranIuran');
  const openingBalances = getOpeningBalancesFromSnapshot_(snapshot);
  const income = sum_(sesari, 'Masuk') + sukadukaCashIn_(sukaduka) + sumCash_(piodalan, 'Masuk') + punia.filter(isCashPunia_).reduce(function (total, row) { return total + Number(row.amount || 0); }, 0) + iuran.reduce(function (total, row) { return total + Number(row.cashPhysical || 0); }, 0) + rentals.reduce(function (total, row) { return total + Number(row.rentalIncome || 0); }, 0) + openingBalances.iuran + openingBalances.sukaduka + openingBalances.sesari;
  const expenses = sum_(sesari, 'Keluar') + sukadukaCashOut_(sukaduka) + sumCash_(piodalan, 'Keluar') + iuran.reduce(function (total, row) { return total + Number(row.changePaid || 0); }, 0) + iuranExpenses.reduce(function (total, row) { return total + Number(row.amount || 0); }, 0) + rentals.reduce(function (total, row) { return total + Number(row.maintenanceCost || 0); }, 0);
  const refundPaid = 0;
  return { income: income, expenses: expenses + refundPaid };
}

function sum_(rows, direction) {
  return rows.filter(function (row) { return row.direction === direction; }).reduce(function (total, row) { return total + Number(row.amount || 0); }, 0);
}

function sumCash_(rows, direction) {
  return rows.filter(function (row) { return row.direction === direction && row.category !== 'Punia barang'; })
    .reduce(function (total, row) { return total + Number(row.amount || 0); }, 0);
}

function isCashPunia_(row) {
  return row.donationType === 'Uang Tunai' || row.donationType === 'Wijilan / Setoran wajib';
}

function sukadukaCashIn_(rows) {
  return rows.filter(function (row) { return row.direction === 'Masuk'; }).reduce(function (sum, row) { return sum + Number(row.cashPhysical || row.amount || 0); }, 0);
}

function sukadukaCashOut_(rows) {
  return rows.reduce(function (sum, row) {
    return sum + (row.direction === 'Keluar' ? Number(row.amount || 0) : Number(row.changePaid || 0));
  }, 0);
}

function audit_(user, action, module, recordId, details) {
  try {
    appendRecord_('AuditLog', {
      id: Utilities.getUuid(), timestamp: new Date().toISOString(), userId: user.id,
      username: user.username, action: action, module: module, recordId: recordId, details: details,
    });
  } catch (error) {
    error.uncertain = true;
    throw error;
  }
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Atur SPREADSHEET_ID di Script Properties atau hubungkan Apps Script ke Google Sheets.');
  return active;
}

function hashPassword_(password, salt) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + String(password), Utilities.Charset.UTF_8)
    .map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
}

function normalizeCell_(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object' && !(value instanceof Date)) return JSON.stringify(value);
  return value;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
