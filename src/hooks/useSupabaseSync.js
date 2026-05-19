import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { isSupabaseReady } from '../lib/supabase';
import {
  fetchMembers, fetchProducts, fetchConsignments, fetchServices,
  fetchJournal, fetchCashLoans, fetchCreditGoods, fetchMemberSalesTx,
  fetchAccounts,
} from '../services/supabaseService';

/**
 * Sync data dari Supabase ke Zustand store saat app pertama load.
 * Kalau Supabase tidak tersedia, fallback ke localStorage (store default).
 */
export const useSupabaseSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [synced,  setSynced]  = useState(false);
  const [error,   setError]   = useState(null);

  const setMembers              = useStore(s => s.setMembers);
  const setAccounts             = useStore(s => s.setAccounts);
  const setProducts             = useStore(s => s.setProducts);
  const setConsignmentProducts  = useStore(s => s.setConsignmentProducts);
  const setServices             = useStore(s => s.setServices);
  const setJournal              = useStore(s => s.setJournal);
  const setCashLoans            = useStore(s => s.setCashLoans);
  const setCreditGoods          = useStore(s => s.setCreditGoods);
  const setMemberSalesTx        = useStore(s => s.setMemberSalesTransactions);

  useEffect(() => {
    if (!isSupabaseReady()) {
      setSynced(true);
      return;
    }

    const sync = async () => {
      setSyncing(true);
      try {
        const [members, products, consignments, services, journal, cashLoans, creditGoods, memberTx] =
          await Promise.all([
            fetchMembers(), fetchProducts(), fetchConsignments(), fetchServices(),
            fetchJournal(), fetchCashLoans(), fetchCreditGoods(), fetchMemberSalesTx(),
          ]);

        // Fetch accounts - jika ada di DB, gunakan; jika kosong, biarkan default dari store
        let accounts = [];
        try { accounts = await fetchAccounts(); } catch (e) { console.warn('Accounts table not found, using defaults'); }

        if (accounts.length > 0) setAccounts(accounts);
        setMembers(members);
        setProducts(products);
        setConsignmentProducts(consignments);
        setServices(services);
        setJournal(journal);
        setCashLoans(cashLoans);
        setCreditGoods(creditGoods);
        setMemberSalesTx(memberTx);
        setSynced(true);
      } catch (err) {
        console.error('Supabase sync error:', err);
        setError(err.message);
        setSynced(true); // tetap lanjut dengan data lokal
      } finally {
        setSyncing(false);
      }
    };

    sync();
  }, []);

  return { syncing, synced, error };
};
