import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_mode_provider.dart';
import '../../providers/games_provider.dart';
import '../../widgets/coin_display.dart';
import '../../widgets/game_card.dart';

class GamesHubScreen extends StatelessWidget {
  const GamesHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<AppModeProvider>(context);
    final gamesProvider = Provider.of<GamesProvider>(context);
    final isPro = modeProvider.isProMode;
    final categories = gamesProvider.getCategories(isPro);
    final visibleGames = gamesProvider.getVisibleGames(isPro);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('GAMES HUB'),
        actions: const [
          CoinDisplay(),
          SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Search Input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              style: const TextStyle(color: Colors.white, fontSize: 14),
              onChanged: (val) => gamesProvider.setSearchQuery(val),
              decoration: InputDecoration(
                hintText: 'Search 1,000+ games & arenas...',
                hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                prefixIcon: const Icon(Icons.search_rounded, color: AppColors.gold, size: 20),
                suffixIcon: gamesProvider.searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 18),
                        onPressed: () => gamesProvider.setSearchQuery(''),
                      )
                    : null,
                filled: true,
                fillColor: AppColors.surface,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppColors.cardBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppColors.gold),
                ),
              ),
            ),
          ),

          // Horizontal Category Filter
          SizedBox(
            height: 40,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final cat = categories[index];
                final isSelected = gamesProvider.selectedCategory == cat.id;

                return GestureDetector(
                  onTap: () => gamesProvider.selectCategory(cat.id),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.gold : AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? AppColors.gold : AppColors.cardBorder,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        cat.name,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.black : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 12),

          // Results counter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Showing ${visibleGames.length} available arenas',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
                Text(
                  isPro ? '👑 ROYAL PRO ACTIVE' : '🕹️ CASUAL ARCADE',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppColors.gold,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 4),

          // Main Grid
          Expanded(
            child: visibleGames.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.sports_esports_outlined, size: 56, color: AppColors.textMuted),
                        const SizedBox(height: 12),
                        const Text(
                          'No games found matching your search',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                        ),
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: () {
                            gamesProvider.setSearchQuery('');
                            gamesProvider.selectCategory('ALL');
                          },
                          child: const Text('Reset Filters', style: TextStyle(color: AppColors.gold)),
                        ),
                      ],
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: visibleGames.length,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.76,
                    ),
                    itemBuilder: (context, index) {
                      return GameCard(game: visibleGames[index]);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
