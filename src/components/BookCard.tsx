import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {AspectRatio, Badge, Box, Button, Card, Checkbox, Group, Modal, Overlay, Paper, Progress, Stack, Text} from '@mantine/core';
import {
    IconCheck, IconFlame, IconHeart,
    IconCopy, IconEdit, IconTag, IconTrash, IconFolder,
    IconSelect, IconShare,
} from '@tabler/icons-react';
import type {IBaseBookItem} from '../api/model';
import {SecureImage} from './SecureImage';
import {useNavigate} from 'react-router-dom';
import {BOOK_STATUS_CONFIG, type BookStatus} from '../config/book-status-config';
import {I18N} from './I18N';
import {useSelectionStore} from '../store/selectionStore';
import {useAuthStore} from '../store/authStore';
import {notifications} from '@mantine/notifications';
import {deleteArchive} from '../api/generated/books/books';
import {useTranslation} from 'react-i18next';

interface BookCardProps {
    book: IBaseBookItem;
    height?: number;
    onEdit?: (book: IBaseBookItem) => void;
    onChangeCategory?: (book: IBaseBookItem) => void;
    onShare?: (book: IBaseBookItem) => void;
    onDeleted?: () => void;
}

export const BookCard = ({book, onEdit, onChangeCategory, onShare, onDeleted}: BookCardProps) => {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const isAdmin = useAuthStore((s) => s.isAdmin());
    const authorities = useAuthStore((s) => s.user?.authorities || []);
    const canEdit = isAdmin || authorities.some(a => a.toUpperCase() === 'METADATA_UPDATER');
    const inSelection = useSelectionStore((s) => s.selected.size > 0);
    const isSelected = useSelectionStore((s) => s.isSelected(book.id || ''));
    const toggleSelect = useSelectionStore((s) => s.toggle);
    const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggered = useRef(false);
    const [menuOpened, setMenuOpened] = useState(false);
    const menuOpenedRef = useRef(false);
    const [menuPos, setMenuPos] = useState({x: 0, y: 0});
    const [adjustedPos, setAdjustedPos] = useState({x: 0, y: 0});
    const menuPaperRef = useRef<HTMLDivElement>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    useEffect(() => { menuOpenedRef.current = menuOpened; }, [menuOpened]);

    useLayoutEffect(() => {
        if (menuOpened && menuPaperRef.current) {
            const rect = menuPaperRef.current.getBoundingClientRect();
            const padding = 8;
            let x = menuPos.x;
            let y = menuPos.y;

            if (x + rect.width > window.innerWidth - padding) {
                x = Math.max(padding, window.innerWidth - rect.width - padding);
            }
            if (y + rect.height > window.innerHeight - padding) {
                y = Math.max(padding, window.innerHeight - rect.height - padding);
            }

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAdjustedPos({x, y});
        }
    }, [menuOpened, menuPos]);

    const config = BOOK_STATUS_CONFIG[book.status as BookStatus] || BOOK_STATUS_CONFIG.UNKNOWN;
    const Icon = config.icon;

    const totalReadPages = book.volumes?.reduce((sum, volume) => sum + (volume.history?.current_page ?? 0), 0) ?? 0;
    const totalVolumesPages = book.volumes?.reduce((sum, volume) => sum + (volume?.pages_count ?? 0), 0) ?? 0;
    const progress = totalVolumesPages > 0 ? (totalReadPages / totalVolumesPages) * 100 : 0;
    const isCompleted = totalVolumesPages > 0 && progress >= 100;

    const handleCardClick = () => {
        if (longPressTriggered.current) { longPressTriggered.current = false; return; }
        if (inSelection) { toggleSelect(book.id || ''); }
        else { navigate(`/book/${book.id}`); }
    };

    const closeMenu = useCallback(() => { setMenuOpened(false); }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inSelection) return;
        if (menuOpenedRef.current) { closeMenu(); return; }
        setMenuPos({x: e.clientX, y: e.clientY});
        setMenuOpened(true);
    }, [inSelection, closeMenu]);

    const handleCopyId = () => {
        navigator.clipboard.writeText(book.id || '').then(() => {
            notifications.show({message: t('context_copied'), color: 'green'});
        });
    };

    const handleCopyPath = () => {
        const folder = (book as any).folder;
        if (folder) {
            navigator.clipboard.writeText(folder).then(() => {
                notifications.show({message: t('context_copied'), color: 'green'});
            });
        }
    };

    const handleDelete = () => {
        if (!book.id) return;
        deleteArchive(book.id).then(() => {
            notifications.show({message: t('context_content_removed'), color: 'green'});
            onDeleted?.();
        }).catch(() => {
            notifications.show({message: t('context_error_remove'), color: 'red'});
        });
        setDeleteOpen(false);
    };

    const onPointerDown = (e: React.PointerEvent) => {
        longPressTriggered.current = false;
        longPressRef.current = setTimeout(() => {
            longPressTriggered.current = true;
            if (!inSelection) {
                setMenuPos({x: e.clientX, y: e.clientY});
                setMenuOpened(true);
            }
        }, 500);
    };

    const onPointerUp = () => {
        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    };

    const handleMenuAction = (action: () => void) => {
        closeMenu();
        action();
    };

    const showFolder = !!(book as any).folder;

    return (
        <>
            <Box style={{position: 'relative'}}>
                <Card
                    shadow="sm" padding={0} radius="md" withBorder
                    style={{cursor: 'pointer', height: '100%', transition: 'transform 0.2s', position: 'relative'}}
                    onClick={handleCardClick} onContextMenu={handleContextMenu}
                    onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
                    className="book-card-hover"
                >
                    {inSelection && (
                        <Checkbox checked={isSelected} onChange={() => toggleSelect(book.id || '')}
                                  style={{position: 'absolute', top: 6, left: 6, zIndex: 10}}
                                  onClick={(e) => e.stopPropagation()}/>
                    )}
                    <Card.Section>
                        <AspectRatio ratio={2 / 3}>
                            <Box pos="relative" w="100%" h="100%">
                                {book.cover ? (
                                    <SecureImage hash={book.cover} alt={book.title || ''} height="100%"/>
                                ) : (
                                    <Box bg="gray.8" w="100%" h="100%" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text c="dimmed" size="xs"><I18N>no_cover</I18N></Text>
                                    </Box>
                                )}
                                {isCompleted && (
                                    <Overlay color="#000" backgroundOpacity={0.65} zIndex={5} blur={2}>
                                        <Stack align="center" justify="center" h="100%" gap={4}><IconCheck size={60} color="white" stroke={3}/></Stack>
                                    </Overlay>
                                )}
                                {isSelected && (
                                    <Overlay color="var(--mantine-primary-color-filled)" backgroundOpacity={0.3} zIndex={5}/>
                                )}
                            </Box>
                        </AspectRatio>
                    </Card.Section>
                    <Box p="xs">
                        <Text fw={600} lineClamp={1} size="md" title={book.title}>{book.title}</Text>
                        <Text fw={600} lineClamp={1} size="xs" title={book.alt_title}>{book.alt_title}</Text>
                        <Group gap={4} style={{position: 'absolute', top: 6, right: 6, zIndex: 10}}>
                            {book.is_mature && (
                                <Badge color="#d35400" variant="filled" size="sm" px={6} style={{boxShadow: '0 3px 4px rgba(0,0,0,0.5)'}} leftSection={<IconHeart size={14}/>}>16+</Badge>
                            )}
                            {book.is_adult && (
                                <Badge color="#c0392b" variant="filled" size="sm" px={6} style={{boxShadow: '0 3px 4px rgba(0,0,0,0.5)'}} leftSection={<IconFlame size={14}/>}>18+</Badge>
                            )}
                        </Group>
                        <Group gap={6} mt={4}>
                            <Badge leftSection={<Icon size={14} stroke={2}/>} color={config.color} variant="light" tt="none" size="md">{config.label}</Badge>
                        </Group>
                        <Group gap="xs" align="center" mt={6}>
                            <Progress value={progress} size="xs" style={{flex: 1}}/>
                            <Text size="xs" c="dimmed">{progress.toFixed(1)}%</Text>
                        </Group>
                    </Box>
                </Card>

                {menuOpened && (
                    <Box style={{position: 'fixed', inset: 0, zIndex: 299}} onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }}/>
                )}

                {menuOpened && (
                    <Paper ref={menuPaperRef} shadow="md" withBorder style={{position: 'fixed', left: adjustedPos.x, top: adjustedPos.y, zIndex: 300, minWidth: 200}}>
                        <Stack gap={0}>
                            <MenuItem icon={<IconTag size={14}/>} onClick={() => handleMenuAction(() => onChangeCategory?.(book))}>
                                <I18N>context_change_category</I18N>
                            </MenuItem>
                            {canEdit && (
                                <MenuItem icon={<IconEdit size={14}/>} onClick={() => handleMenuAction(() => onEdit?.(book))}>
                                    <I18N>context_edit</I18N>
                                </MenuItem>
                            )}
                            {isAdmin && (
                                <MenuItem icon={<IconShare size={14}/>} onClick={() => handleMenuAction(() => onShare?.(book))}>
                                    <I18N>share_context</I18N>
                                </MenuItem>
                            )}
                            <MenuItem icon={<IconSelect size={14}/>} onClick={() => handleMenuAction(() => toggleSelect(book.id || ''))}>
                                <I18N>context_select</I18N>
                            </MenuItem>
                            <Box px="md" py={4}><Box style={{borderTop: '1px solid var(--mantine-color-default-border)'}}/></Box>
                            <MenuItem icon={<IconCopy size={14}/>} onClick={() => handleMenuAction(handleCopyId)}>
                                <I18N>context_copy_id</I18N>
                            </MenuItem>
                            {showFolder && (
                                <MenuItem icon={<IconFolder size={14}/>} onClick={() => handleMenuAction(handleCopyPath)}>
                                    <I18N>context_copy_path</I18N>
                                </MenuItem>
                            )}
                            {isAdmin && (
                                <>
                                    <Box px="md" py={4}><Box style={{borderTop: '1px solid var(--mantine-color-default-border)'}}/></Box>
                                    <MenuItem icon={<IconTrash size={14}/>} color="red" onClick={() => handleMenuAction(() => setDeleteOpen(true))}>
                                        <I18N>context_remove</I18N>
                                    </MenuItem>
                                </>
                            )}
                        </Stack>
                    </Paper>
                )}
            </Box>

            <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title={<I18N>context_remove</I18N>}>
                <Stack>
                    <Text size="sm"><I18N values={{title: book.title || ''}}>context_delete_confirm</I18N></Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setDeleteOpen(false)}><I18N>cancel</I18N></Button>
                        <Button color="red" onClick={handleDelete}><I18N>delete</I18N></Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
};

function MenuItem({icon, onClick, color, children}: {icon: React.ReactNode; onClick: () => void; color?: string; children: React.ReactNode}) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '8px 16px',
                color: color || 'light-dark(var(--mantine-color-black), var(--mantine-color-dark-0))',
                background: hovered ? 'var(--mantine-color-default-hover)' : 'transparent',
                border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', borderRadius: 0,
            }}
        >
            {icon}
            {children}
        </button>
    );
}
