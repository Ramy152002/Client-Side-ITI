
const API = "http://localhost:3000";


let currentUser      = null; 
let currentCampaignId = null;
let allUsers         = [];   
let allPledges       = [];   

function renderNavbar() {
  const nav = document.getElementById("navbar");
  let html  = `<a href="index.html">Home</a>`;

  if (!currentUser) {

    html += `<a href="login.html">Login</a><a href="registration.html">Register</a>`;
  } else if (currentUser.role === "admin") {

    html += `<a href="admin.html">Admin Dashboard</a><a href="#" onclick="logout()">Logout</a>`;
  } else {

    html += `<a href="create-campaign.html">Create Campaign</a><a href="#" onclick="logout()">Logout</a>`;
  }

  nav.innerHTML = html;
}

async function fetchAllData() {
  const [usersRes, pledgesRes] = await Promise.all([
    fetch(`${API}/users`),
    fetch(`${API}/pledges`),
  ]);
  allUsers   = await usersRes.json();
  allPledges = await pledgesRes.json();
}

function getRaised(campaignId) {
  return allPledges
    .filter((p) => p.campaignId === campaignId)
    .reduce((sum, p) => sum + p.amount, 0);
}

function getUserName(id) {
  const user = allUsers.find((u) => u.id === id);
  return user ? user.name : "Unknown";
}


async function loadBrowse() {
  await fetchAllData();


  let url = `${API}/campaigns?isApproved=true`;

  const query    = document.getElementById("search-input").value.trim();
  const category = document.getElementById("category-filter").value;

  if (query)    url += `&q=${encodeURIComponent(query)}`; 
  if (category) url += `&category=${encodeURIComponent(category)}`; 

  const res       = await fetch(url);
  const campaigns = await res.json();

  const grid = document.getElementById("campaigns-grid");

  if (campaigns.length === 0) {
    grid.innerHTML = `<p style="text-align:center;color:#888;grid-column:1/-1;">No campaigns found.</p>`;
    return;
  }

  
  grid.innerHTML = campaigns
    .map((c) => {
      const raised = getRaised(c.id);
      // Cap progress bar at 100% even if pledges exceeded the goal
      const prog   = Math.min(100, Math.round((raised / c.goal) * 100));

      return `
        <div class="campaign-card" onclick="openDetailModal(${c.id})">
          ${
            c.image
              ? `<img src="${c.image}" alt="${c.title}">`
              : `<div class="no-image">No Image</div>`
          }
          <div class="card-body">
            <span class="card-category">${c.category}</span>
            <h3>${c.title}</h3>
            <p>${c.description.substring(0, 90)}…</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${prog}%"></div>
            </div>
            <div class="card-meta">
              <strong>$${raised.toLocaleString()} raised</strong>
              <span>${prog}% of $${c.goal.toLocaleString()}</span>
            </div>
          </div>
        </div>`;
    })
    .join("");
}


async function openDetailModal(id) {
  await fetchAllData(); // Refresh pledges so amounts are up-to-date


  const res = await fetch(`${API}/campaigns/${id}`);
  const c   = await res.json();

  currentCampaignId = id; 

  document.getElementById("modal-image").innerHTML = c.image
    ? `<img src="${c.image}" style="width:100%;height:280px;object-fit:cover;border-radius:12px;">`
    : `<div class="no-image" style="height:200px;">No Image</div>`;

  document.getElementById("modal-title").textContent    = c.title;
  document.getElementById("modal-desc").textContent     = c.description;
  document.getElementById("modal-deadline").textContent = `⏰ Deadline: ${c.deadline}`;

  const raised = getRaised(id);
  const prog   = Math.min(100, Math.round((raised / c.goal) * 100));

  document.getElementById("modal-progress").style.width = prog + "%";
  document.getElementById("modal-raised").textContent   = `$${raised.toLocaleString()} raised of $${c.goal.toLocaleString()}`;


  const actions = document.getElementById("modal-actions");
  if (currentUser && currentUser.id !== c.creatorId) {
    actions.innerHTML = `<button onclick="openPledgeModal()" class="btn btn-primary" style="width:100%;">❤️ Support This Campaign</button>`;
  } else if (!currentUser) {
    actions.innerHTML = `<p style="text-align:center;color:#888;"><a href="login.html">Login</a> to support this campaign</p>`;
  } else {
    actions.innerHTML = `<p style="text-align:center;color:#888;">You created this campaign</p>`;
  }


  document.getElementById("detail-modal").style.display = "flex";
}


function closeModal() {
  document.getElementById("detail-modal").style.display = "none";
}

function openPledgeModal() {

  document.getElementById("pledge-title").textContent =
    document.getElementById("modal-title").textContent;

  document.getElementById("pledge-modal").style.display = "flex";
  closeModal(); 
}

async function makePledge() {
  const amount = parseInt(document.getElementById("pledge-amount").value);

  if (!amount || amount < 5) {
    alert("Minimum pledge amount is $5.");
    return;
  }


  if (!confirm(`Confirm mock pledge of $${amount} to this campaign?`)) return;

  const res = await fetch(`${API}/pledges`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      campaignId: currentCampaignId,
      userId:     currentUser.id,
      amount,
    }),
  });

  if (!res.ok) {
    alert("Pledge failed. Please try again.");
    return;
  }

  alert("🎉 Pledge successful! Thank you for your support.");
  closePledgeModal();
  loadBrowse(); 
}


function closePledgeModal() {
  document.getElementById("pledge-modal").style.display = "none";
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload(); 
}


async function loadMyActivity() {

  if (!currentUser || currentUser.role === "admin") return;

  document.getElementById("my-activity").classList.remove("hidden");
  await fetchAllData();

  const res     = await fetch(`${API}/campaigns?creatorId=${currentUser.id}`);
  const myCamps = await res.json();

  document.getElementById("my-campaigns-list").innerHTML = myCamps.length
    ? myCamps
        .map(
          (c) => `
        <div class="activity-card">
          <strong>${c.title}</strong>
          <span>$${getRaised(c.id).toLocaleString()} / $${c.goal.toLocaleString()}</span>
          <span class="status-badge ${c.isApproved ? "approved" : "pending"}">
            ${c.isApproved ? "✅ Approved" : "⏳ Pending"}
          </span>
        </div>`
        )
        .join("")
    : `<p style="color:#888;">You haven't created any campaigns yet.</p>`;
}


window.onload = async () => {
  // Check if a user is already logged in (set by login.js)
  const stored = localStorage.getItem("currentUser");
  if (stored) currentUser = JSON.parse(stored);

  renderNavbar();
  await loadBrowse();
  loadMyActivity();


  document.getElementById("search-input").addEventListener("input", loadBrowse);
  document.getElementById("category-filter").addEventListener("change", loadBrowse);
};
