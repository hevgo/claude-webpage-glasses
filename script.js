(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- hand-drawn path helpers -----------------------------------------
  function smoothPath(pts) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} `;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      d += `Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}, ${mx.toFixed(1)} ${my.toFixed(1)} `;
    }
    const last = pts[pts.length - 1];
    d += `L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    return d;
  }

  // straight-ish stroke, jitter tapers to zero at both ends (pen touches down cleanly)
  function jitterLine(x1, y1, x2, y2, segments = 5, jitter = 2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const bx = x1 + dx * t;
      const by = y1 + dy * t;
      const off = (Math.random() - 0.5) * 2 * jitter * Math.sin(Math.PI * t);
      pts.push({ x: bx + nx * off, y: by + ny * off });
    }
    return pts;
  }

  // near-circle, slightly overshoots its own start (the way a hand actually closes a loop)
  function jitterCircle(cx, cy, r, jitter = 2.5) {
    const segments = 16;
    const startDeg = -100;
    const sweepDeg = 380;
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const rad = ((startDeg + sweepDeg * t) * Math.PI) / 180;
      const rr = r + (Math.random() - 0.5) * 2 * jitter;
      pts.push({ x: cx + Math.cos(rad) * rr, y: cy + Math.sin(rad) * rr });
    }
    return pts;
  }

  function animateDraw(path) {
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    if (reduceMotion) {
      path.style.strokeDashoffset = "0";
      return;
    }
    path.style.strokeDashoffset = `${len}`;
    path.animate(
      [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
      { duration: 300, easing: "ease", fill: "forwards" }
    );
  }

  function cellCenter(i) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    return { x: 50 + col * 100, y: 50 + row * 100 };
  }

  // ---- grid --------------------------------------------------------------
  const gridLinesGroup = document.getElementById("gridLines");
  function drawGrid() {
    const lines = [
      [100, 0, 100, 300],
      [200, 0, 200, 300],
      [0, 100, 300, 100],
      [0, 200, 300, 200],
    ];
    lines.forEach(([x1, y1, x2, y2]) => {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", smoothPath(jitterLine(x1, y1, x2, y2, 6, 2.5)));
      gridLinesGroup.appendChild(path);
    });
  }

  // ---- marks ---------------------------------------------------------------
  const marksGroup = document.getElementById("marks");
  const strikeGroup = document.getElementById("strike");

  function drawMark(index, player) {
    const { x: cx, y: cy } = cellCenter(index);
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", player === "X" ? "mark-x" : "mark-o");

    if (player === "X") {
      const s = 28;
      [
        [cx - s, cy - s, cx + s, cy + s],
        [cx - s, cy + s, cx + s, cy - s],
      ].forEach(([x1, y1, x2, y2]) => {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", smoothPath(jitterLine(x1, y1, x2, y2, 5, 2.2)));
        g.appendChild(path);
        animateDraw(path);
      });
    } else {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", smoothPath(jitterCircle(cx, cy, 30, 2.5)));
      g.appendChild(path);
      animateDraw(path);
    }
    marksGroup.appendChild(g);
  }

  function drawStrike(line) {
    const [a, , c] = line;
    const pa = cellCenter(a);
    const pc = cellCenter(c);
    const dx = pc.x - pa.x;
    const dy = pc.y - pa.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const ext = 24;
    const pts = jitterLine(
      pa.x - ux * ext, pa.y - uy * ext,
      pc.x + ux * ext, pc.y + uy * ext,
      8, 2.5
    );
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "strike-line");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", smoothPath(pts));
    g.appendChild(path);
    strikeGroup.appendChild(g);
    animateDraw(path);
  }

  function clearMarksAndStrike() {
    marksGroup.innerHTML = "";
    strikeGroup.innerHTML = "";
  }

  // ---- tally scoring -------------------------------------------------------
  function renderTally(svgEl, n) {
    svgEl.innerHTML = "";
    if (n <= 0) {
      svgEl.setAttribute("viewBox", "0 0 60 30");
      return;
    }
    const groups = Math.ceil(n / 5);
    const groupWidth = 22;
    const totalWidth = groups * groupWidth + 8;
    svgEl.setAttribute("viewBox", `0 0 ${totalWidth} 30`);

    let remaining = n;
    for (let g = 0; g < groups; g++) {
      const count = Math.min(5, remaining);
      remaining -= count;
      const baseX = g * groupWidth + 8;
      const strokes = Math.min(count, 4);
      for (let i = 0; i < strokes; i++) {
        const x = baseX + i * 4 - 6;
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", smoothPath(jitterLine(x, 6, x - 1, 24, 3, 1)));
        svgEl.appendChild(path);
      }
      if (count === 5) {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute(
          "d",
          smoothPath(jitterLine(baseX - 8, 23, baseX + 8, 5, 4, 1.2))
        );
        svgEl.appendChild(path);
      }
    }
  }

  // ---- game state ------------------------------------------------------
  const board = Array(9).fill(null);
  let current = "X";
  let gameOver = false;
  const scores = { X: 0, O: 0, D: 0 };

  const cellGrid = document.getElementById("cellGrid");
  const statusTag = document.getElementById("statusTag");
  const statusText = document.getElementById("statusText");
  const cells = [];

  function buildCells() {
    for (let i = 0; i < 9; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell";
      btn.setAttribute("role", "gridcell");
      const row = Math.floor(i / 3) + 1;
      const col = (i % 3) + 1;
      btn.dataset.row = row;
      btn.dataset.col = col;
      btn.setAttribute("aria-label", `row ${row}, column ${col}, empty`);
      btn.addEventListener("click", () => handleCellClick(i));
      cellGrid.appendChild(btn);
      cells.push(btn);
    }
  }

  function checkWinner() {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    return null;
  }

  function handleCellClick(i) {
    if (gameOver || board[i]) return;
    board[i] = current;
    drawMark(i, current);
    const btn = cells[i];
    btn.disabled = true;
    btn.setAttribute("aria-label", `row ${btn.dataset.row}, column ${btn.dataset.col}, ${current}`);

    const result = checkWinner();
    if (result) {
      gameOver = true;
      drawStrike(result.line);
      scores[result.winner]++;
      updateScore();
      setStatus(`${result.winner} wins`, "win", result.winner);
      disableAllCells();
      return;
    }
    if (board.every((c) => c)) {
      gameOver = true;
      scores.D++;
      updateScore();
      setStatus("draw — rematch?", "draw", null);
      return;
    }
    current = current === "X" ? "O" : "X";
    setStatus(`player ${current === "X" ? 1 : 2}'s turn`, "", current);
  }

  function disableAllCells() {
    cells.forEach((c) => (c.disabled = true));
  }

  function setStatus(text, state, player) {
    statusText.textContent = text;
    if (state) statusTag.dataset.state = state;
    else delete statusTag.dataset.state;
    if (player) statusTag.dataset.player = player;
    else delete statusTag.dataset.player;
  }

  function updateScore() {
    document.getElementById("scoreNumX").textContent = scores.X;
    document.getElementById("scoreNumO").textContent = scores.O;
    document.getElementById("scoreNumD").textContent = scores.D;
    renderTally(document.getElementById("tallyX"), scores.X);
    renderTally(document.getElementById("tallyO"), scores.O);
    renderTally(document.getElementById("tallyD"), scores.D);
  }

  function newGame() {
    board.fill(null);
    gameOver = false;
    current = "X";
    clearMarksAndStrike();
    cells.forEach((btn) => {
      btn.disabled = false;
      btn.setAttribute("aria-label", `row ${btn.dataset.row}, column ${btn.dataset.col}, empty`);
    });
    setStatus("player 1's turn", "", "X");
  }

  function resetScores() {
    scores.X = 0;
    scores.O = 0;
    scores.D = 0;
    updateScore();
  }

  document.getElementById("newGameBtn").addEventListener("click", newGame);
  document.getElementById("resetScoreBtn").addEventListener("click", resetScores);

  drawGrid();
  buildCells();
  updateScore();
  setStatus("player 1's turn", "", "X");
})();
