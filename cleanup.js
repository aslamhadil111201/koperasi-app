import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Get URL and Key from .env
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

const namesToDelete = [
  'Ade Sundana', 'Bayu Sutiara', 'Qodratullah', 'Mamad Saepulloh', 
  'Hasan Ahyani', 'Apriadi', 'Adi Supriadi'
].map(n => n.toLowerCase());

async function runCleanup() {
  console.log('Mencari transaksi test untuk dihapus...');
  
  // 1. Cari tx_id dari member_sales_transactions
  const { data: txs, error: txError } = await supabase.from('member_sales_transactions').select('*');
  if (txError) return console.error('Error fetch txs:', txError);

  const txsToDelete = txs.filter(tx => tx.member_name && namesToDelete.includes(tx.member_name.toLowerCase()));
  const txIds = txsToDelete.map(tx => tx.tx_id);

  console.log(`Ditemukan ${txIds.length} transaksi test.`);

  if (txIds.length > 0) {
    // 2. Hapus dari member_sales_transactions
    const { error: delTxError } = await supabase.from('member_sales_transactions').delete().in('tx_id', txIds);
    if (delTxError) console.error('Error delete txs:', delTxError);

    // 3. Hapus dari journal
    const { error: delJournalError } = await supabase.from('journal').delete().in('journal_id', txIds);
    if (delJournalError) console.error('Error delete journal:', delJournalError);
    
    // Juga hapus HPP jika ada (id nya biasanya sama, atau kita bisa hapus yang deskripsinya ada hubungannya, tapi di kode, id nya SAMA: newJournalId)
    console.log('Berhasil menghapus data transaksi dari Supabase.');
  }

  // 4. Reset stok produk ke stok awal (INITIAL_PRODUCTS di useStore)
  console.log('Mengembalikan stok produk awal...');
  const INITIAL_PRODUCTS = [
    { id: 1, name: 'Beras Pandan Wangi 5kg',        stock: 45 },
    { id: 2, name: 'Minyak Goreng Bimoli 2L',       stock: 30 },
    { id: 3, name: 'Gula Pasir 1kg',                stock: 60 },
    { id: 4, name: 'Indomie Goreng (Karton)',       stock: 18 },
    { id: 5, name: 'Sabun Mandi Lifebuoy 3pcs',     stock: 40 },
    { id: 6, name: 'Mesin Cuci Sharp 1 Tabung',     stock: 5  },
    { id: 7, name: 'Kulkas Aqua 1 Pintu',           stock: 4  },
    { id: 8, name: 'Kipas Angin Cosmos',            stock: 10 },
    { id: 9, name: 'Rice Cooker Miyako 1.8L',       stock: 8  },
    { id: 10, name: 'Setrika Philips',              stock: 10 },
    { id: 11, name: 'Kompor Gas Rinnai 2 Tungku',   stock: 6  },
    { id: 12, name: 'Tabung Gas 3kg + Regulator',   stock: 15 },
    { id: 13, name: 'Kasur Busa 120x200cm',         stock: 5  },
    { id: 14, name: 'Lemari Pakaian 2 Pintu',       stock: 3  },
    { id: 15, name: 'TV LED 32 inch',               stock: 4  },
  ];

  for (const p of INITIAL_PRODUCTS) {
    await supabase.from('products').update({ stock: p.stock }).eq('id', p.id);
  }
  console.log('Stok produk berhasil dikembalikan!');
  console.log('SELESAI. Silakan refresh halaman browser Anda.');
}

runCleanup();
