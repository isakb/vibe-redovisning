

# Fix: Inject Calculated Tax into Income Statement When Missing from SIE

## Problem

When `saknarSkattebokning` is true (no tax booked in SIE file), the income statement shows:
- Skatt på årets resultat: **0 kr**
- Årets resultat: **28 374 kr** (same as pre-tax)

It should show:
- Skatt på årets resultat: **-3 493 kr**
- Årets resultat: **24 881 kr**

The balance sheet and flerårsöversikt already receive a `taxAdjustment` — the income statement does not.

## Root Cause

`calculateIncomeStatement` reads tax from SIE accounts 8900-8989 (line 140). When no tax is booked, these are 0. The skatteberäkning is computed *after* the income statement, so the calculated tax is never fed back.

## Fix

**`src/components/ReportWizard.tsx`**: After computing `skatteberakning`, create an adjusted income statement using a new helper or inline logic. When `saknarSkattebokning` is true, override the "Skatt på årets resultat" amounts and "Årets resultat" amounts in the sections with the calculated values.

Specifically, create a `useMemo` that derives `adjustedIncomeStatement` from `incomeStatement` + `skatteberakning`:
- Find the last section containing "Skatt på årets resultat" and "Årets resultat"
- Replace their amounts for `selectedYearIndex` with `-skatteberakning.skattPaAretsResultat` and `skatteberakning.aretsResultat` respectively
- Update `totalResult` accordingly
- Pass `adjustedIncomeStatement` instead of `incomeStatement` to `ReportEditor`, `ReportPreview`, and PDF export

This avoids circular dependencies and keeps the core calculation pure.

## Technical Details

- Only the current year index is adjusted; previous year keeps its original SIE values
- The adjustment only applies when `skatteberakning.saknarSkattebokning` is true
- `totalResult` must also be updated so downstream consumers (like `tillBalanseratResultat`) get the correct value

