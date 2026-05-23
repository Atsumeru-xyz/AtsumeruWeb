import {useEffect, useState} from 'react';
import {Button, Center, Checkbox, Group, Loader, Modal, Stack, Text, TextInput} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {getCategoryList, createCategory as apiCreateCategory} from '../api/generated/categories/categories';
import {AXIOS_INSTANCE} from '../api/custom-instance';
import type {Category} from '../api/model';
import {I18N} from './I18N';
import {useTranslation} from 'react-i18next';

interface ChangeCategoryDialogProps {
    opened: boolean;
    onClose: () => void;
    bookIds: string[];
    bookCategoryIds: string[][];
    onChanged: () => void;
}

export const ChangeCategoryDialog = ({opened, onClose, bookIds, bookCategoryIds, onChanged}: ChangeCategoryDialogProps) => {
    const {t} = useTranslation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [checked, setChecked] = useState<Set<string>>(new Set());
    const [indeterminate, setIndeterminate] = useState<Set<string>>(new Set());
    const [toggled, setToggled] = useState<Set<string>>(new Set());
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchCategories = () => {
        setLoading(true);
        getCategoryList().then((response: unknown) => {
            const data: any = response;
            const list: Category[] = Array.isArray(data) ? data : (data.data || []);
            const filtered = list.filter(c => !c.content_type);
            setCategories(filtered);
            recompute(bookCategoryIds, filtered);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        if (opened) {
            fetchCategories();
        }
    }, [opened]);

    const recompute = (bookCats: string[][], cats: Category[]) => {
        const total = bookCats.length || 1;
        const ch = new Set<string>();
        const ind = new Set<string>();
        cats.forEach(c => {
            const count = bookCats.filter(bc => bc.includes(c.id || '')).length;
            if (count === total) ch.add(c.id || '');
            else if (count > 0) ind.add(c.id || '');
        });
        setChecked(ch);
        setIndeterminate(ind);
        setToggled(new Set());
    };

    const handleToggle = (catId: string) => {
        setToggled(prev => { const n = new Set(prev); if (n.has(catId)) n.delete(catId); else n.add(catId); return n; });
        if (indeterminate.has(catId)) {
            setIndeterminate(prev => { const n = new Set(prev); n.delete(catId); return n; });
            setChecked(prev => { const n = new Set(prev); n.add(catId); return n; });
        } else if (checked.has(catId)) {
            setChecked(prev => { const n = new Set(prev); n.delete(catId); return n; });
        } else {
            setChecked(prev => { const n = new Set(prev); n.add(catId); return n; });
        }
    };

    const existingNames = categories.map(c => c.name?.toLowerCase()).filter(Boolean) as string[];
    const trimmedNewName = newName.trim();
    const isDuplicate = trimmedNewName.length > 0 && existingNames.includes(trimmedNewName.toLowerCase());

    const handleCreateCategory = () => {
        if (!trimmedNewName || isDuplicate) return;
        apiCreateCategory({name: trimmedNewName}).then(() => {
            notifications.show({message: t('settings_category_created'), color: 'green'});
            setNewName('');
            fetchCategories();
            onChanged();
        }).catch((e) => {
            notifications.show({message: String(e.message || e) || t('settings_error_create_category'), color: 'red'});
        });
    };

    const handleSave = async () => {
        setSaving(true);
        const params = new URLSearchParams();
        bookIds.forEach((bookId, idx) => {
            const original = new Set(bookCategoryIds[idx] || []);
            const newCats = new Set<string>(original);

            categories.forEach(c => {
                const cid = c.id || '';
                if (toggled.has(cid)) {
                    if (checked.has(cid)) {
                        newCats.add(cid);
                    } else if (indeterminate.has(cid)) {
                        newCats.add(cid);
                    } else {
                        newCats.delete(cid);
                    }
                } else {
                    if (checked.has(cid)) {
                        newCats.add(cid);
                    }
                }
            });

            params.append(bookId, [...newCats].join(','));
        });
        try {
            await AXIOS_INSTANCE.post('/api/v1/books/categories/set', params, {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            });
            notifications.show({message: t('context_categories_changed'), color: 'green'});
            onChanged();
            onClose();
        } catch (e: any) {
            notifications.show({message: String(e.message || e) || t('context_error_change_categories'), color: 'red'});
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title={<I18N>context_change_category</I18N>} size="md">
            {loading ? <Center h={100}><Loader/></Center> : (
                <Stack>
                    <Stack gap="xs">
                        {categories.map(cat => {
                            const cid = cat.id || '';
                            const isChecked = checked.has(cid);
                            const isIndeterminate = indeterminate.has(cid);
                            return (
                                <Checkbox
                                    key={cid}
                                    value={cid}
                                    label={cat.name}
                                    checked={isChecked}
                                    indeterminate={isIndeterminate}
                                    onChange={() => handleToggle(cid)}
                                />
                            );
                        })}
                    </Stack>

                    <Text size="sm" fw={500} mt="sm"><I18N>context_create_new_category</I18N></Text>
                    <Group gap="xs" wrap="nowrap" align="end">
                        <TextInput
                            style={{flex: 1}}
                            value={newName}
                            onChange={(e) => setNewName(e.currentTarget.value)}
                            placeholder={t('name')}
                            error={isDuplicate ? t('settings_category_name_exists') : undefined}
                        />
                        <Button onClick={handleCreateCategory} disabled={!trimmedNewName || isDuplicate}>
                            <I18N>settings_create_category</I18N>
                        </Button>
                    </Group>

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={onClose}><I18N>cancel</I18N></Button>
                        <Button onClick={handleSave} loading={saving}><I18N>save</I18N></Button>
                    </Group>
                </Stack>
            )}
        </Modal>
    );
};
