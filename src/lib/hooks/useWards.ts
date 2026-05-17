import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface WardRecord {
  id: string;
  name: string;
  type: string;
  area_km2: number;
  population: number;
  old_district: string;
  old_province: string;
}

export function useWards(filters: { search: string }) {
  const [wards, setWards] = useState<WardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchWards() {
      setLoading(true);
      try {
        let query = supabase
          .from('wards')
          .select('*', { count: 'exact' });

        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,old_district.ilike.%${filters.search}%`);
        }

        const { data, error, count } = await query
          .order('name', { ascending: true });

        if (error) {
          console.error("Lỗi khi fetch phường xã:", error.message);
          return;
        }

        setWards(data || []);
        setTotalCount(count || 0);
      } catch (err) {
        console.error("Lỗi ngoại lệ fetch wards:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchWards();
  }, [filters.search]);

  return { wards, loading, totalCount };
}
