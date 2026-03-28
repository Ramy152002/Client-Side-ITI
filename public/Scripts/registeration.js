const API = "http://localhost:3000";
const bcrypt = dcodeIO.bcrypt;

function renderNavbar() {
  document.getElementById("navbar").innerHTML =
    `<a href="index.html">Home</a><a href="login.html">Login</a>`;
}

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault(); 
    
    const name     = document.getElementById("reg-name").value.trim();
    const email    = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value; 

    
    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const existingRes = await fetch(`${API}/users?email=${encodeURIComponent(email)}`);
    const existing = await existingRes.json();
    if (existing.length > 0) {
      alert("This email is already registered. Please login instead.");
      return;
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPass, 
      role: "user",
      isActive: true
    };


    const res = await fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (!res.ok) {
      alert("Registration failed. Please try again.");
      return;
    }

    alert("Account created! You can now login.");
    window.location.href = "login.html";
  });

  window.onload = renderNavbar;
