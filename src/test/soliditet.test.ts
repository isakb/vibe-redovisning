import { describe, it, expect } from 'vitest';
import { calculateFlerarsOversikt } from '@/lib/k2Calculations';
import { SieData } from '@/lib/sieParser';

function makeSieData(overrides: Partial<SieData> = {}): SieData {
  return {
    company: { name: 'Test AB', orgNumber: '556000-0000', program: '', generatedDate: '', accountPlan: '' },
    fiscalYears: [
      { index: 0, startDate: '20250101', endDate: '20251231' },
      { index: -1, startDate: '20240101', endDate: '20241231' },
      { index: -2, startDate: '20230101', endDate: '20231231' },
      { index: -3, startDate: '20220101', endDate: '20221231' },
    ],
    accounts: new Map(),
    openingBalances: [],
    closingBalances: [],
    results: [],
    transactions: [],
    ...overrides,
  };
}

describe('Soliditet calculation', () => {
  it('calculates soliditet as (eget kapital / balansomslutning) * 100', () => {
    // Eget kapital accounts 2080-2099 are credit (negative in SIE)
    // Total assets accounts 1000-1999 are debit (positive in SIE)
    const data = makeSieData({
      closingBalances: [
        // Assets: total 1 000 000
        { accountNumber: '1930', yearIndex: 0, amount: 600000 },
        { accountNumber: '1510', yearIndex: 0, amount: 400000 },
        // Equity: -400 000 in SIE (credit) = 400 000 accounting value
        { accountNumber: '2081', yearIndex: 0, amount: -100000 },
        { accountNumber: '2091', yearIndex: 0, amount: -200000 },
        { accountNumber: '2099', yearIndex: 0, amount: -100000 },
      ],
      results: [],
    });

    const result = calculateFlerarsOversikt(data);
    // Soliditet = 400 000 / 1 000 000 * 100 = 40%
    expect(result.soliditet[0]).toBe(40);
  });

  it('returns 0 when balansomslutning is 0', () => {
    const data = makeSieData({ closingBalances: [], results: [] });
    const result = calculateFlerarsOversikt(data);
    expect(result.soliditet[0]).toBe(0);
  });

  it('shows negative soliditet when equity is negative', () => {
    const data = makeSieData({
      closingBalances: [
        { accountNumber: '1930', yearIndex: 0, amount: 500000 },
        // Positive amount in SIE = debit = negative equity
        { accountNumber: '2099', yearIndex: 0, amount: 200000 },
      ],
      results: [],
    });

    const result = calculateFlerarsOversikt(data);
    // Eget kapital = -200000 (negative), balansomslutning = 500000
    // Soliditet = -200000 / 500000 * 100 = -40%
    expect(result.soliditet[0]).toBe(-40);
  });
});
