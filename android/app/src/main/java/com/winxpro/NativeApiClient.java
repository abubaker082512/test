package com.winxpro;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NativeApiClient {
    public static final String BASE_URL = "https://www.winxpro.com.pk";
    private static final ExecutorService executor = Executors.newFixedThreadPool(4);
    private static final Handler mainHandler = new Handler(Looper.getMainLooper());
    private static final List<GameItem> allCatalogCache = new ArrayList<>();
    private static boolean isCatalogLoaded = false;

    public interface ApiCallback<T> {
        void onSuccess(T result);
        void onError(String errorMessage);
    }

    public static void fetchGameCatalog(Context context, String category, String searchQuery, ApiCallback<List<GameItem>> callback) {
        executor.execute(() -> {
            try {
                if (!isCatalogLoaded) {
                    loadCatalogFromAssets(context);
                }

                List<GameItem> filtered = new ArrayList<>();
                String catLower = category == null ? "all" : category.toLowerCase();
                String queryLower = searchQuery == null ? "" : searchQuery.toLowerCase().trim();

                for (GameItem item : allCatalogCache) {
                    boolean matchesCategory = catLower.equals("all");

                    if (!matchesCategory) {
                        String itemCat = item.getCategory().toLowerCase();
                        String itemTitle = item.getTitle().toLowerCase();

                        if (catLower.equals("slots")) {
                            matchesCategory = itemCat.contains("slot") || itemCat.contains("slots");
                        } else if (catLower.equals("live")) {
                            matchesCategory = itemCat.contains("live") || itemCat.contains("casino") || itemTitle.contains("roulette") || itemTitle.contains("baccarat") || itemTitle.contains("blackjack");
                        } else if (catLower.equals("cards")) {
                            matchesCategory = itemCat.contains("card") || itemCat.contains("poker") || itemCat.contains("table");
                        } else if (catLower.equals("fishing")) {
                            matchesCategory = itemCat.contains("fish") || itemCat.contains("fishing");
                        } else if (catLower.equals("crash")) {
                            matchesCategory = itemCat.contains("crash") || itemTitle.contains("aviator") || itemTitle.contains("spribe");
                        } else if (catLower.equals("sports")) {
                            matchesCategory = itemCat.contains("sport") || itemCat.contains("sports") || itemTitle.contains("soccer") || itemTitle.contains("cricket");
                        } else {
                            matchesCategory = itemCat.contains(catLower);
                        }
                    }

                    boolean matchesSearch = queryLower.isEmpty() ||
                            item.getTitle().toLowerCase().contains(queryLower) ||
                            item.getProvider().toLowerCase().contains(queryLower);

                    if (matchesCategory && matchesSearch) {
                        filtered.add(item);
                    }
                }

                mainHandler.post(() -> callback.onSuccess(filtered));
            } catch (Exception e) {
                mainHandler.post(() -> callback.onError("Failed to load catalog: " + e.getLocalizedMessage()));
            }
        });
    }

    private synchronized static void loadCatalogFromAssets(Context context) {
        if (isCatalogLoaded) return;
        try {
            InputStream is = context.getAssets().open("betnexCatalog.json");
            BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();

            JSONArray jsonArray = new JSONArray(sb.toString());
            for (int i = 0; i < jsonArray.length(); i++) {
                JSONObject obj = jsonArray.getJSONObject(i);
                String id = obj.optString("id", obj.optString("slug", "game_" + i));
                String title = obj.optString("title", obj.optString("name", "Casino Game"));
                String provider = obj.optString("provider", obj.optString("rawProvider", "BETNEX"));
                String category = obj.optString("category", "Slots");
                String imageUrl = obj.optString("imageUrl", obj.optString("image", ""));
                String badge = obj.optString("badge", "HOT");

                allCatalogCache.add(new GameItem(id, title, provider, category, imageUrl, badge));
            }
            isCatalogLoaded = true;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static int getTotalGameCount() {
        return allCatalogCache.size();
    }

    public static void fetchGameUrl(String gameId, String username, double money, ApiCallback<String> callback) {
        executor.execute(() -> {
            try {
                URL url = new URL(BASE_URL + "/api/rapid/getGameUrl");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(6000);
                conn.setReadTimeout(6000);

                JSONObject payload = new JSONObject();
                payload.put("gameId", gameId);
                payload.put("username", username.replaceAll("[^a-zA-Z0-9]", ""));
                payload.put("money", money);
                payload.put("currency", "PKR");
                payload.put("lang", "en");

                OutputStream os = conn.getOutputStream();
                os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                os.flush();
                os.close();

                int code = conn.getResponseCode();
                InputStream is = (code == HttpURLConnection.HTTP_OK) ? conn.getInputStream() : conn.getErrorStream();
                BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                JSONObject resJson = new JSONObject(sb.toString());
                if (resJson.optBoolean("success", false) && resJson.has("gameUrl")) {
                    String gameUrl = resJson.getString("gameUrl");
                    mainHandler.post(() -> callback.onSuccess(gameUrl));
                } else {
                    String err = resJson.optString("error", "Failed to retrieve game stream URL");
                    mainHandler.post(() -> callback.onError(err));
                }
            } catch (Exception e) {
                mainHandler.post(() -> callback.onError("Network connection issue: " + e.getLocalizedMessage()));
            }
        });
    }
}
