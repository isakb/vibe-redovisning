import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Skatteberakning, formatSEK } from './k2Calculations';
import { SieCompanyInfo } from './sieParser';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

interface SkatteberakningPDFOptions {
  skatteberakning: Skatteberakning;
  company: SieCompanyInfo;
  fiscalYear: string;
}

export function generateSkatteberakningPDF({ skatteberakning, company, fiscalYear }: SkatteberakningPDFOptions) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  const s = skatteberakning;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Skatteberäkning', margin, y);
  y += 10;

  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${company.name}, räkenskapsåret ${fiscalYear}`, margin, y);
  y += 8;

  // Disclaimer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Notera! Det här är inte en deklarationsblankett som kan skickas in till Skatteverket.',
    margin,
    y
  );
  y += 10;

  // Tax calculation table
  const rows: [string, string][] = [];
  rows.push(['Resultat före skatt', `${formatSEK(s.resultatForeSkatt)} kr`]);
  
  if (s.ejAvdragsgillaPoster !== 0) {
    rows.push(['Ej avdragsgilla kostnader', `+ ${formatSEK(s.ejAvdragsgillaPoster)} kr`]);
  }

  // Detail adjustment lines from SIE
  if (s.detailAdjustments) {
    for (const adj of s.detailAdjustments) {
      const sign = adj.amount >= 0 ? '+' : '-';
      rows.push([adj.label, `${sign} ${formatSEK(Math.abs(adj.amount))} kr`]);
    }
  }

  if (s.outnyttjatUnderskott !== 0) {
    rows.push(['Outnyttjat underskott från föregående år', `- ${formatSEK(s.outnyttjatUnderskott)} kr`]);
  }

  const sumLabel = s.skattemassigResultat >= 0 ? 'Summa (överskott)' : 'Summa (underskott)';
  rows.push([sumLabel, `${formatSEK(s.skattemassigResultat)} kr`]);
  rows.push([
    'Beskattningsbar inkomst (överskott avrundat nedåt till närmaste tiotal)',
    `${formatSEK(s.beskattningsbarInkomst)} kr`,
  ]);
  rows.push(['Skattesats', `${s.skattesats.toString().replace('.', ',')} %`]);
  rows.push(['Årets skatt (avrundat nedåt)', `${formatSEK(s.skattPaAretsResultat)} kr`]);

  autoTable(doc, {
    startY: y,
    head: [],
    body: rows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: pageWidth - 2 * margin - 40 },
      1: { cellWidth: 40, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc.lastAutoTable?.finalY || y) + 10;

  // Verification: Skatt
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Förslag på verifikation — Skatt', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Konto', 'Kontonamn', 'Debit', 'Kredit']],
    body: s.skatteverifikation.map(r => [
      r.konto,
      r.kontonamn,
      r.debit > 0 ? formatSEK(r.debit) : '',
      r.kredit > 0 ? formatSEK(r.kredit) : '',
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  y = (doc.lastAutoTable?.finalY || y) + 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bokföringsdatum ${s.bokforingsdatum}`, margin, y);
  y += 8;

  // Verification: Årets resultat
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Förslag på verifikation — Årets resultat', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Konto', 'Kontonamn', 'Debit', 'Kredit']],
    body: s.resultatverifikation.map(r => [
      r.konto,
      r.kontonamn,
      r.debit > 0 ? formatSEK(r.debit) : '',
      r.kredit > 0 ? formatSEK(r.kredit) : '',
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  y = (doc.lastAutoTable?.finalY || y) + 2;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Bokföringsdatum ${s.bokforingsdatum}`, margin, y);
  y += 12;

  // Footer
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  doc.setFontSize(8);
  doc.text(`Skapad ${dateStr}`, margin, y);

  doc.save(`skatteberakning-${company.orgNumber}.pdf`);
}
