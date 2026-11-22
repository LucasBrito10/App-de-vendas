package com.app.project;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

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
                Uri uri = request.getUrl();

                if (isInternalUrl(uri)) {
                    return false;
                }

                // Fora do app, só os botões Ligar / WhatsApp / Cobrar podem abrir algo.
                // Qualquer outro link externo continua bloqueado.
                if (isContactUrl(uri)) {
                    openExternally(uri);
                }
                return true;
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

    // tel: abre o discador (sem ligar sozinho, então não precisa de permissão);
    // https://wa.me/... abre a conversa no WhatsApp.
    private boolean isContactUrl(Uri uri) {
        String scheme = uri.getScheme();

        if ("tel".equals(scheme)) {
            return true;
        }
        return "https".equals(scheme) && "wa.me".equals(uri.getHost());
    }

    private void openExternally(Uri uri) {
        String action = "tel".equals(uri.getScheme()) ? Intent.ACTION_DIAL : Intent.ACTION_VIEW;

        try {
            startActivity(new Intent(action, uri));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Nenhum app encontrado para abrir este contato.", Toast.LENGTH_SHORT).show();
        }
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
