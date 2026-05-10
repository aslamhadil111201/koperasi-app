/**
 * Hook ini meng-intercept store actions dan menyimpan perubahan ke Supabase.
 * Dipanggil sekali di App.jsx setelah sync selesai.
 */
import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { isSupabaseReady } from '../lib/supabase';
import {
  insertMember, updateMemberDB,
  insertProduct, updateProductDB, deleteProductDB,
  insertConsignment, updateConsignmentDB, deleteConsignmentDB,
  insertService, updateServiceDB, deleteServiceDB,
  insertJournalEntries,
  insertCashLoan, updateCashLoanDB,
  insertCreditGood, updateCreditGoodDB,
  insertMemberSalesTx,
} from '../services/supabaseService';

export const useSupabaseWrite = () => {
  const store = useStore();

  useEffect(() => {
    if (!isSupabaseReady()) return;

    // Patch store actions untuk juga write ke Supabase
    const origAddMember    = store.addMember;
    const origUpdateMember = store.updateMember;
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

    // Override dengan versi yang juga write ke Supabase
    useStore.setState({
      addMember: (member) => {
        origAddMember(member);
        const state = useStore.getState();
        const newMember = state.members[state.members.length - 1];
        if (newMember) insertMember(newMember).catch(console.error);
      },
      updateMember: (id, data) => {
        origUpdateMember(id, data);
        updateMemberDB(id, data).catch(console.error);
      },
      addProduct: (product) => {
        origAddProduct(product);
        const state = useStore.getState();
        const newProduct = state.products[state.products.length - 1];
        if (newProduct) insertProduct(newProduct).catch(console.error);
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
        if (newItem) insertConsignment(newItem).catch(console.error);
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
        if (newService) insertService(newService).catch(console.error);
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
    });
  }, []);
};
