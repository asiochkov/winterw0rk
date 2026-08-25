import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { en } from '../i18n/en';
import { ru } from '../i18n/ru';

export type Lang = 'en' | 'ru';
type Dict = typeof en;

const DICTS: Record<Lang, Dict> = { en, ru };

type Params = Record<string, string | number>;

interface LanguageState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Dict, params?: Params) => string;
}

const LanguageContext = createContext<LanguageState | null>(null);

function readInitial(): Lang {
  try {
    const stored = localStorage.getItem('ww-lang');
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('ww-lang', l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: keyof Dict, params?: Params) => {
      let str: string = DICTS[lang][key] ?? DICTS.en[key] ?? String(key);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
