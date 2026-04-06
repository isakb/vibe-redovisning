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
 * Year indices in SIE are relative per file (0=current, -1=prev).
 * We remap all indices to be relative to the newest file's year 0.
 */
export function mergeSieData(files: SieData[]): SieData {
  if (files.length === 0) throw new Error('No files to merge');
  if (files.length === 1) return files[0];

  // Sort files by their year-0 end date (newest first)
  const sorted = [...files].sort((a, b) => {
    const aYear0 = a.fiscalYears.find(fy => fy.index === 0);
    const bYear0 = b.fiscalYears.find(fy => fy.index === 0);
    return (bYear0?.endDate ?? '').localeCompare(aYear0?.endDate ?? '');
  });

  // Build a map: endDate -> global index (relative to newest file)
  // The newest file's year 0 keeps index 0
  const dateToIndex = new Map<string, number>();
  // First pass: collect all fiscal years with their absolute dates
  const allFYs: { endDate: string; startDate: string; sourceFile: number; localIndex: number }[] = [];
  for (let fi = 0; fi < sorted.length; fi++) {
    for (const fy of sorted[fi].fiscalYears) {
      allFYs.push({ endDate: fy.endDate, startDate: fy.startDate, sourceFile: fi, localIndex: fy.index });
    }
  }
  // Deduplicate by endDate, sort by date descending, assign global indices
  const uniqueEnds = [...new Set(allFYs.map(f => f.endDate))].sort((a, b) => b.localeCompare(a));
  uniqueEnds.forEach((end, i) => dateToIndex.set(end, -i)); // 0, -1, -2, ...

  // Build index remapper per file: localIndex -> globalIndex
  function getRemapper(file: SieData): Map<number, number> {
    const remap = new Map<number, number>();
    for (const fy of file.fiscalYears) {
      const globalIdx = dateToIndex.get(fy.endDate);
      if (globalIdx !== undefined) remap.set(fy.index, globalIdx);
    }
    return remap;
  }

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
  // Track source priority: localIndex 0 = authoritative for that year
  // Key -> { index in array, localIndex }
  const ibMap = new Map<string, { idx: number; localIndex: number }>();
  const ubMap = new Map<string, { idx: number; localIndex: number }>();
  const resMap = new Map<string, { idx: number; localIndex: number }>();

  for (const file of sorted) {
    const remap = getRemapper(file);

    // Merge accounts
    for (const [num, acct] of file.accounts) {
      if (!merged.accounts.has(num)) {
        merged.accounts.set(num, { ...acct });
      }
    }

    // Merge fiscal years (deduplicate by global index)
    for (const fy of file.fiscalYears) {
      const gi = remap.get(fy.index);
      if (gi !== undefined && !seenFY.has(gi)) {
        seenFY.add(gi);
        merged.fiscalYears.push({ ...fy, index: gi });
      }
    }

    // Helper: merge balance entries, preferring data from files where localIndex is closest to 0
    function mergeBalances(
      source: SieBalance[],
      target: SieBalance[],
      tracker: Map<string, { idx: number; localIndex: number }>
    ) {
      for (const b of source) {
        const localIdx = b.yearIndex; // original local index in this file
        const gi = remap.get(localIdx);
        if (gi === undefined) continue;
        const key = `${gi}:${b.accountNumber}`;
        const existing = tracker.get(key);
        // Prefer the source with localIndex closest to 0 (0 = authoritative primary year)
        if (!existing || Math.abs(localIdx) < Math.abs(existing.localIndex)) {
          if (existing) {
            // Replace existing entry
            target[existing.idx] = { ...b, yearIndex: gi };
          } else {
            // New entry
            tracker.set(key, { idx: target.length, localIndex: localIdx });
            target.push({ ...b, yearIndex: gi });
          }
          tracker.set(key, { idx: existing?.idx ?? (target.length - 1), localIndex: localIdx });
        }
      }
    }

    mergeBalances(file.openingBalances, merged.openingBalances, ibMap);
    mergeBalances(file.closingBalances, merged.closingBalances, ubMap);
    mergeBalances(file.results, merged.results, resMap);

    // Merge verifications
    merged.verifications.push(...file.verifications);
  }

  merged.fiscalYears.sort((a, b) => b.index - a.index);
  return merged;
}
