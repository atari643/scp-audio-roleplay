import { useState, useEffect, useCallback } from 'react';

export type DeviceMode = 'auto' | 'desktop' | 'mobile';

const STORAGE_KEY = 'scp_device_mode';

export function useDeviceMode() {
  const [mode, setMode] = useState<DeviceMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'desktop' || saved === 'mobile' || saved === 'auto') {
        return saved;
      }
    } catch {
      // Ignore localStorage error
    }
    return 'auto';
  });

  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setDeviceMode = useCallback((newMode: DeviceMode) => {
    setMode(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore localStorage error
    }
  }, []);

  const toggleMode = useCallback(() => {
    // If currently rendering as mobile, switch to desktop; if desktop, switch to mobile
    const currentIsMobile = mode === 'mobile' || (mode === 'auto' && windowWidth < 768);
    setDeviceMode(currentIsMobile ? 'desktop' : 'mobile');
  }, [mode, windowWidth, setDeviceMode]);

  const isMobile = mode === 'mobile' || (mode === 'auto' && windowWidth < 768);

  return {
    mode,
    isMobile,
    setDeviceMode,
    toggleMode,
    windowWidth
  };
}
