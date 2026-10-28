class UserProfile {
  final String id;
  final String username;
  final String avatarUrl;
  final double arenaCoins;
  final int starGems;
  final int level;
  final String rankTitle;
  final int matchesPlayed;
  final int victories;
  final bool isVip;

  UserProfile({
    required this.id,
    required this.username,
    required this.avatarUrl,
    required this.arenaCoins,
    required this.starGems,
    this.level = 12,
    this.rankTitle = 'Cyber Gladiator',
    this.matchesPlayed = 142,
    this.victories = 89,
    this.isVip = false,
  });

  // Default guest profile
  factory UserProfile.defaultGuest() {
    return UserProfile(
      id: 'player_${DateTime.now().millisecondsSinceEpoch % 100000}',
      username: 'ArenaPlayer',
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200',
      arenaCoins: 5000.0,
      starGems: 150,
      level: 5,
      rankTitle: 'Arena Challenger',
    );
  }

  UserProfile copyWith({
    String? id,
    String? username,
    String? avatarUrl,
    double? arenaCoins,
    int? starGems,
    int? level,
    String? rankTitle,
    int? matchesPlayed,
    int? victories,
    bool? isVip,
  }) {
    return UserProfile(
      id: id ?? this.id,
      username: username ?? this.username,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      arenaCoins: arenaCoins ?? this.arenaCoins,
      starGems: starGems ?? this.starGems,
      level: level ?? this.level,
      rankTitle: rankTitle ?? this.rankTitle,
      matchesPlayed: matchesPlayed ?? this.matchesPlayed,
      victories: victories ?? this.victories,
      isVip: isVip ?? this.isVip,
    );
  }
}
