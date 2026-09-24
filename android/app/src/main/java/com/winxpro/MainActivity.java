package com.winxpro;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.Button;
import android.widget.EditText;
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
    private TextView tvCategoryTitle;
    private TextView tvGameCount;
    private EditText etSearchGame;
    private Button btnLoginAuth;
    private RecyclerView rvGames;
    private GameAdapter gameAdapter;
    private final List<GameItem> currentGames = new ArrayList<>();
    private String selectedCategory = "all";
    private String currentSearchQuery = "";
    private LinearLayout categoryContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        sessionManager = new UserSessionManager(this);

        tvWalletBalance = findViewById(R.id.tv_wallet_balance);
        tvModeTag = findViewById(R.id.tv_mode_tag);
        tvCategoryTitle = findViewById(R.id.tv_category_title);
        tvGameCount = findViewById(R.id.tv_game_count);
        etSearchGame = findViewById(R.id.et_search_game);
        btnLoginAuth = findViewById(R.id.btn_login_auth);
        rvGames = findViewById(R.id.rv_games);
        categoryContainer = findViewById(R.id.category_chips_container);
        android.view.View btnWalletToggle = findViewById(R.id.btn_wallet_toggle);

        rvGames.setLayoutManager(new GridLayoutManager(this, 3));
        rvGames.setHasFixedSize(true);
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

        etSearchGame.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                currentSearchQuery = s.toString();
                loadGames(selectedCategory, currentSearchQuery);
            }
            @Override public void afterTextChanged(Editable s) {}
        });

        setupCategoryChips();
        loadGames("all", "");
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
        String[] categories = {"ALL", "SLOTS", "LIVE", "CARDS", "FISHING", "CRASH", "SPORTS"};
        categoryContainer.removeAllViews();

        for (String cat : categories) {
            Button chip = new Button(this);
            chip.setText(cat);
            chip.setTextSize(11f);
            chip.setPadding(16, 0, 16, 0);

            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    dpToPx(34)
            );
            params.setMargins(4, 0, 4, 0);
            chip.setLayoutParams(params);

            styleCategoryChip(chip, cat.equalsIgnoreCase(selectedCategory));

            chip.setOnClickListener(v -> {
                selectedCategory = cat.toLowerCase();
                setupCategoryChips();
                loadGames(selectedCategory, currentSearchQuery);
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

    private void loadGames(String category, String searchQuery) {
        tvCategoryTitle.setText("🎰 " + category.toUpperCase() + " Games");

        NativeApiClient.fetchGameCatalog(this, category, searchQuery, new NativeApiClient.ApiCallback<List<GameItem>>() {
            @Override
            public void onSuccess(List<GameItem> result) {
                currentGames.clear();
                currentGames.addAll(result);
                gameAdapter.notifyDataSetChanged();
                tvGameCount.setText(result.size() + " Games");
            }

            @Override
            public void onError(String errorMessage) {
                Toast.makeText(MainActivity.this, "Error loading catalog", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onGameClick(GameItem item) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(this, "🔐 Login required to play " + item.getTitle(), Toast.LENGTH_SHORT).show();
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
