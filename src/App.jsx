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
import ProfitLoss from './pages/Reports/ProfitLoss';
import Members from './pages/MasterData/Members';
import Inventory from './pages/MasterData/Inventory';
import ReceiveNew from './pages/MasterData/ReceiveNew';
import SHU from './pages/Reports/SHU';
import Neraca from './pages/Reports/Neraca';
import BukuBesar from './pages/Reports/BukuBesar';
import ArusKas from './pages/Reports/ArusKas';

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
  const patchMembersJoinDate = useStore((state) => state.patchMembersJoinDate);
  const { syncing } = useSupabaseSync();
  useSupabaseWrite();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    patchMembersJoinDate();
  }, [darkMode]);

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
        
        {/* Report Routes (Admin Only) */}
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
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
