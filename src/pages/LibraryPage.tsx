import {useEffect, useMemo} from 'react';
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Center,
    Container,
    Flex,
    Group,
    Loader,
    Menu,
    ScrollArea,
    SimpleGrid,
    Tabs
} from '@mantine/core';
import {useInfiniteQuery} from '@tanstack/react-query';
import {useIntersection} from '@mantine/hooks';
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
import {useUIStore} from '../store/uiStore';
import {GetBooksSort, type GetBooksSortType} from '../constants/sort';
import {I18N} from "../components/I18N.tsx";
import {useTranslation} from "react-i18next";
import {useHorizontalScroll} from "../useHorizontalScroll.ts";

interface Category {
    id: string;
    name: string;
    content_type: string;
    order: number;
}

export const LibraryPage = () => {
    const {t} = useTranslation();

    const {
        searchQuery, activeCategory, sort, asc,
        setActiveCategory, setSort, setAsc
    } = useUIStore();
    const {data: categoriesData, isLoading: isCatsLoading, error: catsError} = useGetCategoryList();

    const scrollRef = useHorizontalScroll();

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

    const {ref, entry} = useIntersection({
        root: null,
        threshold: 1,
    });

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isBooksLoading,
        isError: isBooksError
    } = useInfiniteQuery({
        queryKey: ['books', 'infinite', activeCategory, sort, asc, searchQuery],
        enabled: !!activeCategory,

        queryFn: async ({pageParam = 1}) => {
            const res = await getBooks({
                page: pageParam as number,
                limit: 30,
                sort: sort as GetBooksSortType,
                asc: asc,
                search: searchQuery,
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
        if (entry?.isIntersecting && hasNextPage) {
            fetchNextPage();
        }
    }, [entry, hasNextPage, fetchNextPage]);

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
        <Container fluid px={0}>
            <Box bg="var(--mantine-color-body)" style={{
                position: 'sticky',
                top: 60,
                zIndex: 90,
                borderBottom: '1px solid var(--mantine-color-default-border)'
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
                    </Group>
                </Flex>
            </Box>

            <Container fluid mt="md">
                {isBooksError && (
                    <Alert color="red" title={t('error')}
                           icon={<IconInfoCircle/>}><I18N>error_unable_to_load_list</I18N></Alert>
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
                        <BookCard key={`${book.id}`} book={book}/>
                    ))}
                </SimpleGrid>

                {(isBooksLoading || isFetchingNextPage) && (
                    <Center mt="xl" pb="xl">
                        <Loader/>
                    </Center>
                )}

                <div ref={ref} style={{height: 20}}/>
            </Container>
        </Container>
    );
};