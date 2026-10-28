import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/app_config.dart';
import '../models/game_model.dart';
import 'remote_config_service.dart';

class ProGamesService {
  static final ProGamesService _instance = ProGamesService._internal();
  factory ProGamesService() => _instance;
  ProGamesService._internal();

  List<GameModel> _cachedProGames = [];

  List<GameModel> get cachedProGames => _cachedProGames;

  Future<List<GameModel>> fetchProGames({String? category}) async {
    final baseUrl = RemoteConfigService().baseUrl;
    try {
      final response = await http
          .get(Uri.parse('$baseUrl${AppConfig.scorpioPlayGamesEndpoint}'))
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List) {
          final games = data.map((item) => GameModel.fromProJson(item)).toList();
          if (games.isNotEmpty) {
            _cachedProGames = games;
            return games;
          }
        } else if (data is Map && data['games'] is List) {
          final List list = data['games'];
          final games = list.map((item) => GameModel.fromProJson(item)).toList();
          if (games.isNotEmpty) {
            _cachedProGames = games;
            return games;
          }
        }
      }
    } catch (_) {
      // Use fallback Pro catalog
    }

    return getFallbackProGames(category: category);
  }

  List<GameModel> getFallbackProGames({String? category}) {
    final List<GameModel> fallback = [
      GameModel(
        id: 'pro_scorpio_1',
        title: 'Scorpio Gold Arena',
        category: 'SCORPIO',
        thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://demo.evoplay.games/demo/full/html5/evoplay/dungeon-immortal-evil',
        provider: 'ScorpioPlay',
        rating: 4.9,
        playsCount: 78000,
        isFeatured: true,
        isTrending: true,
        isProGame: true,
        orientation: 'landscape',
        description: 'Elite Scorpio tournament arena featuring multiplier wheels and jackpot drops.',
      ),
      GameModel(
        id: 'pro_crash_1',
        title: 'Rocket Multiplier Crash X',
        category: 'CRASH',
        thumbnail: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/drift-dudes/embed',
        provider: 'Epic Crash Engine',
        rating: 5.0,
        playsCount: 94000,
        isFeatured: true,
        isTrending: true,
        isProGame: true,
        orientation: 'portrait',
        description: 'Watch the rocket climb up to 1000x multiplier. Time your cashout before it explodes!',
      ),
      GameModel(
        id: 'pro_poker_1',
        title: 'Texas Cyber Poker Arena',
        category: 'POKER',
        thumbnail: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/2048/embed',
        provider: 'PokerMaster Studio',
        rating: 4.9,
        playsCount: 65000,
        isFeatured: true,
        isTrending: true,
        isProGame: true,
        orientation: 'landscape',
        description: 'Compete in high-stakes multiplayer Hold\'em tournaments against international pros.',
      ),
      GameModel(
        id: 'pro_live_1',
        title: 'Cyber Roulette Live Arena',
        category: 'LIVE',
        thumbnail: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/drift-dudes/embed',
        provider: 'LivePlay Interactive',
        rating: 4.8,
        playsCount: 51000,
        isFeatured: true,
        isTrending: false,
        isProGame: true,
        orientation: 'landscape',
        description: 'Live real-time European roulette with multi-angle ultra HD stream.',
      ),
      GameModel(
        id: 'pro_sports_1',
        title: 'Esports Prediction League',
        category: 'SPORTS',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://play.gamepix.com/defense-battle/embed',
        provider: 'ArenaSports API',
        rating: 4.8,
        playsCount: 39000,
        isFeatured: false,
        isTrending: true,
        isProGame: true,
        orientation: 'portrait',
        description: 'Predict cricket, football, and esports championship outcomes with live odds.',
      ),
      GameModel(
        id: 'pro_paddy_1',
        title: 'Paddy Power Fortune Wheel',
        category: 'FEATURED',
        thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
        playUrl: 'https://demo.evoplay.games/demo/full/html5/evoplay/dungeon-immortal-evil',
        provider: 'PaddyPower API',
        rating: 4.9,
        playsCount: 82000,
        isFeatured: true,
        isTrending: true,
        isProGame: true,
        orientation: 'portrait',
        description: 'Spin for megaways multipliers and unlock bonus mini-games.',
      ),
    ];

    if (category == null || category == 'ALL') {
      return fallback;
    }
    return fallback.where((g) => g.category == category.toUpperCase()).toList();
  }
}
