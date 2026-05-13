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

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkTxs() {
  const ids = ['JU-008', 'JU-012', 'JU-014'];
  const { data, error } = await supabase.from('member_sales_transactions').select('*').in('tx_id', ids);
  
  if (error) {
    console.error(error);
  } else {
    console.log('--- HASIL PENGECEKAN TRANSAKSI ---');
    data.forEach(tx => {
      console.log(`ID Transaksi: ${tx.tx_id} | Nama Anggota: ${tx.member_name} | Tanggal: ${tx.date}`);
    });
    console.log('--- SELESAI ---');
  }
}
checkTxs();
