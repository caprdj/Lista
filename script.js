/* TABS */
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(btn=>{
      btn.addEventListener("click",()=>{
        const targetId=btn.getAttribute("data-tab");
        tabButtons.forEach(b=>b.classList.toggle("active",b===btn));
        tabPanels.forEach(p=>p.classList.toggle("active",p.id===targetId));
      });
    });
    

    /* ELEMENTOS GLOBAIS */
   // ===== ELEMENTOS DO CABEÇALHO =====
const daySelect = document.getElementById("daySelect");
const energyChips = document.getElementById("energyChips");
const contextChips = document.getElementById("contextChips");
const btnRestartCycle = document.getElementById("btnRestartCycle"); // 👈 AQUI

/* ===== MODAL GENÉRICO (reutilizado em alimentação + exercícios) ===== */

const genericEditModal = document.getElementById("genericEditModal");
const genericEditModalTitle = document.getElementById("genericEditModalTitle");
const genericEditName = document.getElementById("genericEditName");
const genericEditInstr = document.getElementById("genericEditInstr");
const genericEditCancel = document.getElementById("genericEditCancel");
const genericEditSave = document.getElementById("genericEditSave");

let currentGenericEdit = null; 
// { title, initialName, initialInstr, onSave }

function openGenericEditModal(config) {
  currentGenericEdit = config || null;
  genericEditModalTitle.textContent = config.title || "Editar";
  genericEditName.value = config.initialName || "";
  genericEditInstr.value = config.initialInstr || "";
  genericEditModal.classList.add("active");
  genericEditName.focus();
}

function closeGenericEditModal() {
  genericEditModal.classList.remove("active");
  currentGenericEdit = null;
}

// Eventos dos botões do modal genérico
if (genericEditCancel) {
  genericEditCancel.addEventListener("click", closeGenericEditModal);
}

if (genericEditSave) {
  genericEditSave.addEventListener("click", () => {
    if (!currentGenericEdit || typeof currentGenericEdit.onSave !== "function") {
      closeGenericEditModal();
      return;
    }

    const newName = genericEditName.value.trim();
    const newInstr = genericEditInstr.value.trim();

    if (!newName) {
      alert("Digite um nome antes de salvar.");
      return;
    }

    try {
      currentGenericEdit.onSave(newName, newInstr);
    } finally {
      closeGenericEditModal();
    }
  });
}

// Fecha ao clicar fora do conteúdo do modal
if (genericEditModal) {
  genericEditModal.addEventListener("click", (ev) => {
    if (ev.target === genericEditModal) {
      closeGenericEditModal();
    }
  });
}


/* ===== ESTADO GLOBAL E PERSISTÊNCIA ===== */

let state = {
  dayMeta: {},
  casaMeta: {},
  foodState: {},
  exState: {},
  exOptionsState: null, 
  domesticCustomTasks: {},
  domesticHiddenTasks: {},
  history: []
};

function persistState() {
  try {
    localStorage.setItem("rotina14_state_v2", JSON.stringify(state));
  } catch (e) {
    console.error("Erro ao salvar no localStorage", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem("rotina14_state_v2");
    if (!raw) {
      state = {
        dayMeta: {},
        casaMeta: {},
        foodState: {},
        exState: {},
        exOptionsState: null,
        domesticCustomTasks: {},
        domesticHiddenTasks: {},
        history: []
      };
      return;
    }
    const parsed = JSON.parse(raw);
    state.dayMeta = parsed.dayMeta || {};
    state.casaMeta = parsed.casaMeta || {};
    state.foodState = parsed.foodState || {};
    state.exState = parsed.exState || {};
    state.exOptionsState = parsed.exOptionsState || null;
    state.domesticCustomTasks = parsed.domesticCustomTasks || {};
    state.domesticHiddenTasks = parsed.domesticHiddenTasks || {};
    state.history = parsed.history || [];
  } catch (e) {
    console.error("Erro ao carregar do localStorage", e);
  }
}


/* ===== DIA / ENERGIA / CONTEXTO ===== */

function getSelectedDay() {
  if (!daySelect) return 1;
  return Number(daySelect.value) || 1;
}

function setSelectedDay(d) {
  if (!daySelect) return;
  daySelect.value = String(d);
}

function getDayMeta(day) {
  if (!state.dayMeta[day]) {
    state.dayMeta[day] = { energy: "m", ctx: "casa" };
  }
  return state.dayMeta[day];
}

function getDayEnergy(day) {
  return getDayMeta(day).energy;
}

function setDayEnergy(day, val) {
  getDayMeta(day).energy = val;
  persistState();
}

function getDayContext(day) {
  return getDayMeta(day).ctx;
}

function setDayContext(day, val) {
  getDayMeta(day).ctx = val;
  persistState();
}

function getEnergyMeta() {
  const d = getSelectedDay();
  return getDayEnergy(d);
}

function setEnergyMeta(val) {
  const d = getSelectedDay();
  setDayEnergy(d, val);
  renderAll();
}

function getContextMeta() {
  const d = getSelectedDay();
  return getDayContext(d);
}

function setContextMeta(val) {
  const d = getSelectedDay();
  setDayContext(d, val);
  renderAll();
}

function getWeekdayLabel(day) {
  const labels = {
    1: "QUI",
    2: "SEX",
    3: "SÁB",
    4: "DOM",
    5: "SEG",
    6: "TER",
    7: "QUA",
    8: "QUI",
    9: "SEX",
    10: "SÁB",
    11: "DOM",
    12: "SEG",
    13: "TER",
    14: "QUA"
  };
  return labels[day] || "DIA";
}

function restartCycle() {
  const confirmMsg = 
    "Reiniciar o ciclo?\n\n" +
    "• As marcações de Alimentação, Exercícios e Casa serão zeradas.\n" +
    "• O histórico do ciclo atual será armazenado.\n" +
    "• As tarefas personalizadas e configurações continuam salvas.";
  if (!confirm(confirmMsg)) return;

  const snapshot = {
    date: new Date().toISOString(),
    dayMeta: state.dayMeta,
    casaMeta: state.casaMeta,
    foodState: state.foodState,
    exState: state.exState,
  };
  state.history = state.history || [];
  state.history.push(snapshot);

  state.dayMeta = {};
  state.casaMeta = {};
  state.foodState = {};
  state.exState = {};

  persistState();
  setSelectedDay(1);
  renderAll();

  alert("Ciclo reiniciado! As marcações foram zeradas, mas o histórico ficou salvo.");
}

// Inicialização de dias (1–14) e chips
for (let i = 1; i <= 14; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = `Dia ${i} (${getWeekdayLabel(i)})`;
  daySelect.appendChild(opt);
}
daySelect.addEventListener("change", () => renderAll());

energyChips.addEventListener("click", e => {
  const btn = e.target.closest(".chip"); 
  if (!btn) return;
  const energy = btn.getAttribute("data-energy");
  setEnergyMeta(energy);
});

contextChips.addEventListener("click", e => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  const ctx = btn.getAttribute("data-context");
  setContextMeta(ctx);
});

if (btnRestartCycle) {
  btnRestartCycle.addEventListener("click", restartCycle);
}


// Alimentação
const foodContent = document.getElementById("foodContent");
const foodStats = document.getElementById("foodStats");
const badgeFoodDia = document.getElementById("badgeFoodDia");
const badgeFoodResumo = document.getElementById("badgeFoodResumo");

// Exercícios
const exerciseContent = document.getElementById("exerciseContent");
const statsContent = document.getElementById("statsContent");


// Casa
const domesticContent = document.getElementById("domesticContent");
const badgeCasaDia = document.getElementById("badgeCasaDia");
const badgeFlexCount = document.getElementById("badgeFlexCount");
const btnResetCasa = document.getElementById("btnResetCasa");
const btnDownloadExResumo = document.getElementById("btnDownloadExResumo");
const btnDownloadCycleHistory = document.getElementById("btnDownloadCycleHistory");

if (btnDownloadExResumo) {
  btnDownloadExResumo.addEventListener("click", downloadExerciseSummary);
}


// ===== FUNÇÕES BASE INTERNAS =====

function getFoodState(day) {
  if (!state.foodState[day]) {
    state.foodState[day] = {
      cafe: {
        done: false,
        notes: ""
      },
      lancheManha: {
        done: false,
        notes: ""
      },
      almoco: {
        done: false,
        notes: ""
      },
      lancheTarde: {
        done: false,
        notes: ""
      },
      jantar: {
        done: false,
        notes: ""
      },
      ceia: {
        done: false,
        notes: ""
      }
    };
  }
  return state.foodState[day];
}

function getExState(day) {
  if (!state.exState[day]) {
    state.exState[day] = { blocks: {} };
  }
  return state.exState[day];
}

function getCasaState(day) {
  if (!state.casaMeta[day]) {
    state.casaMeta[day] = { fixedDone: {}, flexDone: {}, notes: "" };
  }
  return state.casaMeta[day];
}

/* ====== MODELOS DE DADOS ===== */

const defaultExOptionsState = {
  "larga": {
    id: "larga",
    label: "Equipamentos Maiores (esteira, bola, elástico)",
    blocks: [{
      id: "d1_b1_pernas_core_esteira",
      title: "Dia 1 – Modelo B (Pernas + Core + Esteira)",
      equipment: ["esteira", "bola grande", "step"],
      isTreadmillDay: true,
      exercises: [
        {
          id: "ponte",
          name: "Ponte (simples ou completa)",
          energy: "m",
          instr: "Deitada de barriga para cima, joelhos dobrados e pés paralelos no chão (afastados na largura do quadril). Contraia levemente o abdome e glúteos, elevando o quadril até formar uma linha entre joelhos e ombros, sem forçar a lombar. Suba em 2 tempos, segure 1–2 segundos, desça devagar. Respiração fluida.",
        },
        {
          id: "agach_bola",
          name: "Agachamento com bola",
          energy: "a",
          instr: "Em pé, com a bola apoiada entre a lombar e a parede. Pés afastados na largura do quadril, levemente à frente. Desça flexionando joelhos sem deixar passar da linha dos pés, até um ponto confortável. Suba empurrando o chão. Postura ereta, abdome levemente contraído.",
        },
        {
          id: "step_up",
          name: "Step-up",
          energy: "a",
          instr: "Subir e descer do step com um pé de cada vez, mantendo o tronco alinhado. Evite jogar o corpo para frente; o movimento vem da perna que está no step.",
        },
        {
          id: "esteira",
          name: "Esteira 10–15 min",
          energy: "m",
          instr: "Iniciar em ritmo confortável, sem falta de ar. Pode alternar 1–2 minutos mais rápidos com 1–2 mais lentos se estiver bem.",
        }
      ]
    }]
  },
  "bola": {
    id: "bola",
    label: "Exercícios na bola",
    blocks: [{
      id: "d2_bola_core_postura",
      title: "Dia 2 – Estabilidade + Postura na Bola",
      equipment: ["bola grande"],
      isTreadmillDay: false,
      exercises: [
        {
          id: "sentar_bola_respirar",
          name: "Sentar na bola + respiração",
          energy: "b",
          instr: "Sentar na bola com pés bem apoiados no chão, joelhos ~90°. Inspirar pelo nariz contando até 4, soltar o ar pela boca contando até 6–8. Focar em soltar tensão dos ombros.",
        },
        {
          id: "bascula_pelve",
          name: "Báscula de pelve na bola",
          energy: "m",
          instr: "Ainda sentada na bola, inclinar levemente o quadril para frente e para trás (como se arredondasse e depois acentuasse a curvatura da lombar), sem forçar. Movimento pequeno, ritmado com a respiração.",
        }
      ]
    }]
  }
};

function getExOptionsState() {
  if (!state.exOptionsState) {
    state.exOptionsState = JSON.parse(JSON.stringify(defaultExOptionsState));
  }
  return state.exOptionsState;
}

function getDomesticCustomTasks(day, context) {
  const key = `${day}_${context}`;
  if (!state.domesticCustomTasks[key]) {
    state.domesticCustomTasks[key] = [];
  }
  return state.domesticCustomTasks[key];
}


function addDomesticCustomTask(day, context, task) {
  const arr = getDomesticCustomTasks(day, context);
  const newTask = {
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    label: task
  };
  arr.push(newTask);

  persistState();
  renderCasa();
}


function deleteDomesticCustomTask(day, context, taskId) {
  const key = `${day}_${context}`;
  const arr = getDomesticCustomTasks(day, context);
  const idx = arr.findIndex(t => t.id === taskId);
  if (idx !== -1) {
    arr.splice(idx, 1);
    persistState();
    renderCasa();
  }
}

function isCustomDomesticTask(taskId) {
  return String(taskId).startsWith("custom_");
}


function getDomesticHiddenTasksKey(day, context) {
  return `${day}_${context}`;
}
function getDomesticHiddenTasks(day, context) {
  const key = getDomesticHiddenTasksKey(day, context);
  if (!state.domesticHiddenTasks[key]) {
    state.domesticHiddenTasks[key] = {};
  }
  return state.domesticHiddenTasks[key];
}
function isDomesticTaskHidden(day, context, taskId) {
  const hiddenMap = getDomesticHiddenTasks(day, context);
  return !!hiddenMap[taskId];
}
function setDomesticTaskHidden(day, context, taskId, hidden) {
  const hiddenMap = getDomesticHiddenTasks(day, context);
  hiddenMap[taskId] = hidden;
  persistState();
}



/* ====== FUNÇÕES ESPECÍFICAS: ALIMENTAÇÃO ===== */

function renderFood() {
  if (!foodContent || !badgeFoodDia || !badgeFoodResumo || !foodStats) return;

  const day = getSelectedDay();
  const energy = getDayEnergy(day);
  const ctx = getDayContext(day);
  const dayFood = getFoodState(day);

  const weekday = getWeekdayLabel(day);
  const ctxLabel =
    ctx === "casa" ? "Casa" :
    ctx === "pais" ? "Casa dos pais" :
    ctx === "viagem" ? "Viagem" :
    ctx === "pausa" ? "Pausa" : "Contexto";

  badgeFoodDia.textContent = `${weekday} • Dia ${day} • ${ctxLabel}`;
  badgeFoodResumo.textContent =
    energy === "b" ? "Energia baixa – versão leve" :
    energy === "m" ? "Energia média – versão padrão" :
    "Energia alta – versão completa";

  const mealGroups = [
    {
      key: "cafe",
      title: "Café da manhã",
      suggestions: {
        b: "Opção leve (em dor): mingau de aveia com banana amassada ou iogurte com fruta macia.",
        m: "Opção padrão: pão integral com ovo mexido ou queijo + fruta.",
        a: "Opção reforçada: ovo mexido, pão integral, fruta + café ou chá."
      }
    },
    {
      key: "lancheManha",
      title: "Lanche da manhã",
      suggestions: {
        b: "Castanhas + fruta macia ou iogurte.",
        m: "Fruta inteira + mix de castanhas.",
        a: "Fruta + castanhas + um pedacinho de chocolate amargo, se desejar."
      }
    },
    {
      key: "almoco",
      title: "Almoço",
      suggestions: {
        b: "Prato simples: arroz, feijão, legume e uma proteína leve (ovo, frango desfiado).",
        m: "Prato completo: arroz, feijão, legumes variados e proteína.",
        a: "Prato mais reforçado, com legumes, salada crua e proteína em porção maior, se tolerado."
      }
    },
    {
      key: "lancheTarde",
      title: "Lanche da tarde",
      suggestions: {
        b: "Chá + torrada ou fruta macia.",
        m: "Iogurte + fruta ou sanduíche pequeno.",
        a: "Sanduíche integral + fruta ou vitamina."
      }
    },
    {
      key: "jantar",
      title: "Jantar",
      suggestions: {
        b: "Sopa leve ou omelete simples com legumes.",
        m: "Repetir estrutura do almoço em porção menor.",
        a: "Refeição mais completa, mas evitando excessos muito tarde."
      }
    },
    {
      key: "ceia",
      title: "Ceia",
      suggestions: {
        b: "Chá calmante (camomila, erva-doce) + fruta pequena.",
        m: "Iogurte ou leite morno + fruta.",
        a: "Ceia opcional: priorizar sono, evitar refeições pesadas."
      }
    }
  ];

  foodContent.innerHTML = "";

  mealGroups.forEach(group => {
    const mealKey = group.key;
    const mealData = dayFood[mealKey];
    const isDone = mealData.done;
    const notes = mealData.notes || "";
    const suggestion = group.suggestions[energy] || "";

    const card = document.createElement("div");
    card.className = "meal-card" + (isDone ? " done" : "");

    const header = document.createElement("div");
    header.className = "meal-header";

    const left = document.createElement("div");
    const titleEl = document.createElement("div");
    titleEl.className = "meal-title";
    titleEl.textContent = group.title;

    const suggestionEl = document.createElement("div");
    suggestionEl.className = "meal-suggestion";
    suggestionEl.textContent = suggestion;

    left.appendChild(titleEl);
    left.appendChild(suggestionEl);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    right.style.gap = "0.5rem";

    const doneLabel = document.createElement("span");
    doneLabel.className = "chip small";
    doneLabel.textContent = isDone ? "Feito" : "Pendente";

    const doneCheckbox = document.createElement("input");
    doneCheckbox.type = "checkbox";
    doneCheckbox.checked = isDone;
    doneCheckbox.addEventListener("change", () => {
      mealData.done = doneCheckbox.checked;
      persistState();
      renderFood();
    });

    right.appendChild(doneLabel);
    right.appendChild(doneCheckbox);

    header.appendChild(left);
    header.appendChild(right);

    const notesArea = document.createElement("textarea");
    notesArea.className = "meal-notes";
    notesArea.placeholder = "Anotações rápidas (ex.: comi fora, substituições, passei mal, etc.)";
    notesArea.value = notes;
    notesArea.addEventListener("input", () => {
      mealData.notes = notesArea.value;
      persistState();
    });

    card.appendChild(header);
    card.appendChild(notesArea);
    foodContent.appendChild(card);
  });

  renderFoodStats();
}

function renderFoodStats() {
  if (!foodStats) return;

  let totalMeals = 0;
  let doneMeals = 0;

  for (let day = 1; day <= 14; day++) {
    const dayFood = getFoodState(day);
    Object.keys(dayFood).forEach(mealKey => {
      totalMeals++;
      if (dayFood[mealKey].done) doneMeals++;
    });
  }

  const pct = totalMeals > 0 ? Math.round((doneMeals / totalMeals) * 100) : 0;

  foodStats.innerHTML = `
    <h3>Resumo do ciclo (Alimentação)</h3>
    <p>Total de refeições no ciclo: <strong>${totalMeals}</strong></p>
    <p>Refeições concluídas: <strong>${doneMeals}</strong></p>
    <p>Adesão aproximada: <strong>${pct}%</strong></p>
    <small>Lembrete: isso não é cobrança, é bússola. Pequenos passos consistentes contam muito.</small>
  `;
}


/* ====== EXERCÍCIOS ===== */

function renderExercises() {
  if (!exerciseContent || !statsContent) return;

  const day = getSelectedDay();
  const energy = getDayEnergy(day);

  const exerState = getExState(day);
  const exOptions = getExOptionsState();

  exerciseContent.innerHTML = "";

  const equipmentGroups = Object.values(exOptions);

  equipmentGroups.forEach(group => {
    const blockWrapper = document.createElement("div");
    blockWrapper.className = "exercise-block";

    const titleEl = document.createElement("h3");
    titleEl.textContent = group.label;
    blockWrapper.appendChild(titleEl);

    group.blocks.forEach(block => {
      const blockCard = document.createElement("div");
      blockCard.className = "exercise-block-card";

      const header = document.createElement("div");
      header.className = "exercise-block-header";

      const left = document.createElement("div");
      const blockTitle = document.createElement("div");
      blockTitle.className = "exercise-block-title";
      blockTitle.textContent = block.title;

      const equipEl = document.createElement("div");
      equipEl.className = "exercise-equip";
      equipEl.textContent = "Usar: " + (block.equipment || []).join(", ");

      left.appendChild(blockTitle);
      left.appendChild(equipEl);

      const right = document.createElement("div");
      right.className = "exercise-block-actions";

      const doneToggle = document.createElement("input");
      doneToggle.type = "checkbox";
      doneToggle.checked = !!(exerState.blocks[block.id]?.done);
      doneToggle.addEventListener("change", () => {
        if (!exerState.blocks[block.id]) {
          exerState.blocks[block.id] = { done: false, exDone: {} };
        }
        exerState.blocks[block.id].done = doneToggle.checked;
        persistState();
        renderExercises();
      });

      const doneLabel = document.createElement("span");
      doneLabel.className = "chip small";
      doneLabel.textContent = doneToggle.checked ? "Concluído" : "Pendente";

      right.appendChild(doneLabel);
      right.appendChild(doneToggle);

      header.appendChild(left);
      header.appendChild(right);

      const exList = document.createElement("div");
      exList.className = "exercise-list";

      block.exercises.forEach(ex => {
        if (energy === "b" && ex.energy === "a") {
          return;
        }
        if (energy === "m" && ex.energy === "a" && block.isTreadmillDay && ex.id === "esteira") {
          // ainda mantém esteira
        }

        const exRow = document.createElement("div");
        exRow.className = "exercise-row";

        const exLeft = document.createElement("div");
        exLeft.className = "exercise-main";

        const exName = document.createElement("div");
        exName.className = "exercise-name";
        exName.textContent = ex.name;

        const exInstr = document.createElement("div");
        exInstr.className = "exercise-instr";
        exInstr.textContent = ex.instr || "";

        exLeft.appendChild(exName);
        exLeft.appendChild(exInstr);

        const exRight = document.createElement("div");
        exRight.className = "exercise-actions";

        const exStateForBlock = (exerState.blocks[block.id]?.exDone) || {};
        const isExDone = !!exStateForBlock[ex.id];

        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.checked = isExDone;
        chk.addEventListener("change", () => {
          if (!exerState.blocks[block.id]) {
            exerState.blocks[block.id] = { done: false, exDone: {} };
          }
          if (!exerState.blocks[block.id].exDone) {
            exerState.blocks[block.id].exDone = {};
          }
          exerState.blocks[block.id].exDone[ex.id] = chk.checked;
          persistState();
          renderExercises();
        });

        exRight.appendChild(chk);

        const energyTag = document.createElement("span");
        energyTag.className = "chip tiny";
        energyTag.textContent =
          ex.energy === "b" ? "Baixa" :
          ex.energy === "m" ? "Média" :
          "Alta";
        exRight.appendChild(energyTag);

        exRow.appendChild(exLeft);
        exRow.appendChild(exRight);
        exList.appendChild(exRow);
      });

      blockCard.appendChild(header);
      blockCard.appendChild(exList);
      blockWrapper.appendChild(blockCard);
    });

    exerciseContent.appendChild(blockWrapper);
  });

  renderExerciseStats();
}

function renderExerciseStats() {
  if (!statsContent) return;

  let totalBlocks = 0;
  let blocksDone = 0;
  let totalExercises = 0;
  let totalExercisesDone = 0;
  let treadmillDays = 0;
  let treadmillDone = 0;

  const exOptions = getExOptionsState();

  for (let day = 1; day <= 14; day++) {
    const exDayState = getExState(day);
    const dayEnergy = getDayEnergy(day);

    Object.values(exOptions).forEach(group => {
      group.blocks.forEach(block => {
        const isTreadmill = !!block.isTreadmillDay;
        const dayBlock = exDayState.blocks[block.id] || { done: false, exDone: {} };

        totalBlocks++;
        if (dayBlock.done) blocksDone++;

        block.exercises.forEach(ex => {
          if (dayEnergy === "b" && ex.energy === "a") {
            return;
          }

          totalExercises++;
          if (dayBlock.exDone && dayBlock.exDone[ex.id]) {
            totalExercisesDone++;
          }

          if (isTreadmill && ex.id === "esteira") {
            treadmillDays++;
            if (dayBlock.exDone && dayBlock.exDone[ex.id]) {
              treadmillDone++;
            }
          }
        });
      });
    });
  }

  const pctBlocks = totalBlocks > 0 ? Math.round((blocksDone / totalBlocks) * 100) : 0;
  const pctEx = totalExercises > 0 ? Math.round((totalExercisesDone / totalExercises) * 100) : 0;
  const pctTreadmill = treadmillDays > 0 ? Math.round((treadmillDone / treadmillDays) * 100) : 0;

  statsContent.innerHTML = `
    <h3>Resumo do ciclo (Exercícios)</h3>
    <p>Blocos de treino concluídos: <strong>${blocksDone}/${totalBlocks}</strong> (${pctBlocks}%)</p>
    <p>Exercícios marcados como feitos: <strong>${totalExercisesDone}/${totalExercises}</strong> (${pctEx}%)</p>
    <p>Dias com esteira concluídos: <strong>${treadmillDone}/${treadmillDays}</strong> (${pctTreadmill}%)</p>
    <small>Não é para se culpar; é para enxergar padrões. Respeite seu corpo e ajuste a rotina conforme a fase.</small>
  `;
}


function downloadExerciseSummary() {
  let text = "RESUMO DE EXERCÍCIOS — CICLO 14 DIAS\n\n";

  for (let day = 1; day <= 14; day++) {
    const weekday = getWeekdayLabel(day);
    const energy = getDayEnergy(day);
    const ctx = getDayContext(day);

    const energyLabel =
      energy === "b" ? "Baixa" :
      energy === "m" ? "Média" : "Alta";

    const ctxLabel =
      ctx === "casa" ? "Casa" :
      ctx === "pais" ? "Casa dos pais" :
      ctx === "viagem" ? "Viagem" :
      ctx === "pausa" ? "Pausa" :
      "Contexto";

    text += `Dia ${day} (${weekday}) — Energia: ${energyLabel} — Contexto: ${ctxLabel}\n`;

    const exDayState = getExState(day);
    const exOptions = getExOptionsState();

    Object.values(exOptions).forEach(group => {
      group.blocks.forEach(block => {
        const dayBlock = exDayState.blocks[block.id] || { done: false, exDone: {} };
        const isDone = dayBlock.done ? "✅" : "⬜";
        text += `  ${isDone} ${block.title}\n`;

        block.exercises.forEach(ex => {
          const exVisible = !(energy === "b" && ex.energy === "a");
          if (!exVisible) return;
          const exMark = (dayBlock.exDone && dayBlock.exDone[ex.id]) ? "✔" : "-";
          text += `      ${exMark} ${ex.name}\n`;
        });
      });
    });

    text += "\n";
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "resumo_exercicios_ciclo_14_dias.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


/* ===== CASA (ROTINA DOMÉSTICA) ===== */

const domesticTasksByDay = {
  1: {
    fixed: [
      { id: "faxina_geral", label: "Faxina geral dos ambientes principais" },
      { id: "trocar_manta", label: "Trocar manta da sala" },
      { id: "trocar_esponja", label: "Trocar esponja + perfex + bate-mão + pano de prato" },
      { id: "repor_essencia", label: "Repor essência" },
      { id: "abrir_janelas", label: "Abrir janelas por 10 minutos" },
      { id: "superficies_essenciais", label: "Recolocar só o essencial nas superfícies" },
      { id: "louca_maquina", label: "Louça na máquina e ligar" },
      { id: "autocuidado_pausa", label: "Pausa de autocuidado (água + alongar 2 min)" }
    ],
    flex: [
      { id: "mercado_despensa", label: "Mercado (despensa)" },
      { id: "geladeira_prateleira", label: "Revisar 1 prateleira da geladeira (limpeza rápida)" },
      { id: "freezer_itens", label: "Verificar itens do freezer (entrou/saiu)" },
      { id: "pre_preparo_simples", label: "Pré-preparo simples (ex.: lavar e porcionar verduras)" }
    ]
  },
  2: {
    fixed: [
      { id: "revisar_tarefas", label: "Revisar o que ficou da faxina" },
      { id: "organizar_escritorio", label: "Organizar rapidamente o escritório" }
    ],
    flex: [
      { id: "planejar_semana", label: "Planejar a semana (limpeza, trabalho, alimentação)" }
    ]
  },
  3: {
    fixed: [],
    flex: []
  },
  4: {
    fixed: [],
    flex: []
  },
  5: {
    fixed: [
      { id: "check_plantas", label: "Verificar plantas (rega/adubação conforme ciclo)" },
      { id: "checar_banheiros", label: "Checar rapidamente os banheiros" }
    ],
    flex: [
      { id: "lavar_roupa", label: "Lavar 1 máquina de roupa se necessário" }
    ]
  },
  6: {
    fixed: [
      { id: "pano_dia_sim_nao", label: "Trocar pano de bate-mão (dia sim, dia não)" }
    ],
    flex: []
  },
  7: {
    fixed: [
      { id: "pano_dia_sim_nao_2", label: "Trocar pano de bate-mão (dia sim, dia não)" }
    ],
    flex: []
  },
  8: {
    fixed: [
      { id: "faxina_geral2", label: "Faxina geral dos ambientes principais (2ª quinzenal)" },
      { id: "trocar_manta2", label: "Trocar manta da sala (quinzenal)" },
      { id: "trocar_esponja2", label: "Trocar esponja + perfex + bate-mão + pano de prato (se necessário)" },
      { id: "repor_essencia2", label: "Repor essência (se necessário)" },
      { id: "abrir_janelas2", label: "Abrir janelas por 10 minutos" },
      { id: "superficies_essenciais2", label: "Recolocar só o essencial nas superfícies" },
      { id: "louca_maquina2", label: "Louça na máquina e ligar" }
    ],
    flex: [
      { id: "mercado_despensa2", label: "Mercado (reposição quinzenal)" }
    ]
  },
  9: {
    fixed: [
      { id: "revisar_tarefas2", label: "Revisar o que ficou da faxina" }
    ],
    flex: []
  },
  10: {
    fixed: [],
    flex: []
  },
  11: {
    fixed: [],
    flex: []
  },
  12: {
    fixed: [
      { id: "check_plantas2", label: "Verificar plantas (rega/adubação conforme ciclo)" }
    ],
    flex: []
  },
  13: {
    fixed: [],
    flex: []
  },
  14: {
    fixed: [],
    flex: []
  }
};

function getDomesticTemplate(day, context) {
  let tasks = domesticTasksByDay[day] || { fixed: [], flex: [] };

  if (context === "pausa") {
    return {
      fixed: [],
      flex: []
    };
  }

  return tasks;
}

if (btnResetCasa) {
  btnResetCasa.addEventListener("click", () => {
    if (!confirm("Zerar marcações da aba Casa para este dia?")) return;
    const day = getSelectedDay();
    state.casaMeta[day] = { fixedDone: {}, flexDone: {}, notes: "" };
    persistState();
    renderCasa();
  });
}

function renderCasa() {
  if (!domesticContent || !badgeCasaDia) return;

  const day = getSelectedDay();
  const ctx = getDayContext(day);
  const casaState = getCasaState(day);

  const weekday = getWeekdayLabel(day);
  const ctxLabel =
    ctx === "casa" ? "Casa" :
    ctx === "pais" ? "Casa dos pais" :
    ctx === "viagem" ? "Viagem" :
    "Pausa";

  badgeCasaDia.textContent = `${weekday} • Dia ${day} • ${ctxLabel}`;

  domesticContent.innerHTML = "";

  if (ctx === "pausa") {
    const msg = document.createElement("div");
    msg.className = "pause-message";
    msg.textContent = "Dia de pausa: o que você fizer é bônus. 💙";
    domesticContent.appendChild(msg);
    return;
  }

  const template = getDomesticTemplate(day, ctx);

  const customTasks = getDomesticCustomTasks(day, ctx);
  const hiddenTasks = getDomesticHiddenTasks(day, ctx);

  const mainBlock = document.createElement("div");
  mainBlock.className = "domestic-block";

  const groups = [
    { type: "fixed", label: "Indispensável", tasks: template.fixed },
    { type: "flex", label: "Desejável", tasks: template.flex },
    { type: "custom", label: "Personalizadas", tasks: customTasks }
  ];

  groups.forEach(group => {
    if (group.type === "custom" && group.tasks.length === 0) {
      const addBox = document.createElement("div");
      addBox.className = "domestic-add-box";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Adicionar tarefa personalizada...";

      const btnAdd = document.createElement("button");
      btnAdd.textContent = "+";
      btnAdd.className = "btn-small";

      btnAdd.addEventListener("click", () => {
        const val = input.value.trim();
        if (!val) return;
        addDomesticCustomTask(day, ctx, val);
        input.value = "";
      });

      addBox.appendChild(input);
      addBox.appendChild(btnAdd);
      mainBlock.appendChild(addBox);

      return;
    }

    const hasVisibleTasks = group.tasks.some(t => !hiddenTasks[t.id]);
    if (!hasVisibleTasks && group.type !== "custom") {
      return;
    }

    const section = document.createElement("section");
    section.className = "domestic-section";

    const header = document.createElement("div");
    header.className = "domestic-section-header";

    const title = document.createElement("h3");
    title.textContent = group.label;

    header.appendChild(title);
    section.appendChild(header);

    const list = document.createElement("div");
    list.className = "domestic-task-list";

    group.tasks.forEach(task => {
      if (hiddenTasks[task.id]) return;

      const row = document.createElement("div");
      row.className = "domestic-task-row";

      const left = document.createElement("div");
      left.className = "domestic-task-main";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";

      if (group.type === "fixed") {
        checkbox.checked = !!casaState.fixedDone[task.id];
        checkbox.addEventListener("change", () => {
          casaState.fixedDone[task.id] = checkbox.checked;
          persistState();
          renderCasaStats();
        });
      } else if (group.type === "flex") {
        checkbox.checked = !!casaState.flexDone[task.id];
        checkbox.addEventListener("change", () => {
          casaState.flexDone[task.id] = checkbox.checked;
          persistState();
          renderCasaStats();
        });
      } else {
        checkbox.checked = !!casaState.flexDone[task.id];
        checkbox.addEventListener("change", () => {
          casaState.flexDone[task.id] = checkbox.checked;
          persistState();
          renderCasaStats();
        });
      }

      const label = document.createElement("span");
      label.className = "domestic-task-label";
      label.textContent = task.label;

      left.appendChild(checkbox);
      left.appendChild(label);

      const right = document.createElement("div");
      right.className = "domestic-task-actions";

      const btnHide = document.createElement("button");
      btnHide.textContent = "🗑";
      btnHide.title = isCustomDomesticTask(task.id)
        ? "Excluir tarefa personalizada"
        : "Ocultar tarefa fixa neste dia";

      btnHide.className = "btn-icon";

      btnHide.addEventListener("click", () => {
        onDeleteOrHideDomesticTask(day, ctx, group.type, task.id);
      });

      right.appendChild(btnHide);

      row.appendChild(left);
      row.appendChild(right);

      list.appendChild(row);
    });

    if (group.type === "custom" && group.tasks.length > 0) {
      const addBox = document.createElement("div");
      addBox.className = "domestic-add-box";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Adicionar nova tarefa personalizada...";

      const btnAdd = document.createElement("button");
      btnAdd.textContent = "+";
      btnAdd.className = "btn-small";

      btnAdd.addEventListener("click", () => {
        const val = input.value.trim();
        if (!val) return;
        addDomesticCustomTask(day, ctx, val);
        input.value = "";
      });

      addBox.appendChild(input);
      addBox.appendChild(btnAdd);
      list.appendChild(addBox);
    }

    section.appendChild(list);
    mainBlock.appendChild(section);
  });

  const notesBox = document.createElement("div");
  notesBox.className = "domestic-notes-box";

  const notesLabel = document.createElement("div");
  notesLabel.textContent = "Observações do dia (Casa)";

  const notesArea = document.createElement("textarea");
  notesArea.placeholder =
    "Use este espaço para anotar imprevistos, visitas, 'fugi para a casa dos pais', dores, etc.";
  notesArea.value = casaState.notes || "";
  notesArea.addEventListener("input", () => {
    casaState.notes = notesArea.value;
    persistState();
  });

  notesBox.appendChild(notesLabel);
  notesBox.appendChild(notesArea);

  mainBlock.appendChild(notesBox);
  domesticContent.appendChild(mainBlock);

  renderCasaStats();
}

function onDeleteOrHideDomesticTask(day, ctx, tipo, taskId) {
  if (isCustomDomesticTask(taskId)) {
    const confirmMsg = "Excluir definitivamente esta tarefa personalizada?";
    if (!confirm(confirmMsg)) return;
    deleteDomesticCustomTask(day, ctx, taskId);
  } else {
    const confirmMsg =
      "Ocultar esta tarefa fixa apenas neste dia do ciclo?\n\n" +
      "Ela continuará existindo em outros dias em que aparece.";
    if (!confirm(confirmMsg)) return;
    setDomesticTaskHidden(day, ctx, taskId, true);
    renderCasa();
  }
}

function renderCasaStats() {
  if (!badgeFlexCount) return;

  let totalFixed = 0;
  let doneFixed = 0;
  let totalFlex = 0;
  let doneFlex = 0;

  for (let day = 1; day <= 14; day++) {
    const casaState = getCasaState(day);
    const ctx = getDayContext(day);

    const template = getDomesticTemplate(day, ctx);
    const hidden = getDomesticHiddenTasks(day, ctx);
    const customTasks = getDomesticCustomTasks(day, ctx);

    template.fixed.forEach(task => {
      if (hidden[task.id]) return;
      totalFixed++;
      if (casaState.fixedDone[task.id]) doneFixed++;
    });

    template.flex.forEach(task => {
      if (hidden[task.id]) return;
      totalFlex++;
      if (casaState.flexDone[task.id]) doneFlex++;
    });

    customTasks.forEach(task => {
      if (hidden[task.id]) return;
      totalFlex++;
      if (casaState.flexDone[task.id]) doneFlex++;
    });
  }

  badgeFlexCount.textContent =
    `Fixas: ${doneFixed}/${totalFixed} • Flex/Personalizadas: ${doneFlex}/${totalFlex}`;
}


/* ===== HISTÓRICO DO CICLO ===== */

function downloadCycleHistory() {
  const history = state.history || [];
  let text = "HISTÓRICO DE CICLOS — ROTINA 14 DIAS\n\n";

  if (history.length === 0) {
    text += "Ainda não há ciclos anteriores salvos.\n";
  } else {
    history.forEach((cycle, index) => {
      text += `Ciclo ${index + 1} — salvo em ${new Date(cycle.date).toLocaleString("pt-BR")}\n`;

      for (let day = 1; day <= 14; day++) {
        const weekday = getWeekdayLabel(day);
        const dayMeta = cycle.dayMeta?.[day] || { energy: "m", ctx: "casa" };
        const casaMeta = cycle.casaMeta?.[day] || { fixedDone: {}, flexDone: {}, notes: "" };

        const energyLabel =
          dayMeta.energy === "b" ? "Baixa" :
          dayMeta.energy === "m" ? "Média" : "Alta";

        const ctxLabel =
          dayMeta.ctx === "casa" ? "Casa" :
          dayMeta.ctx === "pais" ? "Casa dos pais" :
          dayMeta.ctx === "viagem" ? "Viagem" :
          dayMeta.ctx === "pausa" ? "Pausa" :
          "Contexto";

        text += `  Dia ${day} (${weekday}) — Energia: ${energyLabel}, Contexto: ${ctxLabel}\n`;

        const anyFixed = Object.keys(casaMeta.fixedDone).some(k => casaMeta.fixedDone[k]);
        const anyFlex = Object.keys(casaMeta.flexDone).some(k => casaMeta.flexDone[k]);

        text += `    Casa — tarefas fixas concluídas? ${anyFixed ? "Sim" : "Não"}; flexíveis/personalizadas? ${anyFlex ? "Sim" : "Não"}\n`;
        if (casaMeta.notes) {
          text += `    Notas: ${casaMeta.notes}\n`;
        }
      }

      text += "\n";
    });
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "historico_ciclos_rotina_14_dias.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

if (btnDownloadCycleHistory) {
  btnDownloadCycleHistory.addEventListener("click", downloadCycleHistory);
}


// ====== RENDER GERAL ======

function renderAll() {
  renderFood();
  renderExercises();
  renderCasa();
}

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  renderAll();
});