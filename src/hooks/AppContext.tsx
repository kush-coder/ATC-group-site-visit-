/**
 * Global app context: DB bootstrap, employee profile, toast + haptics.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useIonToast } from '@ionic/react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { dbManager } from '@/services/database/db';
import { employeeRepo } from '@/services/database/repository';
import type { EmployeeProfile } from '@/types/models';

interface AppContextValue {
  dbReady: boolean;
  profile: EmployeeProfile | null;
  refreshProfile: () => Promise<void>;
  toast: (msg: string, kind?: 'success' | 'error' | 'warning' | 'info') => void;
  haptic: (kind?: 'light' | 'medium' | 'success' | 'error') => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbReady, setDbReady] = useState(false);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [present] = useIonToast();

  const refreshProfile = useCallback(async () => {
    const p = await employeeRepo.get();
    setProfile(p);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await dbManager.init();
        setDbReady(true);
        await refreshProfile();
      } catch (e) {
        console.error('DB init failed', e);
        setDbReady(true); // still let UI render an error path
      }
    })();
  }, [refreshProfile]);

  const toast = useCallback((msg: string, kind: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const color = kind === 'success' ? 'success' : kind === 'error' ? 'danger' : kind === 'warning' ? 'warning' : 'dark';
    present({ message: msg, duration: 2600, position: 'top', color, cssClass: 'atc-toast' });
  }, [present]);

  const haptic = useCallback(async (kind: 'light' | 'medium' | 'success' | 'error' = 'light') => {
    try {
      if (kind === 'success') await Haptics.notification({ type: NotificationType.Success });
      else if (kind === 'error') await Haptics.notification({ type: NotificationType.Error });
      else await Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
    } catch { /* unsupported */ }
  }, []);

  return (
    <Ctx.Provider value={{ dbReady, profile, refreshProfile, toast, haptic }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
