CREATE OR REPLACE FUNCTION exec_sql(sql_query text) 
RETURNS void AS $$ 
BEGIN 
    EXECUTE sql_query; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;
