import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { supabase, isSupabaseReady } from '../../lib/supabase';
import { Search, Plus, Package, ShoppingBag, Briefcase, Store, X, AlertTriangle, Pencil, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import './MasterData.css';

const Inventory = () => {
  const products            = useStore((state) => state.products);
  const consignmentProducts = useStore((state) => state.consignmentProducts);
  const services            = useStore((state) => state.services);
  const currentUser         = useStore((state) => state.currentUser);

  // Buka akses edit untuk semua akun pengurus/admin
  const canEdit = true;

  const addProduct        = useStore((state) => state.addProduct);
  const addConsignment    = useStore((state) => state.addConsignment);
  const addService        = useStore((state) => state.addService);
  const updateProduct     = useStore((state) => state.updateProduct);
  const updateConsignment = useStore((state) => state.updateConsignment);
  const updateService     = useStore((state) => state.updateService);
  const deleteProduct     = useStore((state) => state.deleteProduct);
  const deleteConsignment = useStore((state) => state.deleteConsignment);
  const deleteService     = useStore((state) => state.deleteService);

  const [activeTab, setActiveTab] = useState('retail');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset halaman saat tab atau search berubah
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '', category: 'Sembako', price: 0, hpp: 0, stock: 0, minStock: 10,
    supplier: '', supplierPrice: 0, provider: '', type: '', image: '',
    biayaJasa: 0, adminBank: 0, paymentType: 'cash'
  });

  const openAddModal = () => {
    setEditingItem(null);
    setImagePreview(null);
    setItemForm({ name: '', category: 'Sembako', price: 0, hpp: 0, stock: 0, minStock: 10, supplier: '', supplierPrice: 0, provider: '', type: '', image: '', biayaJasa: 0, adminBank: 0, paymentType: 'cash' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setImagePreview(item.image || null);
    setItemForm({
      name: item.name,
      category: item.category ?? item.type ?? '',
      price: item.price,
      hpp: item.hpp ?? item.supplierPrice ?? 0,
      stock: item.stock ?? 0,
      minStock: item.minStock ?? 10,
      supplier: item.supplier ?? '',
      supplierPrice: item.supplierPrice ?? 0,
      provider: item.provider ?? '',
      type: item.type ?? '',
      image: item.image ?? '',
      biayaJasa: item.biayaJasa ?? 0,
      adminBank: item.adminBank ?? 0,
      paymentType: item.paymentType ?? 'cash',
    });
    setShowModal(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB.');
      return;
    }

    // Coba upload ke Supabase Storage kalau tersedia
    if (isSupabaseReady()) {
      try {
        const ext      = file.name.split('.').pop();
        const fileName = `products/${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage
          .from('kpkcg-images')
          .upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from('kpkcg-images')
          .getPublicUrl(fileName);
        const url = urlData.publicUrl;
        setImagePreview(url);
        setItemForm(prev => ({ ...prev, image: url }));
        return;
      } catch (err) {
        console.warn('Supabase storage upload failed, fallback to base64:', err);
      }
    }

    // Fallback: base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setItemForm(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      // UPDATE mode
      if (activeTab === 'retail') {
        updateProduct(editingItem.id, { name: itemForm.name, category: itemForm.category, price: itemForm.price, hpp: itemForm.hpp, stock: itemForm.stock, minStock: itemForm.minStock, image: itemForm.image });
      } else if (activeTab === 'consignment') {
        updateConsignment(editingItem.id, {
          name: itemForm.name, supplier: itemForm.supplier, price: itemForm.price,
          stock: itemForm.stock, minStock: itemForm.minStock, supplierPrice: itemForm.supplierPrice,
          commission: itemForm.price - itemForm.supplierPrice, image: itemForm.image
        });
      } else if (activeTab === 'services') {
        const totalPrice = Number(itemForm.hpp || 0) + Number(itemForm.biayaJasa || 0) + Number(itemForm.adminBank || 0);
        updateService(editingItem.id, { name: itemForm.name, category: itemForm.category, provider: itemForm.provider, price: totalPrice, hpp: itemForm.hpp, type: itemForm.type, image: itemForm.image, biayaJasa: itemForm.biayaJasa, adminBank: itemForm.adminBank, paymentType: itemForm.paymentType });
      }
    } else {
      // ADD mode
      if (activeTab === 'retail') {
        addProduct({ name: itemForm.name, category: itemForm.category, price: itemForm.price, hpp: itemForm.hpp, stock: itemForm.stock, minStock: itemForm.minStock, image: itemForm.image });
      } else if (activeTab === 'consignment') {
        addConsignment({
          name: itemForm.name, supplier: itemForm.supplier, price: itemForm.price,
          stock: itemForm.stock, minStock: itemForm.minStock, supplierPrice: itemForm.supplierPrice,
          commission: itemForm.price - itemForm.supplierPrice, image: itemForm.image
        });
      } else if (activeTab === 'services') {
        const totalPrice = Number(itemForm.hpp || 0) + Number(itemForm.biayaJasa || 0) + Number(itemForm.adminBank || 0);
        addService({ name: itemForm.name, category: itemForm.category || 'Lainnya', provider: itemForm.provider, price: totalPrice, hpp: itemForm.hpp, type: itemForm.type || 'PPOB', image: itemForm.image, biayaJasa: itemForm.biayaJasa, adminBank: itemForm.adminBank, paymentType: itemForm.paymentType });
      }
    }
    setShowModal(false);
    setEditingItem(null);
    setImagePreview(null);
    setItemForm({ name: '', category: 'Sembako', price: 0, hpp: 0, stock: 0, minStock: 10, supplier: '', supplierPrice: 0, provider: '', type: '', image: '', biayaJasa: 0, adminBank: 0, paymentType: 'cash' });
  };

  const handleDelete = (item) => {
    const label = item.name;
    if (!window.confirm(`Hapus "${label}" dari daftar? Data tidak bisa dikembalikan.`)) return;
    if (activeTab === 'retail')       deleteProduct(item.id);
    else if (activeTab === 'consignment') deleteConsignment(item.id);
    else if (activeTab === 'services')    deleteService(item.id);
  };

  const getFilteredData = (data) =>
    data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Pagination helper
  const getPaged = (data) => {
    const filtered = getFilteredData(data);
    const total = filtered.length;
    const pages = Math.ceil(total / PAGE_SIZE);
    const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    return { paged, total, pages };
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

  const lowStockCount = products.filter(p => p.stock < (p.minStock || 10)).length;

  // Stock badge helper
  const stockBadge = (stock, minStock = 10) => {
    if (stock < minStock / 2) return <span className="stock-badge stock-low">{stock} Unit</span>;
    if (stock < minStock)     return <span className="stock-badge stock-mid">{stock} Unit</span>;
    return                    <span className="stock-badge stock-ok">{stock} Unit</span>;
  };

  const tabLabels = {
    retail: 'Barang Ritel',
    consignment: 'Konsinyasi',
    services: 'Jasa & PPOB',
  };

  return (
    <div className="master-container">

      {/* Header */}
      <div className="master-header">
        <div className="master-header-title">
          <h2>Data Inventaris &amp; Layanan</h2>
          <p>Kelola daftar barang jualan, titipan, dan daftar PPOB/Jasa.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Tambah Data
        </button>
      </div>

      {/* Stat Cards */}
      <div className="master-stats">
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon primary"><ShoppingBag size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Barang Ritel</div>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon success"><Store size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value">{consignmentProducts.length}</div>
            <div className="stat-label">Barang Konsinyasi</div>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon secondary"><Briefcase size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value">{services.length}</div>
            <div className="stat-label">Layanan / PPOB</div>
          </div>
        </div>
        <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="stat-icon warning"><AlertTriangle size={22} /></div>
          <div className="stat-info" style={{ textAlign: 'center' }}>
            <div className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--color-warning)' : 'inherit' }}>
              {lowStockCount}
            </div>
            <div className="stat-label">Stok Menipis</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="master-tabs">
        {['retail', 'consignment', 'services'].map(tab => (
          <button
            key={tab}
            className={`master-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setSearchTerm(''); }}
          >
            {tab === 'retail'       && <ShoppingBag size={16} />}
            {tab === 'consignment'  && <Store       size={16} />}
            {tab === 'services'     && <Briefcase   size={16} />}
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Table Panel */}
      <div className="glass-panel">
        {/* Toolbar */}
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

        {/* Table: Retail */}
        {activeTab === 'retail' && (
          <div className="master-table-wrapper">
            <table className="master-table">
              <thead>
                <tr>
                  <th>ID Barang</th>
                  <th>Foto</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>HPP</th>
                  <th>Harga Jual</th>
                  <th>Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {getPaged(products).paged.map(item => (
                  <tr key={item.id}>
                    <td><span className="cell-id">BRG-{item.id}</span></td>
                    <td>
                      {item.image
                        ? <img src={item.image} alt={item.name} className="table-thumb" />
                        : <div className="table-thumb-placeholder">📦</div>
                      }
                    </td>
                    <td><span className="cell-name">{item.name}</span></td>
                    <td><span className="badge badge-primary">{item.category}</span></td>
                    <td className="cell-amount" style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      Rp {(item.hpp || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="cell-amount">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td>{stockBadge(item.stock, item.minStock)}</td>
                    <td>
                      <div className="table-action-group">
                        {canEdit && <button className="table-action-btn" onClick={() => openEditModal(item)}><Pencil size={13} /> Edit</button>}
                        {canEdit && <button className="table-action-btn table-action-delete" onClick={() => handleDelete(item)}><Trash2 size={13} /> Hapus</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFilteredData(products).length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={24} /></div>
                <p>Tidak ada barang ritel ditemukan.</p>
              </div>
            )}
            <PaginationBar total={getPaged(products).total} pages={getPaged(products).pages} />
          </div>
        )}

        {/* Table: Consignment */}
        {activeTab === 'consignment' && (
          <div className="master-table-wrapper">
            <table className="master-table">
              <thead>
                <tr>
                  <th>ID Titipan</th>
                  <th>Foto</th>
                  <th>Nama Barang</th>
                  <th>Nama Suplier</th>
                  <th>Harga Jual</th>
                  <th>Komisi Koperasi</th>
                  <th>Stok</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {getPaged(consignmentProducts).paged.map(item => (
                  <tr key={item.id}>
                    <td><span className="cell-id">KNS-{item.id}</span></td>
                    <td>
                      {item.image
                        ? <img src={item.image} alt={item.name} className="table-thumb" />
                        : <div className="table-thumb-placeholder">🛍️</div>
                      }
                    </td>
                    <td><span className="cell-name">{item.name}</span></td>
                    <td>{item.supplier}</td>
                    <td className="cell-amount">Rp {item.price.toLocaleString('id-ID')}</td>
                    <td className="cell-amount">
                      Rp {(item.commission ?? (item.price - item.supplierPrice)).toLocaleString('id-ID')}
                    </td>
                    <td>{stockBadge(item.stock, item.minStock)}</td>
                    <td>
                      <div className="table-action-group">
                        {canEdit && <button className="table-action-btn" onClick={() => openEditModal(item)}><Pencil size={13} /> Edit</button>}
                        {canEdit && <button className="table-action-btn table-action-delete" onClick={() => handleDelete(item)}><Trash2 size={13} /> Hapus</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFilteredData(consignmentProducts).length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Store size={24} /></div>
                <p>Tidak ada barang konsinyasi ditemukan.</p>
              </div>
            )}
            <PaginationBar total={getPaged(consignmentProducts).total} pages={getPaged(consignmentProducts).pages} />
          </div>
        )}

        {/* Table: Services */}
        {activeTab === 'services' && (
          <div className="master-table-wrapper">
            <table className="master-table">
              <thead>
                <tr>
                  <th>ID Jasa</th>
                  <th>Foto</th>
                  <th>Nama Layanan</th>
                  <th>Jenis Pembayaran</th>
                  <th>Kategori</th>
                  <th>Provider</th>
                  <th>HPP</th>
                  <th>Admin Bank</th>
                  <th>Total Harga</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {getPaged(services).paged.map(item => (
                  <tr key={item.id}>
                    <td><span className="cell-id">JSA-{item.id}</span></td>
                    <td>
                      {item.image
                        ? <img src={item.image} alt={item.name} className="table-thumb" />
                        : <div className="table-thumb-placeholder">💼</div>
                      }
                    </td>
                    <td><span className="cell-name">{item.name}</span></td>
                    <td>
                      <span className={`badge ${item.paymentType === 'credit' ? 'badge-warning' : 'badge-success'}`}>
                        {item.paymentType === 'credit' ? 'Credit' : 'Cash'}
                      </span>
                    </td>
                    <td><span className="badge badge-primary">{item.category ?? item.type}</span></td>
                    <td>{item.provider}</td>
                    <td className="cell-amount" style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      Rp {(item.hpp || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="cell-amount" style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                      Rp {(item.adminBank || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="cell-amount" style={{ fontWeight: 600 }}>
                      Rp {((item.hpp || 0) + (item.biayaJasa || 0) + (item.adminBank || 0)).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <div className="table-action-group">
                        {canEdit && <button className="table-action-btn" onClick={() => openEditModal(item)}><Pencil size={13} /> Edit</button>}
                        {canEdit && <button className="table-action-btn table-action-delete" onClick={() => handleDelete(item)}><Trash2 size={13} /> Hapus</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getFilteredData(services).length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><Briefcase size={24} /></div>
                <p>Tidak ada layanan ditemukan.</p>
              </div>
            )}
            <PaginationBar total={getPaged(services).total} pages={getPaged(services).pages} />
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Data */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingItem ? <Pencil size={20} /> : <Plus size={20} />}
                {editingItem ? 'Edit' : 'Tambah'} {activeTab === 'retail' ? 'Barang Ritel' : activeTab === 'consignment' ? 'Barang Konsinyasi' : 'Layanan/PPOB'}
              </h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Foto Produk</label>
                  <div
                    className={`image-upload-area ${imagePreview ? 'has-image' : ''}`}
                    onClick={() => document.getElementById('img-upload-input').click()}
                  >
                    {imagePreview ? (
                      <div className="image-preview-wrapper">
                        <img src={imagePreview} alt="Preview" className="image-preview-img" />
                        <button
                          type="button"
                          className="image-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                            setItemForm(prev => ({ ...prev, image: '' }));
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="image-upload-placeholder">
                        <div className="image-upload-icon">📷</div>
                        <p className="image-upload-text">Klik untuk upload foto</p>
                        <p className="image-upload-hint">JPG, PNG — maks. 800KB</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="img-upload-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Item</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Masukkan nama item..."
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                  />
                </div>

                {activeTab !== 'services' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Stok Awal (Unit)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={itemForm.stock}
                        onChange={(e) => setItemForm({ ...itemForm, stock: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Min. Stok (Peringatan)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={itemForm.minStock}
                        onChange={(e) => setItemForm({ ...itemForm, minStock: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'retail' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Kategori</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Sembako, ATK, dll"
                        value={itemForm.category}
                        onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">HPP / Harga Beli (Rp)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        value={itemForm.hpp}
                        onChange={(e) => setItemForm({ ...itemForm, hpp: Number(e.target.value) })}
                      />
                    </div>
                  </>
                )}

                {activeTab === 'consignment' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Nama Suplier</label>
                      <input
                        type="text"
                        className="form-control"
                        value={itemForm.supplier}
                        onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">HPP / Harga Beli Suplier (Rp)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={itemForm.supplierPrice}
                        onChange={(e) => setItemForm({ ...itemForm, supplierPrice: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'services' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Provider</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="PLN, Telkom, dll"
                          value={itemForm.provider}
                          onChange={(e) => setItemForm({ ...itemForm, provider: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tipe / Kategori</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Token, Pulsa, dll"
                          value={itemForm.type}
                          onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">HPP / Modal Layanan (Rp)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        value={itemForm.hpp}
                        onChange={(e) => setItemForm({ ...itemForm, hpp: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Jenis Pembayaran</label>
                      <select
                        className="form-control"
                        value={itemForm.paymentType}
                        onChange={(e) => setItemForm({ ...itemForm, paymentType: e.target.value })}
                      >
                        <option value="cash">Cash</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">Admin Bank (Rp)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={itemForm.adminBank}
                          onChange={(e) => setItemForm({ ...itemForm, adminBank: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab !== 'services' && (
                  <div className="form-group">
                    <label className="form-label">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
