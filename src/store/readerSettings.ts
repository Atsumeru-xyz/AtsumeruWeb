import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export type ReaderMode = 'PAGED' | 'WEBTOON';
export type ScaleMode = 'FIT_HEIGHT' | 'FIT_WIDTH' | 'ORIGINAL';
export type ReadingDirection = 'LTR' | 'RTL';

interface ReaderSettingsState {
    mode: ReaderMode;
    scaleMode: ScaleMode;
    readingDirection: ReadingDirection;
    widthPercent: number;

    setMode: (mode: ReaderMode) => void;
    setScaleMode: (mode: ScaleMode) => void;
    setReadingDirection: (dir: ReadingDirection) => void;
    setWidthPercent: (pct: number) => void;
}

export const useReaderSettings = create<ReaderSettingsState>()(
    persist(
        (set) => ({
            mode: 'PAGED',
            scaleMode: 'FIT_HEIGHT',
            readingDirection: 'RTL',
            widthPercent: 100,

            setMode: (mode) => set({mode}),
            setScaleMode: (scaleMode) => set({scaleMode}),
            setReadingDirection: (dir) => set({readingDirection: dir}),
            setWidthPercent: (pct) => set({widthPercent: pct}),
        }),
        {name: 'atsumeru-reader-settings'}
    )
);