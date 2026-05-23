import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    TextInput,
    PasswordInput,
    Title,
    Tooltip,
    Checkbox,
    SimpleGrid,
    Tabs,
    TagsInput,
    SegmentedControl,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {
    IconEdit,
    IconTrash,
    IconPlus,
    IconShield,
    IconUser,
} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {useQueryClient} from '@tanstack/react-query';
import {listUsers} from '../../api/generated/users/users';
import {
    createUser as apiCreateUser,
    updateUser as apiUpdateUser,
    deleteUser as apiDeleteUser,
    useListUserAccessConstants2
} from '../../api/generated/users/users';
import type {AtsumeruUser} from '../../api/model';
import {I18N} from '../I18N';
import {useAuthStore} from '../../store/authStore';
import {useTranslation} from 'react-i18next';

function toArray(v: unknown): string[] {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
}

function toCommaString(v: unknown): string {
    if (Array.isArray(v)) return v.join(',');
    if (typeof v === 'string') return v;
    return '';
}

interface FetchedUser {
    id: number;
    user_name: string;
    roles: string | string[];
    authorities: string | string[];
    allowed_categories: string | string[];
    disallowed_genres: string[] | string;
    disallowed_tags: string[] | string;
    authoritiesSet?: string[];
}

type AtsumeruUserResponse = {
    code?: number;
    message?: string;
} & Record<string, unknown>;

export const UserManagementTab = () => {
    const {t} = useTranslation();
    const queryClient = useQueryClient();
    const currentUserName = useAuthStore((s) => s.username);

    const [users, setUsers] = useState<FetchedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        setError(null);
        listUsers().then((response: unknown) => {
            const data: any = response;
            const list: FetchedUser[] = Array.isArray(data) ? data : (data as any).data || [];
            if (Array.isArray(list)) {
                list.sort((a, b) => (a.user_name === currentUserName ? -1 : b.user_name === currentUserName ? 1 : 0));
            }
            setUsers(list);
            setLoading(false);
        }).catch((e) => {
            setError(String(e.message || e));
            setLoading(false);
        });
    };

    useEffect(() => { fetchUsers(); }, []);

    const [editUser, setEditUser] = useState<FetchedUser | null>(null);
    const [createMode, {open: openCreate, close: closeCreate}] = useDisclosure(false);
    const [deleteTarget, setDeleteTarget] = useState<FetchedUser | null>(null);

    const handleDeleted = () => {
        fetchUsers();
        queryClient.invalidateQueries({queryKey: ['listUsers']});
    };

    const existingUsernames = users.map(u => u.user_name?.toLowerCase()).filter(Boolean) as string[];

    if (loading) return <Center h={200}><Loader/></Center>;
    if (error) return <Alert color="red" title={t('error')}>{error}</Alert>;

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={3}><I18N>settings_users_management</I18N></Title>
                <Button leftSection={<IconPlus size={16}/>} onClick={openCreate}>
                    <I18N>settings_add_user</I18N>
                </Button>
            </Group>

            {users.length === 0 && (
                <Alert color="gray"><I18N>settings_no_users</I18N></Alert>
            )}

            {users.map((user) => {
                const roles = toArray(user.roles);
                const authorities = user.authoritiesSet || toArray(user.authorities);
                const hasLimits = toCommaString(user.allowed_categories).length > 0
                    || toArray(user.disallowed_genres).length > 0
                    || toArray(user.disallowed_tags).length > 0;
                const isAdmin = roles.some(r => r.toUpperCase() === 'ADMIN');

                return (
                    <Card key={user.id} withBorder padding="md" radius="md">
                        <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap">
                                <Tooltip label={isAdmin ? t('settings_role_admin') : t('settings_role_user')}>
                                    {isAdmin
                                        ? <IconShield size={22} color="var(--mantine-primary-color-filled)"/>
                                        : <IconUser size={22} color="var(--mantine-color-dimmed)"/>
                                    }
                                </Tooltip>
                                <Stack gap={2}>
                                    <Text fw={600}>{user.user_name}</Text>
                                    <Group gap={4}>
                                        {authorities.map(a => (
                                            <Badge key={a} size="xs" variant="light" color="cyan">{a}</Badge>
                                        ))}
                                        {hasLimits && <Badge size="xs" variant="light" color="yellow"><I18N>settings_has_limits</I18N></Badge>}
                                    </Group>
                                </Stack>
                            </Group>
                            <Group gap="xs" wrap="nowrap">
                                <Tooltip label={t('settings_edit_user')}>
                                    <ActionIcon variant="subtle" color="blue" onClick={() => setEditUser(user)}>
                                        <IconEdit size={18}/>
                                    </ActionIcon>
                                </Tooltip>
                                {user.user_name !== currentUserName && (
                                    <Tooltip label={t('settings_delete_user')}>
                                        <ActionIcon variant="subtle" color="red" onClick={() => setDeleteTarget(user)}>
                                            <IconTrash size={18}/>
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </Group>
                        </Group>
                    </Card>
                );
            })}

            <Modal opened={editUser !== null} onClose={() => setEditUser(null)} title={<I18N>settings_edit_user</I18N>} size="lg">
                {editUser !== null && (
                    <EditUserForm
                        user={editUser}
                        existingUsernames={existingUsernames.filter(n => n !== editUser.user_name?.toLowerCase())}
                        onClose={() => setEditUser(null)}
                        onSaved={fetchUsers}
                    />
                )}
            </Modal>

            <Modal opened={createMode} onClose={closeCreate} title={<I18N>settings_create_user</I18N>} size="lg">
                <EditUserForm
                    user={null}
                    existingUsernames={existingUsernames}
                    onClose={closeCreate}
                    onSaved={fetchUsers}
                />
            </Modal>

            <Modal
                opened={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title={<I18N>settings_delete_user</I18N>}
            >
                {deleteTarget && (
                    <Stack>
                        <Text><I18N values={{name: deleteTarget.user_name}}>settings_delete_user_confirm</I18N></Text>
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setDeleteTarget(null)}>
                                <I18N>cancel</I18N>
                            </Button>
                            <Button color="red" onClick={() => {
                                apiDeleteUser({user_id: deleteTarget.id}).then((response: unknown) => {
                                    const resp = response as AtsumeruUserResponse;
                                    if (resp && typeof resp.code === 'number' && (resp.code < 200 || resp.code >= 300)) {
                                        notifications.show({message: resp.message || t('settings_error_delete_user'), color: 'red'});
                                    } else {
                                        notifications.show({message: t('settings_user_deleted'), color: 'green'});
                                        setDeleteTarget(null);
                                        handleDeleted();
                                    }
                                }).catch((e) => {
                                    notifications.show({message: String(e.message || e) || t('settings_error_delete_user'), color: 'red'});
                                });
                            }}>
                                <I18N>delete</I18N>
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};

interface EditUserFormProps {
    user: FetchedUser | null;
    existingUsernames: string[];
    onClose: () => void;
    onSaved: () => void;
}

function getGenreId(genre: unknown): string {
    if (!genre || typeof genre !== 'object') return '';
    const g = genre as Record<string, unknown>;
    return String(g.id ?? g.ID ?? g._id ?? g.genre_id ?? '');
}

function getGenreName(genre: unknown): string {
    if (!genre || typeof genre !== 'object') return '';
    const g = genre as Record<string, unknown>;
    return String(g.name ?? g.Name ?? g.genre_name ?? g.title ?? '');
}

const EditUserForm = ({user, existingUsernames, onClose, onSaved}: EditUserFormProps) => {
    const {t} = useTranslation();
    const [userName, setUserName] = useState(user?.user_name || '');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN'>('USER');
    const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [disallowedTags, setDisallowedTags] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const {data: constantsResponse, isLoading: constantsLoading} = useListUserAccessConstants2();
    const constantsData: any = constantsResponse ?? {};

    useEffect(() => {
        if (user && Object.keys(constantsData).length > 0) {
            const roles = toArray(user.roles);
            setSelectedRole(roles.some(r => r.toUpperCase() === 'ADMIN') ? 'ADMIN' : 'USER');
            setSelectedAuthorities(user.authoritiesSet || toArray(user.authorities));
            setSelectedCategories(toArray(user.allowed_categories));
            setSelectedGenres(toArray(user.disallowed_genres));
            setDisallowedTags(toArray(user.disallowed_tags));
        }
    }, [user, constantsData]);

    const trimmedUserName = userName.trim();
    const isDuplicateName = trimmedUserName.length > 0
        && existingUsernames.includes(trimmedUserName.toLowerCase());

    const handleSave = async () => {
        if (!trimmedUserName) return;
        if (!user && !password.trim()) return;

        setSaving(true);
        const payload: Record<string, unknown> = {
            user_name: trimmedUserName,
            roles: [selectedRole],
            authorities: selectedAuthorities,
            allowed_categories: selectedCategories,
            disallowed_genres: selectedGenres,
            disallowed_tags: disallowedTags,
        };
        if (user) {
            payload.id = user.id;
        }
        if (password.trim()) {
            payload.password = password.trim();
        }

        try {
            const response: unknown = user
                ? await apiUpdateUser(payload as AtsumeruUser)
                : await apiCreateUser(payload as AtsumeruUser);

            const resp = response as AtsumeruUserResponse;
            if (resp && typeof resp.code === 'number' && (resp.code < 200 || resp.code >= 300)) {
                notifications.show({
                    message: resp.message || t(user ? 'settings_error_update_user' : 'settings_error_create_user'),
                    color: 'red',
                });
            } else {
                notifications.show({
                    message: t(user ? 'settings_user_updated' : 'settings_user_created'),
                    color: 'green',
                });
                onSaved();
                onClose();
            }
        } catch (e: any) {
            notifications.show({
                message: String(e.message || e) || t(user ? 'settings_error_update_user' : 'settings_error_create_user'),
                color: 'red',
            });
        } finally {
            setSaving(false);
        }
    };

    if (constantsLoading) return <Center h={100}><Loader/></Center>;
    const c: any = constantsData;
    const availAuthorities: string[] = c?.authorities || [];
    const availCategories: {id: string; name: string}[] = (c?.categories || []).map((cat: any) => ({
        id: cat.id ?? cat.ID ?? cat._id ?? '',
        name: cat.name ?? cat.Name ?? '',
    }));
    const availGenres: {id: string; name: string}[] = (c?.genres || []).map((gen: any) => ({
        id: getGenreId(gen),
        name: getGenreName(gen),
    }));
    const availTags: string[] = c?.tags || [];

    return (
        <Stack>
            <TextInput
                label={t('login')}
                value={userName}
                onChange={(e) => setUserName(e.currentTarget.value)}
                required
                error={isDuplicateName ? t('settings_username_exists') : undefined}
            />
            <PasswordInput
                label={t('password')}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder={user ? t('settings_password_leave_empty') : undefined}
                required={!user}
            />

            <Tabs defaultValue="role">
                <Tabs.List>
                    <Tabs.Tab value="role"><I18N>settings_role</I18N></Tabs.Tab>
                    <Tabs.Tab value="authorities"><I18N>settings_authorities</I18N></Tabs.Tab>
                    <Tabs.Tab value="limits"><I18N>settings_access_limits</I18N></Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="role" pt="md">
                    <SegmentedControl
                        value={selectedRole}
                        onChange={(v) => setSelectedRole(v as 'USER' | 'ADMIN')}
                        data={[
                            {label: 'USER', value: 'USER'},
                            {label: 'ADMIN', value: 'ADMIN'},
                        ]}
                        fullWidth
                    />
                </Tabs.Panel>

                <Tabs.Panel value="authorities" pt="md">
                    {availAuthorities.length === 0 && (
                        <Text c="dimmed" size="sm"><I18N>settings_no_data</I18N></Text>
                    )}
                    <Checkbox.Group value={selectedAuthorities} onChange={setSelectedAuthorities}>
                        <SimpleGrid cols={2} spacing="xs">
                            {availAuthorities.map((auth: string) => (
                                <Checkbox key={auth} value={auth} label={auth}/>
                            ))}
                        </SimpleGrid>
                    </Checkbox.Group>
                </Tabs.Panel>

                <Tabs.Panel value="limits" pt="md">
                    <Stack gap="md">
                        <Box>
                            <Text fw={500} size="sm" mb="xs"><I18N>settings_allowed_categories</I18N></Text>
                            {availCategories.length === 0 && (
                                <Text c="dimmed" size="sm"><I18N>settings_no_data</I18N></Text>
                            )}
                            <Checkbox.Group value={selectedCategories} onChange={setSelectedCategories}>
                                <SimpleGrid cols={2} spacing="xs">
                                    {availCategories.map((cat) => (
                                        <Checkbox key={cat.id} value={cat.id} label={cat.name}/>
                                    ))}
                                </SimpleGrid>
                            </Checkbox.Group>
                        </Box>

                        <Box>
                            <Text fw={500} size="sm" mb="xs"><I18N>settings_disallowed_genres</I18N></Text>
                            {availGenres.length === 0 && (
                                <Text c="dimmed" size="sm"><I18N>settings_no_data</I18N></Text>
                            )}
                            <Checkbox.Group value={selectedGenres} onChange={setSelectedGenres}>
                                <SimpleGrid cols={2} spacing="xs">
                                    {availGenres.map((gen) => (
                                        <Checkbox key={gen.id} value={gen.id} label={gen.name}/>
                                    ))}
                                </SimpleGrid>
                            </Checkbox.Group>
                        </Box>

                        <TagsInput
                            label={t('settings_disallowed_tags')}
                            placeholder={t('settings_disallowed_tags_hint')}
                            value={disallowedTags}
                            onChange={setDisallowedTags}
                            data={availTags}
                            clearable
                            description={t('settings_disallowed_tags_description')}
                        />
                    </Stack>
                </Tabs.Panel>
            </Tabs>

            <Group justify="flex-end">
                <Button variant="default" onClick={onClose}><I18N>cancel</I18N></Button>
                <Button onClick={handleSave} loading={saving} disabled={isDuplicateName}>
                    <I18N>save</I18N>
                </Button>
            </Group>
        </Stack>
    );
};
