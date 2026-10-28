enum GameModeType {
  casual,
  proArena,
}

class GameModel {
  final String id;
  final String title;
  final String category;
  final String thumbnail;
  final String playUrl;
  final String provider;
  final double rating;
  final int playsCount;
  final bool isFeatured;
  final bool isTrending;
  final bool isProGame;
  final String? bannerUrl;
  final String? description;
  final String orientation; // 'portrait', 'landscape', or 'all'

  GameModel({
    required this.id,
    required this.title,
    required this.category,
    required this.thumbnail,
    required this.playUrl,
    required this.provider,
    this.rating = 4.8,
    this.playsCount = 1250,
    this.isFeatured = false,
    this.isTrending = false,
    this.isProGame = false,
    this.bannerUrl,
    this.description,
    this.orientation = 'all',
  });

  // Factory constructor for GamePix Casual Games Feed
  factory GameModel.fromGamePixJson(Map<String, dynamic> json) {
    return GameModel(
      id: json['id']?.toString() ?? json['sid']?.toString() ?? UniqueKey().toString(),
      title: json['title'] ?? 'Arcade Game',
      category: (json['category'] ?? 'Arcade').toString().toUpperCase(),
      thumbnail: json['thumbnailUrl'] ?? json['image'] ?? json['bannerUrl'] ?? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500',
      playUrl: json['url'] ?? json['gameUrl'] ?? '',
      provider: 'GamePix Studio',
      rating: (json['rating'] != null) ? (double.tryParse(json['rating'].toString()) ?? 4.8) : 4.8,
      playsCount: (json['plays'] != null) ? (int.tryParse(json['plays'].toString()) ?? 1500) : 1500,
      isFeatured: json['featured'] == true,
      description: json['description'],
      orientation: json['orientation'] ?? 'all',
      isProGame: false,
    );
  }

  // Factory constructor for Pro Arena Games (ScorpioPlay / PaddyPower / Backend API)
  factory GameModel.fromProJson(Map<String, dynamic> json) {
    return GameModel(
      id: json['id']?.toString() ?? json['game_id']?.toString() ?? UniqueKey().toString(),
      title: json['name'] ?? json['title'] ?? 'Arena Game',
      category: (json['category'] ?? json['type'] ?? 'PRO ARENA').toString().toUpperCase(),
      thumbnail: json['image'] ?? json['thumbnail'] ?? json['banner'] ?? 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500',
      playUrl: json['launch_url'] ?? json['url'] ?? json['play_url'] ?? '',
      provider: json['provider'] ?? 'ScorpioPlay',
      rating: 4.9,
      playsCount: 3400,
      isFeatured: json['is_featured'] == true || json['popular'] == true,
      isTrending: true,
      isProGame: true,
      description: json['description'],
      orientation: json['orientation'] ?? 'landscape',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'category': category,
      'thumbnail': thumbnail,
      'playUrl': playUrl,
      'provider': provider,
      'rating': rating,
      'playsCount': playsCount,
      'isFeatured': isFeatured,
      'isTrending': isTrending,
      'isProGame': isProGame,
      'bannerUrl': bannerUrl,
      'description': description,
      'orientation': orientation,
    };
  }
}

class UniqueKey {
  static int _counter = 0;
  @override
  String toString() => 'game_${++_counter}';
}
