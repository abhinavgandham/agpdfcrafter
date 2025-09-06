const displayArea = document.querySelector("#InformationDisplayArea");
const token = localStorage.getItem("token");

let currentOrder = "asc";

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
    row.innerHTML = `
      <td>${user.id}</td>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.fullName}</td>
      <td>${user.role}</td>
    `;
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
 

export const displayAllUsers = async () => {
  const response = await fetch("/api/user/getAllUsers", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    displayArea.innerHTML = "❌ Failed to fetch users";
    setTimeout(() => displayArea.innerHTML = "", 5000);
    return;
  }

  const users = await response.json();
  renderTable(users, true);
};

export const displayUserById = async () => {
  const id = prompt("Enter the user ID to search for: ");
  if (!id) return;

  const response = await fetch(`/api/user/getUserById/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
    displayArea.innerHTML = "❌ Could not find the user";
    setTimeout(() => displayArea.innerHTML = "", 5000);
  } else if (!response.ok) {
    displayArea.innerHTML = "❌ An Unexpected error occured.";
    setTimeout(() => displayArea.innerHTML = "", 5000);
  } else {
    const user = await response.json();
    renderTable([user]);
    
  }
};
