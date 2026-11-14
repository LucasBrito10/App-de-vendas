package com.app.project;

import android.annotation.SuppressLint;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private static final String APP_URL = "http://127.0.0.1:8080";
    private static final String APP_HOST = "127.0.0.1";
    private static final int APP_PORT = 8080;

    private static final String SESSION_COOKIE_NAME = "session";

    private static final String EXPORT_PATH_PREFIX = "/api/v1/export/";

    private WebView webView;
    private ExportDownloader exportDownloader;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        this.webView = new WebView(this);
        this.exportDownloader = new ExportDownloader(this);
        setContentView(this.webView);
        configureWebView(this.webView);
        setupBackNavigation(this.webView);

        setupSessionCookie(() -> {
            if (this.webView != null) {
                this.webView.loadUrl(APP_URL);
            }
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(WebView webView) {
        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isInternalUrl(request.getUrl());
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            Uri uri = Uri.parse(url);
            String path = uri.getPath();

            if (isInternalUrl(uri) && path != null && path.startsWith(EXPORT_PATH_PREFIX)) {
                this.exportDownloader.download(url);
            }
        });
    }

    private boolean isInternalUrl(Uri uri) {
        return "http".equals(uri.getScheme())
                && APP_HOST.equals(uri.getHost())
                && uri.getPort() == APP_PORT;
    }

    private void setupSessionCookie(Runnable onReady) {
        String sessionToken = ((ProjectApplication) getApplication()).getSessionToken();

        String cookie = SESSION_COOKIE_NAME + "=" + sessionToken
                + "; Path=/; HttpOnly; SameSite=Strict";

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);

        cookieManager.setCookie(APP_URL, cookie, success -> {
            cookieManager.flush();
            onReady.run();
        });
    }

    private void setupBackNavigation(WebView webView) {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });
    }

    @Override
    public void onDestroy() {
        if (this.exportDownloader != null) {
            this.exportDownloader.shutdown();
            this.exportDownloader = null;
        }
        if (this.webView != null) {
            this.webView.destroy();
            this.webView = null;
        }
        super.onDestroy();
    }
}
