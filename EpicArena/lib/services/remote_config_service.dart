import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config/app_config.dart';

class RemoteConfigService {
  static final RemoteConfigService _instance = RemoteConfigService._internal();
  factory RemoteConfigService() => _instance;
  RemoteConfigService._internal();

  bool _isProModeEnabled = false;
  String _baseUrl = AppConfig.defaultBaseUrl;
  Timer? _syncTimer;
  final _modeStreamController = StreamController<bool>.broadcast();

  bool get isProModeEnabled => _isProModeEnabled;
  Stream<bool> get modeStream => _modeStreamController.stream;
  String get baseUrl => _baseUrl;

  void setBaseUrl(String url) {
    _baseUrl = url;
  }

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _isProModeEnabled = prefs.getBool(AppConfig.keyAppMode) ?? false;
      _modeStreamController.add(_isProModeEnabled);

      // Initial check from remote
      await fetchRemoteConfig();

      // Start periodic background sync (every 30 seconds)
      startPeriodicSync();
    } catch (e) {
      if (kDebugMode) {
        print('RemoteConfigService init error: $e');
      }
    }
  }

  Future<bool> fetchRemoteConfig() async {
    try {
      // Query backend configuration
      final response = await http
          .get(Uri.parse('$_baseUrl${AppConfig.remoteConfigEndpoint}'))
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Check mode flag (e.g. app_mode == 'pro' or is_pro_arena == true)
        bool proEnabled = false;
        if (data is Map<String, dynamic>) {
          if (data['app_mode'] == 'pro' || data['epicarena_mode'] == 'pro' || data['is_pro_mode'] == true) {
            proEnabled = true;
          } else if (data['settings'] is Map) {
            final s = data['settings'];
            proEnabled = (s['app_mode'] == 'pro' || s['is_pro_mode'] == true);
          }
        }

        if (_isProModeEnabled != proEnabled) {
          _isProModeEnabled = proEnabled;
          final prefs = await SharedPreferences.getInstance();
          await prefs.setBool(AppConfig.keyAppMode, proEnabled);
          _modeStreamController.add(proEnabled);
        }
        return _isProModeEnabled;
      }
    } catch (e) {
      // Graceful fallback to cached state
    }
    return _isProModeEnabled;
  }

  // Force local toggle for admin / testing
  Future<void> setLocalProMode(bool enabled) async {
    _isProModeEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConfig.keyAppMode, enabled);
    _modeStreamController.add(enabled);
  }

  void startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      fetchRemoteConfig();
    });
  }

  void dispose() {
    _syncTimer?.cancel();
    _modeStreamController.close();
  }
}
