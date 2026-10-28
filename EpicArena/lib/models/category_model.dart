import 'package:flutter/material.dart';

class CategoryModel {
  final String id;
  final String name;
  final IconData icon;
  final String? bannerUrl;
  final bool isProOnly;

  CategoryModel({
    required this.id,
    required this.name,
    required this.icon,
    this.bannerUrl,
    this.isProOnly = false,
  });

  // Default Categories for Casual Mode
  static List<CategoryModel> get casualCategories => [
    CategoryModel(id: 'ALL', name: 'All Games', icon: Icons.grid_view_rounded),
    CategoryModel(id: 'ARCADE', name: 'Arcade', icon: Icons.sports_esports_rounded),
    CategoryModel(id: 'ACTION', name: 'Action', icon: Icons.flash_on_rounded),
    CategoryModel(id: 'PUZZLE', name: 'Puzzle', icon: Icons.extension_rounded),
    CategoryModel(id: 'RACING', name: 'Racing', icon: Icons.sports_motorsports_rounded),
    CategoryModel(id: 'SPORTS', name: 'Sports', icon: Icons.sports_soccer_rounded),
    CategoryModel(id: 'STRATEGY', name: 'Strategy', icon: Icons.psychology_rounded),
  ];

  // Categories when Pro Mode is Activated
  static List<CategoryModel> get proCategories => [
    CategoryModel(id: 'ALL', name: 'All Arenas', icon: Icons.whatshot_rounded),
    CategoryModel(id: 'FEATURED', name: 'Hot Tournaments', icon: Icons.local_fire_department_rounded, isProOnly: true),
    CategoryModel(id: 'SCORPIO', name: 'Scorpio Arena', icon: Icons.stars_rounded, isProOnly: true),
    CategoryModel(id: 'CRASH', name: 'Rocket Arena', icon: Icons.rocket_launch_rounded, isProOnly: true),
    CategoryModel(id: 'POKER', name: 'Card Masters', icon: Icons.style_rounded, isProOnly: true),
    CategoryModel(id: 'LIVE', name: 'Live Tables', icon: Icons.videocam_rounded, isProOnly: true),
    CategoryModel(id: 'SPORTS', name: 'Sports Arena', icon: Icons.emoji_events_rounded, isProOnly: true),
    CategoryModel(id: 'ARCADE', name: 'Arcade & Casual', icon: Icons.sports_esports_rounded),
  ];
}
