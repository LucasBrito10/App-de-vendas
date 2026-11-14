package com.app.project;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.webkit.CookieManager;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExportDownloader {
    private static final String TAG = "ExportDownloader";

    private static final String EXPORTS_DIR = "exports";
    private static final String DEFAULT_FILE_NAME = "exportacao.csv";
    private static final String CSV_MIME_TYPE = "text/csv";
    private static final int TIMEOUT_MS = 30_000;
    private static final int MAX_ERROR_BODY_BYTES = 8 * 1024;

    private static final Pattern FILE_NAME_PATTERN = Pattern.compile("filename=\"?([^\";]+)\"?");

    private final Activity activity;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public ExportDownloader(Activity activity) {
        this.activity = activity;
    }

    public void download(String url) {
        Toast.makeText(activity, "Gerando arquivo...", Toast.LENGTH_SHORT).show();

        executor.execute(() -> {
            try {
                File file = fetchToCache(url);
                runOnUiThreadIfAlive(() -> share(file));
            } catch (ExportException e) {
                runOnUiThreadIfAlive(() -> showError(e.getMessage()));
            } catch (Exception e) {
                Log.e(TAG, "Falha ao exportar " + url, e);
                runOnUiThreadIfAlive(() -> showError("Não foi possível gerar o arquivo."));
            }
        });
    }

    public void shutdown() {
        executor.shutdownNow();
    }

    private File fetchToCache(String url) throws IOException, ExportException {
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();

        try {
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            connection.setInstanceFollowRedirects(false);

            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) {
                connection.setRequestProperty("Cookie", cookies);
            }

            int status = connection.getResponseCode();

            if (status != HttpURLConnection.HTTP_OK) {
                throw new ExportException(readErrorMessage(connection));
            }

            String fileName = extractFileName(connection.getHeaderField("Content-Disposition"));
            File file = new File(prepareExportsDir(), fileName);

            try (InputStream in = connection.getInputStream();
                 OutputStream out = new FileOutputStream(file)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                }
            }

            return file;
        } finally {
            connection.disconnect();
        }
    }

    private String readErrorMessage(HttpURLConnection connection) {
        try (InputStream errorStream = connection.getErrorStream()) {
            if (errorStream == null) {
                return "Não foi possível gerar o arquivo.";
            }

            ByteArrayOutputStream body = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int read;
            while ((read = errorStream.read(buffer)) != -1 && body.size() < MAX_ERROR_BODY_BYTES) {
                body.write(buffer, 0, read);
            }

            JsonObject json = JsonParser.parseString(body.toString(StandardCharsets.UTF_8.name())).getAsJsonObject();
            if (json.has("error")) {
                return json.get("error").getAsString();
            }
        } catch (Exception ignored) {
        }

        return "Não foi possível gerar o arquivo.";
    }

    private File prepareExportsDir() throws IOException {
        File dir = new File(activity.getCacheDir(), EXPORTS_DIR);

        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("Não foi possível criar a pasta de exportação.");
        }

        File[] oldFiles = dir.listFiles();
        if (oldFiles != null) {
            for (File old : oldFiles) {
                old.delete();
            }
        }

        return dir;
    }

    static String extractFileName(String contentDisposition) {
        if (contentDisposition == null) {
            return DEFAULT_FILE_NAME;
        }

        Matcher matcher = FILE_NAME_PATTERN.matcher(contentDisposition);
        if (!matcher.find()) {
            return DEFAULT_FILE_NAME;
        }

        String safe = matcher.group(1).replaceAll("[^A-Za-z0-9._-]", "_");

        if (safe.isEmpty() || safe.startsWith(".")) {
            return DEFAULT_FILE_NAME;
        }

        return safe.endsWith(".csv") ? safe : safe + ".csv";
    }

    private void share(File file) {
        Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", file);

        Intent sendIntent = new Intent(Intent.ACTION_SEND);
        sendIntent.setType(CSV_MIME_TYPE);
        sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
        sendIntent.putExtra(Intent.EXTRA_SUBJECT, file.getName());

        sendIntent.setClipData(ClipData.newRawUri(file.getName(), uri));
        sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        activity.startActivity(Intent.createChooser(sendIntent, "Salvar ou enviar planilha"));
    }

    private void showError(String message) {
        Toast.makeText(activity, message, Toast.LENGTH_LONG).show();
    }

    private void runOnUiThreadIfAlive(Runnable action) {
        activity.runOnUiThread(() -> {
            if (!activity.isFinishing() && !activity.isDestroyed()) {
                action.run();
            }
        });
    }

    private static class ExportException extends Exception {
        ExportException(String message) {
            super(message);
        }
    }
}
