import {useEffect, useRef, useState} from 'react';
import {
    Badge,
    Box,
    Button,
    Center,
    Divider,
    Group,
    Loader,
    Paper,
    RingProgress,
    ScrollArea,
    Stack,
    Text,
    Tooltip,
} from '@mantine/core';
import {useDebouncedCallback} from '@mantine/hooks';
import {useLocation, useNavigate} from 'react-router-dom';
import type {IBaseBookItem} from '../api/model';
import {getBooks} from '../api/generated/books/books';
import {SecureImage} from './SecureImage';
import {BOOK_STATUS_CONFIG, type BookStatus} from '../config/book-status-config';
import {I18N} from './I18N';
import {IconFlame, IconHeart} from '@tabler/icons-react';
import {useGetCategoryList} from '../api/generated/categories/categories';

interface SearchPanelProps {
    query: string;
    onClose: () => void;
    inputId?: string;
}

const MAX_VISIBLE = 5;
const ITEM_H = 68;
const DIVIDER_H = 1;
const BUTTON_AREA_H = 52;
const EXTRA_H = 4;

export const SearchPanel = ({query, onClose, inputId}: SearchPanelProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [results, setResults] = useState<IBaseBookItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [queried, setQueried] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const {data: categoriesData} = useGetCategoryList();
    const categoryMap = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        if (categoriesData) {
            const map = new Map<string, string>();
            const list = (Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || []) as {id: string; name: string; content_type?: string}[];
            list.forEach(c => {
                if (c.id && c.name) map.set(c.id, c.name);
                if (c.content_type) map.set(c.content_type, c.name);
            });
            categoryMap.current = map;
        }
    }, [categoriesData]);

    const doSearch = useDebouncedCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            setQueried(false);
            return;
        }
        setLoading(true);
        setQueried(true);
        try {
            const response = await getBooks({
                page: 1,
                limit: 50,
                search: q.trim(),
                presentation: 'SERIES_AND_SINGLES',
                asc: false,
                with_volumes: true,
            });
            setResults((response as unknown as IBaseBookItem[]) || []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, 400);

    useEffect(() => {
        doSearch(query);
    }, [query]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (panelRef.current && !panelRef.current.contains(target)
                && !(inputId && target.closest(`#${inputId}`))) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose, inputId]);

    if (!query.trim() || location.pathname === '/library') return null;

    const totalReadPages = (book: IBaseBookItem) =>
        book.volumes?.reduce((sum, v) => sum + (v.history?.current_page ?? 0), 0) ?? 0;

    const totalPages = (book: IBaseBookItem) =>
        book.volumes?.reduce((sum, v) => sum + (v?.pages_count ?? 0), 0) ?? 0;

    const hasResults = results.length > 0;
    const visibleCount = Math.min(results.length, MAX_VISIBLE);
    const moreText = results.length > MAX_VISIBLE;
    const listHeight = hasResults
        ? visibleCount * (ITEM_H + DIVIDER_H) + (moreText ? 22 : 0) + EXTRA_H
        : 80;

    return (
        <Paper
            ref={panelRef}
            shadow="xl"
            withBorder
            style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 200,
            }}
        >
            <ScrollArea h={listHeight} type="hover" scrollbarSize={6}>
                {loading && (
                    <Center h={80}><Loader size="sm"/></Center>
                )}

                {!loading && queried && !hasResults && (
                    <Center h={80}>
                        <Text c="dimmed"><I18N>search_no_results</I18N></Text>
                    </Center>
                )}

                {!loading && hasResults && (
                    <Stack gap={0}>
                        {results.slice(0, MAX_VISIBLE).map((book, idx) => {
                            const config = BOOK_STATUS_CONFIG[book.status as BookStatus] || BOOK_STATUS_CONFIG.UNKNOWN;
                            const Icon = config.icon;
                            const read = totalReadPages(book);
                            const total = totalPages(book);
                            const progress = total > 0 ? Math.min(100, (read / total) * 100) : 0;

                            return (
                                <Box key={book.id || idx}>
                                    {idx > 0 && <Divider/>}
                                    <Group
                                        wrap="nowrap"
                                        p="xs"
                                        h={ITEM_H}
                                        style={{cursor: 'pointer'}}
                                        onClick={() => {
                                            navigate(`/book/${book.id}`);
                                            onClose();
                                        }}
                                    >
                                        <Box style={{width: 40, height: 52, flexShrink: 0, borderRadius: 4, overflow: 'hidden'}}>
                                            {book.cover ? (
                                                <SecureImage hash={book.cover} alt="" height="100%"/>
                                            ) : (
                                                <Box bg="gray.7" w="100%" h="100%" style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}/>
                                            )}
                                        </Box>

                                        <Stack gap={0} style={{flex: 1, minWidth: 0}}>
                                            <Text size="sm" fw={500} truncate="end">{book.title}</Text>
                                            <Text size="xs" c="dimmed" truncate="end">{book.alt_title}</Text>
                                            <Text size="xs" c="dimmed" truncate="end" opacity={0.6}>
                                                {(() => {
                                                    const ct = (book as any).content_type as string;
                                                    const autoName = ct ? categoryMap.current.get(ct) || '' : '';
                                                    const custom = ((book as any).categories || '').split(',')
                                                        .map((id: string) => categoryMap.current.get(id.trim()) || '')
                                                        .filter(Boolean)
                                                        .join(', ');
                                                    if (autoName && custom) return `${autoName} \u2022 ${custom}`;
                                                    return custom || autoName || '';
                                                })()}
                                            </Text>
                                        </Stack>

                                        <Group gap={6} wrap="nowrap" style={{flexShrink: 0}}>
                                            <Tooltip label={config.label}>
                                                <Icon size={16} stroke={2} style={{color: config.color}}/>
                                            </Tooltip>
                                            {book.is_adult && (
                                                <Badge size="xs" color="red" variant="filled" leftSection={<IconFlame size={10}/>}>18+</Badge>
                                            )}
                                            {!book.is_adult && book.is_mature && (
                                                <Badge size="xs" color="orange" variant="filled" leftSection={<IconHeart size={10}/>}>16+</Badge>
                                            )}
                                            {total > 0 && (
                                                <RingProgress
                                                    size={36}
                                                    thickness={3}
                                                    roundCaps
                                                    sections={[{value: progress, color: 'var(--mantine-primary-color-filled)'}]}
                                                    label={
                                                        <Text size="8px" ta="center" fw={700}>
                                                            {Math.round(progress)}%
                                                        </Text>
                                                    }
                                                />
                                            )}
                                        </Group>
                                    </Group>
                                </Box>
                            );
                        })}
                        {moreText && (
                            <Text size="xs" c="dimmed" ta="center">
                                +{results.length - MAX_VISIBLE} more
                            </Text>
                        )}
                    </Stack>
                )}
            </ScrollArea>

            {!loading && hasResults && (
                <Box px="xs" pb="xs" pt={0}>
                    <Button
                        variant="light"
                        fullWidth
                        onClick={() => {
                            navigate('/library');
                            onClose();
                        }}
                    >
                        <I18N>go_to_library</I18N>
                    </Button>
                </Box>
            )}
        </Paper>
    );
};
