# K2 Årsredovisning

Generera K2-årsredovisningar direkt i webbläsaren från SIE 4-filer. Gratis, öppen källkod, och helt utan server — all data stannar på din enhet.

## Funktioner

- **SIE 4-import** — Ladda upp en eller flera SIE-filer (.se / .si) för att automatiskt läsa in bokföringsdata
- **K2-årsredovisning** — Resultaträkning, balansräkning, förändring i eget kapital, flerårsöversikt och noter enligt K2-regelverket
- **Skatteberäkning** — Automatisk beräkning av skatt med hantering av ej avdragsgilla kostnader, skattefria intäkter och outnyttjat underskott
- **Bokföringsförslag** — Verifikationsförslag för skatt och årets resultat som kan godkännas och tillämpas
- **PDF-export** — Ladda ner färdig årsredovisning och skatteberäkning som PDF
- **Lokal lagring** — Företagsuppgifter och rapportinställningar sparas i webbläsarens localStorage
- **Helt klientsidigt** — Ingen data skickas till någon server, SIE-filerna lämnar aldrig din enhet

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173) och ladda upp en SIE 4-fil.

## Teknikstack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) för PDF-generering

## Relaterat

Från teamet bakom [Skatteguru](https://www.skatteguru.se/) — Sveriges ledande skatteberäkningstjänst för K4-blanketten.

## Licens

Licensierad under [Apache License 2.0](LICENSE).
