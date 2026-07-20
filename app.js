const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

const panels = ["welcomePanel", "datePanel", "timePanel", "matchPanel", "planPanel", "notifyPanel"];
const progressMap = {
  welcomePanel: "15%",
  datePanel: "31%",
  timePanel: "47%",
  matchPanel: "66%",
  planPanel: "84%",
  notifyPanel: "100%"
};

const headers = {
  welcomePanel: ["锦书初启", "云中锦书"],
  datePanel: ["择日", "愿择良辰，与我相见"],
  timePanel: ["择时", "愿把哪段时光留给我"],
  matchPanel: ["添事", "为相逢添些欢喜"],
  planPanel: ["成约", "此约已成"],
  notifyPanel: ["封笺", "将此意寄出"]
};

const periods = [
  { id: "breakfast", label: "晨粥同席", copy: "愿与你共用早饭", range: "7:00-9:00", start: "07:00", end: "09:00" },
  { id: "morning", label: "朝光同行", copy: "愿与你度过清晨之后的好时光", range: "9:00-12:00", start: "09:00", end: "12:00" },
  { id: "lunch", label: "午膳相候", copy: "愿与你共赴一顿午饭", range: "12:00-14:00", start: "12:00", end: "14:00" },
  { id: "afternoon", label: "午后闲游", copy: "愿与你消磨一段午后", range: "14:00-18:00", start: "14:00", end: "18:00" },
  { id: "dinner", label: "暮食同尝", copy: "愿与你共用傍晚这一餐", range: "18:00-20:00", start: "18:00", end: "20:00" },
  { id: "night", label: "灯下相伴", copy: "愿与你共度夜色初上", range: "20:00-23:00", start: "20:00", end: "23:00" }
];

const baseActivities = [
  { id: "shopping", title: "闲逛小街", copy: "一起逛街，看看小店与人间烟火。" },
  { id: "movie", title: "同看一影", copy: "看一场电影，把余味留给散场后的路。" },
  { id: "boardgame", title: "桌游小局", copy: "玩桌游，轻松热闹，也不怕冷场。" },
  { id: "chat", title: "茶边闲话", copy: "找一处安静地方，好好聊天。" },
  { id: "feast", title: "同赴盛馔", copy: "吃一顿好些的大餐，把欢喜慢慢吃出来。" },
  { id: "walk", title: "河畔散步", copy: "慢慢走一段路，让话自然说出来。" },
  { id: "dessert", title: "甜点收尾", copy: "用一点甜，给这次见面收个漂亮尾。" },
  { id: "other", title: "另添雅事", copy: "写下你真正想一起做的事。" }
];

const declineTexts = [
  "可愿再思量片刻？",
  "你真忍心如此推却么？",
  "你若不答，我便当你默许了"
];

const state = {
  panel: "welcomePanel",
  calendarYear: 2026,
  calendarMonth: 7,
  selectedDate: "",
  selectedPeriods: [],
  activePeriod: "",
  matches: {},
  customActivities: [],
  declineCount: 0
};

const el = {
  intro: document.getElementById("intro"),
  stepLabel: document.getElementById("stepLabel"),
  pageTitle: document.getElementById("pageTitle"),
  progressBar: document.getElementById("progressBar"),
  backButton: document.getElementById("backButton"),
  restartButton: document.getElementById("restartButton"),
  declineButton: document.getElementById("declineButton"),
  yearSelect: document.getElementById("yearSelect"),
  monthSelect: document.getElementById("monthSelect"),
  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  calendarGrid: document.getElementById("calendarGrid"),
  dateNext: document.getElementById("dateNext"),
  periodGrid: document.getElementById("periodGrid"),
  periodNext: document.getElementById("periodNext"),
  matchPeriods: document.getElementById("matchPeriods"),
  activityChoices: document.getElementById("activityChoices"),
  matchNext: document.getElementById("matchNext"),
  summaryDate: document.getElementById("summaryDate"),
  timeline: document.getElementById("timeline"),
  inviteText: document.getElementById("inviteText"),
  confirmInvite: document.getElementById("confirmInvite"),
  confirmNext: document.getElementById("confirmNext"),
  selfNotice: document.getElementById("selfNotice"),
  otherDialog: document.getElementById("otherDialog"),
  otherInput: document.getElementById("otherInput"),
  saveOther: document.getElementById("saveOther"),
  toast: document.getElementById("toast")
};

setTimeout(() => {
  el.intro?.remove();
}, 3600);

function setPanel(panelId) {
  state.panel = panelId;
  panels.forEach((id) => document.getElementById(id).classList.toggle("active", id === panelId));
  el.stepLabel.textContent = headers[panelId][0];
  el.pageTitle.textContent = headers[panelId][1];
  el.progressBar.style.width = progressMap[panelId];
  el.backButton.style.visibility = panelId === "welcomePanel" ? "hidden" : "visible";
  if (panelId === "planPanel") renderPlan();
  if (panelId === "notifyPanel") renderNotice();
}

function showToast(text) {
  el.toast.textContent = text;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("show"), 1800);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function formatDate(key) {
  if (!key) return "";
  const [year, month, day] = key.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function initCalendarControls() {
  for (let year = MIN_YEAR; year <= MAX_YEAR; year += 1) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `${year}年`;
    el.yearSelect.appendChild(option);
  }
  for (let month = 1; month <= 12; month += 1) {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = `${month}月`;
    el.monthSelect.appendChild(option);
  }
}

function renderCalendar() {
  el.yearSelect.value = state.calendarYear;
  el.monthSelect.value = state.calendarMonth;
  el.calendarGrid.innerHTML = "";

  const first = new Date(state.calendarYear, state.calendarMonth - 1, 1);
  const daysInMonth = new Date(state.calendarYear, state.calendarMonth, 0).getDate();
  const offset = (first.getDay() + 6) % 7;

  for (let i = 0; i < offset; i += 1) {
    const blank = document.createElement("button");
    blank.className = "day-button blank";
    blank.type = "button";
    blank.tabIndex = -1;
    el.calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = dateKey(state.calendarYear, state.calendarMonth, day);
    const button = document.createElement("button");
    button.className = "day-button";
    button.classList.toggle("selected", key === state.selectedDate);
    button.type = "button";
    button.textContent = day;
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", key === state.selectedDate ? "true" : "false");
    button.addEventListener("click", () => {
      state.selectedDate = key;
      el.dateNext.disabled = false;
      renderCalendar();
    });
    el.calendarGrid.appendChild(button);
  }
}

function shiftMonth(delta) {
  let year = state.calendarYear;
  let month = state.calendarMonth + delta;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  if (month > 12) {
    month = 1;
    year += 1;
  }
  if (year < MIN_YEAR || year > MAX_YEAR) return;
  state.calendarYear = year;
  state.calendarMonth = month;
  renderCalendar();
}

function renderPeriods() {
  el.periodGrid.innerHTML = "";
  periods.forEach((period) => {
    const selected = state.selectedPeriods.includes(period.id);
    const button = document.createElement("button");
    button.className = "period-card";
    button.classList.toggle("selected", selected);
    button.type = "button";
    button.innerHTML = `<strong>${period.label}</strong><span>${period.copy}<br>${period.range}</span>`;
    button.addEventListener("click", () => {
      if (selected) {
        state.selectedPeriods = state.selectedPeriods.filter((id) => id !== period.id);
        delete state.matches[period.id];
      } else {
        state.selectedPeriods.push(period.id);
        state.matches[period.id] = state.matches[period.id] || [];
      }
      if (!state.selectedPeriods.includes(state.activePeriod)) {
        state.activePeriod = state.selectedPeriods[0] || "";
      }
      el.periodNext.disabled = state.selectedPeriods.length === 0;
      renderPeriods();
    });
    el.periodGrid.appendChild(button);
  });
}

function allActivities() {
  return [...baseActivities, ...state.customActivities];
}

function activityName(id) {
  return allActivities().find((item) => item.id === id)?.title || "";
}

function renderMatcher() {
  if (!state.activePeriod) state.activePeriod = state.selectedPeriods[0] || "";
  el.matchPeriods.innerHTML = "";
  state.selectedPeriods.forEach((id) => {
    const period = periods.find((item) => item.id === id);
    const button = document.createElement("button");
    button.className = "period-tab";
    button.classList.toggle("active", state.activePeriod === id);
    button.type = "button";
    const periodFontSize = Math.max(15, 25 - (state.selectedPeriods.length - 1) * 1.8);
    button.style.setProperty("--period-font-size", `${periodFontSize}px`);
    button.innerHTML = `<span>${period.label}<br><small>${period.range}</small></span>`;
    button.addEventListener("click", () => {
      state.activePeriod = id;
      renderMatcher();
    });
    el.matchPeriods.appendChild(button);
  });

  const selectedActivities = state.matches[state.activePeriod] || [];
  el.activityChoices.innerHTML = "";
  allActivities().forEach((activity) => {
    const selected = selectedActivities.includes(activity.id);
    const button = document.createElement("button");
    button.className = "activity-card";
    button.classList.toggle("selected", selected);
    button.type = "button";
    button.innerHTML = `<strong>${activity.title}</strong><span>${activity.copy}</span>`;
    button.addEventListener("click", () => {
      if (activity.id === "other") {
        el.otherInput.value = "";
        el.otherDialog.showModal();
        return;
      }
      toggleActivity(activity.id);
    });
    el.activityChoices.appendChild(button);
  });

  el.matchNext.disabled = !state.selectedPeriods.some((id) => (state.matches[id] || []).length > 0);
}

function toggleActivity(activityId) {
  const list = state.matches[state.activePeriod] || [];
  state.matches[state.activePeriod] = list.includes(activityId)
    ? list.filter((id) => id !== activityId)
    : [...list, activityId];
  renderMatcher();
}

function renderPlan() {
  const rows = state.selectedPeriods.map((periodId) => {
    const period = periods.find((item) => item.id === periodId);
    const names = (state.matches[periodId] || []).map(activityName).filter(Boolean);
    return { period, names: names.length ? names : ["随心而行"] };
  });

  el.summaryDate.textContent = `${formatDate(state.selectedDate)}，一纸相约`;
  el.timeline.innerHTML = rows.map(({ period, names }) => `
    <article class="time-card">
      <strong>${period.label}<br>${period.range}</strong>
      <p>${names.join("、")}</p>
    </article>
  `).join("");

  const activitySummary = rows.map(({ period, names }) => `${period.label}，同去${names.join("、")}`).join("；");
  el.inviteText.textContent = `盼于${formatDate(state.selectedDate)}，乘兴而来，共赴此约。${activitySummary}。

待到相见，便可剪烛西窗，细数别后悲欢；或并肩闲坐，慢诉浮生种种。花径已扫，蓬门待启，只等故人脚步。万勿辜负此番相见，免教望穿秋水。

纸短情长，不尽欲言。临书依依，翘首以待。`;
  el.confirmInvite.checked = false;
  el.confirmNext.disabled = true;
}

function countActivities() {
  return state.selectedPeriods.reduce((sum, id) => sum + (state.matches[id] || []).length, 0);
}

function buildInviteText() {
  return el.inviteText.textContent || "";
}

function buildSelfMemo() {
  const plans = state.selectedPeriods.map((id) => {
    const period = periods.find((item) => item.id === id);
    const names = (state.matches[id] || []).map(activityName).filter(Boolean).join("、") || "随心而行";
    return `${period.label}（${period.range}）：${names}`;
  }).join("\n");
  return `约会备忘\n日期：${formatDate(state.selectedDate)}\n${plans}\n\n给对方的话：${buildInviteText()}\n\n给自己的提醒：这封信已写到末尾，心里却还留着许多未尽的话。记得提前看好路线，也记得带上一点从容和欢喜，等那一日真真相见。`;
}

function renderNotice() {
  el.selfNotice.textContent = `这封信已经写好：${formatDate(state.selectedDate)}，${state.selectedPeriods.length}段时光，${countActivities()}件小事都已安放妥帖。可以先复制邀约正文寄给对方，再留一份备忘给自己。愿这一番心意，真能换来那一日相见。`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("已收入剪贴板");
  } catch {
    showToast("复制受限，可手动选中文字");
  }
}

async function browserNotify() {
  if (!("Notification" in window)) {
    showToast("当前浏览器不支持通知");
    return;
  }
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") {
    showToast("未获得通知权限");
    return;
  }
  new Notification("锦书已成", {
    body: `${formatDate(state.selectedDate)}的约会已备好，记得把邀约寄出。`
  });
  showToast("已给你一声提醒");
}

function restart() {
  state.panel = "welcomePanel";
  state.selectedDate = "";
  state.selectedPeriods = [];
  state.activePeriod = "";
  state.matches = {};
  state.customActivities = [];
  state.declineCount = 0;
  el.declineButton.textContent = "今夕未便，且容我婉拒";
  el.dateNext.disabled = true;
  el.periodNext.disabled = true;
  el.matchNext.disabled = true;
  renderCalendar();
  renderPeriods();
  setPanel("welcomePanel");
}

function goBack() {
  const index = panels.indexOf(state.panel);
  if (index > 0) setPanel(panels[index - 1]);
}

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "accept") setPanel("datePanel");
  if (action === "decline") {
    if (state.declineCount < declineTexts.length) {
      el.declineButton.textContent = declineTexts[state.declineCount];
      state.declineCount += 1;
    } else {
      setPanel("datePanel");
    }
  }
  if (action === "dateNext") setPanel("timePanel");
  if (action === "periodNext") {
    renderMatcher();
    setPanel("matchPanel");
  }
  if (action === "matchNext") setPanel("planPanel");
  if (action === "confirmNext") setPanel("notifyPanel");
  if (action === "copyInvite") copyText(buildInviteText());
  if (action === "copySelf") copyText(buildSelfMemo());
  if (action === "browserNotify") browserNotify();
  if (action === "restart") restart();
});

el.backButton.addEventListener("click", goBack);
el.restartButton.addEventListener("click", restart);
el.prevMonth.addEventListener("click", () => shiftMonth(-1));
el.nextMonth.addEventListener("click", () => shiftMonth(1));
el.yearSelect.addEventListener("change", () => {
  state.calendarYear = Number(el.yearSelect.value);
  renderCalendar();
});
el.monthSelect.addEventListener("change", () => {
  state.calendarMonth = Number(el.monthSelect.value);
  renderCalendar();
});
el.confirmInvite.addEventListener("change", () => {
  el.confirmNext.disabled = !el.confirmInvite.checked;
});
el.saveOther.addEventListener("click", () => {
  const value = el.otherInput.value.trim();
  if (!value) {
    showToast("先写下一件想做的事");
    return;
  }
  const id = `custom-${Date.now()}`;
  state.customActivities.push({ id, title: value, copy: "你亲手写下的安排。" });
  el.otherDialog.close();
  toggleActivity(id);
});

initCalendarControls();
renderCalendar();
renderPeriods();
setPanel("welcomePanel");
