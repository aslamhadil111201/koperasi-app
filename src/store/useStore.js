import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { buildSchedule } from '../utils/installment';

// Helper: generate unique journal ID (timestamp-based, no collision)
let _idCounter = 0;
const genJournalId = () => {
  _idCounter++;
  return `JU-${Date.now().toString(36).toUpperCase()}${_idCounter.toString(36)}`;
};

// Helper: resolve nama akun dari master data berdasarkan kode akun (ID)
// Ini memastikan nama akun di jurnal selalu sinkron dengan Daftar Akun
const getAccountName = (state, accountId) => {
  const acc = state.accounts.find(a => a.id === accountId);
  return acc ? acc.name : accountId;
};

// Mapping kode akun default (digunakan di seluruh transaksi)
const ACC = {
  KAS_BANK: '101',
  KAS_KECIL: '102',
  PIUTANG_ANGGOTA: '103',
  PIUTANG_DAGANG: '104',
  PIUTANG_BARANG: '105',
  PERSEDIAAN: '106',
  HUTANG_KONSINYASI: '201',
  HUTANG_DAGANG: '202',
  MODAL_POKOK: '301',
  MODAL_WAJIB: '302',
  MODAL_SUKARELA: '303',
  PENDAPATAN_RITEL: '401',
  PENDAPATAN_JASA: '402',
  PENDAPATAN_KOMISI: '403',
  PENDAPATAN_BUNGA: '404',
  HPP: '501',
};

// â”€â”€â”€ Master Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INITIAL_MEMBERS = [];

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Beras Pandan Wangi 5kg',        price: 68000,    hpp: 55000,    stock: 45, minStock: 10, category: 'Sembako' },
  { id: 2, name: 'Minyak Goreng Bimoli 2L',        price: 36000,    hpp: 29000,    stock: 30, minStock: 10, category: 'Sembako' },
  { id: 3, name: 'Gula Pasir 1kg',                 price: 15000,    hpp: 12000,    stock: 60, minStock: 10, category: 'Sembako' },
  { id: 4, name: 'Indomie Goreng (Karton)',         price: 115000,   hpp: 95000,    stock: 18, minStock: 10, category: 'Makanan' },
  { id: 5, name: 'Sabun Mandi Lifebuoy 3pcs',      price: 12500,    hpp: 10000,    stock: 40, minStock: 10, category: 'Kebersihan' },
  // Elektronik & Perabot (untuk kredit barang)
  { id: 6,  name: 'Mesin Cuci Sharp 1 Tabung',     price: 1800000,  hpp: 1500000,  stock: 5,  minStock: 2,  category: 'Elektronik' },
  { id: 7,  name: 'Kulkas Aqua 1 Pintu',           price: 2200000,  hpp: 1850000,  stock: 4,  minStock: 2,  category: 'Elektronik' },
  { id: 8,  name: 'Kipas Angin Cosmos',             price: 350000,   hpp: 280000,   stock: 10, minStock: 5,  category: 'Elektronik' },
  { id: 9,  name: 'Rice Cooker Miyako 1.8L',       price: 280000,   hpp: 220000,   stock: 8,  minStock: 3,  category: 'Elektronik' },
  { id: 10, name: 'Setrika Philips',                price: 180000,   hpp: 140000,   stock: 10, minStock: 5,  category: 'Elektronik' },
  { id: 11, name: 'Kompor Gas Rinnai 2 Tungku',    price: 450000,   hpp: 370000,   stock: 6,  minStock: 2,  category: 'Perabot' },
  { id: 12, name: 'Tabung Gas 3kg + Regulator',    price: 200000,   hpp: 160000,   stock: 15, minStock: 5,  category: 'Perabot' },
  { id: 13, name: 'Kasur Busa 120x200cm',          price: 650000,   hpp: 520000,   stock: 5,  minStock: 2,  category: 'Perabot' },
  { id: 14, name: 'Lemari Pakaian 2 Pintu',        price: 1200000,  hpp: 950000,   stock: 3,  minStock: 1,  category: 'Perabot' },
  { id: 15, name: 'TV LED 32 inch',                price: 2500000,  hpp: 2100000,  stock: 4,  minStock: 2,  category: 'Elektronik' },
];

const INITIAL_CONSIGNMENT = [
  { id: 101, name: 'Keripik Pisang Manis 150g', price: 15000, stock: 20, minStock: 10, supplier: 'Ibu Yani Handayani', supplierPrice: 11000 },
  { id: 102, name: 'Onde-Onde Kacang Hijau',    price: 8000,  stock: 15, minStock: 10, supplier: 'Toko Kue Bu Sari',   supplierPrice: 5500  },
  { id: 103, name: 'Kerupuk Udang Sidoarjo',    price: 22000, stock: 12, minStock: 10, supplier: 'Pak Santoso',         supplierPrice: 17000 },
  { id: 104, name: 'Tape Ketan Hitam 250g',     price: 12000, stock: 8,  minStock: 10, supplier: 'Ibu Rini Wulandari', supplierPrice: 9000  },
];

const INITIAL_SERVICES = [
  { id: 201, name: 'Token Listrik PLN 50rb',    price: 51500,  hpp: 50000,  type: 'Token',        provider: 'PLN'       },
  { id: 202, name: 'Token Listrik PLN 100rb',   price: 102000, hpp: 100000, type: 'Token',        provider: 'PLN'       },
  { id: 203, name: 'Pulsa Telkomsel 50rb',       price: 51000,  hpp: 50000,  type: 'Pulsa',        provider: 'Telkomsel' },
  { id: 204, name: 'Pembayaran PDAM',            price: 3000,   hpp: 0,      type: 'Tagihan',      provider: 'PDAM', isFeeOnly: true },
  { id: 205, name: 'Fotokopi (per lembar)',       price: 500,    hpp: 200,    type: 'Administrasi', provider: 'Koperasi'  },
];

const INITIAL_ACCOUNTS = [
  // Aset Lancar
  { id: '101', name: 'Kas Bank', category: 'Aset Lancar', type: 'debit', isDefault: true },
  { id: '102', name: 'Kas Kecil', category: 'Aset Lancar', type: 'debit', isDefault: true },
  { id: '103', name: 'Piutang Anggota', category: 'Aset Lancar', type: 'debit', isDefault: true },
  { id: '104', name: 'Piutang Dagang', category: 'Aset Lancar', type: 'debit', isDefault: true },
  { id: '105', name: 'Piutang Barang', category: 'Aset Lancar', type: 'debit', isDefault: true },
  { id: '106', name: 'Persediaan Barang', category: 'Aset Lancar', type: 'debit', isDefault: true },
  // Aset Tetap
  // Kewajiban Jangka Pendek
  { id: '201', name: 'Hutang Konsinyasi', category: 'Kewajiban Jangka Pendek', type: 'credit', isDefault: true },
  { id: '202', name: 'Hutang Dagang', category: 'Kewajiban Jangka Pendek', type: 'credit', isDefault: true },
  { id: '203', name: 'Hutang Simpanan Anggota', category: 'Kewajiban Jangka Pendek', type: 'credit', isDefault: true },
  // Ekuitas
  { id: '301', name: 'Modal Koperasi (Simpanan Pokok)', category: 'Ekuitas', type: 'credit', isDefault: true },
  { id: '302', name: 'Modal Koperasi (Simpanan Wajib)', category: 'Ekuitas', type: 'credit', isDefault: true },
  { id: '303', name: 'Modal Koperasi (Simpanan Sukarela)', category: 'Ekuitas', type: 'credit', isDefault: true },
  { id: '304', name: 'Laba SHU di tahan', category: 'Ekuitas', type: 'credit', isDefault: true },
  { id: '305', name: 'Laba SHU Berjalan', category: 'Ekuitas', type: 'credit', isDefault: true },
  { id: '399', name: 'Saldo Penyeimbang', category: 'Ekuitas', type: 'credit', isDefault: true },
  // Pendapatan
  { id: '401', name: 'Pendapatan Penjualan Ritel', category: 'Pendapatan', type: 'credit', isDefault: true },
  { id: '402', name: 'Pendapatan Jasa', category: 'Pendapatan', type: 'credit', isDefault: true },
  { id: '403', name: 'Pendapatan Komisi', category: 'Pendapatan', type: 'credit', isDefault: true },
  { id: '404', name: 'Pendapatan Bunga Pinjaman', category: 'Pendapatan', type: 'credit', isDefault: true },
  { id: '405', name: 'Pendapatan Lainnya', category: 'Pendapatan Lain-lain', type: 'credit', isDefault: true },
  // HPP
  { id: '501', name: 'Harga Pokok Penjualan', category: 'Harga Pokok Penjualan', type: 'debit', isDefault: true },
  // Beban Operasional
  { id: '601', name: 'Beban Gaji Karyawan', category: 'Beban Operasional', type: 'debit', isDefault: true },
  { id: '602', name: 'Beban Listrik & Air', category: 'Beban Operasional', type: 'debit', isDefault: true },
  { id: '603', name: 'Beban Sewa Gedung', category: 'Beban Operasional', type: 'debit', isDefault: true },
  { id: '604', name: 'Beban Perlengkapan & ATK', category: 'Beban Operasional', type: 'debit', isDefault: true },
  { id: '605', name: 'Beban Transportasi', category: 'Beban Operasional', type: 'debit', isDefault: true },
  { id: '606', name: 'Beban Penyusutan', category: 'Beban Operasional', type: 'debit', isDefault: true },
  { id: '607', name: 'Beban Pemasaran', category: 'Beban Operasional', type: 'debit', isDefault: true },
  { id: '608', name: 'Beban Lainnya', category: 'Beban Lain-lain', type: 'debit', isDefault: true },
];

// ─── Jurnal Saldo Awal Persediaan ────────────────────────────────────────────
// Debit Persediaan Barang = total nilai HPP × stok awal semua produk
const NILAI_PERSEDIAAN_AWAL = INITIAL_PRODUCTS.reduce((s, p) => s + (p.hpp || 0) * p.stock, 0);

const INITIAL_JOURNAL = NILAI_PERSEDIAAN_AWAL > 0 ? [
  {
    id: 'JU-INIT',
    date: '2026-01-01',
    description: 'Saldo Awal Persediaan Barang',
    ref: 'INIT',
    debit: NILAI_PERSEDIAAN_AWAL,
    credit: 0,
    account: getAccountName(state, ACC.PERSEDIAAN),
  },
  {
    id: 'JU-INIT',
    date: '2026-01-01',
    description: 'Saldo Awal Modal Koperasi',
    ref: 'INIT',
    debit: 0,
    credit: NILAI_PERSEDIAAN_AWAL,
    account: getAccountName(state, ACC.MODAL_POKOK),
  },
] : [];

const INITIAL_CASH_LOANS = [];

const INITIAL_CREDIT_GOODS = [];


export const useStore = create(
  persist(
    (set) => ({
  // Data State
  accounts: INITIAL_ACCOUNTS,
  members: INITIAL_MEMBERS,
  products: INITIAL_PRODUCTS,
  consignmentProducts: INITIAL_CONSIGNMENT,
  services: INITIAL_SERVICES,
  journal: INITIAL_JOURNAL,
  cashLoans: INITIAL_CASH_LOANS,
  creditGoods: INITIAL_CREDIT_GOODS,
  customers: [],

  // Tracks sales transactions per member for SHU JUA calculation
  // Shape: [{ id, date, memberId, memberName, type, amount }]
  memberSalesTransactions: [],

  // User / Auth State
  currentUser: null,
  darkMode: false,
  
  // Actions
  addAccount: (acc) => set((state) => ({ accounts: [...state.accounts, { ...acc, isDefault: false }] })),
  updateAccount: (id, updates) => set((state) => ({
    accounts: state.accounts.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
  deleteAccount: (id) => set((state) => ({
    accounts: state.accounts.filter(a => a.id !== id || a.isDefault)
  })),
  deleteTransaction: (id) => set((state) => ({
    journal: state.journal.filter(j => j.id !== id),
    memberSalesTransactions: state.memberSalesTransactions.filter(t => t.id !== id),
    cashLoans: state.cashLoans.filter(l => l.id !== id),
    creditGoods: state.creditGoods.filter(c => c.id !== id),
  })),
  deleteCreditGoods: (id) => set((state) => ({
    creditGoods: state.creditGoods.filter(c => c.id !== id),
  })),
  deleteCashLoan: (id) => set((state) => ({
    cashLoans: state.cashLoans.filter(l => l.id !== id),
  })),
  setSaldoAwal: (accountName, amount, date) => set((state) => {
    const saldoDate = date || '2026-01-01';
    // 1. Hapus entri JU-INIT untuk akun ini yang sebelumnya (jika ada)
    const oldJournal = state.journal.filter(j => !(j.id === 'JU-INIT' && j.account === accountName));
    
    // 2. Tambahkan entri baru jika amount != 0
    const newEntries = [];
    if (amount !== 0) {
      const category = state.accounts.find(a => a.name === accountName)?.category || '';
      const isDebitNormal = category.startsWith('Aset') || category.startsWith('Beban') || category === 'Harga Pokok Penjualan';
      const absAmount = Math.abs(amount);
      const isNegative = amount < 0;
      
      // Jika negatif, posisi terbalik dari normal
      let debit = 0;
      let credit = 0;
      if (isDebitNormal) {
        debit = isNegative ? 0 : absAmount;
        credit = isNegative ? absAmount : 0;
      } else {
        debit = isNegative ? absAmount : 0;
        credit = isNegative ? 0 : absAmount;
      }
      
      newEntries.push({
        id: 'JU-INIT',
        date: saldoDate,
        description: `Saldo Awal ${accountName}`,
        ref: 'INIT',
        debit,
        credit,
        account: accountName
      });
    }

    // 3. Hitung ulang total Debit & Credit dari semua JU-INIT kecuali Saldo Penyeimbang
    const allInit = [...oldJournal, ...newEntries].filter(j => j.id === 'JU-INIT' && j.account !== 'Saldo Penyeimbang');
    const totDeb = allInit.reduce((s, j) => s + (j.debit || 0), 0);
    const totCre = allInit.reduce((s, j) => s + (j.credit || 0), 0);
    const selisih = totDeb - totCre;

    // 4. Tambahkan Saldo Penyeimbang agar jurnal seimbang
    const finalJournal = [...oldJournal, ...newEntries].filter(j => j.id !== 'JU-INIT' || j.account !== 'Saldo Penyeimbang');
    if (selisih !== 0) {
      finalJournal.push({
        id: 'JU-INIT',
        date: saldoDate,
        description: 'Saldo Penyeimbang Historis',
        ref: 'INIT',
        debit: selisih < 0 ? Math.abs(selisih) : 0,
        credit: selisih > 0 ? selisih : 0,
        account: 'Saldo Penyeimbang'
      });
    }

    return { journal: finalJournal };
  }),

  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),
  toggleDarkMode: () => set((state) => {
    const next = !state.darkMode;
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    return { darkMode: next };
  }),

  // Bulk setters untuk Supabase sync
  setAccounts:               (accounts) => set({ accounts }),
  setMembers:                (members)  => set({ members }),
  setProducts:               (products) => set({ products }),
  setConsignmentProducts:    (items)    => set({ consignmentProducts: items }),
  setServices:               (services) => set({ services }),
  setJournal:                (journal)  => set({ journal }),
  setCashLoans:              (loans)    => set({ cashLoans: loans }),
  setCreditGoods:            (credits)  => set({ creditGoods: credits }),
  setMemberSalesTransactions:(txs)      => set({ memberSalesTransactions: txs }),

  addTransaction: (transactionEntries) => set((state) => ({
    journal: [...state.journal, ...transactionEntries]
  })),

  // Manual entry: Beban (expense) â€” Debet Beban X, Kredit Kas
  addExpense: (akunBeban, description, amount, txDate) => set((state) => {
    const newId = genJournalId();
    const date  = txDate || new Date().toISOString().split('T')[0];
    return {
      journal: [
        ...state.journal,
        { id: newId, date, description, ref: 'BKK', debit: amount,  credit: 0,      account: akunBeban },
        { id: newId, date, description, ref: 'BKK', debit: 0,       credit: amount, account: getAccountName(state, ACC.KAS_BANK)     },
      ]
    };
  }),

  // Manual entry: Pendapatan lain â€” Debet Kas, Kredit Pendapatan X
  addIncome: (akunPendapatan, description, amount, txDate) => set((state) => {
    const newId = genJournalId();
    const date  = txDate || new Date().toISOString().split('T')[0];
    return {
      journal: [
        ...state.journal,
        { id: newId, date, description, ref: 'BKM', debit: amount, credit: 0,      account: getAccountName(state, ACC.KAS_BANK)            },
        { id: newId, date, description, ref: 'BKM', debit: 0,      credit: amount, account: akunPendapatan    },
      ]
    };
  }),

  // Kas Kecil: Pengisian Saldo
  replenishPettyCash: (amount, description = 'Pengisian Kas Kecil', txDate) => set((state) => {
    const newId = genJournalId();
    const date  = txDate || new Date().toISOString().split('T')[0];
    return {
      journal: [
        ...state.journal,
        { id: newId, date, description, ref: 'BKK', debit: amount, credit: 0, account: getAccountName(state, ACC.KAS_KECIL) },
        { id: newId, date, description, ref: 'BKK', debit: 0, credit: amount, account: getAccountName(state, ACC.KAS_BANK) },
      ]
    };
  }),

  // Kas Kecil: Pencatatan Pengeluaran
  addPettyCashExpense: (akunBeban, amount, description, txDate) => set((state) => {
    const newId = genJournalId();
    const date  = txDate || new Date().toISOString().split('T')[0];
    return {
      journal: [
        ...state.journal,
        { id: newId, date, description, ref: 'BKK', debit: amount, credit: 0, account: akunBeban },
        { id: newId, date, description, ref: 'BKK', debit: 0, credit: amount, account: getAccountName(state, ACC.KAS_KECIL) },
      ]
    };
  }),

  // Tutup Buku (Closing Entries)
  closePeriod: (periodDate, notes) => set((state) => {
    // 1. Ambil semua akun nominal (Pendapatan, HPP, Beban)
    const nominalAccounts = state.accounts.filter(a => 
      a.category.includes('Pendapatan') || 
      a.category.includes('Beban') || 
      a.category === 'Harga Pokok Penjualan'
    );
    const nominalAccountNames = nominalAccounts.map(a => a.name);

    // 2. Ambil semua jurnal sampai dengan periodDate untuk akun nominal
    // Kita memasukkan isClosingEntry sebelumnya jika ada, agar tidak double-counting
    const relevantJournal = state.journal.filter(j => 
      j.date <= periodDate && nominalAccountNames.includes(j.account)
    );

    // 3. Hitung saldo saat ini (bersih) tiap akun nominal
    const balances = {};
    nominalAccounts.forEach(acc => {
      balances[acc.name] = { debit: 0, credit: 0, type: acc.type };
    });

    relevantJournal.forEach(e => {
      if (balances[e.account]) {
        balances[e.account].debit += (e.debit || 0);
        balances[e.account].credit += (e.credit || 0);
      }
    });

    const closingEntries = [];
    const newJournalId = `JU-CLS-${String(Date.now()).slice(-6)}`;
    let totalLaba = 0; // Positif jika Laba, Negatif jika Rugi

    // 4. Buat jurnal pembalik (penutup)
    Object.keys(balances).forEach(accName => {
      const b = balances[accName];
      const netBalance = b.type === 'debit' ? (b.debit - b.credit) : (b.credit - b.debit);
      
      if (netBalance === 0) return;

      if (b.type === 'debit') {
        // Saldo normal Debit (Beban/HPP). Tutup di Kredit.
        closingEntries.push({
          id: newJournalId,
          date: periodDate,
          description: `Tutup Buku: ${notes}`,
          ref: 'CLS',
          debit: 0,
          credit: netBalance,
          account: accName,
          isClosingEntry: true
        });
        totalLaba -= netBalance;
      } else {
        // Saldo normal Kredit (Pendapatan). Tutup di Debit.
        closingEntries.push({
          id: newJournalId,
          date: periodDate,
          description: `Tutup Buku: ${notes}`,
          ref: 'CLS',
          debit: netBalance,
          credit: 0,
          account: accName,
          isClosingEntry: true
        });
        totalLaba += netBalance;
      }
    });

    // 5. Entri lawan ke SHU Tahun Berjalan
    if (closingEntries.length > 0) {
      closingEntries.push({
        id: newJournalId,
        date: periodDate,
        description: `Ikhtisar Laba Rugi / Pemindahan SHU: ${notes}`,
        ref: 'CLS',
        debit: totalLaba < 0 ? Math.abs(totalLaba) : 0,
        credit: totalLaba > 0 ? totalLaba : 0,
        account: 'Laba SHU Berjalan',
        isClosingEntry: true
      });
    }

    return { journal: [...state.journal, ...closingEntries] };
  }),

  updateProductStock: (productId, qtyChange) => set((state) => ({
    products: state.products.map(p => p.id === productId ? { ...p, stock: p.stock + qtyChange } : p)
  })),

  addMember: (member) => set((state) => {
    // Ambil nomor tertinggi dari ID yang sudah ada untuk menghindari duplikat
    const maxNum = state.members.reduce((max, m) => {
      const match = m.id && m.id.match(/KPKCG-(\d+)/);
      if (match) return Math.max(max, parseInt(match[1], 10));
      return max;
    }, 0);
    const newId = `KPKCG-${String(maxNum + 1).padStart(3, '0')}`;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const date = member.joinDate || todayStr;

    // Buat jurnal entry terpisah untuk simpanan pokok dan wajib
    const journalEntries = [];
    const pokok = Number(member.pokok || 0);
    const wajib = Number(member.wajib || 0);
    const sukarela = Number(member.sukarela || 0);
    let journalIdx = 0; // unused, using genJournalId()

    if (pokok > 0) {
      const jId = genJournalId();
      journalEntries.push(
        { id: jId, date, description: `Simpanan Pokok Anggota Baru (${member.name || newId})`, ref: newId, debit: pokok, credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: jId, date, description: `Simpanan Pokok Anggota Baru (${member.name || newId})`, ref: newId, debit: 0, credit: pokok, account: getAccountName(state, ACC.MODAL_POKOK) }
      );
    }
    if (wajib > 0) {
      const jId = genJournalId();
      journalEntries.push(
        { id: jId, date, description: `Simpanan Wajib Anggota Baru (${member.name || newId})`, ref: newId, debit: wajib, credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: jId, date, description: `Simpanan Wajib Anggota Baru (${member.name || newId})`, ref: newId, debit: 0, credit: wajib, account: getAccountName(state, ACC.MODAL_WAJIB) }
      );
    }
    if (sukarela > 0) {
      const jId = genJournalId();
      journalEntries.push(
        { id: jId, date, description: `Simpanan Sukarela Anggota Baru (${member.name || newId})`, ref: newId, debit: sukarela, credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: jId, date, description: `Simpanan Sukarela Anggota Baru (${member.name || newId})`, ref: newId, debit: 0, credit: sukarela, account: getAccountName(state, ACC.MODAL_SUKARELA) }
      );
    }

    return {
      members: [...state.members, { ...member, id: newId, joinDate: date }],
      journal: [...state.journal, ...journalEntries]
    };
  }),

  updateMember: (id, data) => set((state) => ({
    members: state.members.map(m => m.id === id ? { ...m, ...data } : m)
  })),

  deleteMember: (id) => set((state) => ({
    members: state.members.filter(m => m.id !== id)
  })),

  // Patch joinDate untuk anggota lama yang belum punya
  patchMembersJoinDate: () => set((state) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    return {
      members: state.members.map((m) => {
        // Patch joinDate kalau belum ada
        return m.joinDate ? m : { ...m, joinDate: todayStr };
      })
    };
  }),

  depositSavings: (memberId, pokok, wajib, sukarela, customDate) => set((state) => {
    const totalDeposit = Number(pokok) + Number(wajib) + Number(sukarela);
    if (totalDeposit <= 0) return state;

    const newMembers = state.members.map(m => 
      m.id === memberId 
        ? { ...m, pokok: m.pokok + Number(pokok), wajib: m.wajib + Number(wajib), sukarela: m.sukarela + Number(sukarela) }
        : m
    );

    const today = new Date();
    const date = customDate || `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const journalEntries = [];

    if (Number(pokok) > 0) {
      const jId = genJournalId();
      journalEntries.push(
        { id: jId, date, description: 'Setoran Simpanan Pokok', ref: memberId, debit: Number(pokok), credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: jId, date, description: 'Setoran Simpanan Pokok', ref: memberId, debit: 0, credit: Number(pokok), account: getAccountName(state, ACC.MODAL_POKOK) }
      );
    }
    if (Number(wajib) > 0) {
      const jId = genJournalId();
      journalEntries.push(
        { id: jId, date, description: 'Setoran Simpanan Wajib', ref: memberId, debit: Number(wajib), credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: jId, date, description: 'Setoran Simpanan Wajib', ref: memberId, debit: 0, credit: Number(wajib), account: getAccountName(state, ACC.MODAL_WAJIB) }
      );
    }
    if (Number(sukarela) > 0) {
      const jId = genJournalId();
      journalEntries.push(
        { id: jId, date, description: 'Setoran Simpanan Sukarela', ref: memberId, debit: Number(sukarela), credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: jId, date, description: 'Setoran Simpanan Sukarela', ref: memberId, debit: 0, credit: Number(sukarela), account: getAccountName(state, ACC.MODAL_SUKARELA) }
      );
    }

    return { members: newMembers, journal: [...state.journal, ...journalEntries] };
  }),

  depositSavingsBulk: (memberIds, wajibAmount, date) => set((state) => {
    if (!memberIds.length || wajibAmount <= 0) return state;

    const newMembers = state.members.map(m => 
      memberIds.includes(m.id)
        ? { ...m, wajib: m.wajib + Number(wajibAmount) }
        : m
    );

    const journalEntries = [];
    
    memberIds.forEach((mId, index) => {
      const newJournalId = genJournalId();
      journalEntries.push(
        { id: newJournalId, date, description: 'Setoran Simpanan Wajib (Massal)', ref: mId, debit: Number(wajibAmount), credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: newJournalId, date, description: 'Setoran Simpanan Wajib (Massal)', ref: mId, debit: 0, credit: Number(wajibAmount), account: getAccountName(state, ACC.MODAL_WAJIB) }
      );
    });

    return { members: newMembers, journal: [...state.journal, ...journalEntries] };
  }),

  addCashLoan: (loan) => set((state) => {
    const newId = `PLN-${String(state.cashLoans.length + 1).padStart(3, '0')}`;
    return { cashLoans: [...state.cashLoans, { ...loan, id: newId, status: 'Pending', remainingAmount: loan.amount }] };
  }),

  addCreditGoods: (credit) => set((state) => {
    const newId = `KRD-${String(state.creditGoods.length + 1).padStart(3, '0')}`;
    const sisaPokok = credit.amount - credit.dp;
    const totalBunga = sisaPokok * ((credit.interest || 0) / 100) * (credit.tenor || 1);
    const totalPiutang = sisaPokok + totalBunga;
    return { creditGoods: [...state.creditGoods, { ...credit, id: newId, status: 'Pending', remainingAmount: totalPiutang }] };
  }),

  addProduct: (product) => set((state) => {
    const maxId = state.products.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const newId = maxId + 1;
    return { products: [...state.products, { ...product, id: newId, minStock: product.minStock || 10 }] };
  }),

  updateProduct: (id, data) => set((state) => ({
    products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
  })),

  deleteProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id)
  })),

  addConsignment: (consignment) => set((state) => {
    const maxId = state.consignmentProducts.reduce((max, p) => Math.max(max, p.id || 0), 0);
    const newId = maxId + 1;
    return { consignmentProducts: [...state.consignmentProducts, { ...consignment, id: newId, minStock: consignment.minStock || 10 }] };
  }),

  updateConsignment: (id, data) => set((state) => ({
    consignmentProducts: state.consignmentProducts.map(p => p.id === id ? { ...p, ...data } : p)
  })),

  deleteConsignment: (id) => set((state) => ({
    consignmentProducts: state.consignmentProducts.filter(p => p.id !== id)
  })),

  addService: (service) => set((state) => {
    const maxId = state.services.reduce((max, s) => Math.max(max, s.id || 0), 0);
    const newId = maxId + 1;
    return { services: [...state.services, { ...service, id: newId }] };
  }),

  updateService: (id, data) => set((state) => ({
    services: state.services.map(s => s.id === id ? { ...s, ...data } : s)
  })),

  deleteService: (id) => set((state) => ({
    services: state.services.filter(s => s.id !== id)
  })),

  addCustomer: (customer) => set((state) => {
    const newId = `CST-${Date.now()}`;
    return { customers: [...(state.customers || []), { ...customer, id: newId }] };
  }),

  // Transactions Actions
  checkoutRetail: (cart, totalAmount, markupAmount = 0, buyer, paymentMethod = 'Cash', installments = 1, startDate = null, notes = '', txDate) => set((state) => {
    // Deduct stock
    const newProducts = state.products.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.qty };
      return p;
    });

    const newJournalId = genJournalId();
    const date = txDate || new Date().toISOString().split('T')[0];
    const totalHPP = cart.reduce((s, item) => s + (item.hpp || 0) * item.qty, 0);

    // Create item details string
    const itemDetails = cart.map(item => `${item.name} x${item.qty}`).join(', ');

    // Cash -> Kas, Kredit -> Piutang Dagang
    const akunDebit = paymentMethod === 'Kredit' ? getAccountName(state, ACC.PIUTANG_DAGANG) : getAccountName(state, ACC.KAS_BANK);
    const desc = paymentMethod === 'Kredit'
      ? `Penjualan Ritel [${itemDetails}] (Kredit${startDate ? `, mulai ${startDate}` : ''}${notes ? ` - ${notes}` : ''})`
      : `Penjualan Ritel [${itemDetails}]`;

    const grandTotal = totalAmount + markupAmount;

    const buyerId = buyer ? buyer.id : 'BKM-RTL';
    const timestamp = new Date().toISOString();
    const journalEntries = [
      { id: newJournalId, date, timestamp, description: desc, ref: paymentMethod === 'Kredit' ? buyerId : 'BKM-RTL', debit: grandTotal, credit: 0, account: akunDebit },
      { id: newJournalId, date, timestamp, description: desc, ref: paymentMethod === 'Kredit' ? buyerId : 'BKM-RTL', debit: 0, credit: totalAmount, account: getAccountName(state, ACC.PENDAPATAN_RITEL) },
      ...(markupAmount > 0 ? [
        { id: newJournalId, date, timestamp, description: `Markup Kredit 10%`, ref: paymentMethod === 'Kredit' ? buyerId : 'BKM-RTL', debit: 0, credit: markupAmount, account: getAccountName(state, ACC.PENDAPATAN_BUNGA) }
      ] : []),
      ...(totalHPP > 0 ? [
        { id: newJournalId, date, timestamp, description: 'HPP Penjualan Ritel', ref: 'BKK-HPP', debit: totalHPP, credit: 0, account: getAccountName(state, ACC.HPP) },
        { id: newJournalId, date, timestamp, description: 'HPP Penjualan Ritel', ref: 'BKK-HPP', debit: 0, credit: totalHPP, account: getAccountName(state, ACC.PERSEDIAAN) },
      ] : []),
    ];

    const isMember = buyer && buyer.type === 'member';
    const newMemberTx = isMember
      ? [...state.memberSalesTransactions, { id: newJournalId, date, memberId: buyer.id, memberName: buyer.name, type: 'Ritel', amount: grandTotal }]
      : state.memberSalesTransactions;

    let newCreditGoods = state.creditGoods;
    if (paymentMethod === 'Kredit' && buyer) {
      const schedule = buildSchedule(grandTotal, installments, startDate || date);
      const newCreditId = `KRG-RTL-${String(Date.now()).slice(-6)}`;
      newCreditGoods = [
        ...state.creditGoods,
        {
          id: newCreditId,
          memberId: buyer.id,
          name: buyer.name,
          itemName: `Kasbon Penjualan Ritel`,
          amount: grandTotal,
          dp: 0,
          tenor: installments,
          interest: 0,
          status: 'Active',
          remainingAmount: grandTotal,
          applyDate: date,
          takeDate: date,
          startDate: startDate || date,
          installments: schedule
        }
      ];
    }

    return { products: newProducts, journal: [...state.journal, ...journalEntries], memberSalesTransactions: newMemberTx, creditGoods: newCreditGoods };
  }),

  checkoutConsignment: (cart, totalAmount, totalCommission, totalSupplier, memberId, paymentMethod = 'Cash', installments = 1, startDate = null, notes = '', txDate) => set((state) => {
    const newConsignment = state.consignmentProducts.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.qty };
      return p;
    });

    const newJournalId = genJournalId();
    const date = txDate || new Date().toISOString().split('T')[0];

    // Create item details string
    const itemDetails = cart.map(item => `${item.name} x${item.qty}`).join(', ');

    const akunDebit = paymentMethod === 'Kredit' ? getAccountName(state, ACC.PIUTANG_DAGANG) : getAccountName(state, ACC.KAS_BANK);
    const desc = paymentMethod === 'Kredit'
      ? `Penjualan Titipan [${itemDetails}] (Kredit${startDate ? `, mulai ${startDate}` : ''}${notes ? ` - ${notes}` : ''})`
      : `Penjualan Titipan [${itemDetails}]`;

    const journalEntries = [
      { id: newJournalId, date, description: desc, ref: paymentMethod === 'Kredit' ? memberId : 'BKM-KNS', debit: totalAmount, credit: 0, account: akunDebit },
      { id: newJournalId, date, description: 'Komisi Konsinyasi', ref: paymentMethod === 'Kredit' ? memberId : 'BKM-KNS', debit: 0, credit: totalCommission, account: getAccountName(state, ACC.PENDAPATAN_KOMISI) },
      { id: newJournalId, date, description: 'Hutang Titipan', ref: paymentMethod === 'Kredit' ? memberId : 'BKM-KNS', debit: 0, credit: totalSupplier, account: getAccountName(state, ACC.HUTANG_KONSINYASI) }
    ];

    const member = memberId ? state.members.find(m => m.id === memberId) : null;
    const newMemberTx = member
      ? [...state.memberSalesTransactions, { id: newJournalId, date, memberId, memberName: member.name, type: 'Konsinyasi', amount: totalAmount }]
      : state.memberSalesTransactions;

    return { consignmentProducts: newConsignment, journal: [...state.journal, ...journalEntries], memberSalesTransactions: newMemberTx };
  }),

  checkoutService: (cart, totalAmount, biayaJasa = 0, memberId, paymentMethod = 'Cash', installments = 1, startDate = null, notes = '', txDate) => set((state) => {
    const newJournalId = genJournalId();
    const date = txDate || new Date().toISOString().split('T')[0];
    const totalHPP = cart.reduce((s, item) => s + (item.hpp || 0) * item.qty, 0);

    const itemDetails = cart.map(item => `${item.name} x${item.qty}`).join(', ');
    const akunDebit = paymentMethod === 'Kredit' ? getAccountName(state, ACC.PIUTANG_DAGANG) : getAccountName(state, ACC.KAS_BANK);
    const desc = paymentMethod === 'Kredit'
      ? `Penjualan Jasa/PPOB [${itemDetails}] (Kredit${startDate ? `, mulai ${startDate}` : ''}${notes ? ` - ${notes}` : ''})`
      : `Penjualan Jasa/PPOB [${itemDetails}]`;

    const grandTotal = totalAmount + biayaJasa;

    const journalEntries = [
      { id: newJournalId, date, description: desc, ref: paymentMethod === 'Kredit' ? memberId : 'BKM-JSA', debit: grandTotal, credit: 0, account: akunDebit },
      { id: newJournalId, date, description: desc, ref: paymentMethod === 'Kredit' ? memberId : 'BKM-JSA', debit: 0, credit: totalAmount, account: getAccountName(state, ACC.PENDAPATAN_JASA) },
      ...(biayaJasa > 0 ? [
        { id: newJournalId, date, description: `Biaya Jasa (${paymentMethod})`, ref: paymentMethod === 'Kredit' ? memberId : 'BKM-JSA', debit: 0, credit: biayaJasa, account: getAccountName(state, ACC.PENDAPATAN_JASA) }
      ] : []),
      ...(totalHPP > 0 ? [
        { id: newJournalId, date, description: 'HPP Penjualan Jasa', ref: 'BKK-HPP', debit: totalHPP, credit: 0, account: getAccountName(state, ACC.HPP) },
        { id: newJournalId, date, description: 'HPP Penjualan Jasa', ref: 'BKK-HPP', debit: 0, credit: totalHPP, account: getAccountName(state, ACC.PERSEDIAAN) },
      ] : []),
    ];

    const member = memberId ? state.members.find(m => m.id === memberId) : null;
    const newMemberTx = member
      ? [...state.memberSalesTransactions, { id: newJournalId, date, memberId, memberName: member.name, type: 'Jasa', amount: grandTotal }]
      : state.memberSalesTransactions;

    let newCreditGoods = state.creditGoods;
    if (paymentMethod === 'Kredit' && member) {
      const schedule = buildSchedule(grandTotal, installments, startDate || date);
      const newCreditId = `KRG-JSA-${String(Date.now()).slice(-6)}`;
      newCreditGoods = [
        ...state.creditGoods,
        {
          id: newCreditId,
          memberId: member.id,
          name: member.name,
          itemName: `Kasbon Penjualan Jasa`,
          amount: grandTotal,
          dp: 0,
          tenor: installments,
          interest: 0,
          status: 'Active',
          remainingAmount: grandTotal,
          applyDate: date,
          takeDate: date,
          startDate: startDate || date,
          installments: schedule
        }
      ];
    }

    return { journal: [...state.journal, ...journalEntries], memberSalesTransactions: newMemberTx, creditGoods: newCreditGoods };
  }),

  restockProduct: (productId, qty, hpp, supplier = '', paymentMethod = 'Kas Bank', notes = '', txDate) => set((state) => {
    const date = txDate || new Date().toISOString().split('T')[0];
    const newId = genJournalId();
    const product = state.products.find(p => p.id === productId);
    const totalCost = qty * hpp;
    
    // HPP Rata-rata Tertimbang (Weighted Average Cost)
    const oldStock = product?.stock || 0;
    const oldHpp = product?.hpp || 0;
    const oldTotalValue = oldStock * oldHpp;
    const newTotalValue = oldTotalValue + totalCost;
    const newTotalStock = oldStock + qty;
    const avgHpp = newTotalStock > 0 ? Math.round(newTotalValue / newTotalStock) : hpp;

    let desc = `Pembelian ${product?.name}`;
    if (supplier) desc += ` (Supplier: ${supplier})`;
    if (notes) desc += ` - ${notes}`;

    const kreditAccount = paymentMethod === 'Hutang Dagang' ? getAccountName(state, ACC.HUTANG_DAGANG) : 
                          paymentMethod === 'Kas Kecil' ? getAccountName(state, ACC.KAS_KECIL) : getAccountName(state, ACC.KAS_BANK);

    return {
      products: state.products.map(p => p.id === productId ? { ...p, stock: newTotalStock, hpp: avgHpp } : p),
      journal: [...state.journal,
        { id: newId, date, description: desc, ref: 'BKK-RST', debit: totalCost, credit: 0, account: getAccountName(state, ACC.PERSEDIAAN) },
        { id: newId, date, description: desc, ref: 'BKK-RST', debit: 0, credit: totalCost, account: kreditAccount },
      ]
    };
  }),

  restockConsignment: (productId, qty) => set((state) => ({
    consignmentProducts: state.consignmentProducts.map(p => p.id === productId ? { ...p, stock: p.stock + qty } : p)
  })),

  restockService: (serviceId, hpp) => set((state) => ({
    services: state.services.map(s => s.id === serviceId ? { ...s, hpp } : s)
  })),

  // Loan Actions
  approveCashLoan: (loanId, txDate) => set((state) => {
    const loan = state.cashLoans.find(l => l.id === loanId);
    if (!loan) return state;

    const date = txDate || new Date().toISOString().split('T')[0];
    
    // Generate schedule
    const rawSchedule = buildSchedule(loan.amount, loan.tenor, date);
    const schedule = rawSchedule.map(s => ({
      no: s.no,
      dueDate: s.date,
      amount: s.amount,
      status: 'Pending',
      paidDate: null
    }));

    const newLoans = state.cashLoans.map(l => l.id === loanId ? { ...l, status: 'Active', installments: schedule } : l);
    
    const newJournalId = genJournalId();
    const journalEntries = [
      { id: newJournalId, date, description: `Pencairan Pinjaman ${loan.name}`, ref: loan.id, debit: loan.amount, credit: 0, account: getAccountName(state, ACC.PIUTANG_ANGGOTA) },
      { id: newJournalId, date, description: `Pencairan Pinjaman ${loan.name}`, ref: loan.id, debit: 0, credit: loan.amount, account: getAccountName(state, ACC.KAS_BANK) }
    ];

    return { cashLoans: newLoans, journal: [...state.journal, ...journalEntries] };
  }),

  payCashLoan: (loanId, paymentAmount, txDate) => set((state) => {
    const loan = state.cashLoans.find(l => l.id === loanId);
    if (!loan) return state;

    const newRemaining = Math.max(0, loan.remainingAmount - paymentAmount);
    const newStatus = newRemaining === 0 ? 'Completed' : loan.status;

    const date = txDate || new Date().toISOString().split('T')[0];

    // Mark corresponding installments as paid
    let amountLeft = paymentAmount;
    const newInstallments = [...(loan.installments || [])].map(inst => {
      if (amountLeft > 0 && inst.status !== 'Paid') {
        if (amountLeft >= inst.amount * 0.9) { // close enough to full installment
          amountLeft -= inst.amount;
          return { ...inst, status: 'Paid', paidDate: date };
        }
      }
      return inst;
    });

    const newLoans = state.cashLoans.map(l => l.id === loanId ? { ...l, remainingAmount: newRemaining, status: newStatus, installments: newInstallments } : l);

    const newJournalId = genJournalId();
    
    // Simplification: Not calculating interest separation, just pure deduction for simulation
    const journalEntries = [
      { id: newJournalId, date, description: `Angsuran Pinjaman ${loan.name}`, ref: loan.id, debit: paymentAmount, credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
      { id: newJournalId, date, description: `Angsuran Pinjaman ${loan.name}`, ref: loan.id, debit: 0, credit: paymentAmount, account: getAccountName(state, ACC.PIUTANG_ANGGOTA) }
    ];

    return { cashLoans: newLoans, journal: [...state.journal, ...journalEntries] };
  }),

  approveCreditGoods: (creditId, txDate) => set((state) => {
    const credit = state.creditGoods.find(c => c.id === creditId);
    if (!credit) return state;

    const date = txDate || new Date().toISOString().split('T')[0];
    const sisaPokok = credit.amount - credit.dp;
    const totalBunga = sisaPokok * ((credit.interest || 0) / 100) * (credit.tenor || 1);
    const totalPiutang = sisaPokok + totalBunga;

    // Generate schedule
    const rawSchedule = buildSchedule(totalPiutang, credit.tenor, credit.startDate || date);
    const schedule = rawSchedule.map(s => ({
      no: s.no,
      dueDate: s.date,
      amount: s.amount,
      status: 'Pending',
      paidDate: null
    }));

    const newCredits = state.creditGoods.map(c => c.id === creditId ? { ...c, status: 'Active', installments: schedule } : c);
    
    const newJournalId = genJournalId();
    
    const journalEntries = [
      { id: newJournalId, date, description: `Kredit Barang ${credit.itemName}`, ref: credit.id, debit: credit.amount, credit: 0, account: getAccountName(state, ACC.PIUTANG_BARANG) },
      { id: newJournalId, date, description: `Kredit Barang ${credit.itemName}`, ref: credit.id, debit: 0, credit: credit.amount, account: getAccountName(state, ACC.PERSEDIAAN) },
      // DP Handling
      ...(credit.dp > 0 ? [
        { id: newJournalId + 'DP', date, description: `DP Kredit ${credit.itemName}`, ref: credit.id, debit: credit.dp, credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
        { id: newJournalId + 'DP', date, description: `DP Kredit ${credit.itemName}`, ref: credit.id, debit: 0, credit: credit.dp, account: getAccountName(state, ACC.PIUTANG_BARANG) }
      ] : []),
      // Bunga Handling
      ...(totalBunga > 0 ? [
        { id: newJournalId + 'B', date, description: `Bunga Kredit ${credit.itemName}`, ref: credit.id, debit: totalBunga, credit: 0, account: getAccountName(state, ACC.PIUTANG_BARANG) },
        { id: newJournalId + 'B', date, description: `Bunga Kredit ${credit.itemName}`, ref: credit.id, debit: 0, credit: totalBunga, account: getAccountName(state, ACC.PENDAPATAN_BUNGA) }
      ] : [])
    ];

    return { creditGoods: newCredits, journal: [...state.journal, ...journalEntries] };
  }),

  payCreditGoods: (creditId, paymentAmount, txDate) => set((state) => {
    const credit = state.creditGoods.find(c => c.id === creditId);
    if (!credit) return state;

    const newRemaining = Math.max(0, credit.remainingAmount - paymentAmount);
    const newStatus = newRemaining === 0 ? 'Completed' : credit.status;
    const date = txDate || new Date().toISOString().split('T')[0];

    // Mark corresponding installments as paid
    let amountLeft = paymentAmount;
    const newInstallments = [...(credit.installments || [])].map(inst => {
      if (amountLeft > 0 && inst.status !== 'Paid') {
        if (amountLeft >= inst.amount * 0.9) { // close enough to full installment
          amountLeft -= inst.amount;
          return { ...inst, status: 'Paid', paidDate: date };
        }
      }
      return inst;
    });

    const newCredits = state.creditGoods.map(c => c.id === creditId ? { ...c, remainingAmount: newRemaining, status: newStatus, installments: newInstallments } : c);

    const newJournalId = genJournalId();
    
    const journalEntries = [
      { id: newJournalId, date, description: `Angsuran Kredit ${credit.itemName}`, ref: credit.id, debit: paymentAmount, credit: 0, account: getAccountName(state, ACC.KAS_BANK) },
      { id: newJournalId, date, description: `Angsuran Kredit ${credit.itemName}`, ref: credit.id, debit: 0, credit: paymentAmount, account: getAccountName(state, ACC.PIUTANG_BARANG) }
    ];

    return { creditGoods: newCredits, journal: [...state.journal, ...journalEntries] };
  }),

  // Payroll Deduction (Potong Gaji per Member)
  processPayrollDeduction: (memberId, payments, txDate) => set((state) => {
    const date = txDate || new Date().toISOString().split('T')[0];
    const newJournalId = genJournalId();
    const journalEntries = [];
    const newCashLoans = [...state.cashLoans];
    const newCreditGoods = [...state.creditGoods];

    let totalCash = 0;
    let totalDagang = 0;
    let totalAnggota = 0;
    let totalBarang = 0;

    payments.forEach(pay => {
      if (pay.amount <= 0) return;
      totalCash += pay.amount;

      if (pay.type === 'CashLoan') {
        totalAnggota += pay.amount;
        const idx = newCashLoans.findIndex(l => l.id === pay.id);
        if (idx !== -1) {
          const loan = newCashLoans[idx];
          const newRemaining = Math.max(0, loan.remainingAmount - pay.amount);
          
          let amountLeft = pay.amount;
          const newInstallments = [...(loan.installments || [])].map(inst => {
            if (amountLeft >= inst.amount * 0.9 && inst.status !== 'Paid') {
              amountLeft -= inst.amount;
              return { ...inst, status: 'Paid', paidDate: date };
            }
            return inst;
          });

          newCashLoans[idx] = { ...loan, remainingAmount: newRemaining, status: newRemaining === 0 ? 'Completed' : 'Active', installments: newInstallments };
        }
      } else if (pay.type === 'CreditGood') {
        const idx = newCreditGoods.findIndex(c => c.id === pay.id);
        if (idx !== -1) {
          const credit = newCreditGoods[idx];
          if (credit.itemName.includes('Kasbon Penjualan Ritel') || credit.itemName.includes('Kasbon Penjualan Jasa')) {
            totalDagang += pay.amount;
          } else {
            totalBarang += pay.amount;
          }
          const newRemaining = Math.max(0, credit.remainingAmount - pay.amount);

          let amountLeft = pay.amount;
          const newInstallments = [...(credit.installments || [])].map(inst => {
            if (amountLeft >= inst.amount * 0.9 && inst.status !== 'Paid') {
              amountLeft -= inst.amount;
              return { ...inst, status: 'Paid', paidDate: date };
            }
            return inst;
          });

          newCreditGoods[idx] = { ...credit, remainingAmount: newRemaining, status: newRemaining === 0 ? 'Completed' : 'Active', installments: newInstallments };
        }
      } else if (pay.type === 'LegacyDagang') {
        totalDagang += pay.amount;
      }
    });

    if (totalCash > 0) {
      journalEntries.push({ id: newJournalId, date, description: `Pelunasan Potong Gaji`, ref: memberId, debit: totalCash, credit: 0, account: getAccountName(state, ACC.KAS_BANK) });
      if (totalDagang > 0) {
        journalEntries.push({ id: newJournalId, date, description: `Pelunasan Kasbon Ritel/Jasa`, ref: memberId, debit: 0, credit: totalDagang, account: getAccountName(state, ACC.PIUTANG_DAGANG) });
      }
      if (totalAnggota > 0) {
        journalEntries.push({ id: newJournalId, date, description: `Pelunasan Pinjaman Tunai`, ref: memberId, debit: 0, credit: totalAnggota, account: getAccountName(state, ACC.PIUTANG_ANGGOTA) });
      }
      if (totalBarang > 0) {
        journalEntries.push({ id: newJournalId, date, description: `Pelunasan Kredit Barang`, ref: memberId, debit: 0, credit: totalBarang, account: getAccountName(state, ACC.PIUTANG_BARANG) });
      }
    }

    return {
      cashLoans: newCashLoans,
      creditGoods: newCreditGoods,
      journal: [...state.journal, ...journalEntries]
    };
  }),

  migrateKasToKasBank: () => set((state) => {
    let changed = false;
    const newJournal = state.journal.map(j => {
      if (j.account === 'Kas') {
        changed = true;
        return { ...j, account: getAccountName(state, ACC.KAS_BANK) };
      }
      return j;
    });
    return changed ? { journal: newJournal } : {};
  }),

    }),
    {
      name: 'koperasi-store-v6',           // localStorage key — bump versi untuk reset data lama
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Simpan semua data kecuali session login (keamanan)
        accounts:               state.accounts,
        members:                state.members,
        customers:              state.customers,
        products:               state.products,
        consignmentProducts:    state.consignmentProducts,
        services:               state.services,
        journal:                state.journal,
        cashLoans:              state.cashLoans,
        creditGoods:            state.creditGoods,
        memberSalesTransactions: state.memberSalesTransactions,
        darkMode:               state.darkMode,
        currentUser:            state.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Patch akun jika belum ada
        if (!state.accounts || state.accounts.length === 0) {
          state.accounts = INITIAL_ACCOUNTS;
        } else {
          // Migrasi akun lama yang memakai klasifikasi usang
          const categoryMap = {
            'Aktiva': 'Aset Lancar',
            'Kewajiban': 'Kewajiban Jangka Pendek',
            'HPP': 'Harga Pokok Penjualan',
            'Beban': 'Beban Operasional'
          };
          state.accounts = state.accounts.map(acc => {
            if (categoryMap[acc.category]) {
              return { ...acc, category: categoryMap[acc.category] };
            }
            return acc;
          });
        }

        // Patch joinDate untuk anggota yang belum punya
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        if (state.members) {
          state.members = state.members.map(m => m.joinDate ? m : { ...m, joinDate: todayStr });
        }

        const sudahAda = state.journal.some(j => j.id === 'JU-INIT');
        if (!sudahAda && NILAI_PERSEDIAAN_AWAL > 0) {
          state.journal = [
            { id: 'JU-INIT', date: '2026-01-01', description: 'Saldo Awal Persediaan Barang', ref: 'INIT', debit: NILAI_PERSEDIAAN_AWAL, credit: 0, account: getAccountName(state, ACC.PERSEDIAAN) },
            { id: 'JU-INIT', date: '2026-01-01', description: 'Saldo Awal Modal Koperasi', ref: 'INIT', debit: 0, credit: NILAI_PERSEDIAAN_AWAL, account: getAccountName(state, ACC.MODAL_POKOK) },
            ...state.journal,
          ];
        }
      },
    }
  )
);
