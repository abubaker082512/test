package com.winxpro;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity implements GameAdapter.OnGameClickListener {

    private UserSessionManager sessionManager;
    private TextView tvWalletBalance;
    private TextView tvModeTag;
    private Button btnLoginAuth;
    private RecyclerView rvGames;
    private GameAdapter gameAdapter;
    private List<GameItem> currentGames = new ArrayList<>();
    private String selectedCategory = "all";
    private LinearLayout categoryContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        sessionManager = new UserSessionManager(this);

        tvWalletBalance = findViewById(R.id.tv_wallet_balance);
        tvModeTag = findViewById(R.id.tv_mode_tag);
        btnLoginAuth = findViewById(R.id.btn_login_auth);
        rvGames = findViewById(R.id.rv_games);
        categoryContainer = findViewById(R.id.category_chips_container);
        View btnWalletToggle = findViewById(R.id.btn_wallet_toggle);

        rvGames.setLayoutManager(new GridLayoutManager(this, 3));
        gameAdapter = new GameAdapter(currentGames, this);
        rvGames.setAdapter(gameAdapter);

        updateUserHeader();

        btnWalletToggle.setOnClickListener(v -> {
            boolean isDemo = sessionManager.isDemoMode();
            sessionManager.setDemoMode(!isDemo);
            updateUserHeader();
            Toast.makeText(this, !isDemo ? "Switched to DEMO Mode" : "Switched to REAL Mode", Toast.LENGTH_SHORT).show();
        });

        btnLoginAuth.setOnClickListener(v -> showAuthModal());

        setupCategoryChips();
        loadGames("all");
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateUserHeader();
    }

    private void updateUserHeader() {
        boolean loggedIn = sessionManager.isLoggedIn();
        if (loggedIn) {
            btnLoginAuth.setText(sessionManager.getUsername());
            btnLoginAuth.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.cardColor));
            btnLoginAuth.setTextColor(ContextCompat.getColor(this, R.color.accentColor));
        } else {
            btnLoginAuth.setText("Login");
            btnLoginAuth.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.btnPrimary));
            btnLoginAuth.setTextColor(ContextCompat.getColor(this, R.color.btnPrimaryText));
        }

        boolean isDemo = sessionManager.isDemoMode();
        tvModeTag.setText(isDemo ? "🎮 DEMO" : "💰 REAL");
        double bal = sessionManager.getBalance();
        tvWalletBalance.setText("Rs " + (int)bal);
    }

    private void showAuthModal() {
        AuthDialogFragment dialog = AuthDialogFragment.newInstance(this::updateUserHeader);
        dialog.show(getSupportFragmentManager(), "AuthDialog");
    }

    private void setupCategoryChips() {
        String[] categories = {"ALL", "SLOTS", "LIVE", "CARDS", "FISHING", "CRASH", "MINI"};
        categoryContainer.removeAllViews();

        for (String cat : categories) {
            Button chip = new Button(this);
            chip.setText(cat);
            chip.setTextSize(11f);
            chip.setPadding(20, 0, 20, 0);

            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    dpToPx(36)
            );
            params.setMargins(6, 0, 6, 0);
            chip.setLayoutParams(params);

            styleCategoryChip(chip, cat.equalsIgnoreCase(selectedCategory));

            chip.setOnClickListener(v -> {
                selectedCategory = cat.toLowerCase();
                setupCategoryChips();
                loadGames(selectedCategory);
            });

            categoryContainer.addView(chip);
        }
    }

    private void styleCategoryChip(Button chip, boolean isSelected) {
        if (isSelected) {
            chip.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.btnPrimary));
            chip.setTextColor(ContextCompat.getColor(this, R.color.btnPrimaryText));
        } else {
            chip.setBackgroundTintList(ContextCompat.getColorStateList(this, R.color.cardColor));
            chip.setTextColor(ContextCompat.getColor(this, R.color.textColor));
        }
    }

    private void loadGames(String category) {
        NativeApiClient.fetchGameCatalog(category, new NativeApiClient.ApiCallback<List<GameItem>>() {
            @Override
            public void onSuccess(List<GameItem> result) {
                currentGames.clear();
                currentGames.addAll(result);
                gameAdapter.notifyDataSetChanged();
            }

            @Override
            public void onError(String errorMessage) {
                Toast.makeText(MainActivity.this, "Failed to update catalog", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onGameClick(GameItem item) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(this, "🔐 Please log in to play " + item.getTitle(), Toast.LENGTH_SHORT).show();
            showAuthModal();
            return;
        }

        Intent intent = new Intent(this, GameActivity.class);
        intent.putExtra("game_id", item.getId());
        intent.putExtra("game_title", item.getTitle());
        startActivity(intent);
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }
}
