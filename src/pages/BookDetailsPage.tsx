import {useNavigate, useParams} from 'react-router-dom';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Container,
    Divider,
    Grid,
    Group,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Typography
} from '@mantine/core';
import {IconArrowLeft, IconCalendar, IconFlame, IconHeart, IconUser, IconWorld} from '@tabler/icons-react';
import {useGetBookDetails, useGetVolumes} from '../api/generated/books/books';
import {SecureImage} from '../components/SecureImage';
import {VolumeCard} from '../components/VolumeCard';
import {type IBaseBookItem, type VolumeItem} from '../api/model';
import {BOOK_STATUS_CONFIG, type BookStatus} from "../config/book-status-config.tsx";
import {BOOK_CONTENT_TYPE_CONFIG, type ReadableContentType} from "../config/book-content-type-config.tsx";
import {BOOK_GENRE_CONFIG, type GenreOrdinalStr} from "../config/book-genre-config.tsx";
import {BOOK_CENSORSHIP_CONFIG, type Censorship} from "../config/book-censorship-config.tsx";
import {BOOK_PLOT_TYPE_CONFIG, type PlotType} from "../config/book-plot-type-config.tsx";
import {useTranslation} from "react-i18next";
import {I18N} from "../components/I18N.tsx";
import type {ReactNode} from "react";

export const BookDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const {t} = useTranslation();
    const navigate = useNavigate();

    const {data: bookData, isLoading: isBookLoading} = useGetBookDetails(
        id as string,
        {with_volumes: true, with_chapters: false},
        {query: {enabled: !!id && id !== 'undefined'}}
    );

    const {data: volumesData, isLoading: isVolumesLoading} = useGetVolumes(
        id as string,
        {with_chapters: false},
        {query: {enabled: !!id && id !== 'undefined'}}
    );

    if (isBookLoading) {
        return (
            <Container my="xl">
                <Button variant="subtle" leftSection={<IconArrowLeft size={16}/>} onClick={() => navigate(-1)}
                        mb="md"><I18N>back</I18N></Button>
                <Grid>
                    <Grid.Col span={3}><Skeleton height={400}/></Grid.Col>
                    <Grid.Col span={9}><Stack><Skeleton height={40} width="70%"/><Skeleton height={20}/><Skeleton
                        height={200}/></Stack></Grid.Col>
                </Grid>
            </Container>
        );
    }

    if (!bookData || !id || id === 'undefined') {
        return (
            <Container my="xl">
                <Button variant="subtle" leftSection={<IconArrowLeft size={16}/>}
                        onClick={() => navigate(-1)}><I18N>back</I18N></Button>
                <Text size="xl" mt="md"><I18N>error_no_book_not_found</I18N></Text>
            </Container>
        );
    }

    const book = bookData as unknown as IBaseBookItem;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const volumes = ((volumesData as unknown as VolumeItem[]) || []).sort((a, b) => a.volume - b.volume);
    const currentBookId = book.id;
    const firstUnread = volumes.find(v => !(v.read || (v.history?.current_page || 0) >= (v.pages_count || 1000))) || volumes[0];
    const isNotReadBefore = firstUnread == null || firstUnread.id === volumes[0].id && (firstUnread?.history?.current_page == 0 || true);

    const parseList = (val?: string | string[]) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return val.split(',').map(s => s.trim()).filter(Boolean);
    };

    const authors = parseList(book.authors);
    const artists = parseList(book.artists);
    const genres = parseList(book.genres);
    const tags = parseList(book.tags);

    const MetadataRow = ({icon: Icon, label, value}: { icon: any, label: ReactNode, value?: string | number | null }) => {
        if (!value) return null;
        return (
            <Group gap="xs" wrap="nowrap">
                <ThemeIcon variant="light" color="gray" size="sm"><Icon size={14}/></ThemeIcon>
                <Text size="sm" c="dimmed" style={{whiteSpace: 'nowrap'}}>{label}:</Text>
                <Text size="sm" fw={500} lineClamp={1}>{value}</Text>
            </Group>
        );
    };

    const statusConfig = BOOK_STATUS_CONFIG[book.status as BookStatus] || BOOK_STATUS_CONFIG.UNKNOWN;
    const IconStatus = statusConfig.icon;

    const contentTypeConfig = BOOK_CONTENT_TYPE_CONFIG[book.content_type as ReadableContentType] || BOOK_CONTENT_TYPE_CONFIG.UNKNOWN;
    const IconContentType = contentTypeConfig.icon;

    const censorshipConfig = BOOK_CENSORSHIP_CONFIG[book.censorship as Censorship];
    const IconCensorship = censorshipConfig.icon;

    const plotTypeConfig = BOOK_PLOT_TYPE_CONFIG[book.plot_type as PlotType];
    const IconPlotType = plotTypeConfig?.icon;

    return (
        <Box>
            <Box bg="var(--mantine-color-body)" pt="md" pb="xl"
                 style={{borderBottom: '1px solid var(--mantine-color-default-border)'}}>
                <Container fluid>
                    <Grid gutter="xl">
                        <Grid.Col span={{base: 12, xs: 4, sm: 3, md: 3, lg: 2}} style={{position: 'relative'}}>

                            <ActionIcon
                                onClick={() => navigate(-1)}
                                variant="filled"
                                color="dark"
                                size="lg"
                                radius="xl"
                                style={{
                                    position: 'absolute',
                                    top: 20,
                                    left: 20,
                                    zIndex: 10,
                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                <IconArrowLeft size={18}/>
                            </ActionIcon>

                            <Box style={{borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}}>
                                <SecureImage hash={book.cover} alt={book.title} height="auto"/>
                            </Box>

                            <Button fullWidth mt="md" size="md" onClick={() => {
                                if (firstUnread) navigate(`/read/${currentBookId}/${firstUnread.id}`);
                            }}>
                                {isNotReadBefore ? <I18N>read</I18N> : <I18N>continue_reading</I18N>}
                            </Button>
                        </Grid.Col>

                        <Grid.Col span={{base: 12, xs: 8, sm: 9, md: 9, lg: 10}}>
                            <Stack gap="xs">
                                <Group gap="xs" align="center">
                                    {book.is_mature && (
                                        <Badge
                                            color="#d35400"
                                            variant="filled"
                                            size="lg"
                                            mt={6}
                                            leftSection={<IconHeart size={16}/>}
                                        >
                                            16+
                                        </Badge>
                                    )}

                                    {book.is_adult && (
                                        <Badge
                                            color="#c0392b"
                                            variant="filled"
                                            size="lg"
                                            mt={6}
                                            leftSection={<IconFlame size={16}/>}
                                        >
                                            18+
                                        </Badge>
                                    )}
                                    <Title order={1} lh={1}>{book.title}</Title>
                                </Group>
                                {book.alt_title && <Text size="lg" c="dimmed">{book.alt_title}</Text>}
                                {(book.jap_title || book.kor_title) &&
                                    <Text size="sm" c="dimmed" fs="italic">{book.jap_title || book.kor_title}</Text>}

                                <Group gap="xs" mt="xs">
                                    {book.score && <Badge leftSection="★" color="yellow" variant="light"
                                                          size="lg">{book.score}</Badge>}
                                    <Badge leftSection={<IconContentType size={14} stroke={2}/>}
                                           color={contentTypeConfig.color} variant="light" tt="none"
                                           size="lg">{contentTypeConfig.label}</Badge>
                                    <Badge leftSection={<IconStatus size={14} stroke={2}/>} color={statusConfig.color}
                                           variant="light" tt="none" size="lg">{statusConfig.label}</Badge>
                                    {plotTypeConfig && (
                                        <Badge leftSection={<IconPlotType size={14} stroke={2}/>}
                                               color={plotTypeConfig.color} variant="light" tt="none"
                                               size="lg">{plotTypeConfig.label}</Badge>
                                    )}
                                    {censorshipConfig && book.censorship !== 'UNKNOWN' && (
                                        <Badge leftSection={<IconCensorship size={14} stroke={2}/>}
                                               color={censorshipConfig.color} variant="light" tt="none"
                                               size="lg">{censorshipConfig.label}</Badge>
                                    )}
                                </Group>

                                <Group gap={4}>
                                    {genres.map((genreOrdinal) => {
                                        const config = BOOK_GENRE_CONFIG[genreOrdinal as GenreOrdinalStr];
                                        if (!config) return null;

                                        const Icon = config.icon;

                                        return (
                                            <Badge
                                                key={genreOrdinal}
                                                variant="light"
                                                color={config.color}
                                                leftSection={<Icon size={18}/>}
                                            >
                                                {config.label}
                                            </Badge>
                                        );
                                    })}
                                </Group>

                                <Typography p={0} mt="sm">
                                    <div
                                        style={{
                                            maxHeight: 150,
                                            overflowY: 'auto',
                                            fontSize: '15px',
                                            lineHeight: '1.6',
                                            color: 'var(--mantine-color-text)'
                                        }}
                                        dangerouslySetInnerHTML={{__html: book.description || t('error_no_description')}}
                                    />
                                </Typography>

                                <Divider my="sm"/>

                                <SimpleGrid cols={{base: 1, sm: 2, md: 3}} spacing="xs" verticalSpacing="xs">
                                    {/* eslint-disable-next-line react-hooks/static-components */}
                                    <MetadataRow icon={IconUser} label={<I18N>author</I18N>} value={authors.join(', ')}/>
                                    {/* eslint-disable-next-line react-hooks/static-components */}
                                    <MetadataRow icon={IconUser} label={<I18N>artist</I18N>} value={artists.join(', ')}/>
                                    {/* eslint-disable-next-line react-hooks/static-components */}
                                    <MetadataRow icon={IconWorld} label={<I18N>publisher</I18N>} value={book.publisher}/>
                                    {/* eslint-disable-next-line react-hooks/static-components */}
                                    <MetadataRow icon={IconCalendar} label={<I18N>year</I18N>} value={book.year}/>
                                    {/* eslint-disable-next-line react-hooks/static-components */}
                                    <MetadataRow icon={IconWorld} label={<I18N>country</I18N>} value={book.country}/>
                                    {/* eslint-disable-next-line react-hooks/static-components */}
                                    <MetadataRow icon={IconWorld} label={<I18N>language</I18N>} value={book.language}/>
                                </SimpleGrid>

                                {tags.length > 0 && (
                                    <Group gap={4} mt="md">
                                        {tags.map(tag => <Badge key={tag} variant="outline" color="gray"
                                                                size="sm">#{tag}</Badge>)}
                                    </Group>
                                )}
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Container>
            </Box>

            <Container fluid mt="md">
                <Title order={3} mb="lg"><I18N values={{val: volumes.length}}>volumes_label</I18N></Title>

                {isVolumesLoading ? (
                    <SimpleGrid cols={{base: 2, xs: 3, sm: 4, md: 5, lg: 6}} spacing="md">
                        {Array(6).fill(0).map((_, i) => <Skeleton key={i} height={250} radius="md"/>)}
                    </SimpleGrid>
                ) : (
                    volumes.length > 0 ? (
                        <SimpleGrid cols={{base: 2, xs: 3, sm: 4, md: 5, lg: 6, xl: 8}} spacing="md"
                                    verticalSpacing="xl">
                            {volumes.map((vol) => (
                                <VolumeCard volume={vol} bookId={currentBookId}/>
                            ))}
                        </SimpleGrid>
                    ) : (
                        <Text c="dimmed" ta="center" py="xl"><I18N>error_no_volumes</I18N></Text>
                    )
                )}
            </Container>
        </Box>
    );
};