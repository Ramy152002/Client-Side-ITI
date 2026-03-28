const API = "http://localhost:3000";

let currentUser = null; 
let allUsers    = [];   

function renderNavbar() {
  document.getElementById("navbar").innerHTML =
    `<a href="index.html">Home</a><a href="#" onclick="logout()">Logout</a>`;
}

async function loadAdminData() {
  const res = await fetch(`${API}/users`);
  allUsers  = await res.json();
}

async function renderUsers() {
  const tbody = document.querySelector("#users-table tbody");


  tbody.innerHTML = allUsers
    .map(
      (u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <!-- Show a green tick if active, red ban symbol if banned -->
        <td>${u.isActive ? "✅ Active" : "🚫 Banned"}</td>
        <td>
          <!-- Only show the Ban button for active, non-admin users -->
          ${u.isActive && u.role !== "admin"
            ? `<button onclick="banUser(${u.id})" class="btn btn-danger">Ban</button>`
            : ""}
        </td>
      </tr>`
    )
    .join("");
}


async function renderCampaigns() {
  const res   = await fetch(`${API}/campaigns`);
  const camps = await res.json();

  const tbody = document.querySelector("#campaigns-table tbody");

  tbody.innerHTML = camps
    .map(
      (c) => `
      <tr>
        <td>${c.title}</td>
        <!-- Look up the creator's name from the cached allUsers array -->
        <td>${getUserName(c.creatorId)}</td>
        <td>$${c.goal}</td>
        <!-- Green tick = approved, hourglass = pending review -->
        <td>${c.isApproved ? "✅ Approved" : "⏳ Pending"}</td>
        <td>
          <!-- Only show Approve button if not yet approved -->
          ${!c.isApproved
            ? `<button onclick="approve(${c.id}, true)" class="btn btn-approve">Approve</button>`
            : ""}
          <!-- Reject sets isApproved to false (hides campaign from public) -->
          <button onclick="approve(${c.id}, false)" class="btn btn-danger">Reject</button>
          <!-- Delete permanently removes the campaign -->
          <button onclick="del(${c.id})" class="btn btn-danger">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

function getUserName(id) {
  return allUsers.find((u) => u.id === id)?.name || "Unknown";
}


function switchTab(n) {

  document.getElementById("users-tab").classList.toggle("hidden", n !== 0);
  document.getElementById("campaigns-tab").classList.toggle("hidden", n !== 1);

  document.getElementById("tab-users").classList.toggle("active-tab", n === 0);
  document.getElementById("tab-campaigns").classList.toggle("active-tab", n === 1);

  if (n === 0) renderUsers();
  else renderCampaigns();
}

async function banUser(id) {
  if (!confirm("Are you sure you want to ban this user?")) return;

  await fetch(`${API}/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive: false }),
  });

  await loadAdminData();
  renderUsers();
}

async function approve(id, status) {
  await fetch(`${API}/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isApproved: status }),
  });


  renderCampaigns();
}


async function del(id) {
  if (!confirm("Permanently delete this campaign?")) return;


  await fetch(`${API}/campaigns/${id}`, { method: "DELETE" });

  renderCampaigns();
}

function logout() {
  localStorage.removeItem("currentUser");
  location.href = "index.html";
}

window.onload = async () => {

  const stored = localStorage.getItem("currentUser");


  if (!stored) {
    alert("You must be logged in as admin.");
    return (location.href = "index.html");
  }

  currentUser = JSON.parse(stored);

  if (currentUser.role !== "admin") {
    alert("Admin only area!");
    return (location.href = "index.html");
  }


  renderNavbar();
  await loadAdminData();
  switchTab(0);         
};
