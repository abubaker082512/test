import 'package:flutter/material.dart';
import '../models/game_model.dart';
import '../models/category_model.dart';
import '../services/casual_games_service.dart';
import '../services/pro_games_service.dart';

class GamesProvider extends ChangeNotifier {
  final CasualGamesService _casualService = CasualGamesService();
  final ProGamesService _proService = ProGamesService();

  List<GameModel> _casualGames = [];
  List<GameModel> _proGames = [];
  String _selectedCategory = 'ALL';
  String _searchQuery = '';
  bool _isLoading = false;

  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  bool get isLoading => _isLoading;

  List<CategoryModel> getCategories(bool isProMode) {
    return isProMode ? CategoryModel.proCategories : CategoryModel.casualCategories;
  }

  List<GameModel> getVisibleGames(bool isProMode) {
    List<GameModel> sourceList;
    if (isProMode) {
      // In Pro Mode, combine Pro Games + Casual Games
      sourceList = [..._proGames, ..._casualGames];
    } else {
      // In Casual Mode, strictly show casual games
      sourceList = _casualGames;
    }

    // Filter by Category
    List<GameModel> filtered = sourceList;
    if (_selectedCategory != 'ALL') {
      filtered = filtered.where((g) => g.category.toUpperCase() == _selectedCategory.toUpperCase()).toList();
    }

    // Filter by Search Query
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filtered = filtered.where((g) =>
        g.title.toLowerCase().contains(q) ||
        g.category.toLowerCase().contains(q) ||
        g.provider.toLowerCase().contains(q)
      ).toList();
    }

    return filtered;
  }

  List<GameModel> getFeaturedGames(bool isProMode) {
    final list = isProMode ? [..._proGames, ..._casualGames] : _casualGames;
    return list.where((g) => g.isFeatured).toList();
  }

  List<GameModel> getTrendingGames(bool isProMode) {
    final list = isProMode ? [..._proGames, ..._casualGames] : _casualGames;
    return list.where((g) => g.isTrending).toList();
  }

  Future<void> loadGames(bool isProMode) async {
    _isLoading = true;
    notifyListeners();

    try {
      _casualGames = await _casualService.fetchCasualGames();
      if (isProMode) {
        _proGames = await _proService.fetchProGames();
      }
    } catch (_) {
      // Handled in services fallback
    }

    _isLoading = false;
    notifyListeners();
  }

  void selectCategory(String categoryId) {
    if (_selectedCategory != categoryId) {
      _selectedCategory = categoryId;
      notifyListeners();
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }
}
