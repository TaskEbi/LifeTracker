# Backups

The Supabase project has no backups of its own (free plan: `supabase backups list` shows none, and point-in-time recovery is off). So `.github/workflows/backup.yml` makes one **every hour**:

- It dumps the whole `public` schema (LifeTracker's `lt_` tables and Curio Cabinet's), schema and data, with `pg_dump` 17 in custom format.
- It encrypts the dump with AES-256 (`gpg --symmetric`) using the `BACKUP_PASSPHRASE` secret. The repository is public, so only the encrypted file is kept and nothing from the database is printed in the logs.
- The file is kept as a workflow artifact for **3 days**; GitHub then deletes it. That is about 72 backups at any time.
- It only reads. It never writes to the database.
- Not included: photo and video files in Storage (`photos`, `lt-videos`) and auth accounts. Rows that point at photos are included.

## Setting it up (once)

On GitHub: the repository → **Settings → Secrets and variables → Actions → New repository secret**. Add two secrets:

1. **`SUPABASE_DB_URL`**: Supabase dashboard → the project → **Connect** → **Session pooler** (not "Direct connection": GitHub's machines can't reach the direct address). Copy the URI and put the database password in place of `[YOUR-PASSWORD]`. It looks like `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`.
2. **`BACKUP_PASSPHRASE`**: a long random passphrase. **Keep a copy in your password manager.** Without it the backups can't be opened, and nobody can recover it.

Then **Actions → Database backup → Run workflow** to make the first backup now, and check that it goes green and shows an artifact. Until both secrets are set, each run just warns "Backups aren't set up yet". If a run fails, GitHub emails you.

## Getting something back

1. **Actions → Database backup** → pick the run from before the problem → download its `db-…` artifact (a zip) and unzip it.
2. Decrypt: `gpg --decrypt lifetracker-<time>.dump.gpg > db.dump` (it asks for the passphrase).
3. Look inside without touching anything: `pg_restore --list db.dump`, or load it into a scratch local database (for example `docker run -d -e POSTGRES_PASSWORD=x -p 5433:5432 postgres:17`, then `pg_restore --no-owner -d postgresql://postgres:x@localhost:5433/postgres db.dump`) and query the rows you need.
4. Put back only the rows that were lost (for a game save, the one `lt_records` row), through the app or with a reviewed SQL statement. **Never restore the whole dump over the live database**: it would undo everything written since. A restore to production is a release step that needs your review (AGENTS.md).
