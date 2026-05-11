import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, LogOut, X, Sun, Moon, AlertTriangle, Clock, Package, Menu } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ onMenuClick }) => {
  const currentUser    = useStore((state) => state.currentUser);
  const logout         = useStore((state) => state.logout);
  const members        = useStore((state) => state.members);
  const journal        = useStore((state) => state.journal);
  const products       = useStore((state) => state.products);
  const cashLoans      = useStore((state) => state.cashLoans);
  const creditGoods    = useStore((state) => state.creditGoods);
  const darkMode       = useStore((state) => state.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const navigate       = useNavigate();

  const [query,       setQuery]       = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotif,   setShowNotif]   = useState(false);
  const [readIds,     setReadIds]     = useState([]);
  const notifRef = useRef(null);

  // ── Generate notifications from real data ──────────────────────────────────
  const notifications = [
    // Stok menipis (< 10 unit)
    ...products
      .filter(p => p.stock < 10)
      .map(p => ({
        id: `stock-${p.id}`,
        type: 'warning',
        icon: <Package size={15} />,
        title: 'Stok Menipis',
        message: `${p.name} tersisa ${p.stock} unit`,
        path: '/master/inventory',
      })),
    // Pinjaman tunai pending
    ...cashLoans
      .filter(l => l.status === 'Pending')
      .map(l => ({
        id: `loan-${l.id}`,
        type: 'info',
        icon: <Clock size={15} />,
        title: 'Pinjaman Menunggu Persetujuan',
        message: `${l.name} — Rp ${l.amount.toLocaleString('id-ID')}`,
        path: '/loans/cash',
      })),
    // Kredit barang pending
    ...creditGoods
      .filter(c => c.status === 'Pending')
      .map(c => ({
        id: `credit-${c.id}`,
        type: 'info',
        icon: <Clock size={15} />,
        title: 'Kredit Barang Menunggu Persetujuan',
        message: `${c.name} — ${c.itemName}`,
        path: '/loans/credit-goods',
      })),
  ];

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  // Tutup dropdown kalau klik/touch di luar
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleNotifClick = (notif) => {
    setReadIds(prev => [...new Set([...prev, notif.id])]);
    navigate(notif.path);
    setShowNotif(false);
  };

  const markAllRead = () => setReadIds(notifications.map(n => n.id));

  // ── Quick search ───────────────────────────────────────────────────────────
  const results = query.trim().length < 2 ? [] : [
    ...members
      .filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.id.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 3)
      .map(m => ({ label: m.name, sub: `Anggota · ${m.id}`, path: '/master/members' })),
    ...journal
      .filter(j => j.description?.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(j => ({ label: j.description, sub: `Jurnal · ${j.date}`, path: '/reports/ledger' })),
  ];

  const handleResultClick = (path) => {
    navigate(path);
    setQuery('');
    setShowResults(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header glass-panel">
      {/* Hamburger — mobile only */}
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Menu">
        <Menu size={22} />
      </button>

      {/* Search bar */}
      <div style={{ position: 'relative' }}>
        <div className="search-bar">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            placeholder="Cari anggota, transaksi..."
            className="search-input"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 180)}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setShowResults(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="search-dropdown">
            {results.map((r, i) => (
              <button key={i} className="search-result-item" onMouseDown={() => handleResultClick(r.path)}>
                <span className="search-result-label">{r.label}</span>
                <span className="search-result-sub">{r.sub}</span>
              </button>
            ))}
          </div>
        )}
        {showResults && query.trim().length >= 2 && results.length === 0 && (
          <div className="search-dropdown">
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Tidak ada hasil untuk "<strong>{query}</strong>"
            </div>
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Dark / Light toggle switch */}
        <button
          className={`theme-switch ${darkMode ? 'dark' : 'light'}`}
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark mode"
        >
          <span className="theme-switch-track">
            <span className="theme-switch-icon theme-switch-sun"><Sun size={11} /></span>
            <span className="theme-switch-icon theme-switch-moon"><Moon size={11} /></span>
            <span className="theme-switch-thumb" />
          </span>
        </button>

        {/* ── Notification Bell ── */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" onClick={() => setShowNotif(v => !v)}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifikasi</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    Tandai semua dibaca
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>Tidak ada notifikasi</p>
                  </div>
                ) : (
                  notifications.map(notif => {
                    const isRead = readIds.includes(notif.id);
                    return (
                      <button
                        key={notif.id}
                        className={`notif-item ${notif.type} ${isRead ? 'read' : 'unread'}`}
                        onClick={() => handleNotifClick(notif)}
                      >
                        <div className={`notif-icon-wrap notif-icon-${notif.type}`}>
                          {notif.icon}
                        </div>
                        <div className="notif-body">
                          <p className="notif-item-title">{notif.title}</p>
                          <p className="notif-item-msg">{notif.message}</p>
                        </div>
                        {!isRead && <span className="notif-dot" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        {(() => {
          const isPengurus  = ['uci', 'surtini', 'indah'].includes(currentUser?.username);
          const avatarColor = isPengurus ? '#FF4D00' : 'var(--color-primary-light)';
          const roleLabel   = isPengurus ? 'Pengurus' : (currentUser?.role || 'Administrator');
          return (
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="avatar" style={{ background: avatarColor }}><User size={18} /></div>
                <div className="user-info">
                  <span className="user-name">{currentUser?.name || 'Admin Koperasi'}</span>
                  <span className="user-role" style={{ textTransform: 'capitalize' }}>{roleLabel}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-primary"
                style={{ padding: '0.5rem', background: 'var(--color-danger)', border: 'none', marginLeft: '0.5rem' }}
                title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          );
        })()}
      </div>
    </header>
  );
};

export default Header;
