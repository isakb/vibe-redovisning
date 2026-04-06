

# Skatteberäkning & Bokslutsverifikationer

## Vad som byggs

En ny sektion i appen som visar:

1. **Skatteberäkning** — Beräknar skattemässigt resultat från RR-data, identifierar ej avdragsgilla kostnader (konto 7000-intervallet markerade som ej avdragsgilla), applicerar skattesats 20.6%, och visar skattebelopp.

2. **Förslag på verifikationer** — Två bokföringsförslag:
   - **Skatteverifikation**: Debit 2512 / Kredit 8910
   - **Årets resultat-verifikation**: Debit 2099 / Kredit 8999

3. **Detektering av saknade poster** — Om konto 8910/2512 saknar saldon i SIE-filen, flaggas att skatteberäkning saknas och verifikationsförslag visas. Om de redan finns, visas befintliga värden.

## Beräkningslogik

- **Resultat före skatt** = Resultat efter finansiella poster (redan beräknat i RR)
- **Ej avdragsgilla kostnader** = Summa konton som representerar ej avdragsgilla poster (t.ex. representation 6072, förseningsavgifter 6990 etc.) — initialt satt till 0 kr men redigerbart av användaren
- **Skattemässigt resultat** = Resultat före skatt + ej avdragsgilla kostnader
- **Skattesats** = 20.6% (hårdkodad, redigerbar)
- **Skatt på årets resultat** = Skattemässigt resultat × skattesats, avrundat till heltal
- **Årets resultat** = Resultat före skatt − skatt

## Tekniska ändringar

### `src/lib/k2Types.ts`
- Lägg till fält i `ReportData`: `ejAvdragsgillaPoster: number`, `skattesats: number` (default 20.6)

### `src/lib/k2Calculations.ts`
- Ny funktion `calculateSkatteberakning(incomeStatement, reportData)` som returnerar skattemässigt resultat, skatt, årets resultat, och verifikationsförslag
- Ny interface `Skatteberakning` med alla beräknade värden
- Ny interface `Verifikationsrad` med konto, debit, kredit

### `src/components/ReportEditor.tsx`
- Ny sektion "Skatteberäkning & Bokslut" med:
  - Tabell som visar skatteberäkningen (skattemässigt resultat, ej avdragsgilla, skattesats, skatt)
  - Redigerbart fält för "Ej avdragsgilla kostnader"
  - Redigerbart fält för skattesats
  - Verifikationsförslag som tabeller (konto/debit/kredit)
  - Bokföringsdatum = räkenskapsårets sista dag

### `src/components/ReportPreview.tsx`
- Visa skatteberäkning och verifikationsförslag i förhandsgranskningen

