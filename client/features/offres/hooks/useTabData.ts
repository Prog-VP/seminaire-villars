import { useCallback, useEffect, useRef, useState } from "react";

type UseTabDataOptions<T> = {
  fetchFn: (() => Promise<T[]>) | null;
  initialData?: T[];
  initiallyLoaded?: boolean;
  triggerWhen: boolean;
  onError?: (error: unknown) => void;
};

type UseTabDataResult<T> = {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  isLoaded: boolean;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  reload: () => Promise<void>;
};

export function useTabData<T>({
  fetchFn,
  initialData,
  initiallyLoaded = false,
  triggerWhen,
  onError,
}: UseTabDataOptions<T>): UseTabDataResult<T> {
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [isLoaded, setIsLoaded] = useState(initiallyLoaded);
  const [isLoading, setIsLoading] = useState(false);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const reload = useCallback(async () => {
    const fn = fetchFnRef.current;
    if (!fn) return;
    try {
      setIsLoading(true);
      const result = await fn();
      setData(result);
      setIsLoaded(true);
    } catch (error) {
      onErrorRef.current?.(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (triggerWhen && !isLoaded) {
      reload();
    }
  }, [triggerWhen, isLoaded, reload]);

  return { data, setData, isLoaded, isLoading, setIsLoading, reload };
}
