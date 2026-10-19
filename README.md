# DoonPortal — All Things Doon

**Discover. Connect. Belong.** A trusted, structured guide to Dehradun: businesses, places, events, neighbourhoods and stories.

Laravel 12 API + React 19 SPA. MySQL/MariaDB today (portable to PostgreSQL), Groq as the configurable AI provider.

## Quick start

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed                    # roles, areas, categories
php artisan db:seed --class=DemoDataSeeder    # optional fictional demo content
composer dev                                  # http://localhost:8000
```

Create the MySQL database first (`doonportal`, utf8mb4). Set `GROQ_API_KEY` in `.env` when the AI engine is in use; never commit it.

## Checks

```bash
php artisan test
vendor/bin/pint --test
npm run lint
npm run build
```

## Documentation

| Doc | Contents |
|---|---|
| [docs/product-blueprint.md](docs/product-blueprint.md) | Product scope and principles |
| [docs/architecture.md](docs/architecture.md) | Stack, code layout, mechanisms, decisions |
| [docs/database-erd.md](docs/database-erd.md) | Schema diagram, constraints, statuses |
| [docs/api-specification.md](docs/api-specification.md) | `/api/v1` endpoints |
| [docs/ai-data-engine.md](docs/ai-data-engine.md) | AI provider and Phase 14 design |
| [docs/implementation-roadmap.md](docs/implementation-roadmap.md) | Phases and next steps |
| [docs/implementation-status.md](docs/implementation-status.md) | Task ledger and known issues |
| [docs/deployment-runbook.md](docs/deployment-runbook.md) | Setup, checks, production checklist |
| [docs/security-checklist.md](docs/security-checklist.md) | Security controls and gaps |
