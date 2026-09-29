"""Report signals intentionally kept empty.

Report CRUD endpoints are served directly from PostgreSQL. Keeping cache
operations out of model save/delete signals ensures report writes never wait on
Redis and avoids cross-layer cache invalidation races.
"""
