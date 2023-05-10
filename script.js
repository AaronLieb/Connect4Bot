const $ = (query) => {
  return document.querySelector(query);
}

const sleep = async (ms) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res()
    }, ms);
  })
}

let game;

const MAX_DEPTH = 5;

const WIDTH = 7;
const HEIGHT = 6;

class Game {
  constructor() {
    this.gameOver = false;
    const gameEle = $("#game")
    gameEle.innerHTML = "";
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
      let gridItem = document.createElement("div");
      gameEle.style.gridTemplateColumns = `repeat(${WIDTH}, 1fr)`;
      gameEle.style.gridTemplateRows = `repeat(${HEIGHT}, 1fr)`;
      const x = i % WIDTH;
      const y = Math.floor(i / WIDTH);
      gridItem.className = `x${x}y${y}`
      gridItem.onclick = async () => {
        if (this.gameOver) return;
        let valid = await this.userMove(x, y);
        if (this.gameOver) return;
        if (valid) await this.robotMove();
      }
      gameEle.appendChild(gridItem)
    }
    this.state = {
      board: Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0)),
      turn: 1,
      moves: 0
    }
  }


  validMove(state, x, y) {
    if (x < 0 || x >= WIDTH) return false;
    if (y < 0 || y >= HEIGHT) return false;
    if (state.board[y][x] != 0) return false;
    if (y != HEIGHT - 1 && state.board[y + 1][x] == 0) return false;
    return true;
  }

  getValidMoves(state) {
    let validMoves = []
    for (let x = 0; x < WIDTH; x++) {
      for (let y = HEIGHT - 1; y >= 0; y--) {
        if (state.board[y][x] == 0) {
          validMoves.push({ x: x, y: y });
          break;
        }
      }
    }
    return validMoves;
  }

  async userMove(x, y) {
    if (!this.validMove(this.state, x, y)) return false;
    $(`.x${x}y${y}`).classList.add(`color-${this.state.turn}`);
    this.state = this.makeMove(this.state, x, y);
    if (this.checkWin(this.state, x, y) > 0) {
      this.win();
    }
    return true;
  }

  makeMove(state, x, y) {
    let _state = structuredClone(state);
    _state.board[y][x] = _state.turn;
    _state.turn = !(_state.turn - 1) + 1; // swaps turns
    _state.moves++;
    return _state
  }

  checkWin(state, x, y) {

    if (state.moves < 7) return false;

    let turn = !(state.turn - 1) + 1; // swaps turns

    // horizontal
    let left, right, top, bottom;
    left = x, right = x;
    for (let i = 0; i < 3; i++) {
      if (left - 1 >= 0 && state.board[y][left - 1] == turn) left--;
      if (right + 1 < WIDTH && state.board[y][right + 1] == turn) right++;
    }
    if (right - left >= 3) return true;

    // down 
    bottom = y;
    for (let i = 0; i < 3; i++) {
      if (bottom + 1 < HEIGHT && state.board[bottom + 1][x] == turn) bottom++;
    }
    if (bottom - y >= 3) return true;

    // diagonal left->right
    left = x, right = x, bottom = y, top = y;
    for (let i = 0; i < 3; i++) {
      if (left - 1 >= 0 && bottom + 1 < HEIGHT && state.board[bottom + 1][left - 1] == turn) {
        left--;
        bottom++;
      }
      if (right + 1 < WIDTH && top - 1 >= 0 && state.board[top - 1][right + 1] == turn) {
        right++;
        top--;
      }
    }
    if (right - left >= 3) return true;

    // diagonal right->left
    left = x, right = x, bottom = y, top = y;
    for (let i = 0; i < 3; i++) {
      if (left - 1 >= 0 && top - 1 >= 0 && state.board[top - 1][left - 1] == turn) {
        left--;
        top--;
      }
      if (right + 1 < WIDTH && bottom + 1 < HEIGHT && state.board[bottom + 1][right + 1] == turn) {
        right++;
        bottom++;
      }
    }
    if (right - left >= 3) {
      return true;
    }

    return false;
  }

  heuristic(state) {
    let sum = 0;
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        if (state.board[y][x] == !(state.turn - 1) + 1) {
          sum += 3 - Math.abs(3 - x);
        }
      }
    }
    return sum;
  }

  score(state, a, b, depth = 0) {
    // If there is a draw
    if (state.moves == WIDTH * HEIGHT) return 0;

    // If we've reached the max depth, use the heuristic
    if (depth > MAX_DEPTH) return this.heuristic(state);

    // Bounds checking of alpha
    let worst = -(WIDTH * HEIGHT - state.moves) / 2;
    if (a < worst) {
      a = worst;
      if (a >= b) return a;
    }

    // Bounds checking of beta
    let best = (WIDTH * HEIGHT - 1 - state.moves) / 2;
    if (b > best) {
      b = best;
      if (a >= b) return b;
    }

    // Recursive MinMax
    for (let move of this.getValidMoves(state)) {
      let _state = this.makeMove(state, move.x, move.y);
      if (this.checkWin(_state, move.x, move.y)) return -best;
      let score = -this.score(_state, -b, -a, depth++);
      if (score >= b) return score;
      if (score > a) a = score;
    }

    return a;
  }

  async robotMove() {
    // Show the loading animation
    $("#float").style.opacity = 1;

    // allow the DOM to render 
    await sleep(100);

    let worstMove, worstMoves, worst = WIDTH * HEIGHT - 1 - this.state.moves, score;

    let possibleMove = false;
    for (let move of this.getValidMoves(this.state)) {
      let _state = this.makeMove(this.state, move.x, move.y)
      if (this.checkWin(_state, move.x, move.y)) {
        continue;
      }
      possibleMove = true;

      // allow the DOM to render 
      await sleep(0.1);

      score = this.score(_state, -(WIDTH * HEIGHT - this.state.moves) / 2, (WIDTH * HEIGHT - this.state.moves) / 2)

      console.log("(", move.x, move.y, ")", score);

      if (score < worst) {
        worstMoves = [];
        worstMoves.push(move);
        worst = score;
      }
      if (score == worst) {
        worstMoves.push(move);
      }
    }
    $("#float").style.opacity = 0;

    if (!possibleMove) {
      worstMove = this.getValidMoves(this.state)[0];
    } else {
      worstMove = worstMoves[Math.floor(Math.random() * worstMoves.length)];
    }

    this.userMove(worstMove.x, worstMove.y);

    return true;
  }

  win() {
    const color = (this.state.turn == 1) ? "Red" : "Blue";
    $("#title").innerText = `${color} won!`
    this.gameOver = true;
    console.log(color, "won!")
  }
}

const clickStartButton = () => {
  console.log($("#mode").value)
  if ($("#mode").value == "human") {
    startGame();
  } else {
    startRobotsGame();
  }
}

const startGame = () => {
  game = new Game();
  game.gameOver = false;
  $("#title").innerText = "Don't Connect 4!"
  $("#start-button").innerText = "Reset"
}

const startRobotsGame = async () => {
  startGame()
  while (!game.gameOver) {
    let valid = await game.robotMove();
    await sleep(200); // time spacing
    if (game.gameOver) return;
    if (valid) await game.robotMove();
    await sleep(200); // time spacing
  }
}


