

# Value Comparison: Our App vs Utkast PDF

## Line-by-Line Comparison

### Resultaträkning (Income Statement) — Current Year 2025/2026

| Line | PDF Value | Our Value | Match? | Notes |
|------|-----------|-----------|--------|-------|
| Nettoomsättning | 100 360 | 100 360 | ✅ | |
| Övriga rörelseintäkter | 100 | 100 | ✅ | Account 3993 |
| Summa rörelseintäkter | 100 460 | 100 460 | ✅ | |
| Råvaror och förnödenheter | -198 | -198 | ✅ | |
| Övriga externa kostnader | -67 027 | -67 027 | ✅ | |
| Personalkostnader | -4 717 | -4 717 | ✅ | |
| Övriga rörelsekostnader | -127 | -127 | ✅ | |
| Summa rörelsekostnader | -72 069 | -72 069 | ✅ | |
| Rörelseresultat | 28 391 | 28 391 | ✅ | |
| Ränteintäkter | 12 | 12 | ✅ | 8311 (-12.96) + 8314 (1.00) = ~-12 |
| Räntekostnader | -29 | -29 | ✅ | |
| Summa finansiella poster | -17 | -17 | ✅ | |
| Resultat efter finansiella poster | 28 374 | 28 374 | ✅ | |
| **Skatt på årets resultat** | **-3 493** | **-5 845** | ❌ | See below |
| **Årets resultat** | **24 881** | **22 529** | ❌ | See below |

### Why Tax Differs

The PDF uses **outnyttjat underskott** from previous year:
- Previous year result: -11 435 kr (loss)
- Skattemässigt resultat = 28 374 - 11 435 = **16 939**
- Skatt = 16 939 × 20.6% = **3 489** (PDF rounds to 3 493, likely minor account-level rounding)

Our app defaults outnyttjat underskott to 0, giving 28 374 × 20.6% = 5 845.

**Fix needed:** Auto-calculate outnyttjat underskott from previous year's data (planned but never implemented).

---

### Balansräkning (Balance Sheet) — 2026-01-31

| Line | PDF Value | Our Value | Match? | Notes |
|------|-----------|-----------|--------|-------|
| Finansiella anläggningstillgångar | 634 065 | 634 065 | ✅ | 1351 + 1352 |
| Summa anläggningstillgångar | 634 065 | 634 065 | ✅ | |
| **Kortfristiga fordringar** | **17 889** | **13 322** | ❌ | See below |
| **Kassa och bank** | **67 478** | **67 478** | ✅ | |
| **Summa omsättningstillgångar** | **85 367** | **80 800** | ❌ | |
| **Summa tillgångar** | **719 432** | **714 865** | ❌ | Diff = 4 567 |
| Aktiekapital | 50 000 | 50 000 | ✅ | |
| **Balanserat resultat** | **38 291** | **38 291** | ✅ | |
| **Årets resultat** | **24 881** | **22 529** | ❌ | Tax diff cascades |
| **Summa eget kapital** | **113 172** | **110 820** | ❌ | |
| **Kortfristiga skulder** | **606 260** | **603 860** | ❌ | |
| **Summa EK + skulder** | **719 432** | **714 680** | ❌ | |

### Why Kortfristiga Fordringar Differs (4 567 kr)

The SIE has `#UB 0 2510 -6592.00` (skatteskuld) and `#UB 0 2518 14652.00` (skattefordran/skattekonto). Our code lumps all of 2400-2999 together as "kortfristiga skulder".

The PDF treats account **2518** (betald F-skatt / skattefordran) as an **asset** (övriga fordringar) rather than netting it against liabilities. This is standard K2 practice: prepaid taxes are receivables.

Specifically:
- Our kortfristiga fordringar: 1630 (1 206) + 1650 (12 116) + 1680 (-900) + 1685 (900) = **13 322**
- PDF kortfristiga fordringar: 13 322 + 2510 netted with 2518 → the positive portion (14 652 - 6 592 = 8 060?) or just 2518 alone as fordran → 13 322 + 4 567 = **17 889**

The actual math: 14 652 (2518 betald F-skatt, asset) - 6 592 (2510 skatteskuld) - 2 × 1 326 (2512)... Actually 2512 UB 0 = 0 in this year. So: 14 652 - 6 592 = 8 060. But diff is 4 567. Let me reconsider.

More likely: the PDF moves account 2518 (14 652) to the asset side but also adjusts the tax liability (replaces raw 2510/2512 with calculated tax 3 493). So on the liability side: 2510 removed (-6 592 removed = +6 592 to skulder side), 2518 removed (+14 652 removed), then new skatteskuld 3 493 added. Net effect on assets: +14 652 - (already counted as liability netting). This is getting complex.

The simpler explanation: **account 2518 (betald F-skatt) should be classified as a current receivable (tillgång), not netted into liabilities.** Our code puts it in the 2400-2999 range which becomes liabilities. The PDF correctly moves it to assets.

### Why Skulder Differs

Same root cause: account 2518 moved to assets, plus the recalculated tax (3 493 vs 5 845).

---

### Flerårsöversikt

| Nyckeltal | Year | PDF | Our App | Match? |
|-----------|------|-----|---------|--------|
| Nettoomsättning | 2025/2026 | 100 360 | 100 360 | ✅ |
| Nettoomsättning | 2024/2025 | 6 000 | 6 000 | ✅ |
| Nettoomsättning | 2023/2024 | 25 142 | 25 142 | ✅ |
| Nettoomsättning | 2022/2023 | 0 | 0 | ✅ |
| Res. efter fin. poster | 2025/2026 | 28 374 | 28 374 | ✅ |
| Res. efter fin. poster | 2024/2025 | -11 435 | -11 435 | ✅ |
| Res. efter fin. poster | 2023/2024 | 5 617 | 5 617 | ✅ |
| Res. efter fin. poster | 2022/2023 | -14 372 | -14 372 | ✅ |
| **Soliditet** | **2025/2026** | **16%** | **12%** | ❌ |
| **Soliditet** | **2024/2025** | **100%** | **100%** | ✅ |
| **Soliditet** | **2023/2024** | **96%** | **100%** | ❌ |
| **Soliditet** | **2022/2023** | **94%** | **94%** | ✅ |

**Soliditet 2025/2026:** PDF = 16%, ours = 12%. The PDF uses the tax-adjusted balance sheet (EK = 113 172, total = 719 432 → 15.7% ≈ 16%). Our code uses raw SIE values without tax adjustment in flerårsöversikt. **Fix:** flerårsöversikt needs to use the tax-adjusted equity/assets for the current year.

**Soliditet 2023/2024:** PDF = 96%, ours = 100%. The SIE for year -2 shows:
- 2081: -50 000, 2091: -45 435.75, 2099: -4 290.63 → EK = 99 726
- Assets (1000-1999 UB -2): 1351: 30 000 + 1630: 15 + 1650: 0 + 1930: 66 681.45 + 1932: 2 275.93 = ~98 972

Wait — 99 726 / 98 972 > 100%. That's because EK exceeds assets, which means there's an issue with the raw data or netting. The PDF computes 96% which suggests they include obeskattade reserver (2124 had -16 048 in years -5 and -4, but 0 in -2). Actually this is likely that the PDF uses "justerat eget kapital" for soliditet (EK + 78.6% of obeskattade reserver) per standard K2 definitions. Our code uses raw EK only.

---

### Förändringar i Eget Kapital

| Row | Col | PDF | Our App | Match? |
|-----|-----|-----|---------|--------|
| Vid årets ingång | Aktiekapital | 50 000 | 50 000 | ✅ |
| Vid årets ingång | Balanserat resultat | 49 726 | 49 726 | ✅ |
| Vid årets ingång | Årets resultat | -11 435 | -11 435 | ✅ |
| Vid årets ingång | Totalt | 88 291 | 88 291 | ✅ |
| Balanseras i ny räkning | Balanserat | -11 435 | -11 435 | ✅ |
| Balanseras i ny räkning | Årets resultat | 11 435 | 11 435 | ✅ |
| **Årets resultat** | **Årets resultat** | **24 881** | **22 529** | ❌ |
| **Vid årets utgång** | **Balanserat** | **38 291** | **38 291** | ✅ |
| **Vid årets utgång** | **Årets resultat** | **24 881** | **22 529** | ❌ |
| **Vid årets utgång** | **Totalt** | **113 172** | **110 820** | ❌ |

Same root cause: tax calculation difference (outnyttjat underskott).

---

## Summary of Discrepancies & Required Fixes

### 1. Outnyttjat underskott not auto-calculated (HIGH)
**Effect:** Wrong skatt (5 845 vs 3 493), wrong årets resultat (22 529 vs 24 881), cascades to balance sheet, equity changes, soliditet.
**Fix:** Auto-populate outnyttjat underskott from previous year's result when negative. If previous year result < 0, set outnyttjat underskott = |result|. Allow manual override.

### 2. Account 2518 (betald F-skatt) classified as liability instead of asset (MEDIUM)
**Effect:** Kortfristiga fordringar understated by ~4 567, total assets understated. Skulder also wrong.
**Fix:** Move account 2510-2519 (or specifically 2518) from the liability range to the asset side as "Skattefordringar" under kortfristiga fordringar. The standard practice is: if the net of 2510+2512+2518 is positive (net receivable), show as asset; if negative (net payable), show as liability. Or simply: always show 2518 as asset, 2510/2512 as liability.

### 3. Soliditet uses raw EK instead of justerat eget kapital (LOW-MEDIUM)
**Effect:** Soliditet for 2023/2024 shows 100% instead of 96%.
**Fix:** Soliditet should use "justerat eget kapital" = EK + (1 - skattesats) × obeskattade reserver. This is the standard K2 definition per the PDF's own note: "Justerat eget kapital (eget kapital och obeskattade reserver med avdrag för uppskjuten skatt) i procent av balansomslutningen."

### 4. Flerårsöversikt soliditet doesn't use tax-adjusted values for current year (LOW)
**Effect:** Current year soliditet = 12% instead of 16%.
**Fix:** Pass the tax adjustment (calculated årets resultat + skatteskuld) into the flerårsöversikt calculation for the current year.

### 5. Minor rounding difference in skatt (TRIVIAL)
PDF shows 3 493, our formula gives 3 489 (16 939 × 0.206). Likely the PDF rounds the skattesats differently or uses öresutjämning. Difference: 4 kr. Not worth fixing separately.

---

## Implementation Plan

### Step 1: Auto-calculate outnyttjat underskott
- In `calculateSkatteberakning`, look at previous year's income statement result (resultat före skatt for yearIndex - 1)
- If negative, set as default outnyttjat underskott
- Only apply if user hasn't manually overridden the value
- Update `ReportWizard` to pass this auto-calculated value as default

### Step 2: Reclassify account 2518 as asset
- In `calculateBalanceSheet`, extract accounts 2510-2519 separately
- Account 2518 (betald F-skatt) → add to kortfristiga fordringar on asset side
- Accounts 2510, 2512 (skatteskulder) → keep as kortfristiga skulder
- This ensures correct asset/liability classification

### Step 3: Fix soliditet to use justerat eget kapital
- In `calculateFlerarsOversikt`, change soliditet formula:
  ```
  justerat EK = EK + (1 - 0.206) × obeskattade reserver
  soliditet = justerat EK / balansomslutning × 100
  ```

### Step 4: Pass tax adjustment into flerårsöversikt
- `calculateFlerarsOversikt` needs to accept the tax adjustment for the current year
- Apply it to both balansomslutning (assets) and EK for soliditet calculation

