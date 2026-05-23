import {useState, useEffect, useCallback, useMemo} from 'react';
import {
    Modal, TextInput, Textarea, Select, Group,
    Stack, Button,     ScrollArea, Grid, Box, Text, Divider,
    ActionIcon, Tooltip, Center, Paper, TagsInput, SegmentedControl
} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {useTranslation} from 'react-i18next';
import {
    IconLock, IconLockOpen, IconDeviceFloppy,
    IconBook, IconPencil, IconStarHalf,
    IconTrendingUp, IconNumbers, IconSubtitlesEdit,
    IconEdit, IconLink, IconFolder,
    IconFileDescription, IconWorld,
    IconUsers, IconFaceId, IconMasksTheater,
    IconTag, IconLanguage, IconMapPin,
    IconCalendarHeart, IconBalloon, IconCircleCheck,
    IconEye
} from '@tabler/icons-react';
import {useQuery} from '@tanstack/react-query';
import type {IBaseBookItem, BookSerie, BoundServiceServiceType} from '../api/model';
import {updateMetadata} from '../api/generated/metadata/metadata';
import {getBooks} from '../api/generated/books/books';
import {SecureImage} from './SecureImage';

const SHOW_LOCK_BUTTONS = false;

const iconW = 26;

interface MetadataEditorDialogProps {
    opened: boolean;
    onClose: () => void;
    book: IBaseBookItem | null;
    onSaved: () => void;
}

const BOUND_SERVICES: {key: string; label: string; serviceType: BoundServiceServiceType; urlPattern?: RegExp; urlTemplate?: (id: string) => string}[] = [
    {key: 'myAnimeList', label: 'MyAnimeList', serviceType: 'MYANIMELIST', urlPattern: /myanimelist\.net\/manga\/(\d+)/i, urlTemplate: (id) => `https://myanimelist.net/manga/${id}/`},
    {key: 'shikimori', label: 'Shikimori', serviceType: 'SHIKIMORI', urlPattern: /shikimori\.(?:one|org)\/mangas\/(\d+)/i, urlTemplate: (id) => `https://shikimori.one/mangas/${id}`},
    {key: 'kitsu', label: 'Kitsu', serviceType: 'KITSU', urlPattern: /kitsu\.(?:io|app)\/manga\/([^/\s]+)/i, urlTemplate: (id) => `https://kitsu.io/manga/${id}`},
    {key: 'aniList', label: 'AniList', serviceType: 'ANILIST', urlPattern: /anilist\.co\/manga\/(\d+)/i, urlTemplate: (id) => `https://anilist.co/manga/${id}/`},
    {key: 'mangaUpdates', label: 'MangaUpdates', serviceType: 'MANGAUPDATES', urlPattern: /mangaupdates\.com\/series\/([^/\s]+)/i, urlTemplate: (id) => `https://www.mangaupdates.com/series/${id}`},
    {key: 'animePlanet', label: 'Anime-Planet', serviceType: 'ANIMEPLANET', urlPattern: /anime-planet\.com\/manga\/([^/\s]+)/i, urlTemplate: (id) => `https://www.anime-planet.com/manga/${id}`},
    {key: 'comicVine', label: 'ComicVine', serviceType: 'COMICVINE', urlPattern: /comicvine\.gamespot\.com\/[^/]+\/(\d+)/i, urlTemplate: (id) => `https://comicvine.gamespot.com/comic/${id}/`},
    {key: 'comicsDB', label: 'ComicsDB', serviceType: 'COMICSDB', urlPattern: /comicsdb\.ru\/(?:manga\/)?(\d+)/i, urlTemplate: (id) => `https://comicsdb.ru/manga/${id}`},
    {key: 'hentag', label: 'Hentag', serviceType: 'HENTAG', urlPattern: /hentag\.com\/[^/]+\/(\d+)/i, urlTemplate: (id) => `https://hentag.com/manga/${id}/`},
];

const CONTENT_TYPES = ['UNKNOWN', 'MANGA', 'MANHWA', 'MANHUA', 'DOUJINSHI', 'HENTAI_MANGA', 'YAOI', 'YAOI_MANGA', 'WEBCOMICS', 'RUMANGA', 'OEL_MANGA', 'STRIP', 'COMICS', 'YURI', 'YURI_MANGA', 'HENTAI_MANHWA', 'LIGHT_NOVEL', 'NOVEL', 'BOOK', 'TEXT_PORN', 'FANFICTION'];
const STATUSES = ['UNKNOWN', 'ONGOING', 'COMPLETE', 'SINGLE', 'ANTHOLOGY', 'MAGAZINE', 'LICENSED', 'ANNOUNCEMENT', 'NOT_RELEASED', 'CANCELED', 'ON_HOLD', 'EMPTY'];
const TRANSLATION_STATUSES = ['UNKNOWN', 'ONGOING', 'COMPLETE', 'ON_HOLD', 'DROPPED'];
const PLOT_TYPES = ['UNKNOWN', 'MAIN_STORY', 'ALTERNATIVE_STORY', 'PREQUEL', 'INTERQUEL', 'SEQUEL', 'THREEQUEL', 'QUADRIQUEL', 'MIDQUEL', 'PARALLELQUEL', 'REQUEL', 'ADAPTATION', 'SPIN_OFF', 'CROSSOVER', 'COMMON_CHARACTER', 'COLORED', 'OTHER'];
const CENSORSHIPS = ['UNKNOWN', 'CENSORED', 'UNCENSORED', 'DECENSORED', 'PARTIALLY_CENSORED', 'MOSAIC_CENSORSHIP'];
const COLORS = ['UNKNOWN', 'MONOCHROME', 'PARTIALLY_COLORED', 'FULL_COLOR', 'COLORED'];

const GENRE_ORDINAL_TO_I18N: Record<number, string> = {
    0: 'genre_action', 1: 'genre_adult', 2: 'genre_adventure', 3: 'genre_comedy',
    4: 'genre_doujinshi', 5: 'genre_drama', 6: 'genre_ecchi', 7: 'genre_fantasy',
    8: 'genre_gender_bender', 9: 'genre_harem', 10: 'genre_historical', 11: 'genre_horror',
    12: 'genre_josei', 13: 'genre_magic', 14: 'genre_martial_arts', 15: 'genre_mecha',
    16: 'genre_mystery', 17: 'genre_oneshot', 18: 'genre_psychological', 19: 'genre_romance',
    20: 'genre_school_life', 21: 'genre_sci_fi', 22: 'genre_seinen', 23: 'genre_shoujo',
    24: 'genre_shoujo_ai', 25: 'genre_shounen', 26: 'genre_shounen_ai', 27: 'genre_slice_of_life',
    28: 'genre_sports', 29: 'genre_supernatural', 30: 'genre_tragedy', 31: 'genre_yaoi', 32: 'genre_yuri',
};

const GENRE_DISPLAY_TO_ORDINAL: Record<string, number> = {
    'Action': 0, 'Adult': 1, 'Adventure': 2, 'Comedy': 3, 'Doujinshi': 4,
    'Drama': 5, 'Ecchi': 6, 'Fantasy': 7, 'Gender Bender': 8, 'Harem': 9,
    'Historical': 10, 'Horror': 11, 'Josei': 12, 'Magic': 13, 'Martial Arts': 14,
    'Mecha': 15, 'Mystery': 16, 'One-shot': 17, 'Psychological': 18, 'Romance': 19,
    'School Life': 20, 'Sci-Fi': 21, 'Seinen': 22, 'Shoujo': 23, 'Shoujo-ai': 24,
    'Shounen': 25, 'Shounen-ai': 26, 'Slice of Life': 27, 'Sports': 28,
    'Supernatural': 29, 'Tragedy': 30, 'Yaoi': 31, 'Yuri': 32,
    'Экшен': 0, 'Приключения': 2, 'Комедия': 3, 'Додзинси': 4,
    'Драма': 5, 'Этти': 6, 'Фэнтези': 7, 'Смена пола': 8, 'Гарем': 9,
    'Историческое': 10, 'Ужасы': 11, 'Дзёсэй': 12, 'Магия': 13, 'Боевые искусства': 14,
    'Меха': 15, 'Детектив / Тайна': 16, 'Ваншот': 17, 'Психология': 18, 'Романтика': 19,
    'Школа': 20, 'Научная фантастика': 21, 'Сэйнэн': 22, 'Сёдзё': 23, 'Сёдзё-ай': 24,
    'Сёнэн': 25, 'Сёнэн-ай': 26, 'Повседневность': 27, 'Спорт': 28,
    'Сверхъестественное': 29, 'Трагедия': 30, 'Яой': 31, 'Юри': 32,
};

function ordinalGenresToDisplay(genresStr: string | string[] | undefined, t: (key: string) => string): string[] {
    if (!genresStr) return [];
    const parts = Array.isArray(genresStr) ? genresStr : genresStr.split(',');
    return parts
        .map(s => typeof s === 'string' ? s.trim() : String(s))
        .filter(Boolean)
        .map(s => {
            const ordinal = parseInt(s, 10);
            if (isNaN(ordinal)) return s;
            const i18nKey = GENRE_ORDINAL_TO_I18N[ordinal];
            return i18nKey ? t(i18nKey) : s;
        });
}

function displayGenresToOrdinals(displayArr: string[]): string[] {
    return displayArr
        .map(s => {
            const trimmed = s.trim();
            if (!trimmed) return null;
            const ordinal = GENRE_DISPLAY_TO_ORDINAL[trimmed];
            if (ordinal !== undefined) return String(ordinal);
            return trimmed;
        })
        .filter((s): s is string => s !== null);
}

function splitCommaString(value: string | string[] | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

export const MetadataEditorDialog = ({opened, onClose, book, onSaved}: MetadataEditorDialogProps) => {
    const {t, i18n} = useTranslation();

    const [title, setTitle] = useState('');
    const [altTitle, setAltTitle] = useState('');
    const [japTitle, setJapTitle] = useState('');
    const [korTitle, setKorTitle] = useState('');
    const [volume, setVolume] = useState('');
    const [rating, setRating] = useState('');
    const [score, setScore] = useState('');
    const [folder, setFolder] = useState('');
    const [links, setLinks] = useState('');
    const [publisher, setPublisher] = useState('');
    const [country, setCountry] = useState('');
    const [year, setYear] = useState('');
    const [event, setEvent] = useState('');
    const [description, setDescription] = useState('');

    const [authors, setAuthors] = useState<string[]>([]);
    const [artists, setArtists] = useState<string[]>([]);
    const [translators, setTranslators] = useState<string[]>([]);
    const [genres, setGenres] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [magazines, setMagazines] = useState<string[]>([]);
    const [characters, setCharacters] = useState<string[]>([]);
    const [series, setSeries] = useState<string[]>([]);
    const [parodies, setParodies] = useState<string[]>([]);
    const [circles, setCircles] = useState<string[]>([]);

    const [contentType, setContentType] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [translationStatus, setTranslationStatus] = useState<string | null>(null);
    const [plotType, setPlotType] = useState<string | null>(null);
    const [censorship, setCensorship] = useState<string | null>(null);
    const [color, setColor] = useState<string | null>(null);

    const [ageRating, setAgeRating] = useState<'all' | 'mature' | 'adult'>('all');

    const [boundServiceLinks, setBoundServiceLinks] = useState<Record<string, string>>({});
    const [boundServiceIds, setBoundServiceIds] = useState<Record<string, string>>({});

    const [saveMode, setSaveMode] = useState<'archives' | 'external' | 'dbOnly' | 'serieOnly'>('archives');
    const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const {data: filtersData} = useQuery({
        queryKey: ['books', 'allForFilters'],
        queryFn: async () => {
            const res = await getBooks({
                page: 1,
                limit: 99999,
                presentation: 'SERIES_AND_SINGLES',
                with_volumes: false,
                with_chapters: false,
            });
            const items = (Array.isArray(res) ? res : (res as unknown as Record<string, unknown>)?.data ?? []) as IBaseBookItem[];
            return items;
        },
        staleTime: 1000 * 60 * 5,
        enabled: opened,
    });

    const filterMap = useMemo(() => {
        if (!filtersData || filtersData.length === 0) return {} as Record<string, string[]>;
        const map: Record<string, Set<string>> = {};

        const add = (tag: string, values: string | string[] | undefined | null) => {
            if (!values) return;
            const list = Array.isArray(values) ? values : [String(values)];
            for (const v of list) {
                if (v && v.trim()) {
                    if (!map[tag]) map[tag] = new Set();
                    map[tag].add(v.trim());
                }
            }
        };

        for (const b of filtersData) {
            add('authors', b.authors);
            add('artists', b.artists);
            add('publishers', b.publisher ? [b.publisher] : []);
            add('translators', b.translators);
            add('tags', b.tags);
            add('years', b.year ? [b.year] : []);
            add('countries', b.country ? [b.country] : []);
            add('languages', b.languages);
            add('events', b.event ? [b.event] : []);
            add('magazines', b.magazines);
            add('characters', b.characters);
            add('series', b.series);
            add('parodies', b.parodies);
            add('circles', b.circles);
        }

        const result: Record<string, string[]> = {};
        for (const [key, set] of Object.entries(map)) {
            result[key] = [...set].sort((a, b) => a.localeCompare(b));
        }
        return result;
    }, [filtersData]);

    const genreNames = useMemo(() => {
        return Object.keys(GENRE_ORDINAL_TO_I18N)
            .map(k => t(GENRE_ORDINAL_TO_I18N[parseInt(k)]))
            .filter(Boolean);
    }, [t]);

    const isSerie = !!book?.serie || (book?.volumes_count != null && book.volumes_count > 0) || !!book?.serie_db_id;
    const coverHash = book?.cover;

    const toggleLock = (fieldName: string) => {
        setLockedFields(prev => {
            const next = new Set(prev);
            if (next.has(fieldName)) next.delete(fieldName);
            else next.add(fieldName);
            return next;
        });
    };

    const buildSelectData = (values: string[], i18nPrefix: string) =>
        values.map(v => ({value: v, label: t(`${i18nPrefix}_${v.toLowerCase()}`)}));

    const contentTypeData = useMemo(() => buildSelectData(CONTENT_TYPES, 'content_type'), [t, i18n.language]);
    const statusData = useMemo(() => buildSelectData(STATUSES, 'status'), [t, i18n.language]);
    const translationStatusData = useMemo(() => buildSelectData(TRANSLATION_STATUSES, 'translation_status'), [t, i18n.language]);
    const plotTypeData = useMemo(() => buildSelectData(PLOT_TYPES, 'plot_type'), [t, i18n.language]);
    const censorshipData = useMemo(() => buildSelectData(CENSORSHIPS, 'censorship'), [t, i18n.language]);
    const colorData = useMemo(() => buildSelectData(COLORS, 'color'), [t, i18n.language]);

    const fillFormFromBook = useCallback(() => {
        if (!book) return;

        setTitle(book.title || '');
        setAltTitle(book.alt_title || '');
        setJapTitle(book.jap_title || '');
        setKorTitle(book.kor_title || '');
        setFolder(book.folder || '');
        setPublisher(book.publisher || '');
        setYear(book.year || '');
        setCountry(book.country || '');
        setEvent(book.event || '');
        setScore(book.score || '');
        setDescription(book.description || '');

        setAuthors(splitCommaString(book.authors));
        setArtists(splitCommaString(book.artists));
        setTranslators(splitCommaString(book.translators));
        setTags(splitCommaString(book.tags));
        setLanguages(splitCommaString(book.languages));
        setMagazines(splitCommaString(book.magazines));
        setCharacters(splitCommaString(book.characters));
        setSeries(splitCommaString(book.series));
        setParodies(splitCommaString(book.parodies));
        setCircles(splitCommaString(book.circles));

        setGenres(ordinalGenresToDisplay(book.genres, t));

        if (isSerie) {
            setVolume(book.volumes_count != null ? String(book.volumes_count) : '');
        } else {
            setVolume(book.volume != null && book.volume >= 0 ? String(book.volume) : '');
        }
        setRating(book.rating != null && book.rating >= 0 ? String(book.rating) : '');

        setContentType(book.content_type || null);
        setStatus(book.status || null);
        setTranslationStatus(book.translation_status || null);
        setPlotType(book.plot_type || null);
        setCensorship(book.censorship || null);
        setColor(book.color || null);

        if (book.is_adult) setAgeRating('adult');
        else if (book.is_mature) setAgeRating('mature');
        else setAgeRating('all');

        const rawLinks = (book as Record<string, unknown>).links || book.serie?.links || book.content_links || '';
        if (typeof rawLinks === 'string') {
            setLinks(rawLinks);
        } else if (Array.isArray(rawLinks)) {
            setLinks(rawLinks.map((l: unknown) => {
                if (typeof l === 'string') return l;
                if (typeof l === 'object' && l !== null && 'link' in l) return (l as {link: string}).link;
                return '';
            }).filter(Boolean).join('\n'));
        } else {
            setLinks('');
        }

        const rawBoundServices = ((book as Record<string, unknown>).bound_services || book.serie?.bound_services) as Record<string, unknown>[] | undefined;
        const newLinks: Record<string, string> = {};
        const newIds: Record<string, string> = {};
        if (Array.isArray(rawBoundServices)) {
            for (const bs of rawBoundServices) {
                const svc = BOUND_SERVICES.find(s => s.serviceType === bs.service_type);
                if (svc) {
                    newLinks[svc.key] = bs.link || '';
                    newIds[svc.key] = bs.id || '';
                }
            }
        }
        setBoundServiceLinks(newLinks);
        setBoundServiceIds(newIds);
    }, [book, t, isSerie]);

    useEffect(() => {
        if (opened) fillFormFromBook();
    }, [opened, fillFormFromBook]);

    const handleBoundServiceLinkChange = (key: string, value: string) => {
        setBoundServiceLinks(prev => ({...prev, [key]: value}));
        const svc = BOUND_SERVICES.find(s => s.key === key);
        if (svc?.urlPattern && value) {
            const match = value.match(svc.urlPattern);
            if (match?.[1]) {
                setBoundServiceIds(prev => {
                    if (prev[key] && prev[key] === match[1]) return prev;
                    return {...prev, [key]: match[1]};
                });
            }
        }
    };

    const handleBoundServiceIdChange = (key: string, value: string) => {
        setBoundServiceIds(prev => ({...prev, [key]: value}));
        const svc = BOUND_SERVICES.find(s => s.key === key);
        if (svc?.urlTemplate && value && !boundServiceLinks[key]) {
            const url = svc.urlTemplate(value);
            setBoundServiceLinks(prev => ({...prev, [key]: url}));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const linkLines = links.trim().split('\n').filter(Boolean).map(l => l.trim());
            const bookSerie = {
                id: book?.id,
                title: title.trim(),
                alt_title: altTitle.trim(),
                jap_title: japTitle.trim(),
                kor_title: korTitle.trim(),
                folder: folder.trim() || undefined,
                publisher: publisher.trim(),
                year: year.trim(),
                country: country.trim(),
                event: event.trim(),
                score: score.trim(),
                description: description.trim(),
                authors: authors.length > 0 ? authors : undefined as unknown as string,
                artists: artists.length > 0 ? artists : undefined as unknown as string,
                translators: translators.length > 0 ? translators : undefined as unknown as string,
                tags: tags.length > 0 ? tags : undefined as unknown as string,
                languages: languages.length > 0 ? languages : undefined as unknown as string,
                magazines: magazines.length > 0 ? magazines : undefined as unknown as string,
                characters: characters.length > 0 ? characters : undefined as unknown as string,
                series: series.length > 0 ? series : undefined as unknown as string,
                parodies: parodies.length > 0 ? parodies : undefined as unknown as string,
                circles: circles.length > 0 ? circles : undefined as unknown as string,
                genres: displayGenresToOrdinals(genres) as unknown as string,
                content_type: (contentType as BookSerie['content_type']) || 'UNKNOWN',
                status: (status as BookSerie['status']) || 'UNKNOWN',
                translation_status: (translationStatus as BookSerie['translation_status']) || 'UNKNOWN',
                plot_type: (plotType as BookSerie['plot_type']) || 'UNKNOWN',
                censorship: (censorship as BookSerie['censorship']) || 'UNKNOWN',
                color: (color as BookSerie['color']) || 'UNKNOWN',
                is_mature: ageRating === 'mature',
                is_adult: ageRating === 'adult',
                rating: rating.trim() ? parseInt(rating.trim(), 10) : 0,
                volume: !isSerie && volume.trim() ? parseFloat(volume.trim()) : undefined,
                volumes_count: isSerie && volume.trim() ? parseInt(volume.trim(), 10) : undefined,
                links: linkLines.length > 0 ? linkLines.map(l => ({link: l})) : undefined as unknown as string,
                bound_services: BOUND_SERVICES
                    .filter(s => {
                        const l = boundServiceLinks[s.key]?.trim();
                        const id = boundServiceIds[s.key]?.trim();
                        return l && id;
                    })
                    .map(s => ({
                        service_type: s.serviceType,
                        link: boundServiceLinks[s.key]?.trim() || '',
                        id: boundServiceIds[s.key]?.trim() || '',
                    })),
            } as BookSerie;

            const params = {
                serie_only: saveMode === 'serieOnly',
                into_archives: saveMode === 'archives',
                into_db_only: saveMode === 'dbOnly',
            };

            await updateMetadata(bookSerie, params);

            notifications.show({message: t('editor_saved'), color: 'green'});
            onSaved();
            onClose();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            notifications.show({message: t('editor_update_error', {message}), color: 'red'});
        } finally {
            setSaving(false);
        }
    };

    const LockButton = ({fieldName}: {fieldName: string}) => {
        if (!SHOW_LOCK_BUTTONS) return null;
        const isLocked = lockedFields.has(fieldName);
        return (
            <Tooltip label={t('editor_lock_field')}>
                <ActionIcon variant="transparent" size="sm" onClick={() => toggleLock(fieldName)}
                    style={{opacity: isLocked ? 1 : 0.15}} c={isLocked ? undefined : 'dimmed'}>
                    {isLocked ? <IconLock size={18}/> : <IconLockOpen size={18}/>}
                </ActionIcon>
            </Tooltip>
        );
    };

    const sic = {size: 20, stroke: 1.5};
    const IconSlot = ({children}: {children: React.ReactNode}) => (
        <Box w={iconW} style={{flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}} mt={6} c="dimmed">
            {children}
        </Box>
    );

    return (
        <Modal opened={opened} onClose={onClose} title={t('editor_title')} size="85vw"
            fullScreen={{base: true, sm: false}}
            styles={{content: {maxWidth: 1400}, body: {padding: 0}}}>
            <ScrollArea h={{base: 'calc(100dvh - 200px)', sm: 'calc(100vh - 150px)'}} scrollbarSize={8} type="hover">
                <Box px={{base: 'xs', sm: 'md'}} pt="sm" pb="xs" style={{overflow: 'hidden'}}>
                <Grid gutter={{base: 'sm', md: 'md'}}>
                    <Grid.Col span={{base: 12, md: 3, lg: 2}}>
                        <Stack align="center" gap="sm">
                            <Paper withBorder radius="md" w={180} h={260} style={{overflow: 'hidden'}}>
                                {coverHash ? (
                                    <SecureImage hash={coverHash} alt={title || ''} height={260} fit="cover"/>
                                ) : (
                                    <Center h={260} bg="gray.2"><IconEye size={40} color="gray" stroke={1}/></Center>
                                )}
                            </Paper>
                            <SegmentedControl
                                data={[
                                    {value: 'all', label: t('editor_all_ages')},
                                    {value: 'mature', label: t('editor_mature')},
                                    {value: 'adult', label: t('editor_adult')},
                                ]}
                                value={ageRating}
                                onChange={(v) => setAgeRating(v as typeof ageRating)}
                                size="xs"
                                fullWidth
                                styles={{
                                    indicator: {
                                        background: ageRating === 'adult' ? 'var(--mantine-color-red-6)'
                                            : ageRating === 'mature' ? 'var(--mantine-color-orange-6)'
                                            : 'var(--mantine-color-green-6)',
                                    },
                                }}
                            />
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{base: 12, md: 9, lg: 10}}>
                        <Grid gutter={{base: 'xs', md: 'md'}}>
                            <Grid.Col span={{base: 12, sm: 7}}>
                                <Stack gap="xs">
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconSubtitlesEdit {...sic}/></IconSlot>
                                        <TextInput style={{flex: 1}} label={t('editor_title_field')} value={title}
                                            onChange={e => setTitle(e.currentTarget.value)}/>
                                        {SHOW_LOCK_BUTTONS && <Box mt={24}><LockButton fieldName="Title"/></Box>}
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconEdit {...sic}/></IconSlot>
                                        <TextInput style={{flex: 1}} label={t('editor_alt_title')} value={altTitle}
                                            onChange={e => setAltTitle(e.currentTarget.value)}/>
                                        {SHOW_LOCK_BUTTONS && <Box mt={24}><LockButton fieldName="AltTitle"/></Box>}
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><Text size="sm" fw="bold">日</Text></IconSlot>
                                        <TextInput style={{flex: 1}} label={t('editor_jap_title')} value={japTitle}
                                            onChange={e => setJapTitle(e.currentTarget.value)}/>
                                        {SHOW_LOCK_BUTTONS && <Box mt={24}><LockButton fieldName="JapTitle"/></Box>}
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><Text size="sm" fw="bold">한</Text></IconSlot>
                                        <TextInput style={{flex: 1}} label={t('editor_kor_title')} value={korTitle}
                                            onChange={e => setKorTitle(e.currentTarget.value)}/>
                                        {SHOW_LOCK_BUTTONS && <Box mt={24}><LockButton fieldName="KorTitle"/></Box>}
                                    </Group>
                                    <Box h={{base: 0, sm: 60}}/>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconNumbers {...sic}/></IconSlot>
                                        <TextInput style={{flex: 1}}
                                            label={isSerie ? t('editor_volumes_count') : t('editor_volume')}
                                            value={volume} onChange={e => setVolume(e.currentTarget.value)}
                                            disabled={isSerie}/>
                                        <IconSlot><IconTrendingUp {...sic}/></IconSlot>
                                        <TextInput style={{flex: 1}} label={t('editor_rating')}
                                            value={rating} onChange={e => setRating(e.currentTarget.value)}/>
                                        <IconSlot><IconStarHalf {...sic}/></IconSlot>
                                        <TextInput style={{flex: 1}} label={t('editor_score')}
                                            value={score} onChange={e => setScore(e.currentTarget.value)}/>
                                    </Group>
                                </Stack>
                            </Grid.Col>

                            <Grid.Col span={{base: 12, sm: 5}}>
                                <Stack gap="xs">
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconBook {...sic}/></IconSlot>
                                        <Select style={{flex: 1}} label={t('editor_content_type')}
                                            data={contentTypeData} value={contentType} onChange={setContentType} searchable/>
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconPencil {...sic}/></IconSlot>
                                        <Select style={{flex: 1}} label={t('editor_status')}
                                            data={statusData} value={status} onChange={setStatus} searchable/>
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconLanguage {...sic}/></IconSlot>
                                        <Select style={{flex: 1}} label={t('editor_translation_status')}
                                            data={translationStatusData} value={translationStatus} onChange={setTranslationStatus} searchable/>
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconEdit {...sic}/></IconSlot>
                                        <Select style={{flex: 1}} label={t('editor_plot_type')}
                                            data={plotTypeData} value={plotType} onChange={setPlotType} searchable/>
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconEye {...sic}/></IconSlot>
                                        <Select style={{flex: 1}} label={t('editor_censorship')}
                                            data={censorshipData} value={censorship} onChange={setCensorship} searchable/>
                                    </Group>
                                    <Group gap={4} wrap="nowrap" align="flex-start">
                                        <IconSlot><IconWorld {...sic}/></IconSlot>
                                        <Select style={{flex: 1}} label={t('editor_color')}
                                            data={colorData} value={color} onChange={setColor} searchable/>
                                    </Group>
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    </Grid.Col>
                </Grid>

                <Stack gap="xs" mt="md">
                    <Group gap={4} wrap="nowrap" align="flex-start">
                        <IconSlot><IconFolder {...sic}/></IconSlot>
                        <TextInput style={{flex: 1}} label={t('editor_folder')} value={folder} readOnly disabled/>
                    </Group>
                    <Group gap={4} wrap="nowrap" align="flex-start">
                        <IconSlot><IconLink {...sic}/></IconSlot>
                        <Textarea style={{flex: 1}} label={t('editor_links')} description={t('editor_links_hint')}
                            value={links} onChange={e => setLinks(e.currentTarget.value)} minRows={3} maxRows={8} autosize/>
                    </Group>
                </Stack>

                <Divider mt="lg" mb="md"
                    label={<Group gap="xl"><Text size="sm" fw={600}>{t('editor_section_main_info')}</Text><Text size="sm" fw={600}>{t('editor_section_additional_info')}</Text></Group>}
                    labelPosition="center"/>

                <Grid gutter={{base: 'xs', md: 'md'}}>
                    <Grid.Col span={{base: 12, sm: 6}}>
                        <Stack gap="xs">
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconUsers {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_authors')} value={authors} onChange={setAuthors}
                                        data={(filterMap['authors'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Authors"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconPencil {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_artists')} value={artists} onChange={setArtists}
                                        data={(filterMap['artists'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Artists"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconBook {...sic}/></IconSlot>
                                <TextInput style={{flex: 1}} label={t('publisher')} value={publisher}
                                    onChange={e => setPublisher(e.currentTarget.value)}/>
                                <LockButton fieldName="Publisher"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconMapPin {...sic}/></IconSlot>
                                <TextInput style={{flex: 1}} label={t('country')} value={country}
                                    onChange={e => setCountry(e.currentTarget.value)}/>
                                <LockButton fieldName="Country"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><Text size="sm" fw="bold">#</Text></IconSlot>
                                <TextInput style={{flex: 1}} label={t('year')} value={year}
                                    onChange={e => setYear(e.currentTarget.value)}/>
                                <LockButton fieldName="Year"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconWorld {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_languages')} value={languages} onChange={setLanguages}
                                        data={(filterMap['languages'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Languages"/>
                            </Group>
                        </Stack>
                    </Grid.Col>

                    <Grid.Col span={{base: 12, sm: 6}}>
                        <Stack gap="xs">
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconLanguage {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_translators')} value={translators} onChange={setTranslators}
                                        data={(filterMap['translators'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Translators"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconFaceId {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_characters')} value={characters} onChange={setCharacters}
                                        data={(filterMap['characters'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Characters"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconSubtitlesEdit {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_series')} value={series} onChange={setSeries}
                                        data={(filterMap['series'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Series"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconBalloon {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_parodies')} value={parodies} onChange={setParodies}
                                        data={(filterMap['parodies'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Parodies"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconCalendarHeart {...sic}/></IconSlot>
                                <TextInput style={{flex: 1}} label={t('editor_event')} value={event}
                                    onChange={e => setEvent(e.currentTarget.value)}/>
                                <LockButton fieldName="Event"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconBook {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_magazines')} value={magazines} onChange={setMagazines}
                                        data={(filterMap['magazines'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Magazines"/>
                            </Group>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot><IconCircleCheck {...sic}/></IconSlot>
                                <Box style={{flex: 1}}>
                                    <TagsInput label={t('editor_circles')} value={circles} onChange={setCircles}
                                        data={(filterMap['circles'] || []).map(v => ({value: v, label: v}))} clearable/>
                                </Box>
                                <LockButton fieldName="Circles"/>
                            </Group>
                        </Stack>
                    </Grid.Col>
                </Grid>

                <Group gap={4} wrap="nowrap" align="flex-start" mt="md">
                    <IconSlot><IconMasksTheater {...sic}/></IconSlot>
                    <Box style={{flex: 1}}>
                        <TagsInput label={t('editor_genres')} value={genres} onChange={setGenres}
                            data={genreNames.map(v => ({value: v, label: v}))} clearable/>
                    </Box>
                    <LockButton fieldName="GenresFull"/>
                </Group>
                <Group gap={4} wrap="nowrap" align="flex-start" mt="xs">
                    <IconSlot><IconTag {...sic}/></IconSlot>
                    <Box style={{flex: 1}}>
                        <TagsInput label={t('editor_tags')} value={tags} onChange={setTags}
                            data={(filterMap['tags'] || []).map(v => ({value: v, label: v}))} clearable/>
                    </Box>
                    <LockButton fieldName="TagsFull"/>
                </Group>

                <Group gap={4} wrap="nowrap" align="flex-start" mt="md">
                    <IconSlot><IconFileDescription {...sic}/></IconSlot>
                    <Textarea style={{flex: 1}} label={t('editor_description')}
                        value={description} onChange={e => setDescription(e.currentTarget.value)} minRows={6} maxRows={16} autosize/>
                    <LockButton fieldName="Description"/>
                </Group>

                <Divider mt="xl" mb="sm"
                    label={<Text size="sm" fw={600}>{t('editor_section_bound_services')}</Text>} labelPosition="center"/>

                <Grid gutter="xs">
                    <Grid.Col span={8}>
                        <Group gap={4} wrap="nowrap">
                            <IconSlot><IconLink {...sic}/></IconSlot>
                            <Text size="xs" fw={600} c="dimmed">{t('editor_links')}</Text>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <Group gap={4} wrap="nowrap">
                            <IconSlot><Text size="xs" fw="bold">#</Text></IconSlot>
                            <Text size="xs" fw={600} c="dimmed">ID</Text>
                        </Group>
                    </Grid.Col>
                </Grid>

                {BOUND_SERVICES.map((svc) => (
                    <Grid key={svc.key} gutter="xs" mb={4}>
                        <Grid.Col span={8}>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot/>
                                <TextInput style={{flex: 1}} placeholder={svc.label} value={boundServiceLinks[svc.key] || ''}
                                    onChange={e => handleBoundServiceLinkChange(svc.key, e.currentTarget.value)} size="sm"/>
                            </Group>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Group gap={4} wrap="nowrap" align="flex-start">
                                <IconSlot/>
                                <TextInput style={{flex: 1}} placeholder="ID" value={boundServiceIds[svc.key] || ''}
                                    onChange={e => handleBoundServiceIdChange(svc.key, e.currentTarget.value)} size="sm"/>
                            </Group>
                        </Grid.Col>
                    </Grid>
                ))}
                </Box>
            </ScrollArea>

            <Stack gap="xs" py="xs" px={{base: 'xs', sm: 'md'}}
                style={{borderTop: '1px solid var(--mantine-color-default-border)'}}>
                <ScrollArea type="never" style={{flex: 1, minWidth: 0}} hiddenFrom="sm">
                    <SegmentedControl
                        data={[
                            {value: 'archives', label: t('editor_save_linked_archives')},
                            {value: 'external', label: t('editor_save_external')},
                            {value: 'dbOnly', label: t('editor_save_db_only')},
                            {value: 'serieOnly', label: t('editor_save_serie_only')},
                        ]}
                        value={saveMode}
                        onChange={(v) => setSaveMode(v as typeof saveMode)}
                        size="xs"
                    />
                </ScrollArea>
                <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                    <ScrollArea type="never" style={{flex: 1, minWidth: 0}} visibleFrom="sm">
                        <SegmentedControl
                            data={[
                                {value: 'archives', label: t('editor_save_linked_archives')},
                                {value: 'external', label: t('editor_save_external')},
                                {value: 'dbOnly', label: t('editor_save_db_only')},
                                {value: 'serieOnly', label: t('editor_save_serie_only')},
                            ]}
                            value={saveMode}
                            onChange={(v) => setSaveMode(v as typeof saveMode)}
                            size="xs"
                        />
                    </ScrollArea>
                    <Group gap="sm" wrap="nowrap">
                        <Button variant="default" onClick={onClose} disabled={saving}>{t('cancel')}</Button>
                        <Button onClick={handleSave} loading={saving} leftSection={<IconDeviceFloppy size={16}/>}>{t('save')}</Button>
                    </Group>
                </Group>
            </Stack>
        </Modal>
    );
};
