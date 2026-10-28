import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_mode_provider.dart';
import '../../providers/games_provider.dart';
import '../../widgets/coin_display.dart';
import '../player/game_player_screen.dart';

class TournamentsScreen extends StatelessWidget {
  const TournamentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<AppModeProvider>(context);
    final gamesProvider = Provider.of<GamesProvider>(context);
    final isPro = modeProvider.isProMode;
    final featuredGames = gamesProvider.getFeaturedGames(isPro);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('ARENA CHAMPIONSHIPS'),
        actions: const [
          CoinDisplay(),
          SizedBox(width: 16),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Grand Championship Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.goldGradient,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.35),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.circle, color: Colors.redAccent, size: 8),
                          SizedBox(width: 6),
                          Text(
                            'LIVE CHAMPIONSHIP',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                    const Text(
                      'ENDS IN 04:12:35',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  isPro ? 'ROYAL PRO GRAND SLAM' : 'ARCADE MASTERS LEAGUE',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Guaranteed Prize Pool: 500,000 ARENA CREDITS',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Active Tournaments
          const Text(
            'ACTIVE ARENA MATCHES',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 12),

          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: featuredGames.take(4).length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final game = featuredGames[index];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        game.thumbnail,
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(width: 70, height: 70, color: AppColors.surfaceElevated),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            game.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Entry: Free  •  Prize: 25,000 Credits',
                            style: TextStyle(fontSize: 11, color: AppColors.gold, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.people_alt_rounded, size: 12, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Text(
                                '${game.playsCount} Challengers',
                                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => GamePlayerScreen(game: game),
                          ),
                        );
                      },
                      child: const Text('JOIN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 24),

          // Leaderboard Section
          const Text(
            'ROYAL HALL OF FAME',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 12),

          _buildLeaderboardRow(1, 'CrownViper_99', '142,500 Credits', AppColors.gold),
          _buildLeaderboardRow(2, 'ShadowNexus', '98,200 Credits', const Color(0xFFE0E0E0)),
          _buildLeaderboardRow(3, 'PixelLegend_PK', '76,400 Credits', AppColors.bronze),
          _buildLeaderboardRow(4, 'GladiatorKhan', '54,100 Credits', AppColors.textSecondary),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildLeaderboardRow(int rank, String username, String credits, Color rankColor) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: rankColor.withValues(alpha: 0.2),
              shape: BoxShape.circle,
              border: Border.all(color: rankColor, width: 1.5),
            ),
            child: Center(
              child: Text(
                '$rank',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: rankColor),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              username,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
          Text(
            credits,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.gold),
          ),
        ],
      ),
    );
  }
}
