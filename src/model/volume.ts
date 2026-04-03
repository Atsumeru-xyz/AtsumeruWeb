export interface VolumeItem {
    id: string;
    title: string;
    volume: number;
    fileName: string;
    pagesCount: number;
    isRead: boolean;
    history?: {
        currentPage: number;
        pagesCount: number;
        lastReadAt: number;
    };
    cover?: string;
    createdAt?: number;
}