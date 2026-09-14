export interface LanguageBadgeInfo {
  label: string;
  flag: string;
  bg: string;
  text: string;
  color?: string;
}

export function getLanguageBadge(locale: string | null | undefined): LanguageBadgeInfo {
  const map: Record<string, LanguageBadgeInfo> = {
    en: { label: 'EN', flag: '🇬🇧', bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-300', color: 'bg-blue-500/10 text-blue-300 border border-blue-500/30' },
    it: { label: 'IT', flag: '🇮🇹', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-300', color: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' },
    fr: { label: 'FR', flag: '🇫🇷', bg: 'bg-indigo-500/10 border-indigo-500/30', text: 'text-indigo-300', color: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30' },
    de: { label: 'DE', flag: '🇩🇪', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-300', color: 'bg-amber-500/10 text-amber-300 border border-amber-500/30' },
    es: { label: 'ES', flag: '🇪🇸', bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-300', color: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30' },
    sw: { label: 'SW', flag: '🇹🇿', bg: 'bg-green-500/10 border-green-500/30', text: 'text-green-300', color: 'bg-green-500/10 text-green-300 border border-green-500/30' },
    ar: { label: 'AR', flag: '🇦🇪', bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-300', color: 'bg-rose-500/10 text-rose-300 border border-rose-500/30' },
  };

  const key = (locale || 'en').toLowerCase();
  return map[key] || {
    label: key.toUpperCase(),
    flag: '🌐',
    bg: 'bg-slate-800 border-slate-700',
    text: 'text-slate-300',
    color: 'bg-slate-800 text-slate-300 border border-slate-700',
  };
}
