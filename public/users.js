const displayArea = document.querySelector("#InformationDisplayArea");
const token = localStorage.getItem("token");

let currentOrder = "asc";
let currentUserRole = null;

const createTable = () => {
  const table = document.createElement("table");
  table.border = "1";
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";

  table.innerHTML = ` 
    <thead>
      <tr>
        <th>User ID</th>
        <th>Username</th>
        <th>Email</th>
        <th>Full Name</th>
        <th>Role</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody></tbody>`;
  return table;
};

const sortUsersById = (users, order) => {
  return users.sort((a, b) => {
    if (a.id < b.id) return order === "asc" ? -1 : 1;
    if (a.id > b.id) return order === "asc" ? 1 : -1;
    return 0;
  });
};

const renderTable = (users, renderToggle = false) => {
  // Sort users first
  const sortedUsers = sortUsersById([...users], currentOrder);

  const usersTable = createTable();
  const tbody = usersTable.querySelector("tbody");

  for (const user of sortedUsers) {
    const row = document.createElement("tr");
    
    // Create actions cell
    const actionsCell = document.createElement("td");
    
    // Only show promote button for normal users and only if current user is admin
    if (user.role === "normal user" && currentUserRole === "admin") {
      const promoteButton = document.createElement("button");
      promoteButton.textContent = "Promote to Admin";
      promoteButton.style.backgroundColor = "#28a745";
      promoteButton.style.color = "white";
      promoteButton.style.border = "none";
      promoteButton.style.padding = "5px 10px";
      promoteButton.style.borderRadius = "3px";
      promoteButton.style.cursor = "pointer";
      promoteButton.addEventListener("click", () => promoteUser(user.username));
      actionsCell.appendChild(promoteButton);
    }
    else if (user.role === "admin" && currentUserRole === "admin") {
      const demoteButton = document.createElement("button");
      demoteButton.textContent = "Demote from Admin";
      demoteButton.style.backgroundColor = "#dc3545";
      demoteButton.style.color = "white";
      demoteButton.style.border = "none";
      demoteButton.style.padding = "5px 10px";
      demoteButton.style.borderRadius = "3px";
      demoteButton.style.cursor = "pointer";
      demoteButton.addEventListener("click", () => demoteUser(user.username));
      actionsCell.appendChild(demoteButton);
    }
    else {
      actionsCell.textContent = "-";
    }
    
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.fullName}</td>
      <td>${user.role}</td>
    `;
    row.appendChild(actionsCell);
    tbody.append(row);
  }

  displayArea.innerHTML = "";
  
  // Create toggle button
  if (renderToggle) {
    const toggleButton = document.createElement("button");
    toggleButton.textContent = `Sort by ID (${currentOrder === "asc" ? "Ascending" : "Descending"})`;
    toggleButton.addEventListener("click", () => {
      currentOrder = currentOrder === "asc" ? "desc" : "asc";
      renderTable(users, true);
    });
  
    displayArea.append(toggleButton);
  };
  displayArea.append(usersTable);
  }
 

const promoteUser = async (username) => {
  if (!confirm(`Are you sure you want to promote ${username} to admin?`)) {
    return;
  }

  try {
    const currentToken = localStorage.getItem("token");
    const response = await fetch("/api/auth/promoteToAdmin", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}` 
      },
      body: JSON.stringify({ username }),
    });


    const data = await response.json();

    if (response.ok) {
      displayArea.innerHTML = `✅ ${data.message}`;
      setTimeout(() => {
        displayArea.innerHTML = "";
        // Refresh the users list to show updated roles
        displayAllUsers();
      }, 2000);
    } else {
      displayArea.innerHTML = `❌ ${data.message}`;
      setTimeout(() => displayArea.innerHTML = "", 5000);
    }
  } catch (error) {
    displayArea.innerHTML = `❌ Error promoting user: ${error.message}`;
    setTimeout(() => displayArea.innerHTML = "", 5000);
  }
};

const demoteUser = async(username) => {
  if (!confirm(`Are you sure you want to demote ${username} from admin?`)) {
    return;
  }

  try {
    const currentToken = localStorage.getItem("token");
    const response = await fetch("/api/auth/demoteFromAdmin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ username }),
    });


    const data = await response.json();

    if (response.ok) {
      displayArea.innerHTML = `✅ ${data.message}`;
      setTimeout(() => {
        displayArea.innerHTML = "";
        // Refresh the users list to show updated roles
        displayAllUsers();
      }, 2000);
    }
    else {
      displayArea.innerHTML = `❌ ${data.message}`;
      setTimeout(() => displayArea.innerHTML = "", 5000);
    }
    } 
    catch (error) {
      displayArea.innerHTML = `❌ Error demoting user: ${error.message}`;
      setTimeout(() => displayArea.innerHTML = "", 5000);
    }
  } 


const getCurrentUserRole = async () => {
  try {
    // Get token from localStorage dynamically
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      return 'normal user';
    }
    
    // Get current user info from backend to get the role
    const response = await fetch("/api/user/getCurrentUser", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    
    if (response.ok) {
      const user = await response.json();
      return user.role || 'normal user';
    }
  } catch (error) {
    console.log("Could not get current user role:", error);
  }
  return 'normal user'; // Default fallback
};

export const displayAllUsers = async () => {
  // Get current token dynamically
  const currentToken = localStorage.getItem("token");
  if (!currentToken) {
    displayArea.innerHTML = "❌ No authentication token found. Please login again.";
    setTimeout(() => displayArea.innerHTML = "", 5000);
    return;
  }
 
  // Get current user role from backend
  currentUserRole = await getCurrentUserRole();

  const response = await fetch("/api/user/getAllUsers", {
    headers: { Authorization: `Bearer ${currentToken}` },
  });


  const users = await response.json();
  renderTable(users, true);
};

export const displayUserById = async () => {
  const id = prompt("Enter the user ID to search for: ");
  if (!id) return;

  // Get current token dynamically
  const currentToken = localStorage.getItem("token");
  if (!currentToken) {
    displayArea.innerHTML = "❌ No authentication token found. Please login again.";
    setTimeout(() => displayArea.innerHTML = "", 5000);
    return;
  }

  // Get current user role from backend
  currentUserRole = await getCurrentUserRole();

  const response = await fetch(`/api/user/getUserById/${id}`, {
    headers: { Authorization: `Bearer ${currentToken}` },
  });


  if (response.status === 404) {
    displayArea.innerHTML = "❌ Could not find the user";
    setTimeout(() => displayArea.innerHTML = "", 5000);
  } else {
    const user = await response.json();
    renderTable([user]);
  }
};
