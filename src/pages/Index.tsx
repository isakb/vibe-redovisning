import { useState } from 'react';
import { SieData } from '@/lib/sieParser';
import { FileUpload } from '@/components/FileUpload';
import { ReportWizard } from '@/components/ReportWizard';

const Index = () => {
  const [sieData, setSieData] = useState<SieData | null>(null);

  if (sieData) {
    return <ReportWizard sieData={sieData} onReset={() => setSieData(null)} />;
  }

  return <FileUpload onFileParsed={setSieData} />;
};

export default Index;
