import { SieCompanyInfo, SieFiscalYear } from '@/lib/sieParser';
import { K2IncomeStatement, K2BalanceSheet, FlerarsOversikt, EgetKapitalForandring, Skatteberakning, formatSEK } from '@/lib/k2Calculations';
import { ReportData } from '@/lib/k2Types';
import { Separator } from '@/components/ui/separator';

interface ReportPreviewProps {
  company: SieCompanyInfo;
  fiscalYear: string;
  reportData: ReportData;
  incomeStatement: K2IncomeStatement;
  balanceSheet: K2BalanceSheet;
  flerarsOversikt: FlerarsOversikt;
  egetKapitalForandring: EgetKapitalForandring;
  fiscalYears: SieFiscalYear[];
  skatteberakning: Skatteberakning;
}

export function ReportPreview({
  company,
  fiscalYear,
  reportData,
  incomeStatement,
  balanceSheet,
  flerarsOversikt,
  egetKapitalForandring,
  fiscalYears,
  skatteberakning,
}: ReportPreviewProps) {
  const currentFY = fiscalYears.find(fy => fy.index === 0);
  const prevFY = fiscalYears.find(fy => fy.index === -1);

  return (
    <div className="max-w-3xl mx-auto bg-card border rounded-lg shadow-sm">
      {/* Cover page */}
      <div className="p-12 text-center border-b">
        <h1 className="text-2xl font-bold text-foreground mb-2">Årsredovisning</h1>
        <p className="text-lg text-foreground">{company.name}</p>
        <p className="text-muted-foreground">Org.nr {company.orgNumber}</p>
        <p className="text-muted-foreground mt-2">Räkenskapsåret {fiscalYear}</p>
      </div>

      {/* Förvaltningsberättelse */}
      <div className="p-8 border-b">
        <h2 className="text-xl font-bold text-foreground mb-4">Förvaltningsberättelse</h2>
        
        <h3 className="font-semibold text-foreground mt-4 mb-2">Verksamheten</h3>
        <p className="text-sm text-foreground whitespace-pre-wrap">{reportData.verksamhetsbeskrivning}</p>

        {reportData.vasEntligaHandelser && (
          <>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Väsentliga händelser under räkenskapsåret</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">{reportData.vasEntligaHandelser}</p>
          </>
        )}

        {/* Flerårsöversikt */}
        <h3 className="font-semibold text-foreground mt-6 mb-3">Flerårsöversikt</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="text-left py-2"></th>
              {flerarsOversikt.years.map(y => (
                <th key={y.index} className="text-right py-2 px-2 font-medium">{y.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-1.5">Nettoomsättning (kr)</td>
              {flerarsOversikt.years.map(y => (
                <td key={y.index} className="text-right py-1.5 px-2">{formatSEK(flerarsOversikt.nettoomsattning[y.index] || 0)}</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-1.5">Resultat efter finansiella poster (kr)</td>
              {flerarsOversikt.years.map(y => (
                <td key={y.index} className="text-right py-1.5 px-2">{formatSEK(flerarsOversikt.resultatEfterFinansiellaPoster[y.index] || 0)}</td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="py-1.5">Balansomslutning (kr)</td>
              {flerarsOversikt.years.map(y => (
                <td key={y.index} className="text-right py-1.5 px-2">{formatSEK(flerarsOversikt.balansomslutning[y.index] || 0)}</td>
              ))}
            </tr>
            <tr>
              <td className="py-1.5">Soliditet (%)</td>
              {flerarsOversikt.years.map(y => (
                <td key={y.index} className="text-right py-1.5 px-2">{flerarsOversikt.soliditet[y.index] || 0}%</td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Förändringar i eget kapital */}
        <h3 className="font-semibold text-foreground mt-6 mb-3">Förändringar i eget kapital</h3>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="text-left py-2"></th>
              <th className="text-right py-2 px-2 font-medium">Aktiekapital</th>
              <th className="text-right py-2 px-2 font-medium">Balanserat resultat</th>
              <th className="text-right py-2 px-2 font-medium">Årets resultat</th>
              <th className="text-right py-2 px-2 font-medium">Totalt</th>
            </tr>
          </thead>
          <tbody>
            {egetKapitalForandring.rows.map((row, i) => (
              <tr key={i} className={i < egetKapitalForandring.rows.length - 1 ? 'border-b' : 'border-t-2 border-foreground'}>
                <td className={`py-1.5 ${i === 0 || i === egetKapitalForandring.rows.length - 1 ? 'font-medium' : ''}`}>
                  {row.label}
                </td>
                <td className="text-right py-1.5 px-2">{formatSEK(row.aktiekapital[0] || 0)}</td>
                <td className="text-right py-1.5 px-2">{formatSEK(row.balanserat[0] || 0)}</td>
                <td className="text-right py-1.5 px-2">{formatSEK(row.aretsResultat[0] || 0)}</td>
                <td className="text-right py-1.5 px-2 font-medium">{formatSEK(row.totalt[0] || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Resultatdisposition */}
        <h3 className="font-semibold text-foreground mt-6 mb-3">Resultatdisposition</h3>
        <p className="text-sm text-foreground mb-2">Styrelsen föreslår att till förfogande stående medel disponeras enligt följande:</p>
        <table className="text-sm">
          <tbody>
            {reportData.utdelning > 0 && (
              <tr>
                <td className="py-1 pr-8">Utdelning till aktieägarna</td>
                <td className="text-right py-1">{formatSEK(reportData.utdelning)} kr</td>
              </tr>
            )}
            <tr>
              <td className="py-1 pr-8">Balanseras i ny räkning</td>
              <td className="text-right py-1">{formatSEK(reportData.tillBalanseratResultat)} kr</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resultaträkning */}
      <div className="p-8 border-b">
        <h2 className="text-xl font-bold text-foreground mb-4">Resultaträkning</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="text-left py-2"></th>
              <th className="text-right py-2 px-2 font-medium">
                {currentFY ? `${currentFY.startDate.slice(0,4)}-${currentFY.startDate.slice(4,6)}-${currentFY.startDate.slice(6,8)} – ${currentFY.endDate.slice(0,4)}-${currentFY.endDate.slice(4,6)}-${currentFY.endDate.slice(6,8)}` : ''}
              </th>
              <th className="text-right py-2 px-2 font-medium">
                {prevFY ? `${prevFY.startDate.slice(0,4)}-${prevFY.startDate.slice(4,6)}-${prevFY.startDate.slice(6,8)} – ${prevFY.endDate.slice(0,4)}-${prevFY.endDate.slice(4,6)}-${prevFY.endDate.slice(6,8)}` : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {incomeStatement.sections.map((section, si) => (
              <>
                {section.title && (
                  <tr key={`s-${si}`}>
                    <td colSpan={3} className="pt-4 pb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </td>
                  </tr>
                )}
                {section.items.map((item, ii) => {
                  const hasValue = [0, -1].some(yi => (item.amounts[yi] || 0) !== 0);
                  if (!hasValue && !item.isBold) return null;
                  return (
                    <tr key={`${si}-${ii}`} className={`${item.isSubtotal ? 'border-t' : ''} ${item.isBold ? 'font-semibold' : ''}`}>
                      <td className="py-1" style={{ paddingLeft: item.indent ? `${item.indent * 16}px` : undefined }}>{item.label}</td>
                      <td className="text-right py-1 px-2">{formatSEK(item.amounts[0] || 0)}</td>
                      <td className="text-right py-1 px-2">{formatSEK(item.amounts[-1] || 0)}</td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Balansräkning */}
      <div className="p-8 border-b">
        <h2 className="text-xl font-bold text-foreground mb-4">Balansräkning</h2>
        
        <h3 className="font-semibold text-foreground mb-2">TILLGÅNGAR</h3>
        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="text-left py-2"></th>
              <th className="text-right py-2 px-2 font-medium">
                {currentFY ? `${currentFY.endDate.slice(0,4)}-${currentFY.endDate.slice(4,6)}-${currentFY.endDate.slice(6,8)}` : ''}
              </th>
              <th className="text-right py-2 px-2 font-medium">
                {prevFY ? `${prevFY.endDate.slice(0,4)}-${prevFY.endDate.slice(4,6)}-${prevFY.endDate.slice(6,8)}` : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {balanceSheet.assets.map((section, si) => (
              <>
                {section.title && (
                  <tr key={`a-${si}`}>
                    <td colSpan={3} className="pt-3 pb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </td>
                  </tr>
                )}
                {section.items.map((item, ii) => (
                  <tr key={`a-${si}-${ii}`} className={`${item.isSubtotal ? 'border-t' : ''} ${item.isBold ? 'font-semibold' : ''}`}>
                    <td className="py-1" style={{ paddingLeft: item.indent ? `${item.indent * 16}px` : undefined }}>{item.label}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[0] || 0)}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[-1] || 0)}</td>
                  </tr>
                ))}
              </>
            ))}
            <tr className="border-t-2 border-foreground font-bold">
              <td className="py-2">SUMMA TILLGÅNGAR</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalAssets[0] || 0)}</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalAssets[-1] || 0)}</td>
            </tr>
          </tbody>
        </table>

        <Separator className="my-4" />

        <h3 className="font-semibold text-foreground mb-2">EGET KAPITAL OCH SKULDER</h3>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {balanceSheet.equityAndLiabilities.map((section, si) => (
              <>
                {section.title && (
                  <tr key={`e-${si}`}>
                    <td colSpan={3} className="pt-3 pb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </td>
                  </tr>
                )}
                {section.items.map((item, ii) => (
                  <tr key={`e-${si}-${ii}`} className={`${item.isSubtotal ? 'border-t' : ''} ${item.isBold ? 'font-semibold' : ''}`}>
                    <td className="py-1" style={{ paddingLeft: item.indent ? `${item.indent * 16}px` : undefined }}>{item.label}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[0] || 0)}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[-1] || 0)}</td>
                  </tr>
                ))}
              </>
            ))}
            <tr className="border-t-2 border-foreground font-bold">
              <td className="py-2">SUMMA EGET KAPITAL OCH SKULDER</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalEquityAndLiabilities[0] || 0)}</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalEquityAndLiabilities[-1] || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Noter */}
      <div className="p-8 border-b">
        <h2 className="text-xl font-bold text-foreground mb-4">Noter</h2>
        
        <h3 className="font-semibold text-foreground mb-2">Not 1 – Redovisningsprinciper</h3>
        <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{reportData.redovisningsprinciper}</p>

        <h3 className="font-semibold text-foreground mb-2">Not 2 – Medelantal anställda</h3>
        <p className="text-sm text-foreground">Medelantalet anställda under räkenskapsåret har uppgått till {reportData.medeltalAnstallda}.</p>
      </div>

      {/* Underskrifter */}
      <div className="p-8">
        <h2 className="text-xl font-bold text-foreground mb-6">Underskrifter</h2>
        <p className="text-sm text-foreground mb-8">
          {reportData.plats}{reportData.plats ? ', ' : ''}{reportData.signDate}
        </p>
        <div className="space-y-8">
          {reportData.signatories.map((sig, i) => (
            <div key={i} className="pt-8 border-t border-dashed">
              <p className="text-sm font-medium text-foreground">{sig.name || '________________________'}</p>
              <p className="text-xs text-muted-foreground">{sig.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
