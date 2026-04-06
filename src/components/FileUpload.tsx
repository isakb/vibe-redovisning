import { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseSieFile, mergeSieData, SieData } from '@/lib/sieParser';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileParsed: (data: SieData) => void;
}

export function FileUpload({ onFileParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<{ name: string; data: SieData }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback(async (files: FileList) => {
    setIsLoading(true);
    const newParsed: { name: string; data: SieData }[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.match(/\.(se|si)$/i)) {
        toast({ title: 'Fel filformat', description: `${file.name} — Vänligen ladda upp .se eller .si filer (SIE 4).`, variant: 'destructive' });
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const data = parseSieFile(buffer);
        if (!data.company.name) {
          toast({ title: 'Kunde inte läsa filen', description: `${file.name} verkar inte vara en giltig SIE 4-fil.`, variant: 'destructive' });
          continue;
        }
        newParsed.push({ name: file.name, data });
      } catch {
        toast({ title: 'Fel vid inläsning', description: `Kunde inte tolka ${file.name}.`, variant: 'destructive' });
      }
    }

    if (newParsed.length > 0) {
      setParsedFiles(prev => [...prev, ...newParsed]);
    }
    setIsLoading(false);
  }, [toast]);

  const removeFile = (index: number) => {
    setParsedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (parsedFiles.length === 0) return;
    const allData = parsedFiles.map(f => f.data);
    const merged = mergeSieData(allData);
    onFileParsed(merged);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">K2 Årsredovisning</h1>
          <p className="text-muted-foreground">
            Ladda upp en eller flera SIE 4-filer för att generera K2-årsredovisning
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <label
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isLoading ? 'Läser in filer...' : 'Dra och släpp SIE-filer här'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">eller klicka för att välja filer (.se / .si)</p>
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".se,.si"
                multiple
                onChange={handleInputChange}
              />
            </label>

            {parsedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {parsedFiles.map((f, i) => {
                  const years = f.data.fiscalYears.map(fy => `${fy.startDate}–${fy.endDate}`).join(', ');
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{f.data.company.name} — {years}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                <Button className="w-full mt-3" onClick={handleContinue}>
                  Fortsätt med {parsedFiles.length} {parsedFiles.length === 1 ? 'fil' : 'filer'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
