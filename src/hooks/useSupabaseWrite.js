/**
 * Hook ini meng-intercept store actions dan menyimpan perubahan ke Supabase.
 * Dipanggil sekali di App.jsx setelah sync selesai.
 */
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { isSupabaseReady } from '../lib/supabase';
import {
  insertMember, updateMemberDB, deleteMemberDB,
  insertProduct, updateProductDB, deleteProductDB,
  insertConsignment, updateConsignmentDB, deleteConsignmentDB,
  insertService, updateServiceDB, deleteServiceDB,
  insertJournalEntries,
  insertCashLoan, updateCashLoanDB,
  insertCreditGood, updateCreditGoodDB,
  insertMemberSalesTx,
  deleteTransactionDB, deleteCreditGoodsDB, deleteCashLoanDB,
  saveSaldoAwalDB,
  insertAccountDB, updateAccountDB, deleteAccountDB,
} from '../services/supabaseService';

export const useSupabaseWrite = () => {
  const store = useStore();

  useEffect(() => {
    if (!isSupabaseReady()) return;

    // Jika sudah di-patch, jangan patch ulang (untuk mencegah bug Vite HMR)
    if (store.addMember._isPatched) return;

    // Patch store actions untuk juga write ke Supabase
    const origAddMember    = store.addMember;
    const origUpdateMember = store.updateMember;
    const origDeleteMember = store.deleteMember;
    const origAddAccount   = store.addAccount;
    const origUpdateAccount = store.updateAccount;
    const origDeleteAccount = store.deleteAccount;
    const origAddProduct   = store.addProduct;
    const origUpdateProduct = store.updateProduct;
    const origDeleteProduct = store.deleteProduct;
    const origAddConsignment = store.addConsignment;
    const origUpdateConsignment = store.updateConsignment;
    const origDeleteConsignment = store.deleteConsignment;
    const origAddService   = store.addService;
    const origUpdateService = store.updateService;
    const origDeleteService = store.deleteService;
    const origAddTransaction = store.addTransaction;
    const origAddCashLoan  = store.addCashLoan;
    const origAddCreditGoods = store.addCreditGoods;

    // Tambahan untuk checkout & transaksi lainnya
    const origCheckoutRetail = store.checkoutRetail;
    const origCheckoutConsignment = store.checkoutConsignment;
    const origCheckoutService = store.checkoutService;
    const origRestockProduct = store.restockProduct;
    const origDepositSavings = store.depositSavings;
    const origDepositSavingsBulk = store.depositSavingsBulk;
    const origApproveCashLoan = store.approveCashLoan;
    const origPayCashLoan = store.payCashLoan;
    const origApproveCreditGoods = store.approveCreditGoods;
    const origPayCreditGoods = store.payCreditGoods;
    const origAddExpense = store.addExpense;
    const origAddIncome = store.addIncome;
    const origProcessPayrollDeduction = store.processPayrollDeduction;
    const origReplenishPettyCash = store.replenishPettyCash;
    const origAddPettyCashExpense = store.addPettyCashExpense;
    const origDeleteTransaction = store.deleteTransaction;
    const origDeleteCreditGoods = store.deleteCreditGoods;
    const origDeleteCashLoan = store.deleteCashLoan;
    const origSetSaldoAwal = store.setSaldoAwal;
    const origClosePeriod = store.closePeriod;

    // Override dengan versi yang juga write ke Supabase
    const patchedActions = {
      addMember: (member) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origAddMember(member);
        const state = useStore.getState();
        const newMember = state.members[state.members.length - 1];
        if (newMember) insertMember(newMember).catch(console.error);
        // Insert journal entries for initial savings
        const newJournals = state.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      updateMember: (id, data) => {
        origUpdateMember(id, data);
        updateMemberDB(id, data).catch(e => {
          console.error(e);
          alert('Gagal menyimpan ke database (Supabase): ' + e.message);
        });
      },
      deleteMember: (id) => {
        origDeleteMember(id);
        deleteMemberDB(id).catch(e => {
          console.error(e);
          alert('Gagal menghapus dari database (Supabase): ' + e.message);
        });
      },
      addAccount: (account) => {
        origAddAccount(account);
        const state = useStore.getState();
        const newAccount = state.accounts[state.accounts.length - 1];
        if (newAccount) insertAccountDB(newAccount).catch(console.error);
      },
      updateAccount: (id, data) => {
        origUpdateAccount(id, data);
        updateAccountDB(id, data).catch(console.error);
      },
      deleteAccount: (id) => {
        origDeleteAccount(id);
        deleteAccountDB(id).catch(console.error);
      },
      addProduct: (product) => {
        origAddProduct(product);
        const state = useStore.getState();
        const newProduct = state.products[state.products.length - 1];
        if (newProduct) insertProduct(newProduct).catch(e => {
          console.error('INSERT PRODUCT ERROR:', e);
          alert('Gagal simpan produk ke database: ' + e.message);
        });
      },
      updateProduct: (id, data) => {
        origUpdateProduct(id, data);
        updateProductDB(id, data).catch(console.error);
      },
      deleteProduct: (id) => {
        origDeleteProduct(id);
        deleteProductDB(id).catch(console.error);
      },
      addConsignment: (item) => {
        origAddConsignment(item);
        const state = useStore.getState();
        const newItem = state.consignmentProducts[state.consignmentProducts.length - 1];
        if (newItem) insertConsignment(newItem).catch(e => {
          console.error('INSERT CONSIGNMENT ERROR:', e);
          alert('Gagal simpan konsinyasi ke database: ' + e.message);
        });
      },
      updateConsignment: (id, data) => {
        origUpdateConsignment(id, data);
        updateConsignmentDB(id, data).catch(console.error);
      },
      deleteConsignment: (id) => {
        origDeleteConsignment(id);
        deleteConsignmentDB(id).catch(console.error);
      },
      addService: (service) => {
        origAddService(service);
        const state = useStore.getState();
        const newService = state.services[state.services.length - 1];
        if (newService) insertService(newService).catch(e => {
          console.error('INSERT SERVICE ERROR:', e);
          alert('Gagal simpan layanan ke database: ' + e.message);
        });
      },
      updateService: (id, data) => {
        origUpdateService(id, data);
        updateServiceDB(id, data).catch(console.error);
      },
      deleteService: (id) => {
        origDeleteService(id);
        deleteServiceDB(id).catch(console.error);
      },
      addTransaction: (entries) => {
        origAddTransaction(entries);
        insertJournalEntries(entries).catch(console.error);
      },
      deleteTransaction: (id) => {
        origDeleteTransaction(id);
        deleteTransactionDB(id).catch(console.error);
      },
      addCashLoan: (loan) => {
        origAddCashLoan(loan);
        const state = useStore.getState();
        const newLoan = state.cashLoans[state.cashLoans.length - 1];
        if (newLoan) insertCashLoan(newLoan).catch(console.error);
      },
      addCreditGoods: (credit) => {
        origAddCreditGoods(credit);
        const state = useStore.getState();
        const newCredit = state.creditGoods[state.creditGoods.length - 1];
        if (newCredit) insertCreditGood(newCredit).catch(console.error);
      },
      checkoutRetail: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        const oldTxLen = stateBefore.memberSalesTransactions.length;
        const oldCreditLen = stateBefore.creditGoods.length;

        origCheckoutRetail(...args);

        const stateAfter = useStore.getState();
        
        // Update product stock
        const cart = args[0] || [];
        cart.forEach(item => {
          const updated = stateAfter.products.find(p => p.id === item.id);
          if (updated) updateProductDB(updated.id, { stock: updated.stock }).catch(console.error);
        });

        // Insert new journal entries
        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);

        // Insert new member transaction
        const newTxs = stateAfter.memberSalesTransactions.slice(oldTxLen);
        if (newTxs.length > 0) newTxs.forEach(tx => insertMemberSalesTx(tx).catch(console.error));

        // Insert new credit goods (kasbon)
        const newCredits = stateAfter.creditGoods.slice(oldCreditLen);
        if (newCredits.length > 0) newCredits.forEach(c => insertCreditGood(c).catch(console.error));
      },
      checkoutConsignment: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        const oldTxLen = stateBefore.memberSalesTransactions.length;

        origCheckoutConsignment(...args);

        const stateAfter = useStore.getState();

        // Update consignment stock
        const cart = args[0] || [];
        cart.forEach(item => {
          const updated = stateAfter.consignmentProducts.find(p => p.id === item.id);
          if (updated) updateConsignmentDB(updated.id, { stock: updated.stock }).catch(console.error);
        });

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);

        const newTxs = stateAfter.memberSalesTransactions.slice(oldTxLen);
        if (newTxs.length > 0) newTxs.forEach(tx => insertMemberSalesTx(tx).catch(console.error));
      },
      checkoutService: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        const oldTxLen = stateBefore.memberSalesTransactions.length;
        const oldCreditLen = stateBefore.creditGoods.length;

        origCheckoutService(...args);

        const stateAfter = useStore.getState();

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);

        const newTxs = stateAfter.memberSalesTransactions.slice(oldTxLen);
        if (newTxs.length > 0) newTxs.forEach(tx => insertMemberSalesTx(tx).catch(console.error));

        const newCredits = stateAfter.creditGoods.slice(oldCreditLen);
        if (newCredits.length > 0) newCredits.forEach(c => insertCreditGood(c).catch(console.error));
      },
      restockProduct: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origRestockProduct(...args);
        const stateAfter = useStore.getState();
        
        const productId = args[0];
        const updated = stateAfter.products.find(p => p.id === productId);
        if (updated) updateProductDB(productId, { stock: updated.stock, hpp: updated.hpp }).catch(console.error);

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      depositSavings: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origDepositSavings(...args);
        const stateAfter = useStore.getState();
        
        const memberId = args[0];
        const updated = stateAfter.members.find(m => m.id === memberId);
        if (updated) updateMemberDB(memberId, { pokok: updated.pokok, wajib: updated.wajib, sukarela: updated.sukarela }).catch(console.error);

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      depositSavingsBulk: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origDepositSavingsBulk(...args);
        const stateAfter = useStore.getState();
        
        const memberIds = args[0];
        memberIds.forEach(mId => {
          const updated = stateAfter.members.find(m => m.id === mId);
          if (updated) updateMemberDB(mId, { pokok: updated.pokok, wajib: updated.wajib, sukarela: updated.sukarela }).catch(console.error);
        });

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      approveCashLoan: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origApproveCashLoan(...args);
        const stateAfter = useStore.getState();

        const loanId = args[0];
        const updated = stateAfter.cashLoans.find(l => l.id === loanId);
        if (updated) updateCashLoanDB(loanId, { status: updated.status, remainingAmount: updated.remainingAmount }).catch(console.error);

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      payCashLoan: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origPayCashLoan(...args);
        const stateAfter = useStore.getState();

        const loanId = args[0];
        const updated = stateAfter.cashLoans.find(l => l.id === loanId);
        if (updated) updateCashLoanDB(loanId, { status: updated.status, remainingAmount: updated.remainingAmount }).catch(console.error);

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      approveCreditGoods: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origApproveCreditGoods(...args);
        const stateAfter = useStore.getState();

        const creditId = args[0];
        const updated = stateAfter.creditGoods.find(c => c.id === creditId);
        if (updated) updateCreditGoodDB(creditId, { status: updated.status, remainingAmount: updated.remainingAmount }).catch(console.error);

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      payCreditGoods: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origPayCreditGoods(...args);
        const stateAfter = useStore.getState();

        const creditId = args[0];
        const updated = stateAfter.creditGoods.find(c => c.id === creditId);
        if (updated) updateCreditGoodDB(creditId, { status: updated.status, remainingAmount: updated.remainingAmount }).catch(console.error);

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      processPayrollDeduction: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origProcessPayrollDeduction(...args);
        const stateAfter = useStore.getState();

        const payments = args[1];

        // Update DB
        if (payments) {
          payments.forEach(pay => {
            if (pay.type === 'CashLoan') {
              const l = stateAfter.cashLoans.find(loan => loan.id === pay.id);
              if (l) updateCashLoanDB(l.id, { status: l.status, remainingAmount: l.remainingAmount, installments: l.installments }).catch(console.error);
            } else if (pay.type === 'CreditGood') {
              const c = stateAfter.creditGoods.find(credit => credit.id === pay.id);
              if (c) updateCreditGoodDB(c.id, { status: c.status, remainingAmount: c.remainingAmount, installments: c.installments }).catch(console.error);
            }
          });
        }

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      addExpense: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origAddExpense(...args);
        const stateAfter = useStore.getState();

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      addIncome: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origAddIncome(...args);
        const stateAfter = useStore.getState();

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      replenishPettyCash: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origReplenishPettyCash(...args);
        const stateAfter = useStore.getState();

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      addPettyCashExpense: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origAddPettyCashExpense(...args);
        const stateAfter = useStore.getState();

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
      deleteTransaction: (id) => {
        origDeleteTransaction(id);
        deleteTransactionDB(id).catch(console.error);
      },
      deleteCreditGoods: (id) => {
        if (origDeleteCreditGoods) origDeleteCreditGoods(id);
        deleteCreditGoodsDB(id).catch(console.error);
      },
      deleteCashLoan: (id) => {
        if (origDeleteCashLoan) origDeleteCashLoan(id);
        deleteCashLoanDB(id).catch(console.error);
      },
      setSaldoAwal: (...args) => {
        origSetSaldoAwal(...args);
        const stateAfter = useStore.getState();
        const accountName = args[0];
        saveSaldoAwalDB(accountName, stateAfter.journal).catch(console.error);
      },
      closePeriod: (...args) => {
        const stateBefore = useStore.getState();
        const oldJournalLen = stateBefore.journal.length;
        origClosePeriod(...args);
        const stateAfter = useStore.getState();

        const newJournals = stateAfter.journal.slice(oldJournalLen);
        if (newJournals.length > 0) insertJournalEntries(newJournals).catch(console.error);
      },
    };

    // Tandai agar tidak di-patch berulang kali saat hot reload
    Object.values(patchedActions).forEach(fn => { fn._isPatched = true; });

    useStore.setState({
      addMember: patchedActions.addMember,
      updateMember: patchedActions.updateMember,
      deleteMember: patchedActions.deleteMember,
      addAccount: patchedActions.addAccount,
      updateAccount: patchedActions.updateAccount,
      deleteAccount: patchedActions.deleteAccount,
      addProduct: patchedActions.addProduct,
      updateProduct: patchedActions.updateProduct,
      deleteProduct: patchedActions.deleteProduct,
      addConsignment: patchedActions.addConsignment,
      updateConsignment: patchedActions.updateConsignment,
      deleteConsignment: patchedActions.deleteConsignment,
      addService: patchedActions.addService,
      updateService: patchedActions.updateService,
      deleteService: patchedActions.deleteService,
      addTransaction: patchedActions.addTransaction,
      addCashLoan: patchedActions.addCashLoan,
      addCreditGoods: patchedActions.addCreditGoods,
      checkoutRetail: patchedActions.checkoutRetail,
      checkoutConsignment: patchedActions.checkoutConsignment,
      checkoutService: patchedActions.checkoutService,
      restockProduct: patchedActions.restockProduct,
      depositSavings: patchedActions.depositSavings,
      depositSavingsBulk: patchedActions.depositSavingsBulk,
      approveCashLoan: patchedActions.approveCashLoan,
      payCashLoan: patchedActions.payCashLoan,
      approveCreditGoods: patchedActions.approveCreditGoods,
      payCreditGoods: patchedActions.payCreditGoods,
      addExpense: patchedActions.addExpense,
      addIncome: patchedActions.addIncome,
      processPayrollDeduction: patchedActions.processPayrollDeduction,
      replenishPettyCash: patchedActions.replenishPettyCash,
      addPettyCashExpense: patchedActions.addPettyCashExpense,
      deleteTransaction: patchedActions.deleteTransaction,
      deleteCreditGoods: patchedActions.deleteCreditGoods,
      deleteCashLoan: patchedActions.deleteCashLoan,
      setSaldoAwal: patchedActions.setSaldoAwal,
      closePeriod: patchedActions.closePeriod,
    });
  }, []);
};
