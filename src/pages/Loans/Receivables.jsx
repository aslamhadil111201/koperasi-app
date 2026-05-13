import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Search, Save, CheckSquare } from 'lucide-react';

export default function Receivables() {
  const { members, journal, cashLoans, creditGoods, processPayrollDeduction } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState({});

  // 1. Calculate Piutang Dagang (Retail/Jasa Kasbon) from Journal
  const piutangDagangMap = useMemo(() => {
    const map = {};
    journal.forEach(entry => {
      if (entry.account === 'Piutang Dagang') {
        const memberId = entry.ref; // Now it contains memberId
        if (!map[memberId]) map[memberId] = 0;
        map[memberId] += (entry.debit || 0) - (entry.credit || 0);
      }
    });
    return map;
  }, [journal]);

  // 2. Calculate Piutang Anggota (Cash Loans)
  const piutangAnggotaMap = useMemo(() => {
    const map = {};
    cashLoans.forEach(loan => {
      if (loan.status === 'Active' && loan.remainingAmount > 0) {
        if (!map[loan.memberId]) map[loan.memberId] = 0;
        map[loan.memberId] += loan.remainingAmount;
      }
    });
    return map;
  }, [cashLoans]);

  // 3. Calculate Piutang Barang (Credit Goods)
  const piutangBarangMap = useMemo(() => {
    const map = {};
    creditGoods.forEach(credit => {
      if (credit.status === 'Active' && credit.remainingAmount > 0) {
        if (!map[credit.memberId]) map[credit.memberId] = 0;
        map[credit.memberId] += credit.remainingAmount;
      }
    });
    return map;
  }, [creditGoods]);

  // 4. Combine into final list
  const receivablesList = useMemo(() => {
    return members.map(member => {
      const pDagang = piutangDagangMap[member.id] || 0;
      const pAnggota = piutangAnggotaMap[member.id] || 0;
      const pBarang = piutangBarangMap[member.id] || 0;
      const total = pDagang + pAnggota + pBarang;

      return {
        id: member.id,
        name: member.name,
        type: member.type,
        pDagang,
        pAnggota,
        pBarang,
        total
      };
    }).filter(m => m.total > 0); // Only show members with debts
  }, [members, piutangDagangMap, piutangAnggotaMap, piutangBarangMap]);

  // Filter by search
  const filteredList = receivablesList.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e) => {
    const newSelected = {};
    if (e.target.checked) {
      filteredList.forEach(r => newSelected[r.id] = true);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelect = (id) => {
    setSelectedMembers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selectedMembers).filter(Boolean).length;
  const totalSelectedAmount = filteredList
    .filter(r => selectedMembers[r.id])
    .reduce((sum, r) => sum + r.total, 0);

  const handleProcessPayroll = () => {
    const membersToProcess = Object.keys(selectedMembers).filter(id => selectedMembers[id]);
    if (membersToProcess.length === 0) return alert('Pilih minimal 1 anggota untuk dipotong gajinya.');

    if (!window.confirm(`Proses Potong Gaji untuk ${membersToProcess.length} anggota dengan total Rp ${totalSelectedAmount.toLocaleString('id-ID')}?`)) {
      return;
    }

    const paymentMap = {};
    membersToProcess.forEach(mId => {
      const data = receivablesList.find(r => r.id === mId);
      paymentMap[mId] = {
        piutangDagang: data.pDagang,
        piutangAnggota: data.pAnggota,
        piutangBarang: data.pBarang
      };
    });

    processPayrollDeduction(membersToProcess, paymentMap);
    setSelectedMembers({});
    alert('Proses Potong Gaji Berhasil! Jurnal pelunasan telah dicatat.');
  };

  return (
    <div className="page-container fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Piutang & Potong Gaji</h1>
          <p className="text-muted">Daftar hutang anggota dan pelunasan massal (Payroll Deduction)</p>
        </div>
        
        <div className="flex gap-3">
          <div className="search-bar" style={{ width: '250px' }}>
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Cari anggota..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={handleProcessPayroll}
            disabled={selectedCount === 0}
          >
            <CheckSquare size={18} />
            Proses Potong Gaji ({selectedCount})
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th width="50">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={filteredList.length > 0 && selectedCount === filteredList.length}
                  />
                </th>
                <th>ID Anggota</th>
                <th>Nama Anggota</th>
                <th className="text-right">Kasbon (Ritel/Jasa)</th>
                <th className="text-right">Pinjaman Tunai</th>
                <th className="text-right">Kredit Barang</th>
                <th className="text-right">Total Potongan</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-muted">
                    Tidak ada anggota yang memiliki hutang/tagihan.
                  </td>
                </tr>
              ) : (
                filteredList.map(item => (
                  <tr key={item.id} className={selectedMembers[item.id] ? 'bg-primary/5' : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={!!selectedMembers[item.id]}
                        onChange={() => handleSelect(item.id)}
                      />
                    </td>
                    <td className="font-medium text-primary">{item.id}</td>
                    <td>{item.name}</td>
                    <td className="text-right">
                      {item.pDagang > 0 ? `Rp ${item.pDagang.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="text-right">
                      {item.pAnggota > 0 ? `Rp ${item.pAnggota.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="text-right">
                      {item.pBarang > 0 ? `Rp ${item.pBarang.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="text-right font-bold text-danger">
                      Rp {item.total.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredList.length > 0 && (
              <tfoot>
                <tr className="bg-primary/5 font-bold">
                  <td colSpan="3" className="text-right">TOTAL KESELURUHAN:</td>
                  <td className="text-right">
                    Rp {filteredList.reduce((s, i) => s + i.pDagang, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="text-right">
                    Rp {filteredList.reduce((s, i) => s + i.pAnggota, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="text-right">
                    Rp {filteredList.reduce((s, i) => s + i.pBarang, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="text-right text-danger">
                    Rp {filteredList.reduce((s, i) => s + i.total, 0).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
