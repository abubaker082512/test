package com.winxpro;

import android.content.Context;
import android.content.SharedPreferences;

public class UserSessionManager {
    private static final String PREF_NAME = "WinXProUserSession";
    private static final String KEY_IS_LOGGED_IN = "is_logged_in";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USERNAME = "username";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_BALANCE = "balance";
    private static final String KEY_IS_DEMO = "is_demo";

    private final SharedPreferences prefs;

    public UserSessionManager(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    public void saveSession(String userId, String username, String email, double balance) {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(KEY_IS_LOGGED_IN, true);
        editor.putString(KEY_USER_ID, userId);
        editor.putString(KEY_USERNAME, username);
        editor.putString(KEY_EMAIL, email);
        editor.putFloat(KEY_BALANCE, (float) balance);
        editor.apply();
    }

    public boolean isLoggedIn() {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false);
    }

    public String getUserId() {
        return prefs.getString(KEY_USER_ID, "");
    }

    public String getUsername() {
        return prefs.getString(KEY_USERNAME, "Player");
    }

    public String getEmail() {
        return prefs.getString(KEY_EMAIL, "player@winxpro.com.pk");
    }

    public double getBalance() {
        return prefs.getFloat(KEY_BALANCE, 10000.0f);
    }

    public void setBalance(double balance) {
        prefs.edit().putFloat(KEY_BALANCE, (float) balance).apply();
    }

    public boolean isDemoMode() {
        return prefs.getBoolean(KEY_IS_DEMO, true);
    }

    public void setDemoMode(boolean isDemo) {
        prefs.edit().putBoolean(KEY_IS_DEMO, isDemo).apply();
    }

    public void logout() {
        prefs.edit().clear().apply();
    }
}
