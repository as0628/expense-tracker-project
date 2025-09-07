// Remove api.js import
// import API_BASE_URL from "api.js"; 

const API_BASE_URL = "http://localhost:3000"; // directly use localhost
const cashfree = Cashfree({ mode: "sandbox" });

document.getElementById("renderBtn").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first!");
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
    console.log("Order API response:", data);

    if (!data.payment_session_id) {
      alert("Failed to create Cashfree order");
      return;
    }

    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self", 
    });
  } catch (err) {
    console.error("Error:", err);
    alert("Something went wrong while starting payment!");
  }
});
