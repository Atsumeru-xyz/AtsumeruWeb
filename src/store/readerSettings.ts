import {create} from 'zustand';
import {persist} from 'zustand/middleware';

export type ReaderMode = 'PAGED' | 'WEBTOON';
export type ScaleMode = 'FIT_HEIGHT' | 'FIT_WIDTH' | 'ORIGINAL';
export type ReadingDirection = 'LTR' | 'RTL';
export type NotificationPosition = 'top' | 'center' | 'bottom';

interface ReaderSettingsState {
    mode: ReaderMode;
    scaleMode: ScaleMode;
    readingDirection: ReadingDirection;
    widthPercent: number;
    showNotification: boolean;
    notificationPosition: NotificationPosition;

    setMode: (mode: ReaderMode) => void;
    setScaleMode: (mode: ScaleMode) => void;
    setReadingDirection: (dir: ReadingDirection) => void;
    setWidthPercent: (pct: number) => void;
    setShowNotification: (show: boolean) => void;
    setNotificationPosition: (pos: NotificationPosition) => void;
}

export const useReaderSettings = create<ReaderSettingsState>()(
    persist(
        (set) => ({
            mode: 'PAGED',
            scaleMode: 'FIT_HEIGHT',
            readingDirection: 'RTL',
            widthPercent: 100,
            showNotification: true,
            notificationPosition: 'top',

            setMode: (mode) => set({mode}),
            setScaleMode: (scaleMode) => set({scaleMode}),
            setReadingDirection: (dir) => set({readingDirection: dir}),
            setWidthPercent: (pct) => set({widthPercent: pct}),
            setShowNotification: (show) => set({showNotification: show}),
            setNotificationPosition: (pos) => set({notificationPosition: pos}),
        }),
        {name: 'atsumeru-reader-settings'}
    )
);