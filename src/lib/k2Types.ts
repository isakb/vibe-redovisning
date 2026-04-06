// Types for the editable K2 report form

// Manual overrides for flerårsöversikt (keyed by yearIndex, e.g. -2, -3)
export interface FlerarsOverride {
  nettoomsattning?: number;
  resultatEfterFinansiellaPoster?: number;
  balansomslutning?: number;
  soliditet?: number;
}

export interface ReportData {
  // Förvaltningsberättelse
  verksamhetsbeskrivning: string;
  vasEntligaHandelser: string;
  
  // Resultatdisposition
  utdelning: number;
  tillBalanseratResultat: number; // auto-calculated: årets resultat - utdelning
  
  // Skatteberäkning
  ejAvdragsgillaPoster: number;
  skattesats: number; // default 20.6
  
  // Flerårsöversikt manuella värden
  flerarsOverrides: Record<number, FlerarsOverride>;
  
  // Noter
  redovisningsprinciper: string;
  medeltalAnstallda: string;
  
  // Underskrifter
  signatories: Signatory[];
  signDate: string;
  plats: string;
}

export interface Signatory {
  name: string;
  role: string; // e.g., "Styrelseledamot", "Verkställande direktör"
}

export const defaultRedovisningsprinciper = `Årsredovisningen är upprättad i enlighet med årsredovisningslagen och Bokföringsnämndens allmänna råd (BFNAR 2016:10) om årsredovisning i mindre företag (K2).

Redovisningsprinciperna är oförändrade jämfört med föregående år.

Företaget tillämpar reglerna om förenklat årsbokslut och K2-regelverket.

Tillgångar och skulder har värderats till anskaffningsvärde om inte annat anges.

Intäkter redovisas i den period de avser oavsett tidpunkten för betalning.

Fordringar och skulder i utländsk valuta värderas till balansdagens kurs.`;

export function createDefaultReportData(aretsResultat: number): ReportData {
  return {
    verksamhetsbeskrivning: 'Bolaget bedriver konsultverksamhet inom IT och teknik.',
    vasEntligaHandelser: '',
    utdelning: 0,
    tillBalanseratResultat: aretsResultat,
    ejAvdragsgillaPoster: 0,
    skattesats: 20.6,
    redovisningsprinciper: defaultRedovisningsprinciper,
    medeltalAnstallda: '0',
    signatories: [{ name: '', role: 'Styrelseledamot' }],
    signDate: new Date().toISOString().slice(0, 10),
    plats: '',
  };
}
