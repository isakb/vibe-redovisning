

# Plan: Bokföringsguide och borttagning av Förkortad-toggle

## Översikt

Två ändringar:
1. **Ta bort togglen "Förkortad årsredovisning"** — den ska alltid vara av (eller logiken tas bort helt).
2. **Lägg till en knapp "Visa bokföringsposter"** som öppnar en guide/modal med alla verifikationer som behöver bokföras för hela bokslutet (skatt, årets resultat, och utdelning om sådan finns).

## Ändringar

### 1. Ta bort Förkortad-togglen
**`src/components/ReportEditor.tsx`**: Ta bort Card-blocket (rad ~78-94) som innehåller "Förkortad årsredovisning"-switchen. Sätt `useAbbreviatedForm` till `false` permanent eller ta bort alla kodstigar som beror på det.

### 2. Utöka VerificationModal med utdelningsverifikation
**`src/components/VerificationModal.tsx`**: Lägg till en tredje sektion "Förslag på verifikation — Utdelning" som visas när `utdelning > 0`. Verifikationen:
- Konto 2091 "Balanserat resultat" — Debit: utdelningsbeloppet
- Konto 2898 "Outtagen vinstutdelning" — Kredit: utdelningsbeloppet

Utdelningsbeloppet skickas in som ny prop.

### 3. Lägg till en prominent "Visa bokföringsposter"-knapp
**`src/components/ReportWizard.tsx`**: Lägg till en knapp i headern (bredvid "Exportera PDF") som öppnar VerificationModal. Knappen syns alltid, inte bara från TaxCalculationSection. Texten: "Visa bokföringsposter" med en BookOpen- eller FileText-ikon.

Flytta modal-state (open/accepted) upp till ReportWizard så att modalen kan öppnas från headern. Skicka med `reportData.utdelning` som prop.

### 4. Behåll befintlig trigger i TaxCalculationSection
TaxCalculationSection behåller sin "Visa bokföringsförslag"-knapp men den använder samma modal-state som lyfts upp.

## Tekniska detaljer

- `VerificationModal` får ny prop `utdelning: number`
- Utdelningsverifikation visas villkorligt (`utdelning > 0`)
- Förkortad-togglen tas bort ur UI men `useAbbreviatedForm`-fältet behålls i typen (default false) för bakåtkompatibilitet

