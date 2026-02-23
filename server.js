const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.send("PDF Service Running 🚀");
});

app.post("/generate-pdf", async (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: "HTML content required" });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

    res.send(pdfBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

const PORT = 2000;
app.listen(PORT, () => {
  console.log(`PDF Server running on port ${PORT}`);
});