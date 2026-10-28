import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import '../../core/constants/app_colors.dart';
import '../../models/game_model.dart';
import '../../widgets/coin_display.dart';

class GamePlayerScreen extends StatefulWidget {
  final GameModel game;

  const GamePlayerScreen({super.key, required this.game});

  @override
  State<GamePlayerScreen> createState() => _GamePlayerScreenState();
}

class _GamePlayerScreenState extends State<GamePlayerScreen> {
  InAppWebViewController? _webViewController;
  bool _isLoading = true;
  double _loadProgress = 0.0;
  bool _isLandscape = false;
  bool _hasError = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _setupOrientation();
  }

  void _setupOrientation() {
    if (widget.game.orientation == 'landscape') {
      _setLandscape();
    }
  }

  void _setLandscape() {
    _isLandscape = true;
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  void _setPortrait() {
    _isLandscape = false;
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
  }

  void _toggleOrientation() {
    if (_isLandscape) {
      _setPortrait();
    } else {
      _setLandscape();
    }
    setState(() {});
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final navigator = Navigator.of(context);
        final shouldExit = await _showExitConfirmation();
        if (shouldExit == true) {
          navigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          top: !_isLandscape,
          bottom: false,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // High performance InAppWebView with full HTML5 & Game Engine compatibility
              if (widget.game.playUrl.isNotEmpty && !_hasError)
                InAppWebView(
                  initialUrlRequest: URLRequest(url: WebUri(widget.game.playUrl)),
                  initialSettings: InAppWebViewSettings(
                    javaScriptEnabled: true,
                    domStorageEnabled: true,
                    databaseEnabled: true,
                    mediaPlaybackRequiresUserGesture: false,
                    allowsInlineMediaPlayback: true,
                    useHybridComposition: true,
                    hardwareAcceleration: true,
                    transparentBackground: false,
                    supportZoom: false,
                    mixedContentMode: MixedContentMode.MIXED_CONTENT_ALWAYS_ALLOW,
                    allowFileAccessFromFileURLs: true,
                    allowUniversalAccessFromFileURLs: true,
                    userAgent: "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
                    cacheEnabled: true,
                  ),
                  onWebViewCreated: (controller) {
                    _webViewController = controller;
                  },
                  onProgressChanged: (controller, progress) {
                    setState(() {
                      _loadProgress = progress / 100;
                      if (progress >= 90) {
                        _isLoading = false;
                      }
                    });
                  },
                  onLoadStart: (controller, url) {
                    setState(() {
                      _isLoading = true;
                      _hasError = false;
                    });
                  },
                  onLoadStop: (controller, url) {
                    setState(() {
                      _isLoading = false;
                    });
                  },
                  onReceivedError: (controller, request, error) {
                    if (request.isForMainFrame ?? true) {
                      setState(() {
                        _hasError = true;
                        _errorMessage = error.description;
                        _isLoading = false;
                      });
                    }
                  },
                )
              else
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    margin: const EdgeInsets.symmetric(horizontal: 24),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.videogame_asset_rounded, size: 64, color: AppColors.gold),
                        const SizedBox(height: 16),
                        Text(
                          widget.game.title,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _hasError ? 'Network issue loading game: $_errorMessage' : 'Preparing game arena session...',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: () {
                            setState(() {
                              _hasError = false;
                              _isLoading = true;
                            });
                            _webViewController?.reload();
                          },
                          icon: const Icon(Icons.refresh_rounded, color: Colors.black),
                          label: const Text('Reload Game', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.gold),
                        ),
                      ],
                    ),
                  ),
                ),

              // Loading Progress Bar
              if (_isLoading)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: LinearProgressIndicator(
                    value: _loadProgress > 0 ? _loadProgress : null,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
                    minHeight: 3,
                  ),
                ),

              // Top HUD Controls Bar
              Positioned(
                top: 12,
                left: 12,
                right: 12,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back Button
                    GestureDetector(
                      onTap: () async {
                        final navigator = Navigator.of(context);
                        final shouldExit = await _showExitConfirmation();
                        if (shouldExit == true) {
                          navigator.pop();
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.8),
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: const Icon(Icons.arrow_back_rounded, color: AppColors.gold, size: 20),
                      ),
                    ),

                    // Balance & Actions
                    Row(
                      children: [
                        const CoinDisplay(showAddButton: false),
                        const SizedBox(width: 8),
                        // Rotate Toggle
                        GestureDetector(
                          onTap: _toggleOrientation,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.8),
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            child: Icon(
                              _isLandscape ? Icons.screen_lock_portrait_rounded : Icons.screen_lock_landscape_rounded,
                              color: AppColors.gold,
                              size: 20,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Reload Button
                        GestureDetector(
                          onTap: () => _webViewController?.reload(),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.8),
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            child: const Icon(Icons.refresh_rounded, color: Colors.white, size: 20),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<bool?> _showExitConfirmation() {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.cardBorder),
        ),
        title: const Text('Exit Match?', style: TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
        content: Text(
          'Leave ${widget.game.title}? Your current match score and credits are saved.',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Keep Playing', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
            ),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Exit', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
