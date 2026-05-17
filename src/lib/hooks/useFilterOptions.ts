import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface LocationHierarchy {
  name: string;
  wards: {
    name: string;
    streets: string[];
  }[];
}

export interface FilterOptions {
  streets: string[];
  wards: string[];
  districts: string[];
  species: string[];
  classifications: string[];
  hierarchy: LocationHierarchy[];
}

export function useFilterOptions() {
  const [options, setOptions] = useState<FilterOptions>({
    streets: [],
    wards: [],
    districts: [],
    species: [],
    classifications: [],
    hierarchy: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [basicRes, hierarchyRes] = await Promise.all([
          supabase.rpc('get_filter_options'),
          supabase.rpc('get_location_hierarchy')
        ]);

        if (basicRes.error) console.error("Lỗi basic options:", basicRes.error);
        if (hierarchyRes.error) console.error("Lỗi hierarchy options:", hierarchyRes.error);

        setOptions({
          ...basicRes.data,
          hierarchy: hierarchyRes.data || []
        });
      } catch (err) {
        console.error("Lỗi ngoại lệ khi fetch filter options:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, []);

  return { options, loading };
}
