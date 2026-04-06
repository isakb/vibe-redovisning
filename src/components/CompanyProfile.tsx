import { CompanyProfile as CompanyProfileType, Signatory } from '@/lib/k2Types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Building } from 'lucide-react';

interface CompanyProfileEditorProps {
  profile: CompanyProfileType;
  onChange: (profile: CompanyProfileType) => void;
}

export function CompanyProfileEditor({ profile, onChange }: CompanyProfileEditorProps) {
  const update = (partial: Partial<CompanyProfileType>) => onChange({ ...profile, ...partial });

  const addSignatory = () => {
    update({ signatories: [...profile.signatories, { name: '', role: 'Styrelseledamot' }] });
  };

  const removeSignatory = (index: number) => {
    update({ signatories: profile.signatories.filter((_, i) => i !== index) });
  };

  const updateSignatory = (index: number, field: keyof Signatory, value: string) => {
    const updated = [...profile.signatories];
    updated[index] = { ...updated[index], [field]: value };
    update({ signatories: updated });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Building className="h-4 w-4 mr-1" />
          Företagsprofil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Företagsprofil — {profile.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Dessa uppgifter sparas i din webbläsare och används som förval i nya årsredovisningar.
        </p>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Verksamhetsbeskrivning</Label>
            <Textarea
              value={profile.verksamhetsbeskrivning}
              onChange={e => update({ verksamhetsbeskrivning: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>Bolagets säte</Label>
            <Input
              value={profile.bolagetsSate}
              onChange={e => update({ bolagetsSate: e.target.value })}
              placeholder="Stockholm"
            />
          </div>

          <div>
            <Label>Plats (underskrift)</Label>
            <Input
              value={profile.plats}
              onChange={e => update({ plats: e.target.value })}
              placeholder="Stockholm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Styrelseledamöter / Firmatecknare</Label>
              <Button variant="outline" size="sm" onClick={addSignatory}>
                <Plus className="h-3 w-3 mr-1" /> Lägg till
              </Button>
            </div>
            {profile.signatories.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  placeholder="Namn"
                  value={s.name}
                  onChange={e => updateSignatory(i, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Roll"
                  value={s.role}
                  onChange={e => updateSignatory(i, 'role', e.target.value)}
                  className="w-40"
                />
                {profile.signatories.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSignatory(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
