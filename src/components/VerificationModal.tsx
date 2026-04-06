import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skatteberakning, formatSEK } from '@/lib/k2Calculations';
import { SieCompanyInfo } from '@/lib/sieParser';
import { Download, CheckCircle } from 'lucide-react';
import { generateSkatteberakningPDF } from '@/lib/skatteberakningPdf';

interface VerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skatteberakning: Skatteberakning;
  company: SieCompanyInfo;
  fiscalYear: string;
  onAccept: () => void;
  accepted: boolean;
  utdelning?: number;
}

export function VerificationModal({
  open,
  onOpenChange,
  skatteberakning,
  company,
  fiscalYear,
  onAccept,
  accepted,
  utdelning = 0,
}: VerificationModalProps) {
  const s = skatteberakning;

  const handleDownloadPDF = () => {
    generateSkatteberakningPDF({ skatteberakning: s, company, fiscalYear });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Bokföringsförslag
            {accepted && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Godkänd
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Föreslagna verifikationer för skatt och årets resultat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Skatteberäkning summary */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Skatteberäkning</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-1.5">Resultat före skatt</td>
                  <td className="text-right py-1.5">{formatSEK(s.resultatForeSkatt)} kr</td>
                </tr>
                {s.ejAvdragsgillaPoster !== 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Ej avdragsgilla kostnader</td>
                    <td className="text-right py-1.5">+ {formatSEK(s.ejAvdragsgillaPoster)} kr</td>
                  </tr>
                )}
                {s.detailAdjustments?.map((adj, idx) => (
                  <tr key={`adj-${idx}`} className="border-b">
                    <td className="py-1.5 text-muted-foreground pl-4">{adj.label}</td>
                    <td className="text-right py-1.5">{adj.amount >= 0 ? '+ ' : '– '}{formatSEK(Math.abs(adj.amount))} kr</td>
                  </tr>
                ))}
                {s.outnyttjatUnderskott !== 0 && (
                  <tr className="border-b">
                    <td className="py-1.5">Outnyttjat underskott från fg. år</td>
                    <td className="text-right py-1.5">- {formatSEK(s.outnyttjatUnderskott)} kr</td>
                  </tr>
                )}
                <tr className="border-b">
                  <td className="py-1.5">Skattemässigt resultat</td>
                  <td className="text-right py-1.5">{formatSEK(s.skattemassigResultat)} kr</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5">Beskattningsbar inkomst (avrundat nedåt)</td>
                  <td className="text-right py-1.5">{formatSEK(s.beskattningsbarInkomst)} kr</td>
                </tr>
                <tr className="border-b">
                  <td className="py-1.5">Skattesats</td>
                  <td className="text-right py-1.5">{s.skattesats}%</td>
                </tr>
                <tr className="font-semibold">
                  <td className="py-1.5">Årets skatt</td>
                  <td className="text-right py-1.5">{formatSEK(s.skattPaAretsResultat)} kr</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verifikation: Skatt */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Förslag på verifikation — Skatt</h3>
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
            <p className="text-xs text-muted-foreground mt-1">Bokföringsdatum {s.bokforingsdatum}</p>
          </div>

          {/* Verifikation: Årets resultat */}
          <div>
            <h3 className="font-semibold text-foreground mb-2">Förslag på verifikation — Årets resultat</h3>
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
            <p className="text-xs text-muted-foreground mt-1">Bokföringsdatum {s.bokforingsdatum}</p>
          </div>

          {/* Verifikation: Utdelning */}
          {utdelning > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Förslag på verifikation — Utdelning</h3>
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
                  <tr className="border-b">
                    <td className="py-2 px-3 font-mono">2091</td>
                    <td className="py-2 px-3">Balanserat resultat</td>
                    <td className="text-right py-2 px-3">{formatSEK(utdelning)}</td>
                    <td className="text-right py-2 px-3"></td>
                  </tr>
                  <tr className="border-b last:border-b-0">
                    <td className="py-2 px-3 font-mono">2898</td>
                    <td className="py-2 px-3">Outtagen vinstutdelning</td>
                    <td className="text-right py-2 px-3"></td>
                    <td className="text-right py-2 px-3">{formatSEK(utdelning)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-1">Bokförs efter beslut på årsstämma</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" />
            Ladda ner PDF
          </Button>
          {!accepted && (
            <Button onClick={onAccept}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Godkänn
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
