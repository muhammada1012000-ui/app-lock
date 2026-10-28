package io.github.muhammada1012000ui.applock;

import android.app.Activity;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.format.DateFormat;
import android.util.TypedValue;
import android.view.Gravity;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.Date;
import java.util.Locale;

/** Full-screen "this app is locked" notice with the time left, in App Lock's vault colors. */
public final class BlockedActivity extends Activity {
    static final String EXTRA_NAME = "name";

    private static final int VAULT = 0xFF0B1518;
    private static final int BRASS = 0xFFE8A84A;
    private static final int INK = 0xFFEEF3F2;
    private static final int MUTED = 0xFF8EA3A6;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private TextView title;
    private TextView time;
    private TextView until;

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            long left = LockStore.end(BlockedActivity.this) - System.currentTimeMillis();
            if (left <= 0) {
                finish();
                return;
            }
            time.setText(format(left));
            handler.postDelayed(this, 1000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(VAULT);
        int pad = dp(32);
        root.setPadding(pad, pad, pad, pad);

        ImageView lock = new ImageView(this);
        lock.setImageResource(R.drawable.ic_lock);
        lock.setImageTintList(ColorStateList.valueOf(BRASS));
        root.addView(lock, new LinearLayout.LayoutParams(dp(56), dp(56)));

        title = text(26, INK, Typeface.DEFAULT_BOLD);
        title.setPadding(0, dp(20), 0, dp(6));
        root.addView(title);

        root.addView(text(16, MUTED, Typeface.DEFAULT, "You locked it with App Lock. It opens again when the timer ends."));

        time = text(56, BRASS, Typeface.MONOSPACE);
        time.setPadding(0, dp(28), 0, dp(4));
        root.addView(time);

        until = text(15, MUTED, Typeface.DEFAULT);
        root.addView(until);

        Button home = new Button(this);
        home.setText("Go to home screen");
        home.setAllCaps(false);
        home.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        home.setTextColor(0xFF1D1206);
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(BRASS);
        bg.setCornerRadius(dp(14));
        home.setBackground(bg);
        home.setPadding(dp(28), dp(14), dp(28), dp(14));
        home.setOnClickListener(v -> goHome());
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(36);
        root.addView(home, lp);

        setContentView(root);
        showApp(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        showApp(intent);
    }

    private void showApp(Intent intent) {
        String name = intent.getStringExtra(EXTRA_NAME);
        title.setText((name == null ? "This app" : name) + " is locked");
        until.setText("Unlocks at " + DateFormat.getTimeFormat(this).format(new Date(LockStore.end(this))));
    }

    @Override
    protected void onResume() {
        super.onResume();
        handler.post(tick);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(tick);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        goHome();
    }

    private void goHome() {
        startActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        finish();
    }

    private TextView text(int sp, int color, Typeface face) {
        return text(sp, color, face, null);
    }

    private TextView text(int sp, int color, Typeface face, String value) {
        TextView t = new TextView(this);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setTypeface(face);
        t.setGravity(Gravity.CENTER);
        if (value != null) t.setText(value);
        return t;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private static String format(long millis) {
        long s = (millis + 999) / 1000;
        return String.format(Locale.US, "%d:%02d:%02d", s / 3600, (s % 3600) / 60, s % 60);
    }
}
