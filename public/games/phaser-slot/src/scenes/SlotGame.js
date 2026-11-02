import { GAME_WIDTH, SYMBOLS } from "../config/constants.js";
import { LAYOUT } from "../config/layout.js";
import SoundFX from "../audio/SoundFX.js";
import { fitTextToBox } from "../utils/text.js";

const SYMBOL_IMAGES = {
  seven: "./assets/symbols/7.png",
  diamond: "./assets/symbols/diamond.png",
  clover: "./assets/symbols/clover.png",
  cherry: "./assets/symbols/cherry.png",
  lemon: "./assets/symbols/blueberry.png",
};

export default class SlotGame extends Phaser.Scene {
  constructor() {
    super("SlotGame");

    this.balance = window.WinXBridge ? window.WinXBridge.getBalance() : 5000;
    this.bet = 50;
    this.minBet = 10;
    this.maxBet = 2000;
    this.betStep = 50;

    this.baseJackpotValue = 125000;
    this.jackpotValue = 125840;
    this.lastWin = 0;

    this.mode = "NORMAL";
    this.isSpinning = false;
    this.stopRequested = false;
    this.inputLocked = false;

    this.autoPlay = false;
    this.autoPlayRounds = 0;
    this.maxAutoPlayRounds = 25;

    this.reels = [];
    this.stoppedReelsCount = 0;
    this.sfx = new SoundFX();
    this.serverRound = null;
    this.targetSymbols = null;

    this.speedSettings = {
      SLOW: { duration: 1900, interval: 60, step: 16 },
      NORMAL: { duration: 1200, interval: 36, step: 18 },
      FAST: { duration: 800, interval: 22, step: 20 },
      TURBO: { duration: 480, interval: 10, step: 24 },
    };
  }

  preload() {
    this.load.image("slot_bg", "./assets/bg.jpg");
    Object.entries(SYMBOL_IMAGES).forEach(([key, path]) => {
      this.load.image(`sym_${key}`, path);
    });
  }

  create() {
    const params = new URLSearchParams(window.location.search);
    this.gameId = params.get("game") || "classic-777";
    this.titleLabel = params.get("title") || "LUCKY REELS 777";

    this.createBackground();
    this.createHeader();
    this.createPaytable();
    this.createMachine();
    this.createReels();
    this.createBottomPanels();
    this.createLastWinPanel();
    this.createRightControls();
    this.createSpeedButtons();
    this.createAutoButton();
    this.createSoundButton();
    this.createKeyboardControls();
    this.createAmbientAnimations();
    this.updateDisplay();

    if (window.WinXBridge) {
      window.WinXBridge.init(this.balance).then((realBal) => {
        this.balance = realBal;
        this.updateDisplay();
      });
      window.WinXBridge.onBalanceChange((newBal) => {
        this.balance = newBal;
        this.updateDisplay();
      });
    }
  }

  formatMoney(value) {
    return `Rs ${Math.round(Number(value)).toLocaleString("en-PK")}`;
  }

  setMessage(value, baseFontSize = 20) {
    fitTextToBox(
      this.messageText,
      value,
      LAYOUT.messageW - 28,
      baseFontSize,
      12,
    );
  }

  createPanel(x, y, width, height, fill = 0x110006, alpha = 0.95) {
    return this.add
      .rectangle(x, y, width, height, fill, alpha)
      .setStrokeStyle(3, 0xffd700);
  }

  createBackground() {
    this.add.rectangle(480, 270, 960, 540, 0x070006);
    if (this.textures.exists("slot_bg")) {
      const bgImg = this.add.image(480, 270, "slot_bg");
      bgImg.setDisplaySize(960, 540);
      bgImg.setAlpha(0.32);
    }

    this.add.circle(130, 95, 220, 0x5f0016, 0.42);
    this.add.circle(852, 95, 220, 0x05184a, 0.42);
    this.add.circle(815, 450, 170, 0x4d2200, 0.34);

    for (let i = 0; i < 85; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, 540),
        Phaser.Math.Between(1, 3),
        0xffe8a3,
        Phaser.Math.FloatBetween(0.12, 0.7),
      );

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.15, 0.95),
        duration: Phaser.Math.Between(800, 2200),
        yoyo: true,
        repeat: -1,
      });
    }

    this.add
      .rectangle(480, 505, 900, 58, 0x080304, 0.72)
      .setStrokeStyle(2, 0x6b3d00);
  }

  createHeader() {
    this.add
      .text(480, LAYOUT.titleY, this.titleLabel, {
        fontSize: "44px",
        fontStyle: "bold",
        color: "#ffd700",
        stroke: "#7a001e",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ffb000",
          blur: 12,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.add
      .text(480, LAYOUT.subtitleY, "WINX ORIGINALS • PROVABLY FAIR", {
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.jackpotPanel = this.createPanel(
      480,
      LAYOUT.jackpotY,
      360,
      38,
      0x170006,
      0.96,
    );

    this.jackpotText = this.add
      .text(
        480,
        LAYOUT.jackpotY,
        `💎 JACKPOT ${this.formatMoney(this.jackpotValue)}`,
        {
          fontSize: "20px",
          fontStyle: "bold",
          color: "#ffd700",
          stroke: "#000000",
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5);
  }

  createPaytable() {
    this.createPanel(
      LAYOUT.paytableX,
      LAYOUT.paytableY,
      LAYOUT.paytableW,
      LAYOUT.paytableH,
      0x120006,
      0.94,
    );

    this.add
      .text(LAYOUT.paytableX, 182, "3 MATCH PAYS", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    SYMBOLS.forEach((symbol, index) => {
      const y = 212 + index * 26;

      this.add
        .text(54, y, `${symbol.label}${symbol.label}${symbol.label}`, {
          fontSize: "17px",
          fontStyle: "bold",
          color: symbol.color,
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0, 0.5);

      this.add
        .text(164, y, `${symbol.multiplier}x`, {
          fontSize: "16px",
          fontStyle: "bold",
          color: "#ffe9a6",
        })
        .setOrigin(1, 0.5);
    });

    this.add
      .text(LAYOUT.paytableX, 498, "ANY PAIR = 2x BET", {
        fontSize: "12px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);
  }

  createMachine() {
    this.machineGlow = this.add.rectangle(
      LAYOUT.machineX,
      LAYOUT.machineY,
      LAYOUT.machineOuterW + 10,
      LAYOUT.machineOuterH + 6,
      0xffb000,
      0.12,
    );

    this.add
      .rectangle(
        LAYOUT.machineX,
        LAYOUT.machineY,
        LAYOUT.machineOuterW,
        LAYOUT.machineOuterH,
        0x2a0205,
      )
      .setStrokeStyle(9, 0xffd700);

    this.add
      .rectangle(
        LAYOUT.machineX,
        LAYOUT.machineY,
        LAYOUT.machineInnerW,
        LAYOUT.machineInnerH,
        0x090006,
      )
      .setStrokeStyle(4, 0xfff2be);

    this.add
      .rectangle(LAYOUT.machineX, LAYOUT.machineY, 452, 170, 0x19001d)
      .setStrokeStyle(4, 0xcf0052);

    this.paylineTop = this.add.rectangle(
      LAYOUT.machineX,
      LAYOUT.machineY - 43,
      452,
      3,
      0xffd700,
      0.35,
    );

    this.paylineMiddle = this.add.rectangle(
      LAYOUT.machineX,
      LAYOUT.machineY,
      452,
      4,
      0xffd700,
      0.95,
    );

    this.paylineBottom = this.add.rectangle(
      LAYOUT.machineX,
      LAYOUT.machineY + 43,
      452,
      3,
      0xffd700,
      0.35,
    );

    this.add
      .text(226, LAYOUT.machineY, "3 LINES", {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(714, LAYOUT.machineY, "3 LINES", {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.messageBox = this.createPanel(
      LAYOUT.messageX,
      LAYOUT.messageY,
      LAYOUT.messageW,
      LAYOUT.messageH,
      0x180006,
      0.96,
    );

    this.messageText = this.add
      .text(LAYOUT.messageX, LAYOUT.messageY, "Press SPIN or SPACE", {
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5);
  }

  createReels() {
    LAYOUT.reelXs.forEach((x, reelIndex) => {
      const frame = this.add
        .rectangle(
          x,
          LAYOUT.reelY,
          LAYOUT.reelFrameW,
          LAYOUT.reelFrameH,
          0xffffff,
          0.05,
        )
        .setStrokeStyle(4, 0xffd700);

      const maskShape = this.add.graphics();
      maskShape.fillStyle(0xffffff);
      maskShape.fillRect(
        x - LAYOUT.reelFrameW / 2 + 5,
        LAYOUT.reelY - LAYOUT.reelFrameH / 2 + 4,
        LAYOUT.reelFrameW - 10,
        LAYOUT.reelFrameH - 8,
      );

      const mask = maskShape.createGeometryMask();
      maskShape.setVisible(false);

      const container = this.add.container(x, LAYOUT.reelY);
      container.setMask(mask);

      const items = [];

      for (let i = -2; i <= 2; i++) {
        const symbol = Phaser.Utils.Array.GetRandom(SYMBOLS);
        const bg = this.add.circle(0, i * 64, 30, 0x000000, 0.25);

        const hasTex = this.textures.exists(`sym_${symbol.key}`);
        const img = this.add
          .image(0, i * 64, hasTex ? `sym_${symbol.key}` : "sym_seven")
          .setDisplaySize(50, 50)
          .setVisible(hasTex);

        const txt = this.add
          .text(0, i * 64, symbol.label, {
            fontSize: symbol.label.length > 1 ? "42px" : "52px",
            fontStyle: "bold",
            color: symbol.color,
            stroke: "#000000",
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setVisible(!hasTex);

        container.add([bg, img, txt]);
        items.push({ bg, img, txt, symbol });
      }

      this.reels.push({
        frame,
        container,
        items,
        value: SYMBOLS[reelIndex],
        intervalEvent: null,
        stopped: true,
        forceStopScheduled: false,
      });
    });
  }

  createBottomPanels() {
    this.balancePanel = this.createPanel(
      LAYOUT.balanceX,
      LAYOUT.balanceY,
      LAYOUT.balanceW,
      LAYOUT.balanceH,
      0x100006,
      0.95,
    );

    this.add
      .text(LAYOUT.balanceX, LAYOUT.balanceY - 12, "BALANCE", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.balanceValue = this.add
      .text(
        LAYOUT.balanceX,
        LAYOUT.balanceY + 11,
        this.formatMoney(this.balance),
        {
          fontSize: "20px",
          fontStyle: "bold",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5);

    this.betPanel = this.createPanel(
      LAYOUT.betX,
      LAYOUT.betY,
      LAYOUT.betW,
      LAYOUT.betH,
      0x100006,
      0.95,
    );

    this.add
      .text(LAYOUT.betX, LAYOUT.betY - 12, "BET", {
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.betMinus = this.add
      .circle(LAYOUT.betX - 58, LAYOUT.betY + 10, 13, 0x300000)
      .setStrokeStyle(2, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.betMinusText = this.add
      .text(LAYOUT.betX - 58, LAYOUT.betY + 10, "-", {
        fontSize: "19px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.betPlus = this.add
      .circle(LAYOUT.betX + 58, LAYOUT.betY + 10, 13, 0x300000)
      .setStrokeStyle(2, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.betPlusText = this.add
      .text(LAYOUT.betX + 58, LAYOUT.betY + 9, "+", {
        fontSize: "18px",
        fontStyle: "bold",
        color: "#ffd700",
      })
      .setOrigin(0.5);

    this.betValue = this.add
      .text(LAYOUT.betX, LAYOUT.betY + 10, this.formatMoney(this.bet), {
        fontSize: "19px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.betMinus.on("pointerdown", () => this.changeBet(-this.betStep));
    this.betPlus.on("pointerdown", () => this.changeBet(this.betStep));
  }

  createLastWinPanel() {
    this.lastWinPanel = this.createPanel(
      LAYOUT.lastWinX,
      LAYOUT.lastWinY,
      LAYOUT.lastWinW,
      LAYOUT.lastWinH,
      0x100006,
      0.95,
    );

    this.add
      .text(LAYOUT.lastWinX, LAYOUT.lastWinY - 15, "LAST WIN", {
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.lastWinValue = this.add
      .text(
        LAYOUT.lastWinX,
        LAYOUT.lastWinY + 13,
        this.formatMoney(this.lastWin),
        {
          fontSize: "21px",
          fontStyle: "bold",
          color: "#00ff99",
        },
      )
      .setOrigin(0.5);
  }

  createRightControls() {
    this.rightControlPanel = this.createPanel(
      LAYOUT.rightPanelX,
      338,
      150,
      180,
      0x140006,
      0.92,
    );

    this.spinOuter = this.add
      .circle(LAYOUT.rightPanelX, LAYOUT.spinOuterY, 58, 0x42000b, 1)
      .setStrokeStyle(6, 0xffd700);

    this.spinButton = this.add
      .circle(LAYOUT.rightPanelX, LAYOUT.spinInnerY, 48, 0xce0023, 1)
      .setStrokeStyle(4, 0xfff2be)
      .setInteractive({ useHandCursor: true });

    this.spinText = this.add
      .text(LAYOUT.rightPanelX, LAYOUT.spinInnerY - 7, "SPIN", {
        fontSize: "28px",
        fontStyle: "bold",
        color: "#ffe9a6",
        stroke: "#4a0000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.spinHint = this.add
      .text(LAYOUT.rightPanelX, LAYOUT.spinInnerY + 24, "SPACE STOP", {
        fontSize: "9px",
        fontStyle: "bold",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [this.spinOuter, this.spinButton, this.spinText, this.spinHint],
      scale: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.spinButton.on("pointerdown", () => {
      this.sfx.click();
      this.handleSpinInput();
    });

    this.spinButton.on("pointerover", () => {
      if (!this.isSpinning) this.spinButton.setFillStyle(0xff173e);
    });

    this.spinButton.on("pointerout", () => {
      this.spinButton.setFillStyle(0xce0023);
    });
  }

  createSpeedButtons() {
    const buttons = [
      { label: "SLOW", x: LAYOUT.speedXs[0], w: 76 },
      { label: "NORMAL", x: LAYOUT.speedXs[1], w: 86 },
      { label: "FAST", x: LAYOUT.speedXs[2], w: 76 },
      { label: "TURBO", x: LAYOUT.speedXs[3], w: 76 },
    ];

    this.speedButtons = [];

    buttons.forEach((item) => {
      const btn = this.add
        .rectangle(item.x, LAYOUT.speedY, item.w, 32, 0x120006, 0.96)
        .setStrokeStyle(3, 0xffd700)
        .setInteractive({ useHandCursor: true });

      const txt = this.add
        .text(item.x, LAYOUT.speedY, item.label, {
          fontSize: "11px",
          fontStyle: "bold",
          color: "#ffe9a6",
        })
        .setOrigin(0.5);

      btn.on("pointerdown", () => {
        if (this.isSpinning) return;

        this.sfx.click();
        this.mode = item.label;
        this.updateSpeedButtons();
        this.setMessage(`Speed set to ${item.label}`);
      });

      btn.on("pointerover", () => {
        if (this.mode !== item.label && !this.isSpinning) {
          btn.setFillStyle(0x3d1700);
        }
      });

      btn.on("pointerout", () => {
        if (this.mode !== item.label) btn.setFillStyle(0x120006);
      });

      this.speedButtons.push({ label: item.label, btn, txt });
    });

    this.updateSpeedButtons();
  }

  createAutoButton() {
    this.autoButton = this.add
      .rectangle(LAYOUT.autoX, LAYOUT.speedY, 100, 32, 0x120006, 0.96)
      .setStrokeStyle(3, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.autoText = this.add
      .text(LAYOUT.autoX, LAYOUT.speedY, "AUTO: OFF", {
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.autoButton.on("pointerdown", () => {
      this.sfx.click();
      this.toggleAutoPlay();
    });
  }

  createSoundButton() {
    this.soundButton = this.add
      .rectangle(LAYOUT.soundX, LAYOUT.soundY, 100, 32, 0x120006, 0.96)
      .setStrokeStyle(3, 0xffd700)
      .setInteractive({ useHandCursor: true });

    this.soundText = this.add
      .text(LAYOUT.soundX, LAYOUT.soundY, "SOUND: ON", {
        fontSize: "11px",
        fontStyle: "bold",
        color: "#ffe9a6",
      })
      .setOrigin(0.5);

    this.soundButton.on("pointerdown", () => {
      const willEnable = !this.sfx.enabled;
      this.sfx.enabled = willEnable;

      if (willEnable) {
        this.soundButton.setFillStyle(0x120006);
        this.soundText.setColor("#ffe9a6");
        this.soundText.setText("SOUND: ON");
        this.sfx.click();
      } else {
        this.soundButton.setFillStyle(0xffc400);
        this.soundText.setColor("#190000");
        this.soundText.setText("SOUND: OFF");
      }
    });
  }

  createKeyboardControls() {
    this.input.keyboard.on("keydown-SPACE", () => {
      this.sfx.click();
      this.handleSpinInput();
    });
  }

  createAmbientAnimations() {
    this.tweens.add({
      targets: this.machineGlow,
      alpha: 0.22,
      duration: 1300,
      yoyo: true,
      repeat: -1,
    });

    [this.paylineTop, this.paylineMiddle, this.paylineBottom].forEach(
      (line, index) => {
        this.tweens.add({
          targets: line,
          alpha: index === 1 ? 1 : 0.55,
          duration: 900,
          yoyo: true,
          repeat: -1,
        });
      },
    );

    this.tweens.add({
      targets: this.jackpotText,
      scale: 1.04,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  updateDisplay() {
    fitTextToBox(
      this.balanceValue,
      this.formatMoney(this.balance),
      LAYOUT.balanceW - 24,
      20,
      11,
    );

    fitTextToBox(
      this.betValue,
      this.formatMoney(this.bet),
      LAYOUT.betW - 95,
      19,
      11,
    );

    fitTextToBox(
      this.lastWinValue,
      this.formatMoney(this.lastWin),
      LAYOUT.lastWinW - 24,
      20,
      11,
    );

    fitTextToBox(
      this.jackpotText,
      `💎 JACKPOT ${this.formatMoney(this.jackpotValue)}`,
      335,
      20,
      13,
    );
  }

  changeBet(amount) {
    if (this.isSpinning) return;

    this.sfx.click();

    this.bet = Phaser.Math.Clamp(this.bet + amount, this.minBet, this.maxBet);

    fitTextToBox(
      this.betValue,
      this.formatMoney(this.bet),
      LAYOUT.betW - 95,
      19,
      11,
    );

    this.tweens.add({
      targets: this.betValue,
      scale: 1.18,
      duration: 120,
      yoyo: true,
    });
  }

  setBetButtonsEnabled(enabled) {
    if (!this.betMinus || !this.betPlus) return;

    const alpha = enabled ? 1 : 0.45;

    this.betMinus.disableInteractive();
    this.betPlus.disableInteractive();

    if (enabled) {
      this.betMinus.setInteractive({ useHandCursor: true });
      this.betPlus.setInteractive({ useHandCursor: true });
    }

    [this.betMinus, this.betPlus, this.betMinusText, this.betPlusText].forEach(
      (item) => item.setAlpha(alpha),
    );
  }

  toggleAutoPlay() {
    this.autoPlay = !this.autoPlay;

    if (this.autoPlay) {
      this.autoPlayRounds = 0;
      this.autoButton.setFillStyle(0xffc400);
      this.autoText.setColor("#190000");
      this.autoText.setText("AUTO: ON");
      this.setMessage("Auto play enabled");

      if (!this.isSpinning) {
        this.time.delayedCall(350, () => {
          if (this.autoPlay && !this.isSpinning) {
            this.startSpin();
          }
        });
      }
    } else {
      this.updateAutoButtonOff();
      this.setMessage("Auto play disabled");
    }
  }

  updateAutoButtonOff() {
    if (!this.autoButton || !this.autoText) return;

    this.autoButton.setFillStyle(0x120006);
    this.autoText.setColor("#ffe9a6");
    this.autoText.setText("AUTO: OFF");
  }

  updateSpeedButtons() {
    this.speedButtons.forEach(({ label, btn, txt }) => {
      if (label === this.mode) {
        btn.setFillStyle(0xffc400);
        txt.setColor("#190000");
      } else {
        btn.setFillStyle(0x120006);
        txt.setColor("#ffe9a6");
      }
    });
  }

  handleSpinInput() {
    if (this.inputLocked) return;

    this.inputLocked = true;

    this.time.delayedCall(180, () => {
      this.inputLocked = false;
    });

    if (!this.isSpinning) {
      this.startSpin();
      return;
    }

    if (!this.stopRequested) {
      this.stopRequested = true;
      this.setMessage("Stopping reels...");

      this.reels.forEach((reel, index) => {
        if (!reel.stopped && !reel.forceStopScheduled) {
          reel.forceStopScheduled = true;
          this.time.delayedCall(index * 140, () => this.stopReel(reel, index));
        }
      });
    }
  }

  startSpin() {
    if (this.isSpinning) return;

    if (this.balance < this.bet) {
      this.setMessage("Insufficient balance!");
      this.sfx.lose();
      this.autoPlay = false;
      this.updateAutoButtonOff();
      return;
    }

    this.reels.forEach((reel) => {
      if (reel.intervalEvent) {
        reel.intervalEvent.remove(false);
        reel.intervalEvent = null;
      }

      reel.stopped = true;
      reel.forceStopScheduled = false;
      reel.container.y = LAYOUT.reelY;
    });

    this.isSpinning = true;
    this.stopRequested = false;
    this.stoppedReelsCount = 0;
    this.serverRound = null;
    this.targetSymbols = null;
    this.setBetButtonsEnabled(false);

    this.animateBalanceDecrease(this.bet);

    if (window.WinXBridge) {
      window.WinXBridge.playServerGovernedRound(this.gameId, this.bet, {}).then((res) => {
        if (res && res.ok) {
          this.serverRound = res;
          if (res.isWin && res.multiplier >= 4) {
            const sym = Phaser.Utils.Array.GetRandom(SYMBOLS);
            this.targetSymbols = [sym, sym, sym];
          } else if (res.isWin && res.payout > 0) {
            const symA = Phaser.Utils.Array.GetRandom(SYMBOLS);
            const others = SYMBOLS.filter((s) => s.key !== symA.key);
            const symB = Phaser.Utils.Array.GetRandom(others);
            this.targetSymbols = [symA, symA, symB];
          } else {
            const shuffled = Phaser.Utils.Array.Shuffle([...SYMBOLS]);
            this.targetSymbols = [shuffled[0], shuffled[1], shuffled[2]];
          }
        }
      });
    }

    this.jackpotValue += Math.max(1, Math.round(this.bet * 0.05));
    this.updateDisplay();

    if (this.autoPlay) {
      this.autoPlayRounds++;
      this.setMessage(
        `AUTO SPIN ${this.autoPlayRounds}/${this.maxAutoPlayRounds}`,
        18,
      );
    } else {
      this.setMessage(`${this.mode} SPINNING • SPACE TO STOP`, 17);
    }

    this.reels.forEach((reel, index) => {
      this.startReelSpin(reel, index);
    });

    this.cameras.main.shake(90, 0.002);
  }

  animateBalanceDecrease(amount) {
    const startBalance = this.balance;
    const endBalance = this.balance - amount;

    this.balance = endBalance;

    this.tweens.addCounter({
      from: startBalance,
      to: endBalance,
      duration: 280,
      ease: "Cubic.easeOut",
      onUpdate: (tween) => {
        fitTextToBox(
          this.balanceValue,
          this.formatMoney(tween.getValue()),
          LAYOUT.balanceW - 24,
          20,
          11,
        );
      },
      onComplete: () => this.updateDisplay(),
    });
  }

  startReelSpin(reel, index) {
    const settings = this.speedSettings[this.mode];

    if (reel.intervalEvent) {
      reel.intervalEvent.remove(false);
      reel.intervalEvent = null;
    }

    reel.stopped = false;
    reel.forceStopScheduled = false;

    reel.frame.setStrokeStyle(4, 0xff0066);

    reel.intervalEvent = this.time.addEvent({
      delay: settings.interval,
      loop: true,
      callback: () => {
        this.sfx.spinTick();

        reel.items.forEach((item) => {
          item.txt.y += settings.step;
          item.bg.y += settings.step;
          if (item.img) item.img.y += settings.step;

          if (item.txt.y > 128) {
            const symbol = Phaser.Utils.Array.GetRandom(SYMBOLS);
            const hasTex = this.textures.exists(`sym_${symbol.key}`);

            item.symbol = symbol;
            item.txt.y = -128;
            item.bg.y = -128;
            if (item.img) {
              item.img.y = -128;
              if (hasTex) item.img.setTexture(`sym_${symbol.key}`).setDisplaySize(50, 50);
              item.img.setVisible(hasTex);
            }
            item.txt.setText(symbol.label);
            item.txt.setColor(symbol.color);
            item.txt.setFontSize(symbol.label.length > 1 ? 42 : 52);
            item.txt.setVisible(!hasTex);
          }
        });
      },
    });

    const stopDelay = settings.duration + index * 260;

    this.time.delayedCall(stopDelay, () => {
      this.waitForStopThenStopReel(reel, index);
    });
  }

  waitForStopThenStopReel(reel, index) {
    if (reel.stopped) return;
    this.stopReel(reel, index);
  }

  stopReel(reel, index) {
    if (reel.stopped) return;

    reel.stopped = true;

    if (reel.intervalEvent) {
      reel.intervalEvent.remove(false);
      reel.intervalEvent = null;
    }

    const finalSymbol = this.getControlledResult(index);
    reel.value = finalSymbol;

    reel.items.forEach((item, i) => {
      const randomSymbol = Phaser.Utils.Array.GetRandom(SYMBOLS);
      const hasTex = this.textures.exists(`sym_${randomSymbol.key}`);

      item.symbol = randomSymbol;
      item.txt.y = (i - 2) * 64;
      item.bg.y = (i - 2) * 64;
      if (item.img) {
        item.img.y = (i - 2) * 64;
        if (hasTex) item.img.setTexture(`sym_${randomSymbol.key}`).setDisplaySize(50, 50);
        item.img.setVisible(hasTex);
      }
      item.txt.setText(randomSymbol.label);
      item.txt.setColor(randomSymbol.color);
      item.txt.setFontSize(randomSymbol.label.length > 1 ? 42 : 52);
      item.txt.setVisible(!hasTex);
    });

    const center = reel.items[2];
    const centerHasTex = this.textures.exists(`sym_${finalSymbol.key}`);

    center.symbol = finalSymbol;
    if (center.img) {
      center.img.y = 0;
      if (centerHasTex) center.img.setTexture(`sym_${finalSymbol.key}`).setDisplaySize(50, 50);
      center.img.setVisible(centerHasTex);
    }
    center.txt.setText(finalSymbol.label);
    center.txt.setColor(finalSymbol.color);
    center.txt.setFontSize(finalSymbol.label.length > 1 ? 42 : 52);
    center.txt.y = 0;
    center.bg.y = 0;
    center.txt.setVisible(!centerHasTex);

    this.sfx.reelStop();

    this.tweens.add({
      targets: reel.container,
      y: LAYOUT.reelY + 7,
      duration: 120,
      ease: "Sine.easeOut",
      yoyo: true,
    });

    this.tweens.add({
      targets: center.txt,
      scale: 1.15,
      duration: 140,
      yoyo: true,
    });

    reel.frame.setStrokeStyle(4, 0xffd700);

    this.stoppedReelsCount++;

    if (this.stoppedReelsCount >= this.reels.length) {
      this.time.delayedCall(250, () => {
        this.isSpinning = false;
        this.setBetButtonsEnabled(true);
        this.checkWin();
      });
    }
  }

  getControlledResult(index) {
    if (this.targetSymbols && this.targetSymbols[index]) {
      return this.targetSymbols[index];
    }
    return Phaser.Utils.Array.GetRandom(SYMBOLS);
  }

  checkWin() {
    const [a, b, c] = this.reels.map((reel) => {
      const center = reel.items[2];
      return center.symbol || reel.value;
    });

    if (this.serverRound && this.serverRound.ok) {
      this.balance = this.serverRound.newBalance;
      if (this.serverRound.isWin && this.serverRound.payout > 0) {
        const win = Math.round(this.serverRound.payout);
        this.lastWin = win;
        this.updateDisplay();
        if (this.serverRound.multiplier >= 10) {
          this.setMessage(`MEGA WIN! +${this.formatMoney(win)} (${Number(this.serverRound.multiplier).toFixed(2)}x)`, 18);
          this.playJackpot();
        } else if (this.serverRound.multiplier >= 3) {
          this.setMessage(`BIG WIN! +${this.formatMoney(win)} (${Number(this.serverRound.multiplier).toFixed(2)}x)`, 18);
          this.playBigWin();
        } else {
          this.setMessage(`WIN! +${this.formatMoney(win)} (${Number(this.serverRound.multiplier).toFixed(2)}x)`, 18);
          this.playSmallWin();
        }
      } else {
        this.updateDisplay();
        this.setMessage("No win. Spin again!");
        this.sfx.lose();
      }
      this.scheduleAutoPlay();
      return;
    }

    const isThreeOfAKind = a.key === b.key && b.key === c.key;
    const isPair = a.key === b.key || a.key === c.key || b.key === c.key;

    if (isThreeOfAKind) {
      const win = this.bet * a.multiplier;
      this.balance += win;
      this.lastWin = win;
      this.updateDisplay();
      this.setMessage(`${a.label}${a.label}${a.label} WIN +${this.formatMoney(win)}`, 18);
      this.playBigWin();
      this.scheduleAutoPlay();
      return;
    }

    if (isPair) {
      const pairSymbol = this.getPairSymbol(a, b, c);
      const win = this.bet * 2;
      this.balance += win;
      this.lastWin = win;
      this.updateDisplay();
      this.setMessage(`PAIR ${pairSymbol.label}${pairSymbol.label} +${this.formatMoney(win)}`, 18);
      this.playSmallWin();
      this.scheduleAutoPlay();
      return;
    }

    this.updateDisplay();
    this.setMessage("No win. Try again!");
    this.sfx.lose();
    this.scheduleAutoPlay();
  }

  getPairSymbol(a, b, c) {
    if (a.key === b.key) return a;
    if (a.key === c.key) return a;
    if (b.key === c.key) return b;
    return a;
  }

  scheduleAutoPlay() {
    if (!this.autoPlay) return;

    if (
      this.autoPlayRounds >= this.maxAutoPlayRounds ||
      this.balance < this.bet
    ) {
      this.autoPlay = false;
      this.updateAutoButtonOff();
      this.setMessage("Auto play finished");
      return;
    }

    this.time.delayedCall(750, () => {
      if (this.autoPlay && !this.isSpinning) {
        this.startSpin();
      }
    });
  }

  flashLines() {
    [this.paylineTop, this.paylineMiddle, this.paylineBottom].forEach(
      (line) => {
        this.tweens.add({
          targets: line,
          alpha: 1,
          scaleX: 1.07,
          duration: 120,
          yoyo: true,
          repeat: 6,
        });
      },
    );
  }

  playSmallWin() {
    this.sfx.smallWin();
    this.flashLines();

    this.reels.forEach((reel) => {
      this.tweens.add({
        targets: reel.container,
        scale: 1.06,
        duration: 140,
        yoyo: true,
        repeat: 2,
      });
    });
  }

  playBigWin() {
    this.sfx.bigWin();
    this.cameras.main.flash(350, 255, 215, 0);
    this.cameras.main.shake(450, 0.009);
    this.flashLines();

    this.reels.forEach((reel) => {
      reel.frame.setStrokeStyle(6, 0x00ff99);

      this.tweens.add({
        targets: reel.container,
        scale: 1.12,
        duration: 150,
        yoyo: true,
        repeat: 4,
      });
    });

    this.showWinText("BIG WIN!", "#00ff99");
    this.coinExplosion(45);

    this.time.delayedCall(1000, () => {
      this.reels.forEach((reel) => reel.frame.setStrokeStyle(4, 0xffd700));
    });
  }

  playJackpot() {
    this.sfx.jackpot();
    this.cameras.main.flash(600, 255, 215, 0);
    this.cameras.main.shake(800, 0.014);
    this.flashLines();

    this.tweens.add({
      targets: this.jackpotPanel,
      scale: 1.12,
      duration: 180,
      yoyo: true,
      repeat: 7,
    });

    this.showWinText("JACKPOT!", "#ffd700");
    this.coinExplosion(90);

    this.jackpotValue = this.baseJackpotValue + Phaser.Math.Between(250, 1250);
    this.updateDisplay();
  }

  showWinText(text, color) {
    const winText = this.add
      .text(470, 145, text, {
        fontSize: "60px",
        fontStyle: "bold",
        color,
        stroke: "#000000",
        strokeThickness: 9,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color,
          blur: 16,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: winText,
      scale: 1.24,
      alpha: 0,
      duration: 1800,
      ease: "Cubic.easeOut",
      onComplete: () => winText.destroy(),
    });
  }

  coinExplosion(amount) {
    for (let i = 0; i < amount; i++) {
      const coin = this.add
        .text(
          Phaser.Math.Between(350, 590),
          Phaser.Math.Between(200, 310),
          "●",
          {
            fontSize: `${Phaser.Math.Between(18, 30)}px`,
            color: "#ffd700",
            stroke: "#7a3b00",
            strokeThickness: 3,
          },
        )
        .setOrigin(0.5);

      this.tweens.add({
        targets: coin,
        x: coin.x + Phaser.Math.Between(-300, 300),
        y: coin.y - Phaser.Math.Between(90, 240),
        alpha: 0,
        scale: 1.8,
        angle: Phaser.Math.Between(-360, 360),
        duration: Phaser.Math.Between(800, 1400),
        ease: "Cubic.easeOut",
        onComplete: () => coin.destroy(),
      });
    }
  }
}
