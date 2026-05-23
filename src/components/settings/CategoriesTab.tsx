import {useEffect, useRef, useState} from 'react';
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
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {IconEdit, IconTrash, IconPlus, IconGripVertical} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {
    getCategoryList,
    createCategory as apiCreateCategory,
    editCategory as apiEditCategory,
    deleteCategory as apiDeleteCategory,
    orderCategories as apiOrderCategories
} from '../../api/generated/categories/categories';
import type {Category} from '../../api/model';
import {useTranslation} from 'react-i18next';
import {I18N} from '../I18N';

export const CategoriesTab = () => {
    const {t} = useTranslation();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [reordering, setReordering] = useState(false);

    const fetchCategories = () => {
        setLoading(true);
        setError(null);
        getCategoryList().then((response: unknown) => {
            const data: any = response;
            const list: Category[] = Array.isArray(data) ? data : (data.data || []);
            if (Array.isArray(list)) {
                list.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
            setCategories(list);
            setLoading(false);
        }).catch((e) => {
            setError(String(e.message || e));
            setLoading(false);
        });
    };

    useEffect(() => { fetchCategories(); }, []);

    const [editTarget, setEditTarget] = useState<Category | null>(null);
    const [createMode, {open: openCreate, close: closeCreate}] = useDisclosure(false);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    const existingNames = categories.map(c => c.name?.toLowerCase()).filter(Boolean) as string[];

    const handleCreated = (name: string) => {
        apiCreateCategory({name}).then(() => {
            notifications.show({message: t('settings_category_created'), color: 'green'});
            fetchCategories();
            closeCreate();
        }).catch((e) => {
            notifications.show({message: String(e.message || e) || t('settings_error_create_category'), color: 'red'});
        });
    };

    const handleEdited = (id: string, name: string) => {
        apiEditCategory({id, name}).then(() => {
            notifications.show({message: t('settings_category_updated'), color: 'green'});
            fetchCategories();
            setEditTarget(null);
        }).catch((e) => {
            notifications.show({message: String(e.message || e) || t('settings_error_edit_category'), color: 'red'});
        });
    };

    const handleDelete = (id: string) => {
        apiDeleteCategory({id}).then(() => {
            notifications.show({message: t('settings_category_deleted'), color: 'green'});
            fetchCategories();
            setDeleteTarget(null);
        }).catch((e) => {
            notifications.show({message: String(e.message || e) || t('settings_error_delete_category'), color: 'red'});
        });
    };

    const handleDragStart = (index: number) => {
        setDragIdx(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIdx === null || dragIdx === index) return;
        const reordered = [...categories];
        const [item] = reordered.splice(dragIdx, 1);
        reordered.splice(index, 0, item);
        setCategories(reordered);
        setDragIdx(index);
    };

    const handleDragEnd = () => {
        if (dragIdx === null) return;
        setDragIdx(null);
        const ordered = categories.map((cat, idx) => ({...cat, order: idx}));
        setReordering(true);
        apiOrderCategories(ordered as Category[]).then(() => {
            notifications.show({message: t('settings_category_order_updated'), color: 'green'});
            setReordering(false);
        }).catch((e) => {
            notifications.show({message: t('settings_error_order_categories'), color: 'red'});
            setReordering(false);
            fetchCategories();
        });
    };

    if (loading) return <Center h={200}><Loader/></Center>;
    if (error) return <Alert color="red" title={t('error')}>{error}</Alert>;

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={3}><I18N>settings_categories_editor</I18N></Title>
                <Button leftSection={<IconPlus size={16}/>} onClick={openCreate} loading={reordering}>
                    <I18N>settings_create_category</I18N>
                </Button>
            </Group>

            {categories.length === 0 && (
                <Alert color="gray"><I18N>settings_no_categories</I18N></Alert>
            )}

            <Stack gap={4}>
                {categories.map((cat, idx) => {
                    const isAuto = !!(cat.content_type);
                    return (
                        <Card
                            key={cat.id}
                            withBorder
                            padding="sm"
                            radius="md"
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            style={{
                                cursor: dragIdx === idx ? 'grabbing' : 'default',
                                opacity: dragIdx === idx ? 0.5 : 1,
                            }}
                        >
                            <Group justify="space-between" wrap="nowrap">
                                <Group gap="xs" wrap="nowrap" style={{flex: 1, minWidth: 0}}>
                                    <div
                                        style={{cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0}}
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <IconGripVertical size={16} style={{opacity: 0.4}}/>
                                    </div>
                                    <Text fw={500} truncate="end">{cat.name}</Text>
                                    {isAuto && (
                                        <Badge size="xs" variant="light" color="gray">
                                            <I18N>settings_auto_category</I18N>
                                        </Badge>
                                    )}
                                </Group>
                                <Group gap="xs" wrap="nowrap">
                                    {!isAuto && (
                                        <>
                                            <Tooltip label={t('settings_edit_category')}>
                                                <ActionIcon variant="subtle" color="blue" onClick={() => setEditTarget(cat)}>
                                                    <IconEdit size={18}/>
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={t('settings_delete_category')}>
                                                <ActionIcon variant="subtle" color="red" onClick={() => setDeleteTarget(cat)}>
                                                    <IconTrash size={18}/>
                                                </ActionIcon>
                                            </Tooltip>
                                        </>
                                    )}
                                </Group>
                            </Group>
                        </Card>
                    );
                })}
            </Stack>

            <Modal
                opened={createMode}
                onClose={closeCreate}
                title={<I18N>settings_create_category</I18N>}
            >
                <CategoryEditForm
                    initialName=""
                    existingNames={existingNames}
                    onSave={handleCreated}
                    onCancel={closeCreate}
                />
            </Modal>

            <Modal
                opened={editTarget !== null}
                onClose={() => setEditTarget(null)}
                title={<I18N>settings_edit_category</I18N>}
            >
                {editTarget && (
                    <CategoryEditForm
                        initialName={editTarget.name || ''}
                        existingNames={existingNames.filter(n => n !== editTarget.name?.toLowerCase())}
                        onSave={(name) => handleEdited(editTarget.id!, name)}
                        onCancel={() => setEditTarget(null)}
                    />
                )}
            </Modal>

            <Modal
                opened={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title={<I18N>settings_delete_category</I18N>}
            >
                {deleteTarget && (
                    <Stack>
                        <Text><I18N values={{name: deleteTarget.name}}>settings_delete_category_confirm</I18N></Text>
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setDeleteTarget(null)}>
                                <I18N>cancel</I18N>
                            </Button>
                            <Button color="red" onClick={() => handleDelete(deleteTarget.id!)}>
                                <I18N>delete</I18N>
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};

interface CategoryEditFormProps {
    initialName: string;
    existingNames: string[];
    onSave: (name: string) => void;
    onCancel: () => void;
}

const CategoryEditForm = ({initialName, existingNames, onSave, onCancel}: CategoryEditFormProps) => {
    const {t} = useTranslation();
    const [name, setName] = useState(initialName);

    const trimmed = name.trim();
    const isDuplicate = trimmed.length > 0 && existingNames.includes(trimmed.toLowerCase());

    return (
        <Stack>
            <TextInput
                label={t('name')}
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
                data-autofocus
                error={isDuplicate ? t('settings_category_name_exists') : undefined}
            />
            {isDuplicate && (
                <Text size="sm" c="red"><I18N>settings_category_name_exists_hint</I18N></Text>
            )}
            <Group justify="flex-end">
                <Button variant="default" onClick={onCancel}><I18N>cancel</I18N></Button>
                <Button onClick={() => onSave(trimmed)} disabled={!trimmed || isDuplicate}>
                    <I18N>save</I18N>
                </Button>
            </Group>
        </Stack>
    );
};
