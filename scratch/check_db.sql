SELECT 
    schemaname,
    relname AS table_name,
    n_live_tup AS estimated_row_count,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM 
    pg_stat_user_tables
ORDER BY 
    pg_total_relation_size(relid) DESC;
