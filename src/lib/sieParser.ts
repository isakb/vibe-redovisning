// SIE 4 Parser - Client-side parser for Swedish SIE accounting files

export interface SieCompanyInfo {
  name: string;
  orgNumber: string;
  program: string;
  generatedDate: string;
  accountPlan: string;
}

export interface SieFiscalYear {
  index: number; // 0 = current, -1 = previous, etc.
  startDate: string;
  endDate: string;
}

export interface SieAccount {
  number: string;
  name: string;
  sruCode?: string;
}

export interface SieBalance {
  yearIndex: number;
  accountNumber: string;
  amount: number;
}

export interface SieTransaction {
  accountNumber: string;
  amount: number;
}

export interface SieVerification {
  series: string;
  number: string;
  date: string;
  description: string;
  regDate?: string;
  transactions: SieTransaction[];
}

export interface SieData {
  company: SieCompanyInfo;
  fiscalYears: SieFiscalYear[];
  accounts: Map<string, SieAccount>;
  openingBalances: SieBalance[]; // #IB
  closingBalances: SieBalance[]; // #UB
  results: SieBalance[]; // #RES
  verifications: SieVerification[];
}

// CP437 decoding table for Swedish characters
const cp437Map: Record<number, string> = {
  0x80: 'Ç', 0x81: 'ü', 0x82: 'é', 0x83: 'â', 0x84: 'ä', 0x85: 'à',
  0x86: 'å', 0x87: 'ç', 0x88: 'ê', 0x89: 'ë', 0x8A: 'è', 0x8B: 'ï',
  0x8C: 'î', 0x8D: 'ì', 0x8E: 'Ä', 0x8F: 'Å', 0x90: 'É', 0x91: 'æ',
  0x92: 'Æ', 0x93: 'ô', 0x94: 'ö', 0x95: 'ò', 0x96: 'û', 0x97: 'ù',
  0x98: 'ÿ', 0x99: 'Ö', 0x9A: 'Ü', 0x9B: '¢', 0x9C: '£', 0x9D: '¥',
  0x9E: '₧', 0x9F: 'ƒ',
};

function decodeCP437(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b < 0x80) {
      result += String.fromCharCode(b);
    } else if (cp437Map[b]) {
      result += cp437Map[b];
    } else {
      result += String.fromCharCode(b);
    }
  }
  return result;
}

function unquote(s: string): string {
  s = s.trim();
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }
  return s;
}

// Tokenize a SIE line respecting quotes and braces
function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === ' ' || line[i] === '\t') {
      i++;
      continue;
    }
    if (line[i] === '"') {
      let end = line.indexOf('"', i + 1);
      if (end === -1) end = line.length;
      tokens.push(line.slice(i, end + 1));
      i = end + 1;
    } else if (line[i] === '{') {
      tokens.push('{');
      i++;
    } else if (line[i] === '}') {
      tokens.push('}');
      i++;
    } else {
      let end = i;
      while (end < line.length && line[end] !== ' ' && line[end] !== '\t') end++;
      tokens.push(line.slice(i, end));
      i = end;
    }
  }
  return tokens;
}

export function parseSieFile(buffer: ArrayBuffer): SieData {
  const text = decodeCP437(buffer);
  const lines = text.split(/\r?\n/);

  const data: SieData = {
    company: { name: '', orgNumber: '', program: '', generatedDate: '', accountPlan: '' },
    fiscalYears: [],
    accounts: new Map(),
    openingBalances: [],
    closingBalances: [],
    results: [],
    verifications: [],
  };

  let currentVer: SieVerification | null = null;
  let inVerBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (inVerBlock) {
      if (line === '}') {
        if (currentVer) data.verifications.push(currentVer);
        currentVer = null;
        inVerBlock = false;
        continue;
      }
      if (line.startsWith('#TRANS') && currentVer) {
        const tokens = tokenize(line);
        // #TRANS accountNo {dimList} amount
        const acct = tokens[1];
        // Find amount - skip the {} dimension list
        let amountIdx = 3;
        // tokens[2] should be {} or {dim values}
        if (tokens[2] === '{') {
          // find closing }
          amountIdx = tokens.indexOf('}', 2) + 1;
        }
        const amount = parseFloat(tokens[amountIdx]) || 0;
        currentVer.transactions.push({ accountNumber: acct, amount });
      }
      continue;
    }

    if (line === '{') {
      inVerBlock = true;
      continue;
    }

    const tokens = tokenize(line);
    const tag = tokens[0];

    switch (tag) {
      case '#FNAMN':
        data.company.name = unquote(tokens[1] || '');
        break;
      case '#ORGNR':
        data.company.orgNumber = tokens[1] || '';
        break;
      case '#PROGRAM':
        data.company.program = unquote(tokens[1] || '');
        break;
      case '#GEN':
        data.company.generatedDate = tokens[1] || '';
        break;
      case '#KPTYP':
        data.company.accountPlan = tokens[1] || '';
        break;
      case '#RAR': {
        const idx = parseInt(tokens[1]);
        data.fiscalYears.push({
          index: idx,
          startDate: tokens[2],
          endDate: tokens[3],
        });
        break;
      }
      case '#KONTO': {
        const num = tokens[1];
        const name = unquote(tokens[2] || '');
        const existing = data.accounts.get(num);
        if (existing) {
          existing.name = name;
        } else {
          data.accounts.set(num, { number: num, name });
        }
        break;
      }
      case '#SRU': {
        const acctNum = tokens[1];
        const sru = tokens[2];
        const existing = data.accounts.get(acctNum);
        if (existing) {
          existing.sruCode = sru;
        } else {
          data.accounts.set(acctNum, { number: acctNum, name: '', sruCode: sru });
        }
        break;
      }
      case '#IB': {
        const yearIdx = parseInt(tokens[1]);
        const acct = tokens[2];
        const amount = parseFloat(tokens[3]) || 0;
        data.openingBalances.push({ yearIndex: yearIdx, accountNumber: acct, amount });
        break;
      }
      case '#UB': {
        const yearIdx = parseInt(tokens[1]);
        const acct = tokens[2];
        const amount = parseFloat(tokens[3]) || 0;
        data.closingBalances.push({ yearIndex: yearIdx, accountNumber: acct, amount });
        break;
      }
      case '#RES': {
        const yearIdx = parseInt(tokens[1]);
        const acct = tokens[2];
        const amount = parseFloat(tokens[3]) || 0;
        data.results.push({ yearIndex: yearIdx, accountNumber: acct, amount });
        break;
      }
      case '#VER': {
        const series = unquote(tokens[1] || '');
        const num = unquote(tokens[2] || '');
        const date = tokens[3] || '';
        const desc = unquote(tokens[4] || '');
        const regDate = tokens[5] || '';
        currentVer = { series, number: num, date, description: desc, regDate, transactions: [] };
        break;
      }
    }
  }

  // Sort fiscal years by index (0 = current, -1 = prev, etc.)
  data.fiscalYears.sort((a, b) => b.index - a.index);

  return data;
}

/**
 * Merge multiple SIE files into a single SieData.
 * Company info is taken from the file with the latest fiscal year.
 * Fiscal years, balances, results, and verifications are merged/deduplicated.
 */
export function mergeSieData(files: SieData[]): SieData {
  if (files.length === 0) throw new Error('No files to merge');
  if (files.length === 1) return files[0];

  // Sort files by latest fiscal year to pick company info from newest
  const sorted = [...files].sort((a, b) => {
    const aMax = Math.max(...a.fiscalYears.map(fy => fy.index));
    const bMax = Math.max(...b.fiscalYears.map(fy => fy.index));
    return bMax - aMax;
  });

  const merged: SieData = {
    company: { ...sorted[0].company },
    fiscalYears: [],
    accounts: new Map(),
    openingBalances: [],
    closingBalances: [],
    results: [],
    verifications: [],
  };

  const seenFY = new Set<number>();
  const seenIB = new Set<string>();
  const seenUB = new Set<string>();
  const seenRES = new Set<string>();

  for (const file of sorted) {
    // Merge accounts
    for (const [num, acct] of file.accounts) {
      if (!merged.accounts.has(num)) {
        merged.accounts.set(num, { ...acct });
      }
    }

    // Merge fiscal years (deduplicate by index)
    for (const fy of file.fiscalYears) {
      if (!seenFY.has(fy.index)) {
        seenFY.add(fy.index);
        merged.fiscalYears.push({ ...fy });
      }
    }

    // Merge balances (deduplicate by yearIndex+accountNumber)
    for (const b of file.openingBalances) {
      const key = `${b.yearIndex}:${b.accountNumber}`;
      if (!seenIB.has(key)) {
        seenIB.add(key);
        merged.openingBalances.push({ ...b });
      }
    }
    for (const b of file.closingBalances) {
      const key = `${b.yearIndex}:${b.accountNumber}`;
      if (!seenUB.has(key)) {
        seenUB.add(key);
        merged.closingBalances.push({ ...b });
      }
    }
    for (const b of file.results) {
      const key = `${b.yearIndex}:${b.accountNumber}`;
      if (!seenRES.has(key)) {
        seenRES.add(key);
        merged.results.push({ ...b });
      }
    }

    // Merge verifications
    merged.verifications.push(...file.verifications);
  }

  merged.fiscalYears.sort((a, b) => b.index - a.index);
  return merged;
}
