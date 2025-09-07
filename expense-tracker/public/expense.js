const API_BASE_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
const pageSize = 10;
let currentPage = 1;

const tableBody = document.getElementById("expense-body");
const paginationEl = document.getElementById("pagination");

function renderRows(expenses) {
  tableBody.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const pageItems = expenses.slice(start, start + pageSize);

  pageItems.forEach((exp) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.amount}</td>
      <td>${exp.description}</td>
      <td>${exp.category}</td>
      <td>${exp.note || ""}</td>
      <td><button onclick="deleteExpense(${exp.id})">Delete</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function renderPagination(totalItems) {
  paginationEl.innerHTML = "";
  const totalPages = Math.ceil(totalItems / pageSize);

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => gotoPage(currentPage - 1));
  paginationEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");
    btn.addEventListener("click", () => gotoPage(i));
    paginationEl.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => gotoPage(currentPage + 1));
  paginationEl.appendChild(nextBtn);
}

function gotoPage(page, expenses) {
  currentPage = page;
  renderRows(expenses);
  renderPagination(expenses.length);
}

async function loadExpensesWithPagination() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const expenses = await res.json();
    gotoPage(1, expenses);
  } catch (err) {
    console.error("Error loading expenses for pagination:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadExpensesWithPagination);

if (!token) {
  window.location.href = "login.html";
} else {
  document.getElementById("expense-container").style.display = "block";
}

document
  .getElementById("buy-premium-btn")
  .addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must log in first!");
        window.location.href = "login.html";
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/order/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("Order response:", data);

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to create order.");
        return;
      }

      const qs = new URLSearchParams({
        orderId: data.orderId,
        sessionId: data.payment_session_id,
      }).toString();

      window.location.href = `cashfree.html?${qs}`;
    } catch (err) {
      console.error("Error creating order:", err);
      alert("Something went wrong while creating order");
    }
  });

async function loadExpenses() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    const expenseBody = document.getElementById("expense-body");
    expenseBody.innerHTML = "";

    data.forEach((exp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${exp.amount}</td>
        <td>${exp.description}</td>
        <td>${exp.category}</td>
        <td>${exp.note || ""}</td>
        <td>
          <button onclick="deleteExpense(${exp.id})">Delete</button>
        </td>
      `;
      expenseBody.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading expenses:", err);
  }
}

document
  .getElementById("expense-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = document.getElementById("amount").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value;
    const note = document.getElementById("note").value.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, description, category, note }),
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

async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      loadExpenses();
    } else {
      alert(data.error || "Failed to delete expense");
    }
  } catch (err) {
    console.error("Error deleting expense:", err);
  }
}

loadExpenses();
