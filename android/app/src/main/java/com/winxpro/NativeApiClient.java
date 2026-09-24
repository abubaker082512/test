package com.winxpro;

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

    public interface ApiCallback<T> {
        void onSuccess(T result);
        void onError(String errorMessage);
    }

    public static void fetchGameCatalog(String category, ApiCallback<List<GameItem>> callback) {
        executor.execute(() -> {
            try {
                URL url = new URL(BASE_URL + "/api/games");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                int responseCode = conn.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    InputStream is = conn.getInputStream();
                    BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject json = new JSONObject(sb.toString());
                    JSONArray gamesArray = json.optJSONArray("games");
                    List<GameItem> gameList = new ArrayList<>();

                    if (gamesArray != null) {
                        for (int i = 0; i < gamesArray.length(); i++) {
                            JSONObject item = gamesArray.getJSONObject(i);
                            String id = item.optString("id", "game_" + i);
                            String title = item.optString("name", item.optString("title", "Casino Game"));
                            String provider = item.optString("provider", "JILI");
                            String cat = item.optString("category", "slots");
                            String image = item.optString("image", item.optString("thumbnail", ""));
                            String badge = item.optString("badge", "HOT");

                            if (category == null || category.equalsIgnoreCase("all") || cat.equalsIgnoreCase(category)) {
                                gameList.add(new GameItem(id, title, provider, cat, image, badge));
                            }
                        }
                    }

                    if (gameList.isEmpty()) {
                        gameList = getFallbackGames(category);
                    }

                    List<GameItem> finalResult = gameList;
                    mainHandler.post(() -> callback.onSuccess(finalResult));
                } else {
                    List<GameItem> fallbacks = getFallbackGames(category);
                    mainHandler.post(() -> callback.onSuccess(fallbacks));
                }
            } catch (Exception e) {
                List<GameItem> fallbacks = getFallbackGames(category);
                mainHandler.post(() -> callback.onSuccess(fallbacks));
            }
        });
    }

    public static void fetchGameUrl(String gameId, String username, double money, ApiCallback<String> callback) {
        executor.execute(() -> {
            try {
                URL url = new URL(BASE_URL + "/api/rapid/getGameUrl");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

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
                    String err = resJson.optString("error", "Failed to retrieve game URL");
                    mainHandler.post(() -> callback.onError(err));
                }
            } catch (Exception e) {
                mainHandler.post(() -> callback.onError("Network error: " + e.getLocalizedMessage()));
            }
        });
    }

    private static List<GameItem> getFallbackGames(String category) {
        List<GameItem> list = new ArrayList<>();
        list.add(new GameItem("super-ace", "Super Ace", "JILI", "slots", "", "HOT"));
        list.add(new GameItem("fortune-gems", "Fortune Gems", "JILI", "slots", "", "TOP"));
        list.add(new GameItem("mahjong-ways-2", "Mahjong Ways 2", "PG SOFT", "slots", "", "POPULAR"));
        list.add(new GameItem("wild-bounty-showdown", "Wild Bounty", "PG SOFT", "slots", "", "HOT"));
        list.add(new GameItem("crash-aviator", "Aviator Crash", "SPRIBE", "crash", "", "VIP"));
        list.add(new GameItem("fishing-joy", "Fishing Joy", "CQ9", "fishing", "", "HOT"));
        list.add(new GameItem("roulette-royal", "Royal Roulette", "EVOLUTION", "live", "", "LIVE"));
        list.add(new GameItem("blackjack-vip", "VIP Blackjack", "EVOLUTION", "live", "", "VIP"));
        list.add(new GameItem("baccarat-dragon", "Dragon Baccarat", "SEXY LIVE", "live", "", "LIVE"));
        list.add(new GameItem("poker-texas", "Texas Hold'em", "KINGMIDAS", "cards", "", "POPULAR"));
        list.add(new GameItem("plinko-multiplier", "Plinko", "BGAMING", "mini", "", "HOT"));
        list.add(new GameItem("minesweeper-pro", "Mines Gold", "SPRIBE", "mini", "", "TOP"));
        return list;
    }
}
