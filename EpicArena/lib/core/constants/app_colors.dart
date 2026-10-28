import 'package:flutter/material.dart';

class AppColors {
  // Theme A: Royal Obsidian & Liquid Gold Base
  static const Color background = Color(0xFF07080B);
  static const Color surface = Color(0xFF10121A);
  static const Color surfaceElevated = Color(0xFF161A24);
  static const Color cardBorder = Color(0x33FFD700); // 20% Gold Hairline
  static const Color cardBorderSubtle = Color(0x1AFFD700);

  // Royal Metallic Gold Palette
  static const Color gold = Color(0xFFFFD700);
  static const Color goldLight = Color(0xFFFFF099);
  static const Color goldDark = Color(0xFFC69214);
  static const Color champagne = Color(0xFFF3E5AB);
  static const Color amber = Color(0xFFFF9F1C);
  static const Color bronze = Color(0xFFCD7F32);

  // Status & Highlights
  static const Color emerald = Color(0xFF00E676);
  static const Color cyan = Color(0xFFFFD700); // Mapped to Royal Gold for consistency
  static const Color neonPink = Color(0xFFFF3366);
  static const Color purple = Color(0xFF8B5CF6);

  // Text
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);
  static const Color textGold = Color(0xFFFFD700);

  // Luxury Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFFFD700), Color(0xFFFF8C00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFFFF3B0), Color(0xFFFFD700), Color(0xFFD4AF37)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient royalDarkGradient = LinearGradient(
    colors: [Color(0xFF161A26), Color(0xFF0B0D13)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF141722), Color(0xFF0D0F16)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient proGradient = LinearGradient(
    colors: [Color(0xFFFFD700), Color(0xFFFF6B00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
