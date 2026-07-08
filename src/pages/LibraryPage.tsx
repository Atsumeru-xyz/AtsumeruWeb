import {useEffect, useMemo, useRef} from 'react';
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Center,
    Container,
    Drawer,
    Flex,
    Group,
    Loader,
    Menu,
    ScrollArea,
    SimpleGrid,
    Tabs,
    Tooltip
} from '@mantine/core';
import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {useMediaQuery} from '@mantine/hooks';
import {
    IconAlphabetLatin,
    IconCalendar,
    IconEye,
    IconInfoCircle,
    IconSortAscending,
    IconSortDescending,
    IconStar
} from '@tabler/icons-react';

import {getBooks} from '../api/generated/books/books';
import {useGetCategoryList} from '../api/generated/categories/categories';
import type {IBaseBookItem} from '../api/model';

import {BookCard} from '../components/BookCard';
import {ChangeCategoryDialog} from '../components/ChangeCategoryDialog';
import {MetadataEditorDialog} from '../components/MetadataEditorDialog';
import {ShareTokenDialog} from '../components/ShareTokenDialog';
import {useUIStore} from '../store/uiStore';
import {useSelectionStore} from '../store/selectionStore';
import {GetBooksSort, type GetBooksSortType} from '../constants/sort';
import {I18N} from "../components/I18N.tsx";
import {useTranslation} from "react-i18next";
import {useHorizontalScroll} from "../useHorizontalScroll.ts";
import {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useAuthStore} from '../store/authStore';
import {useFilterStore} from '../store/filterStore';
import {fetchFiltersList, fetchFilteredBooks} from '../api/books-filtered';
import {FilterPanel} from '../components/filters/FilterPanel';
import {IconSelectAll, IconDeselect, IconTag, IconFilter} from '@tabler/icons-react';

interface Category {
    id: string;
    name: string;
    content_type: string;
    order: number;
}

export const LibraryPage = () => {
    const {t} = useTranslation();
    const queryClient = useQueryClient();

    const {
        searchQuery, activeCategory, sort, asc,
        setActiveCategory, setSort, setAsc
    } = useUIStore();
    const {data: categoriesData, isLoading: isCatsLoading, error: catsError} = useGetCategoryList();

    const scrollRef = useHorizontalScroll();

    const inSelection = useSelectionStore((s) => s.selected.size > 0);
    const selectedIds = useSelectionStore((s) => s.selected);
    const selectAll = useSelectionStore((s) => s.selectAll);
    const clearSelection = useSelectionStore((s) => s.clear);

    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [categoryDialogIds, setCategoryDialogIds] = useState<string[]>([]);
    const [categoryDialogBookCats, setCategoryDialogBookCats] = useState<string[][]>([]);

    const [editorOpened, setEditorOpened] = useState(false);
    const [editorBook, setEditorBook] = useState<IBaseBookItem | null>(null);

    const [shareOpened, setShareOpened] = useState(false);
    const [shareBook, setShareBook] = useState<IBaseBookItem | null>(null);

    const isAdmin = useAuthStore((s) => s.isAdmin());

    // Filter state
    const {
        filtersPanelOpen, toggleFiltersPanel,
        multiFilters, singleFilters, strictMatch,
        filterSearch, getActiveFilterParams, resetAllFilters
    } = useFilterStore();

    const isMobile = useMediaQuery('(max-width: 768px)');

    // Prevent body scroll when this page is mounted
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    // Determine if any filters are active
    const hasActiveFilters = useMemo(() => {
        const multiCount = Object.values(multiFilters).reduce((sum, arr) => sum + arr.length, 0);
        const singleCount = Object.keys(singleFilters).length;
        return multiCount + singleCount > 0;
    }, [multiFilters, singleFilters]);

    const combinedSearch = [searchQuery, filterSearch].filter(Boolean).join(' ') || undefined;

    // Fetch available filters from server (cached until page refresh)
    const {data: filtersData} = useQuery({
        queryKey: ['filters', 'list'],
        queryFn: () => fetchFiltersList({
            presentation: 'SERIES_AND_SINGLES',
        }),
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const categories = useMemo(() => {
        if (!categoriesData) return [];
        const list = (categoriesData as unknown) as Category[];
        return list.sort((a, b) => a.order - b.order);
    }, [categoriesData]);

    useEffect(() => {
        if (categories.length > 0) {
            const catExists = categories.find(c => c.id === activeCategory);
            if (!activeCategory || !catExists) {
                setActiveCategory(categories[0].id);
            }
        }
    }, [categories, activeCategory, setActiveCategory]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const activeFilterParams = hasActiveFilters ? getActiveFilterParams() : {};

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isBooksLoading,
        isError: isBooksError
    } = useInfiniteQuery({
        queryKey: ['books', 'infinite', activeCategory, sort, asc, searchQuery, filterSearch, activeFilterParams],
        enabled: !!activeCategory,

        queryFn: async ({pageParam = 1}) => {
            if (hasActiveFilters) {
                const res = await fetchFilteredBooks({
                    ...activeFilterParams,
                    category: activeCategory || '',
                    presentation: 'SERIES_AND_SINGLES',
                    search: combinedSearch,
                    sort: sort as string,
                    asc: asc,
                    page: pageParam as number,
                    limit: 30,
                    with_volumes: true,
                });
                return res as IBaseBookItem[];
            }
            const res = await getBooks({
                page: pageParam as number,
                limit: 30,
                sort: sort as GetBooksSortType,
                asc: asc,
                search: combinedSearch,
                category: activeCategory || '',
                presentation: 'SERIES_AND_SINGLES',
                with_volumes: true
            });
            return res as unknown as IBaseBookItem[];
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 30 ? allPages.length + 1 : undefined;
        },
    });

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (isFetchingNextPage || !hasNextPage) return;
            const {scrollTop, scrollHeight, clientHeight} = container;
            if (scrollHeight - scrollTop - clientHeight < 200) {
                fetchNextPage();
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isCatsLoading) {
        return <Center h="50vh"><Loader/></Center>;
    }

    if (catsError) {
        return <Container mt="xl"><Alert color="red"><I18N>error_unable_to_load_categories</I18N></Alert></Container>
    }

    const allBooks = data?.pages.flatMap((page) => page) || [];
    const sortOptions = Object.keys(GetBooksSort)
        .filter(key => key != GetBooksSort.SERIE)
        .map(key => ({
            value: key,
            label: t('sort_' + key.toLowerCase())
        }));

    const getSortIcon = (sortKey: string) => {
        switch (sortKey) {
            case GetBooksSort.TITLE:
                return <IconAlphabetLatin size={16}/>;
            case GetBooksSort.CREATED_AT:
            case GetBooksSort.UPDATED_AT:
                return <IconCalendar size={16}/>;
            case GetBooksSort.SCORE:
            case GetBooksSort.POPULARITY:
                return <IconStar size={16}/>;
            default:
                return <IconEye size={16}/>;
        }
    };

    const currentSortLabel = t('sort_' + sort.toLowerCase());

    return (
        <div style={{height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
            <Box bg="var(--mantine-color-body)" style={{
                borderBottom: '1px solid var(--mantine-color-default-border)',
                flexShrink: 0,
            }} px="md" py="xs">
                <Flex direction={{base: 'column', sm: 'row'}} align={{base: 'stretch', sm: 'center'}} gap="sm"
                      justify="space-between">
                    <Tabs
                        value={activeCategory}
                        onChange={setActiveCategory}
                        variant="pills"
                        radius="xl"
                        style={{flex: 1, minWidth: 0}}
                    >
                        <ScrollArea type="hover" scrollbarSize={6} offsetScrollbars viewportRef={scrollRef}>
                            <Tabs.List
                                style={{
                                    flexWrap: 'nowrap',
                                    borderBottom: 0,
                                    paddingBottom: 4
                                }}
                            >
                                {categories.map((cat) => (
                                    <Tabs.Tab
                                        key={cat.id}
                                        value={cat.id}
                                        style={{whiteSpace: 'nowrap'}}
                                    >
                                        {cat.name}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </ScrollArea>
                    </Tabs>

                    <Group justify="flex-end" gap="xs" wrap="nowrap">
                        <Menu shadow="md" width={200} position="bottom-end">
                            <Menu.Target>
                                <Button variant="default" leftSection={getSortIcon(sort)}>
                                    {currentSortLabel}
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label><I18N>sort_by</I18N></Menu.Label>
                                {sortOptions.map(opt => (
                                    <Menu.Item
                                        key={opt.value}
                                        leftSection={getSortIcon(opt.value)}
                                        onClick={() => setSort(opt.value)}
                                        bg={sort === opt.value ? 'var(--mantine-primary-color-light)' : undefined}
                                        c={sort === opt.value ? 'var(--mantine-primary-color-filled)' : undefined}
                                    >
                                        <span>{opt.label}</span>
                                    </Menu.Item>
                                ))}
                            </Menu.Dropdown>
                        </Menu>

                        <ActionIcon variant="default" size="36px" onClick={() => setAsc(!asc)}>
                            {asc ? <IconSortAscending size={20}/> : <IconSortDescending size={20}/>}
                        </ActionIcon>

                        <ActionIcon
                            variant={filtersPanelOpen ? 'filled' : 'default'}
                            size="36px"
                            onClick={toggleFiltersPanel}
                            style={{position: 'relative'}}
                        >
                            <IconFilter size={20}/>
                            {hasActiveFilters && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: 'var(--mantine-color-red-filled)',
                                        display: 'block',
                                    }}
                                />
                            )}
                        </ActionIcon>
                    </Group>
                </Flex>
            </Box>

            <div style={{flex: '1 1 0%', minHeight: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column'}}>
                {/* Main content */}
                <div ref={scrollContainerRef} style={{flex: '1 1 0%', minWidth: 0, overflow: 'auto'}}>
            <div style={{marginTop: 'var(--mantine-spacing-md)', paddingLeft: 'var(--mantine-spacing-md)', paddingRight: filtersPanelOpen && !isMobile ? 'calc(var(--mantine-spacing-md) + 320px)' : 'var(--mantine-spacing-md)', position: 'relative', zIndex: 1}}>
                {isBooksError && (
                    <Alert color="red" title={t('error')}
                           icon={<IconInfoCircle/>}><I18N>error_unable_to_load_list</I18N></Alert>
                )}

                {inSelection && isAdmin && (
                    <Group mb="md" gap="xs" p="sm" style={{
                        background: 'var(--mantine-primary-color-light)',
                        borderRadius: 'var(--mantine-radius-md)',
                    }}>
                        <Button size="xs" variant="filled" leftSection={<IconTag size={14}/>} onClick={() => {
                            const ids = [...selectedIds];
                            const bookCats = ids.map(id => {
                                const book = allBooks.find(b => b.id === id);
                                const raw = (book as any)?.categories;
                                return Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',').filter(Boolean) : []);
                            });
                            setCategoryDialogIds(ids);
                            setCategoryDialogBookCats(bookCats);
                            setCategoryDialogOpen(true);
                        }}>
                            <I18N>context_change_category</I18N>
                        </Button>
                        <Button size="xs" variant="light" leftSection={<IconSelectAll size={14}/>} onClick={() => {
                            const allIds = allBooks.map(b => b.id || '').filter(Boolean);
                            selectAll(allIds);
                        }}>
                            <I18N>context_select_all</I18N>
                        </Button>
                        <Button size="xs" variant="light" leftSection={<IconDeselect size={14}/>} onClick={clearSelection}>
                            <I18N>context_clear_selection</I18N>
                        </Button>
                    </Group>
                )}

                {!isBooksLoading && allBooks.length === 0 && (
                    <Center h={200}>
                        <Alert variant="transparent" color="gray" title={t('error_empty')}>
                            <I18N>error_empty_category</I18N>
                        </Alert>
                    </Center>
                )}

                <SimpleGrid
                    cols={{base: 2, xs: 3, sm: 4, md: 5, lg: 6, xl: 8}}
                    spacing="md"
                    verticalSpacing="lg"
                >
                    {allBooks.map((book) => (
                        <BookCard
                            key={`${book.id}`}
                            book={book}
                            onEdit={(book) => {
                                setEditorBook(book);
                                setEditorOpened(true);
                            }}
                            onChangeCategory={(b) => {
                                const raw = (b as any).categories;
                                const catIds = Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',').filter(Boolean) : []);
                                setCategoryDialogIds([b.id || '']);
                                setCategoryDialogBookCats([catIds]);
                                setCategoryDialogOpen(true);
                            }}
                            onDeleted={() => {
                                queryClient.invalidateQueries();
                            }}
                            onShare={(book) => {
                                setShareBook(book);
                                setShareOpened(true);
                            }}
                        />
                    ))}
                </SimpleGrid>

                {(isBooksLoading || isFetchingNextPage) && (
                    <Center mt="xl" pb="xl">
                        <Loader/>
                    </Center>
                )}

            </div>
                </div>

                {/* Desktop filter sidebar — absolute, constrained by parent */}
                {filtersPanelOpen && !isMobile && filtersData && (
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 320,
                        overflow: 'auto',
                        borderLeft: '1px solid var(--mantine-color-default-border)',
                        background: 'var(--mantine-color-body)',
                        zIndex: 10,
                    }}>
                        <FilterPanel
                            filters={filtersData}
                        />
                    </div>
                )}
            </div>

            {/* Mobile filter drawer */}
            <Drawer
                opened={filtersPanelOpen && isMobile}
                onClose={toggleFiltersPanel}
                position="right"
                size="90%"
                title="Фильтры"
            >
                {filtersData && (
                    <FilterPanel
                        filters={filtersData}
                        onApply={toggleFiltersPanel}
                    />
                )}
            </Drawer>

            <ChangeCategoryDialog
                opened={categoryDialogOpen}
                onClose={() => setCategoryDialogOpen(false)}
                bookIds={categoryDialogIds}
                bookCategoryIds={categoryDialogBookCats}
                onChanged={() => {
                    queryClient.invalidateQueries();
                    clearSelection();
                }}
            />

            <MetadataEditorDialog
                opened={editorOpened}
                onClose={() => setEditorOpened(false)}
                book={editorBook}
                onSaved={() => {
                    queryClient.invalidateQueries();
                }}
            />

            <ShareTokenDialog
                opened={shareOpened}
                onClose={() => setShareOpened(false)}
                serieHash={shareBook?.id || ''}
                serieName={shareBook?.title || ''}
            />
        </div>
    );
};