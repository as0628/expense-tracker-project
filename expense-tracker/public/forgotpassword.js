const form = document.getElementById("forgot-form");
const messageDiv = document.getElementById("message");

// Base URL of your server
const BASE_URL = "http://3.109.48.147";

// Function to generate random alphanumeric string
function generateRandomId(length = 30) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  if (!email) {
    messageDiv.textContent = "Please enter your email.";
    messageDiv.style.color = "red";
    return;
  }

  // Generate a random reset ID
  const dummyResetId = generateRandomId();

  // Construct the reset link
  const resetLink = `${BASE_URL}/password/resetpassword/${dummyResetId}`;

  messageDiv.innerHTML = `
    <p style="color: green;">Reset link generated! Click below to reset your password:</p>
    <a href="${resetLink}" style="color: blue;">${resetLink}</a>
  `;
});
