// PDF Export using jsPDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SieCompanyInfo, SieFiscalYear } from './sieParser';
import { K2IncomeStatement, K2BalanceSheet, FlerarsOversikt, EgetKapitalForandring, formatSEK } from './k2Calculations';
import { ReportData } from './k2Types';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
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
}

export function generatePDF(options: PDFExportOptions) {
  const { company, fiscalYear, reportData, incomeStatement, balanceSheet, flerarsOversikt, egetKapitalForandring, fiscalYears } = options;
  
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const currentFY = fiscalYears.find(fy => fy.index === 0);
  const prevFY = fiscalYears.find(fy => fy.index === -1);

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

  doc.setFontSize(12);
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

  // Flerårsöversikt
  checkNewPage(50);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Flerårsöversikt', margin, y);
  y += 4;

  const flerarsHeaders = ['', ...flerarsOversikt.years.map(yr => yr.label)];
  const flerarsBody = [
    ['Nettoomsättning (kr)', ...flerarsOversikt.years.map(yr => formatSEK(flerarsOversikt.nettoomsattning[yr.index] || 0))],
    ['Resultat efter fin. poster (kr)', ...flerarsOversikt.years.map(yr => formatSEK(flerarsOversikt.resultatEfterFinansiellaPoster[yr.index] || 0))],
    ['Balansomslutning (kr)', ...flerarsOversikt.years.map(yr => formatSEK(flerarsOversikt.balansomslutning[yr.index] || 0))],
    ['Soliditet (%)', ...flerarsOversikt.years.map(yr => `${flerarsOversikt.soliditet[yr.index] || 0}%`)],
  ];

  doc.autoTable({
    startY: y,
    head: [flerarsHeaders],
    body: flerarsBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
    },
    theme: 'grid',
  });
  y = doc.lastAutoTable.finalY + 8;

  // Förändringar i eget kapital
  checkNewPage(50);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Förändringar i eget kapital', margin, y);
  y += 4;

  const ekHeaders = ['', 'Aktiekapital', 'Balanserat resultat', 'Årets resultat', 'Totalt'];
  const ekBody = egetKapitalForandring.rows.map(row => [
    row.label,
    formatSEK(row.aktiekapital[0] || 0),
    formatSEK(row.balanserat[0] || 0),
    formatSEK(row.aretsResultat[0] || 0),
    formatSEK(row.totalt[0] || 0),
  ]);

  doc.autoTable({
    startY: y,
    head: [ekHeaders],
    body: ekBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    theme: 'grid',
  });
  y = doc.lastAutoTable.finalY + 8;

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

  const currentLabel = currentFY ? `${currentFY.startDate.slice(0,4)}-${currentFY.startDate.slice(4,6)}-${currentFY.startDate.slice(6,8)} – ${currentFY.endDate.slice(0,4)}-${currentFY.endDate.slice(4,6)}-${currentFY.endDate.slice(6,8)}` : '';
  const prevLabel = prevFY ? `${prevFY.startDate.slice(0,4)}-${prevFY.startDate.slice(4,6)}-${prevFY.startDate.slice(6,8)} – ${prevFY.endDate.slice(0,4)}-${prevFY.endDate.slice(4,6)}-${prevFY.endDate.slice(6,8)}` : '';

  const rrBody: any[][] = [];
  for (const section of incomeStatement.sections) {
    if (section.title) {
      rrBody.push([{ content: section.title, colSpan: 3, styles: { fontStyle: 'bold', fontSize: 8, textColor: [100, 100, 100] } }]);
    }
    for (const item of section.items) {
      const hasValue = [0, -1].some(yi => (item.amounts[yi] || 0) !== 0);
      if (!hasValue && !item.isBold) continue;
      rrBody.push([
        { content: item.label, styles: { fontStyle: item.isBold ? 'bold' : 'normal', cellPadding: { left: item.indent ? 8 : 2, top: 1.5, bottom: 1.5, right: 2 } } },
        { content: formatSEK(item.amounts[0] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
        { content: formatSEK(item.amounts[-1] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
      ]);
    }
  }

  doc.autoTable({
    startY: y,
    head: [['', currentLabel, prevLabel]],
    body: rrBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 90 } },
    theme: 'plain',
    tableLineWidth: 0,
    didDrawCell: (data: any) => {
      // Add top border for subtotal rows
    },
  });
  y = doc.lastAutoTable.finalY + 8;
  addFooter(doc.getNumberOfPages());

  // === Balansräkning ===
  doc.addPage();
  addHeader();
  y = 25;

  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Balansräkning', margin, y);
  y += 8;

  const brDateCurrent = currentFY ? `${currentFY.endDate.slice(0,4)}-${currentFY.endDate.slice(4,6)}-${currentFY.endDate.slice(6,8)}` : '';
  const brDatePrev = prevFY ? `${prevFY.endDate.slice(0,4)}-${prevFY.endDate.slice(4,6)}-${prevFY.endDate.slice(6,8)}` : '';

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
        { content: formatSEK(item.amounts[0] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
        { content: formatSEK(item.amounts[-1] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
      ]);
    }
  }
  assetsBody.push([
    { content: 'SUMMA TILLGÅNGAR', styles: { fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalAssets[0] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalAssets[-1] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);

  doc.autoTable({
    startY: y,
    head: [['', brDateCurrent, brDatePrev]],
    body: assetsBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 90 } },
    theme: 'plain',
  });
  y = doc.lastAutoTable.finalY + 10;

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
        { content: formatSEK(item.amounts[0] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
        { content: formatSEK(item.amounts[-1] || 0), styles: { halign: 'right', fontStyle: item.isBold ? 'bold' : 'normal' } },
      ]);
    }
  }
  liabBody.push([
    { content: 'SUMMA EGET KAPITAL OCH SKULDER', styles: { fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalEquityAndLiabilities[0] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
    { content: formatSEK(balanceSheet.totalEquityAndLiabilities[-1] || 0), styles: { halign: 'right', fontStyle: 'bold' } },
  ]);

  doc.autoTable({
    startY: y,
    body: liabBody,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: { 0: { cellWidth: 90 } },
    theme: 'plain',
  });
  y = doc.lastAutoTable.finalY + 8;
  addFooter(doc.getNumberOfPages());

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

  // Save
  const fileName = `arsredovisning_${company.orgNumber.replace('-', '')}_${currentFY?.endDate.slice(0, 4) || ''}.pdf`;
  doc.save(fileName);
}
