import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useSupabaseSync } from './hooks/useSupabaseSync';
import { useSupabaseWrite } from './hooks/useSupabaseWrite';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import RetailSales from './pages/Sales/RetailSales';
import Savings from './pages/Loans/Savings';
import GeneralLedger from './pages/Reports/GeneralLedger';
import ConsignmentSales from './pages/Sales/ConsignmentSales';
import ServiceSales from './pages/Sales/ServiceSales';
import CashLoans from './pages/Loans/CashLoans';
import CreditGoods from './pages/Loans/CreditGoods';
import Receivables from './pages/Loans/Receivables';
import ProfitLoss from './pages/Reports/ProfitLoss';
import Members from './pages/MasterData/Members';
import Inventory from './pages/MasterData/Inventory';
import ReceiveNew from './pages/MasterData/ReceiveNew';
import ChartOfAccounts from './pages/MasterData/ChartOfAccounts';
import SHU from './pages/Reports/SHU';
import Neraca from './pages/Reports/Neraca';
import BukuBesar from './pages/Reports/BukuBesar';
import ArusKas from './pages/Reports/ArusKas';
import PettyCash from './pages/Reports/PettyCash';

const AppLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <div className="app-container">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <main className="main-content">
        <Header onMenuClick={() => setMobileSidebarOpen(v => !v)} />
        <div className="page-content" style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  const darkMode = useStore((state) => state.darkMode);
  const members = useStore((state) => state.members);
  const setMembers = useStore((state) => state.setMembers);
  const journal = useStore((state) => state.journal);
  const migrateKasToKasBank = useStore((state) => state.migrateKasToKasBank);
  const { syncing } = useSupabaseSync();
  useSupabaseWrite();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Migrasi permanen: konversi ANG-xxx → KPKCG-xxx dan simpan ke localStorage
  useEffect(() => {
    if (members.some(m => m.id && m.id.startsWith('ANG-'))) {
      const migrated = members.map(m => {
        if (m.id && m.id.startsWith('ANG-')) {
          const num = m.id.replace('ANG-', '');
          return { ...m, id: `KPKCG-${num}` };
        }
        return m;
      });
      setMembers(migrated);
    }
  }, [members, setMembers]);

  // Otomatis Migrasi 'Kas' ke 'Kas Bank'
  useEffect(() => {
    if (journal.some(j => j.account === 'Kas')) {
      migrateKasToKasBank();
      import('./services/supabaseService').then(({ migrateKasToKasBankDB }) => {
        migrateKasToKasBankDB();
      }).catch(err => console.error(err));
    }
  }, [journal, migrateKasToKasBank]);

  // Global fix: Mencegah input bertipe "number" berubah value-nya saat di-scroll pakai mouse
  useEffect(() => {
    const handleWheel = () => {
      if (document.activeElement && document.activeElement.type === 'number') {
        document.activeElement.blur();
      }
    };
    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  if (syncing) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'1rem', background:'var(--color-background)' }}>
        <div style={{ width:40, height:40, border:'4px solid #FF4D00', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'var(--color-text-muted)', fontSize:'0.875rem' }}>Memuat data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        
        {/* Sales Routes */}
        <Route path="/sales/retail" element={<ProtectedRoute><AppLayout><RetailSales /></AppLayout></ProtectedRoute>} />
        <Route path="/sales/consignment" element={<ProtectedRoute><AppLayout><ConsignmentSales /></AppLayout></ProtectedRoute>} />
        <Route path="/sales/services" element={<ProtectedRoute><AppLayout><ServiceSales /></AppLayout></ProtectedRoute>} />
        
        {/* Loans Routes */}
        <Route path="/loans/savings" element={<ProtectedRoute><AppLayout><Savings /></AppLayout></ProtectedRoute>} />
        <Route path="/loans/cash" element={<ProtectedRoute><AppLayout><CashLoans /></AppLayout></ProtectedRoute>} />
        <Route path="/loans/credit-goods" element={<ProtectedRoute><AppLayout><CreditGoods /></AppLayout></ProtectedRoute>} />
        <Route path="/loans/receivables" element={<ProtectedRoute><AppLayout><Receivables /></AppLayout></ProtectedRoute>} />
        
        {/* Report Routes (Admin Only) */}
        <Route path="/finance/petty-cash" element={<ProtectedRoute requiredRole="admin"><AppLayout><PettyCash /></AppLayout></ProtectedRoute>} />
        <Route path="/reports/ledger" element={<ProtectedRoute requiredRole="admin"><AppLayout><GeneralLedger /></AppLayout></ProtectedRoute>} />
        <Route path="/reports/profit-loss" element={<ProtectedRoute requiredRole="admin"><AppLayout><ProfitLoss /></AppLayout></ProtectedRoute>} />
        <Route path="/reports/shu" element={<ProtectedRoute requiredRole="admin"><AppLayout><SHU /></AppLayout></ProtectedRoute>} />
        <Route path="/reports/neraca" element={<ProtectedRoute requiredRole="admin"><AppLayout><Neraca /></AppLayout></ProtectedRoute>} />
        <Route path="/reports/buku-besar" element={<ProtectedRoute requiredRole="admin"><AppLayout><BukuBesar /></AppLayout></ProtectedRoute>} />
        <Route path="/reports/arus-kas" element={<ProtectedRoute requiredRole="admin"><AppLayout><ArusKas /></AppLayout></ProtectedRoute>} />
        
        {/* Master Data Routes (Admin Only) */}
        <Route path="/master/members" element={<ProtectedRoute requiredRole="admin"><AppLayout><Members /></AppLayout></ProtectedRoute>} />
        <Route path="/master/inventory" element={<ProtectedRoute requiredRole="admin"><AppLayout><Inventory /></AppLayout></ProtectedRoute>} />
        <Route path="/master/receive" element={<ProtectedRoute requiredRole="admin"><AppLayout><ReceiveNew /></AppLayout></ProtectedRoute>} />
        <Route path="/master/accounts" element={<ProtectedRoute requiredRole="admin"><AppLayout><ChartOfAccounts /></AppLayout></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
