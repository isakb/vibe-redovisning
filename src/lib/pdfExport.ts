// PDF Export using jsPDF
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SieCompanyInfo, SieFiscalYear } from './sieParser';
import { K2IncomeStatement, K2BalanceSheet, FlerarsOversikt, EgetKapitalForandring, Skatteberakning, formatSEK } from './k2Calculations';
import { ReportData } from './k2Types';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

interface PDFExportOptions {
  company: SieCompanyInfo;
  fiscalYear: string;
  reportData: ReportData;
  incomeStatement: K2IncomeStatement;
  balanceSheet: K2BalanceSheet;
  flerarsOversikt: FlerarsOversikt;
  egetKapitalForandring: EgetKapitalForandring;
  fiscalYears: SieFiscalYear[];
  selectedYearIndex: number;
  skatteberakning?: Skatteberakning;
}

export function generatePDF(options: PDFExportOptions) {
  const {
    company,
    fiscalYear,
    reportData,
    incomeStatement,
    balanceSheet,
    flerarsOversikt,
    egetKapitalForandring,
    fiscalYears,
    selectedYearIndex,
    skatteberakning,
  } = options;

  const currentYearIndex = selectedYearIndex;
  const previousYearIndex = selectedYearIndex - 1;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const currentFY = fiscalYears.find(fy => fy.index === currentYearIndex);
  const prevFY = fiscalYears.find(fy => fy.index === previousYearIndex);

  function addHeader() {
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(company.name, margin, 10);
    doc.text(`Org.nr ${company.orgNumber}`, pageWidth - margin, 10, { align: 'right' });
  }

  function addFooter(pageNum: number) {
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`${pageNum}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  function checkNewPage(needed: number = 20): boolean {
    if (y + needed > pageHeight - 20) {
      addFooter(doc.getNumberOfPages());
      doc.addPage();
      addHeader();
      y = 20;
      return true;
    }
    return false;
  }

  // Helper to get flerårsöversikt value with override support
  function getFlerarsValue(key: 'nettoomsattning' | 'resultatEfterFinansiellaPoster' | 'balansomslutning' | 'soliditet', yearIndex: number): number | string {
    const override = reportData.flerarsOverrides?.[yearIndex]?.[key];
    const sieVal = (flerarsOversikt as any)[key === 'resultatEfterFinansiellaPoster' ? 'resultatEfterFinansiellaPoster' : key]?.[yearIndex] || 0;
    const val = override !== undefined ? override : sieVal;
    if (key === 'soliditet') return `${val}%`;
    return formatSEK(val);
  }

  // === PAGE 1: Cover ===
  y = pageHeight / 3;
  doc.setFontSize(24);
  doc.setTextColor(0);
  doc.text('Årsredovisning', pageWidth / 2, y, { align: 'center' });
  y += 12;
  doc.setFontSize(16);
  doc.text(company.name, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(`Org.nr ${company.orgNumber}`, pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.text(`Räkenskapsåret ${fiscalYear}`, pageWidth / 2, y, { align: 'center' });
  addFooter(1);

  // === PAGE 2: Förvaltningsberättelse ===
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Förvaltningsberättelse', margin, y);
  y += 10;

  if (reportData.bolagetsSate) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Allmänt om verksamheten', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(`Bolaget har sitt säte i ${reportData.bolagetsSate}.`, margin, y);
    y += 8;
  }

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Verksamheten', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(40);
  const verkLines = doc.splitTextToSize(reportData.verksamhetsbeskrivning, contentWidth);
  doc.text(verkLines, margin, y);
  y += verkLines.length * 5 + 4;

  if (reportData.vasEntligaHandelser) {
    checkNewPage(30);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Väsentliga händelser under räkenskapsåret', margin, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(40);
    const handLines = doc.splitTextToSize(reportData.vasEntligaHandelser, contentWidth);
    doc.text(handLines, margin, y);
    y += handLines.length * 5 + 4;
  }

  // Flerårsöversikt (with overrides)
  checkNewPage(50);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Flerårsöversikt', margin, y);
  y += 4;

  const flerarsHeaders = ['', ...flerarsOversikt.years.map(yr => yr.label)];
  const flerarsBody = [
    ['Nettoomsättning (kr)', ...flerarsOversikt.years.map(yr => getFlerarsValue('nettoomsattning', yr.index) as string)],
    ['Resultat efter fin. poster (kr)', ...flerarsOversikt.years.map(yr => getFlerarsValue('resultatEfterFinansiellaPoster', yr.index) as string)],
    ['Balansomslutning (kr)', ...flerarsOversikt.years.map(yr => getFlerarsValue('balansomslutning', yr.index) as string)],
    ['Soliditet (%)', ...flerarsOversikt.years.map(yr => getFlerarsValue('soliditet', yr.index) as string)],
  ];

  autoTable(doc, {
    startY: y,
    head: [flerarsHeaders],
    body: flerarsBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 60 } },
    theme: 'grid',
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  // Förändringar i eget kapital
  checkNewPage(50);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Förändringar i eget kapital', margin, y);
  y += 4;

  const ekHeaders = ['', 'Aktiekapital', 'Balanserat resultat', 'Årets resultat', 'Totalt'];
  const ekBody = egetKapitalForandring.rows.map(row => [
    row.label,
    formatSEK(row.aktiekapital[currentYearIndex] || 0),
    formatSEK(row.balanserat[currentYearIndex] || 0),
    formatSEK(row.aretsResultat[currentYearIndex] || 0),
    formatSEK(row.totalt[currentYearIndex] || 0),
  ]);

  autoTable(doc, {
    startY: y,
    head: [ekHeaders],
    body: ekBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    theme: 'grid',
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  // Resultatdisposition
  checkNewPage(30);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Resultatdisposition', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text('Styrelsen föreslår att till förfogande stående medel disponeras enligt följande:', margin, y);
  y += 6;
  if (reportData.utdelning > 0) {
    doc.text(`Utdelning till aktieägarna: ${formatSEK(reportData.utdelning)} kr`, margin + 4, y);
    y += 5;
  }
  doc.text(`Balanseras i ny räkning: ${formatSEK(reportData.tillBalanseratResultat)} kr`, margin + 4, y);
  y += 8;

  addFooter(doc.getNumberOfPages());

  // === Resultaträkning ===
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Resultaträkning', margin, y);
  y += 4;

  const currentLabel = currentFY ? `${currentFY.startDate.slice(0, 4)}-${currentFY.startDate.slice(4, 6)}-${currentFY.startDate.slice(6, 8)} – ${currentFY.endDate.slice(0, 4)}-${currentFY.endDate.slice(4, 6)}-${currentFY.endDate.slice(6, 8)}` : '';
  const prevLabel = prevFY ? `${prevFY.startDate.slice(0, 4)}-${prevFY.startDate.slice(4, 6)}-${prevFY.startDate.slice(6, 8)} – ${prevFY.endDate.slice(0, 4)}-${prevFY.endDate.slice(4, 6)}-${prevFY.endDate.slice(6, 8)}` : '';

  const rrBody: any[][] = [];
  for (const section of incomeStatement.sections) {
    if (section.title) {
      rrBody.push([{ content: section.title, colSpan: 3, styles: { fontStyle: 'bold', fontSize: 8, textColor: [100, 100, 100] } }]);
    }
    for (const item of section.items) {
      const hasValue = [currentYearIndex, previousYearIndex].some(yi => (item.amounts[yi] || 0) !== 0);
      if (!hasValue && !item.isBold) continue;
      rrBody.push([
        { content: item.label, styles: { fontStyle: item.isBold ? 'bold' : 'normal', cellPadding: { left: item.indent ? 8 : 2, top: 1.5, bottom: 1.5, right: 2 } } },
        { content: formatSEK(item.amounts[currentYearIndex] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
        { content: formatSEK(item.amounts[previousYearIndex] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
      ]);
    }
  }

  autoTable(doc, {
    startY: y,
    head: [['', currentLabel, prevLabel]],
    body: rrBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 90 } },
    theme: 'plain',
    tableLineWidth: 0,
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 8;
  addFooter(doc.getNumberOfPages());

  // === Balansräkning ===
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Balansräkning', margin, y);
  y += 8;

  const brDateCurrent = currentFY ? `${currentFY.endDate.slice(0, 4)}-${currentFY.endDate.slice(4, 6)}-${currentFY.endDate.slice(6, 8)}` : '';
  const brDatePrev = prevFY ? `${prevFY.endDate.slice(0, 4)}-${prevFY.endDate.slice(4, 6)}-${prevFY.endDate.slice(6, 8)}` : '';

  // Tillgångar
  doc.setFontSize(12);
  doc.text('TILLGÅNGAR', margin, y);
  y += 2;

  const assetsBody: any[][] = [];
  for (const section of balanceSheet.assets) {
    if (section.title) {
      assetsBody.push([{ content: section.title, colSpan: 3, styles: { fontStyle: 'bold', fontSize: 8, textColor: [100, 100, 100] } }]);
    }
    for (const item of section.items) {
      assetsBody.push([
        { content: item.label, styles: { fontStyle: item.isBold ? 'bold' : 'normal', cellPadding: { left: item.indent ? 8 : 2, top: 1.5, bottom: 1.5, right: 2 } } },
        { content: formatSEK(item.amounts[currentYearIndex] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
        { content: formatSEK(item.amounts[previousYearIndex] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
      ]);
    }
  }
  assetsBody.push([
    { content: 'SUMMA TILLGÅNGAR', styles: { fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalAssets[currentYearIndex] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalAssets[previousYearIndex] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);

  autoTable(doc, {
    startY: y,
    head: [['', brDateCurrent, brDatePrev]],
    body: assetsBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 90 } },
    theme: 'plain',
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // Eget kapital och skulder
  checkNewPage(60);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('EGET KAPITAL OCH SKULDER', margin, y);
  y += 2;

  const liabBody: any[][] = [];
  for (const section of balanceSheet.equityAndLiabilities) {
    if (section.title) {
      liabBody.push([{ content: section.title, colSpan: 3, styles: { fontStyle: 'bold', fontSize: 8, textColor: [100, 100, 100] } }]);
    }
    for (const item of section.items) {
      liabBody.push([
        { content: item.label, styles: { fontStyle: item.isBold ? 'bold' : 'normal', cellPadding: { left: item.indent ? 8 : 2, top: 1.5, bottom: 1.5, right: 2 } } },
        { content: formatSEK(item.amounts[currentYearIndex] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
        { content: formatSEK(item.amounts[previousYearIndex] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
      ]);
    }
  }
  liabBody.push([
    { content: 'SUMMA EGET KAPITAL OCH SKULDER', styles: { fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalEquityAndLiabilities[currentYearIndex] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalEquityAndLiabilities[previousYearIndex] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);

  autoTable(doc, {
    startY: y,
    body: liabBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 90 } },
    theme: 'plain',
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 8;
  addFooter(doc.getNumberOfPages());

  // === Skatteberäkning (if missing from SIE) ===
  if (skatteberakning?.saknarSkattebokning) {
    doc.addPage();
    addHeader();
    y = 25;

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Skatteberäkning', margin, y);
    y += 8;

    const taxBody: string[][] = [
      ['Resultat före skatt', formatSEK(skatteberakning.resultatForeSkatt) + ' kr'],
    ];
    if (skatteberakning.ejAvdragsgillaPoster !== 0) {
      taxBody.push(['Ej avdragsgilla kostnader', formatSEK(skatteberakning.ejAvdragsgillaPoster) + ' kr']);
    }
    if (skatteberakning.outnyttjatUnderskott !== 0) {
      taxBody.push(['Outnyttjat underskott från fg. år', '-' + formatSEK(skatteberakning.outnyttjatUnderskott) + ' kr']);
    }
    taxBody.push(
      ['Skattemässigt resultat', formatSEK(skatteberakning.skattemassigResultat) + ' kr'],
      ['Skattesats', skatteberakning.skattesats + '%'],
      ['Skatt på årets resultat', formatSEK(skatteberakning.skattPaAretsResultat) + ' kr'],
    );

    autoTable(doc, {
      startY: y,
      body: taxBody,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'right' } },
      theme: 'plain',
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 8;

    // Verifikationsförslag - Skatt
    checkNewPage(40);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Förslag på verifikation — Skatt', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Konto', 'Kontonamn', 'Debit', 'Kredit']],
      body: skatteberakning.skatteverifikation.map(r => [
        r.konto, r.kontonamn,
        r.debit > 0 ? formatSEK(r.debit) : '',
        r.kredit > 0 ? formatSEK(r.kredit) : '',
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid',
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 3;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Bokföringsdatum ${skatteberakning.bokforingsdatum}`, margin, y);
    y += 8;

    // Verifikationsförslag - Årets resultat
    checkNewPage(40);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Förslag på verifikation — Årets resultat', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Konto', 'Kontonamn', 'Debit', 'Kredit']],
      body: skatteberakning.resultatverifikation.map(r => [
        r.konto, r.kontonamn,
        r.debit > 0 ? formatSEK(r.debit) : '',
        r.kredit > 0 ? formatSEK(r.kredit) : '',
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      theme: 'grid',
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 3;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Bokföringsdatum ${skatteberakning.bokforingsdatum}`, margin, y);
    y += 8;

    addFooter(doc.getNumberOfPages());
  }

  // === Noter ===
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Noter', margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.text('Not 1 – Redovisningsprinciper', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(40);
  const principLines = doc.splitTextToSize(reportData.redovisningsprinciper, contentWidth);
  doc.text(principLines, margin, y);
  y += principLines.length * 5 + 8;

  checkNewPage(20);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Not 2 – Medelantal anställda', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(`Medelantalet anställda under räkenskapsåret har uppgått till ${reportData.medeltalAnstallda}.`, margin, y);
  y += 10;

  // Ställda säkerheter
  checkNewPage(20);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Ställda säkerheter', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(reportData.stalldaSakerheter || 'Inga', margin, y);
  y += 8;

  // Eventualförpliktelser
  checkNewPage(20);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Eventualförpliktelser', margin, y);
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(reportData.eventualforpliktelser || 'Inga', margin, y);
  y += 10;

  addFooter(doc.getNumberOfPages());

  // === Underskrifter ===
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Underskrifter', margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text(`${reportData.plats}${reportData.plats ? ', ' : ''}${reportData.signDate}`, margin, y);
  y += 15;

  for (const sig of reportData.signatories) {
    checkNewPage(25);
    doc.setDrawColor(180);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y, margin + 80, y);
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(sig.name || '', margin, y);
    y += 4;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(sig.role, margin, y);
    y += 12;
  }

  addFooter(doc.getNumberOfPages());

  const fileName = `arsredovisning_${company.orgNumber.replace('-', '')}_${currentFY?.endDate.slice(0, 4) || ''}.pdf`;
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');

  if (!openedWindow) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
