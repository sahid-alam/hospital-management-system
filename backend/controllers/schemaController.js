const db = require('../config/db');

exports.getSchema = async (req, res, next) => {
  try {
    const [cols, pks, fks, uniques, counts, views, triggers, checks] = await Promise.all([
      db.query(`
        SELECT c.table_name, c.column_name, c.data_type,
               c.character_maximum_length, c.numeric_precision, c.numeric_scale,
               c.is_nullable, c.column_default, c.ordinal_position
        FROM information_schema.columns c
        JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
        WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        ORDER BY c.table_name, c.ordinal_position
      `),
      db.query(`
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
      `),
      db.query(`
        SELECT tc.table_name AS from_table, kcu.column_name AS from_column,
               ccu.table_name AS to_table, ccu.column_name AS to_column,
               tc.constraint_name,
               rc.delete_rule, rc.update_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `),
      db.query(`
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
      `),
      db.query(`
        SELECT relname AS table_name, n_live_tup AS row_count
        FROM pg_stat_user_tables
        ORDER BY relname
      `),
      db.query(`
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name
      `),
      db.query(`
        SELECT
          t.tgname AS trigger_name,
          c.relname AS table_name,
          CASE
            WHEN (t.tgtype & 64) > 0 THEN 'INSTEAD OF'
            WHEN (t.tgtype & 2)  > 0 THEN 'BEFORE'
            ELSE 'AFTER'
          END AS timing,
          CONCAT_WS(' OR ',
            CASE WHEN (t.tgtype & 4)  > 0 THEN 'INSERT' END,
            CASE WHEN (t.tgtype & 8)  > 0 THEN 'DELETE' END,
            CASE WHEN (t.tgtype & 16) > 0 THEN 'UPDATE' END
          ) AS event,
          CASE WHEN (t.tgtype & 1) > 0 THEN 'ROW' ELSE 'STATEMENT' END AS level,
          p.proname AS function_name
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_proc p  ON p.oid = t.tgfoid
        WHERE NOT t.tgisinternal
          AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY c.relname, t.tgname
      `),
      db.query(`
        SELECT tc.table_name, cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc
          ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.table_schema
        WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
          AND cc.check_clause NOT LIKE '%IS NOT NULL%'
        ORDER BY tc.table_name
      `),
    ]);

    res.json({
      columns:     cols.rows,
      primaryKeys: pks.rows,
      foreignKeys: fks.rows,
      uniqueKeys:  uniques.rows,
      rowCounts:   counts.rows,
      views:       views.rows,
      triggers:    triggers.rows,
      checks:      checks.rows,
    });
  } catch (err) { next(err); }
};
