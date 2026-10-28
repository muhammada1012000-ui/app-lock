package io.github.muhammada1012000ui.applock;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Base64;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Answers the App Lock screen's requests: the same "state", "running" and "start" requests the
 * Windows helper answers at /api/..., plus "openAccessibility".
 *
 * Security: MainActivity registers this listener for one origin only (the app's own built-in page),
 * so websites can never reach it. It is not a network server and nothing listens on a port.
 */
final class AppLockBridge implements WebViewCompat.WebMessageListener {
    static final String ORIGIN = "https://appassets.androidplatform.net";

    private final Context ctx;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());

    AppLockBridge(Context ctx) {
        this.ctx = ctx.getApplicationContext();
    }

    @Override
    public void onPostMessage(@NonNull WebView view, @NonNull WebMessageCompat message, @NonNull Uri sourceOrigin,
                              boolean isMainFrame, @NonNull JavaScriptReplyProxy replyProxy) {
        // Double-check the sender even though WebView already filters by origin
        if (!isMainFrame || !"https".equals(sourceOrigin.getScheme())
                || !"appassets.androidplatform.net".equals(sourceOrigin.getHost())) {
            return;
        }
        final String data = message.getData();
        if (data == null) return;
        worker.execute(() -> {
            JSONObject reply = new JSONObject();
            try {
                JSONObject req = new JSONObject(data);
                reply.put("id", req.optInt("id"));
                try {
                    reply.put("data", handle(req.optString("path"), req.optJSONObject("body")));
                } catch (BridgeError e) {
                    reply.put("error", e.getMessage());
                }
            } catch (JSONException e) {
                return;
            }
            String out = reply.toString();
            main.post(() -> replyProxy.postMessage(out));
        });
    }

    /** A problem to show the user, like the Windows helper's error messages. */
    private static final class BridgeError extends Exception {
        BridgeError(String message) { super(message); }
    }

    private Object handle(String path, JSONObject body) throws JSONException, BridgeError {
        switch (path) {
            case "state":
                return state();
            case "running":
                return installedApps();
            case "start":
                return start(body);
            case "openAccessibility":
                ctx.startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return new JSONObject();
            default:
                throw new BridgeError("Not found.");
        }
    }

    private JSONObject state() throws JSONException {
        boolean locked = LockStore.isLocked(ctx);
        JSONObject s = new JSONObject();
        s.put("locked", locked);
        s.put("end", locked ? LockStore.end(ctx) : 0);
        s.put("apps", new JSONArray(locked ? LockStore.apps(ctx).values() : Collections.emptyList()));
        s.put("ready", isBlockerEnabled(ctx));
        return s;
    }

    /** Apps you can open from the home screen, with their icons, sorted by name. */
    private JSONObject installedApps() throws JSONException {
        PackageManager pm = ctx.getPackageManager();
        Set<String> skip = protectedPackages(ctx);
        Set<String> seen = new HashSet<>();
        List<JSONObject> list = new ArrayList<>();
        Intent launcher = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        for (ResolveInfo r : pm.queryIntentActivities(launcher, 0)) {
            String pkg = r.activityInfo.packageName;
            if (skip.contains(pkg) || !seen.add(pkg)) continue;
            JSONObject a = new JSONObject();
            a.put("n", r.activityInfo.applicationInfo.loadLabel(pm).toString());
            a.put("p", pkg);
            a.put("icon", iconDataUrl(r.loadIcon(pm)));
            list.add(a);
        }
        list.sort((x, y) -> x.optString("n").compareToIgnoreCase(y.optString("n")));
        return new JSONObject().put("apps", new JSONArray(list));
    }

    private JSONObject start(JSONObject body) throws JSONException, BridgeError {
        if (body == null) throw new BridgeError("Pick at least one app.");
        if (LockStore.isLocked(ctx)) throw new BridgeError("A lock is already running.");
        if (!isBlockerEnabled(ctx)) throw new BridgeError("Turn on App Lock in Accessibility settings first.");
        int minutes = body.optInt("minutes", 0);
        if (minutes < 1 || minutes > 1439) {
            throw new BridgeError("Set a time between 1 minute and 23 hours 59 minutes.");
        }
        PackageManager pm = ctx.getPackageManager();
        Set<String> skip = protectedPackages(ctx);
        Map<String, String> apps = new LinkedHashMap<>();
        JSONArray picked = body.optJSONArray("apps");
        for (int i = 0; picked != null && i < picked.length(); i++) {
            JSONObject a = picked.optJSONObject(i);
            if (a == null) continue;
            String pkg = a.optString("p");
            // Only real, installed apps, and never the ones Android needs to stay usable
            if (skip.contains(pkg) || pm.getLaunchIntentForPackage(pkg) == null) continue;
            apps.put(pkg, a.optString("n", pkg));
        }
        if (apps.isEmpty()) throw new BridgeError("Pick at least one app.");
        long end = System.currentTimeMillis() + minutes * 60_000L;
        LockStore.start(ctx, apps, end);
        UnlockReceiver.schedule(ctx, end);
        return state();
    }

    /** True when the user has switched on App Lock under Settings > Accessibility. */
    static boolean isBlockerEnabled(Context c) {
        String enabled = Settings.Secure.getString(c.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (TextUtils.isEmpty(enabled)) return false;
        ComponentName me = new ComponentName(c, BlockerService.class);
        for (String s : enabled.split(":")) {
            if (me.equals(ComponentName.unflattenFromString(s))) return true;
        }
        return false;
    }

    /** Never locked: App Lock itself, Settings, phone and emergency calls, and the home screen. */
    static Set<String> protectedPackages(Context c) {
        Set<String> p = new HashSet<>(Arrays.asList(
                c.getPackageName(),
                "com.android.settings",
                "com.android.systemui",
                "com.android.phone",
                "com.android.dialer",
                "com.google.android.dialer",
                "com.samsung.android.dialer",
                "com.samsung.android.incallui",
                "com.android.emergency",
                "com.sec.android.app.launcher"));
        Intent home = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        for (ResolveInfo r : c.getPackageManager().queryIntentActivities(home, 0)) {
            p.add(r.activityInfo.packageName);
        }
        return p;
    }

    private static String iconDataUrl(Drawable d) {
        int size = 72;
        Bitmap b = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(b);
        d.setBounds(0, 0, size, size);
        d.draw(canvas);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        b.recycle();
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }
}
