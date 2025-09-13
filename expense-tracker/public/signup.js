const messageDiv = document.getElementById("signup-message");

document.getElementById("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = e.target.name.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;

  const payload = { name, email, password };
  console.log("Form submission payload:", payload);

  try {
    const res = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      console.log("Signup success:", data);

      // Show inline message instead of alert
      messageDiv.style.display = "block";
      messageDiv.style.backgroundColor = "#d4edda";  // green background
      messageDiv.style.color = "#155724";           // dark green text
      messageDiv.textContent = "Signup successful! Redirecting to login...";

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

    } else {
      console.error("Server error:", data);

      messageDiv.style.display = "block";
      messageDiv.style.backgroundColor = "#f8d7da"; // red background
      messageDiv.style.color = "#721c24";          // dark red text
      messageDiv.textContent = data.error || "Something went wrong";
    }
  } catch (err) {
    console.error("Network error:", err);

    messageDiv.style.display = "block";
    messageDiv.style.backgroundColor = "#f8d7da"; // red background
    messageDiv.style.color = "#721c24";
    messageDiv.textContent = "Network error, please try again.";
  }
});
