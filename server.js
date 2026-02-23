const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("PDF Service Running 🚀");
});

// Generate PDF Route
app.post("/generate-pdf", async (req, res) => {
  let browser;

  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: "HTML content required" });
    }

    // Launch Puppeteer (Render-safe config)
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      margin: {
        top: "80px",
        bottom: "80px",
        left: "50px",
        right: "50px",
      },
      headerTemplate: `
        <div style="font-size:10px; text-align:center; width:100%;">
          Agreement to Sell
        </div>
      `,
      footerTemplate: `
        <div style="font-size:10px; text-align:center; width:100%;">
          Page <span class="pageNumber"></span> of 
          <span class="totalPages"></span>
        </div>
      `,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=agreement.pdf",
    });

    return res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF Generation Error:", error);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({ error: "PDF generation failed" });
  }
});

// ✅ IMPORTANT: Use Render dynamic port
const PORT = process.env.PORT || 2000;

app.listen(PORT, () => {
  console.log(`PDF Server running on port ${PORT}`);
});