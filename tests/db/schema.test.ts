/**
 * Runs every migration (Curio Cabinet's, then LifeTracker's) on PGlite and checks who may do what.
 * Schema separation is not access control: these tests are what show the lt_ tables are as closed as the rest.
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..');
const MIGRATIONS = join(ROOT, 'supabase', 'migrations');
const SHARED = '00000000-0000-0000-0000-000000000000';
const MEMBER = '11111111-1111-4111-8111-111111111111';
const STRANGER = '22222222-2222-4222-8222-222222222222';
const LT_TABLES = ['lt_records', 'lt_details', 'lt_events', 'lt_nights', 'lt_day_marks', 'lt_prefs', 'lt_bucket'];
const ANYSTOP_TABLES = ['rooms', 'items', 'connections', 'settings', 'log_topics', 'log_entries', 'log_goals', 'log_metrics', 'todos'];

let pg: PGlite;
const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
const ltMigration = files.find((f) => f.includes('lifetracker_core'))!;

type Who = { role: 'anon' } | { role: 'authenticated'; sub: string };

/** Run statements as a Supabase client would: inside a transaction, with the role and JWT claims set. */
async function as<T = Record<string, unknown>>(who: Who, sql: string, params: unknown[] = []): Promise<T[]> {
  return pg.transaction(async (tx) => {
    await tx.exec(`set local role ${who.role}`);
    const claims = who.role === 'authenticated' ? JSON.stringify({ sub: who.sub, role: 'authenticated' }) : '';
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [claims]);
    const res = await tx.query<T>(sql, params);
    return res.rows;
  });
}
const member: Who = { role: 'authenticated', sub: MEMBER };
const stranger: Who = { role: 'authenticated', sub: STRANGER };
const anon: Who = { role: 'anon' };

async function columns(): Promise<string[]> {
  const r = await pg.query<{ c: string }>(
    `select table_name || '.' || column_name || ':' || data_type || ':' || is_nullable as c
       from information_schema.columns where table_schema = 'public' order by 1`,
  );
  return r.rows.map((x) => x.c);
}
async function policies(): Promise<string[]> {
  const r = await pg.query<{ p: string }>(`select tablename || ':' || policyname || ':' || cmd || ':' || coalesce(qual, '') || ':' || coalesce(with_check, '') as p from pg_policies order by 1`);
  return r.rows.map((x) => x.p);
}

let before: { cols: string[]; pols: string[] };

beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(readFileSync(join(__dirname, 'supabase-stub.sql'), 'utf8'));
  for (const f of files) {
    if (f === ltMigration) before = { cols: await columns(), pols: await policies() };
    await pg.exec(readFileSync(join(MIGRATIONS, f), 'utf8'));
  }
  // What setup-login does with the service role: the one member, plus a stray auth user who isn't one.
  await pg.query(`insert into auth.users (id, email) values ($1, 'me@any-stop.vercel.app'), ($2, 'stray@any-stop.vercel.app')`, [MEMBER, STRANGER]);
  await pg.query(`insert into public.members (user_id, username) values ($1, 'member')`, [MEMBER]);
}, 60_000);

afterAll(async () => {
  await pg?.close();
});

describe('the LifeTracker migration', () => {
  it('only adds: Curio Cabinet tables keep every column and policy, todos gains one nullable column', async () => {
    const after = await columns();
    const added = after.filter((c) => !before.cols.includes(c));
    expect(before.cols.filter((c) => !after.includes(c))).toEqual([]);
    expect(added.filter((c) => !c.startsWith('lt_'))).toEqual(['todos.section:text:YES']);
    const pols = await policies();
    expect(before.pols.filter((p) => !pols.includes(p))).toEqual([]);
  });

  it('turns row-level security on for every lt_ table', async () => {
    const r = await pg.query<{ relname: string; relrowsecurity: boolean }>(
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relname like 'lt\\_%' and relkind = 'r'`,
    );
    expect(r.rows.map((x) => x.relname).sort()).toEqual([...LT_TABLES].sort());
    expect(r.rows.every((x) => x.relrowsecurity)).toBe(true);
  });

  it('publishes the lt_ tables for realtime', async () => {
    const r = await pg.query<{ tablename: string }>(`select tablename from pg_publication_tables where pubname = 'supabase_realtime'`);
    for (const t of LT_TABLES) expect(r.rows.map((x) => x.tablename)).toContain(t);
  });
});

describe('access', () => {
  it('gives the publishable key nothing except the setup question', async () => {
    for (const t of [...ANYSTOP_TABLES, ...LT_TABLES]) {
      await expect(as(anon, `select * from public.${t}`)).rejects.toThrow(/permission denied/);
    }
    const [r] = await as<{ needed: boolean }>(anon, `select public.login_setup_needed() as needed`);
    expect(r.needed).toBe(false);
  });

  it('gives a signed-in user who is not the member no rows and no writes', async () => {
    await pg.query(`insert into public.lt_prefs (id, value) values ('targets', '{"violin": 240}')`);
    for (const t of LT_TABLES) expect(await as(stranger, `select * from public.${t}`)).toEqual([]);
    await expect(
      as(stranger, `insert into public.lt_records (id, section, kind) values (gen_random_uuid(), 'violin', 'piece')`),
    ).rejects.toThrow(/row-level security/);
    await expect(as(stranger, `insert into public.lt_prefs (id, value) values ('x', '1')`)).rejects.toThrow(/row-level security/);
    const updated = await as(stranger, `update public.lt_prefs set value = '0' where id = 'targets' returning id`);
    expect(updated).toEqual([]);
    const deleted = await as(stranger, `delete from public.lt_prefs where id = 'targets' returning id`);
    expect(deleted).toEqual([]);
  });

  it('lets the member create, read, change and delete LifeTracker rows', async () => {
    const id = crypto.randomUUID();
    await as(member, `insert into public.lt_records (id, section, kind, data) values ($1, 'violin', 'piece', '{"title": "Bruch"}')`, [id]);
    const [row] = await as<{ owner_id: string; data: { title: string } }>(member, `select owner_id, data from public.lt_records where id = $1`, [id]);
    expect(row.owner_id).toBe(SHARED);
    expect(row.data.title).toBe('Bruch');
    await as(member, `update public.lt_records set data = '{"title": "Bach"}' where id = $1`, [id]);
    await as(member, `delete from public.lt_records where id = $1`, [id]);
    expect(await as(member, `select 1 from public.lt_records where id = $1`, [id])).toEqual([]);
  });

  it('lets the member keep a bucket list', async () => {
    const id = crypto.randomUUID();
    await as(member, `insert into public.lt_bucket (id, title) values ($1, 'See the northern lights')`, [id]);
    await as(member, `update public.lt_bucket set done_at = now(), data = '{"rarity": "legendary"}' where id = $1`, [id]);
    const [b] = await as<{ owner_id: string; done: boolean }>(member, `select owner_id, done_at is not null as done from public.lt_bucket where id = $1`, [id]);
    expect(b).toEqual({ owner_id: SHARED, done: true });
    expect(await as(stranger, `select 1 from public.lt_bucket`)).toEqual([]);
    await expect(as(member, `insert into public.lt_bucket (id, title) values (gen_random_uuid(), '   ')`)).rejects.toThrow(/check/);
  });

  it("refuses rows the member tries to file under another owner", async () => {
    await expect(
      as(member, `insert into public.lt_events (id, owner_id, title, date) values (gen_random_uuid(), $1, 'x', '2026-10-24')`, [MEMBER]),
    ).rejects.toThrow(/row-level security/);
  });

  it('lets the member tag a task with a section', async () => {
    const id = crypto.randomUUID();
    await as(member, `insert into public.todos (id, title, section) values ($1, 'FM sheet 6', 'study')`, [id]);
    const [t] = await as<{ section: string }>(member, `select section from public.todos where id = $1`, [id]);
    expect(t.section).toBe('study');
  });
});

describe('shared rows stay intact', () => {
  it("keeps a task's section when Curio Cabinet (which doesn't know the column) saves the task", async () => {
    const id = crypto.randomUUID();
    await as(member, `insert into public.todos (id, title, priority, section) values ($1, 'Pack bag', 'low', 'gym')`, [id]);
    // PostgREST upsert of only the columns Curio sends: on conflict it updates just those.
    await as(
      member,
      `insert into public.todos (id, title, priority, due, done_at, created_at, updated_at, deleted_at)
         values ($1, 'Pack gym bag', 'low', null, now(), now(), now(), null)
       on conflict (id) do update set title = excluded.title, priority = excluded.priority, due = excluded.due, done_at = excluded.done_at, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at`,
      [id],
    );
    const [t] = await as<{ title: string; section: string }>(member, `select title, section from public.todos where id = $1`, [id]);
    expect(t).toEqual({ title: 'Pack gym bag', section: 'gym' });
  });
});

describe('shapes', () => {
  it('checks times, sections and kinds', async () => {
    await expect(as(member, `insert into public.lt_events (id, title, date, start) values (gen_random_uuid(), 'x', '2026-10-24', '25:00')`)).rejects.toThrow(/check/);
    await expect(as(member, `insert into public.lt_details (id, section) values (gen_random_uuid(), 'sleep')`)).rejects.toThrow(/check/);
    await expect(as(member, `insert into public.todos (id, title, section) values (gen_random_uuid(), 'x', 'nope')`)).rejects.toThrow(/check/);
    await expect(as(member, `insert into public.lt_records (id, section, kind) values (gen_random_uuid(), 'violin', 'Bad Kind')`)).rejects.toThrow(/check/);
    await expect(as(member, `insert into public.lt_prefs (id, value) values ('Has Spaces', '1')`)).rejects.toThrow(/check/);
  });

  it('takes the Future section in every table that has a section, and still refuses unknown ones', async () => {
    await as(member, `insert into public.lt_records (id, section, kind, data) values (gen_random_uuid(), 'future', 'uni', '{"name": "MIT"}')`);
    await as(member, `insert into public.lt_details (id, section) values (gen_random_uuid(), 'future')`);
    await as(member, `insert into public.lt_events (id, title, date, section, kind) values (gen_random_uuid(), 'MIT early action', '2027-11-01', 'future', 'other')`);
    await as(member, `insert into public.todos (id, title, section) values (gen_random_uuid(), 'Book the SAT', 'future')`);
    await expect(as(member, `insert into public.lt_records (id, section, kind) values (gen_random_uuid(), 'past', 'uni')`)).rejects.toThrow(/check/);
    await expect(as(member, `insert into public.lt_details (id, section) values (gen_random_uuid(), 'screen')`)).rejects.toThrow(/check/);
  });

  it('keeps one night and one rest mark per day', async () => {
    await as(member, `insert into public.lt_nights (id, date, bed, wake) values (gen_random_uuid(), '2026-10-24', '23:15', '08:00')`);
    await expect(as(member, `insert into public.lt_nights (id, date) values (gen_random_uuid(), '2026-10-24')`)).rejects.toThrow(/duplicate key/);
    await as(member, `insert into public.lt_day_marks (id, date, kind) values (gen_random_uuid(), '2026-10-24', 'rest')`);
    await expect(as(member, `insert into public.lt_day_marks (id, date, kind) values (gen_random_uuid(), '2026-10-24', 'rest')`)).rejects.toThrow(/duplicate key/);
  });

  it('stamps updated_at on change, which the sync cursor relies on', async () => {
    const id = crypto.randomUUID();
    await as(member, `insert into public.lt_events (id, title, date, updated_at) values ($1, 'x', '2026-10-24', '2000-01-01')`, [id]);
    const [r] = await as<{ y: number }>(member, `select extract(year from updated_at)::int as y from public.lt_events where id = $1`, [id]);
    expect(r.y).toBeGreaterThan(2000);
  });
});
