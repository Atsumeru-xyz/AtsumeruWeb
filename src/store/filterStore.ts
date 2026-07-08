import {create} from 'zustand';
import {persist} from 'zustand/middleware';

interface FilterStoreState {
    filtersPanelOpen: boolean;
    multiFilters: Record<string, string[]>;
    singleFilters: Record<string, string>;
    strictMatch: boolean;
    filterSearch: string;

    setFiltersPanelOpen: (open: boolean) => void;
    toggleFiltersPanel: () => void;
    setMultiFilter: (filterId: string, values: string[]) => void;
    toggleMultiFilterValue: (filterId: string, value: string) => void;
    setSingleFilter: (filterId: string, value: string) => void;
    removeSingleFilter: (filterId: string) => void;
    setStrictMatch: (strict: boolean) => void;
    setFilterSearch: (search: string) => void;
    resetAllFilters: () => void;
    getActiveFilterParams: () => Record<string, string>;
}

export const useFilterStore = create<FilterStoreState>()(
    persist(
        (set, get) => ({
            filtersPanelOpen: false,
            multiFilters: {},
            singleFilters: {},
            strictMatch: false,
            filterSearch: '',

            setFiltersPanelOpen: (open) => set({filtersPanelOpen: open}),
            toggleFiltersPanel: () => set((s) => ({filtersPanelOpen: !s.filtersPanelOpen})),

            setMultiFilter: (filterId, values) =>
                set((s) => ({multiFilters: {...s.multiFilters, [filterId]: values}})),

            toggleMultiFilterValue: (filterId, value) =>
                set((s) => {
                    const current = s.multiFilters[filterId] ?? [];
                    const next = current.includes(value)
                        ? current.filter((v) => v !== value)
                        : [...current, value];
                    return {multiFilters: {...s.multiFilters, [filterId]: next}};
                }),

            setSingleFilter: (filterId, value) =>
                set((s) => {
                    if (s.singleFilters[filterId] === value) {
                        const next = {...s.singleFilters};
                        delete next[filterId];
                        return {singleFilters: next};
                    }
                    return {singleFilters: {...s.singleFilters, [filterId]: value}};
                }),

            removeSingleFilter: (filterId) =>
                set((s) => {
                    const next = {...s.singleFilters};
                    delete next[filterId];
                    return {singleFilters: next};
                }),

            setStrictMatch: (strict) => set({strictMatch: strict}),
            setFilterSearch: (search) => set({filterSearch: search}),

            resetAllFilters: () =>
                set({multiFilters: {}, singleFilters: {}, filterSearch: ''}),

            getActiveFilterParams: () => {
                const {multiFilters, singleFilters, strictMatch} = get();
                const params: Record<string, string> = {};
                const mode = strictMatch ? 'AND' : 'OR';

                for (const [filterId, values] of Object.entries(multiFilters)) {
                    if (values.length > 0) {
                        params[filterId] = values.join(',');
                        params[`${filterId}_mode`] = mode;
                    }
                }

                for (const [filterId, value] of Object.entries(singleFilters)) {
                    if (value) {
                        params[filterId] = value;
                    }
                }

                return params;
            },
        }),
        {
            name: 'atsumeru-filter-settings',
            partialize: (state) => ({
                filtersPanelOpen: state.filtersPanelOpen,
                strictMatch: state.strictMatch,
                multiFilters: state.multiFilters,
                singleFilters: state.singleFilters,
            }),
        }
    )
);
