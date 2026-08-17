const canvas = document.getElementById("caro");
const ctx = canvas.getContext("2d");
const rows = 15;
const cols = 15;
const cellSize = canvas.width / cols;
let board = [];
let turn = "X";
let winner = null;
const aiMode = document.getElementById("aiMode");

function initGame() {
  board = Array.from({ length: rows }, () => Array(cols).fill(null));
  turn = "X";
  winner = null;
  drawBoard();
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = "Lượt chơi: X";
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Vẽ lưới bàn cờ
  ctx.beginPath();
  ctx.strokeStyle = "#ccc";
  for (let i = 0; i <= rows; i++) {
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
  }
  ctx.stroke();

  // Vẽ quân cờ
  ctx.font = `${cellSize * 0.7}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (board[y][x]) {
        ctx.fillStyle = board[y][x] === "X" ? "#d32f2f" : "#1976d2";
        ctx.fillText(
          board[y][x], 
          x * cellSize + cellSize / 2, 
          y * cellSize + cellSize / 2
        );
      }
    }
  }
}

function checkWin(x, y, player) {
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
  for (let [dx, dy] of directions) {
    let count = 1;
    count += countDirection(x, y, dx, dy, player);
    count += countDirection(x, y, -dx, -dy, player);
    if (count >= 5) return true;
  }
  return false;
}

function countDirection(x, y, dx, dy, player) {
  let count = 0;
  let nx = x + dx;
  let ny = y + dy;
  while (
    nx >= 0 && nx < cols &&
    ny >= 0 && ny < rows &&
    board[ny][nx] === player
  ) {
    count++;
    nx += dx;
    ny += dy;
  }
  return count;
}

canvas.addEventListener("click", (e) => {
  if (winner || turn !== "X") return;
  
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);

  if (x >= 0 && x < cols && y >= 0 && y < rows && !board[y][x]) {
    makeMove(x, y, "X");
    
    if (!winner && aiMode && aiMode.checked) {
      setTimeout(aiPlay, 100);
    }
  }
});

function makeMove(x, y, player) {
  board[y][x] = player;
  drawBoard();
  
  if (checkWin(x, y, player)) {
    winner = player;
    document.getElementById("status").textContent = `Người thắng: ${player}`;
  } else {
    turn = player === "X" ? "O" : "X";
    document.getElementById("status").textContent = `Lượt chơi: ${turn}`;
  }
}

const resetBtn = document.getElementById("reset");
if (resetBtn) resetBtn.addEventListener("click", initGame);

function aiPlay() {
  if (winner) return;
  const move = getAIMove();
  if (move) {
    makeMove(move.x, move.y, "O");
  }
}

// Lấy danh sách các ô trống có xung quanh đã có quân cờ (giúp AI tính toán cực nhanh)
function getCandidateMoves() {
  const candidates = [];
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (board[y][x] !== null) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (
              ny >= 0 && ny < rows &&
              nx >= 0 && nx < cols &&
              board[ny][nx] === null &&
              !visited[ny][nx]
            ) {
              visited[ny][nx] = true;
              candidates.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
  }

  // Nếu bàn cờ trống hoàn toàn, đánh vào giữa
  if (candidates.length === 0) {
    candidates.push({ x: Math.floor(cols / 2), y: Math.floor(rows / 2) });
  }

  return candidates;
}

function getAIMove() {
  const candidates = getCandidateMoves();
  let bestScore = -Infinity;
  let bestMove = candidates[0];
  const depth = 2; // Giữ độ sâu 2-3 để AI vừa thông minh vừa không giật lag

  for (let move of candidates) {
    board[move.y][move.x] = "O";
    
    // Kiểm tra nếu nước đi này AI thắng ngay lập tức
    if (checkWin(move.x, move.y, "O")) {
      board[move.y][move.x] = null;
      return move;
    }

    let score = minimax(board, depth - 1, false, -Infinity, Infinity, move.x, move.y);
    board[move.y][move.x] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

function minimax(board, depth, isMaximizing, alpha, beta, lastX, lastY) {
  const lastPlayer = isMaximizing ? "X" : "O";
  if (checkWin(lastX, lastY, lastPlayer)) {
    return isMaximizing ? -100000 : 100000;
  }

  if (depth === 0) {
    return evaluateBoard();
  }

  const candidates = getCandidateMoves();
  if (candidates.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let move of candidates) {
      board[move.y][move.x] = "O";
      let evalScore = minimax(board, depth - 1, false, alpha, beta, move.x, move.y);
      board[move.y][move.x] = null;
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of candidates) {
      board[move.y][move.x] = "X";
      let evalScore = minimax(board, depth - 1, true, alpha, beta, move.x, move.y);
      board[move.y][move.x] = null;
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateBoard() {
  return evaluate("O") - evaluate("X") * 1.2; // Tăng trọng số phòng thủ
}

function evaluate(player) {
  let score = 0;
  const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (board[y][x] === player) {
        for (let [dx, dy] of directions) {
          let count = countDirection(x, y, dx, dy, player) + 1;
          if (count >= 5) score += 100000;
          else if (count === 4) score += 5000;
          else if (count === 3) score += 500;
          else if (count === 2) score += 50;
        }
      }
    }
  }

  return score;
}

initGame();