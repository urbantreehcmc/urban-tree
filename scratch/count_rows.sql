SELECT 'tree_locations' AS table_name, COUNT(*) AS row_count FROM public.tree_locations
UNION ALL
SELECT 'tree_assets', COUNT(*) FROM public.tree_assets
UNION ALL
SELECT 'tree_management', COUNT(*) FROM public.tree_management
UNION ALL
SELECT 'tree_maintenance_logs', COUNT(*) FROM public.tree_maintenance_logs
UNION ALL
SELECT 'tree_growth_logs', COUNT(*) FROM public.tree_growth_logs
UNION ALL
SELECT 'tree_species', COUNT(*) FROM public.tree_species
UNION ALL
SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL
SELECT 'wards', COUNT(*) FROM public.wards
UNION ALL
SELECT 'patrol_logs', COUNT(*) FROM public.patrol_logs
UNION ALL
SELECT 'proposals', COUNT(*) FROM public.proposals
UNION ALL
SELECT 'as_built_logs', COUNT(*) FROM public.as_built_logs;
