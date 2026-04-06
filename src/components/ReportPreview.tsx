import { SieCompanyInfo, SieFiscalYear } from '@/lib/sieParser';
import { K2IncomeStatement, K2BalanceSheet, FlerarsOversikt, EgetKapitalForandring, Skatteberakning, formatSEK, formatDate } from '@/lib/k2Calculations';
import { ReportData } from '@/lib/k2Types';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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
  selectedYearIndex: number;
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
  selectedYearIndex,
}: ReportPreviewProps) {
  const currentYI = selectedYearIndex;
  const prevYI = selectedYearIndex - 1;
  const currentFY = fiscalYears.find(fy => fy.index === currentYI);
  const prevFY = fiscalYears.find(fy => fy.index === prevYI);

  const formatFYRange = (fy: SieFiscalYear) =>
    `${fy.startDate.slice(0,4)}-${fy.startDate.slice(4,6)}-${fy.startDate.slice(6,8)} – ${fy.endDate.slice(0,4)}-${fy.endDate.slice(4,6)}-${fy.endDate.slice(6,8)}`;
  const formatFYDate = (fy: SieFiscalYear) =>
    `${fy.endDate.slice(0,4)}-${fy.endDate.slice(4,6)}-${fy.endDate.slice(6,8)}`;

  // Balance verification
  const totalA = balanceSheet.totalAssets[currentYI] || 0;
  const totalEL = balanceSheet.totalEquityAndLiabilities[currentYI] || 0;
  const balanceOk = Math.abs(totalA - totalEL) < 1;

  // Resultatdisposition breakdown
  const egetKapitalRows = egetKapitalForandring.rows;
  const balResultatForeDisp = egetKapitalRows.length > 0 ? (egetKapitalRows[0]?.balanserat[currentYI] || 0) + (egetKapitalRows[0]?.aretsResultat[currentYI] || 0) : 0;

  return (
    <div className="max-w-3xl mx-auto bg-card border rounded-lg shadow-sm">
      {/* Balance warning */}
      {!balanceOk && (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Balansräkningen stämmer inte: Tillgångar ({formatSEK(totalA)}) ≠ Eget kapital och skulder ({formatSEK(totalEL)}). Differens: {formatSEK(totalA - totalEL)} kr.
          </AlertDescription>
        </Alert>
      )}

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
        
        {reportData.bolagetsSate && (
          <>
            <h3 className="font-semibold text-foreground mt-4 mb-2">Allmänt om verksamheten</h3>
            <p className="text-sm text-foreground">Bolaget har sitt säte i {reportData.bolagetsSate}.</p>
          </>
        )}

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
              {flerarsOversikt.years.map(y => {
                const override = reportData.flerarsOverrides?.[y.index]?.nettoomsattning;
                const val = override !== undefined ? override : (flerarsOversikt.nettoomsattning[y.index] || 0);
                return <td key={y.index} className="text-right py-1.5 px-2">{formatSEK(val)}</td>;
              })}
            </tr>
            <tr className="border-b">
              <td className="py-1.5">Resultat efter finansiella poster (kr)</td>
              {flerarsOversikt.years.map(y => {
                const override = reportData.flerarsOverrides?.[y.index]?.resultatEfterFinansiellaPoster;
                const val = override !== undefined ? override : (flerarsOversikt.resultatEfterFinansiellaPoster[y.index] || 0);
                return <td key={y.index} className="text-right py-1.5 px-2">{formatSEK(val)}</td>;
              })}
            </tr>
            <tr className="border-b">
              <td className="py-1.5">Balansomslutning (kr)</td>
              {flerarsOversikt.years.map(y => {
                const override = reportData.flerarsOverrides?.[y.index]?.balansomslutning;
                const val = override !== undefined ? override : (flerarsOversikt.balansomslutning[y.index] || 0);
                return <td key={y.index} className="text-right py-1.5 px-2">{formatSEK(val)}</td>;
              })}
            </tr>
            <tr>
              <td className="py-1.5">Soliditet (%)</td>
              {flerarsOversikt.years.map(y => {
                const override = reportData.flerarsOverrides?.[y.index]?.soliditet;
                const val = override !== undefined ? override : (flerarsOversikt.soliditet[y.index] || 0);
                return <td key={y.index} className="text-right py-1.5 px-2">{val}%</td>;
              })}
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
                <td className="text-right py-1.5 px-2">{formatSEK(row.aktiekapital[currentYI] || 0)}</td>
                <td className="text-right py-1.5 px-2">{formatSEK(row.balanserat[currentYI] || 0)}</td>
                <td className="text-right py-1.5 px-2">{formatSEK(row.aretsResultat[currentYI] || 0)}</td>
                <td className="text-right py-1.5 px-2 font-medium">{formatSEK(row.totalt[currentYI] || 0)}</td>
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
                {currentFY ? formatFYRange(currentFY) : ''}
              </th>
              <th className="text-right py-2 px-2 font-medium">
                {prevFY ? formatFYRange(prevFY) : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {incomeStatement.sections.map((section, si) => (
              <React.Fragment key={`s-${si}`}>
                {section.title && (
                  <tr>
                    <td colSpan={3} className="pt-4 pb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </td>
                  </tr>
                )}
                {section.items.map((item, ii) => {
                  const hasValue = [currentYI, prevYI].some(yi => (item.amounts[yi] || 0) !== 0);
                  if (!hasValue && !item.isBold) return null;
                  return (
                    <tr key={`${si}-${ii}`} className={`${item.isSubtotal ? 'border-t' : ''} ${item.isBold ? 'font-semibold' : ''}`}>
                      <td className="py-1" style={{ paddingLeft: item.indent ? `${item.indent * 16}px` : undefined }}>{item.label}</td>
                      <td className="text-right py-1 px-2">{formatSEK(item.amounts[currentYI] || 0)}</td>
                      <td className="text-right py-1 px-2">{formatSEK(item.amounts[prevYI] || 0)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
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
                {currentFY ? formatFYDate(currentFY) : ''}
              </th>
              <th className="text-right py-2 px-2 font-medium">
                {prevFY ? formatFYDate(prevFY) : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {balanceSheet.assets.map((section, si) => (
              <React.Fragment key={`a-${si}`}>
                {section.title && (
                  <tr>
                    <td colSpan={3} className="pt-3 pb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </td>
                  </tr>
                )}
                {section.items.map((item, ii) => (
                  <tr key={`a-${si}-${ii}`} className={`${item.isSubtotal ? 'border-t' : ''} ${item.isBold ? 'font-semibold' : ''}`}>
                    <td className="py-1" style={{ paddingLeft: item.indent ? `${item.indent * 16}px` : undefined }}>{item.label}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[currentYI] || 0)}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[prevYI] || 0)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="border-t-2 border-foreground font-bold">
              <td className="py-2">SUMMA TILLGÅNGAR</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalAssets[currentYI] || 0)}</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalAssets[prevYI] || 0)}</td>
            </tr>
          </tbody>
        </table>

        <Separator className="my-4" />

        <h3 className="font-semibold text-foreground mb-2">EGET KAPITAL OCH SKULDER</h3>
        <table className="w-full text-sm border-collapse">
          <tbody>
            {balanceSheet.equityAndLiabilities.map((section, si) => (
              <React.Fragment key={`e-${si}`}>
                {section.title && (
                  <tr>
                    <td colSpan={3} className="pt-3 pb-1 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      {section.title}
                    </td>
                  </tr>
                )}
                {section.items.map((item, ii) => (
                  <tr key={`e-${si}-${ii}`} className={`${item.isSubtotal ? 'border-t' : ''} ${item.isBold ? 'font-semibold' : ''}`}>
                    <td className="py-1" style={{ paddingLeft: item.indent ? `${item.indent * 16}px` : undefined }}>{item.label}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[currentYI] || 0)}</td>
                    <td className="text-right py-1 px-2">{formatSEK(item.amounts[prevYI] || 0)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="border-t-2 border-foreground font-bold">
              <td className="py-2">SUMMA EGET KAPITAL OCH SKULDER</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalEquityAndLiabilities[currentYI] || 0)}</td>
              <td className="text-right py-2 px-2">{formatSEK(balanceSheet.totalEquityAndLiabilities[prevYI] || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Skatteberäkning */}
      {skatteberakning.saknarSkattebokning && (
        <div className="p-8 border-b">
          <h2 className="text-xl font-bold text-foreground mb-4">Skatteberäkning</h2>
          <table className="text-sm mb-4">
            <tbody>
              <tr><td className="py-1 pr-8">Resultat före skatt</td><td className="text-right py-1">{formatSEK(skatteberakning.resultatForeSkatt)} kr</td></tr>
              {skatteberakning.ejAvdragsgillaPoster !== 0 && (
                <tr><td className="py-1 pr-8">Ej avdragsgilla kostnader</td><td className="text-right py-1">{formatSEK(skatteberakning.ejAvdragsgillaPoster)} kr</td></tr>
              )}
              {skatteberakning.outnyttjatUnderskott !== 0 && (
                <tr><td className="py-1 pr-8">Outnyttjat underskott från fg. år</td><td className="text-right py-1">-{formatSEK(skatteberakning.outnyttjatUnderskott)} kr</td></tr>
              )}
              <tr><td className="py-1 pr-8">Skattemässigt resultat</td><td className="text-right py-1">{formatSEK(skatteberakning.skattemassigResultat)} kr</td></tr>
              <tr><td className="py-1 pr-8">Skattesats</td><td className="text-right py-1">{skatteberakning.skattesats}%</td></tr>
              <tr className="font-semibold"><td className="py-1 pr-8">Skatt på årets resultat</td><td className="text-right py-1">{formatSEK(skatteberakning.skattPaAretsResultat)} kr</td></tr>
            </tbody>
          </table>

          <h3 className="font-semibold text-foreground mt-4 mb-2">Förslag på verifikation — Skatt</h3>
          <table className="w-full text-sm border-collapse border mb-2">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-1.5 px-2 font-medium">Konto</th>
                <th className="text-right py-1.5 px-2 font-medium">Debit</th>
                <th className="text-right py-1.5 px-2 font-medium">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {skatteberakning.skatteverifikation.map((r, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-1.5 px-2">{r.konto} {r.kontonamn}</td>
                  <td className="text-right py-1.5 px-2">{r.debit > 0 ? formatSEK(r.debit) : ''}</td>
                  <td className="text-right py-1.5 px-2">{r.kredit > 0 ? formatSEK(r.kredit) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">Bokföringsdatum {skatteberakning.bokforingsdatum}</p>

          <h3 className="font-semibold text-foreground mt-4 mb-2">Förslag på verifikation — Årets resultat</h3>
          <table className="w-full text-sm border-collapse border mb-2">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-1.5 px-2 font-medium">Konto</th>
                <th className="text-right py-1.5 px-2 font-medium">Debit</th>
                <th className="text-right py-1.5 px-2 font-medium">Kredit</th>
              </tr>
            </thead>
            <tbody>
              {skatteberakning.resultatverifikation.map((r, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="py-1.5 px-2">{r.konto} {r.kontonamn}</td>
                  <td className="text-right py-1.5 px-2">{r.debit > 0 ? formatSEK(r.debit) : ''}</td>
                  <td className="text-right py-1.5 px-2">{r.kredit > 0 ? formatSEK(r.kredit) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">Bokföringsdatum {skatteberakning.bokforingsdatum}</p>
        </div>
      )}

      {/* Noter */}
      <div className="p-8 border-b">
        <h2 className="text-xl font-bold text-foreground mb-4">Noter</h2>
        
        <h3 className="font-semibold text-foreground mb-2">Not 1 – Redovisningsprinciper</h3>
        <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{reportData.redovisningsprinciper}</p>

        <h3 className="font-semibold text-foreground mb-2">Not 2 – Medelantal anställda</h3>
        <p className="text-sm text-foreground mb-4">Medelantalet anställda under räkenskapsåret har uppgått till {reportData.medeltalAnstallda}.</p>

        {reportData.useAbbreviatedForm && reportData.noteNettoomsattning && (
          <>
            <h3 className="font-semibold text-foreground mb-2">Not 3 – Nettoomsättning</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{reportData.noteNettoomsattning}</p>
          </>
        )}

        {reportData.noteAvskrivningsgrunder && (
          <>
            <h3 className="font-semibold text-foreground mb-2">Not {reportData.useAbbreviatedForm ? '4' : '3'} – Avskrivningar av materiella anläggningstillgångar</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap mb-4">{reportData.noteAvskrivningsgrunder}</p>
          </>
        )}

        {reportData.noteAnlaggningstillgangar && reportData.noteAnlaggningstillgangar.length > 0 && (
          <>
            <h3 className="font-semibold text-foreground mb-2">Not {reportData.useAbbreviatedForm ? '5' : '4'} – Anläggningstillgångar</h3>
            <table className="w-full text-sm border-collapse mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1"></th>
                  {reportData.noteAnlaggningstillgangar.map((a, i) => (
                    <th key={i} className="text-right py-1 px-2 font-medium">{a.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-1">Ingående anskaffningsvärde</td>{reportData.noteAnlaggningstillgangar.map((a, i) => <td key={i} className="text-right py-1 px-2">{formatSEK(a.ingaende)}</td>)}</tr>
                <tr className="border-b"><td className="py-1">Inköp</td>{reportData.noteAnlaggningstillgangar.map((a, i) => <td key={i} className="text-right py-1 px-2">{formatSEK(a.inkop)}</td>)}</tr>
                <tr className="border-b"><td className="py-1">Försäljning/utrangering</td>{reportData.noteAnlaggningstillgangar.map((a, i) => <td key={i} className="text-right py-1 px-2">{formatSEK(a.forsaljning)}</td>)}</tr>
                <tr className="border-b"><td className="py-1">Årets avskrivning</td>{reportData.noteAnlaggningstillgangar.map((a, i) => <td key={i} className="text-right py-1 px-2">{formatSEK(a.avskrivning)}</td>)}</tr>
                <tr className="font-semibold"><td className="py-1">Utgående restvärde</td>{reportData.noteAnlaggningstillgangar.map((a, i) => <td key={i} className="text-right py-1 px-2">{formatSEK(a.utgaende)}</td>)}</tr>
              </tbody>
            </table>
          </>
        )}

        <h3 className="font-semibold text-foreground mb-2">Ställda säkerheter</h3>
        <p className="text-sm text-foreground mb-4">{reportData.stalldaSakerheter || 'Inga'}</p>

        <h3 className="font-semibold text-foreground mb-2">Eventualförpliktelser</h3>
        <p className="text-sm text-foreground mb-4">{reportData.eventualforpliktelser || 'Inga'}</p>
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

// Need React import for React.Fragment
import React from 'react';
