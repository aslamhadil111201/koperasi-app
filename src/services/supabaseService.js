import { supabase, isSupabaseReady } from '../lib/supabase';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginSupabase = async (username, password) => {
  if (!isSupabaseReady()) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('users')
    .select('id, username, name, role, password')
    .eq('username', username)
    .single();
  if (error || !data) throw new Error('Username atau password salah!');
  if (data.password !== password) throw new Error('Username atau password salah!');
  return { id: data.id, name: data.name, role: data.role, username: data.username };
};

// ── Members ───────────────────────────────────────────────────────────────────
export const fetchMembers = async () => {
  const { data, error } = await supabase.from('members').select('*').order('member_id');
  if (error) throw error;
  return data.map(m => ({
    id: m.member_id, name: m.name, type: m.type,
    pokok: m.pokok, wajib: m.wajib, sukarela: m.sukarela,
    joinDate: m.join_date,
  }));
};

export const insertMember = async (member) => {
  const { data, error } = await supabase.from('members').insert({
    member_id: member.id, name: member.name, type: member.type,
    pokok: member.pokok, wajib: member.wajib, sukarela: member.sukarela,
    join_date: member.joinDate || null,
  }).select().single();
  if (error) throw error;
  return data;
};

export const updateMemberDB = async (memberId, updates) => {
  const oldId = memberId.replace('KPKCG-', 'ANG-');
  const { error } = await supabase.from('members')
    .update({
      member_id: memberId,
      name: updates.name, type: updates.type,
      pokok: updates.pokok, wajib: updates.wajib, sukarela: updates.sukarela,
      join_date: updates.joinDate || null,
    })
    .or(`member_id.eq.${memberId},member_id.eq.${oldId}`);
  if (error) throw error;
};

// ── Products ──────────────────────────────────────────────────────────────────
export const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('*').order('id');
  if (error) throw error;
  return data.map(p => ({ ...p, hpp: p.hpp || 0, minStock: p.min_stock || 10 }));
};

export const insertProduct = async (product) => {
  const payload = { ...product, min_stock: product.minStock || 10 };
  delete payload.minStock;
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  if (error) throw error;
  return data;
};

export const updateProductDB = async (id, updates) => {
  const payload = { ...updates };
  if (payload.minStock !== undefined) {
    payload.min_stock = payload.minStock;
    delete payload.minStock;
  }
  const { error } = await supabase.from('products').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteProductDB = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

// ── Consignment ───────────────────────────────────────────────────────────────
export const fetchConsignments = async () => {
  const { data, error } = await supabase.from('consignment_products').select('*').order('id');
  if (error) throw error;
  return data.map(p => ({
    ...p, supplierPrice: p.supplier_price,
    commission: p.price - p.supplier_price,
    minStock: p.min_stock || 10,
  }));
};

export const insertConsignment = async (item) => {
  const { data, error } = await supabase.from('consignment_products').insert({
    name: item.name, price: item.price, stock: item.stock,
    supplier: item.supplier, supplier_price: item.supplierPrice, image: item.image,
    min_stock: item.minStock || 10,
  }).select().single();
  if (error) throw error;
  return data;
};

export const updateConsignmentDB = async (id, updates) => {
  const { error } = await supabase.from('consignment_products').update({
    name: updates.name, price: updates.price, stock: updates.stock,
    supplier: updates.supplier, supplier_price: updates.supplierPrice, image: updates.image,
    min_stock: updates.minStock,
  }).eq('id', id);
  if (error) throw error;
};

export const deleteConsignmentDB = async (id) => {
  const { error } = await supabase.from('consignment_products').delete().eq('id', id);
  if (error) throw error;
};

// ── Services ──────────────────────────────────────────────────────────────────
export const fetchServices = async () => {
  const { data, error } = await supabase.from('services').select('*').order('id');
  if (error) throw error;
  return data.map(s => ({ ...s, isFeeOnly: s.is_fee_only }));
};

export const insertService = async (service) => {
  const { data, error } = await supabase.from('services').insert({
    name: service.name, price: service.price, hpp: service.hpp || 0,
    type: service.type, provider: service.provider,
    is_fee_only: service.isFeeOnly || false, image: service.image,
  }).select().single();
  if (error) throw error;
  return data;
};

export const updateServiceDB = async (id, updates) => {
  const { error } = await supabase.from('services').update({
    name: updates.name, price: updates.price, hpp: updates.hpp || 0,
    type: updates.type, provider: updates.provider, image: updates.image,
  }).eq('id', id);
  if (error) throw error;
};

export const deleteServiceDB = async (id) => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
};

// ── Journal ───────────────────────────────────────────────────────────────────
export const fetchJournal = async () => {
  const { data, error } = await supabase.from('journal').select('*').order('date').order('id');
  if (error) throw error;
  return data.map(j => ({
    id: j.journal_id, date: j.date, description: j.description,
    ref: j.ref, debit: j.debit, credit: j.credit, account: j.account,
  }));
};

export const insertJournalEntries = async (entries) => {
  const rows = entries.map(e => ({
    journal_id: e.id, date: e.date, description: e.description,
    ref: e.ref, debit: e.debit || 0, credit: e.credit || 0, account: e.account,
  }));
  const { error } = await supabase.from('journal').insert(rows);
  if (error) throw error;
};

// ── Saldo Awal (JU-INIT) ─────────────────────────────────────────────────────
export const saveSaldoAwalDB = async (accountName, journalEntries) => {
  if (!isSupabaseReady()) return;
  try {
    // 1. Hapus semua JU-INIT untuk akun ini
    await supabase.from('journal').delete().eq('journal_id', 'JU-INIT').eq('account', accountName);
    // 2. Hapus juga Saldo Penyeimbang lama
    await supabase.from('journal').delete().eq('journal_id', 'JU-INIT').eq('account', 'Saldo Penyeimbang');
    // 3. Insert semua entri JU-INIT baru (termasuk penyeimbang)
    const initEntries = journalEntries.filter(j => j.id === 'JU-INIT');
    if (initEntries.length > 0) {
      const rows = initEntries.map(e => ({
        journal_id: e.id, date: e.date, description: e.description,
        ref: e.ref, debit: e.debit || 0, credit: e.credit || 0, account: e.account,
      }));
      const { error } = await supabase.from('journal').insert(rows);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Failed to save saldo awal to Supabase:', error);
  }
};

export const migrateKasToKasBankDB = async () => {
  if (!isSupabaseReady()) return;
  const { error } = await supabase.from('journal').update({ account: 'Kas Bank' }).eq('account', 'Kas');
  if (error) console.error('Failed to migrate Kas to Kas Bank in DB:', error);
};

// ── Cash Loans ────────────────────────────────────────────────────────────────
export const fetchCashLoans = async () => {
  const { data, error } = await supabase.from('cash_loans').select('*').order('id');
  if (error) throw error;
  return data.map(dbRow => ({
    id: dbRow.loan_id, memberId: dbRow.member_id, name: dbRow.name,
    amount: dbRow.amount, tenor: dbRow.tenor, interest: dbRow.interest,
    status: dbRow.status, remainingAmount: dbRow.remaining_amount,
    applyDate: dbRow.apply_date,
    takeDate: dbRow.take_date,
    installments: typeof dbRow.installments === 'string' ? JSON.parse(dbRow.installments) : (dbRow.installments || [])
  }));
};

export const insertCashLoan = async (loan) => {
  const { error } = await supabase.from('cash_loans').insert([{
    loan_id: loan.id, member_id: loan.memberId, name: loan.name,
    amount: loan.amount, tenor: loan.tenor, interest: loan.interest,
    status: loan.status,
    remaining_amount: loan.remainingAmount,
    apply_date: loan.applyDate,
    take_date: loan.takeDate,
    installments: loan.installments || []
  }]);
  if (error) throw error;
};

export const updateCashLoanDB = async (loanId, updates) => {
  const { error } = await supabase.from('cash_loans').update({
    status: updates.status, remaining_amount: updates.remainingAmount, installments: updates.installments
  }).eq('loan_id', loanId);
  if (error) throw error;
};

// ── Credit Goods ──────────────────────────────────────────────────────────────
export const fetchCreditGoods = async () => {
  const { data, error } = await supabase.from('credit_goods').select('*').order('id');
  if (error) throw error;
  return data.map(dbRow => ({
    id: dbRow.credit_id, memberId: dbRow.member_id, name: dbRow.name,
    itemName: dbRow.item_name, amount: dbRow.amount, dp: dbRow.dp,
    tenor: dbRow.tenor, interest: dbRow.interest, status: dbRow.status,
    remainingAmount: dbRow.remaining_amount,
    applyDate: dbRow.apply_date,
    takeDate: dbRow.take_date,
    startDate: dbRow.start_date,
    installments: typeof dbRow.installments === 'string' ? JSON.parse(dbRow.installments) : (dbRow.installments || [])
  }));
};

export const insertCreditGood = async (credit) => {
  const { error } = await supabase.from('credit_goods').insert([{
    credit_id: credit.id, member_id: credit.memberId, name: credit.name,
    item_name: credit.itemName, amount: credit.amount, dp: credit.dp,
    tenor: credit.tenor, interest: credit.interest,
    status: credit.status,    remaining_amount: credit.remainingAmount,
    apply_date: credit.applyDate,
    take_date: credit.takeDate,
    start_date: credit.startDate,
    installments: credit.installments || []
  }]);
  if (error) throw error;
};

export const updateCreditGoodDB = async (creditId, updates) => {
  const { error } = await supabase.from('credit_goods').update({
    status: updates.status, remaining_amount: updates.remainingAmount, installments: updates.installments
  }).eq('credit_id', creditId);
  if (error) throw error;
};

// ── Member Sales Transactions ─────────────────────────────────────────────────
export const fetchMemberSalesTx = async () => {
  const { data, error } = await supabase.from('member_sales_transactions').select('*').order('date');
  if (error) throw error;
  return data.map(t => ({
    id: t.tx_id, date: t.date, memberId: t.member_id,
    memberName: t.member_name, type: t.type, amount: t.amount,
  }));
};

export const insertMemberSalesTx = async (tx) => {
  const { error } = await supabase.from('member_sales_transactions').insert({
    tx_id: tx.id, date: tx.date, member_id: tx.memberId,
    member_name: tx.memberName, type: tx.type, amount: tx.amount,
  });
  if (error) throw error;
};

// ── Shared Deletion ───────────────────────────────────────────────────────────
export const deleteTransactionDB = async (id) => {
  if (!isSupabaseReady()) return;
  try {
    await supabase.from('journal').delete().eq('journal_id', id);
    await supabase.from('member_sales_transactions').delete().eq('tx_id', id);
    await supabase.from('cash_loans').delete().eq('loan_id', id);
    await supabase.from('credit_goods').delete().eq('credit_id', id);
  } catch (error) {
    console.error('Failed to delete transaction from Supabase:', error);
  }
};

export const deleteCreditGoodsDB = async (id) => {
  if (!isSupabaseReady()) return;
  try {
    await supabase.from('credit_goods').delete().eq('credit_id', id);
  } catch (error) {
    console.error('Failed to delete credit goods from Supabase:', error);
  }
};

export const deleteCashLoanDB = async (id) => {
  if (!isSupabaseReady()) return;
  try {
    await supabase.from('cash_loans').delete().eq('loan_id', id);
  } catch (error) {
    console.error('Failed to delete cash loan from Supabase:', error);
  }
};
