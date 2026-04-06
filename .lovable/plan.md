

# Verification Modal & PDF Export for Tax/Result Bookings

## Summary

Move the verification proposals (Skatt + Årets resultat) out of the main edit page into a **modal dialog**. Add an "Accept" action that marks the verifications as accepted (treating them as if booked in the SIE). Add a **PDF download** button that generates a document matching the uploaded reference style.

## Current State

- `TaxCalculationSection.tsx` renders verifications inline when `saknarSkattebokning` is true
- `Skatteberakning` interface already has `skatteverifikation`, `resultatverifikation`, `bokforingsdatum`
- The tax calculation also includes `ejAvdragsgillaPoster`, `outnyttjatUnderskott` etc., but the reference PDF shows additional detail lines (account 8423 räntekostnader, account 8314 skattefria ränteintäkter) that we should include

## Plan

### Step 1: Create `VerificationModal` component

A new component `src/components/VerificationModal.tsx` using the existing `Dialog` component:
- Trigger button: "Visa bokföringsförslag" in the TaxCalculationSection (replaces the inline tables)
- Content: Shows both verification tables (Skatt + Årets resultat) in a clean modal
- Actions:
  - **"Godkänn"** button — sets a state flag `verifikationerGodkanda: boolean` on `ReportData`
  - **"Ladda ner PDF"** button — generates a skatteberäkning PDF
  - **"Stäng"** button

### Step 2: Add `verifikationerGodkanda` to `ReportData` in `k2Types.ts`

- New boolean field, default `false`
- When accepted, the balance sheet and income statement should treat the tax/result entries as if they exist (current `taxAdjustment` logic already does this — just need to persist the acceptance)

### Step 3: Remove inline verification tables from `TaxCalculationSection`

- Replace with a button to open the modal
- Show a badge/status indicating whether verifications are accepted

### Step 4: Generate Skatteberäkning PDF

New function in `pdfExport.ts` (or a separate file) that produces a PDF matching the reference:
- Title: "Skatteberäkning"
- Subtitle: company name + fiscal year period
- Disclaimer: "Notera! Det här är inte en deklarationsblankett..."
- Table with:
  - Resultat före skatt
  - Ej avdragsgilla kostnader (with account references from SIE)
  - Skattefria intäkter (from SIE accounts)
  - Outnyttjat underskott
  - Summa (överskott/underskott)
  - Beskattningsbar inkomst (rounded down to nearest 10)
  - Skattesats
  - Årets skatt (rounded down)
- Then the two verification tables (Skatt + Årets resultat)
- Footer with creation date

### Step 5: Wire up in `ReportWizard`

- Pass modal state and handlers through to `TaxCalculationSection`
- The modal is self-contained, triggered from the tax section

## Technical Details

- The modal uses existing `Dialog`/`DialogContent` from `src/components/ui/dialog.tsx`
- PDF generation uses existing `jsPDF` + `autoTable` already in the project
- The skatteberäkning PDF includes rounding logic: `beskattningsbarInkomst = Math.floor(skattemassigResultat / 10) * 10`, and `aretsSkatt = Math.floor(beskattningsbarInkomst * skattesats)`
- `Skatteberakning` interface needs new fields: `beskattningsbarInkomst`, detail adjustment lines from SIE accounts (8423, 8314, etc.)

