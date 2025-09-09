const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { parse } = require("json2csv");
const sqlite3 = require("sqlite3").verbose();
const csv = require("csv-parser");
const { 
  S3Client, PutObjectCommand
} = require("@aws-sdk/client-s3");

// Load jobs with safety check
let jobs;
try {
  jobs = require("../../jobs.json");
  if (!jobs || !jobs.jobs) {
    jobs = { jobs: [] };
  }
} catch (error) {
  console.log("Creating new jobs.json file");
  jobs = { jobs: [] };
}

const setupPuppeteer = async (content) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-features=VizDisplayCompositor",
    ],
    timeout: 300000,
  });

  const page = await browser.newPage();

  await page.setDefaultTimeout(300000);
  await page.setDefaultNavigationTimeout(300000);
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  );

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setContent(content, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForFunction(() => document.readyState === "complete", {
    timeout: 60000,
  });

  return { browser, page };
};

const htmlToPdf = async (htmlContent) => {
  let browser;
  try {
    const { browser: b, page } = await setupPuppeteer(htmlContent);
    browser = b;
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
      timeout: 300000,
    });

    return pdf;
  } catch (error) {
    console.error("Puppeteer error:", error);
    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }
  }
};

const docxToPdf = async (docxBuffer) => {
  try {
    console.log(
      "Converting DOCX to PDF using Mammoth with enhanced table support..."
    );

    const options = {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h2:fresh",
        "p[style-name='Heading 2'] => h3:fresh",
        "p[style-name='Body Text'] => p:fresh",
        "p[style-name='Table Paragraph'] => p:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "r[style-name='Highlight'] => mark",
        // Enhanced table support
        "table => table:table",
        "tr => tr:table-row",
        "td => td:table-cell",
        "th => th:table-header-cell",
      ],
      transformDocument: (element) => {
        // Custom transformations for tables
        if (element.type === "table") {
          // Ensure table has proper structure
          element.attributes = {
            class: "enhanced-table",
            style: "border-collapse: collapse; width: 100%; margin: 20px 0;",
          };
        }
        if (element.type === "tableRow") {
          element.attributes = { class: "table-row" };
        }
        if (element.type === "tableCell") {
          element.attributes = {
            class: "table-cell",
            style: "border: 1px solid #ddd; padding: 8px; vertical-align: top;",
          };
        }
        return element;
      },
    };

    const resultHtml = await mammoth.convertToHtml({
      buffer: docxBuffer,
      ...options,
    });

    if (resultHtml.messages && resultHtml.messages.length > 0) {
      console.log("Mammoth conversion messages:", resultHtml.messages);
    }
    const enhancedHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    /* General styling */
                    .title-style {
                        font-size: 24px;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 20px;
                    }
                    h1 { font-size: 28px; color: #2c3e50; margin-bottom: 20px; }
                    h2 { font-size: 24px; color: #34495e; margin-bottom: 16px; }
                    h3 { font-size: 20px; color: #7f8c8d; margin-bottom: 14px; }
                    p { line-height: 1.6; margin-bottom: 12px; }
                    strong { font-weight: bold; color: #e74c3c; }
                    em { font-style: italic; color: #3498db; }

                    /* Enhanced table styling */
                    .enhanced-table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 20px 0;
                        font-family: Arial, sans-serif;
                        border: 2px solid #34495e;
                    }

                    .enhanced-table th {
                        background-color: #34495e;
                        color: white;
                        font-weight: bold;
                        padding: 12px 8px;
                        text-align: left;
                        border: 1px solid #2c3e50;
                        font-size: 14px;
                    }

                    .enhanced-table td {
                        padding: 10px 8px;
                        border: 1px solid #bdc3c7;
                        vertical-align: top;
                        font-size: 13px;
                        line-height: 1.4;
                    }

                    .enhanced-table tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }

                    .enhanced-table tr:hover {
                        background-color: #e9ecef;
                    }

                    /* Table cell content styling */
                    .enhanced-table p {
                        margin: 0 0 8px 0;
                        line-height: 1.4;
                    }

                    .enhanced-table p:last-child {
                        margin-bottom: 0;
                    }

                    /* Responsive table */
                    @media (max-width: 768px) {
                        .enhanced-table {
                            font-size: 12px;
                        }
                        .enhanced-table th,
                        .enhanced-table td {
                            padding: 6px 4px;
                        }
                    }
                </style>
            </head>
            <body>
                ${resultHtml.value}
            </body>
            </html>
        `;

    const pdfBuffer = await htmlToPdf(enhancedHtml);

    console.log("Enhanced Mammoth conversion with table support successful");
    return pdfBuffer;
  } catch (error) {
    console.error("Enhanced Mammoth conversion error:", error);
    throw error;
  }
};

const createJob = (
  jobId,
  originalFileName,
  convertedFileName,
  fileType,
  userName,
  fullName,
  jobResult,
  timeStamp,
  fileSize,
  pdfSize,
  downloadUrl
) => {
  const job = {
    jobId,
    originalFileName,
    convertedFileName,
    fileType,
    userName,
    fullName,
    jobResult,
    timeStamp,
    fileSize,
    pdfSize,
    downloadUrl,
  };
  return job;
};


// Creating jobs csv file and adding the job
const addJobToCSV = (jobs) => {
  try {
    const csvData = parse(jobs, [
      "jobId",
      "originalFileName",
      "convertedFileName",
      "fileType",
      "userName",
      "jobResult",
      "timeStamp",
      "fileSize",
      "pdfSize",
      "downloadUrl",
    ]);

    // Write to jobs.csv file
    fs.writeFileSync(path.join(__dirname, "../jobs.csv"), csvData);

    console.log("jobs.csv created successfully");
  } catch (csvError) {
    console.error("CSV creation error:", csvError);
  }
};

// Function that parses the csv data and adds the job into the database
const parseCSVIntoDatabase = () => {
  const db = new sqlite3.Database("jobs.db");
  // Create Jobs table
  db.serialize(() => {
    db.run(`
          CREATE TABLE IF NOT EXISTS Jobs (
            jobId TEXT PRIMARY KEY,
            originalFileName TEXT,
            convertedFileName TEXT,
            fileType TEXT,
            userName TEXT,
            jobResult TEXT,
            timeStamp TEXT,
            fileSize INTEGER,
            pdfSize INTEGER,
            downloadUrl TEXT
          )
          `);
  });

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO Jobs 
    (jobId, originalFileName, convertedFileName, fileType, userName, jobResult, timeStamp, fileSize, pdfSize, downloadUrl) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Read CSV and insert into SQLite
  fs.createReadStream(path.join(__dirname, "../jobs.csv"))
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
    .on("data", (row) => {
      stmt.run(
        row.jobId || `job-${Date.now()}`,
        row.originalFileName || "unknown",
        row.convertedFileName || "unknown.pdf",
        row.fileType || "unknown",
        row.userName || "anonymous",
        row.jobResult || "success",
        row.timeStamp || new Date().toISOString(),
        parseInt(row.fileSize) || 0,
        parseInt(row.pdfSize) || 0,
        row.downloadUrl || ""
      );
    })
    .on("end", () => {
      stmt.finalize();
      console.log("CSV data inserted into SQLite");

      // Verify by printing all rows
      db.each("SELECT * FROM Jobs", (err, row) => {
        console.log("Row from DB:", row);
      });

      db.close();
    });
};

const pushPdfDownloadUrlToS3 = async (pdfBuffer, uniquePdfName) => {
  const s3Client = new S3Client({
    region: 'ap-southeast-2'
  })

  const uploadCommand = new PutObjectCommand({
    Bucket: 'pdfconversions-abhinav-n11795611',
    Key: uniquePdfName,
    Body: pdfBuffer
  })

  await s3Client.send(uploadCommand);

  return { success: true, message: 'PDF download url pushed to S3' };
}

const handleFileConvert = async (req, res) => {
  try {
    const username = req.user ? req.user.username : "anonymous";
    const file = req.app.locals.uploadedFiles?.get(username);
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    console.log("Processing file:", file.originalname, "Size:", file.size);

    const fileName = file.originalname;
    const convertedFileName = fileName.replace(/\.(html|md|docx)$/, ".pdf");
    const fileExtension = fileName.split(".").pop().toLowerCase();

    let pdfBuffer;

    switch (fileExtension) {
      case "html":
        const htmlContent = file.buffer.toString("utf-8");
        pdfBuffer = await htmlToPdf(htmlContent);
        break;
      case "md":
        const { marked } = await import("marked");
        const markdownContent = marked(file.buffer.toString("utf-8"));
        pdfBuffer = await htmlToPdf(markdownContent);
        break;
      case "docx":
        pdfBuffer = await docxToPdf(file.buffer);
        break;
      default:
        return res.status(400).json({ message: "Unsupported file type" });
    }

    console.log("PDF generated, size:", pdfBuffer.length);

    const conversionsDir = path.join(__dirname, "../conversions");
    if (!fs.existsSync(conversionsDir)) {
      fs.mkdirSync(conversionsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const uniquePdfName = `${req.user.username}_${fileExtension}_${timestamp}.pdf`;
    const pdfPath = path.join(conversionsDir, uniquePdfName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    // Create job record BEFORE sending response
    try {
      const username = req.user ? req.user.username : "anonymous";
      const fullName = req.user ? req.user.fullName : "anonymous";
      const job = createJob(
        `${username}-${fileExtension}-${Date.now()}`,
        fileName,
        convertedFileName,
        fileExtension,
        username,
        fullName,
        "success",
        new Date().toISOString(),
        file.size,
        pdfBuffer.length,
        `/api/file/download/${uniquePdfName}`
      );
      jobs.jobs.push(job);

      // Write to jobs.json file
      fs.writeFileSync(
        path.join(__dirname, "../jobs.json"),
        JSON.stringify(jobs, null, 2)
      );
    } catch (jobError) {
      console.error("Job creation error:", jobError);
      // Don't fail the conversion if job creation fails
    }

    res.json({
      message: "File converted successfully",
      jobId: `${username}-${fileExtension}-${timestamp}`,
      originalFile: fileName,
      convertedFile: convertedFileName,
      downloadUrl: `/api/file/download/${uniquePdfName}`,
      fileSize: pdfBuffer.length,
    });
    addJobToCSV(jobs.jobs);
    parseCSVIntoDatabase();
    pushPdfDownloadUrlToS3(pdfBuffer, uniquePdfName);
  } catch (error) {
    console.error("Conversion error:", error);
    return res.status(500).json({
      message: "Conversion failed",
      error: error.message,
    });
  }
};

module.exports = { handleFileConvert };
