import { useEffect, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { usernameEmail } from '../features/auth/username';
import { Drone } from '../ui/i/Drone';

/**
 * Sign in with the Curio Cabinet login (same Supabase project, same single member). LifeTracker
 * never creates a login: if none exists yet, it says so instead of offering setup.
 */
export function Login({ sb }: { sb: SupabaseClient }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noLogin, setNoLogin] = useState(false);

  useEffect(() => {
    void sb.rpc('login_setup_needed').then(({ data, error }) => setNoLogin(!error && data === true));
  }, [sb]);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithPassword({ email: usernameEmail(username), password });
    setBusy(false);
    if (!error) return;
    if (error.message === 'Invalid login credentials') setError("That username and password don't match.");
    else if (!navigator.onLine) setError("You're offline. Signing in needs the internet the first time on a device.");
    else setError(error.message);
  }

  return (
    <main className="i-main" style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', paddingBottom: 24 }}>
      <form className="i-pnl i-stack" style={{ width: 'min(380px, 100%)', padding: 20 }} onSubmit={signIn}>
        <div style={{ width: 110, margin: '0 auto' }}>
          <Drone stage={1} />
        </div>
        <p className="i-lab" style={{ textAlign: 'center' }}>
          LifeTracker · members only
        </p>
        {noLogin ? (
          <p className="i-note">This database has no login yet. Set it up once in Curio Cabinet, then sign in here with the same username and password.</p>
        ) : (
          <>
            <label className="i-field">
              <span className="i-lab">Username</span>
              <input className="i-input" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
            </label>
            <label className="i-field">
              <span className="i-lab">Password</span>
              <input className="i-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && (
              <p className="i-error" role="alert">
                {error}
              </p>
            )}
            <button className="i-btn i-btn--sig i-btn--block" disabled={busy || !username.trim() || !password}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
            <p className="i-note">Same login as Curio Cabinet.</p>
          </>
        )}
      </form>
    </main>
  );
}
