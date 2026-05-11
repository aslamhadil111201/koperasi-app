import React, { useState, useMemo } from 'react';
import { PackagePlus, ShoppingBag, Store, Briefcase, X, RefreshCw, Search, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import './MasterData.css';

const fmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const ReceiveNew = () => {
  const products            = useStore((s) => s.products);
  const consignmentProducts = useStore((s) => s.consignmentProducts);
  const services            = useStore((s) => s.services);
  const journal             = useStore((s) => s.journal);
  const restockProduct      = useStore((s) => s.restockProduct);
  const restockConsignment  = useStore((s) => s.restockConsignment);
  const restockService      = useStore((s) => s.restockService);

  const [activeTab, setActiveTab] = useState('retail');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset halaman saat tab/search berubah
  React.useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [form, setForm] = useState({ qty: 1, hpp: 0, date: new Date().toISOString().split('T')[0], notes: '' });

  // Restock history from journal (ref = BKK-RST)
  const restockHistory = useMemo(() => {
    return journal
      .filter(e => e.ref === 'BKK-RST' && e.debit > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 20);
  }, [journal]);

  const openModal = (item) => {
    setModalItem(item);
    setForm({
      qty: 1,
      hpp: item.hpp ?? item.supplierPrice ?? 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalItem) return;
    const qty = Number(form.qty);
    const hpp = Number(form.hpp);

    if (activeTab === 'retail') {
      restockProduct(modalItem.id, qty, hpp);
    } else if (activeTab === 'consignment') {
      restockConsignment(modalItem.id, qty);
    } else if (activeTab === 'services') {
      restockService(modalItem.id, hpp);
    }

    setShowModal(false);
    setModalItem(null);
  };

  const getFiltered = (data) =>
    data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getPaged = (data) => {
    const filtered = getFiltered(data);
    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    return { paged, total: filtered.length, pages };
  };

  const PaginationBar = ({ total, pages }) => {
    if (pages <= 1) return null;
    return (
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1rem', borderTop:'1px solid var(--color-border)', fontSize:'0.82rem' }}>
        <span style={{ color:'var(--color-text-muted)' }}>
          Halaman {currentPage} dari {pages} · {total} item
        </span>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-secondary"
            style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
            onClick={() => setCurrentPage(p => Math.max(1, p-1))}
            disabled={currentPage === 1}>
            <ChevronLeft size={14} /> Prev
          </button>
          {Array.from({ length: pages }, (_, i) => i+1)
            .filter(p => p===1 || p===pages || Math.abs(p-currentPage)<=1)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx-1] !== p-1 && <span style={{ padding:'0.3rem 0.25rem', color:'var(--color-text-muted)' }}>…</span>}
                <button
                  className={`btn ${currentPage===p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding:'0.3rem 0.625rem', fontSize:'0.78rem', minWidth:32 }}
                  onClick={() => setCurrentPage(p)}>
                  {p}
                </button>
              </React.Fragment>
            ))
          }
          <button className="btn btn-secondary"
            style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:4 }}
            onClick={() => setCurrentPage(p => Math.min(pages, p+1))}
            disabled={currentPage === pages}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  const stockBadge = (stock) => {
    if (stock === undefined || stock === null) return null;
    if (stock < 10)  return <span className="stock-badge stock-low">{stock} Unit</span>;
    if (stock < 20)  return <span className="stock-badge stock-mid">{stock} Unit</span>;
    return              <span className="stock-badge stock-ok">{stock} Unit</span>;
  };

  const tabLabels = { retail: 'Barang Ritel', consignment: 'Konsinyasi', services: 'Jasa & PPOB' };

  return (
    <div className="master-container">

      {/* Header */}
      <div className="master-header">
        <div className="master-header-title">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackagePlus size={22} style={{ color: 'var(--color-primary)' }} />
            Terima Barang / Restock
          </h2>
          <p>Catat penerimaan stok baru dan perbarui HPP barang.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="master-stats">
        <div className="stat-card">
          <div className="stat-icon primary"><ShoppingBag size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Barang Ritel</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><Store size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{consignmentProducts.length}</div>
            <div className="stat-label">Konsinyasi</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon secondary"><Briefcase size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{services.length}</div>
            <div className="stat-label">Jasa & PPOB</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning"><History size={22} /></div>
          <div className="stat-info">
            <div className="stat-value">{restockHistory.length}</div>
            <div className="stat-label">Riwayat Restock</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="master-tabs">
        {['retail', 'consignment', 'services'].map(tab => (
          <button
            key={tab}
            className={`master-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
          >
            {tab === 'retail'      && <ShoppingBag size={16} />}
            {tab === 'consignment' && <Store       size={16} />}
            {tab === 'services'    && <Briefcase   size={16} />}
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Table Panel */}
      <div className="glass-panel">
        <div className="master-toolbar">
          <div className="search-bar">
            <Search size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder={`Cari ${tabLabels[activeTab]}...`}
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Retail Table */}
        {activeTab === 'retail' && (
          <div className="master-table-wrapper">
            <table className="master-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>HPP Saat Ini</th>
                  <th>Harga Jual</th>
                  <th>Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {getPaged(products).paged.map(item => (
                  <tr key={item.id}>
                    <td><span className="cell-id">BRG-{item.id}</span></td>
                    <td><span className="cell-name">{item.name}</span></td>
                    <td><span className="badge badge-primary">{item.category}</span></td>
                    <td className="cell-amount" style={{ color: 'var(--color-text-muted)' }}>{fmt(item.hpp)}</td>
                    <td className="cell-amount">{fmt(item.price)}</td>
                    <td>{stockBadge(item.stock)}</td>
                    <td>
                      <button
                        className="table-action-btn"
                        style={{ color: 'var(--color-success)', borderColor: 'rgba(16,185,129,0.3)' }}
                        onClick={() => openModal(item)}
                      >
                        <PackagePlus size={13} /> Terima Barang
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFiltered(products).length === 0 && (
              <div className="empty-state"><div className="empty-state-icon"><ShoppingBag size={24} /></div><p>Tidak ada barang ditemukan.</p></div>
            )}
            <PaginationBar total={getPaged(products).total} pages={getPaged(products).pages} />
          </div>
        )}

        {/* Consignment Table */}
        {activeTab === 'consignment' && (
          <div className="master-table-wrapper">
            <table className="master-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Barang</th>
                  <th>Suplier</th>
                  <th>Harga Beli Suplier</th>
                  <th>Harga Jual</th>
                  <th>Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {getPaged(consignmentProducts).paged.map(item => (
                  <tr key={item.id}>
                    <td><span className="cell-id">KNS-{item.id}</span></td>
                    <td><span className="cell-name">{item.name}</span></td>
                    <td>{item.supplier}</td>
                    <td className="cell-amount" style={{ color: 'var(--color-text-muted)' }}>{fmt(item.supplierPrice)}</td>
                    <td className="cell-amount">{fmt(item.price)}</td>
                    <td>{stockBadge(item.stock)}</td>
                    <td>
                      <button
                        className="table-action-btn"
                        style={{ color: 'var(--color-success)', borderColor: 'rgba(16,185,129,0.3)' }}
                        onClick={() => openModal(item)}
                      >
                        <PackagePlus size={13} /> Terima Barang
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFiltered(consignmentProducts).length === 0 && (
              <div className="empty-state"><div className="empty-state-icon"><Store size={24} /></div><p>Tidak ada barang konsinyasi ditemukan.</p></div>
            )}
            <PaginationBar total={getPaged(consignmentProducts).total} pages={getPaged(consignmentProducts).pages} />
          </div>
        )}

        {/* Services Table */}
        {activeTab === 'services' && (
          <div className="master-table-wrapper">
            <table className="master-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nama Layanan</th>
                  <th>Tipe</th>
                  <th>Provider</th>
                  <th>HPP / Modal</th>
                  <th>Harga Jual</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {getPaged(services).paged.map(item => (
                  <tr key={item.id}>
                    <td><span className="cell-id">JSA-{item.id}</span></td>
                    <td><span className="cell-name">{item.name}</span></td>
                    <td><span className="badge badge-primary">{item.type}</span></td>
                    <td>{item.provider}</td>
                    <td className="cell-amount" style={{ color: 'var(--color-text-muted)' }}>{fmt(item.hpp)}</td>
                    <td className="cell-amount">{fmt(item.price)}</td>
                    <td>
                      <button
                        className="table-action-btn"
                        style={{ color: 'var(--color-secondary)', borderColor: 'rgba(6,182,212,0.3)' }}
                        onClick={() => openModal(item)}
                      >
                        <RefreshCw size={13} /> Update HPP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFiltered(services).length === 0 && (
              <div className="empty-state"><div className="empty-state-icon"><Briefcase size={24} /></div><p>Tidak ada layanan ditemukan.</p></div>
            )}
            <PaginationBar total={getPaged(services).total} pages={getPaged(services).pages} />
          </div>
        )}
      </div>

      {/* Restock History */}
      <div className="glass-panel">
        <div className="master-toolbar" style={{ marginBottom: '1rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={17} style={{ color: 'var(--color-primary)' }} />
            Riwayat Restock Terbaru
          </h4>
          <span className="master-toolbar-info">{restockHistory.length} entri</span>
        </div>
        {restockHistory.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><History size={24} /></div>
            <p>Belum ada riwayat restock. Lakukan penerimaan barang pertama.</p>
          </div>
        ) : (
          <div className="master-table-wrapper">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Ref</th>
                  <th>Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                {restockHistory.map((entry, idx) => (
                  <tr key={idx}>
                    <td>{entry.date}</td>
                    <td>{entry.description}</td>
                    <td><span className="cell-id">{entry.ref}</span></td>
                    <td className="cell-amount" style={{ color: 'var(--color-success)' }}>{fmt(entry.debit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && modalItem && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>
                <PackagePlus size={18} />
                {activeTab === 'services' ? 'Update HPP Layanan' : 'Terima Barang'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Item</label>
                  <input type="text" className="form-control" value={modalItem.name} readOnly
                    style={{ background: 'var(--color-background)', cursor: 'default' }} />
                </div>

                {activeTab !== 'services' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Stok Saat Ini</label>
                      <input type="text" className="form-control" value={`${modalItem.stock} Unit`} readOnly
                        style={{ background: 'var(--color-background)', cursor: 'default' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Qty Diterima (Unit)</label>
                      <input
                        type="number" className="form-control" min={1}
                        value={form.qty}
                        onChange={(e) => setForm(f => ({ ...f, qty: e.target.value }))}
                        required
                      />
                    </div>
                  </>
                )}

                {activeTab !== 'consignment' && (
                  <div className="form-group">
                    <label className="form-label">
                      {activeTab === 'services' ? 'HPP / Modal Layanan Baru (Rp)' : 'HPP / Harga Beli Baru (Rp)'}
                    </label>
                    <input
                      type="number" className="form-control" min={0}
                      value={form.hpp}
                      onChange={(e) => setForm(f => ({ ...f, hpp: e.target.value }))}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Tanggal Terima</label>
                  <input
                    type="date" className="form-control"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan (Opsional)</label>
                  <input
                    type="text" className="form-control"
                    placeholder="Catatan penerimaan barang..."
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                {activeTab === 'retail' && (
                  <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    Total biaya restock: <strong style={{ color: 'var(--color-success)' }}>
                      {fmt(Number(form.qty) * Number(form.hpp))}
                    </strong>
                    <br />Akan dicatat sebagai jurnal Persediaan Barang &amp; Kas.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  <PackagePlus size={14} /> Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiveNew;
