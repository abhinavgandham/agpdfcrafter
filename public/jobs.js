const displayArea = document.querySelector("#InformationDisplayArea");
const token = localStorage.getItem("token");

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
  const response = await fetch("/api/job/getJobs", {
    headers: {
      Authorization: `Bearer ${token}`,
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
  const response = await fetch("/api/job/getAllJobs", {
    headers: {
      Authorization: `Bearer ${token}`,
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
