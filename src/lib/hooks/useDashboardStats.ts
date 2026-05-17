import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface DashboardStats {
  total: number;
  has_coord: number;
  missing_coord: number;
  l1: number;
  l2: number;
  l3: number;
  mt: number;
  khoe: number;
  sau_benh: number;
  can_don_ha: number;
  moi: number;
  ngung_quan_ly: number;
  top_species: { name: string; count: number }[];

  top_quan: { name: string; count: number }[];
  recentActivity: any[];
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_dashboard_stats');
        
        if (error) {
          console.error("Lỗi khi lấy thống kê Dashboard:", error.message || error);
          setError(error);
          return;
        }

        setStats(data);
      } catch (err: any) {
        console.error("Lỗi ngoại lệ khi fetch stats:", err?.message || err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
