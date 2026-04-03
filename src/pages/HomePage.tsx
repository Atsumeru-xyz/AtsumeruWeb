import {Container} from '@mantine/core';
import {I18N} from '../components/I18N';
import {HorizontalList} from '../components/HorizontalList';
import {useGetBooksHubInfo, useGetBooksHubInfo1} from '../api/generated/hub/hub';
import {useGetBooksHistory} from '../api/generated/history/history';
import type {IBaseBookItem} from '../api/model';

export const HomePage = () => {
    const {data: historyData, isLoading: historyLoading} = useGetBooksHistory({
        limit: 50,
        presentation: 'SERIES'
    });

    const {data: updatesData, isLoading: updatesLoading} = useGetBooksHubInfo1({
        limit: 50,
        presentation: 'SERIES',
        with_chapters: true
    });

    const {data: arrivalsData, isLoading: arrivalsLoading} = useGetBooksHubInfo({
        limit: 50,
        presentation: 'SERIES'
    });

    const history = (historyData as unknown as IBaseBookItem[]) || [];

    const isSerieCompleted = (book: IBaseBookItem) => {
        if (!book.volumes || book.volumes.length === 0) {
            return false;
        }

        return book.volumes.every(volume => {
            return volume.history?.current_page == volume.history?.pages_count || false;
        });
    };

    const readingHistory = history.filter(book => !isSerieCompleted(book));
    const completedHistory = history.filter(book => isSerieCompleted(book));
    const updates = (updatesData as unknown) as IBaseBookItem[] | undefined;
    const arrivals = (arrivalsData as unknown) as IBaseBookItem[] | undefined;

    return (
        <Container fluid>
            <HorizontalList
                title={<I18N>continue_reading</I18N>}
                data={readingHistory}
                isLoading={historyLoading}
                largeCards={true}
                emptyMessage={<I18N>empty_history</I18N>}
                showLibraryButton
            />

            {completedHistory.length > 0 && (
                <HorizontalList
                    title={<I18N>completed</I18N>}
                    data={completedHistory}
                    isLoading={historyLoading}
                />
            )}

            <HorizontalList
                title={<I18N>latest_updates</I18N>}
                data={updates}
                isLoading={updatesLoading}
            />

            <HorizontalList
                title={<I18N>new_arrivals</I18N>}
                data={arrivals}
                isLoading={arrivalsLoading}
            />
        </Container>
    );
};