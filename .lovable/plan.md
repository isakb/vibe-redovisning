

# Multi-File Upload, Year Navigation & Company Profile

## What We're Building

1. **Multi-file upload** — Accept multiple .si/.se files, merge their data into a unified state covering all available fiscal years
2. **Year selector** — Navigate between years, each with its own editable ReportData
3. **Company profile** — Persistent (localStorage) profile storing verksamhetsbeskrivning, board members, and other reusable info that auto-populates new reports

## Data Architecture

```text
localStorage keys:
  "k2-company-{orgNumber}"  → CompanyProfile (verksamhetsbeskrivning, signatories, plats)
  "k2-reports-{orgNumber}"  → Record<yearIndex, ReportData>

In-memory:
  MergedSieData = merged accounts, balances, results, fiscal years from all uploaded files
```

## Technical Changes

### `src/lib/sieParser.ts`
- New `mergeSieData(files: SieData[]): SieData` function — merges fiscal years, accounts, balances, results, and verifications from multiple SIE files. Deduplicates by year index. Company info taken from the file with the latest fiscal year.

### `src/lib/k2Types.ts`
- New `CompanyProfile` interface: `{ orgNumber, name, verksamhetsbeskrivning, signatories, plats }`
- New helpers: `loadCompanyProfile(orgNumber)`, `saveCompanyProfile(profile)`, `loadYearReports(orgNumber)`, `saveYearReports(orgNumber, data)`

### `src/components/FileUpload.tsx`
- Accept multiple files (`multiple` attribute on input)
- Parse all files, merge via `mergeSieData`, then pass merged data up
- Show list of uploaded files with remove option

### `src/pages/Index.tsx`
- After SIE data is loaded, load/create CompanyProfile from localStorage
- Pass profile + per-year report data to ReportWizard

### `src/components/ReportWizard.tsx`
- Add year selector tabs/dropdown showing all available fiscal years
- Maintain `Record<number, ReportData>` for per-year report data
- On year switch, load/create that year's ReportData (pre-populated from CompanyProfile defaults)
- Auto-save all state to localStorage on changes
- New "Företagsprofil" section/dialog for editing persistent company info

### `src/components/CompanyProfile.tsx` (new)
- Card/dialog for editing company profile fields: verksamhetsbeskrivning, board members (signatories), plats
- Changes save to localStorage and propagate to current report's defaults

### Persistence Flow
1. User uploads one or more .si files → merged into single SieData
2. On load, check localStorage for existing CompanyProfile by orgNumber → pre-fill ReportData defaults
3. Each year's ReportData auto-saves to localStorage on edit
4. Company profile changes update localStorage and optionally sync to current year's ReportData

