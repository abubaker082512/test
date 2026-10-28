import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/app_config.dart';
import '../models/game_model.dart';

class CasualGamesService {
  static final CasualGamesService _instance = CasualGamesService._internal();
  factory CasualGamesService() => _instance;
  CasualGamesService._internal();

  List<GameModel> _cachedGames = [];

  List<GameModel> get cachedGames => _cachedGames;

  Future<List<GameModel>> fetchCasualGames({String? category}) async {
    try {
      String url = AppConfig.gamePixFeedUrl;
      if (category != null && category != 'ALL') {
        url = '${AppConfig.gamePixCategoryFeedUrl}${category.toLowerCase()}&pagination=48';
      }

      final response = await http
          .get(Uri.parse(url))
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is Map<String, dynamic> && data['items'] is List) {
          final List items = data['items'];
          final games = items.map((item) => GameModel.fromGamePixJson(item)).toList();
          if (games.isNotEmpty) {
            _cachedGames = games;
            return games;
          }
        }
      }
    } catch (_) {
      // Use verified offline curated pool on any network delay
    }

    return getFallbackCuratedGames(category: category);
  }

  List<GameModel> getFallbackCuratedGames({String? category}) {
    final List<GameModel> verifiedPool = [
      // RACING
      GameModel(
        id: 'curated_moto_x3m',
        title: 'Moto X3M Stunt Bike',
        category: 'RACING',
        thumbnail: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/moto-x3m/embed',
        provider: 'MadPuffers',
        rating: 5.0,
        playsCount: 158000,
        isFeatured: true,
        isTrending: true,
        orientation: 'landscape',
        description: 'Perform extreme backflips and bypass crazy hazards on your stunt motorcycle.',
      ),
      GameModel(
        id: 'curated_drift_dudes',
        title: 'Cyber Drift Dudes 3D',
        category: 'RACING',
        thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/drift-dudes/embed',
        provider: 'EpicArcade Studio',
        rating: 4.9,
        playsCount: 94500,
        isFeatured: true,
        isTrending: true,
        orientation: 'landscape',
        description: 'High-speed multiplayer drift racer across neon cyberpunk tracks.',
      ),
      GameModel(
        id: 'curated_burnout_drift',
        title: 'Burnout Extreme Racing',
        category: 'RACING',
        thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/burnout-extreme-drift/embed',
        provider: 'SpeedCore',
        rating: 4.8,
        playsCount: 72000,
        isFeatured: false,
        isTrending: true,
        orientation: 'landscape',
        description: 'Master custom sports cars with responsive drifting mechanics and nitro.',
      ),

      // PUZZLE
      GameModel(
        id: 'curated_2048',
        title: 'Neon Block 2048',
        category: 'PUZZLE',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/2048/embed',
        provider: 'MindPlay',
        rating: 4.9,
        playsCount: 118900,
        isFeatured: true,
        isTrending: true,
        orientation: 'portrait',
        description: 'Swipe and merge geometric numbers to conquer the ultimate 2048 tile.',
      ),
      GameModel(
        id: 'curated_cut_the_rope',
        title: 'Cut the Rope Magic',
        category: 'PUZZLE',
        thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/cut-the-rope-magic/embed',
        provider: 'ZeptoLab',
        rating: 4.9,
        playsCount: 210000,
        isFeatured: true,
        isTrending: true,
        orientation: 'portrait',
        description: 'Feed Om Nom candy by cutting ropes and solving physics challenges.',
      ),
      GameModel(
        id: 'curated_bubble_shooter',
        title: 'Bubble Shooter Pro',
        category: 'PUZZLE',
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/bubble-shooter/embed',
        provider: 'ArcadeGems',
        rating: 4.7,
        playsCount: 88000,
        isFeatured: false,
        isTrending: true,
        orientation: 'portrait',
        description: 'Match and blast colorful glowing bubbles to clear the screen.',
      ),

      // ACTION & ARCADE
      GameModel(
        id: 'curated_subway_runner',
        title: 'Om Nom Subway Run',
        category: 'ARCADE',
        thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/om-nom-run/embed',
        provider: 'HyperGames',
        rating: 4.9,
        playsCount: 192000,
        isFeatured: true,
        isTrending: true,
        orientation: 'portrait',
        description: 'High-speed endless runner dodging trains, cars, and obstacle courses.',
      ),
      GameModel(
        id: 'curated_space_blaster',
        title: 'Galaxy Space Blaster',
        category: 'ACTION',
        thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/space-blaster/embed',
        provider: 'RetroArcade',
        rating: 4.8,
        playsCount: 81200,
        isFeatured: true,
        isTrending: false,
        orientation: 'portrait',
        description: 'Pilot your starship through meteor showers and laser firefights.',
      ),
      GameModel(
        id: 'curated_flappy_bird',
        title: 'Cyber Flappy Wings',
        category: 'ARCADE',
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/flappy-bird/embed',
        provider: 'PixelCraft',
        rating: 4.6,
        playsCount: 65000,
        isFeatured: false,
        isTrending: true,
        orientation: 'portrait',
        description: 'Tap to flap through neon pipes and set the global high score.',
      ),

      // SPORTS
      GameModel(
        id: 'curated_penalty_shooters',
        title: 'Penalty Shooters 2',
        category: 'SPORTS',
        thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/penalty-shooters-2/embed',
        provider: 'KickOff Games',
        rating: 4.8,
        playsCount: 142100,
        isFeatured: true,
        isTrending: true,
        orientation: 'landscape',
        description: 'Score clutch penalty goals and defend your net against global teams.',
      ),
      GameModel(
        id: 'curated_basketball_stars',
        title: 'Basketball Slam Dunk',
        category: 'SPORTS',
        thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/basketball-stars/embed',
        provider: 'HoopGames',
        rating: 4.7,
        playsCount: 89000,
        isFeatured: false,
        isTrending: true,
        orientation: 'landscape',
        description: 'Show off monster slam dunks, alley-oops, and 3-pointers.',
      ),

      // STRATEGY & BOARD
      GameModel(
        id: 'curated_tower_defense',
        title: 'Kingdom Tower Defense',
        category: 'STRATEGY',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/defense-battle/embed',
        provider: 'StrategyCore',
        rating: 4.8,
        playsCount: 95400,
        isFeatured: true,
        isTrending: true,
        orientation: 'landscape',
        description: 'Deploy cannons, archers, and lightning towers to protect your castle.',
      ),
      GameModel(
        id: 'curated_chess_master',
        title: 'Master Chess 3D',
        category: 'STRATEGY',
        thumbnail: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/master-chess/embed',
        provider: 'Grandmaster Studios',
        rating: 4.9,
        playsCount: 64000,
        isFeatured: false,
        isTrending: false,
        orientation: 'portrait',
        description: 'Challenge smart AI opponents or play 2-player classical chess matches.',
      ),
    ];

    if (category == null || category == 'ALL') {
      return verifiedPool;
    }
    return verifiedPool.where((g) => g.category == category.toUpperCase()).toList();
  }
}
