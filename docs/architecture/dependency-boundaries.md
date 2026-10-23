# Dependency boundaries

- Routes import domain schemas/services from backend.app.modules and shared integrations from backend.app.services.
- Database consumers use backend.app.db.client; configuration consumers use backend.app.core.config.
- Cron and scheduler entrypoints share backend.app.jobs.reminders.
- Frontend pages and features share the same instances from @/stores. Hooks use @/hooks and application layout uses @/components/layout.
- Remove consumers before removing implementations. Dynamic imports, test mock targets, Docker, CI and Vercel are consumers too.
- Run python scripts/check_repository.py to catch legacy imports and prohibited tracked artifacts.
