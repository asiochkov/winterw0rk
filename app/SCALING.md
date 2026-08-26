# Scaling Winterwork

Where the current shape stops working, and what to change when it does. This
is deliberately ordered by when you will hit each wall, not by how interesting
the work is.

## What the current shape is

One container. Node serves both the API and the built client from one origin.
SQLite lives on a mounted disk in WAL mode. Background jobs — the reminder
sweep and the backup — run in the same process, each behind a DB-backed lock
with an expiry.

That is a single machine on purpose. It is also genuinely capable: SQLite in
WAL mode handles concurrent readers with one writer, every hot query path is
indexed, and the workload here is small reads and small writes by one user at
a time. A shared-cpu-1x machine with 512 MB serves this comfortably into the
low thousands of daily users.

## Wall 1 — one machine (the hard one)

**Symptom:** you want a second instance, for redundancy or for load.

You cannot run two. SQLite is single-writer on one disk; two machines with two
copies diverge, and Fly volumes are not shared. `fly scale count 2` corrupts
data. The scheduler locks make a multi-instance deploy *safe* in the sense
that jobs will not double-run, but they do not make the database shareable.

**Fix:** move to Postgres. The schema is plain SQL with no SQLite-specific
types; the work is in `db.ts` and the query call sites, which use
`prepare().get()/.all()/.run()` throughout. Budget a focused day, plus a
migration of existing rows. After that, `min_machines_running` can go up and
the scheduler locks start earning their keep.

Do this when you need uptime guarantees, not when you need throughput. One
machine has more headroom than most people expect.

## Wall 2 — vertical limits

**Symptom:** response times creep up, memory pressure in `fly status`.

**Fix, in order:**

1. `fly scale vm shared-cpu-2x --memory 1024` — cheapest real win.
2. Check the logs for slow routes: `fly logs | grep '"ms":[0-9]\{3,\}'`
   finds anything over 100 ms. Every route that matters is indexed, so a slow
   one is usually a new query that is not.
3. `PRAGMA optimize` / `ANALYZE` after the table sizes have changed a lot.

## Wall 3 — disk

**Symptom:** the volume fills. GPS track points dominate: a route stores one
row per sample, so an hour of running is a few thousand rows.

**Fix:** `fly volumes extend <id> --size 5` is a one-liner and buys years at
this scale. Beyond that, downsample old track points — full resolution for
recent activities, thinned for anything older than a year. Nobody scrubs a
two-year-old run at one-second resolution.

Watch it before it bites: `fly ssh console -C "df -h /data"`.

## Wall 4 — email

**Symptom:** reminders start landing in spam, or the provider rate-limits.

The sweep sends serially inside one tick, which is fine for hundreds of users
and not for tens of thousands. Before that matters:

- Set up SPF, DKIM and DMARC for the sending domain. This is the single
  biggest deliverability factor and costs an afternoon.
- Keep the unsubscribe link working — it is already one click, no login.
- Batch the sends, or hand them to the provider's bulk API, once a sweep takes
  longer than a few minutes.

## Wall 5 — backups that survive the host

The built-in snapshots sit on the same volume as the database. That covers the
failures you will actually have; it does not cover losing the volume or the
account.

**Fix:** copy snapshots off-box on a schedule — any object store, any
retention. Fifteen minutes of work, and it is the difference between an
incident and an ending. See the Backups section of DEPLOY.md.

## What not to do early

- **Don't add Redis.** Sessions are signed cookies; nothing needs a cache.
- **Don't add a queue.** Two periodic jobs behind a lock is not a queue
  problem.
- **Don't split into services.** The whole API is one process for a reason,
  and a network hop between parts of it buys nothing at this size.
- **Don't add an APM vendor before there is traffic to look at.** The JSON
  request log answers "what is slow" and "what is failing" already;
  `setErrorReporter()` is there for when it stops being enough.
