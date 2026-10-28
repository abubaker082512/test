import 'package:shared_preferences/shared_preferences.dart';

class CreditCrateModel {
  final String id;
  final String name;
  final int creditAmount;
  final int bonusGems;
  final String tierBadge;
  final bool isPopular;

  CreditCrateModel({
    required this.id,
    required this.name,
    required this.creditAmount,
    required this.bonusGems,
    required this.tierBadge,
    this.isPopular = false,
  });

  static List<CreditCrateModel> get defaultCrates => [
    CreditCrateModel(
      id: 'crate_bronze',
      name: 'Rookie Crate',
      creditAmount: 1000,
      bonusGems: 10,
      tierBadge: 'BRONZE',
    ),
    CreditCrateModel(
      id: 'crate_silver',
      name: 'Gladiator Crate',
      creditAmount: 2500,
      bonusGems: 35,
      tierBadge: 'SILVER',
      isPopular: true,
    ),
    CreditCrateModel(
      id: 'crate_gold',
      name: 'Champion Vault',
      creditAmount: 5000,
      bonusGems: 80,
      tierBadge: 'GOLD',
    ),
    CreditCrateModel(
      id: 'crate_diamond',
      name: 'Royal Legend Vault',
      creditAmount: 10000,
      bonusGems: 250,
      tierBadge: 'ROYAL',
    ),
  ];
}

class DailyQuestModel {
  final String id;
  final String title;
  final String description;
  final int rewardCredits;
  final int targetCount;
  final int currentCount;
  final bool isCompleted;

  DailyQuestModel({
    required this.id,
    required this.title,
    required this.description,
    required this.rewardCredits,
    required this.targetCount,
    required this.currentCount,
    this.isCompleted = false,
  });
}

class WalletService {
  static final WalletService _instance = WalletService._internal();
  factory WalletService() => _instance;
  WalletService._internal();

  static const String _keyDailyClaimDate = 'epicarena_last_daily_claim';
  static const String _keyDailyStreak = 'epicarena_daily_streak';

  Future<bool> canClaimDailyReward() async {
    final prefs = await SharedPreferences.getInstance();
    final lastClaim = prefs.getString(_keyDailyClaimDate);
    if (lastClaim == null) return true;

    final lastDate = DateTime.tryParse(lastClaim);
    if (lastDate == null) return true;

    final now = DateTime.now();
    return now.day != lastDate.day || now.month != lastDate.month || now.year != lastDate.year;
  }

  Future<int> claimDailyReward() async {
    final prefs = await SharedPreferences.getInstance();
    int streak = prefs.getInt(_keyDailyStreak) ?? 0;
    streak = (streak % 7) + 1;

    await prefs.setString(_keyDailyClaimDate, DateTime.now().toIso8601String());
    await prefs.setInt(_keyDailyStreak, streak);

    // Dynamic reward scaling based on streak
    final reward = streak * 500;
    return reward;
  }

  Future<int> getStreakDay() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_keyDailyStreak) ?? 1;
  }

  List<DailyQuestModel> getDailyQuests() {
    return [
      DailyQuestModel(
        id: 'q1',
        title: 'Arena Contender',
        description: 'Play 3 matches in any arcade game',
        rewardCredits: 350,
        targetCount: 3,
        currentCount: 2,
        isCompleted: false,
      ),
      DailyQuestModel(
        id: 'q2',
        title: 'Speed Racer',
        description: 'Complete a racing track with 3 stars',
        rewardCredits: 500,
        targetCount: 1,
        currentCount: 1,
        isCompleted: true,
      ),
      DailyQuestModel(
        id: 'q3',
        title: 'High Scorer',
        description: 'Reach a top 10 score on the leaderboard',
        rewardCredits: 800,
        targetCount: 1,
        currentCount: 0,
        isCompleted: false,
      ),
    ];
  }
}
