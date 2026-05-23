import {useState} from 'react';
import {Modal, TextInput, Group, Button, Stack, Text, Checkbox, Divider, ActionIcon, Tooltip, Box, CopyButton} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {useTranslation} from 'react-i18next';
import {IconCopy, IconTrash, IconShare} from '@tabler/icons-react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {listShareTokens} from '../api/generated/sharing/sharing';
import type {ShareToken} from '../api/model';
import {AXIOS_INSTANCE} from '../api/custom-instance';

interface ShareTokenDialogProps {
    opened: boolean;
    onClose: () => void;
    serieHash: string;
    serieName: string;
}

function formatDate(ts: number | undefined, t: (k: string) => string): string {
    if (!ts) return t('share_no_expiry');
    return new Date(ts).toLocaleString();
}

export const ShareTokenDialog = ({opened, onClose, serieHash, serieName}: ShareTokenDialogProps) => {
    const {t} = useTranslation();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [authorities, setAuthorities] = useState<string[]>([]);

    const {data: rawTokens} = useQuery({
        queryKey: ['shareTokens'],
        queryFn: async () => {
            const res = await listShareTokens();
            return (Array.isArray(res) ? res : (res as unknown as Record<string, unknown>)?.data ?? []) as ShareToken[];
        },
        enabled: opened,
    });

    const tokens = (rawTokens || []).filter(t => t.serie_hash === serieHash);

    const createMutation = useMutation({
        mutationFn: async () => {
            const body: Record<string, unknown> = {
                name: name.trim(),
                serie_hash: serieHash,
            };
            if (authorities.length > 0) body.authorities = authorities;
            if (expiryDate) body.expires_at = new Date(expiryDate).getTime();
            const res = await AXIOS_INSTANCE.post('/api/v1/share', body);
            return res.data as ShareToken;
        },
        onSuccess: (data) => {
            const link = `${window.location.origin}/sharing/${data.token}`;
            navigator.clipboard.writeText(link).then(() => {
                notifications.show({message: t('share_link_copied'), color: 'green'});
            });
            setName('');
            setExpiryDate('');
            setAuthorities([]);
            queryClient.invalidateQueries({queryKey: ['shareTokens']});
        },
        onError: () => {
            notifications.show({message: t('share_create_error'), color: 'red'});
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (token: string) => AXIOS_INSTANCE.delete(`/api/v1/share/${token}`),
        onSuccess: () => {
            notifications.show({message: t('share_deleted'), color: 'green'});
            queryClient.invalidateQueries({queryKey: ['shareTokens']});
        },
        onError: () => {
            notifications.show({message: t('share_delete_error'), color: 'red'});
        },
    });

    const setQuickExpiry = (hours: number) => {
        const d = new Date();
        d.setHours(d.getHours() + hours);
        setExpiryDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    };

    return (
        <Modal opened={opened} onClose={onClose} title={t('share_dialog_title')} size="lg">
            <Stack gap="md">
                <Text size="sm" c="dimmed">{serieName}</Text>

                <Text fw={600} size="sm">{t('share_existing')}</Text>
                {tokens.length === 0 ? (
                    <Text size="sm" c="dimmed">{t('share_no_existing')}</Text>
                ) : (
                    <Stack gap="xs">
                        {tokens.map((tok) => (
                            <Group key={tok.token} justify="space-between" wrap="nowrap" gap="xs"
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid var(--mantine-color-default-border)',
                                    borderRadius: 'var(--mantine-radius-sm)',
                                }}>
                                <Stack gap={2} style={{flex: 1, minWidth: 0}}>
                                    <Text size="sm" fw={500} truncate>{tok.name || tok.token}</Text>
                                    <Group gap="xs">
                                        <Text size="xs" c="dimmed">{t('share_created_by', {user: tok.created_by || '—'})}</Text>
                                        <Text size="xs" c="dimmed">|</Text>
                                        <Text size="xs" c="dimmed">{t('share_expires_at', {date: formatDate(tok.expires_at, t)})}</Text>
                                    </Group>
                                </Stack>
                                <Group gap={4} wrap="nowrap">
                                    <CopyButton value={`${window.location.origin}/sharing/${tok.token}`}>
                                        {({copy}) => (
                                            <Tooltip label={t('share_copy')}>
                                                <ActionIcon variant="subtle" onClick={copy}>
                                                    <IconCopy size={16}/>
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                    </CopyButton>
                                    <Tooltip label={t('delete')}>
                                        <ActionIcon variant="subtle" color="red"
                                            onClick={() => {
                                                if (window.confirm(t('share_delete_confirm', {name: tok.name || tok.token}))) {
                                                    deleteMutation.mutate(tok.token!);
                                                }
                                            }}>
                                            <IconTrash size={16}/>
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                        ))}
                    </Stack>
                )}

                <Divider/>

                <Text fw={600} size="sm">{t('share_create_title')}</Text>
                <TextInput
                    label={t('share_token_name')}
                    placeholder={t('share_token_name_placeholder')}
                    value={name}
                    onChange={e => setName(e.currentTarget.value)}
                    required
                />

                <Box>
                    <Text size="sm" fw={500} mb={4}>{t('share_expiry')}</Text>
                    <Group gap={4} mb="xs">
                        {[
                            {label: t('share_quick_day'), h: 24},
                            {label: t('share_quick_week'), h: 168},
                            {label: t('share_quick_month'), h: 720},
                            {label: t('share_quick_3months'), h: 2160},
                            {label: t('share_quick_6months'), h: 4320},
                            {label: t('share_quick_year'), h: 8760},
                        ].map(q => (
                            <Button key={q.h} variant="light" size="compact-xs" onClick={() => setQuickExpiry(q.h)}>
                                {q.label}
                            </Button>
                        ))}
                        {expiryDate && (
                            <Button variant="subtle" size="compact-xs" color="gray" onClick={() => setExpiryDate('')}>
                                {t('share_no_expiry')}
                            </Button>
                        )}
                    </Group>
                    <input
                        type="datetime-local"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: 'var(--mantine-radius-sm)',
                            border: '1px solid var(--mantine-color-default-border)',
                            background: 'var(--mantine-color-body)',
                            color: 'var(--mantine-color-text)',
                            fontSize: '14px',
                        }}
                    />
                </Box>

                <Box>
                    <Text size="sm" fw={500} mb={4}>{t('share_authorities')}</Text>
                    <Checkbox
                        label={t('share_download_files')}
                        checked={authorities.includes('DOWNLOAD_FILES')}
                        onChange={e => {
                            if (e.currentTarget.checked) {
                                setAuthorities(['DOWNLOAD_FILES']);
                            } else {
                                setAuthorities([]);
                            }
                        }}
                    />
                </Box>

                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose}>{t('cancel')}</Button>
                    <Button
                        leftSection={<IconShare size={16}/>}
                        onClick={() => createMutation.mutate()}
                        loading={createMutation.isPending}
                        disabled={!name.trim()}
                    >
                        {t('share_context')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};
