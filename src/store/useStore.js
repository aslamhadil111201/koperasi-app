import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// â”€â”€â”€ Master Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INITIAL_MEMBERS = [];

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Beras Pandan Wangi 5kg',        price: 68000,    hpp: 55000,    stock: 45, category: 'Sembako' },
  { id: 2, name: 'Minyak Goreng Bimoli 2L',        price: 36000,    hpp: 29000,    stock: 30, category: 'Sembako' },
  { id: 3, name: 'Gula Pasir 1kg',                 price: 15000,    hpp: 12000,    stock: 60, category: 'Sembako' },
  { id: 4, name: 'Indomie Goreng (Karton)',         price: 115000,   hpp: 95000,    stock: 18, category: 'Makanan' },
  { id: 5, name: 'Sabun Mandi Lifebuoy 3pcs',      price: 12500,    hpp: 10000,    stock: 40, category: 'Kebersihan' },
  // Elektronik & Perabot (untuk kredit barang)
  { id: 6,  name: 'Mesin Cuci Sharp 1 Tabung',     price: 1800000,  hpp: 1500000,  stock: 5,  category: 'Elektronik' },
  { id: 7,  name: 'Kulkas Aqua 1 Pintu',           price: 2200000,  hpp: 1850000,  stock: 4,  category: 'Elektronik' },
  { id: 8,  name: 'Kipas Angin Cosmos',             price: 350000,   hpp: 280000,   stock: 10, category: 'Elektronik' },
  { id: 9,  name: 'Rice Cooker Miyako 1.8L',       price: 280000,   hpp: 220000,   stock: 8,  category: 'Elektronik' },
  { id: 10, name: 'Setrika Philips',                price: 180000,   hpp: 140000,   stock: 10, category: 'Elektronik' },
  { id: 11, name: 'Kompor Gas Rinnai 2 Tungku',    price: 450000,   hpp: 370000,   stock: 6,  category: 'Perabot' },
  { id: 12, name: 'Tabung Gas 3kg + Regulator',    price: 200000,   hpp: 160000,   stock: 15, category: 'Perabot' },
  { id: 13, name: 'Kasur Busa 120x200cm',          price: 650000,   hpp: 520000,   stock: 5,  category: 'Perabot' },
  { id: 14, name: 'Lemari Pakaian 2 Pintu',        price: 1200000,  hpp: 950000,   stock: 3,  category: 'Perabot' },
  { id: 15, name: 'TV LED 32 inch',                price: 2500000,  hpp: 2100000,  stock: 4,  category: 'Elektronik' },
];

const INITIAL_CONSIGNMENT = [
  { id: 101, name: 'Keripik Pisang Manis 150g', price: 15000, stock: 20, supplier: 'Ibu Yani Handayani', supplierPrice: 11000 },
  { id: 102, name: 'Onde-Onde Kacang Hijau',    price: 8000,  stock: 15, supplier: 'Toko Kue Bu Sari',   supplierPrice: 5500  },
  { id: 103, name: 'Kerupuk Udang Sidoarjo',    price: 22000, stock: 12, supplier: 'Pak Santoso',         supplierPrice: 17000 },
  { id: 104, name: 'Tape Ketan Hitam 250g',     price: 12000, stock: 8,  supplier: 'Ibu Rini Wulandari', supplierPrice: 9000  },
];

const INITIAL_SERVICES = [
  { id: 201, name: 'Token Listrik PLN 50rb',    price: 51500,  hpp: 50000,  type: 'Token',        provider: 'PLN'       },
  { id: 202, name: 'Token Listrik PLN 100rb',   price: 102000, hpp: 100000, type: 'Token',        provider: 'PLN'       },
  { id: 203, name: 'Pulsa Telkomsel 50rb',       price: 51000,  hpp: 50000,  type: 'Pulsa',        provider: 'Telkomsel' },
  { id: 204, name: 'Pembayaran PDAM',            price: 3000,   hpp: 0,      type: 'Tagihan',      provider: 'PDAM', isFeeOnly: true },
  { id: 205, name: 'Fotokopi (per lembar)',       price: 500,    hpp: 200,    type: 'Administrasi', provider: 'Koperasi'  },
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
    account: 'Persediaan Barang',
  },
  {
    id: 'JU-INIT',
    date: '2026-01-01',
    description: 'Saldo Awal Modal Koperasi',
    ref: 'INIT',
    debit: 0,
    credit: NILAI_PERSEDIAAN_AWAL,
    account: 'Modal Koperasi',
  },
] : [];

const INITIAL_CASH_LOANS = [];

const INITIAL_CREDIT_GOODS = [];


export const useStore = create(
  persist(
    (set) => ({
  // Data State
  members: INITIAL_MEMBERS,
  products: INITIAL_PRODUCTS,
  consignmentProducts: INITIAL_CONSIGNMENT,
  services: INITIAL_SERVICES,
  journal: INITIAL_JOURNAL,
  cashLoans: INITIAL_CASH_LOANS,
  creditGoods: INITIAL_CREDIT_GOODS,

  // Tracks sales transactions per member for SHU JUA calculation
  // Shape: [{ id, date, memberId, memberName, type, amount }]
  memberSalesTransactions: [],

  // User / Auth State
  currentUser: null,
  darkMode: false,
  
  // Actions
  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),
  toggleDarkMode: () => set((state) => {
    const next = !state.darkMode;
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    return { darkMode: next };
  }),

  // Bulk setters untuk Supabase sync
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
  addExpense: (akunBeban, description, amount) => set((state) => {
    const newId = `JU-${String(state.journal.length + 1).padStart(4, '0')}`;
    const date  = new Date().toISOString().split('T')[0];
    return {
      journal: [
        ...state.journal,
        { id: newId, date, description, ref: 'BKK', debit: amount,  credit: 0,      account: akunBeban },
        { id: newId, date, description, ref: 'BKK', debit: 0,       credit: amount, account: 'Kas'     },
      ]
    };
  }),

  // Manual entry: Pendapatan lain â€” Debet Kas, Kredit Pendapatan X
  addIncome: (akunPendapatan, description, amount) => set((state) => {
    const newId = `JU-${String(state.journal.length + 1).padStart(4, '0')}`;
    const date  = new Date().toISOString().split('T')[0];
    return {
      journal: [
        ...state.journal,
        { id: newId, date, description, ref: 'BKM', debit: amount, credit: 0,      account: 'Kas'            },
        { id: newId, date, description, ref: 'BKM', debit: 0,      credit: amount, account: akunPendapatan    },
      ]
    };
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
    return {
      members: [...state.members, { ...member, id: newId, joinDate: member.joinDate || todayStr }]
    };
  }),

  updateMember: (id, data) => set((state) => ({
    members: state.members.map(m => m.id === id ? { ...m, ...data } : m)
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

    const newJournalId = `JU-${String(Math.floor(state.journal.length / 2) + 1).padStart(3, '0')}`;
    const today = new Date();
    const date = customDate || `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const journalEntries = [
      { id: newJournalId, date, description: 'Setoran Simpanan Anggota', ref: memberId, debit: totalDeposit, credit: 0, account: 'Kas' },
      { id: newJournalId, date, description: 'Setoran Simpanan Anggota', ref: memberId, debit: 0, credit: totalDeposit, account: 'Simpanan Anggota' }
    ];

    return { members: newMembers, journal: [...state.journal, ...journalEntries] };
  }),

  addCashLoan: (loan) => set((state) => {
    const newId = `PLN-${String(state.cashLoans.length + 1).padStart(3, '0')}`;
    return { cashLoans: [...state.cashLoans, { ...loan, id: newId, status: 'Pending', remainingAmount: loan.amount }] };
  }),

  addCreditGoods: (credit) => set((state) => {
    const newId = `KRD-${String(state.creditGoods.length + 1).padStart(3, '0')}`;
    return { creditGoods: [...state.creditGoods, { ...credit, id: newId, status: 'Pending', remainingAmount: credit.amount - credit.dp }] };
  }),

  addProduct: (product) => set((state) => {
    const newId = state.products.length + 1;
    return { products: [...state.products, { ...product, id: newId }] };
  }),

  updateProduct: (id, data) => set((state) => ({
    products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
  })),

  deleteProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id)
  })),

  addConsignment: (consignment) => set((state) => {
    const newId = 100 + state.consignmentProducts.length + 1;
    return { consignmentProducts: [...state.consignmentProducts, { ...consignment, id: newId }] };
  }),

  updateConsignment: (id, data) => set((state) => ({
    consignmentProducts: state.consignmentProducts.map(p => p.id === id ? { ...p, ...data } : p)
  })),

  deleteConsignment: (id) => set((state) => ({
    consignmentProducts: state.consignmentProducts.filter(p => p.id !== id)
  })),

  addService: (service) => set((state) => {
    const newId = 200 + state.services.length + 1;
    return { services: [...state.services, { ...service, id: newId }] };
  }),

  updateService: (id, data) => set((state) => ({
    services: state.services.map(s => s.id === id ? { ...s, ...data } : s)
  })),

  deleteService: (id) => set((state) => ({
    services: state.services.filter(s => s.id !== id)
  })),

  // Transactions Actions
  checkoutRetail: (cart, totalAmount, memberId, paymentMethod = 'Cash', installments = 1, startDate = null, notes = '') => set((state) => {
    // Deduct stock
    const newProducts = state.products.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.qty };
      return p;
    });

    const newJournalId = `JU-${String(state.journal.length / 2 + 1).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const totalHPP = cart.reduce((s, item) => s + (item.hpp || 0) * item.qty, 0);

    // Cash â†’ Kas, Kredit â†’ Piutang Dagang
    const akunDebit = paymentMethod === 'Kredit' ? 'Piutang Dagang' : 'Kas';
    const desc = paymentMethod === 'Kredit'
      ? `Penjualan Ritel (Kredit${dueDate ? `, mulai ${startDate}` : ''}${notes ? ` - ${notes}` : ''})`
      : 'Penjualan Barang Ritel';

    const journalEntries = [
      { id: newJournalId, date, description: desc, ref: 'BKM-RTL', debit: totalAmount, credit: 0, account: akunDebit },
      { id: newJournalId, date, description: desc, ref: 'BKM-RTL', debit: 0, credit: totalAmount, account: 'Pendapatan Penjualan Ritel' },
      ...(totalHPP > 0 ? [
        { id: newJournalId, date, description: 'HPP Penjualan Ritel', ref: 'BKK-HPP', debit: totalHPP, credit: 0, account: 'Harga Pokok Penjualan' },
        { id: newJournalId, date, description: 'HPP Penjualan Ritel', ref: 'BKK-HPP', debit: 0, credit: totalHPP, account: 'Persediaan Barang' },
      ] : []),
    ];

    const member = memberId ? state.members.find(m => m.id === memberId) : null;
    const newMemberTx = member
      ? [...state.memberSalesTransactions, { id: newJournalId, date, memberId, memberName: member.name, type: 'Ritel', amount: totalAmount }]
      : state.memberSalesTransactions;

    return { products: newProducts, journal: [...state.journal, ...journalEntries], memberSalesTransactions: newMemberTx };
  }),

  checkoutConsignment: (cart, totalAmount, totalCommission, totalSupplier, memberId, paymentMethod = 'Cash', installments = 1, startDate = null, notes = '') => set((state) => {
    const newConsignment = state.consignmentProducts.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.qty };
      return p;
    });

    const newJournalId = `JU-${String(state.journal.length / 2 + 1).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];

    const akunDebit = paymentMethod === 'Kredit' ? 'Piutang Dagang' : 'Kas';
    const desc = paymentMethod === 'Kredit'
      ? `Penjualan Titipan (Kredit${dueDate ? `, mulai ${startDate}` : ''}${notes ? ` - ${notes}` : ''})`
      : 'Penjualan Titipan';

    const journalEntries = [
      { id: newJournalId, date, description: desc, ref: 'BKM-KNS', debit: totalAmount, credit: 0, account: akunDebit },
      { id: newJournalId, date, description: 'Komisi Konsinyasi', ref: 'BKM-KNS', debit: 0, credit: totalCommission, account: 'Pendapatan Komisi' },
      { id: newJournalId, date, description: 'Hutang Titipan', ref: 'BKM-KNS', debit: 0, credit: totalSupplier, account: 'Hutang Konsinyasi' }
    ];

    const member = memberId ? state.members.find(m => m.id === memberId) : null;
    const newMemberTx = member
      ? [...state.memberSalesTransactions, { id: newJournalId, date, memberId, memberName: member.name, type: 'Konsinyasi', amount: totalAmount }]
      : state.memberSalesTransactions;

    return { consignmentProducts: newConsignment, journal: [...state.journal, ...journalEntries], memberSalesTransactions: newMemberTx };
  }),

  checkoutService: (cart, totalAmount, memberId, paymentMethod = 'Cash', installments = 1, startDate = null, notes = '') => set((state) => {
    const newJournalId = `JU-${String(state.journal.length / 2 + 1).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const totalHPP = cart.reduce((s, item) => s + (item.hpp || 0) * item.qty, 0);

    const akunDebit = paymentMethod === 'Kredit' ? 'Piutang Dagang' : 'Kas';
    const desc = paymentMethod === 'Kredit'
      ? `Penjualan Jasa/PPOB (Kredit${dueDate ? `, mulai ${startDate}` : ''}${notes ? ` - ${notes}` : ''})`
      : 'Penjualan Jasa/PPOB';

    const journalEntries = [
      { id: newJournalId, date, description: desc, ref: 'BKM-JSA', debit: totalAmount, credit: 0, account: akunDebit },
      { id: newJournalId, date, description: desc, ref: 'BKM-JSA', debit: 0, credit: totalAmount, account: 'Pendapatan Jasa' },
      ...(totalHPP > 0 ? [
        { id: newJournalId, date, description: 'HPP Penjualan Jasa', ref: 'BKK-HPP', debit: totalHPP, credit: 0, account: 'Harga Pokok Penjualan' },
        { id: newJournalId, date, description: 'HPP Penjualan Jasa', ref: 'BKK-HPP', debit: 0, credit: totalHPP, account: 'Persediaan Barang' },
      ] : []),
    ];

    const member = memberId ? state.members.find(m => m.id === memberId) : null;
    const newMemberTx = member
      ? [...state.memberSalesTransactions, { id: newJournalId, date, memberId, memberName: member.name, type: 'Jasa', amount: totalAmount }]
      : state.memberSalesTransactions;

    return { journal: [...state.journal, ...journalEntries], memberSalesTransactions: newMemberTx };
  }),

  restockProduct: (productId, qty, hpp) => set((state) => {
    const date = new Date().toISOString().split('T')[0];
    const newId = `JU-${String(Math.floor(state.journal.length / 2) + 1).padStart(4, '0')}`;
    const product = state.products.find(p => p.id === productId);
    const totalCost = qty * hpp;
    return {
      products: state.products.map(p => p.id === productId ? { ...p, stock: p.stock + qty, hpp } : p),
      journal: [...state.journal,
        { id: newId, date, description: `Restock ${product?.name}`, ref: 'BKK-RST', debit: totalCost, credit: 0, account: 'Persediaan Barang' },
        { id: newId, date, description: `Restock ${product?.name}`, ref: 'BKK-RST', debit: 0, credit: totalCost, account: 'Kas' },
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
  approveCashLoan: (loanId) => set((state) => {
    const loan = state.cashLoans.find(l => l.id === loanId);
    if (!loan) return state;

    const newLoans = state.cashLoans.map(l => l.id === loanId ? { ...l, status: 'Active' } : l);
    
    const newJournalId = `JU-${String(state.journal.length / 2 + 1).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const journalEntries = [
      { id: newJournalId, date, description: `Pencairan Pinjaman ${loan.name}`, ref: loan.id, debit: loan.amount, credit: 0, account: 'Piutang Anggota' },
      { id: newJournalId, date, description: `Pencairan Pinjaman ${loan.name}`, ref: loan.id, debit: 0, credit: loan.amount, account: 'Kas' }
    ];

    return { cashLoans: newLoans, journal: [...state.journal, ...journalEntries] };
  }),

  payCashLoan: (loanId, paymentAmount) => set((state) => {
    const loan = state.cashLoans.find(l => l.id === loanId);
    if (!loan) return state;

    const newRemaining = Math.max(0, loan.remainingAmount - paymentAmount);
    const newStatus = newRemaining === 0 ? 'Completed' : loan.status;

    const newLoans = state.cashLoans.map(l => l.id === loanId ? { ...l, remainingAmount: newRemaining, status: newStatus } : l);

    const newJournalId = `JU-${String(state.journal.length / 2 + 1).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    
    // Simplification: Not calculating interest separation, just pure deduction for simulation
    const journalEntries = [
      { id: newJournalId, date, description: `Angsuran Pinjaman ${loan.name}`, ref: loan.id, debit: paymentAmount, credit: 0, account: 'Kas' },
      { id: newJournalId, date, description: `Angsuran Pinjaman ${loan.name}`, ref: loan.id, debit: 0, credit: paymentAmount, account: 'Piutang Anggota' }
    ];

    return { cashLoans: newLoans, journal: [...state.journal, ...journalEntries] };
  }),

  approveCreditGoods: (creditId) => set((state) => {
    const credit = state.creditGoods.find(c => c.id === creditId);
    if (!credit) return state;

    const newCredits = state.creditGoods.map(c => c.id === creditId ? { ...c, status: 'Active' } : c);
    
    const newJournalId = `JU-${String(state.journal.length / 2 + 1).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    const journalEntries = [
      { id: newJournalId, date, description: `Kredit Barang ${credit.itemName}`, ref: credit.id, debit: credit.amount, credit: 0, account: 'Piutang Barang' },
      { id: newJournalId, date, description: `Kredit Barang ${credit.itemName}`, ref: credit.id, debit: 0, credit: credit.amount, account: 'Persediaan Barang' },
      // DP Handling
      { id: newJournalId + 'DP', date, description: `DP Kredit ${credit.itemName}`, ref: credit.id, debit: credit.dp, credit: 0, account: 'Kas' },
      { id: newJournalId + 'DP', date, description: `DP Kredit ${credit.itemName}`, ref: credit.id, debit: 0, credit: credit.dp, account: 'Piutang Barang' }
    ];

    return { creditGoods: newCredits, journal: [...state.journal, ...journalEntries] };
  }),

  payCreditGoods: (creditId, paymentAmount) => set((state) => {
    const credit = state.creditGoods.find(c => c.id === creditId);
    if (!credit) return state;

    const newRemaining = Math.max(0, credit.remainingAmount - paymentAmount);
    const newStatus = newRemaining === 0 ? 'Completed' : credit.status;

    const newCredits = state.creditGoods.map(c => c.id === creditId ? { ...c, remainingAmount: newRemaining, status: newStatus } : c);

    const newJournalId = `JU-${String(state.journal.length / 2 + 1).padStart(3, '0')}`;
    const date = new Date().toISOString().split('T')[0];
    
    const journalEntries = [
      { id: newJournalId, date, description: `Angsuran Kredit ${credit.itemName}`, ref: credit.id, debit: paymentAmount, credit: 0, account: 'Kas' },
      { id: newJournalId, date, description: `Angsuran Kredit ${credit.itemName}`, ref: credit.id, debit: 0, credit: paymentAmount, account: 'Piutang Barang' }
    ];

    return { creditGoods: newCredits, journal: [...state.journal, ...journalEntries] };
  }),
    }),
    {
      name: 'koperasi-store-v6',           // localStorage key — bump versi untuk reset data lama
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Simpan semua data kecuali session login (keamanan)
        members:                state.members,
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

        // Patch joinDate untuk anggota yang belum punya
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        if (state.members) {
          state.members = state.members.map(m => m.joinDate ? m : { ...m, joinDate: todayStr });
        }

        const sudahAda = state.journal.some(j => j.id === 'JU-INIT');
        if (!sudahAda && NILAI_PERSEDIAAN_AWAL > 0) {
          state.journal = [
            { id: 'JU-INIT', date: '2026-01-01', description: 'Saldo Awal Persediaan Barang', ref: 'INIT', debit: NILAI_PERSEDIAAN_AWAL, credit: 0, account: 'Persediaan Barang' },
            { id: 'JU-INIT', date: '2026-01-01', description: 'Saldo Awal Modal Koperasi', ref: 'INIT', debit: 0, credit: NILAI_PERSEDIAAN_AWAL, account: 'Modal Koperasi' },
            ...state.journal,
          ];
        }
      },
    }
  )
);
