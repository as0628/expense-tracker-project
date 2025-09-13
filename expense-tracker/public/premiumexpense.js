// premiumexpense.js

const API_BASE_URL = "http://localhost:3000";
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

let currentPage = 1;      // for expenses
let leaderboardPage = 1;  // for leaderboard
let historyPage = 1;      // for export history

// DOM Elements
const reportBody = document.getElementById("report-body");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");
const historyContainer = document.getElementById("export-history");
const historyPagination = document.getElementById("history-pagination");
const downloadBtn = document.getElementById("download-btn");

// ---------- Helpers ----------
function showNotification(msg, success = true) {
  const note = document.getElementById("notification");
  if (!note) return;
  note.textContent = msg;
  note.style.background = success ? "#4caf50" : "#f44336";
  note.style.display = "block";
  setTimeout(() => { note.style.display = "none"; }, 3000);
}

function showConfirmPopup(callback) {
  const modal = document.getElementById("confirmModal");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");
  if (!modal || !yesBtn || !noBtn) {
    callback(confirm("Are you sure?"));
    return;
  }
  modal.style.display = "flex";
  const cleanup = () => {
    yesBtn.onclick = null;
    noBtn.onclick = null;
  };
  yesBtn.onclick = () => { modal.style.display = "none"; cleanup(); callback(true); };
  noBtn.onclick = () => { modal.style.display = "none"; cleanup(); callback(false); };
}

function toggleElementById(id, displayType = "block") {
  const el = document.getElementById(id);
  if (!el) return;
  const isHidden = el.classList.contains("hidden") || getComputedStyle(el).display === "none";
  if (isHidden) {
    el.style.display = displayType;
    el.classList.remove("hidden");
  } else {
    el.style.display = "none";
    el.classList.add("hidden");
  }
}

window.toggleExpenseList = () => toggleElementById("expense-table", "table");
window.toggleReportTable = () => toggleElementById("report-section", "block");

// ---------- Expenses ----------
async function loadExpenses(page = 1) {
  try {
    const pageSize = parseInt(localStorage.getItem("pageSize"), 10) || parseInt(document.getElementById("pageSizeSelect")?.value || 10, 10);
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses?page=${page}&limit=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.expenses) {
      showNotification(data.message || "Failed to load expenses", false);
      return;
    }

    const tbody = document.getElementById("expense-body");
    if (tbody) {
      tbody.innerHTML = "";
      data.expenses.forEach(exp => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${Number(exp.amount).toFixed(2)}</td>
          <td>${exp.description}</td>
          <td>${exp.category}</td>
          <td>${exp.type}</td>
          <td>${exp.note || ""}</td>
          <td><button class="small-btn" onclick="deleteExpense(${exp.id})">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    }

    renderExpensePagination(data.pagination);
    currentPage = data.pagination.page;
  } catch (err) {
    console.error("Error loading expenses:", err);
    showNotification("Failed to load expenses", false);
  }
}

function renderExpensePagination(pagination = { page: 1, totalPages: 1 }) {
  const container = document.getElementById("pagination");
  if (!container) return;
  container.innerHTML = "";

  const page = pagination.page || 1;
  const totalPages = pagination.totalPages || 1;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => loadExpenses(page - 1));
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.addEventListener("click", () => loadExpenses(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => loadExpenses(page + 1));
  container.appendChild(nextBtn);
}

// ---------- Add Expense ----------
const expenseForm = document.getElementById("expense-form");
if (expenseForm) {
  expenseForm.addEventListener("submit", async e => {
    e.preventDefault();
    const amount = document.getElementById("amount").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const type = document.getElementById("type").value;
    const note = document.getElementById("note").value.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/api/premiumexpenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, description, category, type, note })
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || "Failed to add expense", false);
        return;
      }
      e.target.reset();
      showNotification("Expense added ✅", true);
      loadExpenses(currentPage);
    } catch (err) {
      showNotification("Failed to add expense", false);
    }
  });
}

// ---------- Delete Expense ----------
async function deleteExpense(id) {
  showConfirmPopup(async confirmed => {
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        showNotification(data.error || "Failed to delete expense", false);
        return;
      }
      showNotification("Expense deleted ✅", true);
      loadExpenses(currentPage);
    } catch (err) {
      showNotification("Failed to delete expense", false);
    }
  });
}
window.deleteExpense = deleteExpense;

// ---------- Leaderboard ----------
async function loadLeaderboard(page = 1) {
  try {
    const pageSize = parseInt(document.getElementById("leaderboardPageSize")?.value || 10, 10);
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/leaderboard?page=${page}&limit=${pageSize}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.leaderboard) {
      showNotification("Failed to load leaderboard", false);
      return;
    }

    const leaderboardBody = document.getElementById("leaderboard-body");
    if (leaderboardBody) {
      leaderboardBody.innerHTML = "";
      data.leaderboard.forEach((user, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${(page - 1) * pageSize + idx + 1}</td>
          <td>${user.name}</td>
          <td>${Number(user.total_expense ?? 0).toFixed(2)}</td>
        `;
        leaderboardBody.appendChild(tr);
      });
    }

    renderLeaderboardPagination(data.pagination);
    leaderboardPage = data.pagination.page;
  } catch (err) {
    showNotification("Failed to load leaderboard", false);
  }
}

function renderLeaderboardPagination(pagination = { page: 1, totalPages: 1 }) {
  const container = document.getElementById("leaderboard-pagination");
  if (!container) return;
  container.innerHTML = "";

  const page = pagination.page || 1;
  const totalPages = pagination.totalPages || 1;

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => loadLeaderboard(page - 1));
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.addEventListener("click", () => loadLeaderboard(i));
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => loadLeaderboard(page + 1));
  container.appendChild(nextBtn);
}

// ---------- Reports ----------
function toggleReport(period) { loadReport(period); }
async function loadReport(period) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/report?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok || !data) {
      alert(data.error || "Failed to load report");
      return;
    }

    reportBody.innerHTML = "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${period.charAt(0).toUpperCase() + period.slice(1)}</td>
      <td>£${Number(data.total_income || 0).toFixed(2)}</td>
      <td>£${Number(data.total_expense || 0).toFixed(2)}</td>
    `;
    reportBody.appendChild(tr);

    incomeEl.textContent = Number(data.total_income || 0).toFixed(2);
    expenseEl.textContent = Number(data.total_expense || 0).toFixed(2);
    balanceEl.textContent = Number(data.balance || 0).toFixed(2);

    document.getElementById("report-section").style.display = "block";

    downloadBtn.disabled = false;
    downloadBtn.dataset.period = period;

  } catch (err) {
    alert("Something went wrong while loading report");
  }
}
window.toggleReport = toggleReport;

// ---------- Download ----------
if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    const period = downloadBtn.dataset.period || "monthly";
    try {
      const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/download?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = res.headers.get("Content-Type") || "";
      if (res.ok && contentType.includes("application")) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expense-report-${period}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.fileUrl) throw new Error("Download failed");
      window.open(data.fileUrl, "_blank");
    } catch (err) {
      showNotification("Download failed", false);
    }
  });
}

// ---------- Export History ----------
async function loadExportHistory(page = 1) {
  try {
    const limit = parseInt(document.getElementById("historyPageSizeSelect")?.value || 5, 10);
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/history?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    const tbody = document.getElementById("export-history");
    if (!tbody) return;
    tbody.innerHTML = "";

   if (!Array.isArray(data.rows) || data.rows.length === 0) {
  tbody.innerHTML = "<tr><td colspan='3'>No export history found.</td></tr>";
  renderHistoryPagination({ page: 1, totalPages: 1 });  // ✅ match backend format
  return;
}


    data.rows.forEach((file, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${(page - 1) * limit + idx + 1}</td>
        <td>${new Date(file.created_at).toLocaleString()}</td>
        <td><a href="${file.url}" download>Download</a></td>
      `;
      tbody.appendChild(tr);
    });

    renderHistoryPagination(data.pagination);
    historyPage = data.pagination.page || page;

  } catch (err) {
    showNotification("Failed to load history", false);
  }
}


function renderHistoryPagination(pagination = { page: 1, totalPages: 1 }) {
  if (!historyPagination) return;
  historyPagination.innerHTML = "";

  const page = pagination.page || 1;
  const totalPages = pagination.totalPages || pagination.pages || 1;  // accept both


  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener("click", () => loadExportHistory(page - 1));
  historyPagination.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.addEventListener("click", () => loadExportHistory(i));
    historyPagination.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener("click", () => loadExportHistory(page + 1));
  historyPagination.appendChild(nextBtn);
}



// ---------- Init & UI wiring ----------
document.addEventListener("DOMContentLoaded", () => {
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  if (pageSizeSelect) {
    pageSizeSelect.value = localStorage.getItem("pageSize") || 10;
    pageSizeSelect.addEventListener("change", e => {
      localStorage.setItem("pageSize", e.target.value);
      loadExpenses(1);
    });
  }

 const historyBtn = document.getElementById("toggle-history-btn");
const historySection = document.getElementById("history-section");
if (historyBtn && historySection) {
  historyBtn.addEventListener("click", async () => {
    const isHidden = historySection.classList.contains("hidden") || getComputedStyle(historySection).display === "none";

    if (isHidden) {
      await loadExportHistory(1);
      historySection.classList.remove("hidden");
      historyBtn.textContent = "Hide History";
    } else {
      historySection.classList.add("hidden");
      historyBtn.textContent = "Show History";
    }
  });
}


  const leaderboardBtn = document.getElementById("show-leaderboard-btn");
  const leaderboardSection = document.getElementById("leaderboard-section");
  const leaderboardPageSize = document.getElementById("leaderboardPageSize");
  if (leaderboardBtn) {
    leaderboardBtn.addEventListener("click", () => {
      const isHidden = leaderboardSection?.classList.contains("hidden") || getComputedStyle(leaderboardSection || {}).display === "none";
      if (isHidden) {
        loadLeaderboard(1);
        toggleElementById("leaderboard-section", "block");
        leaderboardBtn.textContent = "Hide Leaderboard";
      } else {
        toggleElementById("leaderboard-section", "block");
        leaderboardBtn.textContent = "Show Leaderboard";
      }
    });
  }
  if (leaderboardPageSize) {
    leaderboardPageSize.addEventListener("change", () => loadLeaderboard(1));
  }

  // initial load
  loadExpenses(currentPage);
});
