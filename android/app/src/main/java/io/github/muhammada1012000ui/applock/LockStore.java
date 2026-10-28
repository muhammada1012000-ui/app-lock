package io.github.muhammada1012000ui.applock;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.LinkedHashMap;
import java.util.Map;

/** The current lock, saved on the device so it survives closing the app and restarting the tablet. */
final class LockStore {
    private LockStore() { }

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("lock", Context.MODE_PRIVATE);
    }

    /** When the lock ends, in milliseconds since 1970 (0 if there never was one). */
    static long end(Context c) {
        return prefs(c).getLong("end", 0);
    }

    static boolean isLocked(Context c) {
        return end(c) > System.currentTimeMillis();
    }

    /** Locked apps as package name -> app name, in the order they were picked. */
    static Map<String, String> apps(Context c) {
        Map<String, String> out = new LinkedHashMap<>();
        try {
            JSONArray list = new JSONArray(prefs(c).getString("apps", "[]"));
            for (int i = 0; i < list.length(); i++) {
                JSONObject a = list.getJSONObject(i);
                out.put(a.getString("p"), a.getString("n"));
            }
        } catch (JSONException ignored) {
            // Treat unreadable data as "nothing locked"
        }
        return out;
    }

    static boolean isBlocked(Context c, String pkg) {
        return isLocked(c) && apps(c).containsKey(pkg);
    }

    static void start(Context c, Map<String, String> apps, long endMillis) {
        JSONArray list = new JSONArray();
        for (Map.Entry<String, String> e : apps.entrySet()) {
            JSONObject a = new JSONObject();
            try {
                a.put("p", e.getKey());
                a.put("n", e.getValue());
            } catch (JSONException ignored) {
                continue;
            }
            list.put(a);
        }
        prefs(c).edit().putLong("end", endMillis).putString("apps", list.toString()).commit();
    }
}
