import { create } from 'zustand';

const usePrivacyStore = create((set) => ({
  hiddenNumbers: localStorage.getItem('hiddenNumbers') === 'true' || false,
  toggleHiddenNumbers: () =>
    set((state) => {
      const newState = !state.hiddenNumbers;
      localStorage.setItem('hiddenNumbers', newState.toString());
      return { hiddenNumbers: newState };
    }),
}));

export default usePrivacyStore;
