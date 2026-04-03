import {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import {ActionIcon, Box, Button, Group, Menu, Paper, Slider, Stack, Text, Transition} from '@mantine/core';
import {
    IconArrowLeft,
    IconArrowLeftBar,
    IconArrowRightBar,
    IconArrowsMaximize,
    IconArrowsMinimize,
    IconLayoutList,
    IconLayoutRows,
    IconSettings,
    IconX
} from '@tabler/icons-react';
import {useQuery} from '@tanstack/react-query';
import {useDebouncedCallback, useFullscreen} from '@mantine/hooks';
import {notifications} from '@mantine/notifications';
import {useTranslation} from 'react-i18next';

import {useGetVolumes} from '../api/generated/books/books';
import type {VolumeItem} from '../api/model';

import {AXIOS_INSTANCE} from '../api/custom-instance';
import {useReaderSettings} from '../store/readerSettings';
import {ReaderImage} from '../components/ReaderImage.tsx';
import {I18N} from "../components/I18N.tsx";

interface VolumeHistory {
    current_page: number;
    pages_count: number;
    last_read_at: number;
}

interface VolumeInfo {
    id: string;
    title: string;
    additional_title: string;
    pages_count: number;
    history?: VolumeHistory;
}

export const ReaderPage = () => {
    const {t} = useTranslation();
    const {bookId, volumeId} = useParams<{ bookId: string; volumeId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const {toggle: toggleFullscreen, fullscreen} = useFullscreen();
    const {
        mode, setMode,
        scaleMode, setScaleMode,
        readingDirection, setReadingDirection,
        widthPercent, setWidthPercent
    } = useReaderSettings();

    const [page, setPage] = useState(1);
    const [uiVisible, setUiVisible] = useState(true);

    const isRestored = useRef(false);

    const [sliderValue, setSliderValue] = useState(1);

    useEffect(() => {
        setSliderValue(page);
    }, [page]);

    useEffect(() => {
        isRestored.current = false;
    }, [volumeId]);

    const {data: volume, isLoading} = useQuery({
        queryKey: ['volume', volumeId],
        queryFn: async () => {
            const res = await AXIOS_INSTANCE.get<VolumeInfo>(`/api/v1/books/${bookId}/volumes/${volumeId}`);
            return res.data;
        },
        enabled: !!bookId && !!volumeId
    });

    const {data: volumesData} = useGetVolumes(bookId as string, {with_chapters: false}, {query: {enabled: !!bookId}});

    const totalPages = volume?.pages_count || 1;

    const volumes = ((volumesData as unknown as VolumeItem[]) || []).sort((a, b) => a.volume - b.volume);
    const currentVolIndex = volumes.findIndex(v => v.id === volumeId);

    const prevVolume = currentVolIndex > 0 ? volumes[currentVolIndex - 1] : null;
    const nextVolume = currentVolIndex !== -1 && currentVolIndex < volumes.length - 1 ? volumes[currentVolIndex + 1] : null;

    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleScroll = useDebouncedCallback(() => {
        if (mode !== 'WEBTOON' || !uiVisible) return;

        const viewportCenter = window.innerHeight / 2;
        let closestPage = page;
        let minDistance = Infinity;

        pageRefs.current.forEach((el, index) => {
            if (el) {
                const rect = el.getBoundingClientRect();
                const elementCenter = rect.top + rect.height / 2;
                const distance = Math.abs(viewportCenter - elementCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPage = index + 1;
                }
            }
        });

        if (closestPage !== page) {
            setPage(closestPage);
        }
    }, 150);

    useEffect(() => {
        if (volume && !isRestored.current) {
            isRestored.current = true;

            const navState = location.state as { page?: number | 'last' };

            if (navState?.page === 'last') {
                setPage(totalPages);
            } else if (navState?.page === 1) {
                setPage(1);
            } else {
                const historyPage = volume.history?.current_page;
                if (historyPage && historyPage > 1) {
                    setPage(historyPage >= totalPages ? 1 : historyPage);
                } else {
                    setPage(1);
                }
            }

            if (mode === 'WEBTOON') {
                setTimeout(() => {
                    const targetPage = navState?.page === 'last' ? totalPages : (volume.history?.current_page || 1);
                    const targetElement = pageRefs.current[targetPage - 1];
                    if (targetElement) {
                        targetElement.scrollIntoView({behavior: 'auto', block: 'start'});
                    }
                }, 100);
            }
        }
    }, [volume, totalPages, location.state, mode]);

    const syncProgress = useDebouncedCallback(async (currentPage: number) => {
        if (!bookId || !volumeId) return;

        console.log(`Syncing progress: Volume ${volumeId}, Page ${currentPage}`);

        try {
            await AXIOS_INSTANCE.get('/api/v1/books/sync/push', {
                params: {
                    archive_hash: volumeId,
                    page: currentPage
                }
            });
        } catch (e) {
            console.error("Sync error", e);
            notifications.show({
                title: t('sync_error'),
                message: t('sync_error_with_server'),
                color: 'red',
            });
        }
    }, 500);

    useEffect(() => {
        syncProgress(page);
    }, [page, syncProgress]);

    const goNextVolume = useCallback(() => {
        if (nextVolume) {
            navigate(`/read/${bookId}/${nextVolume.id}`, {replace: true, state: {page: 1}});
        } else {
            notifications.show({title: t('notification_end'), message: t('notification_finished_reading_last_volume'), color: 'blue'});
        }
    }, [nextVolume, bookId, navigate]);

    const goPrevVolume = useCallback(() => {
        if (prevVolume) {
            navigate(`/read/${bookId}/${prevVolume.id}`, {replace: true, state: {page: 'last'}});
        } else {
            notifications.show({title: t('notification_start'), message: t('notification_first_volume'), color: 'blue'});
        }
    }, [prevVolume, bookId, navigate]);

    const nextPage = useCallback(() => {
        if (page < totalPages) setPage(p => p + 1);
        else goNextVolume();
    }, [page, totalPages, goNextVolume]);

    const prevPage = useCallback(() => {
        if (page > 1) setPage(p => p - 1);
        else goPrevVolume();
    }, [page, goPrevVolume]);

    const showDirectionNotification = (dir: 'LTR' | 'RTL') => {
        notifications.show({
            title: t('reading_mode'),
            message: dir === 'RTL' ? t('reading_mode_rtl') : t('reading_mode_ltr'),
            color: 'var(--mantine-primary-color-filled)',
            autoClose: 3000,
        });
    };

    const notificationShown = useRef(false);

    useEffect(() => {
        if (mode === 'PAGED' && !notificationShown.current) {
            showDirectionNotification(readingDirection);
            notificationShown.current = true;
        }
    }, [mode, readingDirection]);

    const handleZoneClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const width = e.currentTarget.clientWidth;
        const x = e.clientX;
        const isRTL = readingDirection === 'RTL';

        if (x < width * 0.3) {
            isRTL ? nextPage() : prevPage();
        } else if (x > width * 0.7) {
            isRTL ? prevPage() : nextPage();
        } else {
            setUiVisible(!uiVisible);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (mode === 'PAGED') {
                const isRTL = readingDirection === 'RTL';
                if (e.key === 'ArrowRight') isRTL ? prevPage() : nextPage();
                if (e.key === 'ArrowLeft') isRTL ? nextPage() : prevPage();
                if (e.key === ' ') nextPage();
            }
            if (e.key === 'Escape') navigate(-1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [mode, readingDirection, nextPage, prevPage, navigate]);

    if (isLoading) return null;

    return (
        <Box bg="#000" w="100%" h="100vh" style={{overflow: 'hidden', position: 'relative'}}>
            {mode === 'PAGED' && (
                <Box
                    w="100%"
                    h="100%"
                    onClick={handleZoneClick}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        overflowY: scaleMode === 'FIT_WIDTH' ? 'auto' : 'hidden',
                        alignItems: scaleMode === 'FIT_WIDTH' ? 'flex-start' : 'center',
                        justifyContent: 'center'
                    }}
                >
                    {bookId && volumeId && (
                        <>
                            <ReaderImage volumeHash={volumeId} page={page} mode="PAGED" isActive={true}/>
                            <div style={{display: 'none'}}>
                                <ReaderImage volumeHash={volumeId} page={page + 1} mode="PAGED" preload={true}/>
                            </div>
                        </>
                    )}
                </Box>
            )}

            {mode === 'WEBTOON' && (
                <Box
                    w="100%"
                    h="100%"
                    style={{
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': {
                            display: 'none'
                        },
                    }}
                    onClick={() => setUiVisible(!uiVisible)}
                    onScroll={handleScroll}
                >
                    {prevVolume && (
                        <Box h={150} display="flex" style={{alignItems: 'center', justifyContent: 'center'}}>
                            <Button size="lg" color="var(--mantine-primary-color-filled)" onClick={(e) => {
                                e.stopPropagation();
                                goPrevVolume();
                            }}>
                                <I18N values={{val: prevVolume.title || prevVolume.volume}}>previous_volume</I18N>
                            </Button>
                        </Box>
                    )}

                    {bookId && volumeId && Array.from({length: totalPages}).map((_, index) => (
                        <div key={index + 1} ref={(el) => pageRefs.current[index] = el}>
                            <ReaderImage
                                key={index + 1}
                                volumeHash={volumeId}
                                page={index + 1}
                                mode="WEBTOON"
                            />
                        </div>
                    ))}

                    <Box h={200} display="flex" style={{alignItems: 'center', justifyContent: 'center'}}>
                        {nextVolume ? (
                            <Button size="lg" color="var(--mantine-primary-color-filled)" onClick={(e) => {
                                e.stopPropagation();
                                goNextVolume();
                            }}>
                                <I18N values={{val: nextVolume.title || nextVolume.volume}}>next_volume</I18N>
                            </Button>
                        ) : (
                            <Button variant="default" onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/book/${bookId}`);
                            }}>
                                <I18N>book_end</I18N>
                            </Button>
                        )}
                    </Box>
                </Box>
            )}

            <Transition mounted={uiVisible} transition="slide-down" duration={200} timingFunction="ease">
                {(styles) => (
                    <Paper
                        style={{...styles, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100}}
                        radius={0}
                        p="md"
                        bg="rgba(0, 0, 0, 0.85)"
                    >
                        <Group justify="space-between">
                            <Group>
                                <ActionIcon variant="transparent" c="white" onClick={() => navigate(-1)}>
                                    <IconArrowLeft/>
                                </ActionIcon>
                                <Stack gap={0}>
                                    <Text c="white" size="sm" lineClamp={1}
                                          fw={500}>{volume?.additional_title || t('untitled')}</Text>
                                    <Text c="dimmed" size="xs">{volume?.title}</Text>
                                </Stack>
                            </Group>

                            <Group>
                                <Menu shadow="md" width={200} position="bottom-end">
                                    <Menu.Target>
                                        <ActionIcon variant="transparent" c="white" size="lg">
                                            <IconSettings/>
                                        </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Label><I18N>reader_reading_mode</I18N></Menu.Label>
                                        <Menu.Item
                                            leftSection={<IconLayoutRows size={14}/>}
                                            onClick={() => setMode('PAGED')}
                                            bg={mode === 'PAGED' ? 'var(--mantine-primary-color-light)' : undefined}
                                        >
                                            <I18N>reader_reading_paged</I18N>
                                        </Menu.Item>
                                        <Menu.Item
                                            leftSection={<IconLayoutList size={14}/>}
                                            onClick={() => setMode('WEBTOON')}
                                            bg={mode === 'WEBTOON' ? 'var(--mantine-primary-color-light)' : undefined}
                                        >
                                            <I18N>reader_reading_webtoon</I18N>
                                        </Menu.Item>
                                        <Menu.Divider/>
                                        <Menu.Label><I18N>reader_reading_direction</I18N></Menu.Label>
                                        <Menu.Item
                                            leftSection={<IconArrowLeftBar size={14}/>}
                                            onClick={() => {
                                                setReadingDirection('RTL');
                                                showDirectionNotification('RTL');
                                            }}
                                            bg={readingDirection === 'RTL' ? 'var(--mantine-primary-color-light)' : undefined}
                                            disabled={mode === 'WEBTOON'}
                                        >
                                            <I18N>reader_reading_direction_rtl</I18N>
                                        </Menu.Item>
                                        <Menu.Item
                                            leftSection={<IconArrowRightBar size={14}/>}
                                            onClick={() => {
                                                setReadingDirection('LTR');
                                                showDirectionNotification('LTR');
                                            }}
                                            bg={readingDirection === 'LTR' ? 'var(--mantine-primary-color-light)' : undefined}
                                            disabled={mode === 'WEBTOON'}
                                        >
                                            <I18N>reader_reading_direction_ltr</I18N>
                                        </Menu.Item>
                                        <Menu.Label><I18N>reader_reading_scaling</I18N></Menu.Label>
                                        <Menu.Item
                                            leftSection={<IconArrowsMinimize size={14}/>}
                                            onClick={() => setScaleMode('FIT_HEIGHT')}
                                            bg={scaleMode === 'FIT_HEIGHT' ? 'var(--mantine-primary-color-light)' : undefined}
                                            disabled={mode === 'WEBTOON'}
                                        >
                                            <I18N>reader_reading_scaling_fit_height</I18N>
                                        </Menu.Item>
                                        <Menu.Item
                                            leftSection={<IconArrowsMaximize size={14}/>}
                                            onClick={() => setScaleMode('FIT_WIDTH')}
                                            bg={scaleMode === 'FIT_WIDTH' ? 'var(--mantine-primary-color-light)' : undefined}
                                            disabled={mode === 'WEBTOON'}
                                        >
                                            <I18N>reader_reading_scaling_fit_width</I18N>
                                        </Menu.Item>
                                        <Menu.Divider/>
                                        <Box px="sm" pb="xs">
                                            <Text size="xs" c="dimmed" mb={4}><I18N values={{val: widthPercent}}>reader_reading_scaling_width_percent</I18N></Text>
                                            <Slider
                                                value={widthPercent}
                                                onChange={setWidthPercent}
                                                min={10} max={100} step={1}
                                                color="var(--mantine-primary-color-filled)"
                                            />
                                        </Box>
                                        <Menu.Divider/>
                                        <Menu.Item
                                            leftSection={fullscreen ? <IconX size={14}/> : <IconLayoutList size={14}/>}
                                            onClick={toggleFullscreen}
                                        >
                                            {fullscreen ? t('exit_fullscreen_mode') : t('fullscreen_mode')}
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        </Group>
                    </Paper>
                )}
            </Transition>

            <Transition mounted={uiVisible} transition="slide-up" duration={200} timingFunction="ease">
                {(styles) => (
                    <Paper
                        style={{...styles, position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100}}
                        radius={0}
                        p="md"
                        bg="rgba(0, 0, 0, 0.85)"
                    >
                        <Stack gap="xs">
                            <Group
                                justify="space-between"
                                dir={mode === 'PAGED' && readingDirection === 'RTL' ? 'rtl' : 'ltr'}
                            >
                                <Text c="white" size="xs">{page}</Text>
                                <Text c="white" size="xs">{totalPages}</Text>
                            </Group>

                            {mode === 'PAGED' && (
                                <Slider
                                    value={readingDirection === 'RTL' ? totalPages - page + 1 : page}
                                    onChange={(sliderValue) => {
                                        const newPage = readingDirection === 'RTL'
                                            ? totalPages - sliderValue + 1
                                            : sliderValue;
                                        setPage(newPage);
                                    }}
                                    min={1}
                                    max={totalPages}
                                    label={(sliderValue) => {
                                        const realPage = readingDirection === 'RTL'
                                            ? totalPages - sliderValue + 1
                                            : sliderValue;
                                        return t('page_label', {val: realPage});
                                    }}
                                    size="sm"
                                    thumbSize={16}
                                    inverted={readingDirection === 'RTL'}
                                    styles={{
                                        track: {backgroundColor: 'rgba(255, 255, 255, 0.2)'},
                                        thumb: {
                                            borderWidth: 2,
                                            borderColor: 'white',
                                            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                                        }
                                    }}
                                />
                            )}

                            {mode === 'WEBTOON' && (
                                <Slider
                                    value={sliderValue}
                                    onChange={setSliderValue}
                                    onChangeEnd={(newValue) => {
                                        setPage(newValue);
                                        const targetElement = pageRefs.current[newValue - 1];
                                        if (targetElement) {
                                            targetElement.scrollIntoView({behavior: 'smooth', block: 'start'});
                                        }
                                    }}

                                    min={1}
                                    max={totalPages}
                                    color="var(--mantine-primary-color-filled)"
                                    size="sm"
                                    thumbSize={16}
                                    styles={{
                                        track: {backgroundColor: 'rgba(255, 255, 255, 0.2)'},
                                        thumb: {
                                            borderWidth: 2,
                                            borderColor: 'white',
                                            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                                        }
                                    }}
                                />
                            )}
                        </Stack>
                    </Paper>
                )}
            </Transition>
        </Box>
    );
};