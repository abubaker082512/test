import 'dart:async';
import 'package:flutter/material.dart';
import '../services/remote_config_service.dart';

class AppModeProvider extends ChangeNotifier {
  final RemoteConfigService _configService = RemoteConfigService();
  StreamSubscription<bool>? _subscription;

  bool _isProMode = false;
  bool _isLoading = true;

  bool get isProMode => _isProMode;
  bool get isLoading => _isLoading;

  AppModeProvider() {
    _init();
  }

  Future<void> _init() async {
    _isLoading = true;
    notifyListeners();

    await _configService.init();
    _isProMode = _configService.isProModeEnabled;
    _isLoading = false;
    notifyListeners();

    _subscription = _configService.modeStream.listen((enabled) {
      if (_isProMode != enabled) {
        _isProMode = enabled;
        notifyListeners();
      }
    });
  }

  Future<void> toggleMode(bool proMode) async {
    _isProMode = proMode;
    await _configService.setLocalProMode(proMode);
    notifyListeners();
  }

  Future<void> refreshConfig() async {
    _isLoading = true;
    notifyListeners();
    _isProMode = await _configService.fetchRemoteConfig();
    _isLoading = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}
