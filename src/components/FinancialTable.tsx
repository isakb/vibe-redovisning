import { K2Section, formatSEK } from '@/lib/k2Calculations';

interface FinancialTableProps {
  sections: K2Section[];
  yearLabels: { index: number; label: string }[];
}

export function FinancialTable({ sections, yearLabels }: FinancialTableProps) {
  return (
    <div className="text-sm">
      {sections.map((section, si) => (
        <div key={si} className="mb-4">
          {section.title && (
            <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wide mb-2">
              {section.title}
            </h4>
          )}
          {section.items.map((item, ii) => {
            // Skip items where all amounts are 0
            const hasValue = yearLabels.some(y => (item.amounts[y.index] || 0) !== 0);
            if (!hasValue && !item.isBold) return null;
            
            return (
              <div
                key={ii}
                className={`flex justify-between py-1 ${
                  item.isSubtotal ? 'border-t border-border' : ''
                } ${item.isBold ? 'font-semibold' : ''}`}
                style={{ paddingLeft: item.indent ? `${item.indent * 16}px` : undefined }}
              >
                <span className="flex-1">{item.label}</span>
                <div className="flex">
                  {yearLabels.map(y => (
                    <span key={y.index} className="w-28 text-right">
                      {formatSEK(item.amounts[y.index] || 0)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
