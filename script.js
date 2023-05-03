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
        let valid = await this.userMove(x, y)
        if (valid) this.robotMove();
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
      if (state.board[y][3] == !(state.turn - 1) + 1) sum++;
    }
    return sum;
  }

  score(state, a, b, depth = 0) {
    if (state.moves == WIDTH * HEIGHT) return 0;
    if (depth > MAX_DEPTH) return this.heuristic(state);

    let worst = -(WIDTH * HEIGHT - state.moves) / 2;
    if (a < worst) {
      a = worst;
      if (a >= b) return a;
    }

    let best = (WIDTH * HEIGHT - 1 - state.moves) / 2;
    if (b > best) {
      b = best;
      if (a >= b) return b;
    }

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
    $("#float").style.opacity = 1;
    await sleep(100); // allow the DOM to render 
    let bestMove, best = -WIDTH * HEIGHT - 2 - this.state.moves, score;
    for (let move of this.getValidMoves(this.state)) {
      let _state = this.makeMove(this.state, move.x, move.y)
      if (this.checkWin(_state, move.x, move.y)) {
        this.userMove(move.x, move.y);
        return
      }
      await sleep(0.1); // allow the DOM to render 
      score = this.score(_state, -(WIDTH * HEIGHT - this.state.moves) / 2, (WIDTH * HEIGHT - this.state.moves) / 2)
      console.log("(", move.x, move.y, ")", score);
      if (score > best) {
        bestMove = move;
        best = score;
      }
    }
    $("#float").style.opacity = 0;
    this.userMove(bestMove.x, bestMove.y);
  }

  win() {
    console.log(!(this.state.turn - 1) + 1, "won!")
  }
}

const startGame = () => {
  game = new Game();
  $("#start-button").innerText = "Reset"
}
