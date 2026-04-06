import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { SieData } from '@/lib/sieParser';
import { calculateIncomeStatement, calculateBalanceSheet, calculateFlerarsOversikt, calculateEgetKapitalForandring, formatFiscalYear } from '@/lib/k2Calculations';
import { ReportData, createDefaultReportData } from '@/lib/k2Types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Button } from '@/components/ui/button';
import { ReportEditor } from './ReportEditor';
import { ReportPreview } from './ReportPreview';
import { generatePDF } from '@/lib/pdfExport';
import { Download, Eye, Edit, ArrowLeft } from 'lucide-react';

interface ReportWizardProps {
  sieData: SieData;
  onReset: () => void;
}

export function ReportWizard({ sieData, onReset }: ReportWizardProps) {
  const selectedYearIndex = useMemo(() => {
    const sorted = [...sieData.fiscalYears].sort((a, b) => b.index - a.index);
    return sorted[0]?.index ?? 0;
  }, [sieData.fiscalYears]);

  const [activeTab, setActiveTab] = useState('edit');

  const yearIndices = [selectedYearIndex, selectedYearIndex - 1];
  
  const incomeStatement = useMemo(() => calculateIncomeStatement(sieData, yearIndices), [sieData, selectedYearIndex]);
  const balanceSheet = useMemo(() => calculateBalanceSheet(sieData, yearIndices), [sieData, selectedYearIndex]);
  const flerarsOversikt = useMemo(() => calculateFlerarsOversikt(sieData, selectedYearIndex), [sieData, selectedYearIndex]);
  const egetKapitalForandring = useMemo(() => calculateEgetKapitalForandring(sieData, selectedYearIndex), [sieData, selectedYearIndex]);

  const aretsResultat = incomeStatement.totalResult[selectedYearIndex] || 0;
  
  const [reportData, setReportData] = useState<ReportData>(
    createDefaultReportData(aretsResultat)
  );

  const selectedFY = sieData.fiscalYears.find(fy => fy.index === selectedYearIndex);
  const fiscalYearLabel = selectedFY ? formatFiscalYear(selectedFY) : '';

  const handleExportPDF = () => {
    try {
      generatePDF({
        company: sieData.company,
        fiscalYear: fiscalYearLabel,
        reportData,
        incomeStatement,
        balanceSheet,
        flerarsOversikt,
        egetKapitalForandring,
        fiscalYears: sieData.fiscalYears,
        selectedYearIndex,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Kunde inte generera PDF. Försök igen.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onReset}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Ny fil
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{sieData.company.name}</h1>
              <p className="text-sm text-muted-foreground">
                Org.nr {sieData.company.orgNumber} | Räkenskapsår {fiscalYearLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            <Button onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportera PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="edit">
              <Edit className="h-4 w-4 mr-2" />
              Redigera
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Förhandsgranska
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit">
            <ReportEditor
              sieData={sieData}
              reportData={reportData}
              onChange={setReportData}
              incomeStatement={incomeStatement}
              balanceSheet={balanceSheet}
              flerarsOversikt={flerarsOversikt}
              egetKapitalForandring={egetKapitalForandring}
            />
          </TabsContent>
          
          <TabsContent value="preview">
            <ReportPreview
              company={sieData.company}
              fiscalYear={fiscalYearLabel}
              reportData={reportData}
              incomeStatement={incomeStatement}
              balanceSheet={balanceSheet}
              flerarsOversikt={flerarsOversikt}
              egetKapitalForandring={egetKapitalForandring}
              fiscalYears={sieData.fiscalYears}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
