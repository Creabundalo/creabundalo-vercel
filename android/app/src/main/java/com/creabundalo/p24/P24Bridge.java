package com.creabundalo.p24;

import android.Manifest;
import android.content.ContentProviderOperation;
import android.content.ContentProviderResult;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.ContactsContract;
import android.webkit.JavascriptInterface;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class P24Bridge {
    private final MainActivity activity;

    P24Bridge(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public String capabilities() {
        try {
            JSONObject out = new JSONObject();
            out.put("ok", true);
            out.put("version", "0.4.0");
            out.put("contacts", true);
            out.put("calendar", true);
            out.put("alarm", true);
            out.put("voice", true);
            return out.toString();
        } catch (Exception e) {
            return error("CAPABILITIES:" + e.getMessage());
        }
    }

    @JavascriptInterface
    public String preflight(String payload) {
        try {
            JSONObject request = new JSONObject(payload == null ? "{}" : payload);
            boolean contacts = request.optBoolean("contacts", false);
            boolean calendar = request.optBoolean("calendar", false);
            boolean contactsOk = !contacts || hasContactPermissions();
            boolean calendarOk = !calendar || hasCalendarPermissions();
            JSONObject out = new JSONObject();
            out.put("ok", contactsOk && calendarOk);
            out.put("contacts", contactsOk);
            out.put("calendar", calendarOk);
            if (!contactsOk || !calendarOk) out.put("error", "ANDROID_PERMISSION_REQUIRED");
            return out.toString();
        } catch (Exception e) {
            return error("PREFLIGHT:" + e.getMessage());
        }
    }

    @JavascriptInterface
    public void requestPermissions(String payload) {
        try {
            JSONObject request = new JSONObject(payload == null ? "{}" : payload);
            boolean contacts = request.optBoolean("contacts", false);
            boolean calendar = request.optBoolean("calendar", false);
            activity.runOnUiThread(() -> activity.requestBridgePermissions(contacts, calendar));
        } catch (Exception ignored) {
        }
    }

    @JavascriptInterface
    public void startVoiceCapture() {
        activity.startVoiceCaptureFromBridge();
    }

    @JavascriptInterface
    public void openLauncher() {
        activity.openLauncherFromBridge();
    }

    @JavascriptInterface
    public String createContact(String payload) {
        if (!hasContactPermissions()) return error("CONTACT_PERMISSION_REQUIRED");
        try {
            JSONObject in = new JSONObject(payload == null ? "{}" : payload);
            String name = clean(in.optString("name", ""));
            String email = clean(in.optString("email", ""));
            String phone = clean(in.optString("phone", ""));
            if (name.isEmpty() && email.isEmpty() && phone.isEmpty()) return error("CONTACT_EMPTY");

            Long existing = findExistingContact(email, name);
            if (existing != null) {
                JSONObject out = ok();
                out.put("verified", true);
                out.put("id", existing);
                out.put("storage", "EXISTING");
                return out.toString();
            }

            AccountChoice account = findDavContactAccount();
            ArrayList<ContentProviderOperation> ops = new ArrayList<>();
            ContentProviderOperation.Builder raw = ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI);
            if (account != null) {
                raw.withValue(ContactsContract.RawContacts.ACCOUNT_NAME, account.name);
                raw.withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, account.type);
            } else {
                raw.withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null);
                raw.withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null);
            }
            ops.add(raw.build());

            if (!name.isEmpty()) {
                ops.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
                        .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE)
                        .withValue(ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME, name)
                        .build());
            }
            if (!email.isEmpty()) {
                ops.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
                        .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Email.CONTENT_ITEM_TYPE)
                        .withValue(ContactsContract.CommonDataKinds.Email.ADDRESS, email)
                        .withValue(ContactsContract.CommonDataKinds.Email.TYPE, ContactsContract.CommonDataKinds.Email.TYPE_OTHER)
                        .build());
            }
            if (!phone.isEmpty()) {
                ops.add(ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                        .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
                        .withValue(ContactsContract.Data.MIMETYPE, ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE)
                        .withValue(ContactsContract.CommonDataKinds.Phone.NUMBER, phone)
                        .withValue(ContactsContract.CommonDataKinds.Phone.TYPE, ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE)
                        .build());
            }

            ContentProviderResult[] results = activity.getContentResolver().applyBatch(ContactsContract.AUTHORITY, ops);
            Uri rawUri = results.length > 0 ? results[0].uri : null;
            if (rawUri == null) return error("CONTACT_INSERT_NO_URI");
            long rawId = ContentUris.parseId(rawUri);
            boolean verified = exists(rawUri);

            JSONObject out = ok();
            out.put("verified", verified);
            out.put("id", rawId);
            out.put("storage", account == null ? "LOCAL" : "DAVX5");
            if (account != null) out.put("account", account.name);
            return out.toString();
        } catch (Exception e) {
            return error("CONTACT:" + safeMessage(e));
        }
    }

    @JavascriptInterface
    public String createEvent(String payload) {
        if (!hasCalendarPermissions()) return error("CALENDAR_PERMISSION_REQUIRED");
        try {
            JSONObject in = new JSONObject(payload == null ? "{}" : payload);
            long start = in.optLong("startMillis", 0L);
            long end = in.optLong("endMillis", 0L);
            String title = clean(in.optString("title", "ACTIO"));
            String timezone = clean(in.optString("timezone", "Europe/Amsterdam"));
            String personName = clean(in.optString("personName", ""));
            String email = clean(in.optString("email", ""));
            String txId = clean(in.optString("txId", ""));
            if (start <= 0 || end <= start) return error("EVENT_TIME_INVALID");

            CalendarChoice calendar = findWritableCalendar();
            if (calendar == null) return error("NO_WRITABLE_CALENDAR");

            StringBuilder description = new StringBuilder("ACTIO");
            if (!personName.isEmpty()) description.append(" · ").append(personName);
            if (!email.isEmpty()) description.append(" <").append(email).append(">");
            if (!txId.isEmpty()) description.append("\nTX: ").append(txId);

            ContentValues values = new ContentValues();
            values.put(CalendarContract.Events.CALENDAR_ID, calendar.id);
            values.put(CalendarContract.Events.TITLE, title);
            values.put(CalendarContract.Events.DESCRIPTION, description.toString());
            values.put(CalendarContract.Events.DTSTART, start);
            values.put(CalendarContract.Events.DTEND, end);
            values.put(CalendarContract.Events.EVENT_TIMEZONE, timezone.isEmpty() ? "Europe/Amsterdam" : timezone);

            Uri uri = activity.getContentResolver().insert(CalendarContract.Events.CONTENT_URI, values);
            if (uri == null) return error("EVENT_INSERT_NO_URI");
            long id = ContentUris.parseId(uri);
            boolean verified = exists(uri);

            JSONObject out = ok();
            out.put("verified", verified);
            out.put("id", id);
            out.put("calendar", calendar.displayName);
            out.put("accountType", calendar.accountType);
            return out.toString();
        } catch (Exception e) {
            return error("EVENT:" + safeMessage(e));
        }
    }

    @JavascriptInterface
    public String createAlarm(String payload) {
        try {
            JSONObject in = new JSONObject(payload == null ? "{}" : payload);
            String time = clean(in.optString("time", ""));
            String label = clean(in.optString("label", "ACTIO"));
            long targetMillis = in.optLong("targetMillis", 0L);
            String[] parts = time.split(":");
            if (parts.length != 2) return error("ALARM_TIME_INVALID");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return error("ALARM_TIME_INVALID");

            Intent generic = new Intent(AlarmClock.ACTION_SET_ALARM)
                    .putExtra(AlarmClock.EXTRA_HOUR, hour)
                    .putExtra(AlarmClock.EXTRA_MINUTES, minute)
                    .putExtra(AlarmClock.EXTRA_MESSAGE, label)
                    .putExtra(AlarmClock.EXTRA_SKIP_UI, true)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Intent chosen = generic;
            String provider = "DEFAULT_CLOCK";
            Intent fossify = new Intent(generic).setPackage("org.fossify.clock");
            if (fossify.resolveActivity(activity.getPackageManager()) != null) {
                chosen = fossify;
                provider = "FOSSIFY_CLOCK";
            } else if (generic.resolveActivity(activity.getPackageManager()) == null) {
                return error("NO_ALARM_CLOCK_HANDLER");
            }

            final Intent dispatch = chosen;
            activity.runOnUiThread(() -> activity.startActivity(dispatch));

            JSONObject out = ok();
            out.put("dispatched", true);
            out.put("verification", "DISPATCHED");
            out.put("provider", provider);
            if (targetMillis > System.currentTimeMillis() + (26L * 60L * 60L * 1000L)) {
                out.put("warning", "CLOCK_INTENT_IS_TIME_OF_DAY_ONLY");
            }
            return out.toString();
        } catch (Exception e) {
            return error("ALARM:" + safeMessage(e));
        }
    }

    private boolean hasContactPermissions() {
        return activity.checkSelfPermission(Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED
                && activity.checkSelfPermission(Manifest.permission.WRITE_CONTACTS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasCalendarPermissions() {
        return activity.checkSelfPermission(Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED
                && activity.checkSelfPermission(Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED;
    }

    private Long findExistingContact(String email, String name) {
        if (!email.isEmpty()) {
            try (Cursor c = activity.getContentResolver().query(
                    ContactsContract.CommonDataKinds.Email.CONTENT_URI,
                    new String[]{ContactsContract.CommonDataKinds.Email.CONTACT_ID},
                    ContactsContract.CommonDataKinds.Email.ADDRESS + "=?",
                    new String[]{email}, null)) {
                if (c != null && c.moveToFirst()) return c.getLong(0);
            }
        }
        if (!name.isEmpty()) {
            try (Cursor c = activity.getContentResolver().query(
                    ContactsContract.Contacts.CONTENT_URI,
                    new String[]{ContactsContract.Contacts._ID},
                    ContactsContract.Contacts.DISPLAY_NAME_PRIMARY + "=?",
                    new String[]{name}, null)) {
                if (c != null && c.moveToFirst()) return c.getLong(0);
            }
        }
        return null;
    }

    private AccountChoice findDavContactAccount() {
        Set<String> seen = new HashSet<>();
        try (Cursor c = activity.getContentResolver().query(
                ContactsContract.RawContacts.CONTENT_URI,
                new String[]{ContactsContract.RawContacts.ACCOUNT_NAME, ContactsContract.RawContacts.ACCOUNT_TYPE},
                ContactsContract.RawContacts.DELETED + "=0 AND " + ContactsContract.RawContacts.ACCOUNT_TYPE + " IS NOT NULL",
                null, null)) {
            if (c == null) return null;
            while (c.moveToNext()) {
                String name = c.getString(0);
                String type = c.getString(1);
                if (type == null) continue;
                String key = String.valueOf(name) + "|" + type;
                if (!seen.add(key)) continue;
                String lower = type.toLowerCase(Locale.ROOT);
                if (lower.contains("davdroid") || lower.contains("carddav")) return new AccountChoice(name, type);
            }
        }
        return null;
    }

    private CalendarChoice findWritableCalendar() {
        CalendarChoice best = null;
        int bestScore = Integer.MIN_VALUE;
        String[] projection = new String[]{
                CalendarContract.Calendars._ID,
                CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
                CalendarContract.Calendars.ACCOUNT_NAME,
                CalendarContract.Calendars.ACCOUNT_TYPE,
                CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL
        };
        String selection = CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + ">=? AND " + CalendarContract.Calendars.VISIBLE + "=1";
        String[] args = new String[]{String.valueOf(CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR)};
        try (Cursor c = activity.getContentResolver().query(CalendarContract.Calendars.CONTENT_URI, projection, selection, args, null)) {
            if (c == null) return null;
            while (c.moveToNext()) {
                long id = c.getLong(0);
                String display = c.getString(1);
                String account = c.getString(2);
                String type = c.getString(3);
                String lower = type == null ? "" : type.toLowerCase(Locale.ROOT);
                int score = 10;
                if (lower.contains("davdroid") || lower.contains("caldav")) score = 100;
                else if ("local".equalsIgnoreCase(type)) score = 80;
                else if (lower.contains("google")) score = 30;
                if (score > bestScore) {
                    bestScore = score;
                    best = new CalendarChoice(id, display == null ? "Agenda" : display, account, type == null ? "" : type);
                }
            }
        }
        return best;
    }

    private boolean exists(Uri uri) {
        try (Cursor c = activity.getContentResolver().query(uri, new String[]{"_id"}, null, null, null)) {
            return c != null && c.moveToFirst();
        } catch (Exception e) {
            return false;
        }
    }

    private static String clean(String value) {
        if (value == null || "null".equalsIgnoreCase(value)) return "";
        return value.trim();
    }

    private static String safeMessage(Exception e) {
        return e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
    }

    private static JSONObject ok() throws Exception {
        JSONObject out = new JSONObject();
        out.put("ok", true);
        return out;
    }

    private static String error(String message) {
        try {
            JSONObject out = new JSONObject();
            out.put("ok", false);
            out.put("error", message == null ? "UNKNOWN" : message);
            return out.toString();
        } catch (Exception e) {
            return "{\"ok\":false,\"error\":\"UNKNOWN\"}";
        }
    }

    private static class AccountChoice {
        final String name;
        final String type;
        AccountChoice(String name, String type) {
            this.name = name;
            this.type = type;
        }
    }

    private static class CalendarChoice {
        final long id;
        final String displayName;
        final String accountName;
        final String accountType;
        CalendarChoice(long id, String displayName, String accountName, String accountType) {
            this.id = id;
            this.displayName = displayName;
            this.accountName = accountName;
            this.accountType = accountType;
        }
    }
}
