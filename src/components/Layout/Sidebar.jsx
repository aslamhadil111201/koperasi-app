import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Wrench,
  PiggyBank, Banknote, CreditCard, BookOpen, TrendingUp,
  LogOut, Users, Database, PieChart, Scale, PackagePlus,
  BookMarked, Waves, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import './Sidebar.css';

const Sidebar = ({ mobileOpen, onClose }) => {
  const currentUser = useStore((state) => state.currentUser);
  const logout      = useStore((state) => state.logout);
  const navigate    = useNavigate();
  const location    = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Tutup sidebar saat navigasi di mobile
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { title: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { type: 'divider', title: 'PENJUALAN' },
    { title: 'Barang Dagang',   path: '/sales/retail',       icon: <ShoppingCart size={20} /> },
    { title: 'Konsinyasi',      path: '/sales/consignment',  icon: <Package size={20} /> },
    { title: 'Penjualan Jasa',  path: '/sales/services',     icon: <Wrench size={20} /> },
    { type: 'divider', title: 'SIMPAN PINJAM' },
    { title: 'Simpanan',        path: '/loans/savings',      icon: <PiggyBank size={20} /> },
    { title: 'Pinjaman Tunai',  path: '/loans/cash',         icon: <Banknote size={20} /> },
    { title: 'Kredit Barang',   path: '/loans/credit-goods', icon: <CreditCard size={20} /> },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push(
      { type: 'divider', title: 'MASTER DATA' },
      { title: 'Data Anggota',    path: '/master/members',       icon: <Users size={20} /> },
      { title: 'Data Inventaris', path: '/master/inventory',     icon: <Database size={20} /> },
      { title: 'Terima Barang',   path: '/master/receive',       icon: <PackagePlus size={20} /> },
      { type: 'divider', title: 'LAPORAN KEUANGAN' },
      { title: 'Jurnal Umum',     path: '/reports/ledger',       icon: <BookOpen size={20} /> },
      { title: 'Buku Besar',      path: '/reports/buku-besar',   icon: <BookMarked size={20} /> },
      { title: 'Arus Kas',        path: '/reports/arus-kas',     icon: <Waves size={20} /> },
      { title: 'Laba / Rugi',     path: '/reports/profit-loss',  icon: <TrendingUp size={20} /> },
      { title: 'Neraca',          path: '/reports/neraca',       icon: <Scale size={20} /> },
      { title: 'Perhitungan SHU', path: '/reports/shu',          icon: <PieChart size={20} /> }
    );
  }

  return (
    <>
      {/* Backdrop mobile */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar glass-panel ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

      {/* Header — klik logo/nama → Dashboard */}
      <div className="sidebar-header">
        <div
          className="logo-container"
          onClick={() => navigate('/')}
          title="Kembali ke Dashboard"
          style={{ cursor: 'pointer' }}
        >
          <img src="/logo.png" alt="Logo"
            style={{ width: collapsed ? 36 : 52, height: collapsed ? 36 : 52, objectFit: 'contain', flexShrink: 0, transition: 'all 0.25s' }} />

          {!collapsed && (
            <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', lineHeight:'1.05', whiteSpace:'nowrap' }}>
              <span style={{ fontSize:'1.6rem', fontWeight:'900', color:'var(--color-text-main)', letterSpacing:'1.5px', marginBottom:'2px' }}>
                KPKCG
              </span>
              <span style={{ fontSize:'0.58rem', fontWeight:'700', color:'var(--color-text-main)' }}>KOPERASI PEMASARAN</span>
              <span style={{ fontSize:'0.58rem', fontWeight:'700', color:'var(--color-text-main)' }}>KARYA CIPTA GEMILANG</span>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button className="sidebar-toggle-btn" onClick={() => setCollapsed(v => !v)} title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          if (item.type === 'divider') {
            return collapsed
              ? <div key={index} className="nav-divider-dot" />
              : <div key={index} className="nav-divider">{item.title}</div>;
          }
          return (
            <NavLink key={index} to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={item.title}
              style={collapsed ? { justifyContent: 'center', padding: '0.6rem 0', width: 40, margin: '0 auto 0.2rem' } : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer p-4 mt-auto">
        {!collapsed && (() => {
          const isPengurus = ['uci', 'surtini', 'indah'].includes(currentUser?.username);
          const avatarColor = isPengurus ? '#FF4D00' : 'var(--color-primary)';
          const roleLabel   = isPengurus ? 'Pengurus' : (currentUser?.role || 'Admin');
          return (
            <div className="user-info flex items-center gap-3 mb-4"
              style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0.5rem 0 0.75rem' }}>
              <div className="avatar"
                style={{ background: avatarColor, width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, flexShrink:0, fontSize:'1.1rem' }}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-main)', fontWeight: 700 }}>{currentUser?.name}</p>
                <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{roleLabel}</p>
              </div>
            </div>
          );
        })()}
        {collapsed && (() => {
          const isPengurus = ['uci', 'surtini', 'indah'].includes(currentUser?.username);
          const avatarColor = isPengurus ? '#FF4D00' : 'var(--color-primary)';
          return (
            <div style={{ width:32, height:32, borderRadius:'50%', background: avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, margin:'0 auto 1rem' }}>
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
          );
        })()}
        <button onClick={handleLogout}
          className={`btn flex justify-center gap-2 ${collapsed ? '' : 'w-full'}`}
          style={{ background: '#EF4444', color: 'white', border: 'none', width: collapsed ? 36 : '100%', padding: collapsed ? '0.4rem' : '0.45rem 0.875rem', fontWeight: 600, fontSize: '0.82rem', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}
          title="Logout">
          <LogOut size={14} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
