class AppConfig {
  static const String appName = 'EpicArena';
  static const String appVersion = '1.0.0';
  static const String packageName = 'com.epicarena';

  // Backend API Base URL (Change to your live domain or local IP during testing)
  static const String defaultBaseUrl = 'https://epicarena-backend.vercel.app';
  static const String localFallbackBaseUrl = 'http://10.0.2.2:3000';

  // API Endpoints
  static const String remoteConfigEndpoint = '/api/settings/get';
  static const String updateConfigEndpoint = '/api/settings/update';
  static const String scorpioPlayGamesEndpoint = '/api/scorpioplay/games';
  static const String scorpioPlayLaunchEndpoint = '/api/scorpioplay/launch';
  static const String paddyPowerGamesEndpoint = '/api/paddypower/games';
  static const String rainbowRichesGamesEndpoint = '/api/rainbowriches/games';
  static const String rapidGamesEndpoint = '/api/rapid/getAllGamesByProvider';
  static const String walletBalanceEndpoint = '/api/wallet/get-balance';
  static const String walletDepositEndpoint = '/api/wallet/deposit';
  static const String walletWithdrawEndpoint = '/api/wallet/withdraw';
  static const String sportsEventsEndpoint = '/api/sports/events';

  // GamePix Games Feed API (Over 5,000+ top free casual HTML5 mobile games)
  static const String gamePixFeedUrl = 'https://feeds.gamepix.com/v1/json?category=all&pagination=96&page=1';
  static const String gamePixCategoryFeedUrl = 'https://feeds.gamepix.com/v1/json?category=';

  // Storage Keys
  static const String keyAppMode = 'epicarena_app_mode';
  static const String keyUserToken = 'epicarena_user_token';
  static const String keyUserId = 'epicarena_user_id';
  static const String keyUserCoins = 'epicarena_user_coins';
  static const String keyCachedConfig = 'epicarena_cached_config';
}
