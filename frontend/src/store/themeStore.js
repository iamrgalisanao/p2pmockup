import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set) => ({
            mode: 'dark', // default to dark as per current app style
            toggleTheme: () => set((state) => {
                const newMode = state.mode === 'dark' ? 'light' : 'dark';
                if (newMode === 'light') {
                    document.body.classList.add('light-mode');
                } else {
                    document.body.classList.remove('light-mode');
                }
                return { mode: newMode };
            }),
            initTheme: () => {
                const state = useThemeStore.getState();
                if (state.mode === 'light') {
                    document.body.classList.add('light-mode');
                } else {
                    document.body.classList.remove('light-mode');
                }
            }
        }),
        {
            name: 'theme-storage',
        }
    )
);
