
1| 
2| let lastTime = 0;
3| let dropInterval = 500; // how fast piece drops (ms)
4| let isPaused = false;
5| let gameOver = false;
6| 
7| let leftFastInterval = null;
8| let rightFastInterval = null;
9| let dropFastInterval = null; // will hold interval id
10| 
11| // Get canvas & context
12| const canvas = document.getElementById('gameCanvas');
13| const ctx = canvas.getContext('2d');
14| if (!canvas || !ctx) {
15|   alert('Canvas not found or not supported!');
16|   throw new Error('Canvas error');
17| }
18| 
19| 
20| // Game constants
21| const COLS = 26;
22| const ROWS = 37;
23| const BLOCK_SIZE = 15;
24| 
25| // Game state
26| let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); // grid
27| let currentPiece = null; // falling piece
28| 
29| // Tetromino shapes
30| const SHAPES = [
31|   [[1,1,1,1]],              // I
32|   [[1,1],[1,1]],            // O
33|   [[0,1,0],[1,1,1]],        // T
34|   [[0,1,1],[1,1,0]],        // S
35|   [[1,1,0],[0,1,1]],        // Z
36|   [[1,0,0],[1,1,1]],        // J
37|   [[0,0,1],[1,1,1]]         // L
38| ];
39| 
40| // Create new piece object
41| function newPiece() {
42|   const shape =  SHAPES[1]; // SHAPES[Math.floor(Math.random() * SHAPES.length)];
43|   return { x: 12, y: 0, shape };
44| }
45| 
46| 
47| 
48| 
49| // Draw single block
50| function drawBlock(x, y, color='cyan') {
51|   ctx.fillStyle = color;
52|   ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
53|   ctx.strokeStyle = '#333';
54|   ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
55| }
56| 
57| // Draw the whole board and current piece
58| function draw() {
59|   ctx.clearRect(0, 0, canvas.width, canvas.height);
60|   
61|   // Draw board
62|   for (let y=0; y<ROWS; y++) {
63|     for (let x=0; x<COLS; x++) {
64|       if (board[y][x]) drawBlock(x, y, 'yellow'); 
65|     }
66|   }
67| 
68|   // Draw current piece
69|   if (currentPiece) {
70|     currentPiece.shape.forEach((row, dy) => {
71|       row.forEach((value, dx) => {
72|         if (value) drawBlock(currentPiece.x + dx, currentPiece.y + dy);
73|       });
74|     });
75|   }
76|  // Draw workers
77|   workers.forEach(worker => {
78|     ctx.drawImage(workerImg, worker.x, worker.y, worker.width, worker.height);
79|   });
80| }
81| 
82| // Check collision (if piece overlaps or goes out of bounds)
83| function collide(piece, dx=0, dy=0) {
84|   return piece.shape.some((row, y) =>
85|     row.some((value, x) => {
86|       if (value) {
87|         const newX = piece.x + x + dx;
88|         const newY = piece.y + y + dy;
89|         return (
90|           newX < 0 || newX >= COLS ||
91|           newY >= ROWS ||
92|           (newY >= 0 && board[newY][newX])
93|         );
94|       }
95|       return false;
96|     })
97|   );
98| }
99| 
100| function pieceCollidesWithWorkers(piece) {
101|   if (!workerImg.complete) return false; // wait until image loads
102| 
103|   // Check each block of the piece
104|   for (let y = 0; y < piece.shape.length; y++) {
105|     for (let x = 0; x < piece.shape[y].length; x++) {
106|       if (piece.shape[y][x]) {
107|         // Position of block in pixels
108|         const blockX = (piece.x + x) * BLOCK_SIZE;
109|         const blockY = (piece.y + y) * BLOCK_SIZE;
110| 
111|         // Check against each worker
112|         for (const worker of workers) {
113|           if (
114|             blockX < worker.x + worker.width &&
115|             blockX + BLOCK_SIZE > worker.x &&
116|             blockY < worker.y + worker.height &&
117|             blockY + BLOCK_SIZE > worker.y
118|           ) {
119|             return true; // collision detected
120|           }
121|         }
122|       }
123|     }
124|   }
125|   return false;
126| }
127| 
128| 
129| 
130| // Merge current piece into board (lock it)
131| function merge(piece) {
132|   piece.shape.forEach((row, y) => {
133|     row.forEach((value, x) => {
134|       if (value) {
135|         board[piece.y + y][piece.x + x] = 1;
136|       }
137|     });
138|   });playDropSound();
139| }
140| 
141| // Remove full lines
142| function clearLines() {
143|   let linesCleared = 0;
144|   for (let y = ROWS - 1; y >= 0; y--) {
145|     if (board[y].every(cell => cell)) {
146|       board.splice(y, 1);
147|       board.unshift(Array(COLS).fill(0));
148|       y++; // recheck the same row after shifting
149|       linesCleared++;
150|     }
151|   }
152| 
153|   if (linesCleared > 0) {
154|     // Play different sound depending on how many lines
155|     if (linesCleared === 1) {
156|       playClearedSound(sound1);
157|     } else {
158|       playClearedSound(sound1);
159|       playClearedSound(sound2);
160|     }
161|   }
162| 
163|   return linesCleared;
164| }
165| 
166| 
167| // Move current piece down by 1
168| function moveDown() {
169|   if (collide(currentPiece, 0, 1) || pieceCollidesWithWorkers(currentPiece)) {
170|   merge(currentPiece);
171|   score();
172| 
173|   if (pieceCollidesWithWorkers(currentPiece)) {
174|     gameOver = true;
175|     gameOverHandler();
176|     clearInterval(timerInterval);
177|     console.log('Game Over - Hit construction worker!');
178|     return;
179|   }
180| 
181|   currentPiece = newPiece();
182| 
183|   if (collide(currentPiece) || pieceCollidesWithWorkers(currentPiece)) {
184|     gameOver = true;
185|     gameOverHandler();
186|     clearInterval(timerInterval);
187|   
188|     console.log('Game Over!');
189|     return;
190|   }
191| } else {
192|   currentPiece.y++;
193| }
194| }
195| 
196| 
197| // Game loop using requestAnimationFrame
198| 
199| 
200| function update(time=0) {
201|   if (gameOver) {
202|     console.log('🛑 Game stopped.');
203|     return; // stop the loop
204|   }
205| 
206|   if (!isPaused) {
207|     const delta = time - lastTime;
208|     if (delta > dropInterval) {
209|       moveDown();
210|       lastTime = time;
211|     }
212|     
213|    // Spawn workers at scheduled secondsElapsed times
214|     if (WORKER_SPAWN_TIMES.includes(secondsElapsed)) {
215|       spawnWorker();
216|       // To prevent multiple spawns in the same second, remove that time from array
217|       const index = WORKER_SPAWN_TIMES.indexOf(secondsElapsed);
218|       if (index > -1) WORKER_SPAWN_TIMES.splice(index, 1);
219|     }
220| 
221|     // Update workers positions
222|     updateWorkers(); 
223|     
224|     // Check collision with workers after moveDown and update workers position
225|     if (currentPiece && pieceCollidesWithWorkers(currentPiece)) {
226|       gameOver = true;
227|       gameOverHandler();
228|       clearInterval(timerInterval);
229|       console.log('Game Over - Hit construction worker!');
230|       return;
231|     }
232|     
233|     draw();
234|   } else {
235|     draw(); // optional: draw paused state
236|   }
237| 
238|   requestAnimationFrame(update);
239| }
240| 
241| 
242| 
243| 
244| // Rotate piece clockwise
245| function rotate(piece) {
246|   const rotated = piece.shape[0].map((_,i) =>
247|     piece.shape.map(row => row[i]).reverse()
248|   );
249|   if (!collide({...piece, shape: rotated})) {
250|     piece.shape = rotated;
251|   }
252| }
253| 
254| // Keyboard control
255| 
256| document.addEventListener('keydown', (e) => {
257|   if (isPaused || gameOver) return;
258| 
259|   if (e.key === 'ArrowLeft' && !collide(currentPiece, -1, 0)) {
260|     currentPiece.x--;
261|   }
262|   else if (e.key === 'ArrowRight' && !collide(currentPiece, 1, 0)) {
263|     currentPiece.x++;
264|   }
265|   else if (e.key === 'ArrowDown') {
266|     moveDown(); // fast drop
267|   }
268|   else if (e.key === 'ArrowUp') {
269|     rotate(currentPiece);
270|     playMoveSound();
271|   }
272| });
273| 
274| 
275| // Helper function to safely move piece
276| function safeMove(dx, dy=0) {
277|   if (!collide(currentPiece, dx, dy)) {
278|     currentPiece.x += dx;
279|     currentPiece.y += dy;
280|   }
281| }
282| 
283| 
284| // --- Add near your constants ---
285| const WORKER_SIZE = BLOCK_SIZE * 3;
286| const WORKER_SPEED = 0.8; // pixels per frame (adjust speed as you want)
287| 
288| // Array of scheduled spawn times in seconds
289| const WORKER_SPAWN_TIMES = [5, 40, 80, 95, 140, 185, 260, 268, 380, 390, 402, 422, 426, 455, 480, 489, 490, 520, 530, 550, 570, 670, 680, 725, 780, 883, 959, 1120, 1322, 1340, 1470, 1590, 1820];
290| 
291| const workerSpawnTimes = WORKER_SPAWN_TIMES.slice().sort((a, b) => a - b);
292| 
293| let spawnIndex = 0;
294| let workers = [];
295| let workerImg = new Image();
296| workerImg.src = 'images/worker.png';
297| 
298| 
299| function checkSpawnWorker(elapsedSeconds) {
300|   if (spawnIndex >= workerSpawnTimes.length) return; // no more spawns
301| 
302|   if (elapsedSeconds >= workerSpawnTimes[spawnIndex]) {
303|     spawnWorker();  // your function to create/move the worker
304|     spawnIndex++;
305|   }
306| }
307| 
308| 
309| // Spawn a worker at random position within canvas bounds
310| function spawnWorker() {
311|   const y = Math.random() * (canvas.height - WORKER_SIZE); // random vertical position
312|   workers.push({
313|     x: -WORKER_SIZE, // start off left side
314|     y,
315|     width: WORKER_SIZE,
316|     height: WORKER_SIZE,
317|     speed: WORKER_SPEED
318|   });
319| }
320| 
321| // . Update workers every frame: move right and remove when out of canvas
322| function updateWorkers() {
323|   for (let i = workers.length -1; i >= 0; i--) {
324|     const w = workers[i];
325|     w.x += w.speed;
326|     if (w.x > canvas.width) {
327|       // Remove worker when off screen right
328|       workers.splice(i, 1);
329|     }
330|   }
331| }
332| 
333| 
334| // Virtual button events
335| document.getElementById('left').addEventListener('click', () => {
336|   if (isPaused || gameOver) return;
337|   safeMove(-1);
338|   if (navigator.vibrate) navigator.vibrate(50);
339|   playSideSound();
340|   playClockSound();
341| });
342| 
343| document.getElementById('right').addEventListener('click', () => {
344|   if (isPaused || gameOver) return;
345|   safeMove(1);
346|   if (navigator.vibrate) navigator.vibrate(50);
347|   playSideSound();
348|   playClockSound();
349| });
350| 
351| document.getElementById('down').addEventListener('click', () => {
352|   if (isPaused || gameOver) return;
353|   moveDown();
354|   if (navigator.vibrate) navigator.vibrate(50);
355|  playDownSound(); 
356|  playClockSound();
357| });
358| 
359| document.getElementById('rotate').addEventListener('click', () => {
360|   if (isPaused || gameOver) return;
361|   rotate(currentPiece);
362|   if (navigator.vibrate) navigator.vibrate(50);
363|   playMoveSound();
364|   playClockSound();
365| });
366| 
367| const downBtn = document.getElementById('down');
368| 
369| 
370| 
371| //SMOOTH MOVEMENT
372| const leftBtn = document.getElementById('left');
373| const rightBtn = document.getElementById('right');
374| 
375| // LEFT button hold
376| leftBtn.addEventListener('mousedown', () => {
377|   if (isPaused) return;
378|   if (!leftFastInterval) {
379|     leftFastInterval = setInterval(() => {
380|       if (!collide(currentPiece, -1, 0)) {
381|         currentPiece.x -= 1;
382|       }
383|     }, 100); // move every 100ms, tune speed
384|   }
385| });
386| leftBtn.addEventListener('mouseup', () => {
387|   clearInterval(leftFastInterval);
388|   leftFastInterval = null;
389| });
390| leftBtn.addEventListener('mouseleave', () => { // if mouse leaves button
391|   clearInterval(leftFastInterval);
392|   leftFastInterval = null;
393| });
394| // For mobile
395| leftBtn.addEventListener('touchstart', () => {
396|   if (isPaused) return;
397|   if (!leftFastInterval) {
398|     leftFastInterval = setInterval(() => {
399|       if (!collide(currentPiece, -1, 0)) {
400|         currentPiece.x -= 1;
401|       }
402|     }, 100);
403|   }
404| });
405| leftBtn.addEventListener('touchend', () => {
406|   clearInterval(leftFastInterval);
407|   leftFastInterval = null;
408| });
409| 
410| // RIGHT button hold
411| rightBtn.addEventListener('mousedown', () => {
412|   if (isPaused) return;
413|   if (!rightFastInterval) {
414|     rightFastInterval = setInterval(() => {
415|       if (!collide(currentPiece, 1, 0)) {
416|         currentPiece.x += 1;
417|       }
418|     }, 100);
419|   }
420| });
421| rightBtn.addEventListener('mouseup', () => {
422|   clearInterval(rightFastInterval);
423|   rightFastInterval = null;
424| });
425| rightBtn.addEventListener('mouseleave', () => {
426|   clearInterval(rightFastInterval);
427|   rightFastInterval = null;
428| });
429| rightBtn.addEventListener('touchstart', () => {
430|   if (isPaused) return;
431|   if (!rightFastInterval) {
432|     rightFastInterval = setInterval(() => {
433|       if (!collide(currentPiece, 1, 0)) {
434|         currentPiece.x += 1;
435|       }
436|     }, 100);
437|   }
438| });
439| rightBtn.addEventListener('touchend', () => {
440|   clearInterval(rightFastInterval);
441|   rightFastInterval = null;
442| });
443| 
444| 
445| 
446| // For mouse users
447| downBtn.addEventListener('mousedown', () => {
448|   if (isPaused) return;
449|   if (!dropFastInterval) {
450|     dropFastInterval = setInterval(() => {
451|       moveDown(); // drop piece faster
452|     }, 50); // every 50ms, you can tune speed
453|   }
454| });
455| 
456| downBtn.addEventListener('mouseup', () => {
457|   clearInterval(dropFastInterval);
458|   dropFastInterval = null;
459| });
460| 
461| // For mobile (touch)
462| downBtn.addEventListener('touchstart', () => {
463|   if (isPaused) return;
464|   if (!dropFastInterval) {
465|     dropFastInterval = setInterval(() => {
466|       moveDown();
467|     }, 50);
468|   }
469| });
470| 
471| downBtn.addEventListener('touchend', () => {
472|   clearInterval(dropFastInterval);
473|   dropFastInterval = null;
474| });
475| 
476| 
477| 
478| //Touch Hover Handling
479| const buttons = document.getElementsByClassName('btn');
480| 
481| for (let i = 0; i < buttons.length; i++) {
482|   buttons[i].addEventListener('touchstart', () => {
483|     buttons[i].classList.add('active');
484|   });
485| 
486|   buttons[i].addEventListener('touchend', () => {
487|     buttons[i].classList.remove('active');
488|   });
489| }
490| 
491| 
492| //TIMER
493| let startTime = 0;         
494| let elapsedTime = 0;      
495| let timerInterval = null;
496| 
497| // Start the timer
498| function startTimer() {
499|   startTime = Date.now() - elapsedTime;
500|   timerInterval = setInterval(updateTimer, 1000);
501| }
502| 
503| // Pause the timer
504| function pauseTimer() {
505|   clearInterval(timerInterval);
506|   elapsedTime = Date.now() - startTime;
507|   isPaused = true;
508| }
509| 
510| // Resume timer
511| function resumeTimer() {
512|   startTimer();
513|   isPaused = false;
514| }
515| 
516| // Update timer display every second
517| function updateTimer() {
518|   const timeNow = Date.now() - startTime;
519|   const totalSeconds = Math.floor(timeNow / 1000);
520|   const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
521|   const seconds = String(totalSeconds % 60).padStart(2, '0');
522|   document.getElementById('timer').textContent = `${minutes}:${seconds}`;
523| }
524| 
525| function getElapsedTimeInSeconds() {
526|   const now = Date.now() - startTime;
527|   return Math.floor(now / 1000);
528| }
529| 
530| // Bind Pause buttons
531| 
532| const togglePause = () => {
533|   if (!isPaused) {
534|     pauseTimer(); 
535|     playPauseSound();
536|     menuSoundAudio.play();
537|     stopSoundLoop();
538|     // clear all fast intervals
539|     clearInterval(leftFastInterval); leftFastInterval = null;
540|     clearInterval(rightFastInterval); rightFastInterval = null;
541|     clearInterval(dropFastInterval); dropFastInterval = null;
542| 
543|     document.getElementById('pause').style.display = "none";
544|     document.getElementById('pauseOverlay').classList.toggle('active');
545|   } else {
546|     resumeTimer();
547|     menuSoundAudio.pause(); document.getElementById('pauseOverlay').classList.remove('active');
548|     document.getElementById('pause').textContent = "Pause";
549|   }
550| };
551| 
552| // Click event
553| document.getElementById('pause').addEventListener('click', togglePause);
554| 
555| // Space bar event
556| document.addEventListener('keydown', (e) => {
557|   if (e.code === 'Space') {
558|     e.preventDefault(); // stop page scroll
559|     togglePause();
560|   }
561| });
562| 
563| 
564| 
565| //RESUME BUTTON
566| const resumeGame = () => {
567|   if (isPaused) {
568|     resumeTimer(); 
569|     pausePauseSound();
570|     playRandomSoundLoop();
571|     menuSoundAudio.pause();
572|     document.getElementById('pause').style.display = 'block';
573|     document.getElementById('pauseOverlay').classList.remove('active');
574|   }
575| };
576| 
577| document.getElementById('resume').addEventListener('click', resumeGame);
578| 
579| document.addEventListener('keydown', (e) => {
580|   // Check for spacebar (key === ' ' works in modern browsers)
581|   if (e.code === 'Space') {
582|     e.preventDefault(); // Prevent page scrolling
583|     resumeGame();
584|     pausePauseSound();
585|     playRandomSoundLoop();
586|   
587|   }
588| });
589| 
590|     
591|     
592| 
593| //Score
594| 
595| function score() {
596|     let scoreEl = document.getElementById('score');
597|     let pop = document.getElementById('pops');
598|     let currentScore = parseInt(scoreEl.textContent) || 0;
599|     let cleared = clearLines(); // now returns number
600| 
601|     if (cleared > 0) {
602|         let added = 100 * cleared;
603|         currentScore += added;
604|         playClearedSound();
605|         if (pop) pop.classList.toggle('active');
606|         showPopText('+' + added + '🔥');  // show floating animation
607|     } else {
608|             
609|         currentScore += 10;
610|         showPopText('+10');
611|     }
612| 
613|     scoreEl.textContent = currentScore;
614| }
615| 
616| 
617| //Pop Up
618| function showPopText(text) {
619|   const container = document.getElementById('pop-container');
620|   const pop = document.createElement('div');
621|   pop.className = 'pop';
622|   pop.textContent = text;
623| 
624|   container.appendChild(pop);
625| 
626|   // remove after animation
627|   pop.addEventListener('animationend', () => {
628|     container.removeChild(pop);
629|   });
630| }
631| 
632| //HIGHSCORE
633| function checkHighscore(finalScore, timeTaken) {
634|   let saved = localStorage.getItem('highscore');
635|   let best = saved ? JSON.parse(saved) : null;
636| console.log("Old highscore:", JSON.stringify(best));
637| 
638|   if (!best || finalScore > best.score) {
639|     // New highscore
640|     localStorage.setItem('highscore', JSON.stringify({ score: finalScore, time: timeTaken }));
641|     console.log('🎉 New highscore saved:', finalScore, 'Time:', timeTaken);
642|   } else if (finalScore === best.score && timeTaken < best.time) {
643|     // Same score, faster time
644|     localStorage.setItem('highscore', JSON.stringify({ score: finalScore, time: timeTaken }));
645|     console.log('⚡ Faster time saved:', finalScore, 'Time:', timeTaken);
646|   } else {
647|     console.log('No new highscore.');
648|   }
649| }
650| 
651| 
652| 
653| function showHighscore() {
654|   let saved = localStorage.getItem('highscore');
655|   if (saved) {
656|     let best = JSON.parse(saved);
657|     console.log('🏆 Highscore:', best.score, 'Time:', best.time, 'secs');
658|    
659|      document.getElementById('highscore').textContent = best.score;
660|   }
661| }
662| 
663| 
664| 
665| function disableAllButtons() {
666|   const buttons = document.querySelectorAll('.btn');
667|   buttons.forEach(btn => {
668|     btn.style.pointerEvents = 'none';
669|   });
670| }
671| 
672| function enableAllButtons() {
673|   const buttons = document.querySelectorAll('.btn');
674|   buttons.forEach(btn => {
675|     btn.style.pointerEvents = 'auto';
676|   });
677| }
678| 
679| //Level Update
680| 
681| let currentLevel = "";
682| function updateLevel(timeTaken) {
683|   
684|   let newLevel = "Beginner";
685| 
686|   if (timeTaken > 5250) {
687|     newLevel = "Legend 💎💎💎";
688|     dropInterval = 80;
689|   } else if (timeTaken > 4080) {
690|     newLevel = "Pro 💎";
691|     dropInterval = 160;
692|   } else if (timeTaken > 3570) {
693|     newLevel = "Guru ⭐⭐";
694|     dropInterval = 180;
695|   } else if (timeTaken > 2500) {
696|     newLevel = "Star ⭐";
697|     dropInterval = 250;
698|   } else if (timeTaken > 2300) {
699|     newLevel = "Medalist 🏅";
700|     dropInterval = 300;
701|   }else if (timeTaken > 1020) {
702|     newLevel = "Expert";
703|     dropInterval = 350;
704|   }
705|   
706|   if (newLevel !== currentLevel && timeTaken > 120) {
707|     currentLevel = newLevel;
708|     document.getElementById('level').textContent = newLevel;
709|     playNewLevelSound();    
710|     showLevelUpPopup("NEW LEVEL⭐"); // Trigger animatio
711|     
712|  }
713|  }
714| 
715| // this timer tracking seconds
716| let secondsElapsed = 0;
717| 
718| setInterval(() => {
719|   secondsElapsed++;
720|   updateLevel(secondsElapsed);  // Update level based on time$
721|   checkSpawnWorker(secondsElapsed);
722| }, 1000);
723| 
724| //NEW Level Pop Up
725| function showLevelUpPopup(message = "GO🔥") {
726|   const popup = document.getElementById('levelUpPopup');
727|   popup.textContent = message;
728| 
729|   popup.classList.remove('active'); // reset animation if it's already showing
730|   void popup.offsetWidth; // trigger reflow
731| 
732|   popup.classList.add('active');
733| 
734|   setTimeout(() => {
735|     popup.classList.remove('active');
736|   }, 2000); // Hide after 2 seconds
737| }
738| 
739| 
740|   
741| 
742| 
743| 
744| 
745| function gameOverHandler() {
746|   gameOver = true;
747|   disableAllButtons();
748|   clearInterval(timerInterval);  // stop timer
749|   let finalScore = parseInt(document.getElementById('score').textContent) || 0;
750|   let timeTaken = getElapsedTimeInSeconds();
751|   checkHighscore(finalScore, timeTaken);
752| 
753|   console.log('🛑 Game Over! Final score:', finalScore, 'Time taken:', timeTaken);
754|   playGameOverSound();
755| showGameOver(finalScore);
756|   stopSoundLoop();
757|  
758| }
759| 
760| 
761| 
762| 
763| 
764| function showGameOver(score) {
765|   document.getElementById('finalScore').textContent = score;
766|   document.getElementById('gameOverOverlay').style.display = 'flex';
767|   gameOver = true;
768| }
769| 
770| 
771| window.addEventListener('DOMContentLoaded', () => {
772|   document.getElementById('restartBtn').addEventListener('click', restartGame);
773| });
774| 
775| 
776| function restartGame() {
777|   board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
778|   currentScore = 0;
779|   gameOver = false;
780|   currentPiece = newPiece();
781|   secondsElapsed = 0;
782|   spawnIndex = 0;
783|   document.getElementById('score').textContent = "00";
784|   document.getElementById('gameOverOverlay').style.display = 'none';
785|   playClockSound();
786|   enableAllButtons();
787|   startTimer();
788|   update();
789|     // Start random game music if sound is enabled
790|   if (soundEnabled) {
791|     playRandomSoundLoop();
792|   }
793|   // Show "Game Start" animation popup
794|   showLevelUpPopup("Game On🤜🏽🤛🏼");
795| }
796| 
797| 
798| // === Master Sound Control ===
799| let soundEnabled = true;  // Effects
800| let musicEnabled = true;  // Background loop
801| 
802| function toggleSound() {
803|   soundEnabled = !soundEnabled;
804|   musicEnabled = soundEnabled; // Keep both in sync with one toggle
805|   console.log(`Sound ${soundEnabled ? 'enabled' : 'disabled'}`);
806| }
807| 
808| // === Sound Effect Elements ===
809| const moveSound = new Audio('sounds/button.mp3');
810| const dropSound = new Audio('sounds/keyed.wav');
811| const levelUpSound = new Audio('sounds/levelup.mp3');
812| const sideButtonSound = new Audio('sounds/click.mp3');
813| const newLevelSound = new Audio('sounds/newlevel.wav');
814| const downButtonSound = new Audio('sounds/down.mp3');
815| const pauseSound = new Audio('sounds/menu.mp3');
816| const timeSound = new Audio('sounds/clock.mp3');
817| const gameOverSound = new Audio('sounds/gameOver.mp3');
818| 
819| // Preload for no delay
820| [moveSound, 
821| dropSound, 
822| levelUpSound,
823| sideButtonSound,
824| newLevelSound,
825| downButtonSound, 
826| pauseSound,
827| timeSound,
828| gameOverSound
829| ].forEach(sound => {
830|   sound.preload = 'auto';
831|   sound.load();
832| });
833| 
834| 
835| // === Play Functions ===
836| 
837| 
838| 
839| 
840| function playGameOverSound() {
841|   if (soundEnabled) {
842|     gameOverSound.currentTime = 0;
843|     gameOverSound.play();
844|     gameOverSound.volume = 0.5;  
845|   }
846| }
847| 
848| function playClockSound() {
849|   if (soundEnabled) {
850|     timeSound.currentTime = 0;
851|     timeSound.play();
852|     timeSound.volume = 0.2;  
853|     timeSound.loop = true;
854|   }
855| }
856| 
857| 
858| function playPauseSound() {
859|   if (soundEnabled) {
860|     pauseSound.currentTime = 0;
861|     pauseSound.play();
862|     pauseSound.volume = 0.1;  
863|     pauseSound.loop = true;
864|   }
865| }
866| 
867| 
868| function pausePauseSound() {
869|     pauseSound.pause();
870|     pauseSound.currentTime = 0; 
871|   
872| }
873| 
874| 
875| 
876| function playMoveSound() {
877|   if (soundEnabled) {
878|     moveSound.currentTime = 0;
879|     moveSound.play();
880|   }
881| }
882| 
883| function playDropSound() {
884|   if (soundEnabled) {
885|     dropSound.currentTime = 0;
886|     dropSound.play();
887|   }
888| }
889| 
890| function playLevelUpSound() {
891|   if (soundEnabled) {
892|     levelUpSound.currentTime = 0;
893|     levelUpSound.play();
894|   }
895| }
896| 
897| 
898| function playSideSound() {
899|   if (soundEnabled) {
900|     sideButtonSound.currentTime = 0;
901|     sideButtonSound.play();
902|   }
903| }
904| 
905| function playNewLevelSound() {
906|   if (soundEnabled) {
907|     newLevelSound.currentTime = 0;
908|     newLevelSound.play();
909|   }
910| }
911| 
912| function playDownSound() {
913|   if (soundEnabled) {
914|     downButtonSound.currentTime = 0;
915|     downButtonSound.play()  }
916| }
917| 
918| const sound1 = new Audio('sounds/cleared1.mp3');
919| const sound2 = new Audio('sounds/cleared2.mp3');
920| 
921| function playClearedSound(sound) {
922|   if (soundEnabled && sound) {
923|     sound.currentTime = 0; // restart from beginning
924|     sound.play();
925|   }
926| }
927| 
928| 
929| 
930| 
931| // === Background Music List ===
932| const soundFiles = [
933| 'sounds/tune1.mp3',
934| 'sounds/tune2.mp3',
935| 'sounds/tune4.mp3',
936| 'sounds/tune5.mp3',
937| 'sounds/tune6.mp3',
938| 'sounds/tune7.mp3',
939| 'sounds/tune8.mp3',
940| 'sounds/tune9.mp3',
941| 'sounds/tune10.mp3',
942| 'sounds/tune11.mp3',
943| 'sounds/tune12.mp3'
944| 
945| ];
946| 
947| // Preload background sounds
948| const sounds = soundFiles.map(src => {
949|   const audio = new Audio(src);
950|   audio.preload = 'auto';
951|   audio.load();
952|   return audio;
953| });
954| 
955| //=== control music volume
956| document.getElementById('volumeControl').addEventListener('input', (e) => {
957|   musicVolume = parseFloat(e.target.value);
958|   if (currentSound) {
959|     currentSound.volume = musicVolume; // adjust live
960|   }
961| });
962| 
963| 
964| 
965| // === Play Random Loop ===
966| let currentSound = null; // track the currently playing sound
967| let musicVolume = 1.0;
968| let currentSoundIndex = null;
969| 
970| function playRandomSoundLoop() {
971|   if (!musicEnabled) return;
972| 
973|   // Stop the currently playing sound
974|   if (currentSound) {
975|     currentSound.pause();
976|     currentSound.currentTime = 0;
977|   }
978| 
979|   // Pick a different sound than last one
980|   let newIndex;
981|   do {
982|     newIndex = Math.floor(Math.random() * sounds.length);
983|   } while (newIndex === currentSoundIndex);
984| 
985|   currentSoundIndex = newIndex;
986|   currentSound = sounds[currentSoundIndex];
987|   currentSound.volume = musicVolume;
988|   // Start the new sound
989|   currentSound.currentTime = 0;
990|   currentSound.play();
991|   
992|   // When finished, start another
993|   currentSound.onended = () => {
994|     playRandomSoundLoop();
995|   };
996| }
997| 
998| // === Stop Loop ===
999| function stopSoundLoop() {
1000|   sounds.forEach(s => {
1001|     s.pause();
1002|     s.currentTime = 0;
1003|   });
1004|   currentSoundIndex = null;
1005| }
1006| 
1007| // ===Sound  Button Control ===
1008| 
1009| 
1010| function unmute() {
1011|   // Set flags
1012|   toggleSound();
1013| 
1014|   playRandomSoundLoop(); // Start music immediately
1015| 
1016|   document.getElementById('soundToggle').textContent =
1017|     soundEnabled ? "ON 🔊" : "OFF 🔇";
1018| 
1019|   // Control music
1020|   if (musicEnabled) {
1021|     playRandomSoundLoop();
1022|   } else {
1023|     stopSoundLoop();
1024|   }
1025| }  // <-- Close unmute function here
1026| 
1027| // Define once outside the function (at top-level scope)
1028| const menuSoundAudio = new Audio('sounds/menuSound.mp3');
1029| menuSoundAudio.loop = true;
1030| 
1031| function menuSound() {
1032|   const toggleBtn = document.getElementById('menuSoundToggle');
1033| 
1034|   // Toggle soundEnabled
1035|   soundEnabled = !soundEnabled;
1036| 
1037|   if (soundEnabled) {
1038|     menuSoundAudio.currentTime = 0;
1039|     menuSoundAudio.play();
1040|     toggleBtn.textContent = "OFF 🔇";
1041|   } else {
1042|     menuSoundAudio.pause();
1043|     toggleBtn.textContent = "ON 🔊 ";
1044|   }
1045| }  
1046| 
1047| 
1048| 
1049| 
1050| 
1051|   
1052| 
1053| 
1054| 
1055| 
1056| //⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
1057| 
1058| //HOME PAGE LOGIC
1059| 
1060| 
1061|  // Brick colors from your theme
1062|     const colors = ["lime", "cyan", "orange", "magenta", "red", "yellow"];
1063|     const logo = document.querySelector('.logo');
1064| 
1065|     // Create falling bricks
1066|     for (let i = 0; i < 15; i++) {
1067|         let brick = document.createElement('div');
1068|         brick.classList.add('brick');
1069|         brick.style.background = colors[Math.floor(Math.random() * colors.length)];
1070|         brick.style.left = `${Math.random() * 300 - 150}px`; // spread around logo
1071|         brick.style.top = `${Math.random() * -200}px`;
1072|         brick.style.animationDelay = `${Math.random() * 2}s`;
1073|         logo.appendChild(brick);
1074|     }
1075|     
1076|   //Start Button animation
1077|   
1078|  document.addEventListener('DOMContentLoaded', () => {
1079|   const button = document.getElementById('startBtnContainer');
1080|   
1081|   if (button) {
1082|     setTimeout(() => {
1083|       button.classList.add('active');
1084|     }, 13500);
1085|   }
1086| }); 
1087| 
1088| 
1089| 
1090| //Menu Logic Script
1091| document.getElementById('menuBtn').addEventListener('click', () => {
1092|  document.getElementById('menu').classList.toggle('active');
1093| });
1094| 
1095| window.addEventListener('dblclick', () => {
1096|   document.getElementById('menu').classList.remove('active');
1097| });
1098| 
1099| 
1100| 
1101| //ECONSOLE LOGIC
1102| 
1103| const intro = document.getElementById('intro');
1104| const introImage = document.getElementById('introImage');
1105| const textContainer = document.getElementById('textContainer');
1106| const mainText = document.getElementById('mainText');
1107| const tagline = document.getElementById('tagline');
1108| 
1109| const text = 'E-Console';
1110| 
1111| // Create spans for letters
1112| for (let letter of text) {
1113|   const span = document.createElement('span');
1114|   span.textContent = letter;
1115|   mainText.appendChild(span);
1116| }
1117| 
1118| // Show image 3 seconds
1119| setTimeout(() => {
1120|   introImage.style.opacity = '0';
1121| 
1122|   setTimeout(() => {
1123|     introImage.style.display = 'none';
1124|     textContainer.style.opacity = '1';
1125| 
1126|     // Animate letters
1127|     const spans = mainText.querySelectorAll('span');
1128|     spans.forEach((span, i) => {
1129|       setTimeout(() => {
1130|         span.style.opacity = '1';
1131|         span.style.transform = 'translateX(0)';
1132|       }, i * 250);
1133|     });
1134| 
1135|     // Fade in tagline
1136|     setTimeout(() => {
1137|       tagline.style.opacity = '1';
1138|     }, spans.length * 300 + 500);
1139| 
1140|     // After text visible 5 seconds, fade out whole intro
1141|     setTimeout(() => {
1142|       intro.style.transition = 'opacity 2s ease';
1143|       intro.style.opacity = '0';
1144|       setTimeout(() => {
1145|         intro.style.display = 'none';
1146|       }, 1700);
1147|     }, 4600 + spans.length * 300 + 500);
1148| 
1149|   }, 1600);
1150| 
1151| }, 2700);
1152| 
1153| 
1154| 
1155| 
1156| 
1157| 
1158| 
1159| 
1160| // Start game
1161| document.getElementById('StartBtn').addEventListener('click', () => {
1162|   const toggleBtn = document.getElementById('menuSoundToggle');
1163| 
1164|   // Hide menu, show game
1165|   document.getElementById('gamePlay').style.display = 'flex'; 
1166|   document.querySelector('.gameBrand').style.display = 'none'; 
1167|   document.getElementById('menuBtn').style.display = 'none';
1168|   document.getElementById('menu').style.display = 'none';
1169|    menuSoundAudio.pause();
1170|   // Start game logic
1171|   currentPiece = newPiece();
1172|   update();
1173|   startTimer();
1174|   showLevelUpPopup("Game Start 👍🏽");
1175| 
1176|   // Stop menu background sound (if playing)
1177|   if (typeof stopSoundLoop === "function") {
1178|     stopSoundLoop();
1179|   }
1180| 
1181|   // Start random game music if sound is enabled
1182|   if (soundEnabled) {
1183|     playRandomSoundLoop();
1184|   }
1185| });
1186| 
1187| // Bonus: Save score to localStorage
1188| window.addEventListener('beforeunload', () => {
1189|   const currentScore = parseInt(document.getElementById('score').textContent) || 0;
1190|   localStorage.setItem('damieTetrisScore', currentScore);
1191| });
1192| 
