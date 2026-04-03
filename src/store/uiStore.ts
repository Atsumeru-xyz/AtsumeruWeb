import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {GetBooksSort, type GetBooksSortType} from '../constants/sort';

interface UIState {
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    activeCategory: string | null;
    setActiveCategory: (catId: string) => void;

    sort: GetBooksSortType | string;
    setSort: (sort: string) => void;

    asc: boolean;
    setAsc: (asc: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            searchQuery: '',
            setSearchQuery: (query) => set({searchQuery: query}),

            activeCategory: null,
            setActiveCategory: (catId) => set({activeCategory: catId}),

            sort: GetBooksSort.CREATED_AT,
            setSort: (sort) => set({sort}),

            asc: false,
            setAsc: (asc) => set({asc}),
        }),
        {
            name: 'atsumeru-library-settings',
            partialize: (state) => ({
                activeCategory: state.activeCategory,
                sort: state.sort,
                asc: state.asc,
            }),
        }
    )
);