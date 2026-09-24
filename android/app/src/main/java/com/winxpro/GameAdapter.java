package com.winxpro;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class GameAdapter extends RecyclerView.Adapter<GameAdapter.GameViewHolder> {

    public interface OnGameClickListener {
        void onGameClick(GameItem item);
    }

    private final List<GameItem> gameList;
    private final OnGameClickListener listener;

    public GameAdapter(List<GameItem> gameList, OnGameClickListener listener) {
        this.gameList = gameList;
        this.listener = listener;
    }

    @NonNull
    @Override
    public GameViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_game, parent, false);
        return new GameViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull GameViewHolder holder, int position) {
        GameItem item = gameList.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvProvider.setText(item.getProvider());

        if (item.getBadge() != null && !item.getBadge().isEmpty()) {
            holder.tvBadge.setText("🔥 " + item.getBadge());
            holder.tvBadge.setVisibility(View.VISIBLE);
        } else {
            holder.tvBadge.setVisibility(View.GONE);
        }

        ImageLoader.getInstance().loadImage(item.getImageUrl(), holder.imgIcon, R.drawable.app_logo);

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onGameClick(item);
            }
        });
    }

    @Override
    public int getItemCount() {
        return gameList.size();
    }

    static class GameViewHolder extends RecyclerView.ViewHolder {
        ImageView imgIcon;
        TextView tvProvider;
        TextView tvBadge;
        TextView tvTitle;

        public GameViewHolder(@NonNull View itemView) {
            super(itemView);
            imgIcon = itemView.findViewById(R.id.img_game_icon);
            tvProvider = itemView.findViewById(R.id.tv_provider_badge);
            tvBadge = itemView.findViewById(R.id.tv_badge_tag);
            tvTitle = itemView.findViewById(R.id.tv_game_title);
        }
    }
}
