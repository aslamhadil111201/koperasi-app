import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) envVars[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON);

async function migrate() {
  console.log('Memulai migrasi data Piutang Ritel/Jasa/Konsinyasi...');
  
  // 1. Ambil semua member_sales_transactions
  const { data: txs, error: txError } = await supabase.from('member_sales_transactions').select('*');
  if (txError) return console.error('Gagal mengambil riwayat transaksi:', txError);

  console.log(`Ditemukan ${txs.length} riwayat transaksi penjualan anggota.`);

  let updatedCount = 0;

  for (const tx of txs) {
    // Kita ingin mengubah ref di Jurnal dari 'BKM-RTL' dll menjadi ID anggota (tx.member_id)
    // Supabase tidak mendungkung update JOIN dengan mudah di REST API biasa, 
    // jadi kita update berdasarkan journal_id = tx.tx_id dan account='Piutang Dagang' atau 'Pendapatan Penjualan Ritel' (semuanya aja sekalian)
    
    // Ambil jurnal terkait
    const { data: journals, error: jError } = await supabase
      .from('journal')
      .select('id, ref')
      .eq('journal_id', tx.tx_id);
      
    if (jError || !journals) continue;
    
    for (const j of journals) {
      if (j.ref && j.ref.startsWith('BKM-')) {
        // Update ref menjadi member_id
        const { error: uError } = await supabase
          .from('journal')
          .update({ ref: tx.member_id })
          .eq('id', j.id);
          
        if (!uError) {
          updatedCount++;
        }
      }
    }
  }

  console.log(`SELESAI. Berhasil memigrasi ${updatedCount} baris jurnal.`);
  console.log('Silakan jalankan ulang aplikasi dan refresh browser.');
}

migrate();
