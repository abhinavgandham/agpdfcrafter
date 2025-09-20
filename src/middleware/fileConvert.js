const puppeteer = require("puppeteer");
const mammoth = require("mammoth");
const { 
  S3Client, PutObjectCommand, GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { insertJob } = require("../cloudservices/dynamodb.js");

/**
 * Function to setup Puppeteer, which is used to convert html and md content to PDF.
 * @param {string} content - The content to convert to PDF.
 * @returns {Promise<{browser: Browser, page: Page}>} - The browser and page.
 */
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

/**
 * Function to convert html content to PDF.
 * @param {string} htmlContent - The html content to convert to PDF.
 * @returns {Promise<Buffer>} - The PDF buffer that is generated.
 */
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

/**
 * Function to convert docx content to PDF.
 * @param {Buffer} docxBuffer - The docx buffer to convert to PDF.
 * @returns {Promise<Buffer>} - The PDF buffer that is generated.
 */
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

/**
 * Function to push the PDF download URL to S3.
 * @param {Buffer} pdfBuffer - The PDF buffer to push to S3.
 * @param {string} uniquePdfName - The unique name of the PDF.
 * @returns {Promise<{success: boolean, message: string, downloadUrl: string}>} - The result of the operation.
 */
const pushPdfDownloadUrlToS3 = async (pdfBuffer, uniquePdfName) => {
  try {
    const s3Client = new S3Client({
      region: 'ap-southeast-2'
    })

    const uploadCommand = new PutObjectCommand({
      Bucket: 'pdfconversions-abhinav-n11795611',
      Key: `conversions/${uniquePdfName}`,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    })

    await s3Client.send(uploadCommand);
    console.log(`✅ File uploaded to S3: conversions/${uniquePdfName}`);
    
    // Generate presigned URL for download
    const downloadCommand = new GetObjectCommand({
      Bucket: 'pdfconversions-abhinav-n11795611',
      Key: `conversions/${uniquePdfName}`
    });
    
    const downloadUrl = await getSignedUrl(s3Client, downloadCommand, { 
      expiresIn: 3600 // 1 hour
    });
    
    console.log(`✅ Presigned URL generated for: ${uniquePdfName}`);
    return { success: true, message: 'PDF uploaded to S3', downloadUrl };
  } catch (error) {
    console.error('❌ S3 upload error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Function to handle the file conversion.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<void>} - The result of the operation.
 */
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

    const timestamp = Date.now();
    const uniquePdfName = `${req.user.username}_${fileExtension}_${timestamp}.pdf`;

    // Upload to S3 and get presigned URL
    const s3Result = await pushPdfDownloadUrlToS3(pdfBuffer, uniquePdfName);
    const downloadUrl = s3Result.success ? s3Result.downloadUrl : `/api/file/download/${uniquePdfName}`;

    // Create job record in DynamoDB BEFORE sending response
    try {
      const username = req.user ? req.user.username : "anonymous";
      const jobId = `${username}-${fileExtension}-${timestamp}`;
      
      // Insert Job into DynamoDB
      await insertJob(
        'n11795611@qut.edu.au',
        jobId,
        fileName,
        convertedFileName,
        fileExtension,
        username,
        "success",
        new Date().toISOString(),
        file.size,
        pdfBuffer.length,
        downloadUrl
      );
    } catch (jobError) {
      console.error("DynamoDB job creation error:", jobError);
    }

    res.json({
      message: "File converted successfully",
      jobId: `${username}-${fileExtension}-${timestamp}`,
      originalFile: fileName,
      convertedFile: convertedFileName,
      downloadUrl: downloadUrl,
      fileSize: pdfBuffer.length,
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return res.status(500).json({
      message: "Conversion failed",
      error: error.message,
    });
  }
};

module.exports = { handleFileConvert };
