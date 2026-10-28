package io.github.muhammada1012000ui.applock;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;

/**
 * Does the actual blocking. Android tells it whenever a different app comes to the front;
 * if that app is locked, it goes to the home screen and shows the "app is locked" screen.
 * It only looks at the app's package name, never at what is on screen.
 */
public final class BlockerService extends AccessibilityService {

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence source = event.getPackageName();
        if (source == null) return;
        String pkg = source.toString();
        if (!LockStore.isBlocked(this, pkg)) return;

        performGlobalAction(GLOBAL_ACTION_HOME);
        startActivity(new Intent(this, BlockedActivity.class)
                .putExtra(BlockedActivity.EXTRA_NAME, LockStore.apps(this).get(pkg))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP));
    }

    @Override
    public void onInterrupt() {
        // Nothing to stop: the service doesn't give spoken or haptic feedback
    }
}
