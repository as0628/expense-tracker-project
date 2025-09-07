// API base (no api.js import)
const API_BASE_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "login.html";
}

let currentPage = 1;      // for expenses
let leaderboardPage = 1;  // for leaderboard
let historyPage = 1;


// ================= Expenses =================
async function loadExpenses(page = 1) {
  try {
    const pageSize = localStorage.getItem("pageSize") || 10;

    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses?page=${page}&limit=${pageSize}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    if (!res.ok || !data.expenses) {
      console.error("Error fetching expenses:", data);
      alert(data.message || "Failed to load expenses");
      return;
    }

    const tbody = document.getElementById("expense-body");
    tbody.innerHTML = "";

    data.expenses.forEach((exp) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${Number(exp.amount).toFixed(2)}</td>
        <td>${exp.description}</td>
        <td>${exp.category}</td>
        <td>${exp.type}</td>
        <td>${exp.note || ""}</td>
        <td><button onclick="deleteExpense(${exp.id})">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });

    renderExpensePagination(data.pagination);
    currentPage = data.pagination.page;
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

function renderExpensePagination({ page, totalPages }) {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

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

// ================= Add Expense =================
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;
  const note = document.getElementById("note").value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category, type, note }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Error adding expense:", data);
      alert(data.error || "Failed to add expense");
      return;
    }

    e.target.reset();
    loadExpenses(currentPage);
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Error deleting expense:", data);
      alert(data.error || "Failed to delete expense");
      return;
    }
    loadExpenses(currentPage);
  } catch (err) {
    console.error("Error deleting expense:", err);
  }
}

// ================= Leaderboard =================
async function loadLeaderboard(page = 1) {
  try {
    const pageSize = document.getElementById("leaderboardPageSize")?.value || 10;

    const res = await fetch(
      `${API_BASE_URL}/api/premiumexpenses/leaderboard?page=${page}&limit=${pageSize}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();
    if (!res.ok || !data.leaderboard) {
      console.error("Error fetching leaderboard:", data);
      return;
    }

    const leaderboardBody = document.getElementById("leaderboard-body");
    leaderboardBody.innerHTML = "";

    data.leaderboard.forEach((user, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${(page - 1) * pageSize + idx + 1}</td>
        <td>${user.name}</td>
        <td>${user.total_expense ?? 0}</td>
      `;
      leaderboardBody.appendChild(tr);
    });

    renderLeaderboardPagination(data.pagination);
    leaderboardPage = data.pagination.page;
  } catch (err) {
    console.error("Error loading leaderboard:", err);
  }
}

function renderLeaderboardPagination({ page, totalPages }) {
  const container = document.getElementById("leaderboard-pagination");
  container.innerHTML = "";

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

// ================= Reports & History =================
document.addEventListener("DOMContentLoaded", () => {
  const leaderboardBtn = document.getElementById("show-leaderboard-btn");
  const leaderboardSection = document.getElementById("leaderboard-section");
  const reportBody = document.getElementById("report-body");
  const downloadBtn = document.getElementById("download-btn");
  const pageSizeSelect = document.getElementById("pageSizeSelect");
  const historyBtn = document.getElementById("toggle-history-btn");
  const historySection = document.getElementById("history-section");

  const leaderboardPageSize = document.getElementById("leaderboardPageSize");
  if (leaderboardPageSize) {
    leaderboardPageSize.addEventListener("change", () => {
      loadLeaderboard(1);
    });
  }

  historyBtn.addEventListener("click", async () => {
    const isHidden = historySection.classList.contains("hidden");
    if (isHidden) {
      await loadExportHistory();
      historySection.classList.remove("hidden");
      historyBtn.textContent = "Hide History";
    } else {
      historySection.classList.add("hidden");
      historyBtn.textContent = "Show History";
    }
  });

  leaderboardBtn.addEventListener("click", () => {
    const isHidden = leaderboardSection.classList.contains("hidden");
    if (isHidden) {
      loadLeaderboard(leaderboardPage);
      leaderboardSection.classList.remove("hidden");
      leaderboardBtn.textContent = "Hide Leaderboard";
    } else {
      leaderboardSection.classList.add("hidden");
      leaderboardBtn.textContent = "Show Leaderboard";
    }
  });

  window.loadReport = async (period) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/premiumexpenses/report?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        console.error("Report error:", data);
        alert(data.error || "Failed to load report");
        return;
      }

      reportBody.innerHTML = "";
      data.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.period}</td>
          <td>${Number(row.total_income || 0).toFixed(2)}</td>
          <td>${Number(row.total_expense || 0).toFixed(2)}</td>
        `;
        reportBody.appendChild(tr);
      });

      downloadBtn.disabled = false;
      downloadBtn.dataset.period = period;
    } catch (err) {
      console.error("Error loading report:", err);
    }
  };

  // ================= Download Excel =================
  downloadBtn.addEventListener("click", async () => {
  const period = downloadBtn.dataset.period || "monthly";
  try {
    const res = await fetch(`${API_BASE_URL}/api/premiumexpenses/download?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json(); // read JSON, not blob
    if (!res.ok || !data.fileUrl) throw new Error("Download failed");

    // open the file URL
    const a = document.createElement("a");
    a.href = data.fileUrl;
    a.download = `expense-report-${period}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (err) {
    console.error("Error downloading:", err);
    alert("Download failed.");
  }
});

  // ================= Export History =================
  async function loadExportHistory(page = 1) {
    try {
      const limit = 5;

      const res = await fetch(
        `${API_BASE_URL}/api/premiumexpenses/history?page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();

      const tbody = document.getElementById("history-body");
      tbody.innerHTML = "";

      if (!Array.isArray(data.rows) || data.rows.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="3">No reports generated yet.</td>`;
        tbody.appendChild(tr);
        return;
      }

      // render rows
      data.rows.forEach((file, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${(page - 1) * limit + idx + 1}</td>
          <td>${new Date(file.created_at).toLocaleString()}</td>
          <td><a href="${file.url}" target="_blank">⬇ Download</a></td>
        `;
        tbody.appendChild(tr);
      });

      renderHistoryPagination(data.pagination);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }

  function renderHistoryPagination({ page, totalPages }) {
    const containerId = "history-pagination";
    let container = document.getElementById(containerId);

    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.className = "pagination";
      document.getElementById("history-section").after(container);
    }

    container.innerHTML = "";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Prev";
    prevBtn.disabled = page === 1;
    prevBtn.addEventListener("click", () => loadExportHistory(page - 1));
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === page) btn.disabled = true;
      btn.addEventListener("click", () => loadExportHistory(i));
      container.appendChild(btn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = page === totalPages;
    nextBtn.addEventListener("click", () => loadExportHistory(page + 1));
    container.appendChild(nextBtn);
  }

  // page size select
  const savedSize = localStorage.getItem("pageSize") || 10;
  pageSizeSelect.value = savedSize;
  pageSizeSelect.addEventListener("change", (e) => {
    localStorage.setItem("pageSize", e.target.value);
    loadExpenses(1);
  });

  // initial load
  loadExpenses(currentPage);
});
