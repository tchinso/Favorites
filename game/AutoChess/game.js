(() => {
  "use strict";

  const COLORS = ["white", "black"];
  const OTHER = { white: "black", black: "white" };
  const PIECE_VALUE = { pawn: 100, knight: 320, bishop: 335, rook: 510, queen: 930, king: 1200 };
  const GLYPHS = { king: "♚", queen: "♛", rook: "♜", bishop: "♝", knight: "♞", pawn: "♟" };
  const KOREAN_TYPE = { king: "킹", queen: "퀸", rook: "룩", bishop: "비숍", knight: "나이트", pawn: "폰" };
  const FILES = "abcdefgh";
  const MAX_PLIES = 360;
  // Leave a small margin for rendering and applying the chosen move, while using
  // essentially all of the advertised three-second thinking window.
  const AI_BUDGET_MS = 2900;
  const AI_MAX_DEPTH = 12;
  const TIMEOUT = { timeout: true };

  const CARD_DEFS = [
    [1, "국가총동원령", "아군 폰 하나를 나이트로 변신시킵니다."],
    [2, "불가침 조약", "상대 3수 동안 내 기물을 잡지 못하게 합니다. 내가 잡으면 해제됩니다."],
    [3, "왕위계승 선포", "아군 폰 하나가 10수 후 퀸으로 변신합니다."],
    [4, "대행군 칙령", "한 번도 움직이지 않은 폰 하나에게 3칸 전진을 허가합니다."],
    [5, "전리품 국유화", "아군 기물 3개가 잡은 상대 기물의 종류로 즉시 변신합니다."],
    [6, "궁정 쿠데타", "아군 폰 하나와 킹의 위치를 맞바꿉니다."],
    [7, "강제 이주령", "적 기물 2개를 가능한 빈 칸 중 무작위 위치로 강제 이동합니다."],
    [8, "특별기동권", "아군 기물 하나가 다음 자기 차례에 잡지 않고 2번 이동합니다."],
    [9, "군축 조약", "상대 비숍·룩·퀸은 3수 동안 가장 멀리만 이동합니다."],
    [10, "후방 동원령", "모든 아군 폰이 뒤로 한 칸 이동할 수도 있습니다."],
    [11, "퇴로 차단선", "상대 모든 기물이 다음 차례에 뒤로 갈 수 없습니다."],
    [12, "비상계엄령", "아군 모두가 2수 동안 킹처럼도 이동합니다. 원래 행마로 멀리 가면 해제됩니다."],
    [13, "국경월경권", "모든 아군 비숍이 기물 하나를 뛰어넘을 수 있습니다."],
    [14, "해상 봉쇄령", "상대 원거리 기물 하나가 2수 동안 한 칸씩만 움직입니다."],
    [15, "숙청 명령", "지정 적이 3수 동안 내 기물을 못 잡으면 병사합니다."],
    [16, "동장군 작전", "적 킹을 제외한 무작위 3개 기물을 3수 동안 동결합니다."],
    [17, "평화유지군", "아군 비숍 하나가 다음 차례에 룩 방향도 움직입니다. 새 룩 방향에서는 잡지 못하지만, 대각선 포획은 유지합니다."],
    [18, "포로 교환 협정", "아군 기물과 같은 종류의 적 기물 하나의 위치를 맞바꿉니다."],
    [19, "시민군 편성", "아군 기물 하나에 폰의 행마법을 추가합니다."],
    [20, "국교 헌법", "내 비숍 수가 상대보다 많아지는 즉시 승리합니다."],
    [21, "국경수비대", "아군 나이트가 네 귀퉁이 2×2 안에서 비숍처럼도 움직입니다."],
    [22, "경제 제재", "지정 적이 2수 동안 내 기물을 잡지 못합니다."],
    [23, "기사단 군주제", "아군 킹이 나이트 행마법도 얻습니다."],
    [24, "보병화 명령", "상대의 킹 외 기물이 다음 차례에 폰처럼만 움직입니다."],
    [25, "개활지 교전규칙", "상대 나이트는 장기 마처럼 진행 방향의 첫 칸이 비어 있을 때만 움직입니다."],
    [26, "대리청정", "내 퀸이 살아 있으면 킹이 잡혀도 게임이 끝나지 않습니다."],
    [27, "정복왕의 흡수", "아군 킹이 잡은 기물의 행마법을 계속 습득합니다."],
  ].map(([id, title, text]) => ({ id, title, text }));

  const dom = {
    board: document.querySelector("#board"),
    turn: document.querySelector("#turn-label"),
    moveCount: document.querySelector("#move-count"),
    phase: document.querySelector("#phase-label"),
    aiNote: document.querySelector("#ai-note"),
    status: document.querySelector("#status-text"),
    start: document.querySelector("#start-button"),
    pause: document.querySelector("#pause-button"),
    whiteCards: document.querySelector("#white-cards"),
    blackCards: document.querySelector("#black-cards"),
    whiteHint: document.querySelector("#white-card-hint"),
    blackHint: document.querySelector("#black-card-hint"),
    whiteEffects: document.querySelector("#white-effects"),
    blackEffects: document.querySelector("#black-effects"),
    log: document.querySelector("#game-log"),
    clearLog: document.querySelector("#clear-log"),
    template: document.querySelector("#card-template"),
  };

  let pieceSerial = 0;
  let effectSerial = 0;
  let turnTimer = null;
  let state = freshState();

  function freshState() {
    return {
      board: makeBoard(),
      effects: [],
      turn: "white",
      moveCount: 0,
      phase: "ready",
      paused: false,
      winner: null,
      lastAction: [],
      cardOptions: null,
      cardSelections: null,
      pendingResolutions: [],
      targeting: null,
      logs: [],
      aiMilliseconds: null,
      aiSearch: null,
    };
  }

  function makeBoard() {
    pieceSerial = 0;
    const board = Array.from({ length: 8 }, () => Array(8).fill(null));
    const back = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
    for (let x = 0; x < 8; x += 1) {
      board[0][x] = makePiece(back[x], "black", x, 0);
      board[1][x] = makePiece("pawn", "black", x, 1);
      board[6][x] = makePiece("pawn", "white", x, 6);
      board[7][x] = makePiece(back[x], "white", x, 7);
    }
    return board;
  }

  function makePiece(type, color, x, y) {
    return { id: `p${++pieceSerial}`, type, color, x, y, moved: false, royal: type === "king", absorbed: [] };
  }

  function at(s, x, y) {
    return x >= 0 && x < 8 && y >= 0 && y < 8 ? s.board[y][x] : null;
  }

  function inside(x, y) { return x >= 0 && x < 8 && y >= 0 && y < 8; }
  function other(color) { return OTHER[color]; }
  function squareName(x, y) { return `${FILES[x]}${8 - y}`; }
  function coordOf(piece) { return squareName(piece.x, piece.y); }
  function isRemote(type) { return type === "bishop" || type === "rook" || type === "queen"; }
  function typeValue(type) { return PIECE_VALUE[type] || 0; }

  function allPieces(s, color) {
    const result = [];
    for (const row of s.board) for (const piece of row) if (piece && (!color || piece.color === color)) result.push(piece);
    return result;
  }

  function findPiece(s, id) {
    for (const row of s.board) for (const piece of row) if (piece && piece.id === id) return piece;
    return null;
  }

  function findRoyal(s, color) { return allPieces(s, color).find((piece) => piece.royal) || null; }
  function countType(s, color, type) { return allPieces(s, color).filter((piece) => piece.type === type).length; }
  function effectsOf(s, kind, predicate = () => true) { return s.effects.filter((effect) => effect.kind === kind && predicate(effect)); }
  function hasEffect(s, kind, predicate = () => true) { return s.effects.some((effect) => effect.kind === kind && predicate(effect)); }
  function addEffect(s, owner, kind, label, props = {}) {
    const effect = { id: `e${++effectSerial}`, owner, kind, label, ...props };
    s.effects.push(effect);
    return effect;
  }
  function removeEffect(s, id) { s.effects = s.effects.filter((effect) => effect.id !== id); }
  function removeEffects(s, predicate) { s.effects = s.effects.filter((effect) => !predicate(effect)); }
  function isFrozen(s, piece) { return hasEffect(s, "freeze", (effect) => effect.pieceId === piece.id && effect.remaining > 0); }

  function capturesBlocked(s, source, target, options = {}) {
    if (!target || source.color === target.color) return false;
    if (isFrozen(s, target)) return true;
    if (options.noCapture) return true;
    if (hasEffect(s, "protect", (effect) => effect.owner === target.color && effect.target === source.color && effect.remaining > 0)) return true;
    if (hasEffect(s, "noCapturePiece", (effect) => effect.pieceId === source.id && effect.owner === target.color && effect.remaining > 0)) return true;
    return false;
  }

  function noBackwardActive(s, color) {
    return hasEffect(s, "noBackward", (effect) => effect.target === color && effect.remaining > 0);
  }

  function isBackward(piece, y) {
    return piece.color === "white" ? y > piece.y : y < piece.y;
  }

  function hasCornerBishop(s, piece) {
    return piece.type === "knight" && hasEffect(s, "cornerKnight", (effect) => effect.owner === piece.color)
      && ((piece.x < 2 || piece.x > 5) && (piece.y < 2 || piece.y > 5));
  }

  function knightPathClear(s, piece, x, y) {
    if (piece.type !== "knight" || !hasEffect(s, "antiKnight", (effect) => effect.target === piece.color)) return true;
    const dx = x - piece.x;
    const dy = y - piece.y;
    // Janggi's horse first advances one orthogonal square, then goes diagonally.
    // Only that one forward square blocks this particular direction.
    const blockerX = Math.abs(dx) === 2 ? piece.x + Math.sign(dx) : piece.x;
    const blockerY = Math.abs(dy) === 2 ? piece.y + Math.sign(dy) : piece.y;
    return !at(s, blockerX, blockerY);
  }

  function generateMoves(s, piece, options = {}) {
    if (!piece || isFrozen(s, piece)) return [];
    const pawnOnly = !piece.royal && hasEffect(s, "pawnOnly", (effect) => effect.target === piece.color && effect.remaining > 0);
    const queenQuiet = hasEffect(s, "bishopQueenQuiet", (effect) => effect.pieceId === piece.id && effect.remaining > 0);
    const oneStepRemote = hasEffect(s, "oneStepRemote", (effect) => effect.pieceId === piece.id && effect.remaining > 0);
    const maxRange = isRemote(piece.type) && hasEffect(s, "maxRange", (effect) => effect.target === piece.color && effect.remaining > 0);
    const kingStep = hasEffect(s, "kingStep", (effect) => effect.owner === piece.color && effect.remaining > 0);
    const noCapture = Boolean(options.noCapture);
    const seen = new Set();
    const moves = [];
    const add = (x, y, tags = {}) => {
      if (!inside(x, y) || (noBackwardActive(s, piece.color) && isBackward(piece, y))) return;
      const target = at(s, x, y);
      if (target && target.color === piece.color) return;
      if (target && capturesBlocked(s, piece, target, { noCapture: noCapture || tags.noCapture })) return;
      if (!target && tags.captureOnly) return;
      if (target && tags.quietOnly) return;
      const key = `${x},${y}`;
      if (seen.has(key)) return;
      seen.add(key);
      moves.push({ pieceId: piece.id, from: { x: piece.x, y: piece.y }, to: { x, y }, capture: target ? target.id : null, via: tags.via || piece.type });
    };
    const addPawn = (isAddition = false) => {
      const dir = piece.color === "white" ? -1 : 1;
      const oneY = piece.y + dir;
      if (inside(piece.x, oneY) && !at(s, piece.x, oneY)) {
        add(piece.x, oneY, { via: "pawn" });
        const twoY = piece.y + dir * 2;
        if (!piece.moved && inside(piece.x, twoY) && !at(s, piece.x, twoY)) add(piece.x, twoY, { via: "pawn" });
        const long = !isAddition && piece.type === "pawn" && hasEffect(s, "longPawn", (effect) => effect.pieceId === piece.id);
        const threeY = piece.y + dir * 3;
        if (long && !piece.moved && inside(piece.x, threeY) && !at(s, piece.x, twoY) && !at(s, piece.x, threeY)) add(piece.x, threeY, { via: "longPawn" });
      }
      for (const dx of [-1, 1]) if (inside(piece.x + dx, oneY)) add(piece.x + dx, oneY, { via: "pawn", captureOnly: true });
      if (!isAddition && piece.type === "pawn" && hasEffect(s, "pawnBack", (effect) => effect.owner === piece.color)) {
        const backY = piece.y - dir;
        if (inside(piece.x, backY) && !at(s, piece.x, backY)) add(piece.x, backY, { via: "pawnBack" });
      }
    };
    const addKnight = () => {
      for (const [dx, dy] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) {
        const x = piece.x + dx, y = piece.y + dy;
        if (inside(x, y) && knightPathClear(s, piece, x, y)) add(x, y, { via: "knight" });
      }
    };
    const addKing = () => {
      for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (dx || dy) add(piece.x + dx, piece.y + dy, { via: "king" });
    };
    const addRays = (directions, movement, rayOptions = {}) => {
      const limit = oneStepRemote ? 1 : 7;
      const canJump = movement === "bishop" && piece.type === "bishop" && hasEffect(s, "bishopJump", (effect) => effect.owner === piece.color);
      for (const [dx, dy] of directions) {
        const candidates = [];
        let blocker = null;
        for (let step = 1; step <= limit; step += 1) {
          const x = piece.x + dx * step, y = piece.y + dy * step;
          if (!inside(x, y)) break;
          const occupant = at(s, x, y);
          if (!occupant) candidates.push({ x, y, target: null });
          else {
            if (occupant.color !== piece.color) candidates.push({ x, y, target: occupant });
            blocker = { step, x, y };
            break;
          }
        }
        if (canJump && blocker && blocker.step < limit) {
          for (let step = blocker.step + 1; step <= limit; step += 1) {
            const x = piece.x + dx * step, y = piece.y + dy * step;
            if (!inside(x, y)) break;
            const occupant = at(s, x, y);
            if (!occupant) candidates.push({ x, y, target: null });
            else {
              if (occupant.color !== piece.color) candidates.push({ x, y, target: occupant });
              break;
            }
          }
        }
        const usable = maxRange && candidates.length ? [candidates[candidates.length - 1]] : candidates;
        for (const candidate of usable) add(candidate.x, candidate.y, { via: movement, noCapture: rayOptions.noCapture });
      }
    };
    const addMovement = (kind, isAdded = false, movementOptions = {}) => {
      if (kind === "pawn") addPawn(isAdded);
      else if (kind === "knight") addKnight();
      else if (kind === "king") addKing();
      else if (kind === "bishop") addRays([[1, 1], [1, -1], [-1, 1], [-1, -1]], "bishop", movementOptions);
      else if (kind === "rook") addRays([[1, 0], [-1, 0], [0, 1], [0, -1]], "rook", movementOptions);
      else if (kind === "queen") addRays([[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]], "queen", movementOptions);
    };

    if (queenQuiet) {
      addMovement("bishop");
      addMovement("rook", false, { noCapture: true });
    }
    else if (pawnOnly) addMovement("pawn");
    else {
      addMovement(piece.type);
      if (piece.royal && hasEffect(s, "kingKnight", (effect) => effect.owner === piece.color)) addMovement("knight", true);
      if (piece.royal) for (const skill of piece.absorbed || []) addMovement(skill, true);
      if (hasCornerBishop(s, piece)) addMovement("bishop", true);
      if (hasEffect(s, "pawnAugment", (effect) => effect.pieceId === piece.id)) addMovement("pawn", true);
      if (kingStep) addMovement("king", true);
    }
    return moves;
  }

  function getTurnActions(s, color) {
    const double = effectsOf(s, "doubleMove", (effect) => effect.owner === color && effect.remaining > 0)[0];
    if (double) {
      const piece = findPiece(s, double.pieceId);
      if (piece && !isFrozen(s, piece)) {
        const firstMoves = generateMoves(s, piece, { noCapture: true }).filter((move) => !move.capture);
        const actions = [];
        for (const first of firstMoves) {
          const copy = cloneState(s);
          rawMove(copy, first);
          const shifted = findPiece(copy, piece.id);
          if (!shifted) continue;
          const secondMoves = generateMoves(copy, shifted, { noCapture: true }).filter((move) => !move.capture);
          for (const second of secondMoves) actions.push({ moves: [first, second], isDouble: true });
        }
        if (actions.length) return actions;
      }
      removeEffect(s, double.id);
    }
    return allPieces(s, color).flatMap((piece) => generateMoves(s, piece).map((move) => ({ moves: [move], isDouble: false })));
  }

  function actionHeuristic(s, action) {
    let score = 0;
    for (const move of action.moves) {
      const source = at(s, move.from.x, move.from.y);
      const target = at(s, move.to.x, move.to.y);
      if (target) score += typeValue(target.type) * 10 - (source ? typeValue(source.type) : 0) / 12;
      score += 18 - (Math.abs(3.5 - move.to.x) + Math.abs(3.5 - move.to.y)) * 3;
      if (source && source.type === "pawn") score += source.color === "white" ? (6 - move.to.y) * 5 : (move.to.y - 1) * 5;
    }
    return score + (action.isDouble ? 24 : 0);
  }

  function orderActions(s, actions, limit) {
    return actions.map((action) => ({ action, score: actionHeuristic(s, action) })).sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.action);
  }

  function actionKey(action) {
    return action.moves.map((move) => `${move.pieceId}:${move.from.x}${move.from.y}-${move.to.x}${move.to.y}`).join("/");
  }

  function orderSearchActions(s, actions, limit, preferred, context, ply) {
    const killer = context?.killers.get(ply);
    return actions.map((action) => {
      const key = actionKey(action);
      let score = actionHeuristic(s, action);
      if (key === preferred) score += 1000000;
      else if (key === killer) score += 9000;
      score += context?.history.get(key) || 0;
      return { action, key, score };
    }).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  function rawMove(s, move) {
    const piece = at(s, move.from.x, move.from.y);
    if (!piece) return { invalid: true };
    const target = at(s, move.to.x, move.to.y);
    const fromName = coordOf(piece);
    s.board[move.from.y][move.from.x] = null;
    s.board[move.to.y][move.to.x] = piece;
    piece.x = move.to.x;
    piece.y = move.to.y;
    piece.moved = true;
    let transformed = null;
    if (target && hasEffect(s, "morphCapture", (effect) => effect.pieceId === piece.id)) {
      transformed = target.type;
      piece.type = target.type;
    }
    let promotion = null;
    if (piece.type === "pawn" && (piece.y === 0 || piece.y === 7)) {
      piece.type = "queen";
      promotion = "queen";
    }
    if (target && piece.royal && hasEffect(s, "kingAbsorb", (effect) => effect.owner === piece.color)) {
      piece.absorbed = piece.absorbed || [];
      if (!piece.absorbed.includes(target.type)) piece.absorbed.push(target.type);
    }
    return { piece, target, fromName, toName: coordOf(piece), transformed, promotion, move };
  }

  function executeAction(s, action) {
    const color = s.turn;
    const events = [];
    const captures = [];
    let longKingMove = false;
    for (const move of action.moves) {
      const moving = at(s, move.from.x, move.from.y);
      if (moving && hasEffect(s, "kingStep", (effect) => effect.owner === color && effect.remaining > 0)
          && Math.max(Math.abs(move.to.x - moving.x), Math.abs(move.to.y - moving.y)) > 1) longKingMove = true;
      const result = rawMove(s, move);
      if (!result.invalid) {
        events.push(result);
        if (result.target) captures.push(result);
      }
    }
    s.moveCount += 1;
    resolveScheduledPromotions(s, events);
    updateEffectsAfterTurn(s, color, { action, events, captures, longKingMove });
    checkVictory(s);
    s.lastAction = action.moves.map((move) => ({ from: move.from, to: move.to }));
    if (!s.winner) s.turn = other(color);
    return { color, events, captures, double: action.isDouble };
  }

  function updateEffectsAfterTurn(s, color, info) {
    const notes = [];
    if (info.captures.some((capture) => capture.piece.color === color)) {
      removeEffects(s, (effect) => effect.kind === "protect" && effect.owner === color);
    }
    if (info.longKingMove) {
      const removed = effectsOf(s, "kingStep", (effect) => effect.owner === color);
      if (removed.length) {
        removeEffects(s, (effect) => effect.kind === "kingStep" && effect.owner === color);
        notes.push("비상계엄령이 원래 행마 선택으로 일찍 해제되었습니다.");
      }
    }
    const survivors = [];
    for (const effect of s.effects) {
      let decrement = false;
      if (["protect", "maxRange", "noBackward", "pawnOnly", "freeze", "oneStepRemote", "noCapturePiece", "curse"].includes(effect.kind) && effect.target === color) decrement = true;
      if (["kingStep", "bishopQueenQuiet"].includes(effect.kind) && effect.owner === color) decrement = true;
      if (effect.kind === "longPawn" && info.events.some((event) => event.piece.id === effect.pieceId)) continue;
      if (effect.kind === "doubleMove" && effect.owner === color) continue;
      if (effect.kind === "curse") {
        const cursed = findPiece(s, effect.pieceId);
        const escaped = info.captures.some((capture) => capture.piece.id === effect.pieceId && capture.target.color === effect.owner);
        if (!cursed || escaped) continue;
      }
      if (decrement && typeof effect.remaining === "number") {
        effect.remaining -= 1;
        if (effect.remaining <= 0) {
          if (effect.kind === "curse") {
            const cursed = findPiece(s, effect.pieceId);
            if (cursed) {
              s.board[cursed.y][cursed.x] = null;
              notes.push(`${KOREAN_TYPE[cursed.type]}(${coordOf(cursed)})가 저주로 병사했습니다.`);
            }
          }
          continue;
        }
      }
      survivors.push(effect);
    }
    s.effects = survivors;
    if (notes.length) s._notes = (s._notes || []).concat(notes);
  }

  function resolveScheduledPromotions(s, events) {
    const keep = [];
    for (const effect of s.effects) {
      if (effect.kind === "delayedQueen" && s.moveCount >= effect.dueAt) {
        const piece = findPiece(s, effect.pieceId);
        if (piece) {
          piece.type = "queen";
          events.push({ scheduled: true, piece, message: `${coordOf(piece)}의 약속이 실현되어 퀸이 되었습니다.` });
        }
      } else keep.push(effect);
    }
    s.effects = keep;
  }

  function checkVictory(s) {
    if (s.winner) return;
    for (const color of COLORS) {
      const royal = findRoyal(s, color);
      const queenAlive = countType(s, color, "queen") > 0;
      const spared = hasEffect(s, "kingSurvival", (effect) => effect.owner === color) && queenAlive;
      if (!royal && !spared) {
        s.winner = other(color);
        s.winReason = `${color === "white" ? "백" : "흑"} 킹이 포획되었습니다.`;
        return;
      }
    }
    for (const effect of effectsOf(s, "bishopMajority")) {
      if (countType(s, effect.owner, "bishop") > countType(s, other(effect.owner), "bishop")) {
        s.winner = effect.owner;
        s.winReason = "비숍 우위 규칙이 발동했습니다.";
        return;
      }
    }
  }

  function cloneState(s) {
    return JSON.parse(JSON.stringify({
      board: s.board, effects: s.effects, turn: s.turn, moveCount: s.moveCount, winner: s.winner,
      winReason: s.winReason, lastAction: s.lastAction,
    }));
  }

  function effectValue(s, effect) {
    const target = effect.pieceId ? findPiece(s, effect.pieceId) : null;
    const scale = typeof effect.remaining === "number" ? 0.5 + Math.min(effect.remaining, 3) * 0.18 : 1;
    const values = {
      protect: 90, maxRange: 55, noBackward: 70, pawnOnly: 125, oneStepRemote: 90,
      noCapturePiece: 105, kingStep: 85, bishopQueenQuiet: 90, doubleMove: 135,
      longPawn: 38, pawnBack: 45, pawnAugment: 75, kingKnight: 80, cornerKnight: 70,
      bishopJump: 95, antiKnight: 70, kingSurvival: 235, kingAbsorb: 115,
      morphCapture: 85, delayedQueen: 130, bishopMajority: 160,
    };
    if (effect.kind === "freeze") return (target ? typeValue(target.type) * 0.4 : 70) * scale;
    if (effect.kind === "curse") return (target ? typeValue(target.type) * 0.4 : 100) * scale;
    if (effect.kind === "bishopMajority") {
      return Math.max(0, countType(s, effect.owner, "bishop") - countType(s, other(effect.owner), "bishop")) * 260;
    }
    if (effect.kind === "delayedQueen") {
      const turns = Math.max(0, (effect.dueAt || s.moveCount) - s.moveCount);
      return (target ? 230 : 0) * Math.max(0.25, 1 - turns / 16);
    }
    return (values[effect.kind] || 28) * scale;
  }

  function tacticalScore(s, color) {
    let mobility = 0;
    let capturePressure = 0;
    let kingThreat = 0;
    for (const piece of allPieces(s, color)) {
      const moves = generateMoves(s, piece);
      mobility += moves.length;
      for (const move of moves) {
        if (!move.capture) continue;
        const target = at(s, move.to.x, move.to.y);
        if (!target) continue;
        if (target.royal) {
          const survives = hasEffect(s, "kingSurvival", (effect) => effect.owner === target.color)
            && countType(s, target.color, "queen") > 0;
          kingThreat += survives ? 1900 : 240000;
        } else capturePressure += typeValue(target.type);
      }
    }
    return mobility * 5 + capturePressure * 0.12 + kingThreat;
  }

  function evaluate(s, perspective) {
    if (s.winner) return s.winner === perspective ? 999999 : s.winner === "draw" ? 0 : -999999;
    const scoreFor = (color) => allPieces(s, color).reduce((sum, piece) => {
      const center = 7 - (Math.abs(piece.x - 3.5) + Math.abs(piece.y - 3.5));
      const pawnProgress = piece.type === "pawn" ? (piece.color === "white" ? 6 - piece.y : piece.y - 1) * 10 : 0;
      const frozen = isFrozen(s, piece) ? -Math.max(32, typeValue(piece.type) * 0.13) : 0;
      const developed = piece.moved && piece.type !== "pawn" ? 7 : 0;
      return sum + typeValue(piece.type) + center * 4 + pawnProgress + frozen + developed;
    }, 0);
    let score = scoreFor(perspective) - scoreFor(other(perspective));
    score += tacticalScore(s, perspective) - tacticalScore(s, other(perspective));
    for (const effect of s.effects) score += (effect.owner === perspective ? 1 : -1) * effectValue(s, effect);
    return score;
  }

  function positionKey(s) {
    const board = s.board.map((row) => row.map((piece) => {
      if (!piece) return ".";
      return `${piece.id}${piece.type[0]}${piece.color[0]}${piece.moved ? 1 : 0}${(piece.absorbed || []).map((type) => type[0]).join("")}`;
    }).join(",")).join("/");
    const effects = s.effects.map((effect) => {
      const { id, label, ...props } = effect;
      return Object.keys(props).sort().map((key) => {
        const value = key === "dueAt" && typeof props[key] === "number" ? props[key] - s.moveCount : props[key];
        return `${key}:${Array.isArray(value) ? value.join(".") : value}`;
      }).join(",");
    }).sort().join("/");
    return `${s.turn}|${board}|${effects}`;
  }

  function searchWidth(depth, ply) {
    if (ply === 0) return 48;
    if (depth >= 5) return 7;
    if (depth >= 4) return 9;
    if (depth >= 3) return 12;
    if (depth >= 2) return 16;
    return 20;
  }

  function touchSearch(context) {
    context.nodes += 1;
    if ((context.nodes & 127) === 0 && performance.now() >= context.deadline) throw TIMEOUT;
  }

  function saveTransposition(context, key, entry) {
    if (context.table.size >= 80000) context.table.clear();
    context.table.set(key, entry);
  }

  function rememberCutoff(context, action, ply, depth) {
    if (action.moves.some((move) => move.capture)) return;
    const key = actionKey(action);
    context.killers.set(ply, key);
    context.history.set(key, Math.min(8000, (context.history.get(key) || 0) + depth * depth * 22));
  }

  function quiescence(s, alpha, beta, context, ply, remaining = 3) {
    touchSearch(context);
    if (s.winner) return evaluate(s, context.perspective);
    const maxing = s.turn === context.perspective;
    const standPat = evaluate(s, context.perspective);
    let value = standPat;
    if (maxing) {
      if (value >= beta) return value;
      alpha = Math.max(alpha, value);
    } else {
      if (value <= alpha) return value;
      beta = Math.min(beta, value);
    }
    if (remaining <= 0) return value;
    const tacticalActions = getTurnActions(s, s.turn).filter((action) => action.moves.some((move) => move.capture));
    if (!tacticalActions.length) return value;
    const actions = orderSearchActions(s, tacticalActions, 10, null, context, ply);
    for (const { action } of actions) {
      const copy = cloneState(s);
      executeAction(copy, action);
      const score = quiescence(copy, alpha, beta, context, ply + 1, remaining - 1);
      if (maxing) {
        value = Math.max(value, score);
        alpha = Math.max(alpha, value);
      } else {
        value = Math.min(value, score);
        beta = Math.min(beta, value);
      }
      if (beta <= alpha) break;
    }
    return value;
  }

  function minimax(s, depth, alpha, beta, context, ply = 0) {
    touchSearch(context);
    if (s.winner) return evaluate(s, context.perspective);
    if (depth <= 0) return quiescence(s, alpha, beta, context, ply);
    const alphaStart = alpha;
    const betaStart = beta;
    const key = positionKey(s);
    const cached = context.table.get(key);
    const preferred = cached?.best || null;
    if (cached && cached.depth >= depth) {
      if (cached.flag === "exact") return cached.value;
      if (cached.flag === "lower") alpha = Math.max(alpha, cached.value);
      if (cached.flag === "upper") beta = Math.min(beta, cached.value);
      if (beta <= alpha) return cached.value;
    }
    const unranked = getTurnActions(s, s.turn);
    if (!unranked.length) return s.turn === context.perspective ? -700000 : 700000;
    const actions = orderSearchActions(s, unranked, searchWidth(depth, ply), preferred, context, ply);
    const maxing = s.turn === context.perspective;
    let value = maxing ? -Infinity : Infinity;
    let best = null;
    for (const { action, key: currentKey } of actions) {
      const copy = cloneState(s);
      executeAction(copy, action);
      const score = minimax(copy, depth - 1, alpha, beta, context, ply + 1);
      if ((maxing && score > value) || (!maxing && score < value)) {
        value = score;
        best = currentKey;
      }
      if (maxing) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (beta <= alpha) {
        rememberCutoff(context, action, ply, depth);
        break;
      }
    }
    const flag = value <= alphaStart ? "upper" : value >= betaStart ? "lower" : "exact";
    saveTransposition(context, key, { depth, value, flag, best });
    return value;
  }

  function chooseBestAction(s, color) {
    const context = {
      deadline: performance.now() + AI_BUDGET_MS,
      perspective: color,
      table: new Map(),
      killers: new Map(),
      history: new Map(),
      nodes: 0,
    };
    let rootActions = getTurnActions(s, color);
    if (!rootActions.length) return { action: null, stats: { depth: 0, nodes: 0 } };
    rootActions = orderSearchActions(s, rootActions, 48, null, context, 0).map(({ action }) => action);
    let best = rootActions[0];
    let bestScore = -Infinity;
    let completedDepth = 0;
    for (let depth = 1; depth <= AI_MAX_DEPTH; depth += 1) {
      try {
        let alpha = -Infinity;
        let candidate = best;
        let candidateScore = -Infinity;
        for (const action of rootActions) {
          if (performance.now() >= context.deadline) throw TIMEOUT;
          const copy = cloneState(s);
          executeAction(copy, action);
          const score = minimax(copy, depth - 1, alpha, Infinity, context, 1);
          if (score > candidateScore) {
            candidate = action;
            candidateScore = score;
          }
          alpha = Math.max(alpha, candidateScore);
        }
        best = candidate;
        bestScore = candidateScore;
        completedDepth = depth;
        rootActions = orderSearchActions(s, rootActions, 48, actionKey(best), context, 0).map(({ action }) => action);
        if (Math.abs(bestScore) >= 900000) break;
      } catch (error) {
        if (error !== TIMEOUT) throw error;
        break;
      }
    }
    return { action: best, stats: { depth: completedDepth, nodes: context.nodes } };
  }

  function drawCards() {
    const pool = [...CARD_DEFS];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  function offerCards(initial = false) {
    state.phase = "cards";
    state.cardOptions = { white: drawCards(), black: drawCards() };
    state.cardSelections = { white: undefined, black: undefined };
    state.pendingResolutions = [];
    state.targeting = null;
    addLog(initial ? "전투 전 카드 배정: 백과 흑이 각각 선택하거나 스킵할 수 있습니다." : `${state.moveCount}수 경과: 새 비전 카드가 도착했습니다.`, true);
    setStatus("백과 흑에게 각각 카드 3장이 제시되었습니다. 원하는 쪽만 선택하거나, 둘 다 스킵할 수 있습니다.");
    render();
  }

  function pickCard(color, id) {
    if (state.phase !== "cards" || state.cardSelections[color] !== undefined) return;
    const card = state.cardOptions[color].find((item) => item.id === id);
    if (!card) return;
    state.cardSelections[color] = card;
    addLog(`${color === "white" ? "백" : "흑"}이(가) [${card.title}] 카드를 선택했습니다.`, true);
    selectedOrSkipped(color, card);
  }

  function skipCard(color) {
    if (state.phase !== "cards" || state.cardSelections[color] !== undefined) return;
    state.cardSelections[color] = null;
    addLog(`${color === "white" ? "백" : "흑"}이(가) 이번 카드 배정을 스킵했습니다.`);
    selectedOrSkipped(color, null);
  }

  function selectedOrSkipped(color, card) {
    if (state.cardSelections.white !== undefined && state.cardSelections.black !== undefined) {
      state.pendingResolutions = COLORS.map((side) => ({ color: side, card: state.cardSelections[side] })).filter((item) => item.card);
      resolveNextCard();
    } else {
      setStatus(`${color === "white" ? "백" : "흑"}의 ${card ? "카드가 확정" : "스킵이 확정"}되었습니다. 다른 쪽을 선택하거나 스킵하세요.`);
      render();
    }
  }

  function cardNeedsTarget(card) { return [1, 3, 4, 5, 6, 8, 14, 15, 17, 18, 19, 22].includes(card.id); }

  function resolveNextCard() {
    if (state.winner) return endGame();
    const next = state.pendingResolutions.shift();
    if (!next) return resumePlay();
    const targetIds = cardNeedsTarget(next.card) ? chooseBestCardTargets(state, next.color, next.card) : [];
    if (cardNeedsTarget(next.card) && !targetIds.length) {
      addLog(`[${next.card.title}]은(는) 현재 유효한 대상이 없어 소멸했습니다.`);
    } else {
      if (targetIds.length) addLog(`${next.color === "white" ? "백" : "흑"} AI가 [${next.card.title}]의 최적 대상을 ${targetIds.map((id) => targetLabel(state, id)).join(", ")}로 지정했습니다.`);
      applyCard(next.color, next.card, targetIds);
    }
    resolveNextCard();
  }

  function targetLabel(s, id) {
    const piece = findPiece(s, id);
    return piece ? `${KOREAN_TYPE[piece.type]} ${coordOf(piece)}` : "사라진 기물";
  }

  function randomSample(items, count) {
    const pool = [...items];
    for (let i = 0; i < Math.min(count, pool.length); i += 1) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  function combinations(items, count, start = 0, picked = [], result = []) {
    if (picked.length === count) { result.push([...picked]); return result; }
    for (let i = start; i <= items.length - (count - picked.length); i += 1) {
      picked.push(items[i]); combinations(items, count, i + 1, picked, result); picked.pop();
    }
    return result;
  }

  function canAdvanceThree(s, piece) {
    const dir = piece.color === "white" ? -1 : 1;
    return [1, 2, 3].every((step) => inside(piece.x, piece.y + dir * step) && !at(s, piece.x, piece.y + dir * step));
  }

  function capturePotential(s, piece) {
    return generateMoves(s, piece).filter((move) => move.capture).reduce((sum, move) => sum + typeValue(findPiece(s, move.capture)?.type), 0);
  }

  function chooseBestCardTargets(s, owner, card) {
    const own = allPieces(s, owner);
    const enemy = allPieces(s, other(owner));
    let groups = [];
    switch (card.id) {
      case 1: case 3: groups = own.filter((piece) => piece.type === "pawn").map((piece) => [piece]); break;
      case 4: groups = own.filter((piece) => piece.type === "pawn" && !piece.moved && canAdvanceThree(s, piece)).map((piece) => [piece]); break;
      case 5: groups = combinations(own, 3); break;
      case 6: groups = findRoyal(s, owner) ? own.filter((piece) => piece.type === "pawn").map((piece) => [piece]) : []; break;
      case 8: case 19: groups = own.filter((piece) => !isFrozen(s, piece)).map((piece) => [piece]); break;
      case 14: groups = enemy.filter((piece) => isRemote(piece.type)).map((piece) => [piece]); break;
      case 15: groups = enemy.filter((piece) => !piece.royal).map((piece) => [piece]); break;
      case 22: groups = enemy.map((piece) => [piece]); break;
      case 17: groups = own.filter((piece) => piece.type === "bishop" && !isFrozen(s, piece)).map((piece) => [piece]); break;
      case 18: groups = own.flatMap((piece) => enemy.filter((rival) => rival.type === piece.type).map((rival) => [piece, rival])); break;
      default: break;
    }
    if (!groups.length) return [];
    let best = groups[0]; let bestScore = -Infinity;
    for (const group of groups) {
      const score = cardTargetScore(s, owner, card, group);
      if (score > bestScore) { bestScore = score; best = group; }
    }
    return best.map((piece) => piece.id);
  }

  function cardTargetScore(s, owner, card, group) {
    const enemy = other(owner);
    const first = group[0];
    const advancement = (piece) => piece.color === "white" ? 6 - piece.y : piece.y - 1;
    if (card.id === 1) {
      const copy = cloneState(s); const pawn = findPiece(copy, first.id); pawn.type = "knight";
      return evaluate(copy, owner) + generateMoves(copy, pawn).length * 14;
    }
    if (card.id === 3) return advancement(first) * 48 + generateMoves(s, first).length * 7 - (first.x === 0 || first.x === 7 ? 9 : 0);
    if (card.id === 4) return advancement(first) * 36 + (7 - Math.abs(3.5 - first.x) * 2) * 8;
    if (card.id === 5) return group.reduce((score, piece) => score + capturePotential(s, piece) * 1.3 + generateMoves(s, piece).length * 9 - typeValue(piece.type) * 0.04, 0);
    if (card.id === 6) {
      const copy = cloneState(s); const pawn = findPiece(copy, first.id); const king = findRoyal(copy, owner);
      copy.board[pawn.y][pawn.x] = king; copy.board[king.y][king.x] = pawn;
      [pawn.x, pawn.y, king.x, king.y] = [king.x, king.y, pawn.x, pawn.y];
      const kingThreatened = allPieces(copy, enemy).some((piece) => generateMoves(copy, piece).some((move) => move.capture === king.id));
      return evaluate(copy, owner) - (kingThreatened ? 1100 : 0);
    }
    if (card.id === 8) {
      const copy = cloneState(s); copy.effects.push({ kind: "doubleMove", owner, pieceId: first.id, remaining: 1 });
      return getTurnActions(copy, owner).reduce((score, action) => Math.max(score, actionHeuristic(copy, action)), -9000);
    }
    if (card.id === 14) return typeValue(first.type) * 4 + generateMoves(s, first).length * 16 + capturePotential(s, first) * 1.2;
    if (card.id === 15) return typeValue(first.type) * 4 - capturePotential(s, first) * 2 + (isFrozen(s, first) ? 120 : 0);
    if (card.id === 17) {
      const copy = cloneState(s); const bishop = findPiece(copy, first.id);
      copy.effects.push({ kind: "bishopQueenQuiet", owner, pieceId: bishop.id, remaining: 1 });
      return generateMoves(copy, bishop).length * 18;
    }
    if (card.id === 18) {
      const copy = cloneState(s); const ally = findPiece(copy, group[0].id); const rival = findPiece(copy, group[1].id);
      copy.board[ally.y][ally.x] = rival; copy.board[rival.y][rival.x] = ally;
      [ally.x, ally.y, rival.x, rival.y] = [rival.x, rival.y, ally.x, ally.y];
      return evaluate(copy, owner);
    }
    if (card.id === 19) {
      const copy = cloneState(s); const piece = findPiece(copy, first.id);
      const before = generateMoves(copy, piece).length;
      copy.effects.push({ kind: "pawnAugment", owner, pieceId: piece.id });
      return (generateMoves(copy, piece).length - before) * 30 + capturePotential(copy, piece) * 0.6;
    }
    if (card.id === 22) return typeValue(first.type) * 3 + capturePotential(s, first) * 2;
    return 0;
  }

  function applyCard(owner, card, targetIds) {
    const enemy = other(owner);
    const targets = targetIds.map((id) => findPiece(state, id)).filter(Boolean);
    const label = card.title;
    const name = owner === "white" ? "백" : "흑";
    const one = targets[0];
    switch (card.id) {
      case 1: one.type = "knight"; addLog(`${name}의 ${coordOf(one)} 폰이 나이트로 전직했습니다.`, true); break;
      case 2: addEffect(state, owner, "protect", label, { target: enemy, remaining: 3 }); break;
      case 3: addEffect(state, owner, "delayedQueen", label, { pieceId: one.id, dueAt: state.moveCount + 10 }); break;
      case 4: addEffect(state, owner, "longPawn", label, { pieceId: one.id }); break;
      case 5: targets.forEach((piece) => addEffect(state, owner, "morphCapture", label, { pieceId: piece.id })); break;
      case 6: {
        const king = findRoyal(state, owner);
        if (!king) { addLog(`[${label}] 실패: 바꿀 킹이 없습니다.`); break; }
        const px = one.x, py = one.y;
        state.board[one.y][one.x] = king; state.board[king.y][king.x] = one;
        [one.x, one.y, king.x, king.y] = [king.x, king.y, px, py];
        break;
      }
      case 7: {
        const displaced = randomSample(allPieces(state, enemy), 2);
        displaced.forEach((piece) => forceRandomMove(piece));
        addLog(`${name}의 강제 이주령이 무작위 적 기물 ${displaced.length}개를 지정했습니다.`, true);
        break;
      }
      case 8: addEffect(state, owner, "doubleMove", label, { pieceId: one.id, remaining: 1 }); break;
      case 9: addEffect(state, owner, "maxRange", label, { target: enemy, remaining: 3 }); break;
      case 10: addEffect(state, owner, "pawnBack", label); break;
      case 11: addEffect(state, owner, "noBackward", label, { target: enemy, remaining: 1 }); break;
      case 12: addEffect(state, owner, "kingStep", label, { remaining: 2 }); break;
      case 13: addEffect(state, owner, "bishopJump", label); break;
      case 14: addEffect(state, owner, "oneStepRemote", label, { pieceId: one.id, target: enemy, remaining: 2 }); break;
      case 15:
        if (!one || one.royal) {
          addLog(`[${label}] 실패: 상대 왕은 저주할 수 없습니다.`);
          break;
        }
        addEffect(state, owner, "curse", label, { pieceId: one.id, target: enemy, remaining: 3 });
        break;
      case 16: {
        const frozen = randomSample(allPieces(state, enemy).filter((piece) => !piece.royal), 3);
        frozen.forEach((piece) => addEffect(state, owner, "freeze", label, { pieceId: piece.id, target: enemy, remaining: 3 }));
        addLog(`${name}의 동장군 작전이 ${frozen.length}개 기물을 얼렸습니다.`, true);
        break;
      }
      case 17: addEffect(state, owner, "bishopQueenQuiet", label, { pieceId: one.id, remaining: 1 }); break;
      case 18: {
        const rival = targets[1]; const ax = one.x, ay = one.y;
        state.board[one.y][one.x] = rival; state.board[rival.y][rival.x] = one;
        [one.x, one.y, rival.x, rival.y] = [rival.x, rival.y, ax, ay];
        break;
      }
      case 19: addEffect(state, owner, "pawnAugment", label, { pieceId: one.id }); break;
      case 20: addEffect(state, owner, "bishopMajority", label); break;
      case 21: addEffect(state, owner, "cornerKnight", label); break;
      case 22: addEffect(state, owner, "noCapturePiece", label, { pieceId: one.id, target: enemy, remaining: 2 }); break;
      case 23: addEffect(state, owner, "kingKnight", label); break;
      case 24: addEffect(state, owner, "pawnOnly", label, { target: enemy, remaining: 1 }); break;
      case 25: addEffect(state, owner, "antiKnight", label, { target: enemy }); break;
      case 26: addEffect(state, owner, "kingSurvival", label); break;
      case 27: addEffect(state, owner, "kingAbsorb", label); break;
      default: break;
    }
    if (![1, 7, 16].includes(card.id)) addLog(`${name}에게 [${label}] 효과가 부여되었습니다.`, true);
    checkVictory(state);
  }

  function forceRandomMove(piece) {
    const destinations = generateMoves(state, piece).filter((move) => !move.capture);
    if (!destinations.length) { addLog(`${coordOf(piece)}의 강제 이동은 가능한 빈 칸이 없어 무산되었습니다.`); return; }
    const choice = destinations[Math.floor(Math.random() * destinations.length)];
    const result = rawMove(state, choice);
    addLog(`${piece.color === "white" ? "백" : "흑"} ${KOREAN_TYPE[piece.type]}이(가) 강제 이주령에 따라 ${result.fromName}→${result.toName}로 밀려났습니다.`);
  }

  function resumePlay() {
    if (state.winner) return endGame();
    state.phase = "playing";
    state.targeting = null;
    setStatus(`${state.turn === "white" ? "백" : "흑"} AI가 규칙과 카드 효과를 계산 중입니다.`);
    render();
    queueTurn(450);
  }

  function queueTurn(delay = 600) {
    clearTimeout(turnTimer);
    if (state.phase !== "playing" || state.paused || state.winner) return;
    turnTimer = setTimeout(runAiTurn, delay);
  }

  function runAiTurn() {
    if (state.phase !== "playing" || state.paused || state.winner) return;
    const color = state.turn;
    setStatus(`${color === "white" ? "백" : "흑"} AI가 가장 좋은 수를 찾고 있습니다…`);
    render();
    setTimeout(() => {
      if (state.phase !== "playing" || state.paused || state.winner) return;
      const started = performance.now();
      const choice = chooseBestAction(state, color);
      const action = choice.action;
      state.aiMilliseconds = performance.now() - started;
      state.aiSearch = choice.stats;
      if (!action) {
        state.winner = "draw";
        state.winReason = "움직일 수 있는 기물이 없어 무승부입니다.";
        endGame();
        return;
      }
      const report = executeAction(state, action);
      reportMove(report);
      const notes = state._notes || []; delete state._notes;
      notes.forEach((note) => addLog(note, true));
      if (state.winner) { endGame(); return; }
      if (state.moveCount >= MAX_PLIES) {
        const whiteScore = evaluate(state, "white");
        state.winner = whiteScore === 0 ? "draw" : whiteScore > 0 ? "white" : "black";
        state.winReason = "360수 제한에 도달해 전력 평가로 판정했습니다.";
        endGame();
        return;
      }
      if (state.moveCount % 20 === 0) offerCards(false);
      else {
        setStatus(`${state.turn === "white" ? "백" : "흑"} 차례입니다. 카드 규칙을 반영해 AI가 생각합니다.`);
        render();
        queueTurn(620);
      }
    }, 30);
  }

  function reportMove(report) {
    const last = report.events[report.events.length - 1];
    if (!last) return;
    const side = report.color === "white" ? "백" : "흑";
    const lines = report.events.map((event, index) => {
      if (event.scheduled) return event.message;
      const capture = event.target ? ` × ${KOREAN_TYPE[event.target.type]}` : "";
      const convert = event.transformed ? ` → ${KOREAN_TYPE[event.transformed]} 변신` : event.promotion ? " → 퀸 승급" : "";
      return `${index === 0 ? side : "↳"} ${KOREAN_TYPE[event.piece.type]} ${event.fromName}→${event.toName}${capture}${convert}`;
    });
    addLog(lines.join(" · "), Boolean(last.target || last.promotion || report.double));
  }

  function endGame() {
    clearTimeout(turnTimer);
    state.phase = "finished";
    state.paused = true;
    const winner = state.winner === "draw" ? "무승부" : state.winner === "white" ? "백 승리" : "흑 승리";
    addLog(`결과: ${winner} — ${state.winReason || "게임 종료"}`, true);
    setStatus(`${winner}. ${state.winReason || "새 게임을 시작할 수 있습니다."}`);
    render();
  }

  function startGame() {
    clearTimeout(turnTimer);
    effectSerial = 0;
    state = freshState();
    dom.start.textContent = "새 게임 시작";
    offerCards(true);
  }

  function addLog(message, important = false) {
    state.logs.unshift({ message, important });
    state.logs = state.logs.slice(0, 80);
  }

  function setStatus(message) { state.status = message; }

  function describeEffect(effect) {
    if (effect.kind === "delayedQueen") return `${effect.label} · ${Math.max(0, effect.dueAt - state.moveCount)}수 후`;
    if (typeof effect.remaining === "number") return `${effect.label} · ${effect.remaining}수`;
    return effect.label;
  }

  function renderCards(color) {
    const container = color === "white" ? dom.whiteCards : dom.blackCards;
    const hint = color === "white" ? dom.whiteHint : dom.blackHint;
    container.replaceChildren();
    const options = state.cardOptions?.[color];
    const selection = state.cardSelections?.[color];
    if (!options) {
      hint.textContent = "다음 배정은 20수 뒤에 도착합니다.";
      return;
    }
    const awaiting = state.phase === "cards" && selection === undefined;
    hint.textContent = awaiting ? "카드를 하나 고르거나 이번 배정을 스킵하세요." : selection ? `[${selection.title}] 확정. 대상은 AI가 가장 유리하게 지정합니다.` : selection === null ? "이번 카드 배정을 스킵했습니다." : "대국 중 — 다음 배정은 20수 뒤입니다.";
    for (const card of options) {
      const node = dom.template.content.firstElementChild.cloneNode(true);
      node.querySelector(".card-number").textContent = String(card.id).padStart(2, "0");
      node.querySelector("strong").textContent = card.title;
      node.querySelector("small").textContent = card.text;
      const selected = selection && selection.id === card.id;
      node.classList.toggle("selected", Boolean(selected));
      node.classList.toggle("unavailable", !awaiting && !selected);
      node.disabled = !awaiting;
      node.addEventListener("click", () => pickCard(color, card.id));
      container.append(node);
    }
    if (awaiting) {
      const skip = document.createElement("button");
      skip.className = "skip-card";
      skip.type = "button";
      skip.innerHTML = "<span>이번 배정 스킵</span><small>효과 없이 다음 자동 수로 넘어갑니다.</small>";
      skip.addEventListener("click", () => skipCard(color));
      container.append(skip);
    }
  }

  function renderEffects(color) {
    const container = color === "white" ? dom.whiteEffects : dom.blackEffects;
    container.replaceChildren();
    const effects = state.effects.filter((effect) => effect.owner === color);
    if (!effects.length) {
      const empty = document.createElement("span"); empty.className = "empty-chip"; empty.textContent = "없음"; container.append(empty); return;
    }
    for (const effect of effects) {
      const chip = document.createElement("span"); chip.className = "effect-chip"; chip.textContent = describeEffect(effect); container.append(chip);
    }
  }

  function renderBoard() {
    dom.board.replaceChildren();
    const last = state.lastAction || [];
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const cell = document.createElement("button");
        cell.type = "button"; cell.className = `square ${(x + y) % 2 ? "dark" : "light"}`;
        cell.setAttribute("role", "gridcell"); cell.setAttribute("aria-label", squareName(x, y));
        const piece = at(state, x, y);
        if (last.some((move) => move.from.x === x && move.from.y === y)) cell.classList.add("last-from");
        if (last.some((move) => move.to.x === x && move.to.y === y)) cell.classList.add("last-to");
        if (piece && isFrozen(state, piece)) cell.classList.add("frozen");
        if (piece) {
          const glyph = document.createElement("span"); glyph.className = `piece ${piece.color}`; glyph.textContent = GLYPHS[piece.type]; cell.append(glyph);
          if (isFrozen(state, piece)) { const ice = document.createElement("span"); ice.className = "frozen-mark"; ice.textContent = "✦"; cell.append(ice); }
          cell.title = `${piece.color === "white" ? "백" : "흑"} ${KOREAN_TYPE[piece.type]} · ${squareName(x, y)}`;
        }
        dom.board.append(cell);
      }
    }
  }

  function renderLog() {
    dom.log.replaceChildren();
    for (const entry of state.logs) {
      const item = document.createElement("li"); item.textContent = entry.message; if (entry.important) item.classList.add("important"); dom.log.append(item);
    }
  }

  function render() {
    renderBoard();
    renderCards("white"); renderCards("black");
    renderEffects("white"); renderEffects("black"); renderLog();
    dom.moveCount.textContent = state.moveCount;
    dom.turn.textContent = state.phase === "ready" ? "대기 중" : state.phase === "finished" ? "종료" : state.turn === "white" ? "백" : "흑";
    dom.phase.textContent = ({ ready: "READY ROOM", cards: "CARD DRAFT", targeting: "TARGET SELECT", playing: "AUTO BATTLE", finished: "MATCH OVER" })[state.phase];
    const stats = state.aiSearch;
    const searchInfo = stats ? ` · ${stats.depth}겹 · ${stats.nodes.toLocaleString()} 노드` : "";
    dom.aiNote.textContent = state.aiMilliseconds ? `직전 AI 계산 ${(state.aiMilliseconds / 1000).toFixed(2)}s / 최대 3.0s${searchInfo}` : state.phase === "cards" || state.phase === "targeting" ? "선택이 끝나면 자동 대국을 시작합니다." : "카드 규칙을 포함해 수를 탐색합니다.";
    dom.status.textContent = state.status || "준비됨";
    dom.pause.disabled = !["playing"].includes(state.phase);
    dom.pause.textContent = state.paused ? "계속하기" : "일시정지";
  }

  dom.start.addEventListener("click", startGame);
  dom.pause.addEventListener("click", () => {
    if (state.phase !== "playing") return;
    state.paused = !state.paused;
    if (state.paused) { clearTimeout(turnTimer); setStatus("대국을 일시정지했습니다."); }
    else { setStatus("대국을 재개합니다."); queueTurn(200); }
    render();
  });
  dom.clearLog.addEventListener("click", () => { state.logs = []; renderLog(); });
  render();
})();
