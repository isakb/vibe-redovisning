import { Skatteberakning, formatSEK } from '@/lib/k2Calculations';
import { ReportData } from '@/lib/k2Types';
import { SieCompanyInfo } from '@/lib/sieParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { VerificationModal } from './VerificationModal';

interface TaxCalculationSectionProps {
  skatteberakning: Skatteberakning;
  reportData: ReportData;
  onChange: (data: ReportData) => void;
  company: SieCompanyInfo;
  fiscalYear: string;
}

export function TaxCalculationSection({ skatteberakning, reportData, onChange, company, fiscalYear }: TaxCalculationSectionProps) {
  const update = (partial: Partial<ReportData>) => onChange({ ...reportData, ...partial });
  const s = skatteberakning;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Skatteberäkning & Bokslut
          {s.saknarSkattebokning ? (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Skatteberäkning saknas i SIE
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Skattebokning finns
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Skatteberäkning */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Skatteberäkning</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2">Resultat före skatt</td>
                <td className="text-right py-2 font-medium">{formatSEK(s.resultatForeSkatt)} kr</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    Ej avdragsgilla kostnader
                  </div>
                </td>
                <td className="text-right py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      value={reportData.ejAvdragsgillaPoster}
                      onChange={e => update({ ejAvdragsgillaPoster: parseFloat(e.target.value) || 0 })}
                      className="w-32 text-right h-8"
                    />
                    <span className="text-muted-foreground">kr</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    Outnyttjat underskott från fg. år
                  </div>
                </td>
                <td className="text-right py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      value={reportData.outnyttjatUnderskott}
                      onChange={e => update({ outnyttjatUnderskott: parseFloat(e.target.value) || 0 })}
                      className="w-32 text-right h-8"
                    />
                    <span className="text-muted-foreground">kr</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b font-medium">
                <td className="py-2">Skattemässigt resultat</td>
                <td className="text-right py-2">{formatSEK(s.skattemassigResultat)} kr</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    Skattesats
                  </div>
                </td>
                <td className="text-right py-2">
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={reportData.skattesats}
                      onChange={e => update({ skattesats: parseFloat(e.target.value) || 20.6 })}
                      className="w-20 text-right h-8"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b font-semibold">
                <td className="py-2">Skatt på årets resultat</td>
                <td className="text-right py-2">{formatSEK(s.skattPaAretsResultat)} kr</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Separator />

        {/* Årets resultat */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Beräkning av årets resultat</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2">Resultat före skatt</td>
                <td className="text-right py-2">{formatSEK(s.resultatForeSkatt)} kr</td>
              </tr>
              {s.ejAvdragsgillaPoster !== 0 && (
                <tr className="border-b">
                  <td className="py-2">Ej avdragsgilla kostnader</td>
                  <td className="text-right py-2">{formatSEK(s.ejAvdragsgillaPoster)} kr</td>
                </tr>
              )}
              {s.outnyttjatUnderskott !== 0 && (
                <tr className="border-b">
                  <td className="py-2">Outnyttjat underskott från fg. år</td>
                  <td className="text-right py-2">-{formatSEK(s.outnyttjatUnderskott)} kr</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-2">Skattesats</td>
                <td className="text-right py-2">{s.skattesats}%</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Skatt på årets resultat</td>
                <td className="text-right py-2">-{formatSEK(s.skattPaAretsResultat)} kr</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2">Årets resultat</td>
                <td className="text-right py-2">{formatSEK(s.aretsResultat)} kr</td>
              </tr>
            </tbody>
          </table>
        </div>

        {s.saknarSkattebokning && (
          <>
            <Separator />

            {/* Verifikationsförslag: Skatt */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Förslag på verifikation — Skatt</h3>
              <table className="w-full text-sm border">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium">Konto</th>
                    <th className="text-left py-2 px-3 font-medium">Kontonamn</th>
                    <th className="text-right py-2 px-3 font-medium">Debit</th>
                    <th className="text-right py-2 px-3 font-medium">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {s.skatteverifikation.map((rad, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-2 px-3 font-mono">{rad.konto}</td>
                      <td className="py-2 px-3">{rad.kontonamn}</td>
                      <td className="text-right py-2 px-3">{rad.debit > 0 ? formatSEK(rad.debit) : ''}</td>
                      <td className="text-right py-2 px-3">{rad.kredit > 0 ? formatSEK(rad.kredit) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">Bokföringsdatum {s.bokforingsdatum}</p>
            </div>

            <Separator />

            {/* Verifikationsförslag: Årets resultat */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Förslag på verifikation — Årets resultat</h3>
              <table className="w-full text-sm border">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium">Konto</th>
                    <th className="text-left py-2 px-3 font-medium">Kontonamn</th>
                    <th className="text-right py-2 px-3 font-medium">Debit</th>
                    <th className="text-right py-2 px-3 font-medium">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {s.resultatverifikation.map((rad, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-2 px-3 font-mono">{rad.konto}</td>
                      <td className="py-2 px-3">{rad.kontonamn}</td>
                      <td className="text-right py-2 px-3">{rad.debit > 0 ? formatSEK(rad.debit) : ''}</td>
                      <td className="text-right py-2 px-3">{rad.kredit > 0 ? formatSEK(rad.kredit) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">Bokföringsdatum {s.bokforingsdatum}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
