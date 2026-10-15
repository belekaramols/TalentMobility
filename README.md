# Talent Mobility & Growth

Full-stack internal platform: **React + TypeScript** SPA, **ASP.NET Core 8** API, **EF Core**, **SQL Server** (`TalentMobility` database).

## Repository layout

```
talent-mobility-platform/
  database/CreateDatabase.sql
  src/
    TalentMobility.Api/          # HTTP API, auth cookies, Swagger
    TalentMobility.Application/  # DTOs, contracts
    TalentMobility.Domain/       # Entities, enums
    TalentMobility.Infrastructure/ # EF Core, services, seed
    TalentMobility.Web/          # Vite React UI
  design/                        # (optional) copy from Planning/design
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20.19+](https://nodejs.org/)
- SQL Server Express: `localhost\SQLEXPRESS`

## Database

1. Optional: run `database/CreateDatabase.sql` in SSMS.
2. Or let the API create the database on first run (`EnsureCreated` + seed).

**Connection string** — edit `src/TalentMobility.Api/appsettings.json`:

```json
"DefaultConnection": "Data Source=localhost\\SQLEXPRESS;Initial Catalog=TalentMobility;Integrated Security=True;Persist Security Info=False;Pooling=False;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Application Name=TalentMobility.Api"
```

Use your environment’s server name and catalog; do not commit production secrets.

## Run locally

```powershell
# API
cd src\TalentMobility.Api
dotnet restore
dotnet run

# Web (new terminal)
cd src\TalentMobility.Web
npm install
npm run dev
```

- API: https://localhost:7241/swagger  
- UI: http://localhost:5173 (proxies `/api` to the API)

## Seed users (Phase 1 manual login)

| Email | Role | Password |
|-------|------|----------|
| amol.belekar@tothenew.com | Employee | `ChangeMe@Dev` |
| rahul.kumar@tothenew.com | Employee | `ChangeMe@Dev` |
| team.lead@tothenew.com | Manager | `ChangeMe@Dev` |

## Features implemented

- Role-based navigation (employee / manager)
- Assessment wizard: **Competency → Technology → Skill level**
- 10 questions per attempt (template generator; plug in OpenAI via `IQuestionGenerator`)
- **Full attempt history** with per-question correct/incorrect in SQL (`AttemptQuestions`)
- **Manager manual test assignment** + configuration toggle
- Manager team dashboard, audit log, matching weights

## Push to GitHub

```powershell
cd talent-mobility-platform
git init
git add .
git commit -m "Initial Talent Mobility platform"
git remote add origin <your-repo-url>
git push -u origin main
```

## Tests

```powershell
dotnet build TalentMobility.sln
dotnet test TalentMobility.sln

cd src\TalentMobility.Web
npm.cmd run build
npm.cmd test
```

Add `dotnet ef migrations` when moving from `EnsureCreated` to migration-based deployments.
