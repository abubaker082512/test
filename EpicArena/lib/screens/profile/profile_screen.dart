import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/config/app_config.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_mode_provider.dart';
import '../../providers/user_provider.dart';
import '../../services/remote_config_service.dart';
import '../../widgets/coin_display.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  int _versionTapCount = 0;
  bool _soundEnabled = true;
  bool _notificationsEnabled = true;

  void _handleVersionTap() {
    _versionTapCount++;
    if (_versionTapCount >= 5) {
      _versionTapCount = 0;
      _showAdminConfigDialog();
    }
  }

  void _showAdminConfigDialog() {
    final modeProvider = Provider.of<AppModeProvider>(context, listen: false);
    final urlController = TextEditingController(text: RemoteConfigService().baseUrl);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.gold),
        ),
        title: const Row(
          children: [
            Icon(Icons.admin_panel_settings_rounded, color: AppColors.gold),
            SizedBox(width: 8),
            Text('Admin Gateway Switch', style: TextStyle(color: Colors.white, fontSize: 16)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Configure Backend Base URL:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 6),
            TextField(
              controller: urlController,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                filled: true,
                fillColor: AppColors.surfaceElevated,
                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Live Mode Control:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('PRO ARENA MODE', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
              subtitle: Text(
                modeProvider.isProMode ? 'Pro gaming suite active' : 'Casual arcade mode active',
                style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
              ),
              value: modeProvider.isProMode,
              activeTrackColor: AppColors.gold,
              onChanged: (val) {
                modeProvider.toggleMode(val);
                Navigator.of(ctx).pop();
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              RemoteConfigService().setBaseUrl(urlController.text.trim());
              Navigator.of(ctx).pop();
            },
            child: const Text('Save & Apply', style: TextStyle(color: AppColors.gold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    final modeProvider = Provider.of<AppModeProvider>(context);
    final p = userProvider.profile;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('PLAYER PROFILE'),
        actions: const [
          CoinDisplay(),
          SizedBox(width: 16),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: AppColors.surfaceElevated,
                      backgroundImage: NetworkImage(p.avatarUrl),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.gold,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'LVL ${p.level}',
                          style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.black),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.username,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        p.rankTitle,
                        style: const TextStyle(fontSize: 12, color: AppColors.gold, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'ID: ${p.id}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Stats Overview
          Row(
            children: [
              _buildStatBox('MATCHES', '${p.matchesPlayed}', Icons.sports_esports_rounded, AppColors.gold),
              const SizedBox(width: 12),
              _buildStatBox('VICTORIES', '${p.victories}', Icons.emoji_events_rounded, AppColors.amber),
              const SizedBox(width: 12),
              _buildStatBox('WIN RATE', '${((p.victories / p.matchesPlayed) * 100).toInt()}%', Icons.trending_up_rounded, AppColors.emerald),
            ],
          ),

          const SizedBox(height: 24),

          // Settings Section
          const Text(
            'PREFERENCES',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 12),

          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Sound & FX', style: TextStyle(color: Colors.white, fontSize: 14)),
                  value: _soundEnabled,
                  activeTrackColor: AppColors.gold,
                  onChanged: (v) => setState(() => _soundEnabled = v),
                ),
                const Divider(height: 1, color: AppColors.cardBorder),
                SwitchListTile(
                  title: const Text('Championship Notifications', style: TextStyle(color: Colors.white, fontSize: 14)),
                  value: _notificationsEnabled,
                  activeTrackColor: AppColors.gold,
                  onChanged: (v) => setState(() => _notificationsEnabled = v),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // About & Legal
          const Text(
            'ABOUT EPICARENA',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: AppColors.textPrimary,
            ),
          ),

          const SizedBox(height: 12),

          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.shield_outlined, color: AppColors.gold, size: 20),
                  title: const Text('Fair Play & Community Guidelines', style: TextStyle(color: Colors.white, fontSize: 13)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 14),
                  onTap: () {},
                ),
                const Divider(height: 1, color: AppColors.cardBorder),
                ListTile(
                  leading: const Icon(Icons.lock_outline_rounded, color: AppColors.gold, size: 20),
                  title: const Text('Privacy Policy', style: TextStyle(color: Colors.white, fontSize: 13)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 14),
                  onTap: () {},
                ),
                const Divider(height: 1, color: AppColors.cardBorder),
                ListTile(
                  leading: const Icon(Icons.headset_mic_outlined, color: AppColors.gold, size: 20),
                  title: const Text('Customer Support 24/7', style: TextStyle(color: Colors.white, fontSize: 13)),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 14),
                  onTap: () {},
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Secret Admin Tap Trigger on Version footer
          GestureDetector(
            onTap: _handleVersionTap,
            child: Center(
              child: Column(
                children: [
                  Text(
                    '${AppConfig.appName} • ${AppConfig.packageName}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Version ${AppConfig.appVersion} • (Build 2026)',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Mode: ${modeProvider.isProMode ? "PRO ARENA" : "CASUAL ARENA"}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.gold,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildStatBox(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
