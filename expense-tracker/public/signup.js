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
      console.log(" Signup success:", data);
      alert("Signup successful! Please login.");
      window.location.href = "login.html"; // redirect to login
    } else {
      console.error(" Server error:", data);
      alert(data.error || "Something went wrong");
    }
  } catch (err) {
    console.error(" Network error:", err);
    alert("Network error, please try again.");
  }
});
