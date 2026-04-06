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

  if (sieData && companyProfile) {
    return (
      <ReportWizard
        sieData={sieData}
        companyProfile={companyProfile}
        onCompanyProfileChange={setCompanyProfile}
        savedReports={savedReports}
        onReset={handleReset}
      />
    );
  }

  return <FileUpload onFileParsed={handleFileParsed} />;
};

export default Index;
