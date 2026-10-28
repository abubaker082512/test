import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/app_mode_provider.dart';
import '../providers/games_provider.dart';
import 'main_navigation_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _bootstrapApp();
  }

  Future<void> _bootstrapApp() async {
    final modeProvider = Provider.of<AppModeProvider>(context, listen: false);
    final gamesProvider = Provider.of<GamesProvider>(context, listen: false);

    await Future.delayed(const Duration(milliseconds: 2000));

    if (!mounted) return;
    await gamesProvider.loadGames(modeProvider.isProMode);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, anim1, anim2) => const MainNavigationScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Royal Gold Ambient glow
          Center(
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.gold.withValues(alpha: 0.18),
                    AppColors.amber.withValues(alpha: 0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Glowing Variant 3 Logo Card
                Container(
                  width: 145,
                  height: 145,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: AppColors.gold, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.4),
                        blurRadius: 36,
                        spreadRadius: 3,
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Image.asset(
                    'assets/images/logo.png',
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.sports_esports_rounded,
                      size: 68,
                      color: AppColors.gold,
                    ),
                  ),
                )
                .animate()
                .scale(duration: 800.ms, curve: Curves.easeOutBack)
                .shimmer(delay: 600.ms, duration: 1200.ms, color: AppColors.gold.withValues(alpha: 0.5)),

                const SizedBox(height: 28),

                // Title
                const Text(
                  'EPIC ARENA',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 4.5,
                    color: AppColors.gold,
                  ),
                ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.3, end: 0),

                const SizedBox(height: 8),

                // Subtitle
                Text(
                  'PREMIER ESPORTS & CASUAL GAMING',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2.2,
                    color: AppColors.textSecondary,
                  ),
                ).animate().fadeIn(delay: 600.ms),

                const SizedBox(height: 48),

                // Loading Bar
                SizedBox(
                  width: 180,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: const LinearProgressIndicator(
                      minHeight: 4,
                      backgroundColor: AppColors.surfaceElevated,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                    ),
                  ),
                ).animate().fadeIn(delay: 800.ms),
              ],
            ),
          ),
          // Footer
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'v1.0.0 • ROYAL EDITION',
                style: TextStyle(
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: AppColors.textMuted.withValues(alpha: 0.7),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
