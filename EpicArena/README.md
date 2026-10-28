# 🎮 EpicArena Mobile App (`com.epicarena`)

![EpicArena](assets/images/logo.png)

EpicArena is a modern, standalone Flutter mobile gaming platform engineered with **Dynamic Dual-Mode Cloaking (Safe/Casual Mode vs Pro Arena Mode)** and real-time remote configuration.

---

## 🌟 Key Features

1. **Clean Gaming Branding**:
   - Zero betting/gambling wording in all UI components, manifests, and assets.
   - Esport & Arcade terminology: *Arena Coins, Star Gems, Match Entry, Victory Trophies, Global Leaderboards, Token Vault*.

2. **Dynamic Dual-Mode System**:
   - **Mode 1: Casual Gaming Mode (Default / Safe Mode)**
     - Integrates the **GamePix Games Feed API** and curated offline arcade games.
     - Over 5,000+ HTML5 games across Arcade, Action, Puzzle, Racing, Strategy, and Sports.
     - Safe for app store compliance.
   - **Mode 2: Pro Arena Gaming Mode (Remote Admin Switch)**
     - Instantly unlocks the full gaming suite (ScorpioPlay, Rocket Crash, Poker, Live Roulette, and PaddyPower games).
     - Seamlessly connects with payment top-up gateways (EasyPaisa, JazzCash, DirectPay).

3. **In-App Hardware-Accelerated WebView Engine**:
   - Smooth full-screen gaming with auto orientation switching (portrait/landscape).
   - Real-time Coin balance overlay and session management.

4. **Dedicated Admin Control Panel**:
   - Web controller located at `http://localhost:3000/admin/epicarena` (or `/admin` on your deployed server).
   - One-click live switch between **Casual Mode** and **Pro Arena Mode**.
   - Custom banner headlines and visual theme accent control.

---

## 📁 Project Structure

```
d:\akhuwatbet\EpicArena/
├── android/                   # Package name: com.epicarena
├── assets/
│   └── images/logo.png        # Cyber esports branding logo
├── lib/
│   ├── main.dart              # MultiProvider bootstrap & theme initialization
│   ├── core/
│   │   ├── config/            # Backend endpoints & local cache keys
│   │   ├── constants/         # Cyber Obsidian & Neon color palette
│   │   └── theme/             # Dark Rajdhani & Inter esports typography
│   ├── models/                # Unified GameModel, CategoryModel, UserProfile
│   ├── providers/             # AppModeProvider, GamesProvider, UserProvider
│   ├── services/              # RemoteConfigService, CasualGamesService, ProGamesService, WalletService
│   ├── screens/
│   │   ├── splash_screen.dart
│   │   ├── main_navigation_screen.dart
│   │   ├── home/              # Dynamic Home with hero banner, categories & reels
│   │   ├── games/             # Search & filter games hub
│   │   ├── tournaments/       # Live tournaments & global hall of fame
│   │   ├── wallet/            # Coin vault & EasyPaisa/JazzCash top-ups
│   │   └── profile/           # Player rank, statistics, and secret admin switch
│   └── widgets/               # GameCard, CoinDisplay, ModeBadge, BannerCarousel
└── pubspec.yaml
```

---

## 🛠️ Build Instructions

### Run Debug on Connected Device / Emulator:
```powershell
flutter run
```

### Build Android Debug APK:
```powershell
flutter build apk --debug
```

### Build Android Release APK:
```powershell
flutter build apk --release
```

---

## ⚡ Secret In-App Admin Switch
For on-device testing, you can open the **Admin Gateway Switch** in two ways:
1. Tap the **Mode Badge** in the top header 5 times.
2. Navigate to **Profile Screen** and tap the **App Version** text at the bottom 5 times.
