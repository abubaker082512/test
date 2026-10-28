import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/constants/app_colors.dart';
import '../providers/app_mode_provider.dart';

class ModeBadge extends StatefulWidget {
  const ModeBadge({super.key});

  @override
  State<ModeBadge> createState() => _ModeBadgeState();
}

class _ModeBadgeState extends State<ModeBadge> {
  int _tapCount = 0;

  void _handleTap(BuildContext context) {
    _tapCount++;
    if (_tapCount >= 5) {
      _tapCount = 0;
      _showDevModeDialog(context);
    }
  }

  void _showDevModeDialog(BuildContext context) {
    final modeProvider = Provider.of<AppModeProvider>(context, listen: false);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.gold),
        ),
        title: const Text(
          '👑 Dynamic Mode Switcher',
          style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Switch between Casual Mode and Pro Arena Mode locally for testing:',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.sports_esports_rounded, color: AppColors.gold),
              title: const Text('Casual Gaming Mode', style: TextStyle(color: Colors.white)),
              subtitle: const Text('HTML5 arcade & puzzle games pool', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
              trailing: (!modeProvider.isProMode) ? const Icon(Icons.check_circle, color: AppColors.gold) : null,
              onTap: () {
                modeProvider.toggleMode(false);
                Navigator.of(ctx).pop();
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.local_fire_department_rounded, color: AppColors.amber),
              title: const Text('Pro Arena Mode', style: TextStyle(color: Colors.white)),
              subtitle: const Text('Full Scorpio & Tournament suite', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
              trailing: (modeProvider.isProMode) ? const Icon(Icons.check_circle, color: AppColors.amber) : null,
              onTap: () {
                modeProvider.toggleMode(true);
                Navigator.of(ctx).pop();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Close', style: TextStyle(color: AppColors.textSecondary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final modeProvider = Provider.of<AppModeProvider>(context);
    final isPro = modeProvider.isProMode;

    return GestureDetector(
      onTap: () => _handleTap(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isPro ? AppColors.amber.withValues(alpha: 0.15) : AppColors.gold.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isPro ? AppColors.amber : AppColors.gold,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isPro ? AppColors.amber : AppColors.gold,
              ),
            ),
            const SizedBox(width: 5),
            Text(
              isPro ? 'PRO ARENA' : 'CASUAL ARENA',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: isPro ? AppColors.amber : AppColors.gold,
                letterSpacing: 0.8,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
