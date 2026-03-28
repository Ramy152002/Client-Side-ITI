
const API = "http://localhost:3000";

let currentUser = null;


function renderNavbar() {
  document.getElementById("navbar").innerHTML =
    `<a href="index.html">Home</a><a href="#" onclick="logout()">Logout</a>`;
}


document.getElementById("create-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent default form submit (would reload the page)

  const file = document.getElementById("image").files[0];
  let imageBase64 = ""; 

  if (file) {
    
    imageBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // reader.result = "data:image/png;base64,..."
      reader.readAsDataURL(file); // Start reading; triggers onload when done
    });
  }

  const deadline = document.getElementById("deadline").value.trim();
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateRegex.test(deadline)) {
    alert("Please enter the deadline in DD-MM-YYYY format (e.g. 31-12-2026).");
    return;
  }

  const campaign = {
    title:       document.getElementById("title").value.trim(),
    description: document.getElementById("desc").value.trim(),
    goal:        parseInt(document.getElementById("goal").value), // Convert string to number
    deadline,
    category:    document.getElementById("category").value,
    image:       imageBase64,
    creatorId:   currentUser.id,
    isApproved:  false,
    raised:      0     
    
  };

  const res = await fetch(`${API}/campaigns`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(campaign),
  });

  if (!res.ok) {
    alert("Failed to create campaign. Please try again.");
    return;
  }

  alert("Campaign submitted! It will appear publicly once an admin approves it.");
  window.location.href = "index.html"; // Go back to the browse page
});

function logout() {
  localStorage.removeItem("currentUser");
  location.href = "index.html";
}

window.onload = () => {
  const stored = localStorage.getItem("currentUser");


  if (!stored) {
    return (location.href = "login.html");
  }

  currentUser = JSON.parse(stored);
  renderNavbar();
};
