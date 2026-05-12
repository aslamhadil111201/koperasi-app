import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🔄 Memulai proses pengurutan ID Anggota...');

  // 1. Fetch all members
  const { data: members, error: errMembers } = await supabase.from('members').select('*');
  if (errMembers) {
    console.error('Gagal mengambil data members:', errMembers);
    return;
  }

  // Sort members logically by their original ID suffix
  const sortedMembers = members.sort((a, b) => {
    const numA = parseInt(a.member_id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.member_id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  console.log(`Ditemukan ${sortedMembers.length} anggota. Memproses pembaruan...`);

  // We will iterate and assign new IDs 001, 002, etc.
  for (let i = 0; i < sortedMembers.length; i++) {
    const member = sortedMembers[i];
    const oldId = member.member_id;
    const newId = `KPKCG-${String(i + 1).padStart(3, '0')}`;

    if (oldId === newId) {
      console.log(`✅ [${i+1}/${sortedMembers.length}] ${member.name} sudah menggunakan ID ${newId}`);
      continue;
    }

    console.log(`⏳ [${i+1}/${sortedMembers.length}] Mengubah ${member.name} (${oldId} -> ${newId})...`);

    // We must update the ID in all related tables!
    
    // Update cash_loans
    await supabase.from('cash_loans').update({ member_id: newId }).eq('member_id', oldId);
    
    // Update credit_goods
    await supabase.from('credit_goods').update({ member_id: newId }).eq('member_id', oldId);
    
    // Update member_sales_transactions
    await supabase.from('member_sales_transactions').update({ member_id: newId }).eq('member_id', oldId);
    
    // Update journal (where ref = oldId)
    await supabase.from('journal').update({ ref: newId }).eq('ref', oldId);
    
    // Update members
    const { error: updateErr } = await supabase.from('members').update({ member_id: newId }).eq('member_id', oldId);
    if (updateErr) {
      console.error(`❌ Gagal memperbarui ID untuk ${oldId}:`, updateErr.message);
    }
  }

  console.log('\n🎉 Selesai! Semua ID anggota sudah berurutan dari KPKCG-001 ke atas.');
  console.log('Silakan REFRESH aplikasi di browser Anda (CTRL+R) untuk melihat perubahannya!');
}

migrate();
