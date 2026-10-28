import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_mode_provider.dart';
import '../../providers/games_provider.dart';
import '../../providers/user_provider.dart';
import '../../widgets/banner_carousel.dart';
import '../../widgets/coin_display.dart';
import '../../widgets/game_card.dart';
import '../../widgets/mode_badge.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<AppModeProvider>(context);
    final gamesProvider = Provider.of<GamesProvider>(context);
    final userProvider = Provider.of<UserProvider>(context);

    final isPro = modeProvider.isProMode;
    final categories = gamesProvider.getCategories(isPro);
    final featuredGames = gamesProvider.getFeaturedGames(isPro);
    final trendingGames = gamesProvider.getTrendingGames(isPro);
    final visibleGames = gamesProvider.getVisibleGames(isPro);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.gold, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withValues(alpha: 0.25),
                    blurRadius: 8,
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Image.asset('assets/images/logo.png', fit: BoxFit.cover),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'EPICARENA',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                    color: AppColors.gold,
                  ),
                ),
                Text(
                  isPro ? 'PRO ARENA SUITE' : 'ROYAL GAMING HUB',
                  style: const TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: const [
          ModeBadge(),
          SizedBox(width: 8),
          CoinDisplay(),
          SizedBox(width: 14),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        backgroundColor: AppColors.surface,
        onRefresh: () async {
          await modeProvider.refreshConfig();
          await gamesProvider.loadGames(modeProvider.isProMode);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: [
            // Daily Gift Strip
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                gradient: AppColors.goldGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.gold.withValues(alpha: 0.25),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.stars_rounded, color: Colors.black, size: 28),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Daily Challenger Bonus Available!',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                          ),
                        ),
                        Text(
                          'Claim +250 Arena Credits & +5 Gems',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: AppColors.gold,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () {
                      userProvider.claimDailyBonus();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🎉 Claimed +250 Credits & +5 Gems!'),
                          backgroundColor: AppColors.surfaceElevated,
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                    child: const Text('CLAIM', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Hero Carousel
            BannerCarousel(featuredGames: featuredGames),

            const SizedBox(height: 16),

            // Category Horizontal Tabs
            SizedBox(
              height: 42,
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
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.gold : AppColors.surface,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: isSelected ? AppColors.gold : AppColors.cardBorder,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            cat.icon,
                            size: 16,
                            color: isSelected ? Colors.black : AppColors.gold,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            cat.name,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.black : AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 20),

            // Trending Reel Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.local_fire_department_rounded, color: AppColors.amber, size: 22),
                      SizedBox(width: 6),
                      Text(
                        'TRENDING ARENAS',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                          color: AppColors.gold,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '${trendingGames.length} Games',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Trending Horizontal Reel
            SizedBox(
              height: 215,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: trendingGames.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  return GameCard(game: trendingGames[index], width: 145);
                },
              ),
            ),

            const SizedBox(height: 24),

            // All Category Games Section Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Icon(Icons.grid_view_rounded, color: AppColors.gold, size: 18),
                  const SizedBox(width: 6),
                  Text(
                    'EXPLORE ${gamesProvider.selectedCategory}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // 2-Column Game Grid
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
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

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
