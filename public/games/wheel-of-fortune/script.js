(function() {
  const wheel = document.querySelector('.wheel');
  const spinBtn = document.getElementById('spinTriggerBtn');
  const statusEl = document.getElementById('fortuneStatus');
  const balEl = document.getElementById('wheelBalText');
  const chipBtns = document.querySelectorAll('.chip-btn');

  let currentBet = 50;
  let currentBalance = (window.WinXBridge && window.WinXBridge.getBalance) ? window.WinXBridge.getBalance() : 1000;
  let deg = 0;
  let spinning = false;
  let pendingOutcome = null;

  function renderBalance(val) {
    if (typeof val === 'number' && !isNaN(val)) {
      currentBalance = Math.max(0, Math.round(val));
      if (balEl) balEl.textContent = 'Rs ' + currentBalance.toLocaleString('en-PK');
    }
  }

  if (window.WinXBridge) {
    window.WinXBridge.onBalanceChange(renderBalance);
    window.WinXBridge.init(currentBalance).then(renderBalance);
  } else {
    renderBalance(currentBalance);
  }

  chipBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (spinning) return;
      chipBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentBet = parseInt(btn.getAttribute('data-bet'), 10) || 50;
      spinBtn.textContent = 'SPIN WHEEL (Rs ' + currentBet.toLocaleString('en-PK') + ')';
    });
  });

  spinBtn.addEventListener('click', async () => {
    if (spinning) return;
    if (currentBalance < currentBet) {
      statusEl.textContent = 'INSUFFICIENT PKR WALLET BALANCE';
      statusEl.style.color = '#fca5a5';
      return;
    }

    spinning = true;
    spinBtn.disabled = true;
    statusEl.textContent = 'WHEEL SPINNING... GOOD LUCK!';
    statusEl.style.color = '#fde68a';

    // Call server-governed round so wallet debits/credits immediately
    let serverResult = null;
    if (window.WinXBridge && window.WinXBridge.playServerGovernedRound) {
      serverResult = await window.WinXBridge.playServerGovernedRound('mega-fortune-wheel', currentBet, {});
    }
    pendingOutcome = serverResult;

    deg = Math.floor(3600 + Math.random() * 3600);
    wheel.style.transition = 'all 4.5s cubic-bezier(0.15, 0.85, 0.25, 1)';
    wheel.style.transform = `rotate(${deg}deg)`;
    wheel.classList.add('blur');
  });

  wheel.addEventListener('transitionend', () => {
    wheel.classList.remove('blur');
    spinning = false;
    spinBtn.disabled = false;
    wheel.style.transition = 'none';
    const actualDeg = deg % 360;
    wheel.style.transform = `rotate(${actualDeg}deg)`;

    if (pendingOutcome && pendingOutcome.winAmount > 0) {
      statusEl.textContent = `MEGA WIN! +Rs ${Math.round(pendingOutcome.winAmount).toLocaleString('en-PK')} (${pendingOutcome.multiplier}x)`;
      statusEl.style.color = '#34d399';
    } else {
      statusEl.textContent = 'NO WIN THIS SPIN — TRY AGAIN!';
      statusEl.style.color = '#cbd5e1';
    }
    if (pendingOutcome && typeof pendingOutcome.newBalance === 'number') {
      renderBalance(pendingOutcome.newBalance);
    }
  });
})();
