# K2 Årsredovisning Generator

## Overview

A web app where users upload a SIE 4 file and get a full K2 årsredovisning for aktiebolag — previewed on screen with editable text fields, then exportable as PDF.

## Core Flow

### 1. Upload & Parse

- Landing page with file upload (drag & drop + click) for `.se` / `.si` files
- Client-side SIE 4 parser that extracts:
  - Company info (name, org number, fiscal years)
  - Chart of accounts with SRU codes
  - Opening/closing balances (IB/UB) for all years
  - Transactions (#VER / #TRANS)
- Encoding handling (CP437/PC8 as used by SIE standard)

### 2. Financial Calculations

- **Resultaträkning** (income statement): Aggregate accounts 3000-8999 into K2 line items (nettoomsättning, rörelsekostnader, finansiella poster, skatt, årets resultat)
- **Balansräkning** (balance sheet): Aggregate accounts 1000-2999 into K2 categories (anläggningstillgångar, omsättningstillgångar, eget kapital, skulder)
- **Flerårsöversikt**: Multi-year summary using all available RAR periods (nettoomsättning, resultat efter finansiella poster, soliditet)
- **Förändringar i eget kapital**: Computed from equity accounts across periods

### 3. Editable Report Form

After parsing, show a step-by-step form/wizard with these sections:

- **Förvaltningsberättelse**
  - Verksamhetsbeskrivning (free text)
  - Väsentliga händelser under året (free text)
  - Flerårsöversikt (auto-calculated, shown as table ()
  - Förändringar i eget kapital (auto-calculated table)
  - Resultatdisposition (editable: utdelning amount, defaults to 0)
- **Resultaträkning** (auto-generated, view-only)
- **Balansräkning** (auto-generated, view-only)
- **Noter**
  - Not 1 - Redovisningsprinciper (pre-filled K2 standard text, editable)
  - Not 2 - Medelantal anställda (editable input)
  - Additional notes auto-detected or user-added
- **Underskrifter**
  - Signatory name(s) and role(s) (editable)
  - Date field

### 4. Live Preview

- Right panel (or tab) showing the full report as it will appear in the PDF
- Updates live as users edit text fields
- Professional formatting matching the K2 standard layout

### 5. PDF Export

- Generate a clean, professional PDF matching the style of the draft example
- Company name, page numbers, fiscal year in header/footer
- Proper Swedish number formatting (space as thousands separator)
- Download button

## Design

- Clean, minimal UI
- Step indicator showing progress through report sections
- Clear separation between auto-generated numbers and user-editable fields
- Swedish language throughout the UI

## Technical Approach

- All processing happens client-side (no backend needed)
- SIE 4 parser built from scratch based on the format spec
- BAS 2014 account mapping to K2 line items
- PDF generation using a client-side library (e.g., jsPDF or react-pdf)  
  
  
note:  
  
**För en K2-aktiebolag (mindre aktiebolag som tillämpar BFNAR 2016:10) ska årsredovisningen innehålla följande antal år:**
  - **Resultaträkning och balansräkning**: **2 år** (innevarande räkenskapsår + det närmast föregående året som jämförelsetal).  
    Detta följer årsredovisningslagen (3 kap. 5 §) och K2-regelverkets punkt 3.10. Jämförelsetalen anges i en separat kolumn till höger.
  - **Förvaltningsberättelsen – flerårsöversikt (obligatorisk rubrik)**: **Minst 4 år** (innevarande år + de tre föregående åren).  
    Den ska minst innehålla nyckeltalen:  
    - Nettoomsättning (eller bruttoresultat om förkortad resultaträkning används)  
    - Resultat efter finansiella poster  
    - Soliditet  
    Företaget får frivilligt lägga till fler nyckeltal eller ett femte år. Om nettoomsättningen varierar mer än 30 % mellan åren ska detta kommenteras.
  **Sammanfattning**:  
  Huvudräkningarna (resultat- och balansräkning) visar alltid **2 år**, medan flerårsöversikten i förvaltningsberättelsen obligatoriskt visar **minst 4 år**. Detta är en K2-specifik förenkling jämfört med K3.
  Källor: BFNAR 2016:10 (punkt 5.5 och exempel 5a), PwC:s officiella K2-exempel och Bokföringsnämndens vägledning. Reglerna gäller oförändrat för räkenskapsår som påbörjats efter 31 december 2025 (med vissa uppdateringar 2025 som inte påverkar antalet år).