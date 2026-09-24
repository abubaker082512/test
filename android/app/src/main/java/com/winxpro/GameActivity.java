package com.winxpro;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class GameActivity extends AppCompatActivity {
    private WebView gameWebView;
    private ProgressBar loadingProgress;
    private TextView tvGameTitle;
    private TextView tvBalance;
    private UserSessionManager sessionManager;
    private String gameId;
    private String gameTitle;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_game);

        sessionManager = new UserSessionManager(this);

        Intent intent = getIntent();
        gameId = intent.getStringExtra("game_id");
        gameTitle = intent.getStringExtra("game_title");
        if (gameTitle == null) gameTitle = "Live Casino Game";

        tvGameTitle = findViewById(R.id.tv_game_stage_title);
        tvBalance = findViewById(R.id.tv_game_stage_balance);
        loadingProgress = findViewById(R.id.game_loading_progress);
        gameWebView = findViewById(R.id.game_webview);
        Button btnBack = findViewById(R.id.btn_back_lobby);
        Button btnReload = findViewById(R.id.btn_reload_game);

        tvGameTitle.setText("🎮 " + gameTitle);
        updateBalanceDisplay();

        btnBack.setOnClickListener(v -> finish());
        btnReload.setOnClickListener(v -> loadGameStream());

        WebSettings settings = gameWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(gameWebView, true);

        gameWebView.setWebChromeClient(new WebChromeClient());
        gameWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                loadingProgress.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                loadingProgress.setVisibility(View.GONE);
            }
        });

        loadGameStream();
    }

    private void updateBalanceDisplay() {
        double bal = sessionManager.getBalance();
        boolean isDemo = sessionManager.isDemoMode();
        tvBalance.setText((isDemo ? "🎮 DEMO: " : "💰 REAL: ") + "Rs " + (int)bal);
    }

    private void loadGameStream() {
        loadingProgress.setVisibility(View.VISIBLE);
        String username = sessionManager.getUsername();
        double money = sessionManager.getBalance();

        NativeApiClient.fetchGameUrl(gameId, username, money, new NativeApiClient.ApiCallback<String>() {
            @Override
            public void onSuccess(String url) {
                loadingProgress.setVisibility(View.GONE);
                if (url != null && url.startsWith("http")) {
                    gameWebView.loadUrl(url);
                } else {
                    Toast.makeText(GameActivity.this, "Stream offline, launching game engine...", Toast.LENGTH_SHORT).show();
                    gameWebView.loadUrl("https://www.winxpro.com.pk/play/" + gameId);
                }
            }

            @Override
            public void onError(String errorMessage) {
                loadingProgress.setVisibility(View.GONE);
                Toast.makeText(GameActivity.this, "Connecting direct stream...", Toast.LENGTH_SHORT).show();
                gameWebView.loadUrl("https://www.winxpro.com.pk/play/" + gameId);
            }
        });
    }

    @Override
    public void onBackPressed() {
        if (gameWebView != null && gameWebView.canGoBack()) {
            gameWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
