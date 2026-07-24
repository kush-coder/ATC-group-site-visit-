/**
 * Local follow-up reminders via Capacitor Local Notifications.
 * Fails gracefully when permission is denied or the plugin is unavailable.
 */
import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
  async ensurePermission(): Promise<boolean> {
    try {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions();
      }
      return perm.display === 'granted';
    } catch {
      return false;
    }
  },

  async scheduleFollowUp(opts: {
    id: number;
    title: string;
    body: string;
    date: string; // yyyy-mm-dd
    time: string; // HH:mm
  }): Promise<boolean> {
    try {
      const granted = await this.ensurePermission();
      if (!granted) return false;
      const at = new Date(`${opts.date}T${opts.time || '09:00'}:00`);
      if (isNaN(at.getTime()) || at.getTime() < Date.now()) return false;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 100000 + opts.id,
            title: opts.title,
            body: opts.body,
            schedule: { at },
            smallIcon: 'ic_stat_icon_config_sample',
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  },

  async cancel(id: number): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 100000 + id }] });
    } catch {
      /* ignore */
    }
  },
};
