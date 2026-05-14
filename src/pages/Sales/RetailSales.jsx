import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Search, User, X, Banknote, CreditCard, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { buildSchedule } from '../../utils/installment';
import Receipt from '../../components/Receipt';
import SearchableSelect from '../../components/SearchableSelect';
import './Sales.css';

const RetailSales = () => {
  const products       = useStore((state) => state.products);
  const members        = useStore((state) => state.members);
  const customers      = useStore((state) => state.customers) || [];
  const addCustomer    = useStore((state) => state.addCustomer);
  const checkoutRetail = useStore((state) => state.checkoutRetail);
  const currentUser    = useStore((state) => state.currentUser);

  const [cart, setCart]                     = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [buyerType, setBuyerType]           = useState('member'); // 'member' or 'customer'
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer]       = useState({ name: '', address: '', npwp: '', phone: '' });

  const [paymentMethod, setPaymentMethod]   = useState('Cash');
  const [txDate, setTxDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [takeDate, setTakeDate]             = useState('');
  const [installments, setInstallments]     = useState(1);
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  // Handle default payment rules for customers vs members
  useEffect(() => {
    if (buyerType === 'customer') {
      setPaymentMethod('Kredit');
      setInstallments(1);
      const tx = new Date(txDate);
      tx.setMonth(tx.getMonth() + 1);
      setStartDate(tx.toISOString().split('T')[0]);
    } else {
      setPaymentMethod('Cash');
    }
  }, [buyerType, txDate]);

  const [showReceipt, setShowReceipt]       = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    if (product.stock <= 0) return alert('Stok barang habis!');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          alert('Jumlah melebihi stok yang tersedia!');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => setCart(prev => {
    return prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const newQty = item.qty + delta;
        if (newQty < 1) return item;
        if (product && newQty > product.stock) {
          alert('Jumlah melebihi stok yang tersedia!');
          return item;
        }
        return { ...item, qty: newQty };
      }
      return item;
    });
  });

  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const markupAmount = paymentMethod === 'Kredit' ? Math.floor(totalAmount * 0.10) : 0;
  const grandTotal = totalAmount + markupAmount;

  // Jadwal cicilan preview
  const schedule = useMemo(() =>
    paymentMethod === 'Kredit' ? buildSchedule(grandTotal, installments, startDate) : [],
    [paymentMethod, grandTotal, installments, startDate]
  );

  const handleCheckout = () => {
    if (cart.length === 0) return alert('Keranjang kosong!');
    if (paymentMethod === 'Kredit' && buyerType === 'member' && !selectedMember) return alert('Metode Kredit harus memilih anggota/customer!');
    if (paymentMethod === 'Kredit' && buyerType === 'customer' && !selectedCustomer) return alert('Metode Kredit harus memilih anggota/customer!');
    if (paymentMethod === 'Kredit' && !startDate) return alert('Isi tanggal mulai cicilan!');
    
    let buyer = null;
    if (buyerType === 'member' && selectedMember) {
      const m = members.find(x => x.id === selectedMember);
      if (m) buyer = { id: m.id, name: m.name, type: 'member' };
    } else if (buyerType === 'customer' && selectedCustomer) {
      const c = customers.find(x => x.id === selectedCustomer);
      if (c) buyer = { id: c.id, name: c.name, type: 'customer', address: c.address, npwp: c.npwp, phone: c.phone };
    }

    const txId = `RTL-${Date.now()}`;
    checkoutRetail(cart, totalAmount, markupAmount, buyer, paymentMethod, installments, startDate || null, notes, txDate);
    setLastTransaction({
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price, hpp: i.hpp })),
      total: grandTotal, subtotal: totalAmount, markupAmount, type: 'retail',
      memberName: buyer?.name || null,
      buyer: buyer,
      date: txDate || new Date().toISOString(),
      transactionId: txId,
      paymentMethod, takeDate, installments, startDate, notes, schedule,
      pic: currentUser?.name || 'Admin',
    });
    alert('Transaksi Berhasil Disimpan!');
    setShowReceipt(true);
    setCart([]); setSelectedMember(''); setSelectedCustomer(''); setBuyerType('member'); setPaymentMethod('Cash');
    setTakeDate(''); setInstallments(1); setStartDate(''); setNotes('');
  };

  const submitAddCustomer = () => {
    if (!newCustomer.name) return alert('Nama wajib diisi');
    addCustomer(newCustomer);
    setShowAddCustomer(false);
    setNewCustomer({ name: '', address: '', npwp: '', phone: '' });
  };

  return (
    <div className="pos-container">
      <div className="product-section glass-panel">
        <div className="flex justify-between items-center mb-6">
          <h2>Point of Sales (Kasir)</h2>
          <div className="search-bar" style={{ width: '250px' }}>
            <Search size={18} className="text-muted" />
            <input type="text" placeholder="Cari barang..." className="search-input"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="product-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
              <div className="product-img-placeholder">
                {product.image
                  ? <img src={product.image} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--radius-sm)' }} />
                  : <ShoppingCart size={22} className="text-muted" />
                }
              </div>
              <div className="product-info">
                <p className="product-name">{product.name}</p>
                <p className="product-price">Rp {product.price.toLocaleString('id-ID')}</p>
                <div className="product-meta">
                  <span className="badge badge-primary">Stok: {product.stock}</span>
                  <span className="product-category">{product.category}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'2rem', color:'var(--color-text-muted)', fontSize:'0.875rem' }}>
              Tidak ada barang ditemukan.
            </div>
          )}
        </div>
      </div>

      <div className="cart-section glass-panel">
        <h3 className="mb-4 flex items-center gap-2"><ShoppingCart size={20} /> Keranjang Belanja</h3>

        <div style={{ padding: '1rem', border: '1px dashed rgba(234, 88, 12, 0.4)', borderRadius: '8px', backgroundColor: 'rgba(234, 88, 12, 0.04)', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ea580c', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
            <User size={16} /> KATEGORI PEMBELI
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name="buyerType" checked={buyerType === 'member'} onChange={() => setBuyerType('member')} style={{ accentColor: '#ea580c', width: '16px', height: '16px' }} /> Anggota
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" name="buyerType" checked={buyerType === 'customer'} onChange={() => setBuyerType('customer')} style={{ accentColor: '#ea580c', width: '16px', height: '16px' }} /> Non-Anggota (Customer)
            </label>
          </div>

          {buyerType === 'member' ? (
            <div style={{ marginTop: '0.5rem' }}>
              <SearchableSelect
                options={members.map(m => ({ value: m.id, label: `${m.name} (${m.id})` }))}
                value={selectedMember}
                onChange={setSelectedMember}
                placeholder="— Pilih Anggota (Opsional) —"
              />
              {selectedMember && <p style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>✅ Transaksi ini akan dihitung ke SHU anggota</p>}
            </div>
          ) : (
            <div className="flex gap-2 items-center" style={{ marginTop: '0.5rem' }}>
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  options={customers.map(c => ({ value: c.id, label: c.name }))}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  placeholder="— Pilih Customer —"
                />
              </div>
              <button 
                className="btn" 
                style={{ height: '38px', padding: '0 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '6px', fontWeight: 500 }} 
                onClick={() => setShowAddCustomer(true)}
              >
                <Plus size={16} /> Baru
              </button>
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="member-selector-label"><Calendar size={14} /> Tanggal Transaksi</label>
          <input type="date" className="form-control" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
        </div>

        {buyerType !== 'customer' && (
          <div className="payment-method-selector">
            <label className="member-selector-label"><Banknote size={14} /> Metode Pembayaran</label>
            <div className="payment-method-btns">
              <button type="button" className={`payment-btn ${paymentMethod === 'Cash' ? 'active-cash' : ''}`}
                onClick={() => setPaymentMethod('Cash')}><Banknote size={15} /> Cash</button>
              <button type="button" className={`payment-btn ${paymentMethod === 'Kredit' ? 'active-kredit' : ''}`}
                onClick={() => setPaymentMethod('Kredit')}><CreditCard size={15} /> Kredit / Cicilan</button>
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          <label className="member-selector-label"><Calendar size={14} /> Tanggal Pengambilan</label>
          <input type="date" className="form-control" value={takeDate} onChange={(e) => setTakeDate(e.target.value)} />
        </div>

        {paymentMethod === 'Kredit' && buyerType !== 'customer' && (
          <div className="kredit-fields">
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '0.5rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="member-selector-label">Jumlah Cicilan</label>
                <select className="form-control" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                  {[1,2,3,4,5,6,8,10,12].map(n => (
                    <option key={n} value={n}>{n === 1 ? '1x (Tempo/Lunas)' : `${n}x Cicilan`}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="member-selector-label">Mulai Bayar</label>
                <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="member-selector-label">Keterangan</label>
              <input type="text" className="form-control" placeholder="Contoh: Potong gaji bulan depan"
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {/* Preview jadwal cicilan */}
            {schedule.length > 0 && (
              <div className="cicilan-preview">
                <div className="cicilan-preview-title">📅 Jadwal Cicilan</div>
                {schedule.map(s => (
                  <div key={s.no} className="cicilan-row">
                    <span>Cicilan ke-{s.no} ({s.date})</span>
                    <span>Rp {s.amount.toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <div className="cicilan-row cicilan-total">
                  <span>Per cicilan</span>
                  <span>Rp {schedule.length > 0 ? schedule[0].amount.toLocaleString('id-ID') : 0}</span>
                </div>
              </div>
            )}
            <div className="kredit-info-note">
              ⚠️ Dicatat sebagai <strong>Piutang Dagang</strong> — bukan Kas.
            </div>
          </div>
        )}

        {buyerType === 'customer' && (
          <div className="kredit-fields" style={{ background: 'var(--color-surface-hover)', border: '1px dashed var(--color-border)' }}>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="member-selector-label"><Calendar size={14} /> Tanggal Jatuh Tempo</label>
              <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <small style={{ color:'#64748b', fontSize:'11px', display:'block', marginTop:'4px' }}>Secara otomatis diatur 1 bulan dari Tanggal Transaksi.</small>
            </div>
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="member-selector-label">Keterangan (Opsional)</label>
              <input type="text" className="form-control" placeholder="Contoh: Jatuh tempo dibayar via transfer"
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        )}

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart text-muted">Belum ada barang di keranjang.</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-price">Rp {item.price.toLocaleString('id-ID')}</p>
                </div>
                <div className="cart-item-actions">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                  <span className="qty-value">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                  <button className="delete-btn ms-2" onClick={() => removeFromCart(item.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          {/* Rincian item */}
          {cart.length > 0 && (
            <div style={{ marginBottom:'0.75rem', paddingBottom:'0.75rem', borderBottom:'1px dashed var(--color-border)' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.8rem', marginBottom:'0.35rem', gap:'0.5rem' }}>
                  <span style={{ color:'var(--color-text-muted)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.name}
                  </span>
                  <span style={{ color:'var(--color-text-muted)', flexShrink:0 }}>
                    {item.qty}× Rp {item.price.toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontWeight:600, flexShrink:0, minWidth:70, textAlign:'right' }}>
                    Rp {(item.qty * item.price).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="summary-row"><span>Subtotal</span><span>Rp {totalAmount.toLocaleString('id-ID')}</span></div>
          {paymentMethod === 'Kredit' && markupAmount > 0 && (
            <div className="summary-row" style={{ color: 'var(--color-warning)' }}>
              <span>Markup Kredit (10%)</span>
              <span>Rp {markupAmount.toLocaleString('id-ID')}</span>
            </div>
          )}
          {paymentMethod === 'Kredit' && installments > 1 && (
            <div className="summary-row" style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>
              <span>Per cicilan ({installments}x)</span>
              <span>Rp {Math.floor(grandTotal / installments).toLocaleString('id-ID')}</span>
            </div>
          )}
          {buyerType !== 'customer' && (
            <div className="summary-row" style={{ fontSize: '0.8rem' }}>
              <span>Metode</span>
              <span style={{ color: paymentMethod === 'Kredit' ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 600 }}>
                {paymentMethod === 'Kredit' ? `💳 ${installments === 1 ? 'Tempo' : `${installments}x Cicilan`}` : '💵 Cash'}
              </span>
            </div>
          )}
          <div className="summary-row" style={{ fontSize: '0.8rem' }}>
            <span>PIC / Kasir</span>
            <span style={{ fontWeight: 600 }}>{currentUser?.name || 'Admin'}</span>
          </div>
          <div className="summary-row total">
            <span>Total Bayar</span><span>Rp {grandTotal.toLocaleString('id-ID')}</span>
          </div>
          <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
            {paymentMethod === 'Kredit' ? (installments === 1 ? 'Catat Tempo' : `Catat ${installments}x Cicilan`) : 'Bayar Sekarang'}
          </button>
        </div>
      </div>

      {/* Modal Add Customer */}
      {showAddCustomer && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Tambah Customer Baru</h3>
              <button className="icon-btn" onClick={() => setShowAddCustomer(false)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color="#64748b" /></button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>NAMA LENGKAP</label>
                <input type="text" style={{ width: '100%', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', color: '#0f172a' }} value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Contoh: Aslam Hadil Matin" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>ALAMAT LENGKAP</label>
                <textarea rows="3" style={{ width: '100%', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', resize: 'vertical', color: '#0f172a', fontFamily: 'monospace', fontSize: '0.85rem' }} value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Jalan Ciracas No.01..."></textarea>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>NPWP</label>
                <input type="text" style={{ width: '100%', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', color: '#0f172a' }} value={newCustomer.npwp} onChange={e => setNewCustomer({...newCustomer, npwp: e.target.value})} placeholder="Contoh: 00000" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>NOMOR TELEPON</label>
                <input type="text" style={{ width: '100%', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', color: '#0f172a' }} value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Contoh: 08579..." />
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', background: '#fff' }}>
              <button style={{ padding: '0.6rem 1.5rem', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setShowAddCustomer(false)}>Batal</button>
              <button style={{ padding: '0.6rem 1.5rem', background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onClick={submitAddCustomer}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Struk */}
      {showReceipt && lastTransaction && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}
          onClick={(e) => e.target === e.currentTarget && setShowReceipt(false)}>
          <div className="modal-content" style={{ maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🧾 Struk Transaksi</h3>
              <button className="modal-close-btn" onClick={() => setShowReceipt(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <Receipt {...lastTransaction} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReceipt(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailSales;
