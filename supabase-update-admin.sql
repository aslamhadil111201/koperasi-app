-- Jalankan di Supabase SQL Editor untuk update kredensial admin
-- Update username dan password akun admin
UPDATE users
SET username = 'aslamhadilmatin',
    password = 'Aslam_040700'
WHERE username = 'admin';

-- Verifikasi
SELECT id, username, name, role FROM users ORDER BY id;
