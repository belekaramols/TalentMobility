# Full app UI design export

## PDF (all screens)

**[Talent-Mobility-Full-UI-Design.pdf](./Talent-Mobility-Full-UI-Design.pdf)** — single document with cover, table of contents, and **27 screen layouts** (including manual test assignment, assigned tests inbox, and full Q&A test detail history):

- Login
- Employee: Dashboard, New Test (5 steps + question + results), History, Profile, Skills, Opportunities, Analytics
- Manager: Dashboard, Team roster, Team assessments, Talent search, Candidate matching, Matching configuration, Audit, Configurations, **Manual test assignment**, **Assign test to employee**
- **Test detail history** (employee + manager) with correct/incorrect per question; **data model** note for SQL persistence

## Regenerate PDF

1. Edit [full-app-ui-catalog.html](./full-app-ui-catalog.html) if layouts change.
2. From PowerShell (Chrome installed):

```powershell
$html = "c:\Project\Planning\design\export\full-app-ui-catalog.html"
$pdf = "c:\Project\Planning\design\export\Talent-Mobility-Full-UI-Design.pdf"
$uri = "file:///" + ($html -replace '\\','/')
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdf" "$uri"
```

Optional: `node generate-pdf.mjs` after `npm init -y` and `npm install playwright` in this folder.

## Interactive prototype

[Test wizard only](../prototypes/test-wizard-figma-preview.html) — clickable flow for Competency → Technology → Skill level.
