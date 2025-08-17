
let lastTime = 0;
let dropInterval = 500; // how fast piece drops (ms)
let isPaused = false;
let gameOver = false;

let leftFastInterval = null;
let rightFastInterval = null;
let dropFastInterval = null; // will hold interval id

// Get canvas & context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
if (!canvas || !ctx) {
  alert('Canvas not found or not supported!');
  throw new Error('Canvas error');
}


// Game constants
const COLS = 26;
const ROWS = 37;
const BLOCK_SIZE = 15;

// Game state
let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); // grid
let currentPiece = null; // falling piece

// Tetromino shapes
const SHAPES = [
  [[1,1,1,1]],              // I
  [[1,1],[1,1]],            // O
  [[0,1,0],[1,1,1]],        // T
  [[0,1,1],[1,1,0]],        // S
  [[1,1,0],[0,1,1]],        // Z
  [[1,0,0],[1,1,1]],        // J
  [[0,0,1],[1,1,1]]         // L
];

// Create new piece object
function newPiece() {
  const shape =  SHAPES[1]; // SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return { x: 12, y: 0, shape };
}




// Draw single block
function drawBlock(x, y, color='cyan') {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = '#333';
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw the whole board and current piece
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw board
  for (let y=0; y<ROWS; y++) {
    for (let x=0; x<COLS; x++) {
      if (board[y][x]) drawBlock(x, y, 'yellow'); 
    }
  }

  // Draw current piece
  if (currentPiece) {
    currentPiece.shape.forEach((row, dy) => {
      row.forEach((value, dx) => {
        if (value) drawBlock(currentPiece.x + dx, currentPiece.y + dy);
      });
    });
  }
}

// Check collision (if piece overlaps or goes out of bounds)
function collide(piece, dx=0, dy=0) {
  return piece.shape.some((row, y) =>
    row.some((value, x) => {
      if (value) {
        const newX = piece.x + x + dx;
        const newY = piece.y + y + dy;
        return (
          newX < 0 || newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && board[newY][newX])
        );
      }
      return false;
    })
  );
}

// Merge current piece into board (lock it)
function merge(piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[piece.y + y][piece.x + x] = 1;
      }
    });
  });playDropSound();
}

// Remove full lines
function clearLines() {
  let linesCleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      y++; // recheck the same row after shifting
      linesCleared++;
    }
  }

  if (linesCleared > 0) {
    // Play different sound depending on how many lines
    if (linesCleared === 1) {
      playClearedSound(sound1);
    } else {
      playClearedSound(sound1);
      playClearedSound(sound2);
    }
  }

  return linesCleared;
}


// Move current piece down by 1
function moveDown() {
  if (!collide(currentPiece, 0, 1)) {
    currentPiece.y++;
  } else {
    merge(currentPiece);      // piece locks
    score();                  // increment score here!
    currentPiece = newPiece();
    if (collide(currentPiece)) {
      gameOver = true;
      gameOverHandler();
      clearInterval(timerInterval); // stop timer
  
  let finalScore = parseInt(document.getElementById('score').textContent) || 0;
  let timeTaken = getElapsedTimeInSeconds();
  checkHighscore(finalScore, timeTaken)
      console.log('Game Over!');
      return;
    }
  }
}


// Game loop using requestAnimationFrame


function update(time=0) {
  if (gameOver) {
    console.log('🛑 Game stopped.');
    return; // stop the loop
  }

  if (!isPaused) {
    const delta = time - lastTime;
    if (delta > dropInterval) {
      moveDown();
      lastTime = time;
    }
    draw();
  } else {
    draw(); // optional: draw paused state
  }

  requestAnimationFrame(update);
}




// Rotate piece clockwise
function rotate(piece) {
  const rotated = piece.shape[0].map((_,i) =>
    piece.shape.map(row => row[i]).reverse()
  );
  if (!collide({...piece, shape: rotated})) {
    piece.shape = rotated;
  }
}

// Keyboard control

document.addEventListener('keydown', (e) => {
  if (isPaused || gameOver) return;

  if (e.key === 'ArrowLeft' && !collide(currentPiece, -1, 0)) {
    currentPiece.x--;
  }
  else if (e.key === 'ArrowRight' && !collide(currentPiece, 1, 0)) {
    currentPiece.x++;
  }
  else if (e.key === 'ArrowDown') {
    moveDown(); // fast drop
  }
  else if (e.key === 'ArrowUp') {
    rotate(currentPiece);
    playMoveSound();
  }
});


// Helper function to safely move piece
function safeMove(dx, dy=0) {
  if (!collide(currentPiece, dx, dy)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
  }
}

// Virtual button events
document.getElementById('left').addEventListener('click', () => {
  if (isPaused || gameOver) return;
  safeMove(-1);
  if (navigator.vibrate) navigator.vibrate(50);
  playSideSound();
  playClockSound();
});

document.getElementById('right').addEventListener('click', () => {
  if (isPaused || gameOver) return;
  safeMove(1);
  if (navigator.vibrate) navigator.vibrate(50);
  playSideSound();
  playClockSound();
});

document.getElementById('down').addEventListener('click', () => {
  if (isPaused || gameOver) return;
  moveDown();
  if (navigator.vibrate) navigator.vibrate(50);
 playDownSound(); 
 playClockSound();
});

document.getElementById('rotate').addEventListener('click', () => {
  if (isPaused || gameOver) return;
  rotate(currentPiece);
  if (navigator.vibrate) navigator.vibrate(50);
  playMoveSound();
  playClockSound();
});

const downBtn = document.getElementById('down');



//SMOOTH MOVEMENT
const leftBtn = document.getElementById('left');
const rightBtn = document.getElementById('right');

// LEFT button hold
leftBtn.addEventListener('mousedown', () => {
  if (isPaused) return;
  if (!leftFastInterval) {
    leftFastInterval = setInterval(() => {
      if (!collide(currentPiece, -1, 0)) {
        currentPiece.x -= 1;
      }
    }, 100); // move every 100ms, tune speed
  }
});
leftBtn.addEventListener('mouseup', () => {
  clearInterval(leftFastInterval);
  leftFastInterval = null;
});
leftBtn.addEventListener('mouseleave', () => { // if mouse leaves button
  clearInterval(leftFastInterval);
  leftFastInterval = null;
});
// For mobile
leftBtn.addEventListener('touchstart', () => {
  if (isPaused) return;
  if (!leftFastInterval) {
    leftFastInterval = setInterval(() => {
      if (!collide(currentPiece, -1, 0)) {
        currentPiece.x -= 1;
      }
    }, 100);
  }
});
leftBtn.addEventListener('touchend', () => {
  clearInterval(leftFastInterval);
  leftFastInterval = null;
});

// RIGHT button hold
rightBtn.addEventListener('mousedown', () => {
  if (isPaused) return;
  if (!rightFastInterval) {
    rightFastInterval = setInterval(() => {
      if (!collide(currentPiece, 1, 0)) {
        currentPiece.x += 1;
      }
    }, 100);
  }
});
rightBtn.addEventListener('mouseup', () => {
  clearInterval(rightFastInterval);
  rightFastInterval = null;
});
rightBtn.addEventListener('mouseleave', () => {
  clearInterval(rightFastInterval);
  rightFastInterval = null;
});
rightBtn.addEventListener('touchstart', () => {
  if (isPaused) return;
  if (!rightFastInterval) {
    rightFastInterval = setInterval(() => {
      if (!collide(currentPiece, 1, 0)) {
        currentPiece.x += 1;
      }
    }, 100);
  }
});
rightBtn.addEventListener('touchend', () => {
  clearInterval(rightFastInterval);
  rightFastInterval = null;
});



// For mouse users
downBtn.addEventListener('mousedown', () => {
  if (isPaused) return;
  if (!dropFastInterval) {
    dropFastInterval = setInterval(() => {
      moveDown(); // drop piece faster
    }, 50); // every 50ms, you can tune speed
  }
});

downBtn.addEventListener('mouseup', () => {
  clearInterval(dropFastInterval);
  dropFastInterval = null;
});

// For mobile (touch)
downBtn.addEventListener('touchstart', () => {
  if (isPaused) return;
  if (!dropFastInterval) {
    dropFastInterval = setInterval(() => {
      moveDown();
    }, 50);
  }
});

downBtn.addEventListener('touchend', () => {
  clearInterval(dropFastInterval);
  dropFastInterval = null;
});



//Touch Hover Handling
const buttons = document.getElementsByClassName('btn');

for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('touchstart', () => {
    buttons[i].classList.add('active');
  });

  buttons[i].addEventListener('touchend', () => {
    buttons[i].classList.remove('active');
  });
}


//TIMER
let startTime = 0;         
let elapsedTime = 0;      
let timerInterval = null;

// Start the timer
function startTimer() {
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(updateTimer, 1000);
}

// Pause the timer
function pauseTimer() {
  clearInterval(timerInterval);
  elapsedTime = Date.now() - startTime;
  isPaused = true;
}

// Resume timer
function resumeTimer() {
  startTimer();
  isPaused = false;
}

// Update timer display every second
function updateTimer() {
  const timeNow = Date.now() - startTime;
  const totalSeconds = Math.floor(timeNow / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  document.getElementById('timer').textContent = `${minutes}:${seconds}`;
}

function getElapsedTimeInSeconds() {
  const now = Date.now() - startTime;
  return Math.floor(now / 1000);
}

// Bind buttons

const togglePause = () => {
  if (!isPaused) {
    pauseTimer(); 
    playPauseSound();
    // clear all fast intervals
    clearInterval(leftFastInterval); leftFastInterval = null;
    clearInterval(rightFastInterval); rightFastInterval = null;
    clearInterval(dropFastInterval); dropFastInterval = null;

    document.getElementById('pause').style.display = "none";
    document.getElementById('pauseOverlay').classList.toggle('active');
  } else {
    resumeTimer();
     document.getElementById('pauseOverlay').classList.remove('active');
    document.getElementById('pause').textContent = "Pause";
  }
};

// Click event
document.getElementById('pause').addEventListener('click', togglePause);

// Space bar event
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault(); // stop page scroll
    togglePause();
  }
});



//RESUME BUTTON
const resumeGame = () => {
  if (isPaused) {
    resumeTimer(); 
    pausePauseSound();
    document.getElementById('pause').style.display = "block";
    document.getElementById('pauseOverlay').classList.remove('active');
  }
};

document.getElementById('resume').addEventListener('click', resumeGame);

document.addEventListener('keydown', (e) => {
  // Check for spacebar (key === ' ' works in modern browsers)
  if (e.code === 'Space') {
    e.preventDefault(); // Prevent page scrolling
    resumeGame();
    pausePauseSound();
  }
});

  
  

//Score

function score() {
    let scoreEl = document.getElementById('score');
    let pop = document.getElementById('pops');
    let currentScore = parseInt(scoreEl.textContent) || 0;
    let cleared = clearLines(); // now returns number

    if (cleared > 0) {
        let added = 100 * cleared;
        currentScore += added;
        playClearedSound();
        if (pop) pop.classList.toggle('active');
        showPopText('+' + added + '🔥');  // show floating animation
    } else {
            
        currentScore += 10;
        showPopText('+10');
    }

    scoreEl.textContent = currentScore;
}


//Pop Up
function showPopText(text) {
  const container = document.getElementById('pop-container');
  const pop = document.createElement('div');
  pop.className = 'pop';
  pop.textContent = text;

  container.appendChild(pop);

  // remove after animation
  pop.addEventListener('animationend', () => {
    container.removeChild(pop);
  });
}

//HIGHSCORE
function checkHighscore(finalScore, timeTaken) {
  let saved = localStorage.getItem('highscore');
  let best = saved ? JSON.parse(saved) : null;
console.log("Old highscore:", JSON.stringify(highscore));

  if (!best || finalScore > best.score) {
    // New highscore
    localStorage.setItem('highscore', JSON.stringify({ score: finalScore, time: timeTaken }));
    console.log('🎉 New highscore saved:', finalScore, 'Time:', timeTaken);
  } else if (finalScore === best.score && timeTaken < best.time) {
    // Same score, faster time
    localStorage.setItem('highscore', JSON.stringify({ score: finalScore, time: timeTaken }));
    console.log('⚡ Faster time saved:', finalScore, 'Time:', timeTaken);
  } else {
    console.log('No new highscore.');
  }
}



function showHighscore() {
  let saved = localStorage.getItem('highscore');
  if (saved) {
    let best = JSON.parse(saved);
    console.log('🏆 Highscore:', best.score, 'Time:', best.time, 'secs');
   
     document.getElementById('highscore').textContent = best.score;
  }
}



function disableAllButtons() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.style.pointerEvents = 'none';
  });
}

function enableAllButtons() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.style.pointerEvents = 'auto';
  });
}

//Level Update

let currentLevel = "";
function updateLevel(timeTaken) {
  
  let newLevel = "Beginner";

  if (timeTaken > 1250) {
    newLevel = "Legend 💎💎💎";
    dropInterval = 100;
  } else if (timeTaken > 980) {
    newLevel = "Pro 💎";
    dropInterval = 160;
  } else if (timeTaken > 770) {
    newLevel = "Guru ⭐⭐";
    dropInterval = 200;
  } else if (timeTaken > 500) {
    newLevel = "Star ⭐";
    dropInterval = 250;
  } else if (timeTaken > 300) {
    newLevel = "Medalist 🏅";
    dropInterval = 300;
  }else if (timeTaken > 120) {
    newLevel = "Expert";
    dropInterval = 350;
  }
  
  if (newLevel !== currentLevel && timeTaken > 120) {
    currentLevel = newLevel;
    document.getElementById('level').textContent = newLevel;
    playNewLevelSound();    
    showLevelUpPopup("NEW LEVEL⭐"); // Trigger animatio
    
 }
 }

// this timer tracking seconds
let secondsElapsed = 0;

setInterval(() => {
  secondsElapsed++;
  updateLevel(secondsElapsed);  // Update level based on time
}, 1000);

//NEW Level Pop Up
function showLevelUpPopup(message = "GO🔥") {
  const popup = document.getElementById('levelUpPopup');
  popup.textContent = message;

  popup.classList.remove('active'); // reset animation if it's already showing
  void popup.offsetWidth; // trigger reflow

  popup.classList.add('active');

  setTimeout(() => {
    popup.classList.remove('active');
  }, 2000); // Hide after 2 seconds
}


  




function gameOverHandler() {
  gameOver = true;
  disableAllButtons();
  clearInterval(timerInterval);  // stop timer
  let finalScore = parseInt(document.getElementById('score').textContent) || 0;
  let timeTaken = getElapsedTimeInSeconds();
  checkHighscore(finalScore, timeTaken);

  console.log('🛑 Game Over! Final score:', finalScore, 'Time taken:', timeTaken);
  playGameOverSound();
showGameOver(finalScore);

  // Optional: show Game Over UI / replay button
}





function showGameOver(score) {
  document.getElementById('finalScore').textContent = score;
  document.getElementById('gameOverOverlay').style.display = 'flex';
  gameOver = true;
}


window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('restartBtn').addEventListener('click', restartGame);
});


function restartGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  currentScore = 0;
  gameOver = false;
  currentPiece = newPiece();
  secondsElapsed = 0;

  document.getElementById('score').textContent = "00";
  document.getElementById('gameOverOverlay').style.display = 'none';
  playClockSound();
  enableAllButtons();
  startTimer();
  update();

  // Show "Game Start" animation popup
  showLevelUpPopup("Game On🤜🏽🤛🏼");
}


// === Master Sound Control ===
let soundEnabled = true;  // Effects
let musicEnabled = true;  // Background loop

function toggleSound() {
  soundEnabled = !soundEnabled;
  musicEnabled = soundEnabled; // Keep both in sync with one toggle
  console.log(`Sound ${soundEnabled ? 'enabled' : 'disabled'}`);
}

// === Sound Effect Elements ===
const moveSound = new Audio('sounds/button.mp3');
const dropSound = new Audio('sounds/keyed.wav');
const levelUpSound = new Audio('sounds/levelup.mp3');
const sideButtonSound = new Audio('sounds/click.mp3');
const newLevelSound = new Audio('sounds/newlevel.wav');
const downButtonSound = new Audio('sounds/down.mp3');
const pauseSound = new Audio('sounds/menu.mp3');
const timeSound = new Audio('sounds/clock.mp3');
const gameOverSound = new Audio('sounds/gameOver.mp3');

// Preload for no delay
[moveSound, 
dropSound, 
levelUpSound,
sideButtonSound,
newLevelSound,
downButtonSound, 
pauseSound,
timeSound,
gameOverSound
].forEach(sound => {
  sound.preload = 'auto';
  sound.load();
});


// === Play Functions ===




function playGameOverSound() {
  if (soundEnabled) {
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    gameOverSound.volume = 0.5;  
  }
}

function playClockSound() {
  if (soundEnabled) {
    timeSound.currentTime = 0;
    timeSound.play();
    timeSound.volume = 0.2;  
    timeSound.loop = true;
  }
}


function playPauseSound() {
  if (soundEnabled) {
    pauseSound.currentTime = 0;
    pauseSound.play();
    pauseSound.volume = 0.1;  
    pauseSound.loop = true;
  }
}


function pausePauseSound() {
    pauseSound.pause();
    pauseSound.currentTime = 0; 
  
}



function playMoveSound() {
  if (soundEnabled) {
    moveSound.currentTime = 0;
    moveSound.play();
  }
}

function playDropSound() {
  if (soundEnabled) {
    dropSound.currentTime = 0;
    dropSound.play();
  }
}

function playLevelUpSound() {
  if (soundEnabled) {
    levelUpSound.currentTime = 0;
    levelUpSound.play();
  }
}


function playSideSound() {
  if (soundEnabled) {
    sideButtonSound.currentTime = 0;
    sideButtonSound.play();
  }
}

function playNewLevelSound() {
  if (soundEnabled) {
    newLevelSound.currentTime = 0;
    newLevelSound.play();
  }
}

function playDownSound() {
  if (soundEnabled) {
    downButtonSound.currentTime = 0;
    downButtonSound.play()  }
}

const sound1 = new Audio('sounds/cleared1.mp3');
const sound2 = new Audio('sounds/cleared2.mp3');

function playClearedSound(sound) {
  if (soundEnabled && sound) {
    sound.currentTime = 0; // restart from beginning
    sound.play();
  }
}




// === Background Music List ===
const soundFiles = [
'sounds/tune1.mp3',
'sounds/tune2.mp3',
'sounds/tune4.mp3',
'sounds/tune5.mp3',
'sounds/tune6.mp3',
'sounds/tune7.mp3',
'sounds/tune8.mp3',
'sounds/tune9.mp3',
'sounds/tune10.mp3',
'sounds/tune11.mp3',
'sounds/tune12.mp3'

];

// Preload background sounds
const sounds = soundFiles.map(src => {
  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.load();
  return audio;
});

//=== control music volume
document.getElementById('volumeControl').addEventListener('input', (e) => {
  musicVolume = parseFloat(e.target.value);
  if (currentSound) {
    currentSound.volume = musicVolume; // adjust live
  }
});



// === Play Random Loop ===
let currentSound = null; // track the currently playing sound
let musicVolume = 1.0;

function playRandomSoundLoop() {
  if (!musicEnabled) return;

  // Stop the currently playing sound
  if (currentSound) {
    currentSound.pause();
    currentSound.currentTime = 0;
  }

  // Pick a different sound than last one
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * sounds.length);
  } while (newIndex === currentSoundIndex);

  currentSoundIndex = newIndex;
  currentSound = sounds[currentSoundIndex];
  currentSound.volume = musicVolume;
  // Start the new sound
  currentSound.currentTime = 0;
  currentSound.play();
  
  // When finished, start another
  currentSound.onended = () => {
    playRandomSoundLoop();
  };
}

// === Stop Loop ===
function stopSoundLoop() {
  sounds.forEach(s => {
    s.pause();
    s.currentTime = 0;
  });
  currentSoundIndex = null;
}

// ===Sound  Button Control ===


function unmute() {
  // Set flags
  toggleSound();

  playRandomSoundLoop(); // Start music immediately

  document.getElementById('soundToggle').textContent =
    soundEnabled ? "ON 🔊" : "OFF 🔇";

  // Control music
  if (musicEnabled) {
    playRandomSoundLoop();
  } else {
    stopSoundLoop();
  }
}  // <-- Close unmute function here

// Define once outside the function (at top-level scope)
const menuSoundAudio = new Audio('sounds/menuSound.mp3');
menuSoundAudio.loop = true;

function menuSound() {
  const toggleBtn = document.getElementById('menuSoundToggle');

  // Toggle soundEnabled
  soundEnabled = !soundEnabled;

  if (soundEnabled) {
    menuSoundAudio.currentTime = 0;
    menuSoundAudio.play();
    toggleBtn.textContent = "OFF 🔇";
  } else {
    menuSoundAudio.pause();
    toggleBtn.textContent = "ON 🔊 ";
  }
}



  





//⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

//HOME PAGE LOGIC


 // Brick colors from your theme
    const colors = ["lime", "cyan", "orange", "magenta", "red", "yellow"];
    const logo = document.querySelector('.logo');

    // Create falling bricks
    for (let i = 0; i < 15; i++) {
        let brick = document.createElement('div');
        brick.classList.add('brick');
        brick.style.background = colors[Math.floor(Math.random() * colors.length)];
        brick.style.left = `${Math.random() * 300 - 150}px`; // spread around logo
        brick.style.top = `${Math.random() * -200}px`;
        brick.style.animationDelay = `${Math.random() * 2}s`;
        logo.appendChild(brick);
    }
    
  //Start Button 
  
 document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('startBtnContainer');
  
  if (button) {
    setTimeout(() => {
      button.classList.add('active');
    }, 1500); // after 1.5s
  }
}); 



//Menu Logic Script
document.getElementById('menuBtn').addEventListener('click', () => {
 document.getElementById('menu').classList.toggle('active');
});

window.addEventListener('dblclick', () => {
  document.getElementById('menu').classList.toggle('active');
});






// Start game
document.getElementById('StartBtn').addEventListener('click', () => {
  const toggleBtn = document.getElementById('menuSoundToggle');

  // Hide menu, show game
  document.getElementById('gamePlay').style.display = 'flex'; 
  document.querySelector('.gameBrand').style.display = 'none'; 
  document.getElementById('menuBtn').style.display = 'none';
  document.getElementById('menu').style.display = 'none';
   menuSoundAudio.pause();
  // Start game logic
  currentPiece = newPiece();
  update();
  startTimer();
  showLevelUpPopup("Game Start 👍🏽");

  // Stop menu background sound (if playing)
  if (typeof stopSoundLoop === "function") {
    stopSoundLoop();
  }

  // Start random game music if sound is enabled
  if (soundEnabled) {
    playRandomSoundLoop();
  }
});

// Bonus: Save score to localStorage
window.addEventListener('beforeunload', () => {
  const currentScore = parseInt(document.getElementById('score').textContent) || 0;
  localStorage.setItem('damieTetrisScore', currentScore);
});
