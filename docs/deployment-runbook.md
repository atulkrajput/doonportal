# Deployment Runbook

> Status: development only. No staging or production environment exists yet.

## Local development (Windows / XAMPP)

Requirements: PHP 8.2+ with `pdo_mysql`, `pdo_sqlite`, `intl`, `mbstring`; Composer; Node 22; MySQL/MariaDB (XAMPP).

```bash
composer install
npm install
cp .env.example .env        # then set DB_* and, when needed, GROQ_API_KEY
php artisan key:generate
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS doonportal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
php artisan migrate --seed  # reference data: roles, areas, categories
php artisan staff:create    # your first staff (super admin) account
php artisan db:seed --class=DemoDataSeeder   # optional, fictional demo content (refuses in production)
composer dev                # server + queue + logs + vite
```

Production-style build: `npm run build` then `php artisan serve`.

## Checks before merging

```bash
vendor/bin/pint --test
php artisan test                                   # SQLite in-memory
DB_CONNECTION=mysql DB_DATABASE=doonportal_test php vendor/bin/phpunit   # MySQL parity
npm run lint
npm run build
```

CI (`.github/workflows/tests.yml`) runs the same on PHP 8.2/8.3 against SQLite and MySQL 8, plus the frontend lint and build.

## Production checklist (to complete before launch — Phase 13)

- [ ] `APP_ENV=production`, `APP_DEBUG=false`, unique `APP_KEY`, HTTPS `APP_URL`
- [ ] Database: managed MySQL or PostgreSQL with automated backups and a tested restore
- [ ] `php artisan migrate --force` as a controlled deploy step (never `migrate:fresh`)
- [ ] Never run `DemoDataSeeder` (it refuses in production)
- [ ] First staff account: `php artisan staff:create` (asks for name, email and password; `--role=` defaults to SUPER_ADMIN), then sign in at `/admin/login`. Add more staff from Admin > Staff. Staff accounts are separate from member accounts.
- [ ] Sign in with Google (optional): in Google Cloud Console create an OAuth client ID of type "Web application", add the site origin (e.g. `https://doonportal.com`) under Authorised JavaScript origins, set `GOOGLE_CLIENT_ID`, then `php artisan optimize`. No client secret is needed.
- [ ] Queue worker (`php artisan queue:work`) under a supervisor; scheduler cron `* * * * * php artisan schedule:run`
- [ ] Scheduler cron is required for the nightly AI discovery (01:00 IST) and Admin > Discovery runs > Run now. Set keys and switch it on in Admin > AI settings.
- [ ] `php artisan config:cache route:cache view:cache` and `npm run build` artefacts deployed
- [ ] Storage: object storage + CDN for media; `php artisan storage:link` if local disk
- [ ] Mail provider configured for password resets
- [ ] AI: `GROQ_API_KEY` from the secret store, budgets set, auto-publishing disabled until Phase 14 gates are tested
- [ ] Error monitoring and log retention
- [ ] Security headers / CSP, CORS restricted to the site origin
- [ ] Rollback: keep the previous release directory; migrations must have working `down()` or a documented forward fix

## Rollback

1. Point the web root back to the previous release.
2. If a migration must be reversed, restore from the pre-deploy backup unless the migration is known to be safely reversible.
3. Clear caches: `php artisan optimize:clear`.
