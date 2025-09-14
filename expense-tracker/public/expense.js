const API_BASE_URL = "http://localhost:3000";
const token = localStorage.getItem("token");

// ✅ Redirect if no token
if (!token) {
  window.location.href = "login.html";
}

// DOM Elements
const tableBody = document.getElementById("expense-body");
const reportTable = document.getElementById("report-table");
const reportBody = document.getElementById("report-body");
const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("total-income");   // fixed ID
const expenseEl = document.getElementById("total-expense"); // fixed ID
const downloadBtn = document.getElementById("download-btn");

// ===================== EXPENSE CRUD =====================

// Load all expenses
async function loadExpenses() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    tableBody.innerHTML = "";

    data.forEach((exp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${exp.amount}</td>
        <td>${exp.description}</td>
        <td>${exp.category}</td>
        <td>${exp.type}</td>
        <td>${exp.note || ""}</td>
        <td><button onclick="deleteExpense(${exp.id})">Delete</button></td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

// Add expense
document.getElementById("expense-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const amount = document.getElementById("amount").value.trim();
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const type = document.getElementById("type").value;
  const note = document.getElementById("note").value.trim();

  try {
    const res = await fetch(`${API_BASE_URL}/api/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description, category, type, note }),
    });

    const data = await res.json();
    if (res.ok) {
      loadExpenses();
      document.getElementById("expense-form").reset();
    } else {
      alert(data.error || "Failed to add expense");
    }
  } catch (err) {
    console.error("Error adding expense:", err);
  }
});

// Delete expense
function showConfirmPopup(callback) {
  const modal = document.getElementById("confirmModal");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");

  modal.style.display = "flex";

  yesBtn.onclick = () => {
    modal.style.display = "none";
    callback(true);
  };

  noBtn.onclick = () => {
    modal.style.display = "none";
    callback(false);
  };
}

async function deleteExpense(id) {
  showConfirmPopup(async (confirmed) => {
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const note = document.getElementById("notification");

      if (res.ok) {
        note.textContent = "Expense deleted successfully ✅";
        note.style.background = "#4caf50";
        note.style.display = "block";
        setTimeout(() => { note.style.display = "none"; }, 3000);
        loadExpenses();
      } else {
        note.textContent = data.error || "Failed to delete expense ❌";
        note.style.background = "#f44336";
        note.style.display = "block";
        setTimeout(() => { note.style.display = "none"; }, 3000);
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
    }
  });
}


// ===================== REPORT =====================

// Called by buttons (Daily, Monthly, Yearly)
function toggleReport(period) {
  loadReport(period);
}

async function loadReport(period) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/expenses/report?period=${period}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await res.json();

    if (!res.ok || !data) {
      console.error("Report error:", data);
      alert(data.error || "Failed to load report");
      return;
    }

    // Clear old data
    reportBody.innerHTML = "";

    // Insert new row
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${period.charAt(0).toUpperCase() + period.slice(1)}</td>
      <td>Rs.${Number(data.total_income || 0).toFixed(2)}</td>
      <td>Rs.${Number(data.total_expense || 0).toFixed(2)}</td>
    `;
    reportBody.appendChild(tr);

    // Update cards
    incomeEl.textContent = Number(data.total_income || 0).toFixed(2);
    expenseEl.textContent = Number(data.total_expense || 0).toFixed(2);
    balanceEl.textContent = Number(data.balance || 0).toFixed(2);

    // Show table
    document.getElementById("report-section").style.display = "block";

    // Enable download button
    downloadBtn.disabled = false;
    downloadBtn.dataset.period = period;

  } catch (err) {
    console.error("Error loading report:", err);
    alert("Something went wrong while loading report");
  }
}

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", loadExpenses);
