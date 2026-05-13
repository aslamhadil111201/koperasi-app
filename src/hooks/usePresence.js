import { useEffect, useState } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';

export const usePresence = (currentUser) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!currentUser || !isSupabaseReady()) {
      setOnlineUsers([]);
      return;
    }

    // Buat channel realtime khusus untuk presence
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUser.username, // Gunakan username sebagai unique key
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Mengubah object state menjadi array of user data
        const users = Object.values(state).map((presenceList) => presenceList[0]);
        
        // Urutkan: diri sendiri di atas, lalu abjad
        users.sort((a, b) => {
          if (a.username === currentUser.username) return -1;
          if (b.username === currentUser.username) return 1;
          return a.name.localeCompare(b.name);
        });

        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Ketika terhubung, broadcast status kita ke semua orang di channel
          await channel.track({
            username: currentUser.username,
            name: currentUser.name,
            role: currentUser.role || 'User',
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  return onlineUsers;
};
