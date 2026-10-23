import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AUTH_STORAGE_KEY, supabase } from '../lib/supabase';
import { closeSession, data, openSession } from '../data/store';
import { startSync, type SyncHandle } from '../data/sync';
import { autoMapSections } from '../data/lt';
import { enrichBacklog } from '../data/enrich';
import { useStore } from '../lib/createStore';
import { Login } from './Login';
import { Shell } from './Shell';
import { setSync } from './syncHandle';

function hasSavedSignIn(): boolean {
  try {
    return !!localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return false;
  }
}

/** Open the local copy, start syncing when signed in, and keep both alive while mounted. */
function useSession(cloud: boolean) {
  useEffect(() => {
    let handle: SyncHandle | null = null;
    let cancelled = false;
    void (async () => {
      await openSession({ cloud, onLocalChange: () => handle?.request() });
      if (cancelled) return;
      if (cloud && supabase) {
        handle = startSync(supabase);
        setSync(handle);
        await handle.firstPull;
      }
      if (cancelled) return;
      // Match sections to existing Daily Log topics by name; only after the first pull, so an
      // offline first launch can't decide anything before the real topics arrive.
      if (!cloud || data.get().sync.status === 'idle') autoMapSections();
      void enrichBacklog();
    })();
    return () => {
      cancelled = true;
      handle?.stop();
      setSync(null);
      closeSession();
    };
  }, [cloud]);
}

function Session({ cloud }: { cloud: boolean }) {
  useSession(cloud);
  const ready = useStore(data, (s) => s.ready);
  if (!ready) return <p className="i-loading">LIFETRACKER · loading…</p>;
  return <Shell />;
}

function AuthGate({ sb }: { sb: SupabaseClient }) {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    void sb.auth.getSession().then(({ data, error }) => setSignedIn(!!data.session || (!!error && hasSavedSignIn())));
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') setSignedIn(false);
      else if (s) setSignedIn(true);
    });
    return () => data.subscription.unsubscribe();
  }, [sb]);
  if (signedIn === undefined) return <p className="i-loading">LIFETRACKER · checking sign-in…</p>;
  if (!signedIn) return <Login sb={sb} />;
  return <Session cloud />;
}

/** Signed in and synced when a Supabase project is configured and allowed; otherwise local to this browser. */
export function App() {
  return supabase ? <AuthGate sb={supabase} /> : <Session cloud={false} />;
}
