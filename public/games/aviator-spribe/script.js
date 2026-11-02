const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let speedX = 2.8;
let speedY = 1;

canvas.width = 800;
canvas.height = 280;

let x = 0;
let y = canvas.height;
let animationId = null;

let dotPath = [];
let counter = 1.0;
let counterDepo = [1.85, 12.40, 2.15, 5.21, 1.22, 3.45, 2.03, 4.55, 24.10, 1.32, 1.95, 3.01];
let randomStop = 2.45;
let cashedOut = false;
let placedBet = false;
let queuedBet = false;
let activeStake = 0;
let isFlying = false;

const image = new Image();
image.src = './img/aviator_jogo.png';

const balanceAmount = document.getElementById('balance-amount');
let calculatedBalanceAmount = window.WinXBridge ? window.WinXBridge.getBalance() : 5000;
const betButton = document.getElementById('bet-button');
const lastCounters = document.getElementById('last-counters');
const inputBox = document.getElementById('bet-input');
const messageField = document.getElementById('message');
const counterEl = document.getElementById('counter');

function renderBalance() {
    balanceAmount.textContent = 'Rs ' + Math.round(calculatedBalanceAmount).toLocaleString('en-PK');
}
renderBalance();

if (window.WinXBridge) {
    window.WinXBridge.init(calculatedBalanceAmount).then((bal) => {
        calculatedBalanceAmount = bal;
        renderBalance();
    });
    window.WinXBridge.onBalanceChange((bal) => {
        calculatedBalanceAmount = bal;
        renderBalance();
    });
}

document.querySelectorAll('.q-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        inputBox.value = btn.dataset.val;
    });
});

function updateCounterDepo() {
    lastCounters.innerHTML = counterDepo.slice(0, 10).map(function (i) {
        let cls = 'blueBorder';
        if (i >= 2 && i < 10) cls = 'purpleBorder';
        else if (i >= 10) cls = 'burgundyBorder';
        return '<p class="' + cls + '">' + Number(i).toFixed(2) + 'x</p>';
    }).join('');
}
updateCounterDepo();

async function pickCrashPoint() {
    const r = Math.random();
    if (r < 0.04) return 1.01;
    return Math.min(100, Math.max(1.05, Number((0.97 / (1 - Math.random())).toFixed(2))));
}

async function startNewFlight() {
    randomStop = await pickCrashPoint();
    counter = 1.0;
    x = 40;
    y = canvas.height - 30;
    dotPath = [];
    cashedOut = false;
    isFlying = true;
    counterEl.style.color = '#ffffff';

    if (queuedBet) {
        queuedBet = false;
        const stake = Number(inputBox.value) || 0;
        if (stake > 0 && stake <= calculatedBalanceAmount) {
            if (window.WinXBridge) {
                const res = await window.WinXBridge.debitBet('aviator', stake);
                if (res.ok) {
                    calculatedBalanceAmount = res.newBalance;
                } else {
                    calculatedBalanceAmount -= stake;
                }
            } else {
                calculatedBalanceAmount -= stake;
            }
            renderBalance();
            activeStake = stake;
            placedBet = true;
            betButton.textContent = 'CASH OUT';
            betButton.className = 'cashout-active';
            messageField.textContent = 'Plane is flying! Click CASH OUT anytime!';
        }
    } else if (!placedBet) {
        betButton.textContent = 'BET NEXT ROUND';
        betButton.className = '';
        messageField.textContent = 'Flight in progress — Queue bet for next round';
    }

    animationId = requestAnimationFrame(draw);
}

function draw() {
    const growth = Math.max(0.0035, counter * 0.0045);
    counter += growth;
    counterEl.textContent = counter.toFixed(2) + 'x';

    if (placedBet && !cashedOut) {
        const liveWin = Math.round(activeStake * counter);
        betButton.textContent = `CASH OUT (Rs ${liveWin})`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (counter >= randomStop) {
        isFlying = false;
        cancelAnimationFrame(animationId);
        counterEl.textContent = `FLEW AWAY @ ${randomStop.toFixed(2)}x`;
        counterEl.style.color = '#fb024c';

        counterDepo.unshift(Number(randomStop.toFixed(2)));
        updateCounterDepo();

        if (placedBet && !cashedOut) {
            placedBet = false;
            activeStake = 0;
            betButton.textContent = 'BET';
            betButton.className = '';
            messageField.textContent = `Flew away at ${randomStop.toFixed(2)}x! Place your bet for next flight`;
        } else if (!queuedBet) {
            betButton.textContent = 'BET';
            betButton.className = '';
            messageField.textContent = 'Next flight taking off in 3s — Place your bet!';
        }

        setTimeout(() => {
            startNewFlight();
        }, 3200);
        return;
    }

    x += speedX;
    y = canvas.height / 2 + 45 * Math.cos(x / 95);
    dotPath.push({ x: x, y: y });

    const canvasOffsetX = canvas.width / 2 - x;
    const canvasOffsetY = canvas.height / 2 - y;

    ctx.save();
    ctx.translate(canvasOffsetX, canvasOffsetY);

    ctx.beginPath();
    ctx.strokeStyle = '#fb024c';
    ctx.lineWidth = 4;
    for (let i = 1; i < dotPath.length; i++) {
        ctx.moveTo(dotPath[i - 1].x, dotPath[i - 1].y);
        ctx.lineTo(dotPath[i].x, dotPath[i].y);
    }
    ctx.stroke();

    ctx.drawImage(image, x - 28, y - 68, 155, 72);
    ctx.restore();

    animationId = requestAnimationFrame(draw);
}

betButton.addEventListener('click', async () => {
    const stake = Number(inputBox.value) || 0;
    if (placedBet && !cashedOut && isFlying) {
        await cashOut();
        return;
    }

    if (queuedBet) {
        queuedBet = false;
        betButton.textContent = 'BET';
        betButton.className = '';
        messageField.textContent = 'Queued bet cancelled';
        return;
    }

    if (stake <= 0 || stake > calculatedBalanceAmount) {
        messageField.textContent = 'Insufficient balance or invalid bet amount';
        return;
    }

    if (!isFlying) {
        // Place bet immediately for upcoming flight
        if (window.WinXBridge) {
            const res = await window.WinXBridge.debitBet('aviator', stake);
            if (res.ok) calculatedBalanceAmount = res.newBalance;
            else calculatedBalanceAmount -= stake;
        } else {
            calculatedBalanceAmount -= stake;
        }
        renderBalance();
        activeStake = stake;
        placedBet = true;
        cashedOut = false;
        betButton.textContent = 'CASH OUT';
        betButton.className = 'cashout-active';
        messageField.textContent = `Bet placed: Rs ${stake} — Ready for takeoff!`;
    } else {
        queuedBet = true;
        betButton.textContent = `QUEUED (Rs ${stake}) - CANCEL`;
        betButton.className = 'queued-active';
        messageField.textContent = `Rs ${stake} queued for the next flight!`;
    }
});

async function cashOut() {
    if (cashedOut || !placedBet || !isFlying) return;
    if (counter < randomStop) {
        cashedOut = true;
        placedBet = false;
        const mult = Number(counter.toFixed(2));
        const winnings = Math.round(activeStake * mult);
        if (window.WinXBridge) {
            const res = await window.WinXBridge.creditWin('aviator', winnings, mult);
            if (res.ok) calculatedBalanceAmount = res.newBalance;
            else calculatedBalanceAmount += winnings;
        } else {
            calculatedBalanceAmount += winnings;
        }
        renderBalance();
        betButton.textContent = 'BET NEXT ROUND';
        betButton.className = '';
        messageField.textContent = `WON Rs ${winnings.toLocaleString('en-PK')} at ${mult.toFixed(2)}x!`;
    }
}

startNewFlight();
