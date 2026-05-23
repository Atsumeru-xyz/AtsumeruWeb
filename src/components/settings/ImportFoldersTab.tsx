import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Center,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    Title,
    Tooltip,
    Switch,
    SimpleGrid,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {
    IconTrash,
    IconPlus,
    IconFolder,
    IconSearch,
    IconRefresh,
    IconArrowLeft,
    IconFile,
    IconFileStack,
    IconFolderRoot,
    IconNumber123,
} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {
    listFolders,
    addFolder,
    removeFolder,
    rescan1,
    scan as importerScan
} from '../../api/generated/importer/importer';
import {getDirectoryListing} from '../../api/generated/filesystem/filesystem';
import type {ImportFolder} from '../../api/model';
import {useTranslation} from 'react-i18next';
import {I18N} from '../I18N';

interface FolderItem {
    hash: string;
    path: string;
    series_count: number;
    singles_count: number;
    archives_count: number;
    chapters_count: number;
    singles?: boolean;
    singlesInRoot?: boolean;
    singlesIfInRootWithFolders?: boolean;
    ignoreVolumeNumbersDetection?: boolean;
}

export const ImportFoldersTab = () => {
    const {t} = useTranslation();

    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFolders = () => {
        setLoading(true);
        setError(null);
        listFolders().then((response: unknown) => {
            const data: any = response;
            const list = Array.isArray(data) ? data : (data.data || []);
            setFolders(list);
            setLoading(false);
        }).catch((e) => {
            setError(String(e.message || e));
            setLoading(false);
        });
    };

    useEffect(() => { fetchFolders(); }, []);

    const [addMode, {open: openAdd, close: closeAdd}] = useDisclosure(false);
    const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null);
    const [rescanTarget, setRescanTarget] = useState<FolderItem | null>(null);

    const [importOptions, setImportOptions] = useState({
        singles: false,
        singlesInRoot: false,
        singlesIfInRootWithFolders: false,
        ignoreVolumeNumbersDetection: false,
    });
    const [step, setStep] = useState<'options' | 'explorer'>('options');

    const openAddDialog = () => {
        setImportOptions({
            singles: false,
            singlesInRoot: false,
            singlesIfInRootWithFolders: false,
            ignoreVolumeNumbersDetection: false,
        });
        setStep('options');
        openAdd();
    };

    const handleFolderSelected = (path: string) => {
        const props: ImportFolder = {
            path,
            singles: importOptions.singles,
            singlesInRoot: importOptions.singlesInRoot,
            singlesIfInRootWithFolders: importOptions.singlesIfInRootWithFolders,
            ignoreVolumeNumbersDetection: importOptions.ignoreVolumeNumbersDetection,
            series_count: 0,
            singles_count: 0,
            archives_count: 0,
            chapters_count: 0,
        };
        addFolder(props).then(() => {
            notifications.show({message: t('settings_folder_added'), color: 'green'});
            fetchFolders();
            closeAdd();
        }).catch((e) => {
            notifications.show({message: String(e.message || e) || t('settings_folder_already_exists'), color: 'red'});
        });
    };

    const handleScanNew = () => {
        importerScan().then(() => {
            notifications.show({message: t('settings_scan_started'), color: 'green'});
        }).catch(() => {
            notifications.show({message: t('settings_scan_error'), color: 'red'});
        });
    };

    const handleRescanFolder = (hash: string, fully: boolean, updateCovers: boolean) => {
        rescan1(hash, {fully, update_covers: updateCovers}).then(() => {
            notifications.show({
                message: t(fully ? 'settings_reimporting_started' : 'settings_importing_started'),
                color: 'green',
            });
        }).catch(() => {
            notifications.show({
                message: t(fully ? 'settings_reimporting_error' : 'settings_importing_error'),
                color: 'red',
            });
        });
    };

    const handleDeleteFolder = (hash: string) => {
        removeFolder(hash).then(() => {
            notifications.show({message: t('settings_folder_deleted'), color: 'green'});
            setDeleteTarget(null);
            fetchFolders();
        }).catch(() => {
            notifications.show({message: t('settings_folder_delete_error'), color: 'red'});
        });
    };

    const countStr = (n: number) => n >= 0 ? String(n) : '?';

    if (loading) return <Center h={200}><Loader/></Center>;
    if (error) return <Alert color="red" title={t('error')}>{error}</Alert>;

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={3}><I18N>settings_import_folders</I18N></Title>
                <Group>
                    <Button variant="light" leftSection={<IconSearch size={16}/>} onClick={handleScanNew}>
                        <I18N>settings_scan_for_new</I18N>
                    </Button>
                    <Button leftSection={<IconPlus size={16}/>} onClick={openAddDialog}>
                        <I18N>settings_add_folder</I18N>
                    </Button>
                </Group>
            </Group>

            {folders.length === 0 && (
                <Alert color="gray"><I18N>settings_no_folders</I18N></Alert>
            )}

            {folders.map((folder) => (
                <Card key={folder.hash} withBorder padding="md" radius="md">
                    <Group justify="space-between" wrap="nowrap">
                        <Stack gap={2} style={{flex: 1, minWidth: 0}}>
                            <Group gap="xs" wrap="nowrap">
                                <IconFolder size={16} style={{flexShrink: 0}}/>
                                <Text size="sm" fw={500} style={{wordBreak: 'break-all'}}>{folder.path}</Text>
                            </Group>
                            <Group gap="xs">
                                <Badge size="xs" variant="light" color="blue">
                                    {t('settings_series_count', {val: countStr(folder.series_count)})}
                                </Badge>
                                <Badge size="xs" variant="light" color="cyan">
                                    {t('settings_singles_count', {val: countStr(folder.singles_count)})}
                                </Badge>
                                <Badge size="xs" variant="light" color="grape">
                                    {t('settings_archives_count', {val: countStr(folder.archives_count)})}
                                </Badge>
                                {folder.chapters_count >= 0 && (
                                    <Badge size="xs" variant="light" color="teal">
                                        {t('settings_chapters_count', {val: countStr(folder.chapters_count)})}
                                    </Badge>
                                )}
                                {folder.singles && (
                                    <Tooltip label={t('settings_import_as_singles')}>
                                        <Badge size="xs" variant="outline" leftSection={<IconFile size={12}/>} style={{textTransform: 'none'}}>
                                            {t('settings_singles_short')}
                                        </Badge>
                                    </Tooltip>
                                )}
                                {folder.singlesInRoot && (
                                    <Tooltip label={t('settings_import_singles_only_from_root')}>
                                        <Badge size="xs" variant="outline" leftSection={<IconFolderRoot size={12}/>} style={{textTransform: 'none'}}>
                                            {t('settings_singles_root_short')}
                                        </Badge>
                                    </Tooltip>
                                )}
                                {folder.singlesIfInRootWithFolders && (
                                    <Tooltip label={t('settings_import_singles_if_in_root_with_folders')}>
                                        <Badge size="xs" variant="outline" leftSection={<IconFileStack size={12}/>} style={{textTransform: 'none'}}>
                                            {t('settings_singles_mixed_short')}
                                        </Badge>
                                    </Tooltip>
                                )}
                                {folder.ignoreVolumeNumbersDetection && (
                                    <Tooltip label={t('settings_ignore_volume_numbers_detection')}>
                                        <Badge size="xs" variant="outline" leftSection={<IconNumber123 size={12}/>} style={{textTransform: 'none'}}>
                                            {t('settings_no_vol_numbers_short')}
                                        </Badge>
                                    </Tooltip>
                                )}
                            </Group>
                        </Stack>
                        <Group gap="xs" wrap="nowrap">
                            <Tooltip label={t('settings_scan_new_in_folder')}>
                                <ActionIcon variant="subtle" color="blue"
                                            onClick={() => handleRescanFolder(folder.hash, false, false)}>
                                    <IconSearch size={18}/>
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label={t('settings_rescan_folder')}>
                                <ActionIcon variant="subtle" color="orange"
                                            onClick={() => setRescanTarget(folder)}>
                                    <IconRefresh size={18}/>
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label={t('settings_delete_folder')}>
                                <ActionIcon variant="subtle" color="red"
                                            onClick={() => setDeleteTarget(folder)}>
                                    <IconTrash size={18}/>
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    </Group>
                </Card>
            ))}

            <Modal
                opened={addMode}
                onClose={closeAdd}
                title={<I18N>settings_add_import_folder</I18N>}
                size="lg"
            >
                {step === 'options' ? (
                    <Stack>
                        <Switch
                            label={<I18N>settings_import_as_singles</I18N>}
                            description={<I18N>settings_import_as_singles_hint</I18N>}
                            checked={importOptions.singles}
                            onChange={(e) => setImportOptions({...importOptions, singles: e.currentTarget.checked})}
                        />
                        <Switch
                            label={<I18N>settings_import_singles_only_from_root</I18N>}
                            description={<I18N>settings_import_singles_only_from_root_hint</I18N>}
                            checked={importOptions.singlesInRoot}
                            onChange={(e) => setImportOptions({...importOptions, singlesInRoot: e.currentTarget.checked})}
                        />
                        <Switch
                            label={<I18N>settings_import_singles_if_in_root_with_folders</I18N>}
                            description={<I18N>settings_import_singles_if_in_root_with_folders_hint</I18N>}
                            checked={importOptions.singlesIfInRootWithFolders}
                            onChange={(e) => setImportOptions({...importOptions, singlesIfInRootWithFolders: e.currentTarget.checked})}
                        />
                        <Switch
                            label={<I18N>settings_ignore_volume_numbers_detection</I18N>}
                            description={<I18N>settings_ignore_volume_numbers_detection_hint</I18N>}
                            checked={importOptions.ignoreVolumeNumbersDetection}
                            onChange={(e) => setImportOptions({...importOptions, ignoreVolumeNumbersDetection: e.currentTarget.checked})}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeAdd}><I18N>cancel</I18N></Button>
                            <Button onClick={() => setStep('explorer')}><I18N>settings_select_folder</I18N></Button>
                        </Group>
                    </Stack>
                ) : (
                    <FolderExplorerModal
                        onSelect={handleFolderSelected}
                        onClose={closeAdd}
                        onBack={() => setStep('options')}
                    />
                )}
            </Modal>

            <Modal
                opened={rescanTarget !== null}
                onClose={() => setRescanTarget(null)}
                title={<I18N>settings_rescan_folder</I18N>}
            >
                {rescanTarget && (
                    <Stack>
                        <Text size="sm" c="dimmed" style={{wordBreak: 'break-all'}}>{rescanTarget.path}</Text>
                        <SimpleGrid cols={2}>
                            <Button
                                variant="light"
                                fullWidth
                                onClick={() => {
                                    handleRescanFolder(rescanTarget.hash, true, true);
                                    setRescanTarget(null);
                                }}
                            >
                                <I18N>settings_rescan_with_covers</I18N>
                            </Button>
                            <Button
                                variant="light"
                                fullWidth
                                onClick={() => {
                                    handleRescanFolder(rescanTarget.hash, true, false);
                                    setRescanTarget(null);
                                }}
                            >
                                <I18N>settings_rescan_normal</I18N>
                            </Button>
                        </SimpleGrid>
                    </Stack>
                )}
            </Modal>

            <Modal
                opened={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title={<I18N>settings_delete_folder</I18N>}
            >
                {deleteTarget && (
                    <Stack>
                        <Text><I18N values={{path: deleteTarget.path}}>settings_delete_folder_confirm</I18N></Text>
                        <Text size="sm" c="dimmed">
                            <I18N values={{
                                series: countStr(deleteTarget.series_count),
                                singles: countStr(deleteTarget.singles_count),
                                archives: countStr(deleteTarget.archives_count),
                                chapters: countStr(deleteTarget.chapters_count),
                            }}>settings_delete_folder_stats</I18N>
                        </Text>
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setDeleteTarget(null)}>
                                <I18N>cancel</I18N>
                            </Button>
                            <Button color="red" onClick={() => handleDeleteFolder(deleteTarget.hash)}>
                                <I18N>delete</I18N>
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};

interface FolderExplorerModalProps {
    onSelect: (path: string) => void;
    onClose: () => void;
    onBack: () => void;
}

interface DirectoryItem {
    type: string;
    name: string;
    path: string;
}

const FolderExplorerModal = ({onSelect, onClose, onBack}: FolderExplorerModalProps) => {
    const {t} = useTranslation();
    const [currentPath, setCurrentPath] = useState('');
    const [parentPath, setParentPath] = useState<string | null>(null);
    const [directories, setDirectories] = useState<DirectoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDirectory = (path: string) => {
        setLoading(true);
        setError(null);
        getDirectoryListing({path} as any).then((response: unknown) => {
            const data: any = response;
            const listing = (data as any).data || data;
            setCurrentPath(path);
            setParentPath(listing.parent || null);
            setDirectories(listing.directories || []);
            setLoading(false);
        }).catch((e) => {
            setError(String(e.message || e));
            setLoading(false);
        });
    };

    useEffect(() => {
        loadDirectory('');
    }, []);

    return (
        <Stack>
            <Group gap="xs">
                <Button variant="subtle" size="sm" onClick={onBack}>
                    <I18N>back</I18N>
                </Button>
                {parentPath !== null && (
                    <Button
                        variant="subtle"
                        leftSection={<IconArrowLeft size={16}/>}
                        onClick={() => loadDirectory(parentPath)}
                        size="sm"
                    >
                        <I18N>back_ellipsize</I18N>
                    </Button>
                )}
                {currentPath.length > 0 && (
                    <Text size="sm" c="dimmed" style={{wordBreak: 'break-all'}}>{currentPath}</Text>
                )}
            </Group>

            {loading && <Center h={200}><Loader/></Center>}
            {error && <Alert color="red">{error}</Alert>}

            {!loading && !error && (
                <Stack gap={2}>
                    {directories.length === 0 && (
                        <Text c="dimmed" ta="center" py="md"><I18N>settings_empty_directory</I18N></Text>
                    )}
                    {directories.map((dir) => (
                        <Button
                            key={dir.path}
                            variant="subtle"
                            fullWidth
                            justify="flex-start"
                            leftSection={<IconFolder size={18}/>}
                            onClick={() => loadDirectory(dir.path)}
                            styles={{root: {textAlign: 'left'}}}
                        >
                            <Text size="sm" truncate="end">{dir.name}</Text>
                        </Button>
                    ))}
                </Stack>
            )}

            <Group justify="space-between" mt="md">
                <Text size="sm" c="dimmed"><I18N>settings_select_current_folder</I18N></Text>
                <Group>
                    <Button variant="default" onClick={onClose}><I18N>cancel</I18N></Button>
                    <Button onClick={() => onSelect(currentPath)} disabled={currentPath.length === 0}>
                        <I18N>settings_select_folder</I18N>
                    </Button>
                </Group>
            </Group>
        </Stack>
    );
};
