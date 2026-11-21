(function () {
  "use strict";

  const DATA_KEY = "daily-fall-risk-demo-v1";
  const NURSE_KEY = "daily-fall-risk-demo-nurse-account-v2";
  const MAX_PATIENTS = 50;
  const CARE_STEPS = [
    "Bed in lowest position",
    "Call bell within reach",
    "Non-slip footwear",
    "Fall-risk sign at the bed",
    "Patient and family told about fall risk"
  ];
  const ROSTER = [
    { id: "p1", ward: "Demo Ward", bed: "D01", name: "Mina Example", hn: "HN000001" },
    { id: "p2", ward: "Demo Ward", bed: "D02", name: "Arun Sample", hn: "HN000002" },
    { id: "p3", ward: "Demo Ward", bed: "D03", name: "Niran Fiction", hn: "HN000003" },
    { id: "p4", ward: "Demo Ward", bed: "D04", name: "Mali Demo", hn: "HN000004" },
    { id: "p5", ward: "Demo Ward", bed: "D05", name: "Kiet Mock", hn: "HN000005" },
    ...Array.from({ length: 15 }, (_, index) => {
      const number = index + 6;
      const suffix = String(number).padStart(2, "0");
      return { id: `p${number}`, ward: "Demo Ward", bed: `D${suffix}`, name: `Demo Patient ${suffix}`, hn: `HN${String(number).padStart(6, "0")}` };
    })
  ];
  const NURSE_ACCOUNTS = {
    "mali.demo": "Nurse Mali Demo",
    "arun.sample": "Nurse Arun Sample",
    "ploy.fiction": "Nurse Ploy Fiction"
  };
  const DEMO_RISK_PROFILES = [
    ["R1"], ["R2", "R5"], ["R3", "R7"], ["R1", "R6", "R7"],
    ["R4", "R7"], ["R5"], ["R6"], ["R4", "R6", "R7"], ["R5", "R7"],
    ["R7"], ["R7"], ["R7"],
    [], [], []
  ];
  const DEMO_NURSES = ["Nurse Mali Demo", "Nurse Arun Sample", "Nurse Ploy Fiction"];
  const WARD_BEDS = Array.from({ length: MAX_PATIENTS }, (_, index) => `D${String(index + 1).padStart(2, "0")}`);

  const today = dateKey(new Date());
  const app = document;
  const isAssessmentPage = Boolean(app.getElementById("assessment-form"));
  const isBoardPage = Boolean(app.getElementById("board-rows"));

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function displayDate(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  function earlierToday(minutesAgo) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutesAgo);
    return date.toISOString();
  }

  function makeRandomizedDemoAssessments(patients) {
    const profiles = DEMO_RISK_PROFILES.slice();
    for (let index = profiles.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [profiles[index], profiles[swapIndex]] = [profiles[swapIndex], profiles[index]];
    }
    return patients.map((patient, index) => {
      const factors = profiles[index % profiles.length];
      return {
        id: `demo-${patient.id}`,
        patientId: patient.id,
        date: today,
        factors,
        careSteps: [index % CARE_STEPS.length, (index + 2) % CARE_STEPS.length],
        level: calculateRisk(factors),
        nurse: DEMO_NURSES[index % DEMO_NURSES.length],
        timestamp: earlierToday(120 - index * 3)
      };
    });
  }

  function makeDemoData() {
    return {
      patients: ROSTER,
      assessments: [
        { id: "demo-a1", patientId: "p1", date: today, factors: ["R2", "R5"], careSteps: [0, 1], level: "high", nurse: "Nurse Mali Demo", timestamp: earlierToday(76) },
        { id: "demo-a2", patientId: "p2", date: today, factors: [], careSteps: [1], level: "none", nurse: "Nurse Arun Sample", timestamp: earlierToday(64) },
        { id: "demo-a3", patientId: "p4", date: today, factors: ["R4", "R7"], careSteps: [0, 2], level: "moderate", nurse: "Nurse Ploy Fiction", timestamp: earlierToday(51) },
        { id: "demo-a4", patientId: "p5", date: today, factors: ["R7"], careSteps: [1, 3], level: "low", nurse: "Nurse Mali Demo", timestamp: earlierToday(36) },
        ...makeRandomizedDemoAssessments(ROSTER.slice(5))
      ]
    };
  }

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(DATA_KEY));
      if (saved && Array.isArray(saved.patients) && Array.isArray(saved.assessments)) {
        const storedById = new Map(saved.patients.map((patient) => [patient.id, patient]));
        const demoIds = new Set(ROSTER.map((patient) => patient.id));
        const newDemoPatients = ROSTER.filter((patient) => !storedById.has(patient.id));
        const patients = [
          ...ROSTER.map((patient) => ({ ...(storedById.get(patient.id) || patient), hn: patient.hn })),
          ...saved.patients.filter((patient) => !demoIds.has(patient.id)).map((patient) => {
            const oldDemoHN = /^DEMO-(\d{4})$/i.exec(String(patient.hn || ""));
            return oldDemoHN ? { ...patient, hn: `HN${oldDemoHN[1].padStart(6, "0")}` } : patient;
          })
        ];
        const assessments = saved.assessments.concat(makeRandomizedDemoAssessments(newDemoPatients));
        if (newDemoPatients.length) saveData({ ...saved, patients, assessments });
        return { ...saved, patients, assessments };
      }
    } catch (_) { /* Start with fictional sample data if local storage is unavailable or invalid. */ }
    const fresh = makeDemoData();
    saveData(fresh);
    return fresh;
  }

  function saveData(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getPatient(data, id) {
    return data.patients.find((patient) => patient.id === id);
  }

  function getTodayAssessments(data, patientId) {
    return data.assessments
      .filter((assessment) => assessment.date === today && (!patientId || assessment.patientId === patientId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function makeInitials(name) {
    return name.split(" ").slice(0, 2).map((part) => part.charAt(0)).join("").toUpperCase();
  }

  function addRiskOptions() {
    const form = app.getElementById("assessment-form");
    if (!form) return;
    const careContainer = app.getElementById("care-options");
    CARE_STEPS.forEach((step, index) => {
      const label = app.createElement("label");
      label.className = "care-row";
      const input = app.createElement("input");
      input.type = "checkbox";
      input.name = "care";
      input.value = String(index);
      const box = app.createElement("span");
      box.className = "check-box";
      box.setAttribute("aria-hidden", "true");
      const text = app.createElement("span");
      text.textContent = step;
      label.append(input, box, text);
      careContainer.append(label);
    });
  }

  function riskTitle(level) {
    return level.charAt(0).toUpperCase() + level.slice(1);
  }

  function makeRiskBadge(level, label) {
    const badge = app.createElement("span");
    badge.className = `risk-badge ${level}`;
    const dot = app.createElement("span");
    dot.className = "risk-dot";
    dot.setAttribute("aria-hidden", "true");
    const text = app.createElement("span");
    text.textContent = label || riskTitle(level);
    badge.append(dot, text);
    return badge;
  }

  function initAssessmentPage() {
    const loginPanel = app.getElementById("login-panel");
    const assessmentView = app.getElementById("assessment-view");
    const data = loadData();
    const loginForm = app.getElementById("login-form");
    const nurseSelect = app.getElementById("nurse-account");
    const patientSelect = app.getElementById("patient-select");
    const form = app.getElementById("assessment-form");
    const message = app.getElementById("form-message");

    addRiskOptions();
    data.patients.forEach((patient) => {
      const option = app.createElement("option");
      option.value = patient.id;
      option.textContent = `${patient.bed} · ${patient.name}`;
      patientSelect.append(option);
    });
    app.getElementById("assessment-date").textContent = displayDate(today);

    function showSession(nurse) {
      loginPanel.hidden = Boolean(nurse);
      assessmentView.hidden = !nurse;
      if (nurse) app.getElementById("signed-in-name").textContent = nurse;
      app.getElementById("form-nurse-name").value = nurse || "";
    }

    showSession(localStorage.getItem(NURSE_KEY));

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const nurseName = NURSE_ACCOUNTS[nurseSelect.value];
      if (!nurseName) return;
      localStorage.setItem(NURSE_KEY, nurseName);
      showSession(nurseName);
    });

    app.getElementById("sign-out").addEventListener("click", () => {
      localStorage.removeItem(NURSE_KEY);
      showSession("");
    });

    function updatePatient() {
      const patient = getPatient(data, patientSelect.value);
      const details = app.getElementById("patient-details");
      const historyWrap = app.getElementById("history-wrap");
      details.hidden = !patient;
      historyWrap.hidden = !patient;
      app.getElementById("patient-error").hidden = true;
      if (!patient) return;
      app.getElementById("patient-initials").textContent = makeInitials(patient.name);
      app.getElementById("patient-full-name").textContent = patient.name;
      app.getElementById("patient-bed").textContent = `${patient.ward} · Bed ${patient.bed}`;
      app.getElementById("patient-hn").textContent = patient.hn;
      updateHistory(patient.id);
    }

    function updateHistory(patientId) {
      const entries = getTodayAssessments(loadData(), patientId);
      const list = app.getElementById("history-list");
      list.replaceChildren();
      app.getElementById("history-count").textContent = `${entries.length} saved`;
      if (!entries.length) {
        const item = app.createElement("li");
        item.className = "history-empty";
        item.textContent = "No assessment saved today yet.";
        list.append(item);
        return;
      }
      entries.forEach((entry) => {
        const item = app.createElement("li");
        const who = app.createElement("span");
        who.textContent = `${formatTime(entry.timestamp)} · ${entry.nurse}`;
        item.append(who, makeRiskBadge(entry.level));
        list.append(item);
      });
    }

    function updatePatientRoster() {
      const selectedId = patientSelect.value;
      const currentData = loadData();
      patientSelect.replaceChildren();
      const prompt = app.createElement("option");
      prompt.value = "";
      prompt.textContent = "Select a patient";
      patientSelect.append(prompt);
      currentData.patients.forEach((patient) => {
        const option = app.createElement("option");
        option.value = patient.id;
        option.textContent = `${patient.bed} · ${patient.name}`;
        patientSelect.append(option);
      });
      patientSelect.value = selectedId;
      data.patients = currentData.patients;
      if (selectedId) updatePatient();
    }

    patientSelect.addEventListener("change", updatePatient);

    form.querySelectorAll('input[name="risk"]').forEach((input) => {
      input.addEventListener("change", () => {
        const selected = Array.from(form.querySelectorAll('input[name="risk"]:checked')).map((item) => item.value);
        const level = calculateRisk(selected);
        app.getElementById("risk-badge").className = `risk-badge ${level}`;
        app.getElementById("risk-label").textContent = riskTitle(level);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      message.textContent = "";
      const patient = getPatient(loadData(), patientSelect.value);
      if (!patient) {
        app.getElementById("patient-error").hidden = false;
        patientSelect.focus();
        return;
      }

      const nurse = localStorage.getItem(NURSE_KEY);
      const factors = Array.from(form.querySelectorAll('input[name="risk"]:checked')).map((item) => item.value);
      const careSteps = Array.from(form.querySelectorAll('input[name="care"]:checked')).map((item) => Number(item.value));
      const timestamp = new Date().toISOString();
      const assessment = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientId: patient.id,
        date: today,
        factors,
        careSteps,
        level: calculateRisk(factors),
        nurse,
        timestamp
      };
      const current = loadData();
      current.assessments.push(assessment);
      const stored = saveData(current);
      updateHistory(patient.id);
      message.textContent = stored
        ? `Assessment saved for ${patient.name} at ${formatTime(timestamp)}. Earlier assessments are kept.`
        : "This browser could not save the assessment. Check available device storage and try again.";
      message.className = `form-message ${stored ? "message-success" : "message-error"}`;
      if (stored) {
        form.querySelectorAll('input[name="risk"], input[name="care"]').forEach((input) => { input.checked = false; });
        app.getElementById("risk-badge").className = "risk-badge none";
        app.getElementById("risk-label").textContent = "None";
      }
    });

    window.addEventListener("storage", (event) => {
      if (event.key === DATA_KEY) updatePatientRoster();
    });
  }

  function initBoardPage() {
    const dateHeading = app.getElementById("board-date");
    dateHeading.textContent = displayDate(today);
    const addForm = app.getElementById("add-patient-form");
    const bedSelect = app.getElementById("new-patient-bed");
    const addMessage = app.getElementById("add-patient-message");

    function updateEmptyBeds(data) {
      const previousBed = bedSelect.value;
      const occupied = new Set(data.patients.map((patient) => patient.bed));
      bedSelect.replaceChildren();
      const prompt = app.createElement("option");
      prompt.value = "";
      prompt.textContent = data.patients.length >= MAX_PATIENTS ? `Demo roster limit reached (${MAX_PATIENTS} patients)` : "Choose an empty bed";
      bedSelect.append(prompt);
      WARD_BEDS.filter((bed) => !occupied.has(bed)).forEach((bed) => {
        const option = app.createElement("option");
        option.value = bed;
        option.textContent = bed;
        bedSelect.append(option);
      });
      if (previousBed && !occupied.has(previousBed)) bedSelect.value = previousBed;
      if (data.patients.length >= MAX_PATIENTS) {
        bedSelect.disabled = true;
      } else if (!bedSelect.options.length || bedSelect.options.length === 1) {
        prompt.textContent = "No empty beds available";
        bedSelect.disabled = true;
      } else {
        bedSelect.disabled = false;
      }
      addForm.querySelector("button[type='submit']").disabled = bedSelect.disabled;
    }

    updateEmptyBeds(loadData());

    addForm.addEventListener("submit", (event) => {
      event.preventDefault();
      addMessage.textContent = "";
      const name = app.getElementById("new-patient-name").value.trim();
      const hn = app.getElementById("new-patient-hn").value.trim().toUpperCase();
      const bed = bedSelect.value;
      const current = loadData();
      if (current.patients.length >= MAX_PATIENTS) {
        addMessage.textContent = `The demo ward can hold up to ${MAX_PATIENTS} patients.`;
        addMessage.className = "form-message message-error";
        updateEmptyBeds(current);
        return;
      }
      if (!/^HN[0-9]{6}$/.test(hn)) {
        addMessage.textContent = "Hospital number must be HN followed by exactly six digits, for example HN000021.";
        addMessage.className = "form-message message-error";
        app.getElementById("new-patient-hn").focus();
        return;
      }
      if (!name || !hn || !bed || current.patients.some((patient) => patient.bed === bed)) {
        addMessage.textContent = "Enter a made-up name and HN, then choose a currently empty bed.";
        addMessage.className = "form-message message-error";
        updateEmptyBeds(current);
        return;
      }

      const patient = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ward: "Demo Ward",
        bed,
        name,
        hn
      };
      current.patients.push(patient);
      if (!saveData(current)) {
        addMessage.textContent = "This browser could not save the patient. Check available device storage and try again.";
        addMessage.className = "form-message message-error";
        return;
      }

      addForm.reset();
      renderBoard();
      updateEmptyBeds(current);
      addMessage.textContent = `${patient.name} added at ${patient.bed} as Not assessed yet. The patient is now on the nurse assessment list.`;
      addMessage.className = "form-message message-success";
    });

    function renderBoard() {
      const data = loadData();
      updateEmptyBeds(data);
      const rows = app.getElementById("board-rows");
      const todayEntries = getTodayAssessments(data);
      rows.replaceChildren();

      data.patients.slice().sort((a, b) => a.bed.localeCompare(b.bed)).forEach((patient) => {
        const latest = todayEntries.find((entry) => entry.patientId === patient.id);
        const row = app.createElement("tr");
        const bed = app.createElement("td");
        bed.className = "bed-cell";
        bed.textContent = patient.bed;
        const name = app.createElement("td");
        name.className = "patient-cell";
        const nameStrong = app.createElement("strong");
        nameStrong.textContent = patient.name;
        const ward = app.createElement("span");
        ward.textContent = patient.ward;
        name.append(nameStrong, ward);
        const hn = app.createElement("td");
        hn.className = "hn-cell";
        hn.textContent = patient.hn;
        const risk = app.createElement("td");
        risk.append(latest ? makeRiskBadge(latest.level) : makeRiskBadge("pending", "Not assessed yet"));
        const assessed = app.createElement("td");
        assessed.className = "time-cell";
        assessed.textContent = latest ? formatTime(latest.timestamp) : "—";
        const nurse = app.createElement("td");
        nurse.className = "nurse-cell";
        nurse.textContent = latest ? latest.nurse : "—";
        const history = app.createElement("td");
        const count = getTodayAssessments(data, patient.id).length;
        history.textContent = count ? `${count} ${count === 1 ? "entry" : "entries"}` : "—";
        row.append(bed, name, hn, risk, assessed, nurse, history);
        rows.append(row);
      });

      const assessedPatients = new Set(todayEntries.map((entry) => entry.patientId));
      app.getElementById("count-total").textContent = data.patients.length;
      app.getElementById("count-assessed").textContent = assessedPatients.size;
      app.getElementById("count-pending").textContent = data.patients.length - assessedPatients.size;
      app.getElementById("count-high").textContent = data.patients.filter((patient) => {
        const latest = todayEntries.find((entry) => entry.patientId === patient.id);
        return latest && latest.level === "high";
      }).length;
      app.getElementById("last-updated").textContent = todayEntries.length ? formatTime(todayEntries[0].timestamp) : "—";
      renderRecentHistory(data);
    }

    function renderRecentHistory(data) {
      const container = app.getElementById("recent-history");
      container.replaceChildren();
      const latest = data.assessments.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);
      if (!latest.length) {
        const empty = app.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "No assessments have been saved.";
        container.append(empty);
        return;
      }
      latest.forEach((entry) => {
        const patient = getPatient(data, entry.patientId);
        if (!patient) return;
        const item = app.createElement("article");
        item.className = "recent-entry";
        const initials = app.createElement("span");
        initials.className = "recent-avatar";
        initials.textContent = makeInitials(patient.name);
        const details = app.createElement("div");
        details.className = "recent-details";
        const title = app.createElement("strong");
        title.textContent = patient.name;
        const meta = app.createElement("span");
        meta.textContent = `${patient.bed} · ${entry.nurse} · ${entry.date === today ? "Today" : displayDate(entry.date)} ${formatTime(entry.timestamp)}`;
        details.append(title, meta);
        item.append(initials, details, makeRiskBadge(entry.level));
        container.append(item);
      });
    }

    renderBoard();
    window.addEventListener("storage", (event) => {
      if (event.key === DATA_KEY) renderBoard();
    });
  }

  if (isAssessmentPage) initAssessmentPage();
  if (isBoardPage) initBoardPage();
})();
