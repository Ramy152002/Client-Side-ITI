const API = "http://localhost:3000";

let currentUser = null;

const bcrypt = dcodeIO.bcrypt;


function renderNavbar() {
  const nav = document.getElementById("navbar");
  nav.innerHTML = `<a href="index.html">Home</a><a href="registration.html">Register</a>`;
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // Stop the browser from refreshing the page on submit

  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-password").value; // plain-text password typed by user


  if (!email || !pass) {
    alert("Please enter both email and password.");
    return;
  }

  const res   = await fetch(`${API}/users?email=${encodeURIComponent(email)}`);
  const users = await res.json();


  const user = users[0];


  if (!user) {
    alert("No account found with that email.");
    return;
  }

  if (!user.isActive) {
    alert("Your account has been banned. Contact support.");
    return;
  }

  const passwordMatch = await bcrypt.compare(pass, user.password);

  if (!passwordMatch) {
    alert("Incorrect password. Please try again.");
    return;
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem("currentUser", JSON.stringify(safeUser));

  alert(`Welcome back, ${user.name}!`);


  if (user.role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "index.html";
  }
});

window.onload = () => {
  const stored = localStorage.getItem("currentUser");
  if (stored) {
    currentUser = JSON.parse(stored);
    window.location.href = "index.html";
    return;
  }
  renderNavbar();
};
