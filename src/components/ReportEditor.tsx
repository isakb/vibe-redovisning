import { SieData } from '@/lib/sieParser';
import { K2IncomeStatement, K2BalanceSheet, FlerarsOversikt, EgetKapitalForandring, Skatteberakning, formatSEK } from '@/lib/k2Calculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReportData, Signatory, FlerarsOverride, NoteAnlaggningstillgang } from '@/lib/k2Types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { FinancialTable } from './FinancialTable';
import { TaxCalculationSection } from './TaxCalculationSection';

interface ReportEditorProps {
  sieData: SieData;
  reportData: ReportData;
  onChange: (data: ReportData) => void;
  incomeStatement: K2IncomeStatement;
  balanceSheet: K2BalanceSheet;
  flerarsOversikt: FlerarsOversikt;
  egetKapitalForandring: EgetKapitalForandring;
  skatteberakning: Skatteberakning;
  selectedYearIndex: number;
  verModalOpen: boolean;
  onVerModalOpenChange: (open: boolean) => void;
}

export function ReportEditor({
  sieData,
  reportData,
  onChange,
  incomeStatement,
  balanceSheet,
  flerarsOversikt,
  egetKapitalForandring,
  skatteberakning,
  selectedYearIndex,
}: ReportEditorProps) {
  const update = (partial: Partial<ReportData>) => onChange({ ...reportData, ...partial });
  const yi = selectedYearIndex;
  const prevYI = selectedYearIndex - 1;

  const addSignatory = () => {
    update({ signatories: [...reportData.signatories, { name: '', role: 'Styrelseledamot' }] });
  };

  const removeSignatory = (index: number) => {
    update({ signatories: reportData.signatories.filter((_, i) => i !== index) });
  };

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    const updated = [...reportData.signatories];
    updated[index] = { ...updated[index], [field]: value };
    update({ signatories: updated });
  };

  const currentFY = sieData.fiscalYears.find(fy => fy.index === yi);
  const prevFY = sieData.fiscalYears.find(fy => fy.index === prevYI);

  // Balance verification
  const totalA = balanceSheet.totalAssets[yi] || 0;
  const totalEL = balanceSheet.totalEquityAndLiabilities[yi] || 0;
  const balanceOk = Math.abs(totalA - totalEL) < 1;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Balance warning */}
      {!balanceOk && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Balansräkningen stämmer inte!</strong> Tillgångar ({formatSEK(totalA)}) ≠ Eget kapital och skulder ({formatSEK(totalEL)}). Differens: {formatSEK(totalA - totalEL)} kr.
          </AlertDescription>
        </Alert>
      )}


      {/* Förvaltningsberättelse */}
      <Card>
        <CardHeader>
          <CardTitle>Förvaltningsberättelse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bolagets säte</Label>
            <Input
              value={reportData.bolagetsSate}
              onChange={e => update({ bolagetsSate: e.target.value })}
              placeholder="Stockholm"
            />
          </div>
          <div className="space-y-2">
            <Label>Verksamhetsbeskrivning</Label>
            <Textarea
              value={reportData.verksamhetsbeskrivning}
              onChange={e => update({ verksamhetsbeskrivning: e.target.value })}
              rows={3}
              placeholder="Beskriv bolagets verksamhet..."
            />
          </div>
          <div className="space-y-2">
            <Label>Väsentliga händelser under räkenskapsåret</Label>
            <Textarea
              value={reportData.vasEntligaHandelser}
              onChange={e => update({ vasEntligaHandelser: e.target.value })}
              rows={3}
              placeholder="Beskriv väsentliga händelser..."
            />
          </div>
          <div className="space-y-2">
            <Label>Egna aktier</Label>
            <Input
              value={reportData.egnaAktier}
              onChange={e => update({ egnaAktier: e.target.value })}
              placeholder="Lämna tomt om inga egna aktier innehas"
            />
          </div>
        </CardContent>
      </Card>

      {/* Flerårsöversikt (editable for missing data) */}
      <Card>
        <CardHeader>
          <CardTitle>Flerårsöversikt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Värden som saknas i SIE-filen kan matas in manuellt. Soliditet beräknas automatiskt om balansomslutning finns.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Nyckeltal</th>
                  {flerarsOversikt.years.map(y => (
                    <th key={y.index} className="text-right py-2 font-medium text-muted-foreground px-3">
                      {y.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  { key: 'nettoomsattning' as const, label: 'Nettoomsättning (kr)', data: flerarsOversikt.nettoomsattning, isSoliditet: false },
                  { key: 'resultatEfterFinansiellaPoster' as const, label: 'Resultat efter finansiella poster (kr)', data: flerarsOversikt.resultatEfterFinansiellaPoster, isSoliditet: false },
                  { key: 'balansomslutning' as const, label: 'Balansomslutning (kr)', data: flerarsOversikt.balansomslutning, isSoliditet: false },
                  { key: 'soliditet' as const, label: 'Soliditet (%)', data: flerarsOversikt.soliditet, isSoliditet: true },
                ]).map(row => (
                  <tr key={row.key} className="border-b last:border-b-0">
                    <td className="py-2">{row.label}</td>
                    {flerarsOversikt.years.map(y => {
                      const sieValue = row.data[y.index] || 0;
                      const override = reportData.flerarsOverrides?.[y.index]?.[row.key];
                      const hasSieData = sieValue !== 0;

                      if (row.isSoliditet) {
                        const mergedSoliditet = override !== undefined ? override : sieValue;
                        if (hasSieData) {
                          const bd = flerarsOversikt.soliditetBreakdown?.[y.index];
                          return (
                            <td key={y.index} className="text-right py-2 px-3">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">
                                    {sieValue}%
                                  </TooltipTrigger>
                                  {bd && (
                                    <TooltipContent side="top" className="text-xs space-y-1 max-w-xs">
                                      <p className="font-semibold mb-1">Soliditet = Justerat EK / Balansomslutning</p>
                                      <p>Eget kapital: {formatSEK(bd.egetKapital)} kr</p>
                                      {bd.obeskatadeReserver !== 0 && (
                                        <p>Obeskattade reserver: {formatSEK(bd.obeskatadeReserver)} kr</p>
                                      )}
                                      {bd.obeskatadeReserver !== 0 && (
                                        <p>× (1 − 20,6%) = {formatSEK((1 - 0.206) * bd.obeskatadeReserver)} kr</p>
                                      )}
                                      <p className="font-medium">Justerat EK: {formatSEK(bd.justeratEK)} kr</p>
                                      <p>Balansomslutning: {formatSEK(bd.totalAssets)} kr</p>
                                      {bd.taxReceivable > 0 && (
                                        <p className="text-muted-foreground">(varav skattefordran: {formatSEK(bd.taxReceivable)} kr)</p>
                                      )}
                                      <p className="font-medium pt-1 border-t">{formatSEK(bd.justeratEK)} / {formatSEK(bd.totalAssets)} = {sieValue}%</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          );
                        }
                        return (
                          <td key={y.index} className="text-right py-2 px-3">
                            <Input
                              type="number"
                              className="w-28 ml-auto text-right h-8 text-sm"
                              value={override ?? ''}
                              placeholder="0"
                              onChange={e => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                const overrides = { ...reportData.flerarsOverrides };
                                if (!overrides[y.index]) overrides[y.index] = {};
                                overrides[y.index] = { ...overrides[y.index], soliditet: val };
                                update({ flerarsOverrides: overrides });
                              }}
                            />
                          </td>
                        );
                      }

                      return (
                        <td key={y.index} className="text-right py-2 px-3">
                          {hasSieData ? (
                            <span>{formatSEK(sieValue)}</span>
                          ) : (
                            <Input
                              type="number"
                              className="w-28 ml-auto text-right h-8 text-sm"
                              value={override ?? ''}
                              placeholder="0"
                              onChange={e => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                const overrides = { ...reportData.flerarsOverrides };
                                if (!overrides[y.index]) overrides[y.index] = {};
                                overrides[y.index] = { ...overrides[y.index], [row.key]: val };
                                update({ flerarsOverrides: overrides });
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Förändringar i eget kapital */}
      <Card>
        <CardHeader>
          <CardTitle>Förändringar i eget kapital</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground"></th>
                  <th className="text-right py-2 font-medium text-muted-foreground px-3">Aktiekapital</th>
                  <th className="text-right py-2 font-medium text-muted-foreground px-3">Balanserat resultat</th>
                  <th className="text-right py-2 font-medium text-muted-foreground px-3">Årets resultat</th>
                  <th className="text-right py-2 font-medium text-muted-foreground px-3">Totalt</th>
                </tr>
              </thead>
              <tbody>
                {egetKapitalForandring.rows.map((row, i) => (
                  <tr key={i} className={i < egetKapitalForandring.rows.length - 1 ? 'border-b' : ''}>
                    <td className={`py-2 ${i === 0 || i === egetKapitalForandring.rows.length - 1 ? 'font-medium' : ''}`}>
                      {row.label}
                    </td>
                    <td className="text-right py-2 px-3">{formatSEK(row.aktiekapital[yi] || 0)}</td>
                    <td className="text-right py-2 px-3">{formatSEK(row.balanserat[yi] || 0)}</td>
                    <td className="text-right py-2 px-3">{formatSEK(row.aretsResultat[yi] || 0)}</td>
                    <td className="text-right py-2 px-3 font-medium">{formatSEK(row.totalt[yi] || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resultatdisposition */}
      <Card>
        <CardHeader>
          <CardTitle>Resultatdisposition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            const utgangRow = egetKapitalForandring.rows[egetKapitalForandring.rows.length - 1];
            const balanserat = utgangRow?.balanserat[yi] || 0;
            const aretsRes = utgangRow?.aretsResultat[yi] || 0;
            const tillForfogande = balanserat + aretsRes;
            const balanserasNy = tillForfogande - reportData.utdelning;
            return (
              <>
                <p className="text-sm text-muted-foreground">Styrelsen föreslår att till förfogande stående medel</p>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5">Balanserat resultat</td>
                      <td className="text-right py-1.5">{formatSEK(balanserat)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1.5">Årets resultat</td>
                      <td className="text-right py-1.5">{formatSEK(aretsRes)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 font-bold">Summa</td>
                      <td className="text-right py-1.5 font-bold">{formatSEK(tillForfogande)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-sm text-muted-foreground mt-4">Disponeras enligt följande</p>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <Label>Utdelas till aktieägare (kr)</Label>
                    <Input
                      type="number"
                      value={reportData.utdelning}
                      onChange={e => {
                        const utd = parseFloat(e.target.value) || 0;
                        update({ utdelning: utd, tillBalanseratResultat: tillForfogande - utd });
                      }}
                      className="w-40 text-right h-8"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Balanseras i ny räkning</span>
                    <span className="text-sm font-medium">{formatSEK(balanserasNy)} kr</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-sm font-bold">Summa</span>
                    <span className="text-sm font-bold">{formatSEK(tillForfogande)} kr</span>
                  </div>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Resultaträkning (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Resultaträkning</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialTable
            sections={incomeStatement.sections}
            yearLabels={[
              { index: yi, label: currentFY ? `${currentFY.startDate.slice(0,4)}/${currentFY.endDate.slice(0,4)}` : 'Nuvarande' },
              { index: prevYI, label: prevFY ? `${prevFY.startDate.slice(0,4)}/${prevFY.endDate.slice(0,4)}` : 'Föregående' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Balansräkning (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Balansräkning</CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-3 text-foreground">TILLGÅNGAR</h3>
          <FinancialTable
            sections={balanceSheet.assets}
            yearLabels={[
              { index: yi, label: currentFY ? `${currentFY.endDate.slice(0,4)}-${currentFY.endDate.slice(4,6)}-${currentFY.endDate.slice(6,8)}` : 'Nuvarande' },
              { index: prevYI, label: prevFY ? `${prevFY.endDate.slice(0,4)}-${prevFY.endDate.slice(4,6)}-${prevFY.endDate.slice(6,8)}` : 'Föregående' },
            ]}
          />
          <div className="flex justify-between font-bold border-t-2 border-foreground pt-2 mt-2">
            <span>SUMMA TILLGÅNGAR</span>
            <div className="flex gap-8">
              <span>{formatSEK(balanceSheet.totalAssets[yi] || 0)}</span>
              <span>{formatSEK(balanceSheet.totalAssets[prevYI] || 0)}</span>
            </div>
          </div>

          <Separator className="my-6" />

          <h3 className="font-semibold mb-3 text-foreground">EGET KAPITAL OCH SKULDER</h3>
          <FinancialTable
            sections={balanceSheet.equityAndLiabilities}
            yearLabels={[
              { index: yi, label: 'Nuvarande' },
              { index: prevYI, label: 'Föregående' },
            ]}
          />
          <div className="flex justify-between font-bold border-t-2 border-foreground pt-2 mt-2">
            <span>SUMMA EGET KAPITAL OCH SKULDER</span>
            <div className="flex gap-8">
              <span>{formatSEK(balanceSheet.totalEquityAndLiabilities[yi] || 0)}</span>
              <span>{formatSEK(balanceSheet.totalEquityAndLiabilities[prevYI] || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skatteberäkning & Bokslut */}
      <TaxCalculationSection
        skatteberakning={skatteberakning}
        reportData={reportData}
        onChange={onChange}
        company={sieData.company}
        fiscalYear={sieData.fiscalYears.find(fy => fy.index === selectedYearIndex)
          ? `${sieData.fiscalYears.find(fy => fy.index === selectedYearIndex)!.startDate.slice(0,4)}-${sieData.fiscalYears.find(fy => fy.index === selectedYearIndex)!.startDate.slice(4,6)}-${sieData.fiscalYears.find(fy => fy.index === selectedYearIndex)!.startDate.slice(6,8)} – ${sieData.fiscalYears.find(fy => fy.index === selectedYearIndex)!.endDate.slice(0,4)}-${sieData.fiscalYears.find(fy => fy.index === selectedYearIndex)!.endDate.slice(4,6)}-${sieData.fiscalYears.find(fy => fy.index === selectedYearIndex)!.endDate.slice(6,8)}`
          : ''}
      />

      {/* Noter */}
      <Card>
        <CardHeader>
          <CardTitle>Noter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold">Not 1 – Redovisningsprinciper</Label>
            <Textarea
              value={reportData.redovisningsprinciper}
              onChange={e => update({ redovisningsprinciper: e.target.value })}
              rows={8}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="font-semibold">Not 2 – Medelantal anställda</Label>
            <Input
              value={reportData.medeltalAnstallda}
              onChange={e => update({ medeltalAnstallda: e.target.value })}
              placeholder="0"
            />
          </div>
          <Separator />

          {reportData.useAbbreviatedForm && (
            <>
              <div className="space-y-2">
                <Label className="font-semibold">Not 3 – Nettoomsättning (obligatorisk vid förkortad form)</Label>
                <Textarea
                  value={reportData.noteNettoomsattning}
                  onChange={e => update({ noteNettoomsattning: e.target.value })}
                  rows={3}
                  placeholder="Beskriv nettoomsättningens fördelning..."
                />
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-2">
            <Label className="font-semibold">Avskrivningsgrunder</Label>
            <Textarea
              value={reportData.noteAvskrivningsgrunder}
              onChange={e => update({ noteAvskrivningsgrunder: e.target.value })}
              rows={2}
              placeholder="T.ex. Inventarier skrivs av linjärt över 5 år"
            />
          </div>
          <Separator />

          <div className="space-y-2">
            <Label className="font-semibold">Ställda säkerheter</Label>
            <Input
              value={reportData.stalldaSakerheter}
              onChange={e => update({ stalldaSakerheter: e.target.value })}
              placeholder="Inga"
            />
          </div>
          <Separator />

          <div className="space-y-2">
            <Label className="font-semibold">Eventualförpliktelser</Label>
            <Input
              value={reportData.eventualforpliktelser}
              onChange={e => update({ eventualforpliktelser: e.target.value })}
              placeholder="Inga"
            />
          </div>
        </CardContent>
      </Card>

      {/* Underskrifter */}
      <Card>
        <CardHeader>
          <CardTitle>Underskrifter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ort</Label>
              <Input
                value={reportData.plats}
                onChange={e => update({ plats: e.target.value })}
                placeholder="Stockholm"
              />
            </div>
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={reportData.signDate}
                onChange={e => update({ signDate: e.target.value })}
              />
            </div>
          </div>
          
          <Separator />
          
          {reportData.signatories.map((sig, i) => (
            <div key={i} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label>Namn</Label>
                <Input
                  value={sig.name}
                  onChange={e => updateSignatory(i, 'name', e.target.value)}
                  placeholder="Förnamn Efternamn"
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Roll</Label>
                <Input
                  value={sig.role}
                  onChange={e => updateSignatory(i, 'role', e.target.value)}
                  placeholder="Styrelseledamot"
                />
              </div>
              {reportData.signatories.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeSignatory(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addSignatory}>
            <Plus className="h-4 w-4 mr-2" />
            Lägg till undertecknare
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
