import {useEffect, useState} from 'react';
import {Center, Loader, Text} from '@mantine/core';
import {I18N} from './I18N.tsx';
import {useQuery} from '@tanstack/react-query';
import {useIntersection} from '@mantine/hooks';
import {useReaderSettings} from '../store/readerSettings.ts';
import {AXIOS_INSTANCE} from '../api/custom-instance.ts';

interface ReaderImageProps {
    volumeHash: string;
    page: number;
    mode: 'PAGED' | 'WEBTOON';
    isActive?: boolean;
    preload?: boolean;
    token?: string;
}

const fetchPageImage = async (volumeHash: string, page: number, token?: string) => {
    const url = token
        ? `/api/v1/share/${token}/${volumeHash}/page/${page}`
        : `/api/v1/books/${volumeHash}/page/${page}`;
    const response = await AXIOS_INSTANCE.get(url, {responseType: 'blob'});
    return response.data as Blob;
};

export const ReaderImage = ({volumeHash, page, mode, isActive, preload, token}: ReaderImageProps) => {
    const {scaleMode, widthPercent} = useReaderSettings();

    const {ref, entry} = useIntersection({
        root: null,
        threshold: 0,
        rootMargin: '1200px',
    });

    const shouldFetch = mode === 'PAGED'
        ? true
        : (entry?.isIntersecting || isActive || false);

    const {data: blob, isLoading, isError} = useQuery({
        queryKey: ['page', volumeHash, page, token],
        queryFn: () => fetchPageImage(volumeHash, page, token),
        enabled: shouldFetch,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 30,
    });

    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            setObjectUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [blob]);

    const getStyle = (): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {display: 'block', margin: '0 auto'};

        if (mode === 'PAGED') {
            if (scaleMode === 'FIT_HEIGHT') {
                return {...baseStyle, maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain'};
            }
            if (scaleMode === 'FIT_WIDTH') {
                return {...baseStyle, width: `${widthPercent}%`, height: 'auto'};
            }
            return {...baseStyle, maxWidth: 'none', maxHeight: 'none'};
        } else {
            return {...baseStyle, width: `${widthPercent}%`, height: 'auto'};
        }
    };

    if (mode === 'PAGED' && isLoading) {
        return <Center h="100vh" w="100%"><Loader color="var(--mantine-primary-color-filled)"/></Center>;
    }

    if (isError) {
        return <Center h={mode === 'PAGED' ? "100vh" : 300}><Text size="xl" c="red"><I18N
            values={{val: page}}>page_load_error</I18N></Text></Center>;
    }

    return (
        <div ref={ref} style={{
            width: '100%',
            textAlign: 'center',
            minHeight: objectUrl ? 'auto' : '100vh',
            position: 'relative'
        }}>
            {isLoading && mode === 'WEBTOON' && (
                <Center style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
                    <Loader size="sm" color="gray"/>
                </Center>
            )}

            {objectUrl && (
                <img
                    src={objectUrl}
                    alt={`Page ${page}`}
                    style={getStyle()}
                />
            )}
        </div>
    );
};