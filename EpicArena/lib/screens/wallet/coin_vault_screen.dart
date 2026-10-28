import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/user_provider.dart';
import '../../services/wallet_service.dart';

class CoinVaultScreen extends StatefulWidget {
  const CoinVaultScreen({super.key});

  @override
  State<CoinVaultScreen> createState() => _CoinVaultScreenState();
}

class _CoinVaultScreenState extends State<CoinVaultScreen> {
  final WalletService _walletService = WalletService();
  bool _canClaimDaily = true;
  int _streakDay = 1;
  bool _isSpinning = false;
  double _wheelAngle = 0;

  @override
  void initState() {
    super.initState();
    _loadDailyStatus();
  }

  Future<void> _loadDailyStatus() async {
    final canClaim = await _walletService.canClaimDailyReward();
    final streak = await _walletService.getStreakDay();
    if (mounted) {
      setState(() {
        _canClaimDaily = canClaim;
        _streakDay = streak;
      });
    }
  }

  Future<void> _claimDailyStreak() async {
    if (!_canClaimDaily) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You have already claimed today\'s bonus! Come back tomorrow.'),
          backgroundColor: AppColors.surfaceElevated,
        ),
      );
      return;
    }

    final reward = await _walletService.claimDailyReward();
    if (!mounted) return;
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    await userProvider.addCoins(reward.toDouble());

    setState(() {
      _canClaimDaily = false;
      _streakDay = (_streakDay % 7) + 1;
    });

    if (mounted) {
      _showRewardDialog(
        title: '🎉 Daily Streak Bonus!',
        amount: reward,
        subtitle: 'Day $_streakDay streak bonus claimed successfully.',
      );
    }
  }

  Future<void> _claimCrate(CreditCrateModel crate) async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    await userProvider.addCoins(crate.creditAmount.toDouble());

    if (mounted) {
      _showRewardDialog(
        title: '📦 ${crate.name} Unlocked!',
        amount: crate.creditAmount,
        subtitle: '+${crate.bonusGems} Gems added to your royal vault.',
      );
    }
  }

  void _spinLuckyWheel() {
    if (_isSpinning) return;

    setState(() => _isSpinning = true);

    final random = Random();
    final extraTurns = 5 + random.nextInt(5);
    final randomAngle = (random.nextDouble() * 2 * pi);
    final totalRotation = (extraTurns * 2 * pi) + randomAngle;

    final rewards = [500, 1000, 1500, 2500, 5000, 750];
    final wonReward = rewards[random.nextInt(rewards.length)];

    setState(() {
      _wheelAngle += totalRotation;
    });

    Future.delayed(const Duration(milliseconds: 2200), () async {
      if (!mounted) return;
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      await userProvider.addCoins(wonReward.toDouble());

      setState(() => _isSpinning = false);

      _showRewardDialog(
        title: '🎡 Lucky Wheel Victory!',
        amount: wonReward,
        subtitle: 'Congratulations! You won the lucky wheel jackpot.',
      );
    });
  }

  void _showRewardDialog({required String title, required int amount, required String subtitle}) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
        title: Text(title, style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.stars_rounded, color: AppColors.gold, size: 56),
            ),
            const SizedBox(height: 16),
            Text(
              '+${NumberFormat('#,###').format(amount)} CREDITS',
              style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
              minimumSize: const Size(double.infinity, 44),
            ),
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('CLAIM REWARD', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    final formatter = NumberFormat('#,###');
    final quests = _walletService.getDailyQuests();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('ROYAL REWARD VAULT'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Total Balance Showcase Card
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: AppColors.goldGradient,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: AppColors.gold.withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'TOTAL ARENA CREDITS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        color: Colors.black87,
                      ),
                    ),
                    Icon(Icons.military_tech_rounded, color: Colors.black87, size: 24),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      formatter.format(userProvider.profile.arenaCoins),
                      style: const TextStyle(
                        fontSize: 34,
                        fontWeight: FontWeight.w900,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'CREDITS',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.diamond_rounded, color: Colors.black, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            '${userProvider.profile.starGems} Arena Gems',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Lucky Spin Banner Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                AnimatedRotation(
                  turns: _wheelAngle / (2 * pi),
                  duration: const Duration(milliseconds: 2000),
                  curve: Curves.easeOutBack,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.gold),
                    ),
                    child: const Icon(Icons.casino_rounded, color: AppColors.gold, size: 36),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'LUCKY REWARD WHEEL',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.gold),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Spin for up to +5,000 free Arena Credits!',
                        style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: _isSpinning ? null : _spinLuckyWheel,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text(
                          _isSpinning ? 'SPINNING...' : 'FREE SPIN NOW',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Daily Streak Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '7-DAY LOGIN STREAK',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                  color: AppColors.textPrimary,
                ),
              ),
              GestureDetector(
                onTap: _claimDailyStreak,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _canClaimDaily ? AppColors.gold : AppColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _canClaimDaily ? 'CLAIM TODAY' : 'CLAIMED',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: _canClaimDaily ? Colors.black : AppColors.textMuted,
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // 7-day horizontal bar
          SizedBox(
            height: 90,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 7,
              itemBuilder: (context, index) {
                final day = index + 1;
                final isCurrent = day == _streakDay;
                final isPast = day < _streakDay;
                final rewardAmount = day * 500;

                return Container(
                  width: 72,
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppColors.gold.withValues(alpha: 0.15)
                        : (isPast ? AppColors.surfaceElevated : AppColors.surface),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isCurrent ? AppColors.gold : (isPast ? AppColors.emerald : AppColors.cardBorder),
                      width: isCurrent ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Day $day',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isCurrent ? AppColors.gold : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Icon(
                        isPast ? Icons.check_circle_rounded : Icons.card_giftcard_rounded,
                        color: isPast ? AppColors.emerald : (isCurrent ? AppColors.gold : AppColors.textMuted),
                        size: 20,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '+$rewardAmount',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 24),

          // Free Tier Crates Section
          const Text(
            'CLAIM FREE ARENA CRATES',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 12),

          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: CreditCrateModel.defaultCrates.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.15,
            ),
            itemBuilder: (context, index) {
              final crate = CreditCrateModel.defaultCrates[index];

              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: crate.isPopular ? AppColors.gold : AppColors.cardBorder,
                    width: crate.isPopular ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          crate.name,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.gold.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            crate.tierBadge,
                            style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.gold),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        const Icon(Icons.stars_rounded, color: AppColors.gold, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          '+${formatter.format(crate.creditAmount)}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.gold,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '+${crate.bonusGems} Gems',
                          style: const TextStyle(fontSize: 10, color: AppColors.amber, fontWeight: FontWeight.w600),
                        ),
                        GestureDetector(
                          onTap: () => _claimCrate(crate),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.gold,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'OPEN',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 24),

          // Daily Quests
          const Text(
            'DAILY QUEST REWARDS',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 12),

          ...quests.map((quest) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Row(
                children: [
                  Icon(
                    quest.isCompleted ? Icons.check_circle_rounded : Icons.pending_rounded,
                    color: quest.isCompleted ? AppColors.emerald : AppColors.gold,
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          quest.title,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          quest.description,
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Text(
                      '+${quest.rewardCredits}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.gold),
                    ),
                  ),
                ],
              ),
            );
          }),

          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
