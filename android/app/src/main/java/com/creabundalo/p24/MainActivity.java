package com.creabundalo.p24;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.speech.RecognizerIntent;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int RC_PERMISSIONS = 2401;
    private static final int RC_VOICE = 2402;
    private static final int RC_FILE = 2403;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        if (android.os.Build.VERSION.SDK_INT >= 16) {
            settings.setAllowFileAccessFromFileURLs(false);
            settings.setAllowUniversalAccessFromFileURLs(false);
        }
        if (android.os.Build.VERSION.SDK_INT >= 21) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }

        WebView.setWebContentsDebuggingEnabled(false);
        webView.addJavascriptInterface(new P24Bridge(this), "P24Native");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && url.startsWith("file:///android_asset/")) return false;
                if (url != null && (url.startsWith("http://") || url.startsWith("https://"))) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }
                return false;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), RC_FILE);
                    return true;
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
            }
        });

        webView.loadUrl("file:///android_asset/actio.html");
        requestBridgePermissions(true, true);
    }

    public void requestBridgePermissions(boolean contacts, boolean calendar) {
        ArrayList<String> permissions = new ArrayList<>();
        if (contacts) {
            if (checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.READ_CONTACTS);
            if (checkSelfPermission(Manifest.permission.WRITE_CONTACTS) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.WRITE_CONTACTS);
        }
        if (calendar) {
            if (checkSelfPermission(Manifest.permission.READ_CALENDAR) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.READ_CALENDAR);
            if (checkSelfPermission(Manifest.permission.WRITE_CALENDAR) != PackageManager.PERMISSION_GRANTED) permissions.add(Manifest.permission.WRITE_CALENDAR);
        }
        if (!permissions.isEmpty()) {
            requestPermissions(permissions.toArray(new String[0]), RC_PERMISSIONS);
        }
    }

    public void startVoiceCaptureFromBridge() {
        runOnUiThread(() -> {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "nl-NL");
            intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Spreek je ACTIO-opdracht in");
            if (intent.resolveActivity(getPackageManager()) == null) {
                sendVoiceError("Geen spraakherkenner beschikbaar op dit toestel");
                return;
            }
            startActivityForResult(intent, RC_VOICE);
        });
    }

    public void openLauncherFromBridge() {
        runOnUiThread(() -> {
            Intent home = new Intent(Intent.ACTION_MAIN);
            home.addCategory(Intent.CATEGORY_HOME);
            home.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(home);
        });
    }

    private void sendVoiceResult(String text) {
        final String quoted = JSONObject.quote(text == null ? "" : text);
        runOnUiThread(() -> webView.evaluateJavascript("window.P24NativeVoiceResult && window.P24NativeVoiceResult(" + quoted + ")", null));
    }

    private void sendVoiceError(String text) {
        final String quoted = JSONObject.quote(text == null ? "spraakfout" : text);
        runOnUiThread(() -> webView.evaluateJavascript("window.P24NativeVoiceError && window.P24NativeVoiceError(" + quoted + ")", null));
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RC_VOICE) {
            if (resultCode == RESULT_OK && data != null) {
                ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (results != null && !results.isEmpty()) sendVoiceResult(results.get(0));
                else sendVoiceError("Geen spraakresultaat");
            } else {
                sendVoiceError("Spraakopname geannuleerd");
            }
            return;
        }
        if (requestCode == RC_FILE) {
            if (fileCallback == null) return;
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileCallback.onReceiveValue(result);
            fileCallback = null;
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("P24Native");
            webView.destroy();
        }
        super.onDestroy();
    }
}
