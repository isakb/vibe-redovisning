

# Fix: Balance Sheet Must Reflect Calculated Tax When Missing from SIE

## Problem

When the SIE file lacks tax bookings (no entries on accounts 8910/2512), the balance sheet reads raw SIE data where:
- Account 2099 (årets resultat) = 0 kr
- Account 2512 (skatteskuld) = 0 kr

This creates a 28,374 kr gap (= the full pre-tax result). The system already calculates the correct tax (5,845) and årets resultat (22,529), but never feeds those back into the balance sheet.

## Solution

When `saknarSkattebokning` is true, virtually inject two adjustments into the balance sheet:

1. **Årets resultat** (account 2099): add the calculated post-tax result (e.g. 22,529 kr) to equity
2. **Skatteskuld** (account 2512): add the calculated tax (e.g. 5,845 kr) to kortfristiga skulder

Together these equal the pre-tax result (28,374), closing the gap exactly.

## Technical Changes

### `src/lib/k2Calculations.ts`
- Change `calculateBalanceSheet` signature to accept an optional `taxAdjustment?: { aretsResultat: number; skatteskuld: number }`
- When provided, add `taxAdjustment.aretsResultat` to the `aretsResultatEK` line (account 2099)
- Add `taxAdjustment.skatteskuld` to `kortfristigaSkulder` (account 2512 range)
- This flows through to `summaEgetKapital` and `summaEKochSkulder` automatically

### `src/components/ReportWizard.tsx`
- Pass the tax adjustment from `skatteberakning` into `calculateBalanceSheet`:
  ```
  const taxAdj = skatteberakning.saknarSkattebokning
    ? { aretsResultat: skatteberakning.aretsResultat, skatteskuld: skatteberakning.skattPaAretsResultat }
    : undefined;
  ```
- This requires reordering the `useMemo` calls so `skatteberakning` is computed before `balanceSheet`

### Impact
- Balance warning disappears when the numbers match
- Soliditet, flerårsöversikt, and PDF all use correct post-tax figures
- No changes needed to ReportPreview, PDF export, or other consumers — they already read from the balance sheet output

