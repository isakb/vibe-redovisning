import { useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseSieFile, SieData } from '@/lib/sieParser';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileParsed: (data: SieData) => void;
}

export function FileUpload({ onFileParsed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(se|si)$/i)) {
      toast({ title: 'Fel filformat', description: 'Vänligen ladda upp en .se eller .si fil (SIE 4).', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const data = parseSieFile(buffer);
      if (!data.company.name) {
        toast({ title: 'Kunde inte läsa filen', description: 'Filen verkar inte vara en giltig SIE 4-fil.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      onFileParsed(data);
    } catch (e) {
      toast({ title: 'Fel vid inläsning', description: 'Kunde inte tolka SIE-filen. Kontrollera att det är en SIE 4-fil.', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [onFileParsed, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">K2 Årsredovisning</h1>
          <p className="text-muted-foreground">
            Ladda upp en SIE 4-fil för att generera en K2-årsredovisning för aktiebolag
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
                ) : fileName ? (
                  <FileText className="h-10 w-10 text-primary" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isLoading ? 'Läser in fil...' : fileName || 'Dra och släpp din SIE-fil här'}
                  </p>
                  {!fileName && !isLoading && (
                    <p className="text-xs text-muted-foreground mt-1">eller klicka för att välja fil (.se / .si)</p>
                  )}
                </div>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".se,.si"
                onChange={handleInputChange}
              />
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
