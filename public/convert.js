const convertBtn = document.querySelector("#convertBtn");
const convertMessageArea = document.querySelector("#convertMessage");

const convert = async () => {
  try {
    const token = localStorage.getItem("token");
   
    const response = await fetch("/api/file/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
         if (response.status === 200) {
       const result = await response.json();

       showConvertMessage("✅ Conversion completed");

       const downloadLink = document.querySelector("#downloadLink");
       if (downloadLink && result.downloadUrl) {

         downloadLink.innerHTML = `
           <a href="#" id="downloadBtn" class="download-btn" data-download-url="${result.downloadUrl}">
             📥 Download ${result.convertedFile}
           </a>
         `;

         // Enable the download button
         const downloadBtn = document.querySelector("#downloadBtn");
         if (downloadBtn) {
           downloadBtn.disabled = false;
         }
       }

       // Show download section
       const downloadSection = document.querySelector(".download-section");
       if (downloadSection) {
         downloadSection.style.display = "block";
       }
    } else {
      showConvertMessage("❌ Error converting file");
    }
  } catch (error) {
    showConvertMessage("❌ Error converting file");
  }
};

const showConvertMessage = (message) => {
  convertMessageArea.textContent = message;
  setTimeout(() => {
    convertMessageArea.textContent = "";
  }, 5000)
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const convertBtn = document.querySelector("#convertBtn");
  if (convertBtn) {
    convertBtn.addEventListener("click", convert);
  }
});
