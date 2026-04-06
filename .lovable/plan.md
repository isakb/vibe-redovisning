

# Outnyttjat underskott från föregående år

## Problem
Skatteberäkningen tar inte hänsyn till outnyttjat underskott från föregående år. Om bolaget hade förlust föregående år ska den dras av från årets skattemässiga resultat innan skatt beräknas.

## Lösning

### Automatisk beräkning + manuell override
1. Systemet beräknar automatiskt föregående års underskott genom att titta på föregående års skattemässiga resultat (om negativt → outnyttjat underskott)
2. Användaren kan manuellt justera beloppet via ett inputfält

### Tekniska ändringar

**`src/lib/k2Types.ts`**
- Lägg till `outnyttjatUnderskott: number` i `ReportData` (default 0)

**`src/lib/k2Calculations.ts`**
- Lägg till `outnyttjatUnderskott` i `Skatteberakning`-interfacet
- I `calculateSkatteberakning`: dra av underskottet från skattemässigt resultat innan skatt beräknas:
  ```
  skattemässigt resultat = resultatFöreSkatt + ejAvdragsgilla - outnyttjatUnderskott
  ```
- Skatt beräknas bara om skattemässigt resultat > 0 (redan så)

**`src/components/TaxCalculationSection.tsx`**
- Nytt inputfält "Outnyttjat underskott från fg. år" mellan "Ej avdragsgilla kostnader" och "Skattemässigt resultat"
- Visas som negativt belopp (avdrag)

**`src/components/ReportPreview.tsx`**
- Visa raden i skatteberäknings-tabellen i förhandsgranskningen

