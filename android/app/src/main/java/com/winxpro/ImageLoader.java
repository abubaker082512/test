package com.winxpro;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.LruCache;
import android.widget.ImageView;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ImageLoader {
    private static ImageLoader instance;
    private final LruCache<String, Bitmap> memoryCache;
    private final ExecutorService executor = Executors.newFixedThreadPool(6);
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private ImageLoader() {
        final int maxMemory = (int) (Runtime.getRuntime().maxMemory() / 1024);
        final int cacheSize = maxMemory / 8; // Use 1/8th of available memory for image cache
        memoryCache = new LruCache<String, Bitmap>(cacheSize) {
            @Override
            protected int sizeOf(String key, Bitmap bitmap) {
                return bitmap.getByteCount() / 1024;
            }
        };
    }

    public static synchronized ImageLoader getInstance() {
        if (instance == null) {
            instance = new ImageLoader();
        }
        return instance;
    }

    public void loadImage(String urlStr, ImageView imageView, int placeholderResId) {
        if (urlStr == null || urlStr.isEmpty()) {
            imageView.setImageResource(placeholderResId);
            return;
        }

        Bitmap cached = memoryCache.get(urlStr);
        if (cached != null) {
            imageView.setImageBitmap(cached);
            return;
        }

        imageView.setImageResource(placeholderResId);
        imageView.setTag(urlStr);

        executor.execute(() -> {
            Bitmap bitmap = downloadBitmap(urlStr);
            if (bitmap != null) {
                memoryCache.put(urlStr, bitmap);
                mainHandler.post(() -> {
                    if (urlStr.equals(imageView.getTag())) {
                        imageView.setImageBitmap(bitmap);
                    }
                });
            }
        });
    }

    private Bitmap downloadBitmap(String urlStr) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setDoInput(true);
            conn.connect();

            InputStream is = conn.getInputStream();
            Bitmap bitmap = BitmapFactory.decodeStream(is);
            is.close();
            return bitmap;
        } catch (Exception e) {
            return null;
        }
    }
}
