# Deploying Winterwork

Everything ships as one container: the API and the built client are served
from a single origin, with SQLite on a mounted disk.

Before you start you need three things that are yours, not the code's:

1. **A host account** (Fly.io below, or any Docker host).
2. **An SMTP provider** — Resend, Postmark, SES, Mailgun, Fastmail, anything
   with SMTP credentials. Without it the server refuses to boot, because a
   password reset nobody receives locks people out of their accounts.
3. **A domain** (optional on Fly — you get `<app>.fly.dev` free).
4. **Operator details for the legal pages** — who runs the service, where they
   are established, and an email that answers privacy mail. The Privacy Policy
   and Terms name these, so the client build refuses to run without them.

Generate the session secret once and keep it:

```bash
openssl rand -hex 32
```

Changing it later signs everyone out; it is not a rotating value.

---

## Option A — Fly.io (recommended for SQLite)

```bash
cd app

# 1. Install and log in
curl -L https://fly.io/install.sh | sh
fly auth login

# 2. Claim an app name. Edit `app = ` in fly.toml to match.
fly apps create winterwork          # pick your own name

# 3. Persistent disk for SQLite — same name as [mounts].source
fly volumes create winterwork_data --size 1 --region fra

# 4. Operator details for the legal pages. These are baked into the client
#    bundle and are public, so they live in fly.toml rather than in secrets —
#    edit [build.args] there, replacing every UNSET:
#      VITE_LEGAL_OPERATOR_NAME     = "ИП Иванов И. И."
#      VITE_LEGAL_OPERATOR_LOCATION = "Serbia"
#      VITE_LEGAL_CONTACT_EMAIL     = "privacy@yourdomain.com"

# 5. Secrets (never in fly.toml — that file is committed)
fly secrets set \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  APP_URL="https://winterwork.fly.dev" \
  SMTP_HOST="smtp.resend.com" \
  SMTP_PORT="587" \
  SMTP_USER="resend" \
  SMTP_PASS="your-smtp-password" \
  MAIL_FROM="Winterwork <no-reply@yourdomain.com>"

# 6. Ship it
fly deploy
```

`APP_URL` must be the real public URL — password reset and unsubscribe links
are built from it.

**Do not `fly scale count 2`.** SQLite is single-writer on one disk, and the
reminder scheduler runs in-process; a second machine would corrupt writes and
double-send reminders. Scaling out means moving to Postgres first.

Custom domain:

```bash
fly certs add winterwork.yourdomain.com
# then point a CNAME at <app>.fly.dev, and update APP_URL:
fly secrets set APP_URL="https://winterwork.yourdomain.com"
```

---

## Option B — any Docker host (VPS, Hetzner, DigitalOcean…)

```bash
cd app
cp .env.example .env      # fill in SESSION_SECRET, APP_URL, SMTP_*
docker compose up -d --build
```

The app listens on 8787. Put a TLS-terminating reverse proxy in front —
session cookies are `Secure`, so **the app will not log anyone in over plain
HTTP**. The proxy must forward `X-Forwarded-Proto`; `trust proxy` is already
on in production so rate limiting keys on the real client IP.

Minimal nginx:

```nginx
server {
  listen 443 ssl http2;
  server_name winterwork.yourdomain.com;

  ssl_certificate     /etc/letsencrypt/live/winterwork.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/winterwork.yourdomain.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;   # required
  }
}
```

---

## After the first deploy

Check it came up:

```bash
curl https://your-url/api/health          # {"ok":true}
```

Make yourself an admin — sign up in the browser first, then:

```bash
# Fly
fly ssh console -C "node dist/scripts/grant-admin.js you@example.com"
# Docker
docker compose exec winterwork node dist/scripts/grant-admin.js you@example.com
```

Verify email actually works, since a broken SMTP config is silent until
someone needs it: use *Forgot password* on the sign-in screen and confirm the
message arrives. If it doesn't, check the logs (`fly logs` /
`docker compose logs -f`) — send failures are logged, not swallowed.

## Backups

The app takes its own snapshots: one at boot and then every
`BACKUP_INTERVAL_HOURS` (default 24), keeping the newest `BACKUP_KEEP`
(default 7) in `backups/` beside the database. Each one is written with
SQLite's backup API and checkpointed into a single self-contained file, so
restoring is a copy.

```bash
fly ssh console -C "ls -la /data/backups"     # what exists
fly logs | grep '"msg":"backup"'              # confirm it is running
```

Restore:

```bash
fly ssh console
  cp /data/backups/winterwork-<stamp>.db /data/winterwork.db
  exit
fly apps restart winterwork
```

**These snapshots live on the same volume as the database.** They cover a bad
migration, a mistaken delete, or corruption — not losing the volume. Pull a
copy off the box on a schedule:

```bash
fly ssh sftp get /data/backups/winterwork-<stamp>.db ./winterwork-$(date +%F).db
```

Turn the scheduler off with `BACKUPS_ENABLED=false` if you back up another way.

## Logs and errors

Production logs one JSON object per line on stdout. Health checks are dropped;
nothing user-entered is logged, and users appear by id, never by email.

```bash
fly logs                                    # everything
fly logs | grep '"level":"error"'           # only failures
fly logs | grep '"status":5'                # only 5xx responses
```

Every response carries an `X-Request-Id`, and a 500 returns the same id in its
body — so a user reporting "it broke" can quote one string that finds the exact
request in the log.

To send errors to Sentry or similar, call `setErrorReporter()` from
`src/index.ts`. There is no vendor SDK in the tree; the seam is deliberate.

## Updating

```bash
fly deploy                        # or: docker compose up -d --build
```

Schema migrations run automatically at boot (additive columns only, so a
rollback stays readable). `SIGTERM` drains in-flight requests and closes the
database cleanly, so a deploy will not truncate a write.
