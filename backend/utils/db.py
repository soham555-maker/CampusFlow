"""Small DB helpers shared across routers."""


def fetch_one(query):
    """Execute a single-row query safely and return the row dict or ``None``.

    supabase-py 2.31 returns ``None`` (not a response object with ``data=None``)
    when ``maybe_single()`` matches zero rows, so callers that access ``res.data``
    crash with ``'NoneType' object has no attribute 'data'``. Pass the query
    builder WITHOUT a trailing ``.maybe_single()`` / ``.execute()``::

        row = fetch_one(sb.table("students").select("*").eq("id", sid))
    """
    res = query.maybe_single().execute()
    return res.data if res else None
