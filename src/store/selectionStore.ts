import {create} from 'zustand';

interface SelectionState {
    selected: Set<string>;
    toggle: (id: string) => void;
    isSelected: (id: string) => boolean;
    selectAll: (ids: string[]) => void;
    clear: () => void;
    count: () => number;
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
    selected: new Set(),
    toggle: (id) => set((state) => {
        const next = new Set(state.selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        return {selected: next};
    }),
    isSelected: (id) => get().selected.has(id),
    selectAll: (ids) => set({selected: new Set(ids)}),
    clear: () => set({selected: new Set()}),
    count: () => get().selected.size,
}));
