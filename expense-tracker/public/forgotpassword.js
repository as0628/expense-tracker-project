const form = document.getElementById("forgot-form");
const messageDiv = document.getElementById("message");

// Base URL of your server
const BASE_URL = "http://3.109.48.147:3000";

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  if (!email) {
    messageDiv.textContent = "Please enter your email.";
    messageDiv.style.color = "red";
    return;
  }

  // Generate a dummy reset ID
  const dummyResetId = "dummy-reset-id";

  // Construct the reset link
  const resetLink = `${BASE_URL}/password/resetpassword/${dummyResetId}`;

  messageDiv.innerHTML = `
    <p style="color: green;">Reset link generated! Click below to reset your password:</p>
    <a href="${resetLink}" style="color: blue;">${resetLink}</a>
  `;
});
