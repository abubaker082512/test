import Slot from "./Slot.js";

const jpSpan = document.getElementById("jp");
const winMsg = document.getElementById("winMsg");
const spinBtn = document.getElementById("spin");
const chips = document.querySelectorAll(".g-chip");

let currentBet = 50;
let balance = (window.WinXBridge && window.WinXBridge.getBalance) ? window.WinXBridge.getBalance() : 1000;
let lastOutcome = null;

function renderBal(val) {
  if (typeof val === "number" && !isNaN(val)) {
    balance = Math.max(0, Math.round(val));
    if (jpSpan) jpSpan.textContent = "Rs " + balance.toLocaleString("en-PK");
  }
}

if (window.WinXBridge) {
  window.WinXBridge.onBalanceChange(renderBal);
  window.WinXBridge.init(balance).then(renderBal);
} else {
  renderBal(balance);
}

chips.forEach((btn) => {
  btn.addEventListener("click", () => {
    chips.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentBet = parseInt(btn.getAttribute("data-bet"), 10) || 50;
    spinBtn.textContent = `SPIN (Rs ${currentBet})`;
  });
});

const config = {
  inverted: false,
  onSpinStart: async (symbols) => {
    winMsg.textContent = "SPINNING...";
    winMsg.style.color = "#fde68a";
    lastOutcome = null;
    if (window.WinXBridge && window.WinXBridge.playServerGovernedRound) {
      lastOutcome = await window.WinXBridge.playServerGovernedRound("galaxy-slots", currentBet, {});
    }
  },
  onSpinEnd: (symbols) => {
    // Check if middle row has matching symbols or server awarded win
    const midRow = symbols.map((col) => col[1]);
    const counts = {};
    midRow.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
    const maxMatch = Math.max(...Object.values(counts));

    if (lastOutcome && lastOutcome.winAmount > 0) {
      winMsg.textContent = `WIN +Rs ${Math.round(lastOutcome.winAmount).toLocaleString("en-PK")} (${lastOutcome.multiplier}x)!`;
      winMsg.style.color = "#34d399";
      renderBal(lastOutcome.newBalance);
    } else if (maxMatch >= 3) {
      const mult = maxMatch === 5 ? 10 : maxMatch === 4 ? 4 : 2;
      const winAmt = currentBet * mult;
      if (window.WinXBridge) {
        window.WinXBridge.creditWin("galaxy-slots", winAmt, mult);
      }
      winMsg.textContent = `LINE MATCH! +Rs ${winAmt.toLocaleString("en-PK")} (${mult}x)`;
      winMsg.style.color = "#34d399";
    } else {
      winMsg.textContent = "TRY AGAIN";
      winMsg.style.color = "#94a3b8";
      if (lastOutcome && typeof lastOutcome.newBalance === "number") {
        renderBal(lastOutcome.newBalance);
      }
    }
  },
};

new Slot(document.getElementById("slot"), config);
