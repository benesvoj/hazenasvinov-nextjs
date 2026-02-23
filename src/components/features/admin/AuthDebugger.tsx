'use client';

import React, {useEffect, useState} from 'react';

import {useSupabaseClient, useUserRoles} from '@/hooks';

export default function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const {hasRole} = useUserRoles();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const debugAuth = async () => {
      try {
        // Get current user
        const {
          data: {user},
          error: userError,
        } = await supabase.auth.getUser();

        // Check user roles
        let isCoach = false;
        let isAdmin = false;
        let roleError = null;

        if (user) {
          try {
            isCoach = await hasRole('coach');
            isAdmin = await hasRole('admin');
          } catch (err) {
            roleError = err;
          }
        }

        // Try to fetch user profiles directly
        let userProfiles = null;
        let profileError = null;

        if (user) {
          try {
            const {data, error} = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', user.id);

            userProfiles = data;
            profileError = error;
          } catch (err) {
            profileError = err;
          }
        }

        setDebugInfo({
          user: user
            ? {
                id: user.id,
                email: user.email,
                created_at: user.created_at,
              }
            : null,
          userError,
          isCoach,
          isAdmin,
          roleError,
          userProfiles,
          profileError,
          environment: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
          },
        });
      } catch (err) {
        setDebugInfo({error: err});
      } finally {
        setLoading(false);
      }
    };

    debugAuth();
  }, [hasRole, supabase]);

  if (loading) {
    return <div>Loading debug info...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
}
