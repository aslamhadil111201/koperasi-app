import { createClient } from '@supabase/supabase-js';

const VITE_SUPABASE_URL = 'https://pzohbrjifoiafxjxlyss.supabase.co';
const VITE_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6b2hicmppZm9pYWZ4anhseXNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzUwNDAsImV4cCI6MjA5NDAxMTA0MH0.jFFzwfN66qXe8iI5QLcr2TF7APkJoMuzn6n8oQ3CZ08';

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON);

async function main() {
  console.log('Menghapus semua entri jurnal...');
  const { error: err1 } = await supabase.from('journal').delete().neq('journal_id', 'DO_NOT_DELETE'); 
  if (err1) console.error('Error saat menghapus jurnal:', err1);
  else console.log('Jurnal berhasil dihapus!');

  console.log('Menghapus kredit HP Iphone 11...');
  const { error: err2 } = await supabase.from('credit_goods').delete().eq('credit_id', 'KRD-001');
  if (err2) console.error('Error saat menghapus kredit HP:', err2);
  else console.log('Kredit HP Iphone 11 berhasil dihapus!');
  
  console.log('\nSelesai! Silakan refresh browser Anda, lalu klik "Clear Application Data" di browser (atau logout/login) jika data belum terhapus untuk menghapus cache lokal.');
  process.exit(0);
}

main();
