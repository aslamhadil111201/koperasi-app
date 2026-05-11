import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { authApi } from '../services/api';
import { loginSupabase } from '../services/supabaseService';
import { isSupabaseReady } from '../lib/supabase';
import { Lock, User, Eye, EyeOff, Shield, BarChart2, Users, ArrowRight, Headphones, X, Phone, Mail, Sun, Moon } from 'lucide-react';
import './Login.css';

// ── Info kontak admin — ganti sesuai kebutuhan ────────────────────────────────
const ADMIN_CONTACT = {
  name:  'Bapak Aslam Hadil Matin',
  phone: '0857-9456-4572',
  email: 'aslamhadilmatin@gmail.com',
  wa:    'https://wa.me/6285794564572',
  note:  'Hubungi admin untuk reset password atau bantuan teknis.',
};

const Login = () => {
  const [username,     setUsername]     = useState('');
  const [password,     setPassword]     = useState('');
  const [remember,     setRemember]     = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);
  const [showHelp,     setShowHelp]     = useState(false);

  const login         = useStore((state) => state.login);
  const darkMode      = useStore((state) => state.darkMode);
  const toggleDarkMode = useStore((state) => state.toggleDarkMode);
  const navigate      = useNavigate();

  // ── Ingat saya — load username tersimpan saat mount ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('koperasi_remembered_user');
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userData;

      // Coba Supabase dulu
      if (isSupabaseReady()) {
        try {
          userData = await loginSupabase(username, password);
        } catch {
          // fallback ke hardcoded
        }
      }

      // Fallback hardcoded
      if (!userData) {
        const accounts = [
          { username: 'admin',   password: 'admin123', id: 1, name: 'Bapak Aslam',  role: 'admin' },
          { username: 'kasir',   password: 'kasir123', id: 2, name: 'Mbak Kasir',   role: 'kasir' },
          { username: 'uci',     password: '123456',   id: 3, name: 'Ibu Uci',      role: 'admin' },
          { username: 'surtini', password: '123456',   id: 4, name: 'Ibu Surtini',  role: 'admin' },
          { username: 'indah',   password: '123456',   id: 5, name: 'Ibu Indah',    role: 'admin' },
        ];
        const found = accounts.find(a => a.username === username && a.password === password);
        if (!found) throw new Error('Username atau password salah!');
        userData = { id: found.id, name: found.name, role: found.role, username: found.username };
      }

      // Ingat saya
      if (remember) {
        localStorage.setItem('koperasi_remembered_user', username);
      } else {
        localStorage.removeItem('koperasi_remembered_user');
      }

      login(userData);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Username atau password salah!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />

      {/* Toggle dark/light mode — pojok kanan atas */}
      <button
        onClick={toggleDarkMode}
        className="login-theme-btn"
        title={darkMode ? 'Light Mode' : 'Dark Mode'}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Toggle dark/light — pojok kanan atas */}
      <button
        onClick={toggleDarkMode}
        className="login-theme-toggle"
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* LEFT */}
      <div className="login-left">
        <div className="login-left-body">
          <div className="login-headline">
            <h1>Selamat Datang di<br /><span className="login-headline-accent">Sistem Koperasi</span></h1>
            <div className="login-headline-bar" />
            <p className="login-headline-desc">
              Sistem informasi terintegrasi untuk mendukung pengelolaan
              koperasi yang transparan, efisien, dan profesional.
            </p>
          </div>
          <div className="login-features">
            <div className="login-feature-item">
              <div className="login-feature-icon"><Shield size={16} /></div>
              <div>
                <p className="login-feature-title">Aman &amp; Terpercaya</p>
                <p className="login-feature-desc">Data Anda terlindungi dengan sistem keamanan berlapis.</p>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon"><BarChart2 size={16} /></div>
              <div>
                <p className="login-feature-title">Terintegrasi</p>
                <p className="login-feature-desc">Kelola semua kebutuhan koperasi dalam satu sistem.</p>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon"><Users size={16} /></div>
              <div>
                <p className="login-feature-title">Profesional</p>
                <p className="login-feature-desc">Dirancang untuk mendukung kinerja koperasi lebih optimal.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-card">
          {/* Logo mobile only */}
          <div className="login-mobile-logo">
            <img src="/favicon.png" alt="KPKCG" />
          </div>

          <div className="login-card-icon"><Shield size={22} /></div>
          <h2 className="login-card-title">Masuk ke Akun Anda</h2>
          <p className="login-card-subtitle">Silakan masukkan username dan password untuk melanjutkan</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label className="login-label">Username</label>
              <div className="login-input-wrap">
                <User size={16} className="login-input-icon" />
                <input type="text" className="login-input" placeholder="Masukkan username"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  required autoComplete="username" />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input type={showPassword ? 'text' : 'password'} className="login-input"
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" />
                <button type="button" className="login-eye-btn"
                  onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="login-row">
              <label className="login-remember">
                <input type="checkbox" checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="login-checkbox" />
                <span>Ingat saya</span>
              </label>
              <span className="login-forgot" onClick={() => setShowForgot(true)}>
                Lupa password?
              </span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Memproses...' : <><span>Masuk</span> <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="login-divider"><span>atau</span></div>

          <div className="login-help" onClick={() => setShowHelp(true)} style={{ cursor: 'pointer' }}>
            <div className="login-help-icon"><Headphones size={17} /></div>
            <div>
              <p className="login-help-title">Butuh bantuan?</p>
              <p className="login-help-desc">Hubungi administrator sistem untuk mendapatkan bantuan.</p>
            </div>
          </div>

          <p className="login-footer">
            © 2026 <span className="login-footer-accent">Sistem Koperasi</span>. Hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* ── Modal Lupa Password ── */}
      {showForgot && (
        <div className="login-modal-overlay" onClick={() => setShowForgot(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>Lupa Password?</h3>
              <button className="login-modal-close" onClick={() => setShowForgot(false)}><X size={18} /></button>
            </div>
            <div className="login-modal-body">
              <div className="login-modal-icon" style={{ background: 'rgba(255,77,0,0.1)', color: '#FF4D00' }}>
                <Lock size={24} />
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
                Password tidak dapat direset sendiri. Hubungi administrator sistem untuk mendapatkan password baru.
              </p>
              <div className="login-contact-card">
                <div className="login-contact-row">
                  <Users size={15} style={{ color: '#FF4D00', flexShrink: 0 }} />
                  <span><strong>Admin:</strong> {ADMIN_CONTACT.name}</span>
                </div>
                <div className="login-contact-row">
                  <Phone size={15} style={{ color: '#FF4D00', flexShrink: 0 }} />
                  <span>{ADMIN_CONTACT.phone}</span>
                </div>
                <div className="login-contact-row">
                  <Mail size={15} style={{ color: '#FF4D00', flexShrink: 0 }} />
                  <span>{ADMIN_CONTACT.email}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.75rem' }}>
                {ADMIN_CONTACT.note}
              </p>
              <a href={ADMIN_CONTACT.wa} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'1rem', padding:'0.7rem', background:'#25D366', color:'#fff', borderRadius:10, fontWeight:700, fontSize:'0.875rem', textDecoration:'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat WhatsApp Admin
              </a>
            </div>
            <div className="login-modal-footer">
              <button className="login-btn" style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
                onClick={() => setShowForgot(false)}>
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Butuh Bantuan ── */}
      {showHelp && (
        <div className="login-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>Butuh Bantuan?</h3>
              <button className="login-modal-close" onClick={() => setShowHelp(false)}><X size={18} /></button>
            </div>
            <div className="login-modal-body">
              <div className="login-modal-icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
                <Headphones size={24} />
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
                Untuk bantuan teknis atau masalah akses sistem, hubungi administrator KPKCG.
              </p>
              <div className="login-contact-card">
                <div className="login-contact-row">
                  <Users size={15} style={{ color: '#FF4D00', flexShrink: 0 }} />
                  <span><strong>Admin:</strong> {ADMIN_CONTACT.name}</span>
                </div>
                <div className="login-contact-row">
                  <Phone size={15} style={{ color: '#FF4D00', flexShrink: 0 }} />
                  <span>{ADMIN_CONTACT.phone}</span>
                </div>
                <div className="login-contact-row">
                  <Mail size={15} style={{ color: '#FF4D00', flexShrink: 0 }} />
                  <span>{ADMIN_CONTACT.email}</span>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', background: '#f9fafb', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#6b7280' }}>
                <strong>Jam Operasional:</strong><br />
                Senin – Jumat: 08.00 – 17.00 WIB<br />
                Sabtu: 08.00 – 13.00 WIB
              </div>
              <a href={ADMIN_CONTACT.wa} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'1rem', padding:'0.7rem', background:'#25D366', color:'#fff', borderRadius:10, fontWeight:700, fontSize:'0.875rem', textDecoration:'none' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Chat WhatsApp Admin
              </a>
            </div>
            <div className="login-modal-footer">
              <button className="login-btn" style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
                onClick={() => setShowHelp(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
