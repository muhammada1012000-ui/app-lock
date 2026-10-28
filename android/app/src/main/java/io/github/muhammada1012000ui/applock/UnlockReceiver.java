package io.github.muhammada1012000ui.applock;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Shows "Time is up" when a lock ends, like the pop-up on Windows.
 * The lock ends on time by itself; this is only the alert. After a restart it re-arms the alert.
 */
public final class UnlockReceiver extends BroadcastReceiver {
    private static final String CHANNEL = "unlock";

    static void schedule(Context c, long endMillis) {
        AlarmManager alarms = c.getSystemService(AlarmManager.class);
        PendingIntent pi = PendingIntent.getBroadcast(c, 0, new Intent(c, UnlockReceiver.class),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endMillis, pi);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        if (LockStore.isLocked(c)) {
            // Restarted mid-lock (or woken early): set the alert for the real end time
            schedule(c, LockStore.end(c));
            return;
        }
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

        NotificationManager nm = c.getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Unlock alerts",
                NotificationManager.IMPORTANCE_DEFAULT));
        PendingIntent open = PendingIntent.getActivity(c, 1,
                new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(c, CHANNEL)
                .setSmallIcon(R.drawable.ic_lock)
                .setContentTitle("Time is up")
                .setContentText("Your apps are unlocked.")
                .setContentIntent(open)
                .setAutoCancel(true)
                .build();
        try {
            nm.notify(1, n);
        } catch (SecurityException ignored) {
            // Notifications not allowed: the lock still ended
        }
    }
}
