import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { SieData } from '@/lib/sieParser';
import { calculateIncomeStatement, calculateBalanceSheet, calculateFlerarsOversikt, calculateEgetKapitalForandring, calculateSkatteberakning, formatFiscalYear } from '@/lib/k2Calculations';
import { ReportData, CompanyProfile, createDefaultReportData, saveCompanyProfile, saveYearReports } from '@/lib/k2Types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Button } from '@/components/ui/button';
import { ReportEditor } from './ReportEditor';
import { ReportPreview } from './ReportPreview';
import { CompanyProfileEditor } from './CompanyProfile';
import { generatePDF } from '@/lib/pdfExport';
import { Download, Eye, Edit, ArrowLeft } from 'lucide-react';

interface ReportWizardProps {
  sieData: SieData;
  companyProfile: CompanyProfile;
  onCompanyProfileChange: (profile: CompanyProfile) => void;
  savedReports: Record<number, ReportData>;
  onReset: () => void;
}

export function ReportWizard({ sieData, companyProfile, onCompanyProfileChange, savedReports, onReset }: ReportWizardProps) {
  const sortedYears = useMemo(() => 
    [...sieData.fiscalYears].sort((a, b) => b.index - a.index), 
    [sieData.fiscalYears]
  );

  const [selectedYearIndex, setSelectedYearIndex] = useState(() => sortedYears[0]?.index ?? 0);
  const [activeTab, setActiveTab] = useState('edit');

  // Per-year report data
  const [yearReports, setYearReports] = useState<Record<number, ReportData>>(() => {
    const reports: Record<number, ReportData> = {};
    for (const fy of sortedYears) {
      reports[fy.index] = savedReports[fy.index] || createDefaultReportData(0, companyProfile);
    }
    return reports;
  });

  const reportData = yearReports[selectedYearIndex] || createDefaultReportData(0, companyProfile);

  const setReportData = useCallback((data: ReportData) => {
    setYearReports(prev => ({ ...prev, [selectedYearIndex]: data }));
  }, [selectedYearIndex]);

  // Auto-save to localStorage
  useEffect(() => {
    saveYearReports(sieData.company.orgNumber, yearReports);
  }, [yearReports, sieData.company.orgNumber]);

  const handleProfileChange = useCallback((profile: CompanyProfile) => {
    saveCompanyProfile(profile);
    onCompanyProfileChange(profile);
    // Sync profile fields into current year's report
    setYearReports(prev => {
      const current = prev[selectedYearIndex];
      if (!current) return prev;
      return {
        ...prev,
        [selectedYearIndex]: {
          ...current,
          verksamhetsbeskrivning: profile.verksamhetsbeskrivning,
          signatories: [...profile.signatories],
          plats: profile.plats,
          bolagetsSate: profile.bolagetsSate,
        },
      };
    });
  }, [onCompanyProfileChange, selectedYearIndex]);

  const yearIndices = [selectedYearIndex, selectedYearIndex - 1];
  
  const incomeStatement = useMemo(() => calculateIncomeStatement(sieData, yearIndices), [sieData, selectedYearIndex]);
  // aretsResultat will be set after adjustedIncomeStatement is computed below

  const skatteberakning = useMemo(
    () => calculateSkatteberakning(incomeStatement, reportData, sieData, selectedYearIndex),
    [incomeStatement, reportData, sieData, selectedYearIndex]
  );

  // When tax bookings are missing, inject calculated tax into income statement
  const adjustedIncomeStatement = useMemo(() => {
    if (!skatteberakning.saknarSkattebokning) return incomeStatement;
    const newSections = incomeStatement.sections.map(section => ({
      ...section,
      items: section.items.map(item => {
        if (item.label === 'Skatt på årets resultat') {
          return { ...item, amounts: { ...item.amounts, [selectedYearIndex]: -skatteberakning.skattPaAretsResultat } };
        }
        if (item.label === 'Årets resultat') {
          return { ...item, amounts: { ...item.amounts, [selectedYearIndex]: skatteberakning.aretsResultat } };
        }
        return item;
      }),
    }));
    return {
      ...incomeStatement,
      sections: newSections,
      totalResult: { ...incomeStatement.totalResult, [selectedYearIndex]: skatteberakning.aretsResultat },
    };
  }, [incomeStatement, skatteberakning, selectedYearIndex]);

  const aretsResultat = adjustedIncomeStatement.totalResult[selectedYearIndex] || 0;

  // Update tillBalanseratResultat when year changes (full "till förfogande stående medel")
  useEffect(() => {
    const utgangRow = egetKapitalForandring.rows[egetKapitalForandring.rows.length - 1];
    const tillForfogande = (utgangRow?.balanserat[selectedYearIndex] || 0) + (utgangRow?.aretsResultat[selectedYearIndex] || 0);
    if (reportData.tillBalanseratResultat === 0 && tillForfogande !== 0) {
      setReportData({ ...reportData, tillBalanseratResultat: tillForfogande });
    }
  }, [selectedYearIndex, egetKapitalForandring]);

  // When tax bookings are missing, inject calculated tax into balance sheet
  const taxAdjustment = useMemo(() => {
    if (!skatteberakning.saknarSkattebokning) return undefined;
    return {
      aretsResultat: skatteberakning.aretsResultat,
      skatteskuld: skatteberakning.skattPaAretsResultat,
    };
  }, [skatteberakning]);

  const balanceSheet = useMemo(() => calculateBalanceSheet(sieData, yearIndices, taxAdjustment), [sieData, selectedYearIndex, taxAdjustment]);
  const flerarsOversikt = useMemo(() => calculateFlerarsOversikt(sieData, selectedYearIndex, taxAdjustment), [sieData, selectedYearIndex, taxAdjustment]);

  const egetKapitalForandring = useMemo(
    () => calculateEgetKapitalForandring(
      sieData,
      selectedYearIndex,
      skatteberakning.saknarSkattebokning ? skatteberakning.aretsResultat : undefined
    ),
    [sieData, selectedYearIndex, skatteberakning]
  );

  const selectedFY = sieData.fiscalYears.find(fy => fy.index === selectedYearIndex);
  const fiscalYearLabel = selectedFY ? formatFiscalYear(selectedFY) : '';

  const handleExportPDF = () => {
    try {
      generatePDF({
        company: sieData.company,
        fiscalYear: fiscalYearLabel,
        reportData,
        incomeStatement: adjustedIncomeStatement,
        balanceSheet,
        flerarsOversikt,
        egetKapitalForandring,
        fiscalYears: sieData.fiscalYears,
        selectedYearIndex,
        skatteberakning,
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
                Org.nr {sieData.company.orgNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sortedYears.length > 1 && (
              <Select
                value={String(selectedYearIndex)}
                onValueChange={v => setSelectedYearIndex(Number(v))}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedYears.map(fy => (
                    <SelectItem key={fy.index} value={String(fy.index)}>
                      {formatFiscalYear(fy)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <CompanyProfileEditor
              profile={companyProfile}
              onChange={handleProfileChange}
            />
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
              incomeStatement={adjustedIncomeStatement}
              balanceSheet={balanceSheet}
              flerarsOversikt={flerarsOversikt}
              egetKapitalForandring={egetKapitalForandring}
              skatteberakning={skatteberakning}
              selectedYearIndex={selectedYearIndex}
            />
          </TabsContent>
          
          <TabsContent value="preview">
            <ReportPreview
              company={sieData.company}
              fiscalYear={fiscalYearLabel}
              reportData={reportData}
              incomeStatement={adjustedIncomeStatement}
              balanceSheet={balanceSheet}
              flerarsOversikt={flerarsOversikt}
              egetKapitalForandring={egetKapitalForandring}
              fiscalYears={sieData.fiscalYears}
              skatteberakning={skatteberakning}
              selectedYearIndex={selectedYearIndex}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
