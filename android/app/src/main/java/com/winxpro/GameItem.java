package com.winxpro;

public class GameItem {
    private String id;
    private String title;
    private String provider;
    private String category;
    private String imageUrl;
    private String badge;

    public GameItem(String id, String title, String provider, String category, String imageUrl, String badge) {
        this.id = id;
        this.title = title;
        this.provider = provider;
        this.category = category;
        this.imageUrl = imageUrl;
        this.badge = badge;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getProvider() { return provider; }
    public String getCategory() { return category; }
    public String getImageUrl() { return imageUrl; }
    public String getBadge() { return badge; }
}
