import { useState, useCallback } from 'react';
import { SieData } from '@/lib/sieParser';
import { CompanyProfile, loadCompanyProfile, saveCompanyProfile, loadYearReports } from '@/lib/k2Types';
import { FileUpload } from '@/components/FileUpload';
import { ReportWizard } from '@/components/ReportWizard';

const Index = () => {
  const [sieData, setSieData] = useState<SieData | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [savedReports, setSavedReports] = useState<Record<number, any>>({});

  const handleFileParsed = useCallback((data: SieData) => {
    const orgNum = data.company.orgNumber;
    const existing = loadCompanyProfile(orgNum);
    const profile: CompanyProfile = existing || {
      orgNumber: orgNum,
      name: data.company.name,
      verksamhetsbeskrivning: 'Bolaget bedriver konsultverksamhet inom IT och teknik.',
      signatories: [{ name: '', role: 'Styrelseledamot' }],
      plats: '',
      bolagetsSate: '',
    };
    if (!existing) saveCompanyProfile(profile);
    setCompanyProfile(profile);
    setSavedReports(loadYearReports(orgNum));
    setSieData(data);
  }, []);

  const handleReset = useCallback(() => {
    setSieData(null);
    setCompanyProfile(null);
    setSavedReports({});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col">
        {sieData && companyProfile ? (
          <ReportWizard
            sieData={sieData}
            companyProfile={companyProfile}
            onCompanyProfileChange={setCompanyProfile}
            savedReports={savedReports}
            onReset={handleReset}
          />
        ) : (
          <FileUpload onFileParsed={handleFileParsed} />
        )}
      </div>
      <footer className="py-3 px-4 text-center text-xs text-muted-foreground/60 border-t border-border/30">
        En gratis tjänst med öppen källkod från teamet bakom{' '}
        <a href="https://www.skatteguru.se/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
          Skatteguru
        </a>
        {' '}— Sveriges ledande skatteberäkningstjänst för K4-blanketten.
      </footer>
    </div>
  );
};

export default Index;
