import { useEffect } from 'react';

export function useDarkMode(enabled: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [enabled]);
}
