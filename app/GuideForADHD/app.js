(function () {
  const STORAGE_KEY = "eisenhower_pairwise_v1";

  const state = {
    tasks: [],
    rankings: {
      urgency: [],
      importance: [],
    },
    nextId: 1,
    questionsAsked: 0,
  };

  const ui = {
    seedInput: document.getElementById("seedInput"),
    startRankingBtn: document.getElementById("startRankingBtn"),
    resetBtn: document.getElementById("resetBtn"),
    newTaskInput: document.getElementById("newTaskInput"),
    addTaskBtn: document.getElementById("addTaskBtn"),
    adjustTaskSelect: document.getElementById("adjustTaskSelect"),
    adjustUrgency: document.getElementById("adjustUrgency"),
    adjustImportance: document.getElementById("adjustImportance"),
    rerankBtn: document.getElementById("rerankBtn"),
    deleteCompletedBtn: document.getElementById("deleteCompletedBtn"),
    questionCard: document.getElementById("questionCard"),
    questionPrompt: document.getElementById("questionPrompt"),
    chooseLeftBtn: document.getElementById("chooseLeftBtn"),
    chooseRightBtn: document.getElementById("chooseRightBtn"),
    chooseTieBtn: document.getElementById("chooseTieBtn"),
    matrixCanvas: document.getElementById("matrixCanvas"),
    taskTableBody: document.getElementById("taskTableBody"),
    statusBadge: document.getElementById("statusBadge"),
    questionCount: document.getElementById("questionCount"),
    exportBtn: document.getElementById("exportBtn"),
    downloadBtn: document.getElementById("downloadBtn"),
    importFileInput: document.getElementById("importFileInput"),
    importFileBtn: document.getElementById("importFileBtn"),
    importTextBtn: document.getElementById("importTextBtn"),
    jsonArea: document.getElementById("jsonArea"),
  };

  let busy = false;
  let pendingComparison = null;
  const operationQueue = [];

  function sampleSeedText() {
    return [
      "보고서 작성",
      "홍길동 고객님 문제 해결",
      "자기계발 일본어 학습",
      "건강관리",
      "머리핀 새로 사기",
      "SNS확인",
      "이메일 정리",
    ].join("\n");
  }

  function createTask(text) {
    return {
      id: state.nextId++,
      text: text.trim(),
      done: false,
      urgencyScore: 50,
      importanceScore: 50,
    };
  }

  function getTaskById(id) {
    return state.tasks.find((task) => task.id === id) || null;
  }

  function setStatus(message, isWarning) {
    ui.statusBadge.textContent = message;
    ui.statusBadge.style.color = isWarning ? "#b91c1c" : "#1e3a8a";
  }

  function setBusy(isBusy, label) {
    busy = isBusy;
    setStatus(label || (busy ? "작업 중" : "대기 중"), false);
    const disable = busy;

    [
      ui.startRankingBtn,
      ui.resetBtn,
      ui.newTaskInput,
      ui.addTaskBtn,
      ui.adjustTaskSelect,
      ui.adjustUrgency,
      ui.adjustImportance,
      ui.rerankBtn,
      ui.deleteCompletedBtn,
      ui.exportBtn,
      ui.downloadBtn,
      ui.importFileInput,
      ui.importFileBtn,
      ui.importTextBtn,
      ui.seedInput,
      ui.jsonArea,
    ].forEach((el) => {
      el.disabled = disable;
    });

    ui.chooseLeftBtn.disabled = !pendingComparison;
    ui.chooseRightBtn.disabled = !pendingComparison;
    ui.chooseTieBtn.disabled = !pendingComparison;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exportStateObject()));
    } catch (error) {
      console.error("상태 저장 실패", error);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        ui.seedInput.value = sampleSeedText();
        return;
      }

      const parsed = JSON.parse(raw);
      importStateObject(parsed, true);
    } catch (error) {
      console.error("상태 로딩 실패", error);
      ui.seedInput.value = sampleSeedText();
    }
  }

  function clearPendingComparison(defaultDecision) {
    if (!pendingComparison) {
      return;
    }

    const resolver = pendingComparison.resolve;
    pendingComparison = null;
    ui.questionCard.hidden = true;
    ui.chooseLeftBtn.disabled = true;
    ui.chooseRightBtn.disabled = true;
    ui.chooseTieBtn.disabled = true;

    if (resolver) {
      resolver(defaultDecision || "tie");
    }
  }

  function enqueueOperation(label, fn) {
    operationQueue.push({ label, fn });
    void processQueue();
  }

  async function processQueue() {
    if (busy) {
      return;
    }

    while (operationQueue.length) {
      const current = operationQueue.shift();
      setBusy(true, current.label || "작업 중");

      try {
        await current.fn();
        normalizeRankings();
        recomputeScoresFromRankings();
        saveState();
      } catch (error) {
        console.error(error);
        setStatus("오류가 발생했습니다. 콘솔을 확인하세요.", true);
      }

      renderAll();
    }

    setBusy(false, "대기 중");
    renderAll();
  }

  function normalizeRankings() {
    const ids = new Set(state.tasks.map((task) => task.id));

    ["urgency", "importance"].forEach((metric) => {
      const seen = new Set();
      const cleaned = [];
      for (const id of state.rankings[metric]) {
        if (ids.has(id) && !seen.has(id)) {
          cleaned.push(id);
          seen.add(id);
        }
      }

      const scoreField = metric === "urgency" ? "urgencyScore" : "importanceScore";
      const missing = state.tasks
        .filter((task) => !seen.has(task.id))
        .sort((a, b) => b[scoreField] - a[scoreField])
        .map((task) => task.id);

      state.rankings[metric] = cleaned.concat(missing);
    });
  }

  function recomputeScoresFromRankings() {
    ["urgency", "importance"].forEach((metric) => {
      const scoreField = metric === "urgency" ? "urgencyScore" : "importanceScore";
      const ranking = state.rankings[metric];
      const n = ranking.length;
      ranking.forEach((id, index) => {
        const task = getTaskById(id);
        if (!task) {
          return;
        }

        task[scoreField] = n <= 1 ? 100 : Math.round((1 - index / (n - 1)) * 100);
      });
    });
  }

  function resortRankingFromScores(metric) {
    const scoreField = metric === "urgency" ? "urgencyScore" : "importanceScore";
    state.rankings[metric] = state.tasks
      .slice()
      .sort((a, b) => b[scoreField] - a[scoreField] || a.id - b.id)
      .map((task) => task.id);
  }

  async function askComparison(metric, leftId, rightId) {
    const left = getTaskById(leftId);
    const right = getTaskById(rightId);

    if (!left || !right) {
      return "tie";
    }

    return new Promise((resolve) => {
      pendingComparison = {
        metric,
        leftId,
        rightId,
        resolve,
      };

      const qText =
        metric === "urgency"
          ? `이 중 뭐가 더 급한가요?`
          : `이 중 뭐가 더 중요한가요?`;

      ui.questionPrompt.textContent = qText;
      ui.chooseLeftBtn.textContent = `"${left.text}"`;
      ui.chooseRightBtn.textContent = `"${right.text}"`;
      ui.questionCard.hidden = false;
      ui.chooseLeftBtn.disabled = false;
      ui.chooseRightBtn.disabled = false;
      ui.chooseTieBtn.disabled = false;
    });
  }

  function answerComparison(winner) {
    if (!pendingComparison) {
      return;
    }

    const resolver = pendingComparison.resolve;
    pendingComparison = null;
    state.questionsAsked += 1;
    ui.questionCard.hidden = true;
    ui.chooseLeftBtn.disabled = true;
    ui.chooseRightBtn.disabled = true;
    ui.chooseTieBtn.disabled = true;
    ui.questionCount.textContent = `질문 ${state.questionsAsked}회`;

    if (resolver) {
      resolver(winner);
    }
  }

  async function insertTaskIntoMetric(taskId, metric) {
    const ranking = state.rankings[metric];
    if (ranking.includes(taskId)) {
      ranking.splice(ranking.indexOf(taskId), 1);
    }

    if (!ranking.length) {
      ranking.push(taskId);
      return;
    }

    let low = 0;
    let high = ranking.length;

    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      const opponentId = ranking[mid];
      const result = await askComparison(metric, taskId, opponentId);

      if (result === "left") {
        high = mid;
      } else if (result === "right") {
        low = mid + 1;
      } else {
        low = mid + 1;
        high = mid + 1;
      }
    }

    ranking.splice(low, 0, taskId);
  }

  async function rerankTask(taskId, metrics) {
    for (const metric of metrics) {
      await insertTaskIntoMetric(taskId, metric);
    }
  }

  function exportStateObject() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      nextId: state.nextId,
      questionsAsked: state.questionsAsked,
      tasks: state.tasks.map((task) => ({
        id: task.id,
        text: task.text,
        done: !!task.done,
        urgencyScore: Number(task.urgencyScore) || 0,
        importanceScore: Number(task.importanceScore) || 0,
      })),
      rankings: {
        urgency: state.rankings.urgency.slice(),
        importance: state.rankings.importance.slice(),
      },
    };
  }

  function importStateObject(obj, silent) {
    if (!obj || typeof obj !== "object" || !Array.isArray(obj.tasks)) {
      throw new Error("유효한 JSON 구조가 아닙니다.");
    }

    clearPendingComparison("tie");
    operationQueue.length = 0;

    state.tasks = obj.tasks
      .map((task) => ({
        id: Number(task.id),
        text: String(task.text || "").trim(),
        done: !!task.done,
        urgencyScore: Number(task.urgencyScore),
        importanceScore: Number(task.importanceScore),
      }))
      .filter((task) => Number.isFinite(task.id) && task.text.length > 0)
      .map((task) => ({
        ...task,
        urgencyScore: Number.isFinite(task.urgencyScore) ? clamp(task.urgencyScore, 0, 100) : 50,
        importanceScore: Number.isFinite(task.importanceScore) ? clamp(task.importanceScore, 0, 100) : 50,
      }));

    const maxId = state.tasks.reduce((max, task) => Math.max(max, task.id), 0);
    state.nextId = Math.max(Number(obj.nextId) || 1, maxId + 1);
    state.questionsAsked = Number(obj.questionsAsked) || 0;

    state.rankings = {
      urgency: Array.isArray(obj.rankings?.urgency)
        ? obj.rankings.urgency.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        : [],
      importance: Array.isArray(obj.rankings?.importance)
        ? obj.rankings.importance.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        : [],
    };

    if (!state.rankings.urgency.length) {
      resortRankingFromScores("urgency");
    }
    if (!state.rankings.importance.length) {
      resortRankingFromScores("importance");
    }

    normalizeRankings();
    recomputeScoresFromRankings();
    saveState();

    if (!silent) {
      setStatus("JSON을 불러왔습니다.", false);
    }

    renderAll();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function resetAll() {
    clearPendingComparison("tie");
    operationQueue.length = 0;

    state.tasks = [];
    state.rankings.urgency = [];
    state.rankings.importance = [];
    state.nextId = 1;
    state.questionsAsked = 0;

    ui.seedInput.value = sampleSeedText();
    ui.newTaskInput.value = "";
    ui.jsonArea.value = "";

    saveState();
    renderAll();
    setStatus("초기화 완료", false);
  }

  function parseLines(text) {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  function startInitialRanking() {
    if (busy) {
      return;
    }

    const lines = parseLines(ui.seedInput.value);
    if (!lines.length) {
      setStatus("초기 항목을 먼저 입력해주세요.", true);
      return;
    }

    clearPendingComparison("tie");
    operationQueue.length = 0;

    state.tasks = [];
    state.rankings.urgency = [];
    state.rankings.importance = [];
    state.nextId = 1;
    state.questionsAsked = 0;

    for (const line of lines) {
      state.tasks.push(createTask(line));
    }

    const taskIds = state.tasks.map((task) => task.id);

    enqueueOperation("초기 분류 진행 중", async () => {
      for (const id of taskIds) {
        await insertTaskIntoMetric(id, "urgency");
      }

      for (const id of taskIds) {
        await insertTaskIntoMetric(id, "importance");
      }
    });

    renderAll();
  }

  function addNewTask() {
    if (busy) {
      return;
    }

    const text = ui.newTaskInput.value.trim();
    if (!text) {
      setStatus("새 항목 텍스트를 입력해주세요.", true);
      return;
    }

    const task = createTask(text);
    state.tasks.push(task);
    ui.newTaskInput.value = "";

    enqueueOperation(`새 항목 분류 중: ${task.text}`, async () => {
      await insertTaskIntoMetric(task.id, "urgency");
      await insertTaskIntoMetric(task.id, "importance");
    });

    renderAll();
  }

  function rerankSelectedTask() {
    if (busy) {
      return;
    }

    const id = Number(ui.adjustTaskSelect.value);
    const task = getTaskById(id);
    if (!task) {
      setStatus("재배치할 항목을 선택해주세요.", true);
      return;
    }

    const metrics = [];
    if (ui.adjustUrgency.checked) {
      metrics.push("urgency");
    }
    if (ui.adjustImportance.checked) {
      metrics.push("importance");
    }

    if (!metrics.length) {
      setStatus("응급도/중요도 중 최소 하나를 선택해주세요.", true);
      return;
    }

    enqueueOperation(`재배치 진행 중: ${task.text}`, async () => {
      await rerankTask(id, metrics);
    });

    renderAll();
  }

  function deleteCompletedTasks() {
    if (busy) {
      return;
    }

    const before = state.tasks.length;
    state.tasks = state.tasks.filter((task) => !task.done);

    const ids = new Set(state.tasks.map((task) => task.id));
    state.rankings.urgency = state.rankings.urgency.filter((id) => ids.has(id));
    state.rankings.importance = state.rankings.importance.filter((id) => ids.has(id));

    normalizeRankings();
    recomputeScoresFromRankings();
    saveState();
    renderAll();

    const deleted = before - state.tasks.length;
    setStatus(`완료 항목 ${deleted}개 삭제`, false);
  }

  function deleteSingleTask(taskId) {
    if (busy) {
      return;
    }

    state.tasks = state.tasks.filter((task) => task.id !== taskId);
    state.rankings.urgency = state.rankings.urgency.filter((id) => id !== taskId);
    state.rankings.importance = state.rankings.importance.filter((id) => id !== taskId);
    normalizeRankings();
    recomputeScoresFromRankings();
    saveState();
    renderAll();
  }

  function exportJsonToText() {
    ui.jsonArea.value = JSON.stringify(exportStateObject(), null, 2);
    setStatus("JSON 생성 완료", false);
  }

  function downloadJson() {
    const payload = JSON.stringify(exportStateObject(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `eisenhower-matrix-${dateTag}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("JSON 파일 다운로드 시작", false);
  }

  function importJsonFromText() {
    if (busy) {
      return;
    }

    const text = ui.jsonArea.value.trim();
    if (!text) {
      setStatus("JSON 텍스트를 입력해주세요.", true);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      importStateObject(parsed, false);
    } catch (error) {
      setStatus(`JSON 파싱 실패: ${error.message}`, true);
    }
  }

  function importJsonFromFile() {
    if (busy) {
      return;
    }

    const file = ui.importFileInput.files && ui.importFileInput.files[0];
    if (!file) {
      setStatus("불러올 JSON 파일을 선택해주세요.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = String(event.target.result || "");
        ui.jsonArea.value = text;
        const parsed = JSON.parse(text);
        importStateObject(parsed, false);
      } catch (error) {
        setStatus(`파일 로딩 실패: ${error.message}`, true);
      }
    };

    reader.onerror = () => {
      setStatus("파일 읽기 중 오류가 발생했습니다.", true);
    };

    reader.readAsText(file, "utf-8");
  }

  function handleTableInteraction(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const row = target.closest("tr");
    if (!row) {
      return;
    }

    const id = Number(row.dataset.taskId);
    const task = getTaskById(id);
    if (!task) {
      return;
    }

    if (target.matches("input[type='checkbox'][data-role='done']")) {
      task.done = target.checked;
      saveState();
      renderAll();
      return;
    }

    if (target.matches("button[data-role='delete']")) {
      deleteSingleTask(id);
      return;
    }

    if (target.matches("button[data-role='rerank']")) {
      enqueueOperation(`재배치 진행 중: ${task.text}`, async () => {
        await rerankTask(task.id, ["urgency", "importance"]);
      });
      renderAll();
      return;
    }

    if (target.matches("input[type='range'][data-metric='urgency']")) {
      task.urgencyScore = clamp(Number(target.value), 0, 100);
      resortRankingFromScores("urgency");
      saveState();
      renderAll();
      return;
    }

    if (target.matches("input[type='range'][data-metric='importance']")) {
      task.importanceScore = clamp(Number(target.value), 0, 100);
      resortRankingFromScores("importance");
      saveState();
      renderAll();
      return;
    }
  }

  function renderAdjustSelect() {
    const current = Number(ui.adjustTaskSelect.value);
    ui.adjustTaskSelect.innerHTML = "";

    if (!state.tasks.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "항목 없음";
      ui.adjustTaskSelect.appendChild(option);
      return;
    }

    for (const task of state.tasks) {
      const option = document.createElement("option");
      option.value = String(task.id);
      option.textContent = task.text;
      if (task.id === current) {
        option.selected = true;
      }
      ui.adjustTaskSelect.appendChild(option);
    }
  }

  function renderTaskTable() {
    if (!state.tasks.length) {
      ui.taskTableBody.innerHTML = `
        <tr>
          <td colspan="5">항목이 없습니다. 먼저 초기 항목을 입력하세요.</td>
        </tr>
      `;
      return;
    }

    const rows = state.tasks
      .slice()
      .sort((a, b) => b.urgencyScore + b.importanceScore - (a.urgencyScore + a.importanceScore))
      .map((task) => {
        const taskClass = task.done ? "task-text done" : "task-text";
        return `
          <tr data-task-id="${task.id}">
            <td><input type="checkbox" data-role="done" ${task.done ? "checked" : ""} /></td>
            <td><span class="${taskClass}">${escapeHtml(task.text)}</span></td>
            <td>
              <div class="slider-wrap">
                <span class="score">${Math.round(task.importanceScore)}</span>
                <input type="range" min="0" max="100" step="1" value="${Math.round(task.importanceScore)}" data-metric="importance" />
              </div>
            </td>
            <td>
              <div class="slider-wrap">
                <span class="score">${Math.round(task.urgencyScore)}</span>
                <input type="range" min="0" max="100" step="1" value="${Math.round(task.urgencyScore)}" data-metric="urgency" />
              </div>
            </td>
            <td>
              <div class="item-actions">
                <button data-role="rerank">재비교</button>
                <button data-role="delete">삭제</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    ui.taskTableBody.innerHTML = rows;
  }

  function renderAll() {
    ui.questionCount.textContent = `질문 ${state.questionsAsked}회`;
    renderAdjustSelect();
    renderTaskTable();
    drawChart();

    if (!pendingComparison) {
      ui.questionCard.hidden = true;
      ui.chooseLeftBtn.disabled = true;
      ui.chooseRightBtn.disabled = true;
      ui.chooseTieBtn.disabled = true;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function drawChart() {
    const canvas = ui.matrixCanvas;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(700, Math.floor(rect.width * dpr));
    canvas.height = Math.floor((rect.width * 0.58 + 80) * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.scale(dpr, dpr);
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const padX = 70;
    const padY = 42;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "#f8fafc");
    bg.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#d1dbe6";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i += 1) {
      const x = padX + (plotW * i) / 4;
      const y = padY + (plotH * i) / 4;

      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, padY + plotH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(padX + plotW, y);
      ctx.stroke();
    }

    const centerX = padX + plotW / 2;
    const centerY = padY + plotH / 2;

    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(centerX, padY);
    ctx.lineTo(centerX, padY + plotH);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padX, centerY);
    ctx.lineTo(padX + plotW, centerY);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "12px 'Noto Sans KR', 'Malgun Gothic', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("중요+긴급", centerX + 8, padY + 16);
    ctx.fillText("긴급-덜중요", centerX + 8, centerY + 16);
    ctx.textAlign = "right";
    ctx.fillText("중요+덜긴급", centerX - 8, padY + 16);
    ctx.fillText("덜중요+덜긴급", centerX - 8, centerY + 16);

    ctx.textAlign = "center";
    ctx.fillStyle = "#1e3a8a";
    ctx.fillText("중요도", width / 2, height - 10);

    ctx.save();
    ctx.translate(14, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("응급도", 0, 0);
    ctx.restore();

    for (const task of state.tasks) {
      const x = padX + (clamp(task.importanceScore, 0, 100) / 100) * plotW;
      const y = padY + ((100 - clamp(task.urgencyScore, 0, 100)) / 100) * plotH;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = task.done ? "#94a3b8" : "#0f766e";
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = task.done ? "#64748b" : "#0f172a";
      ctx.textAlign = "left";
      ctx.font = "12px 'Noto Sans KR', 'Malgun Gothic', sans-serif";

      const label = task.text.length > 18 ? `${task.text.slice(0, 18)}...` : task.text;
      ctx.fillText(label, x + 8, y - 8);
    }
  }

  function attachEvents() {
    ui.startRankingBtn.addEventListener("click", startInitialRanking);
    ui.resetBtn.addEventListener("click", resetAll);
    ui.addTaskBtn.addEventListener("click", addNewTask);
    ui.rerankBtn.addEventListener("click", rerankSelectedTask);
    ui.deleteCompletedBtn.addEventListener("click", deleteCompletedTasks);

    ui.chooseLeftBtn.addEventListener("click", () => answerComparison("left"));
    ui.chooseRightBtn.addEventListener("click", () => answerComparison("right"));
    ui.chooseTieBtn.addEventListener("click", () => answerComparison("tie"));

    ui.exportBtn.addEventListener("click", exportJsonToText);
    ui.downloadBtn.addEventListener("click", downloadJson);
    ui.importTextBtn.addEventListener("click", importJsonFromText);
    ui.importFileBtn.addEventListener("click", importJsonFromFile);

    ui.newTaskInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addNewTask();
      }
    });

    ui.taskTableBody.addEventListener("click", handleTableInteraction);
    ui.taskTableBody.addEventListener("input", handleTableInteraction);

    window.addEventListener("resize", () => drawChart());
  }

  function boot() {
    attachEvents();
    loadState();
    normalizeRankings();
    recomputeScoresFromRankings();
    setBusy(false, "대기 중");
    renderAll();
  }

  boot();
})();
