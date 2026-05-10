import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLanguageStore = create(
  persist(
    (set) => ({
      lang: 'en',
      toggleLang: () => set((state) => ({ lang: state.lang === 'en' ? 'bn' : 'en' })),
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'fintrack-lang-storage',
    }
  )
);
