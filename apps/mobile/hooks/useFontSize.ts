import { useMemo } from 'react';
import { getFontSize } from '../constants/theme';
import { useAppStore } from '../store/appStore';

export function useFontSize() {
  const fontScale = useAppStore((state) => state.fontScale);
  return useMemo(() => getFontSize(fontScale), [fontScale]);
}
