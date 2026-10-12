import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "full-app-ui-catalog.html");
const pdfPath = path.join(__dirname, "Talent-Mobility-Full-UI-Design.pdf");

if (!fs.existsSync(htmlPath)) {
  console.error("Missing", htmlPath);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  landscape: true,
  printBackground: true,
  margin: { top: "10mm", bottom: "12mm", left: "10mm", right: "10mm" },
});
await browser.close();
console.log("Wrote", pdfPath);
