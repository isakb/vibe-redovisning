

# Fix Tax Adjustment Signs in Skatteberäkning

## Analysis

Two detail adjustment lines are shown in the tax calculation:

1. **8423 Räntekostnader för skatter och avgifter (+29 kr)** — Non-deductible expense. Since it already reduced the accounting result, it must be **added back** to get taxable income. **"+ 29" is CORRECT.**

2. **8314 Skattefria ränteintäkter (+1 kr)** — Tax-exempt income. Since it already increased the accounting result, it must be **subtracted** to get taxable income. **Should show "- 1", not "+ 1". This is a BUG.**

## Impact on Tax Amount

- Current (wrong): 28 374 + 29 + 1 - 11 435 = **16 969** → rounded 16 960 → tax = 3 493
- Correct: 28 374 + 29 - 1 - 11 435 = **16 967** → rounded 16 960 → tax = 3 493

Same tax amount due to rounding in this case, but the sign and intermediate sum are wrong and would matter with different numbers.

## Fix

**One line change in `src/lib/k2Calculations.ts` (line 550):**

Change `const skattefriaRantor = -sumRange(res, selectedYearIndex, 8314, 8314);` to `const skattefriaRantor = sumRange(res, selectedYearIndex, 8314, 8314);`

This removes the sign inversion for 8314. Since income accounts are stored as negative (credit) in SIE, `sumRange` already returns -1, which correctly represents a subtraction from taxable income.

The PDF and modal display logic already handles the sign: negative amounts show as "- X kr", positive as "+ X kr".

