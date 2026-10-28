import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/config/app_config.dart';
import '../models/user_profile.dart';

class UserProvider extends ChangeNotifier {
  UserProfile _profile = UserProfile.defaultGuest();

  UserProfile get profile => _profile;

  UserProvider() {
    _loadFromLocal();
  }

  Future<void> _loadFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final coins = prefs.getDouble(AppConfig.keyUserCoins);
      if (coins != null) {
        _profile = _profile.copyWith(arenaCoins: coins);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> addCoins(double amount) async {
    _profile = _profile.copyWith(arenaCoins: _profile.arenaCoins + amount);
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(AppConfig.keyUserCoins, _profile.arenaCoins);
  }

  Future<bool> deductCoins(double amount) async {
    if (_profile.arenaCoins >= amount) {
      _profile = _profile.copyWith(arenaCoins: _profile.arenaCoins - amount);
      notifyListeners();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble(AppConfig.keyUserCoins, _profile.arenaCoins);
      return true;
    }
    return false;
  }

  void claimDailyBonus() {
    addCoins(250.0);
    _profile = _profile.copyWith(starGems: _profile.starGems + 5);
    notifyListeners();
  }
}
