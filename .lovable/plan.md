

# Plan: K2 Compliance Gap Analysis & Implementation

## Current State vs PRD Requirements

After comparing the PRD (BFNAR 2016:10) against the current codebase, here are the gaps organized by priority.

---

## Phase 1 — P0: Critical Compliance Gaps

### 1. Balance Verification (FR-SIE-030)
**Gap:** No check that total assets = total equity + liabilities.
**Fix:** Add a warning banner in ReportEditor/ReportPreview when the balance doesn't match. Simple comparison of `totalAssets` vs `totalEquityAndLiabilities`.

### 2. Abbreviated Form Support (FR-IS-040, FR-BS-041)
**Gap:** Only full form exists. K2 requires support for the abbreviated ("förkortad") form.
**Fix:** Add a toggle in ReportData (`useAbbreviatedForm: boolean`). When enabled:
- Income statement shows "Bruttoresultat" instead of detailed revenue/cost breakdown
- Balance sheet uses fewer line items
- Note 18.8A (nettoomsättning) becomes mandatory

### 3. Obeskattade reserver / Bokslutsdispositioner (FR-IS-030)
**Gap:** Balance sheet lacks "Obeskattade reserver" section (accounts 2100-2199 overlap with current långfristiga skulder range). Income statement lacks "Bokslutsdispositioner" section.
**Fix:**
- Add accounts 2100-2149 as obeskattade reserver in balance sheet
- Add accounts 8800-8899 as bokslutsdispositioner in income statement
- Re-map långfristiga skulder to 2300-2399

### 4. Avsättningar (Provisions)
**Gap:** Balance sheet lacks provisions section (accounts 2200-2299).
**Fix:** Add between obeskattade reserver and skulder.

### 5. Previous Year Comparison in Columns (FR-IS-041)
**Gap:** The preview uses hardcoded year indices `0` and `-1` instead of `selectedYearIndex` and `selectedYearIndex - 1`. This breaks when viewing non-latest years.
**Fix:** Pass `selectedYearIndex` to ReportPreview and use it for column headers.

---

## Phase 2 — P1: Required Sections & Notes

### 6. Expanded Notes (Chapter 18)
**Gap:** Only Note 1 (redovisningsprinciper) and Note 2 (medelantal anställda) exist. Missing:
- **Not 3: Nettoomsättning** (18.8A) — mandatory for abbreviated form, show current + previous year
- **Not 4: Avskrivningsgrunder** (18.4) — conditional, when depreciable assets exist
- **Not 5: Anläggningstillgångar** (18.10) — table with opening value, additions, disposals, depreciation, closing value
- **Not 6: Ställda säkerheter** (18.13-14) — conditional
- **Not 7: Eventualförpliktelser** (18.15-16) — conditional, "Inga" if none

**Fix:** Add editable note sections. Auto-detect which are relevant from SIE data (e.g., if accounts 1100-1299 have balances → show fixed assets note). Each note is a card with text/table editor.

### 7. Förvaltningsberättelse — Missing Subsections
**Gap:** Missing "Bolagets säte" (registered office) and "Egna aktier" (treasury shares) sections.
**Fix:**
- Add `bolagetsSate: string` to ReportData, auto-populate from company profile
- Add conditional "Egna aktier" section (hidden by default, toggle to show)

### 8. Resultatdisposition — Full Calculation
**Gap:** Resultatdisposition should show the full breakdown: balanserat resultat from previous year + årets resultat = fritt eget kapital, then disposition (utdelning + ny räkning).
**Fix:** Calculate and display: "Balanserat resultat: X kr, Årets resultat: Y kr, Totalt: Z kr" before the disposition.

### 9. PDF Export — Missing Sections
**Gap:** PDF doesn't include skatteberäkning or verifikationsförslag.
**Fix:** Add skatteberäkning section to PDF when `saknarSkattebokning` is true. Include both verification tables.

### 10. PDF — Flerårsöversikt Uses SIE Data Only
**Gap:** PDF export doesn't use manual overrides from `flerarsOverrides`.
**Fix:** Merge overrides into PDF flerårsöversikt data.

---

## Phase 3 — P2: Nice-to-Have

### 11. SIE Validation (FR-SIE-031)
**Gap:** No #KSUMMA checksum validation.
**Fix:** Parse #KSUMMA and validate during import, show warning if mismatch.

### 12. Full/Abbreviated Form Toggle (FR-OVR-002)
**Gap:** No UI toggle.
**Fix:** Add toggle switch in report header. Affects income statement and balance sheet rendering.

### 13. Modified Field Indicators (FR-OVR-001)
**Gap:** No visual indicator for manually overridden fields.
**Fix:** Track which fields have been modified, show a small badge/dot.

### 14. Corner Case Detection (Table 6 in PRD)
**Gap:** No smart prompts for exceptional items, name changes, first-year K2 etc.
**Fix:** Add a "Compliance Checks" panel that scans data and flags items needing attention.

---

## Technical Changes Summary

| File | Changes |
|------|---------|
| `k2Calculations.ts` | Add bokslutsdispositioner section to income statement; add obeskattade reserver + avsättningar to balance sheet; fix account ranges |
| `k2Types.ts` | Add `useAbbreviatedForm`, `bolagetsSate`, `stallda_sakerheter`, `eventualforpliktelser`, note-related fields |
| `ReportEditor.tsx` | Add balance check warning, expanded notes cards, bolagets säte field |
| `ReportPreview.tsx` | Fix hardcoded year indices, add new sections, abbreviated form rendering |
| `pdfExport.ts` | Add skatteberäkning, use flerårsOverrides, add expanded notes |
| `TaxCalculationSection.tsx` | No changes needed |
| `sieParser.ts` | Add #KSUMMA parsing and validation |
| New: `NotesEditor.tsx` | Component for managing all K2 notes with auto-detection |

## Recommended Implementation Order

1. **Balance sheet account re-mapping** (obeskattade reserver, avsättningar) + balance verification warning
2. **Bokslutsdispositioner** in income statement
3. **Fix year index hardcoding** in ReportPreview
4. **PDF: add skatteberäkning + flerårs overrides**
5. **Expanded notes** (Not 3-7)
6. **Förvaltningsberättelse subsections** (säte, egna aktier, resultatdisposition breakdown)
7. **Abbreviated form toggle**
8. **Corner case detection & validation**

