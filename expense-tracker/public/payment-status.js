const API_BASE_URL = "http://localhost:3000"; 

(async () => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");  
  const token = localStorage.getItem("token");

  if (!orderId || !token) {
    document.getElementById("status").innerText = "Invalid request!";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/order/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();
    console.log("Verification response:", data);

    const statusEl = document.getElementById("status");
    const okBtn = document.getElementById("ok-btn");

    if (data.success) {
      statusEl.innerText = "Payment successful! Premium activated.";
      okBtn.onclick = () => {
        window.location.href = "login.html";
      };
    } else {
      statusEl.innerText = "Payment failed or pending.";
      okBtn.onclick = () => {
        window.location.href = "expense.html";
      };
    }

   
    okBtn.style.display = "inline-block";
  } catch (err) {
    console.error("Verification error:", err);
    document.getElementById("status").innerText = "Error verifying payment.";
  }
})();
