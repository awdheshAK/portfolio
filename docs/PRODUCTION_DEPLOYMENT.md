# Production Deployment Guide

This covers deploying the Custom Clothing Platform to a real server, **after**
you've run it locally end-to-end via
[LOCAL_SETUP.md](./LOCAL_SETUP.md) and worked through
[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md). Don't deploy something you
haven't tested locally first.

Two paths are covered: **Docker Compose** (simplest, recommended for a
single VPS) and **manual install** (more control, more steps). Pick one —
don't mix them on the same server.

Both assume a fresh Ubuntu 22.04+ VPS with a domain name pointed at it (an A
record for your domain → the server's IP) and root or sudo SSH access.

---

## Before you deploy: things to change from local defaults

- [ ] Change the seeded admin password (`admin@example.com` /
      `ChangeMe123!`) immediately — either via the admin UI's account
      settings once live, or `php artisan tinker` on the server.
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false` in `backend/.env` —
      `APP_DEBUG=true` in production leaks stack traces to anyone.
- [ ] Generate a fresh `APP_KEY` for production (`php artisan key:generate`
      on the server) — don't reuse your local one.
- [ ] Use strong, unique `DB_PASSWORD` and `REDIS_PASSWORD` values.
- [ ] Use **live** Razorpay keys only once you've fully tested with test
      keys — never mix live keys into a local `.env`.
- [ ] Update `APP_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and
      `SANCTUM_STATEFUL_DOMAINS` in `backend/.env`, and
      `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_APP_URL` in `frontend/.env.local`,
      to your real domains (`https://api.yourdomain.com`,
      `https://yourdomain.com`, etc.) — not `localhost`.
- [ ] Never commit or upload your production `.env` files anywhere.

---

## Option A: Docker Compose (recommended)

1. **Install Docker.**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER    # log out and back in after this
   ```

2. **Get the code onto the server** (upload the extracted project folder via
   `scp`/`rsync`, or `git clone` if you've pushed it to a repository).

3. **Configure environment files** on the server:
   ```bash
   cd custom-clothing-platform
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
   Edit all three with production values per the checklist above. In the
   root `.env`, set `DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` (these seed the
   `postgres` container) and the `NEXT_PUBLIC_*` build args (baked into the
   frontend at build time — see `docker/frontend.Dockerfile`).

4. **Build and start everything:**
   ```bash
   docker compose up -d --build
   ```
   This starts Postgres, Redis, the Laravel backend behind nginx, a queue
   worker, a scheduler loop, and the Next.js frontend — see
   `docker-compose.yml` for the full service list.

5. **Run migrations** (not seeders — don't seed demo products onto a real
   store):
   ```bash
   docker compose exec backend php artisan migrate --force
   ```
   If you *do* want the demo catalog as a starting point, you may seed once
   deliberately: `docker compose exec backend php artisan db:seed`.

6. **Verify:**
   ```bash
   curl http://localhost:8000/api/v1/categories   # backend, via the backend_nginx container
   curl http://localhost:3000                     # frontend
   ```

7. **Put a reverse proxy with TLS in front of it** (see the shared Nginx +
   SSL section below) — the containers above listen on plain HTTP on
   `localhost`, they are not meant to be exposed directly to the internet.

8. **Updating later:** pull/upload new code, then
   ```bash
   docker compose up -d --build
   docker compose exec backend php artisan migrate --force
   ```

---

## Option B: Manual install (Nginx + PHP-FPM + PostgreSQL + Redis + Node)

### 1. Install system packages

```bash
sudo apt update
sudo apt install -y nginx postgresql redis-server git unzip curl \
  php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring php8.3-xml \
  php8.3-curl php8.3-zip php8.3-bcmath php8.3-gd

curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. PostgreSQL database

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE custom_clothing_platform;
CREATE USER ccp_user WITH PASSWORD 'a-strong-production-password';
GRANT ALL PRIVILEGES ON DATABASE custom_clothing_platform TO ccp_user;
\c custom_clothing_platform
GRANT ALL ON SCHEMA public TO ccp_user;
\q
```

### 3. Get the code onto the server

```bash
sudo mkdir -p /var/www/custom-clothing-platform
sudo chown $USER:$USER /var/www/custom-clothing-platform
# upload/clone the project into this folder
cd /var/www/custom-clothing-platform
```

### 4. Backend

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
# edit .env: production DB/Redis/Razorpay/Cloudinary/mail values, APP_ENV=production, APP_DEBUG=false
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan storage:link

sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 5. PHP-FPM + Nginx for the backend

Point PHP-FPM's pool at the backend's `public/` directory. A minimal Nginx
server block (adapt `server_name` and the `fastcgi_pass` socket path to your
PHP-FPM version):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/custom-clothing-platform/backend/public;
    index index.php;

    client_max_body_size 20m;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Save as `/etc/nginx/sites-available/ccp-backend`, then:
```bash
sudo ln -s /etc/nginx/sites-available/ccp-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Queue worker (systemd)

Background jobs (currently: sending the password-reset email) need a
persistent worker, not a one-off command. Create
`/etc/systemd/system/ccp-queue.service`:

```ini
[Unit]
Description=Custom Clothing Platform queue worker
After=network.target redis-server.service postgresql.service

[Service]
User=www-data
WorkingDirectory=/var/www/custom-clothing-platform/backend
ExecStart=/usr/bin/php artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ccp-queue
```

### 7. Scheduler (cron)

Even though this project doesn't currently schedule recurring jobs beyond
the queue, add Laravel's scheduler now so any added later just works:

```bash
crontab -e -u www-data
```
Add:
```
* * * * * cd /var/www/custom-clothing-platform/backend && php artisan schedule:run >> /dev/null 2>&1
```

### 8. Frontend

```bash
cd /var/www/custom-clothing-platform/frontend
cp .env.example .env.local
# edit .env.local: NEXT_PUBLIC_API_URL=https://api.yourdomain.com, etc.
npm ci
npm run build
```

Run it under a process manager (PM2 shown; systemd works equally well):
```bash
sudo npm install -g pm2
pm2 start npm --name ccp-frontend -- start
pm2 save
pm2 startup   # follow the printed instructions to enable on boot
```

Nginx server block for the frontend (`/etc/nginx/sites-available/ccp-frontend`):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/ccp-frontend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 9. Redis

`sudo systemctl enable --now redis-server` — set a password in
`/etc/redis/redis.conf` (`requirepass ...`) for anything beyond a
single-server setup where Redis isn't otherwise firewalled off, and match it
in `backend/.env`'s `REDIS_PASSWORD`.

---

## SSL (both options)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Certbot edits your Nginx configs to redirect HTTP → HTTPS and auto-renews
via a systemd timer it installs — no extra cron needed.

---

## Updating later (manual install)

```bash
cd /var/www/custom-clothing-platform
git pull   # or re-upload changed files

cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache
sudo systemctl restart ccp-queue

cd ../frontend
npm ci
npm run build
pm2 restart ccp-frontend
```

---

## Backups

- **Database:** schedule a nightly `pg_dump`:
  ```bash
  pg_dump -U ccp_user custom_clothing_platform | gzip > /backups/ccp-$(date +%F).sql.gz
  ```
  Store dumps off-server (S3, another host, etc.) — a backup on the same
  disk as the database doesn't protect you from disk failure.
- **Uploaded assets** (logos, design uploads) live in Cloudinary, which has
  its own retention/backup story — don't assume the database backup covers
  them.
- **`.env` files:** keep a secure, encrypted copy of your production
  `backend/.env` and `frontend/.env.local` somewhere other than the server
  itself, so a lost server doesn't also mean lost credentials/config.

## Monitoring the basics

- `docker compose logs -f` (Option A) or `journalctl -u ccp-queue -f` /
  `pm2 logs ccp-frontend` (Option B) for live logs.
- Laravel's own log: `backend/storage/logs/laravel.log`.
- Watch for the queue worker actually running — if it dies and isn't
  restarted, password-reset emails silently stop sending.
