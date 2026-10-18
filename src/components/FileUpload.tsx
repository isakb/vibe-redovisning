import { useState, useCallback } from 'react';
import { ArrowUp, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseSieFile, mergeSieData, SieData } from '@/lib/sieParser';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileParsed: (data: SieData) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

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
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Filen är för stor', description: `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB) — Maximal filstorlek är 50 MB.`, variant: 'destructive' });
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
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-card border border-border shadow-[20px_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Left: Narrative & trust */}
        <div className="p-10 lg:p-16 flex flex-col justify-between space-y-12 border-b lg:border-b-0 lg:border-r border-border">
          <div>
            <header className="mb-16">
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-primary leading-tight">
                K2 <br />Årsredovisning
              </h1>
            </header>

            <div className="space-y-6 max-w-md">
              <p className="text-lg text-foreground leading-relaxed">
                Ladda upp en eller flera SIE 4-filer för att generera en professionell K2-årsredovisning på några sekunder.
              </p>
              <div className="pt-8 space-y-4">
                {[
                  'All bearbetning sker helt i din webbläsare — ingen data skickas till någon server.',
                  'Företagsuppgifter och rapportinställningar sparas lokalt i din webbläsare.',
                  'Dina SIE-filer lämnar aldrig din enhet.',
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-foreground">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <footer className="pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest leading-loose">
              En gratis tjänst med{' '}
              <a
                href="https://github.com/isakb/vibe-redovisning"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-border hover:text-primary transition-colors"
              >
                öppen källkod
              </a>{' '}
              från teamet bakom{' '}
              <a
                href="https://www.skatteguru.se/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold tracking-normal normal-case hover:underline"
              >
                Skatteguru
              </a>{' '}
              — Sveriges ledande skatteberäkningstjänst.
            </p>
          </footer>
        </div>

        {/* Right: Action zone */}
        <div className="p-6 lg:p-16 bg-background flex flex-col justify-center items-center">
          <div className="w-full max-w-sm">
            <label
              htmlFor="file-upload"
              className="group relative block w-full md:h-96 cursor-pointer"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {/* Decorative borders */}
              <div className={`absolute inset-0 border-2 border-dashed transition-colors duration-500 ${
                isDragging ? 'border-primary' : 'border-border group-hover:border-primary/40'
              }`} />
              <div className="absolute inset-4 border border-border/40 group-hover:inset-2 transition-all duration-500" />

              <div className="relative h-full flex flex-col items-center justify-center p-8 text-center min-h-[360px]">
                <div className="mb-6 p-4 rounded-full bg-card group-hover:scale-110 transition-transform duration-500">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  ) : (
                    <ArrowUp className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  )}
                </div>

                <h3 className="font-serif text-xl font-bold text-primary mb-2">
                  {isLoading ? 'Läser in filer…' : 'Dra och släpp SIE-filer här'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  eller klicka för att välja filer (.se / .si)
                </p>

                <div className="mt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="px-6 py-2 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-widest">
                    Bläddra filer
                  </span>
                </div>
              </div>

              <input
                id="file-upload"
                type="file"
                className="hidden"
                multiple
                accept=".se,.si"
                onChange={handleInputChange}
              />
            </label>

            {parsedFiles.length === 0 ? (
              <div className="mt-8 flex justify-center items-center">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Standardiserat för bokföringsår 2025 / 2026
                </span>
              </div>
            ) : (
              <div className="mt-8 space-y-2">
                {parsedFiles.map((f, i) => {
                  const years = f.data.fiscalYears.map(fy => `${fy.startDate}–${fy.endDate}`).join(', ');
                  return (
                    <div key={i} className="flex items-center gap-2 p-3 bg-card border border-border">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{f.data.company.name} — {years}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  className="w-full mt-3 rounded-none bg-primary text-primary-foreground hover:bg-foreground uppercase tracking-widest text-xs font-semibold py-6"
                  onClick={handleContinue}
                >
                  Fortsätt med {parsedFiles.length} {parsedFiles.length === 1 ? 'fil' : 'filer'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
