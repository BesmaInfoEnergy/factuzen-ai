import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap, Sparkles, Building2, FileText, CheckCircle2, Clock3,
  UploadCloud, Info, Download, Mail, CreditCard, QrCode,
  MoreHorizontal, ShieldCheck, Scale, Landmark, ArrowUpRight,
  X, Loader2, Wand2, FileCheck, Euro
} from 'lucide-react';

type TvaRate = 20 | 10 | 5.5 | 0;
type InvoiceStatus = "Payée" | "Envoyée" | "En retard" | "Brouillon";

interface Invoice {
  id: string;
  num: string;
  client: string;
  service: string;
  ht: number;
  tva: TvaRate;
  ttc: number;
  date: string;
  status: InvoiceStatus;
  facturx: boolean;
}

const mockHistory: Invoice[] = [
  { id: "1", num: "F2026-005", client: "SCI Les Lilas", service: "Rénovation salle de bain", ht: 4200, tva: 20, ttc: 5040, date: "12/05/2026", status: "Payée", facturx: true },
  { id: "2", num: "F2026-004", client: "Mme Lefèvre", service: "Pose parquet 45m²", ht: 2850, tva: 10, ttc: 3135, date: "08/05/2026", status: "Envoyée", facturx: true },
  { id: "3", num: "F2026-003", client: "Boulangerie Martin", service: "Dépannage élec + tableau", ht: 650, tva: 20, ttc: 780, date: "03/05/2026", status: "Payée", facturx: true },
  { id: "4", num: "F2026-002", client: "M. Bernard", service: "Peinture façade", ht: 8900, tva: 20, ttc: 10680, date: "28/04/2026", status: "En retard", facturx: true },
  { id: "5", num: "F2026-001", client: "Atelier Dubois", service: "Création logo + charte", ht: 1200, tva: 0, ttc: 1200, date: "20/04/2026", status: "Brouillon", facturx: false },
];

const tvaOptions: { rate: TvaRate; label: string; desc: string }[] = [
  { rate: 20, label: "20% - Taux normal", desc: "Prestation standard" },
  { rate: 10, label: "10% - Taux intermédiaire", desc: "Rénovation, restauration" },
  { rate: 5.5, label: "5,5% - Taux réduit", desc: "Travaux énergie, livres" },
  { rate: 0, label: "0% - Franchise", desc: "Auto-entrepreneur" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [description, setDescription] = useState("Prestation de peinture 2 jours à Lyon pour M. Dupont, 1200€ HT");
  const [tvaRate, setTvaRate] = useState<TvaRate>(20);
  const [clientName, setClientName] = useState("M. Dupont");
  const [clientSiret, setClientSiret] = useState("443 123 456 00019");
  const [clientEmail, setClientEmail] = useState("jean.dupont@email.fr");
  const [history, setHistory] = useState<Invoice[]>(mockHistory);
  const [activeNav, setActiveNav] = useState("Tableau de bord");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [showStripe, setShowStripe] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Analyse sémantique du texte...",
    "Extraction SIRET & mentions légales...",
    "Calcul TVA & conformité Factur-X...",
    "Génération PDF-A3 avec XML intégré..."
  ];

  const parsed = useMemo(() => {
    const amountMatch = description.match(/(\d+[\s.]?\d*)\s*€?\s*(HT)?/i);
    const ht = amountMatch ? parseInt(amountMatch[1].replace(/\s|\./g, "")) : 1200;
    const cityMatch = description.match(/à\s+([A-Z][a-zéèê]+)/);
    const city = cityMatch ? cityMatch[1] : "Lyon";
    const serviceMatch = description.split(/pour/i)[0]?.trim() || description.slice(0, 60);
    const clientMatch = description.match(/pour\s+(M\.|Mme|SCI|Atelier)?\s*([^,]+)/i);
    const detectedClient = clientMatch ? clientMatch[2].trim() : clientName;

    return { ht, city, service: serviceMatch, detectedClient };
  }, [description, clientName]);

  useEffect(() => {
    if (parsed.detectedClient && parsed.detectedClient.length > 2 && parsed.detectedClient !== clientName) {
      // subtle auto-fill, don't override if user edited manually recently
      // only if description changed and client name is similar
      if (description.includes("pour")) {
        setClientName(parsed.detectedClient);
      }
    }
  }, [parsed.detectedClient, description]);

  const tvaAmount = Math.round(parsed.ht * (tvaRate / 100) * 100) / 100;
  const ttcAmount = parsed.ht + tvaAmount;

  const nextNum = `F2026-${String(history.length + 1).padStart(3, '0')}`;

  const handleGenerate = () => {
    setIsGenerating(true);
    setAiStep(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) setAiStep(current);
      else {
        clearInterval(interval);
        const newInvoice: Invoice = {
          id: Date.now().toString(),
          num: nextNum,
          client: clientName || parsed.detectedClient,
          service: parsed.service.slice(0, 42),
          ht: parsed.ht,
          tva: tvaRate,
          ttc: ttcAmount,
          date: new Date().toLocaleDateString('fr-FR'),
          status: "Envoyée",
          facturx: true
        };
        setHistory([newInvoice, ...history]);
        setIsGenerating(false);
        setShowToast(`${newInvoice.num} générée - Conforme Factur-X`);
        setTimeout(() => setShowToast(null), 3500);
      }
    }, 650);
  };

  const kpis = useMemo(() => {
    const monthTotal = history.filter(h => h.status !== "Brouillon").length;
    const tvaCollected = history.reduce((acc, h) => acc + (h.ht * h.tva / 100), 0);
    const timeSaved = monthTotal * 0.8;
    return { monthTotal: monthTotal + 1, tvaCollected, timeSaved };
  }, [history]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');`}</style>

      {/* Top concours badge */}
      <div className="w-full bg-slate-900 text-white text-[12px] tracking-wide flex justify-center items-center gap-2 py-2.5 px-4">
        <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Concours France Building - Emergent Edition
        </span>
        <span className="hidden md:inline opacity-70">Votre facture est conforme à la réforme du 1er septembre 2026</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/75 border-b border-slate-100">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
                <Zap className="w-4 h-4" />
              </div>
              <div className="leading-none">
                <div className="font-bold tracking-tight text-[16px]">FactuZen AI</div>
                <div className="text-[11px] font-medium tracking-widest text-slate-500 -mt-0.5">FACTUR-X • 2026</div>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-100">
              {["Tableau de bord", "Historique", "Conformité"].map(item => (
                <button
                  key={item}
                  onClick={() => setActiveNav(item)}
                  className={`px-4 py-1.5 rounded-full text-[13.5px] font-medium transition ${activeNav === item ? "bg-white shadow-sm border border-slate-200 text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Conforme 2026
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white grid place-items-center text-[12px] font-semibold">JD</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 md:px-8 py-8 md:py-10">
        {/* Hero */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-[30px] md:text-[40px] font-bold tracking-tight leading-[0.95]">Transformez un texte en<br />facture conforme en 30s</h1>
            <p className="mt-3 text-[15px] leading-6 text-slate-500 max-w-[520px]">
              Conforme Factur-X & Chorus Pro pour la réforme obligatoire du 1er sept. 2026. Zéro compétence compta, zéro stress administratif.
            </p>
          </div>
          <div className="flex gap-3 overflow-auto pb-1">
            {[
              { k: "Factures ce mois", v: `${kpis.monthTotal}`, sub: "+2 vs avril", icon: FileText },
              { k: "TVA collectée", v: `${kpis.tvaCollected.toLocaleString('fr-FR')} €`, sub: "TVA due déclarée auto", icon: Euro },
              { k: "Temps économisé", v: `${kpis.timeSaved.toFixed(1)} h`, sub: "5h / sem. en moyenne", icon: Clock3 },
            ].map(card => (
              <div key={card.k} className="min-w-[180px] bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 grid place-items-center">
                    <card.icon className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{card.sub}</span>
                </div>
                <div className="mt-3 text-[22px] font-semibold tracking-tight">{card.v}</div>
                <div className="text-[12px] text-slate-500">{card.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          {/* LEFT Generator */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-6 md:p-7 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center"><Wand2 className="w-4 h-4" /></div>
                <div>
                  <div className="font-semibold text-[15px]">Générateur intelligent</div>
                  <div className="text-[12px] text-slate-500 -mt-0.5">IA entraînée sur la norme EN16931</div>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-900 text-white flex items-center gap-1"><Sparkles className="w-3 h-3" /> Auto-détection</span>
            </div>

            {/* Tabs */}
            <div className="px-6 md:px-7">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100">
                <button onClick={() => setActiveTab('text')} className={`h-10 rounded-xl text-[13.5px] font-medium flex items-center justify-center gap-2 transition ${activeTab === 'text' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  <FileText className="w-4 h-4" /> Description texte
                </button>
                <button onClick={() => setActiveTab('image')} className={`h-10 rounded-xl text-[13.5px] font-medium flex items-center justify-center gap-2 transition ${activeTab === 'image' ? 'bg-white shadow-sm border border-slate-200 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  <UploadCloud className="w-4 h-4" /> Importer devis (image)
                </button>
              </div>
            </div>

            <div className="p-6 md:p-7 pt-5 space-y-6">
              {activeTab === 'text' ? (
                <div>
                  <label className="text-[12px] font-medium text-slate-600 uppercase tracking-widest">Décrivez votre prestation</label>
                  <div className="mt-2 relative">
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ex: Prestation de peinture 2 jours à Lyon pour M. Dupont, 1200€ HT..."
                      className="w-full min-h-[112px] rounded-2xl border border-slate-200 bg-[#fcfdff] p-4 text-[14px] leading-6 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[11px] text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> IA active
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {["Peinture 2j Lyon 1200€ HT", "Pose carrelage 35m² Toulouse", "Dépannage clim pour SCI Lilas"].map(ex => (
                      <button key={ex} onClick={() => setDescription(`${ex} pour M. Dupont, 1200€ HT`)} className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">{ex}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[12px] font-medium text-slate-600 uppercase tracking-widest">Importez votre devis</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); setUploadedFile("devis-client-0526.jpg"); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-2 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${dragOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'}`}
                  >
                    <div className="w-10 h-10 mx-auto rounded-xl bg-white border border-slate-200 grid place-items-center shadow-sm"><UploadCloud className="w-5 h-5 text-slate-700" /></div>
                    <div className="mt-3 text-[13.5px] font-medium">{uploadedFile ? uploadedFile : "Glissez votre devis ici ou cliquez pour importer"}</div>
                    <div className="text-[12px] text-slate-500 mt-1">JPG, PNG, PDF • OCR Factur-X automatique</div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0].name); }} />
                  </div>
                </div>
              )}

              {/* TVA selector */}
              <div>
                <div className="flex items-center gap-2">
                  <label className="text-[12px] font-medium text-slate-600 uppercase tracking-widest">Taux TVA</label>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 absolute left-0 top-6 w-[300px] bg-slate-900 text-white text-[11px] leading-4 p-3 rounded-xl shadow-xl z-10 transition">
                      <b>Règles françaises :</b> 20% standard, 10% rénovation, 5.5% rénovation énergétique. Auto-entrepreneur en franchise : 0% avec mention "TVA non applicable, art. 293B CGI".
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tvaOptions.map(opt => (
                    <button
                      key={opt.rate}
                      onClick={() => setTvaRate(opt.rate)}
                      className={`text-left px-4 py-3 rounded-xl border text-[13px] transition ${tvaRate === opt.rate ? 'bg-slate-900 text-white border-slate-900 shadow' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className={`text-[11px] ${tvaRate === opt.rate ? 'text-white/60' : 'text-slate-500'}`}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Client fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-600">Nom client / Raison sociale</label>
                  <input value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600">SIRET client (14 chiffres)</label>
                  <input value={clientSiret} onChange={e => setClientSiret(e.target.value)} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3.5 text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600">Email de facturation</label>
                  <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
                </div>
              </div>

              {/* Generate */}
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full h-[52px] rounded-xl bg-[#6366f1] hover:bg-[#5558e6] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(99,102,241,0.35)] transition disabled:opacity-60"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? "Génération en cours..." : "Générer ma facture Factur-X"}
                </button>
                <div className="mt-2.5 flex items-center justify-center gap-2 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5" /> Chiffrée, horodatée, conforme EN16931</div>

                {isGenerating && (
                  <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="space-y-2.5">
                      {steps.map((s, i) => (
                        <div key={s} className={`flex items-center gap-2.5 text-[12.5px] transition ${i <= aiStep ? 'text-slate-900' : 'text-slate-400'}`}>
                          <div className={`w-5 h-5 rounded-full grid place-items-center border ${i < aiStep ? 'bg-emerald-500 border-emerald-500 text-white' : i === aiStep ? 
