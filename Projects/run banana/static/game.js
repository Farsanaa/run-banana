const game = document.getElementById("game");
const player = document.getElementById("player");
const obstacle = document.getElementById("obstacle");
const bird = document.getElementById("bird");
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const characterOptions = document.querySelectorAll(".characterOption");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const gameOverBox = document.getElementById("gameOverBox");

const JUMP_DURATION_MS = 700;
const PLAYER_PADDING = 28;
const OBSTACLE_PADDING = 12;
const BIRD_PADDING = 14;
const PLAYER_STAND_HEIGHT = 150;
const PLAYER_DUCK_HEIGHT = 95;
const START_SPEED = 420;
const MAX_SPEED = 760;
const SPEED_STEP = 35;
const SCORE_STEP = 8;
const BG_SCROLL_FACTOR = 0.45;
const BIRD_SCROLL_FACTOR = 0.85;
const BIRD_SPAWN_GAP = 520;
const BIRD_EXTRA_GAP = 220;
const OBSTACLE_RESET_GAP = 40;
const BIRD_START_SCORE = 180;
const BIRD_SAFE_DISTANCE = 420;

let isGameOver = false;
let isJumping = false;
let isDucking = false;
let score = 0;
let highScore = Number(localStorage.getItem("highScore") || 0);
let speed = START_SPEED;
let obstacleX = window.innerWidth + 120;
let birdX = window.innerWidth + 1200;
let backgroundOffset = 0;
let lastFrameTime = null;
let scoreAccumulator = 0;
let birdActive = false;
let hasGameStarted = false;
let selectedCharacter = "banana";

highScoreDisplay.innerText = "High Score: " + highScore;
game.classList.add("prestart");
applyCharacterFrames();

function updateScore() {
    scoreDisplay.innerText = "Score: " + Math.floor(score);
}

function insetRect(rect, padding) {
    return {
        top: rect.top + padding,
        right: rect.right - padding,
        bottom: rect.bottom - padding,
        left: rect.left + padding
    };
}

function rectsOverlap(firstRect, secondRect) {
    return (
        firstRect.left < secondRect.right &&
        firstRect.right > secondRect.left &&
        firstRect.top < secondRect.bottom &&
        firstRect.bottom > secondRect.top
    );
}

function applyCharacterFrames() {
    const characterFrames = {
        banana: {
            frameOne: 'url("/static/run1.png")',
            frameTwo: 'url("/static/run2.png")',
            duckFrame: 'url("/static/run1.png")'
        },
        spongebob: {
            frameOne: 'url("/static/spongebob 1.png")',
            frameTwo: 'url("/static/spongebob2.png")',
            duckFrame: 'url("/static/duck.png")'
        }
    };

    const selectedFrames = characterFrames[selectedCharacter] || characterFrames.banana;

    document.documentElement.style.setProperty("--runner-frame-1", selectedFrames.frameOne);
    document.documentElement.style.setProperty("--runner-frame-2", selectedFrames.frameTwo);
    document.documentElement.style.setProperty("--runner-duck-frame", selectedFrames.duckFrame);
}

function updateCharacterUi() {
    characterOptions.forEach((option) => {
        option.classList.toggle("active", option.dataset.character === selectedCharacter);
    });

    startButton.disabled = false;
}

function positionSprites() {
    obstacle.style.left = `${obstacleX}px`;
    bird.style.left = `${birdX}px`;
    bird.style.display = birdActive ? "block" : "none";
    game.style.backgroundPosition = `${backgroundOffset}px 0`;
}

function resetObstacle() {
    obstacleX = window.innerWidth + OBSTACLE_RESET_GAP + Math.random() * 180;
}

function resetBird() {
    const minBirdX = obstacleX + obstacle.offsetWidth + BIRD_SPAWN_GAP;
    birdX = Math.max(
        window.innerWidth + BIRD_EXTRA_GAP,
        minBirdX + Math.random() * 220
    );
}

function keepBirdBehindObstacle() {
    if (!birdActive) return;

    const minimumBirdX = obstacleX + obstacle.offsetWidth + BIRD_SAFE_DISTANCE;
    if (birdX < minimumBirdX) {
        birdX = minimumBirdX;
    }
}

function jump() {
    if (!hasGameStarted || isGameOver || isJumping) return;

    isJumping = true;
    player.classList.remove("jump");
    void player.offsetWidth;
    player.classList.add("jump");

    setTimeout(() => {
        player.classList.remove("jump");
        isJumping = false;
    }, JUMP_DURATION_MS);
}

function duck() {
    if (!hasGameStarted || isGameOver || isJumping || isDucking) return;

    isDucking = true;
    player.classList.add("duck");
    player.style.height = `${PLAYER_DUCK_HEIGHT}px`;
}

function stopDuck() {
    if (!isDucking) return;

    isDucking = false;
    player.classList.remove("duck");
    player.style.height = `${PLAYER_STAND_HEIGHT}px`;
}

function gameOver() {
    if (isGameOver) return;

    isGameOver = true;
    gameOverBox.classList.remove("hidden");

    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem("highScore", highScore);
        highScoreDisplay.innerText = "High Score: " + highScore;
    }
}

function restartGame() {
    location.reload();
}

function goFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    }
}

function startGame() {
    if (hasGameStarted) return;

    hasGameStarted = true;
    startScreen.classList.add("hidden");
    game.classList.remove("prestart");
    lastFrameTime = null;
    positionSprites();
    requestAnimationFrame(gameLoop);
}

function updateSpeed() {
    const nextSpeed = Math.min(MAX_SPEED, START_SPEED + Math.floor(score / 100) * SPEED_STEP);
    speed = nextSpeed;
}

function checkCollisions() {
    const playerRect = insetRect(player.getBoundingClientRect(), PLAYER_PADDING);
    const obstacleRect = insetRect(obstacle.getBoundingClientRect(), OBSTACLE_PADDING);
    const birdRect = birdActive ? insetRect(bird.getBoundingClientRect(), BIRD_PADDING) : null;

    const hitObstacle = rectsOverlap(playerRect, obstacleRect);
    const hitBird = birdRect ? rectsOverlap(playerRect, birdRect) : false;

    if (hitObstacle || hitBird) {
        gameOver();
    }
}

function updateWorld(deltaMs) {
    const deltaSeconds = deltaMs / 1000;

    scoreAccumulator += deltaMs;
    if (scoreAccumulator >= SCORE_STEP) {
        const pointsEarned = Math.floor(scoreAccumulator / SCORE_STEP);
        score += pointsEarned;
        scoreAccumulator -= pointsEarned * SCORE_STEP;
        updateScore();
        updateSpeed();
    }

    backgroundOffset -= speed * BG_SCROLL_FACTOR * deltaSeconds;
    obstacleX -= speed * deltaSeconds;

    if (!birdActive && score >= BIRD_START_SCORE) {
        birdActive = true;
        resetBird();
    }

    if (birdActive) {
        birdX -= speed * BIRD_SCROLL_FACTOR * deltaSeconds;
        keepBirdBehindObstacle();
    }

    if (obstacleX + obstacle.offsetWidth < 0) {
        resetObstacle();
        keepBirdBehindObstacle();
    }

    if (birdActive && birdX + bird.offsetWidth < 0) {
        resetBird();
    }

    positionSprites();
    checkCollisions();
}

function gameLoop(timestamp) {
    if (!hasGameStarted) return;

    if (lastFrameTime === null) {
        lastFrameTime = timestamp;
    }

    const deltaMs = Math.min(timestamp - lastFrameTime, 40);
    lastFrameTime = timestamp;

    if (!isGameOver) {
        updateWorld(deltaMs);
        requestAnimationFrame(gameLoop);
    }
}

startButton.addEventListener("click", startGame);

characterOptions.forEach((option) => {
    option.addEventListener("click", () => {
        selectedCharacter = option.dataset.character;
        updateCharacterUi();
        applyCharacterFrames();
    });
});

document.addEventListener("keydown", (e) => {
    if (!hasGameStarted && (e.code === "Space" || e.code === "Enter")) {
        e.preventDefault();
        startGame();
        return;
    }

    if (e.code === "Space") {
        e.preventDefault();
        jump();
    }

    if (e.code === "ArrowDown") {
        e.preventDefault();
        duck();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowDown") {
        stopDuck();
    }
});

window.addEventListener("resize", () => {
    obstacleX = Math.min(obstacleX, window.innerWidth + 120);
    birdX = Math.min(birdX, window.innerWidth + 420);
    positionSprites();
});

window.restartGame = restartGame;
window.goFullScreen = goFullScreen;
window.startGame = startGame;

updateScore();
updateCharacterUi();
positionSprites();
