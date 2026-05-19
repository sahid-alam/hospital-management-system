module.exports = (err, req, res, _next) => {
  console.error('API Error:', err.message);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry: ' + err.detail });
  }
  // FK violation — distinguish insert (ref not found) vs delete (record in use)
  if (err.code === '23503') {
    const msg = err.detail?.includes('still referenced')
      ? 'Cannot delete: record is still referenced by other data.'
      : 'Referenced record does not exist.';
    return res.status(400).json({ error: msg });
  }
  // Check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Value violates constraint: ' + err.constraint });
  }
  // Trigger RAISE EXCEPTION (e.g. "no available beds")
  if (err.code === 'P0001') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
};
