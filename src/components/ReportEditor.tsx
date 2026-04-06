import { SieData } from '@/lib/sieParser';
import { K2IncomeStatement, K2BalanceSheet, FlerarsOversikt, EgetKapitalForandring, Skatteberakning, formatSEK } from '@/lib/k2Calculations';
import { ReportData, Signatory } from '@/lib/k2Types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
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
}

export function ReportEditor({
  sieData,
  reportData,
  onChange,
  incomeStatement,
  balanceSheet,
  flerarsOversikt,
  egetKapitalForandring,
}: ReportEditorProps) {
  const update = (partial: Partial<ReportData>) => onChange({ ...reportData, ...partial });

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

  const currentFY = sieData.fiscalYears.find(fy => fy.index === 0);
  const prevFY = sieData.fiscalYears.find(fy => fy.index === -1);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Förvaltningsberättelse */}
      <Card>
        <CardHeader>
          <CardTitle>Förvaltningsberättelse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Flerårsöversikt (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Flerårsöversikt</CardTitle>
        </CardHeader>
        <CardContent>
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
                <tr className="border-b">
                  <td className="py-2">Nettoomsättning (kr)</td>
                  {flerarsOversikt.years.map(y => (
                    <td key={y.index} className="text-right py-2 px-3">{formatSEK(flerarsOversikt.nettoomsattning[y.index] || 0)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Resultat efter finansiella poster (kr)</td>
                  {flerarsOversikt.years.map(y => (
                    <td key={y.index} className="text-right py-2 px-3">{formatSEK(flerarsOversikt.resultatEfterFinansiellaPoster[y.index] || 0)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Balansomslutning (kr)</td>
                  {flerarsOversikt.years.map(y => (
                    <td key={y.index} className="text-right py-2 px-3">{formatSEK(flerarsOversikt.balansomslutning[y.index] || 0)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2">Soliditet (%)</td>
                  {flerarsOversikt.years.map(y => (
                    <td key={y.index} className="text-right py-2 px-3">{flerarsOversikt.soliditet[y.index] || 0}%</td>
                  ))}
                </tr>
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
                    <td className="text-right py-2 px-3">{formatSEK(row.aktiekapital[0] || 0)}</td>
                    <td className="text-right py-2 px-3">{formatSEK(row.balanserat[0] || 0)}</td>
                    <td className="text-right py-2 px-3">{formatSEK(row.aretsResultat[0] || 0)}</td>
                    <td className="text-right py-2 px-3 font-medium">{formatSEK(row.totalt[0] || 0)}</td>
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
          <p className="text-sm text-muted-foreground">
            Styrelsen föreslår att till förfogande stående medel disponeras enligt följande:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Utdelning till aktieägarna (kr)</Label>
              <Input
                type="number"
                value={reportData.utdelning}
                onChange={e => {
                  const utd = parseFloat(e.target.value) || 0;
                  update({ utdelning: utd, tillBalanseratResultat: (incomeStatement.totalResult[0] || 0) - utd });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Balanseras i ny räkning (kr)</Label>
              <Input
                type="number"
                value={Math.round(reportData.tillBalanseratResultat)}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
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
              { index: 0, label: currentFY ? `${currentFY.startDate.slice(0,4)}/${currentFY.endDate.slice(0,4)}` : 'Nuvarande' },
              { index: -1, label: prevFY ? `${prevFY.startDate.slice(0,4)}/${prevFY.endDate.slice(0,4)}` : 'Föregående' },
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
              { index: 0, label: currentFY ? `${currentFY.endDate.slice(0,4)}-${currentFY.endDate.slice(4,6)}-${currentFY.endDate.slice(6,8)}` : 'Nuvarande' },
              { index: -1, label: prevFY ? `${prevFY.endDate.slice(0,4)}-${prevFY.endDate.slice(4,6)}-${prevFY.endDate.slice(6,8)}` : 'Föregående' },
            ]}
          />
          <div className="flex justify-between font-bold border-t-2 border-foreground pt-2 mt-2">
            <span>SUMMA TILLGÅNGAR</span>
            <div className="flex gap-8">
              <span>{formatSEK(balanceSheet.totalAssets[0] || 0)}</span>
              <span>{formatSEK(balanceSheet.totalAssets[-1] || 0)}</span>
            </div>
          </div>

          <Separator className="my-6" />

          <h3 className="font-semibold mb-3 text-foreground">EGET KAPITAL OCH SKULDER</h3>
          <FinancialTable
            sections={balanceSheet.equityAndLiabilities}
            yearLabels={[
              { index: 0, label: 'Nuvarande' },
              { index: -1, label: 'Föregående' },
            ]}
          />
          <div className="flex justify-between font-bold border-t-2 border-foreground pt-2 mt-2">
            <span>SUMMA EGET KAPITAL OCH SKULDER</span>
            <div className="flex gap-8">
              <span>{formatSEK(balanceSheet.totalEquityAndLiabilities[0] || 0)}</span>
              <span>{formatSEK(balanceSheet.totalEquityAndLiabilities[-1] || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

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
