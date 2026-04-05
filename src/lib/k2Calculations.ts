// K2 Financial Calculations - Maps BAS 2014 accounts to K2 årsredovisning line items

import { SieData, SieBalance } from './sieParser';

export interface K2LineItem {
  label: string;
  note?: string;
  amounts: Record<number, number>; // yearIndex -> amount
  isBold?: boolean;
  isSubtotal?: boolean;
  indent?: number;
}

export interface K2Section {
  title: string;
  items: K2LineItem[];
}

export interface K2IncomeStatement {
  sections: K2Section[];
  totalResult: Record<number, number>;
}

export interface K2BalanceSheet {
  assets: K2Section[];
  equityAndLiabilities: K2Section[];
  totalAssets: Record<number, number>;
  totalEquityAndLiabilities: Record<number, number>;
}

export interface FlerarsOversikt {
  years: { index: number; label: string }[];
  nettoomsattning: Record<number, number>;
  resultatEfterFinansiellaPoster: Record<number, number>;
  balansomslutning: Record<number, number>;
  soliditet: Record<number, number>; // percentage
}

export interface EgetKapitalChange {
  label: string;
  aktiekapital: Record<number, number>;
  balanserat: Record<number, number>;
  aretsResultat: Record<number, number>;
  totalt: Record<number, number>;
}

// Helper: sum balances for account range in a given year
function sumRange(
  balances: SieBalance[],
  yearIndex: number,
  fromAcct: number,
  toAcct: number
): number {
  return balances
    .filter(b => {
      const num = parseInt(b.accountNumber);
      return b.yearIndex === yearIndex && num >= fromAcct && num <= toAcct;
    })
    .reduce((sum, b) => sum + b.amount, 0);
}

function sumAccounts(
  balances: SieBalance[],
  yearIndex: number,
  accounts: number[]
): number {
  return balances
    .filter(b => accounts.includes(parseInt(b.accountNumber)) && b.yearIndex === yearIndex)
    .reduce((sum, b) => sum + b.amount, 0);
}

// For result accounts (3000-8999), we use #RES entries
// For balance accounts (1000-2999), we use #UB entries

export function calculateIncomeStatement(data: SieData, yearIndices: number[]): K2IncomeStatement {
  const res = data.results;
  const amounts = (from: number, to: number) => {
    const result: Record<number, number> = {};
    for (const yi of yearIndices) {
      // RES amounts are stored with natural sign (revenue negative, costs positive in SIE)
      // We negate to show revenue as positive
      result[yi] = -sumRange(res, yi, from, to);
    }
    return result;
  };

  const sumAmounts = (...ranges: Record<number, number>[]): Record<number, number> => {
    const result: Record<number, number> = {};
    for (const yi of yearIndices) {
      result[yi] = ranges.reduce((s, r) => s + (r[yi] || 0), 0);
    }
    return result;
  };

  // Rörelseintäkter
  const nettoomsattning = amounts(3000, 3799);
  const ovrigaRorelseintakter = amounts(3900, 3999);
  const summaRorelseintakter = sumAmounts(nettoomsattning, ovrigaRorelseintakter);

  // Rörelsekostnader (these are costs, so they're positive in SIE = negative for display)
  const handelsvaror = amounts(4000, 4999);
  const ovrigaExternaKostnader = amounts(5000, 6999);
  const personalkostnader = amounts(7000, 7699);
  const avskrivningar = amounts(7700, 7899);
  const ovrigaRorelsekostnader = amounts(7900, 7999);
  const summaRorelsekostnader = sumAmounts(handelsvaror, ovrigaExternaKostnader, personalkostnader, avskrivningar, ovrigaRorelsekostnader);

  const rorelseresultat = sumAmounts(summaRorelseintakter, summaRorelsekostnader);

  // Finansiella poster
  const finansiellaIntakter = amounts(8000, 8399);
  const finansiellaKostnader = amounts(8400, 8699);
  const summaFinansiellt = sumAmounts(finansiellaIntakter, finansiellaKostnader);

  const resultatEfterFinansiella = sumAmounts(rorelseresultat, summaFinansiellt);

  // Skatt
  const skatt = amounts(8900, 8989);
  
  // Årets resultat
  const aretsResultat = sumAmounts(resultatEfterFinansiella, skatt);

  const sections: K2Section[] = [
    {
      title: 'Rörelseintäkter, lagerförändringar m.m.',
      items: [
        { label: 'Nettoomsättning', amounts: nettoomsattning },
        { label: 'Övriga rörelseintäkter', amounts: ovrigaRorelseintakter },
        { label: 'Summa rörelseintäkter, lagerförändringar m.m.', amounts: summaRorelseintakter, isBold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Rörelsekostnader',
      items: [
        { label: 'Råvaror och förnödenheter', amounts: handelsvaror },
        { label: 'Övriga externa kostnader', amounts: ovrigaExternaKostnader },
        { label: 'Personalkostnader', amounts: personalkostnader },
        { label: 'Av- och nedskrivningar av materiella och immateriella anläggningstillgångar', amounts: avskrivningar },
        { label: 'Övriga rörelsekostnader', amounts: ovrigaRorelsekostnader },
        { label: 'Summa rörelsekostnader', amounts: summaRorelsekostnader, isBold: true, isSubtotal: true },
      ],
    },
    {
      title: '',
      items: [
        { label: 'Rörelseresultat', amounts: rorelseresultat, isBold: true },
      ],
    },
    {
      title: 'Finansiella poster',
      items: [
        { label: 'Övriga ränteintäkter och liknande resultatposter', amounts: finansiellaIntakter },
        { label: 'Räntekostnader och liknande resultatposter', amounts: finansiellaKostnader },
        { label: 'Summa finansiella poster', amounts: summaFinansiellt, isBold: true, isSubtotal: true },
      ],
    },
    {
      title: '',
      items: [
        { label: 'Resultat efter finansiella poster', amounts: resultatEfterFinansiella, isBold: true },
        { label: 'Skatt på årets resultat', amounts: skatt },
        { label: 'Årets resultat', amounts: aretsResultat, isBold: true },
      ],
    },
  ];

  return { sections, totalResult: aretsResultat };
}

export function calculateBalanceSheet(data: SieData, yearIndices: number[]): K2BalanceSheet {
  const ub = data.closingBalances;
  const amounts = (from: number, to: number) => {
    const result: Record<number, number> = {};
    for (const yi of yearIndices) {
      result[yi] = sumRange(ub, yi, from, to);
    }
    return result;
  };

  const sumAmounts = (...ranges: Record<number, number>[]): Record<number, number> => {
    const result: Record<number, number> = {};
    for (const yi of yearIndices) {
      result[yi] = ranges.reduce((s, r) => s + (r[yi] || 0), 0);
    }
    return result;
  };

  // TILLGÅNGAR
  // Anläggningstillgångar
  const immateriella = amounts(1000, 1099);
  const materiella = amounts(1100, 1299);
  const finansiellaAnl = amounts(1300, 1399);
  const summaAnlaggning = sumAmounts(immateriella, materiella, finansiellaAnl);

  // Omsättningstillgångar
  const varulager = amounts(1400, 1499);
  const kortfristigaFordringar = amounts(1500, 1899);
  const kpiKortPlac = amounts(1800, 1899); // Already included above if needed
  const kassaBank = amounts(1900, 1999);
  const summaOmsattning = sumAmounts(varulager, kortfristigaFordringar, kassaBank);

  const summaTillgangar = sumAmounts(summaAnlaggning, summaOmsattning);

  // EGET KAPITAL OCH SKULDER
  // Eget kapital
  const aktiekapital = amounts(2080, 2089);
  const balanserat = amounts(2090, 2098);
  const aretsResultatEK = amounts(2099, 2099);
  const summaEgetKapital = sumAmounts(aktiekapital, balanserat, aretsResultatEK);

  // Långfristiga skulder
  const langfristigaSkulder = amounts(2100, 2399);

  // Kortfristiga skulder
  const kortfristigaSkulder = amounts(2400, 2999);

  const summaSkulder = sumAmounts(langfristigaSkulder, kortfristigaSkulder);
  const summaEKochSkulder = sumAmounts(summaEgetKapital, summaSkulder);

  const assets: K2Section[] = [
    {
      title: 'Anläggningstillgångar',
      items: [
        { label: 'Immateriella anläggningstillgångar', amounts: immateriella, indent: 1 },
        { label: 'Materiella anläggningstillgångar', amounts: materiella, indent: 1 },
        { label: 'Finansiella anläggningstillgångar', amounts: finansiellaAnl, indent: 1 },
        { label: 'Summa anläggningstillgångar', amounts: summaAnlaggning, isBold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Omsättningstillgångar',
      items: [
        { label: 'Varulager m.m.', amounts: varulager, indent: 1 },
        { label: 'Kortfristiga fordringar', amounts: kortfristigaFordringar, indent: 1 },
        { label: 'Kassa och bank', amounts: kassaBank, indent: 1 },
        { label: 'Summa omsättningstillgångar', amounts: summaOmsattning, isBold: true, isSubtotal: true },
      ],
    },
  ];

  const equityAndLiabilities: K2Section[] = [
    {
      title: 'Eget kapital',
      items: [
        { label: 'Aktiekapital', amounts: aktiekapital, indent: 1 },
        { label: 'Balanserat resultat', amounts: balanserat, indent: 1 },
        { label: 'Årets resultat', amounts: aretsResultatEK, indent: 1 },
        { label: 'Summa eget kapital', amounts: summaEgetKapital, isBold: true, isSubtotal: true },
      ],
    },
    {
      title: 'Skulder',
      items: [
        { label: 'Långfristiga skulder', amounts: langfristigaSkulder, indent: 1 },
        { label: 'Kortfristiga skulder', amounts: kortfristigaSkulder, indent: 1 },
        { label: 'Summa skulder', amounts: summaSkulder, isBold: true, isSubtotal: true },
      ],
    },
  ];

  return {
    assets,
    equityAndLiabilities,
    totalAssets: summaTillgangar,
    totalEquityAndLiabilities: summaEKochSkulder,
  };
}

export function calculateFlerarsOversikt(data: SieData): FlerarsOversikt {
  // Use up to 4+ years as required by K2
  const years = data.fiscalYears
    .filter(fy => fy.index >= -3 && fy.index <= 0)
    .sort((a, b) => a.index - b.index);

  const yearLabels = years.map(fy => ({
    index: fy.index,
    label: `${fy.startDate.slice(0, 4)}/${fy.endDate.slice(0, 4)}`,
  }));

  const res = data.results;
  const ub = data.closingBalances;

  const nettoomsattning: Record<number, number> = {};
  const resultatEfterFinansiella: Record<number, number> = {};
  const balansomslutning: Record<number, number> = {};
  const soliditet: Record<number, number> = {};

  for (const fy of years) {
    const yi = fy.index;
    nettoomsattning[yi] = -sumRange(res, yi, 3000, 3799);
    
    const rorelseIntakter = -sumRange(res, yi, 3000, 3999);
    const rorelsekostnader = -sumRange(res, yi, 4000, 7999);
    const finansiellt = -sumRange(res, yi, 8000, 8699);
    resultatEfterFinansiella[yi] = rorelseIntakter + rorelsekostnader + finansiellt;

    // Balansomslutning = summa tillgångar
    balansomslutning[yi] = sumRange(ub, yi, 1000, 1999);

    // Soliditet = eget kapital / balansomslutning * 100
    const egetKapital = sumRange(ub, yi, 2080, 2099);
    const totalAssets = balansomslutning[yi];
    soliditet[yi] = totalAssets !== 0 ? Math.round((Math.abs(egetKapital) / totalAssets) * 100) : 0;
  }

  return { years: yearLabels, nettoomsattning, resultatEfterFinansiellaPoster: resultatEfterFinansiella, balansomslutning, soliditet };
}

export interface EgetKapitalForandring {
  rows: EgetKapitalChange[];
}

export function calculateEgetKapitalForandring(data: SieData): EgetKapitalForandring {
  const ub = data.closingBalances;
  const ib = data.openingBalances;

  // For current year (index 0) and previous year (index -1)
  const yearIndices = [0];

  const getVal = (balances: SieBalance[], yi: number, from: number, to: number) =>
    sumRange(balances, yi, from, to);

  const rows: EgetKapitalChange[] = [];

  for (const yi of yearIndices) {
    const aktiekapitalIB = -getVal(ib, yi, 2080, 2089);
    const balIB = -getVal(ib, yi, 2090, 2098);
    const prevResult = -getVal(ib, yi, 2099, 2099);
    
    const aktiekapitalUB = -getVal(ub, yi, 2080, 2089);
    const balUB = -getVal(ub, yi, 2090, 2098);
    const aretsResultatUB = -getVal(ub, yi, 2099, 2099);

    rows.push({
      label: 'Belopp vid årets ingång',
      aktiekapital: { [yi]: aktiekapitalIB },
      balanserat: { [yi]: balIB },
      aretsResultat: { [yi]: prevResult },
      totalt: { [yi]: aktiekapitalIB + balIB + prevResult },
    });

    // Disposition av föregående års resultat
    rows.push({
      label: 'Disposition av föregående års resultat',
      aktiekapital: { [yi]: 0 },
      balanserat: { [yi]: prevResult },
      aretsResultat: { [yi]: -prevResult },
      totalt: { [yi]: 0 },
    });

    // Årets resultat
    rows.push({
      label: 'Årets resultat',
      aktiekapital: { [yi]: 0 },
      balanserat: { [yi]: 0 },
      aretsResultat: { [yi]: aretsResultatUB },
      totalt: { [yi]: aretsResultatUB },
    });

    rows.push({
      label: 'Belopp vid årets utgång',
      aktiekapital: { [yi]: aktiekapitalUB },
      balanserat: { [yi]: balUB + prevResult },
      aretsResultat: { [yi]: aretsResultatUB },
      totalt: { [yi]: aktiekapitalUB + balUB + prevResult + aretsResultatUB },
    });
  }

  return { rows };
}

export function formatSEK(amount: number): string {
  if (amount === 0) return '0';
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return isNegative ? `-${formatted}` : formatted;
}

export function formatFiscalYear(fy: SieFiscalYear): string {
  const start = fy.startDate;
  const end = fy.endDate;
  return `${start.slice(0, 4)}-${start.slice(4, 6)}-${start.slice(6, 8)} – ${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}
