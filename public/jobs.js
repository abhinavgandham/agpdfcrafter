const displayArea = document.querySelector("#InformationDisplayArea");

const validateToken = () => {
  const currentToken = localStorage.getItem("token");
  if (!currentToken) {
    displayArea.innerHTML = "❌ No authentication token found. Please login again.";
    setTimeout(() => displayArea.innerHTML = "", 5000);
    return false;
  }
  
  const tokenParts = currentToken.split('.');
  if (tokenParts.length !== 3) {
    displayArea.innerHTML = "❌ Invalid token format. Please login again.";
    setTimeout(() => displayArea.innerHTML = "", 5000);
    return false;
  }
  
  return true;
};

const createTable = () => {
  const table = document.createElement("table");
  table.border = "1";
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";

  table.innerHTML = ` 
<thead>
<tr>
  <th>File Name</th>
  <th>Job ID</th>
  <th>Status</th>
  <th>Uploaded By</th>
</tr>
</thead>
<tbody></tbody>`;

  return table;
};

export const getUserJobs = async () => {
  // Validate token before making request
  if (!validateToken()) {
    return;
  }
  
  const currentToken = localStorage.getItem("token");
  const response = await fetch("/api/job/getJobs", {
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  });

  const jobData = await response.json();
  const jobTable = createTable();
  const tableBody = jobTable.querySelector("tbody");
  for (const job of jobData) {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${job.originalFileName}</td>
    <td>${job.jobId}</td>
    <td>${job.jobResult}</td>
    <td>${job.userName}</td>
        `;
    tableBody.append(row);
  }
  displayArea.innerHTML = "";
  displayArea.append(jobTable);
};

export const getAllJobs = async () => {
  // Validate token before making request
  if (!validateToken()) {
    return;
  }
  
  const currentToken = localStorage.getItem("token");
  const response = await fetch("/api/job/getAllJobs", {
    headers: {
      Authorization: `Bearer ${currentToken}`,
    },
  });
  const jobData = await response.json();
  const jobTable = createTable();
  const tableBody = jobTable.querySelector("tbody");
  for (const job of jobData.jobs) {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${job.originalFileName}</td>
    <td>${job.jobId}</td>
    <td>${job.jobResult}</td>
    <td>${job.userName}</td>
        `;
    tableBody.append(row);
  }
  displayArea.innerHTML = "";
  displayArea.append(jobTable);
};
