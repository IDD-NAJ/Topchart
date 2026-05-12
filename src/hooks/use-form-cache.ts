// React hook for form caching
import { useState, useCallback, useEffect } from 'react';
import { saveFormData, loadFormData, clearFormData, hasCachedData } from '@/lib/form-cache';

export function useFormCache<T>(initialData: T) {
  const [hasCache, setHasCache] = useState(false);
  
  useEffect(() => {
    setHasCache(hasCachedData());
  }, []);

  const save = useCallback((data: T) => {
    saveFormData(data);
  }, []);

  const load = useCallback((): T | null => {
    return loadFormData<T>();
  }, []);

  const clear = useCallback(() => {
    clearFormData();
    setHasCache(false);
  }, []);

  return {
    save,
    load,
    clear,
    hasCache,
  };
}
