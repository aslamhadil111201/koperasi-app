import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { isSupabaseReady } from '../lib/supabase';
import {
  fetchMembers, fetchProducts, fetchConsignments, fetchServices,
  fetchJournal, fetchCashLoans, fetchCreditGoods, fetchMemberSalesTx,
  fetchAccounts, insertAccountDB, deduplicateJUINITDB, migrateKasToKasBankDB,
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
        try { 
          accounts = await fetchAccounts(); 
          // Jika DB kosong, insert default accounts
          if (accounts.length === 0) {
            const defaultAccounts = useStore.getState().accounts || [];
            if (defaultAccounts.length > 0) {
              for (const acc of defaultAccounts) {
                try { await insertAccountDB(acc); } catch(e) {}
              }
              accounts = defaultAccounts;
            }
          }
        } catch (e) { 
          console.warn('Accounts table not found, using defaults'); 
        }

        if (accounts.length > 0) setAccounts(accounts);
        
        // Normalize nama akun di jurnal agar match dengan Daftar Akun (case-insensitive)
        const accList = accounts.length > 0 ? accounts : useStore.getState().accounts || [];
        const normalizedJournal = journal.map(j => {
          if (!j.account) return j;
          const matchedAcc = accList.find(a => a.name.toLowerCase() === j.account.toLowerCase());
          if (matchedAcc && matchedAcc.name !== j.account) {
            return { ...j, account: matchedAcc.name };
          }
          return j;
        });

        setMembers(members);
        setProducts(products);
        setConsignmentProducts(consignments);
        setServices(services);
        setJournal(normalizedJournal);
        setCashLoans(cashLoans);
        setCreditGoods(creditGoods);
        setMemberSalesTx(memberTx);

        // Bersihkan duplikat JU-INIT & migrate nama akun KAS BANK di Supabase, lalu re-fetch journal
        Promise.all([
          deduplicateJUINITDB(),
          migrateKasToKasBankDB(),
        ]).then(async () => {
          try {
            const cleanJournal = await fetchJournal();
            const accList2 = accounts.length > 0 ? accounts : useStore.getState().accounts || [];
            const cleanNormalized = cleanJournal.map(j => {
              if (!j.account) return j;
              const matchedAcc = accList2.find(a => a.name.toLowerCase() === j.account.toLowerCase());
              if (matchedAcc && matchedAcc.name !== j.account) return { ...j, account: matchedAcc.name };
              return j;
            });
            setJournal(cleanNormalized);
          } catch (e) {
            console.warn('Re-fetch journal after migration failed:', e);
          }
        }).catch(e => console.warn('Migration error:', e));

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
