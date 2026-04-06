

# Fix: Show Detail Adjustments in Tax Calculation UI

## Problem

The tax calculation includes detail adjustments from SIE accounts (8423 Räntekostnader, 8314 Skattefria ränteintäkter) in the computation of `skattemassigResultat`, but these rows are **hidden** in both the main page and the modal. Only the PDF shows them. This makes the numbers appear inconsistent — 28,374 + 0 - 11,435 does not equal 16,969.

## Fix

### 1. TaxCalculationSection.tsx — Add detail adjustment rows

After the "Ej avdragsgilla kostnader" row (line ~71) and before "Outnyttjat underskott" (line ~72), insert a loop over `s.detailAdjustments` showing each adjustment with its label and signed amount.

### 2. VerificationModal.tsx — Add detail adjustment rows

Same change: after the "Ej avdragsgilla kostnader" conditional row (line ~67) and before "Outnyttjat underskott" (line ~68), add the detail adjustment rows with proper sign display (+ for positive, - for negative).

Both will iterate `s.detailAdjustments` and render a table row for each, matching the format already used in the PDF export.

