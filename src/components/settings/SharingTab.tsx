import {Group, Stack, Text, Card, Badge, ActionIcon, Tooltip, CopyButton, Loader, Center, Alert} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {IconCopy, IconTrash, IconClock, IconTag} from '@tabler/icons-react';
import {useTranslation} from 'react-i18next';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {listShareTokens} from '../../api/generated/sharing/sharing';
import type {ShareToken} from '../../api/model';
import {AXIOS_INSTANCE} from '../../api/custom-instance';
import {I18N} from '../I18N';

function formatDate(ts: number | undefined, t: (k: string) => string): string {
    if (!ts) return t('share_no_expiry');
    return new Date(ts).toLocaleString();
}

function daysUntil(ts: number | undefined): number | null {
    if (!ts) return null;
    const diff = ts - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const SharingTab = () => {
    const {t} = useTranslation();
    const queryClient = useQueryClient();

    const {data: rawTokens, isLoading, isError} = useQuery({
        queryKey: ['shareTokens'],
        queryFn: async () => {
            const res = await listShareTokens();
            return (Array.isArray(res) ? res : (res as unknown as Record<string, unknown>)?.data ?? []) as ShareToken[];
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

    if (isLoading) return <Center h={200}><Loader/></Center>;
    if (isError) return <Alert color="red"><I18N>error</I18N></Alert>;

    const tokens = (rawTokens || []) as ShareToken[];

    return (
        <Stack gap="md">
            {tokens.length === 0 ? (
                <Text c="dimmed" ta="center" mt="xl"><I18N>share_no_existing</I18N></Text>
            ) : (
                <Stack gap="sm">
                    {tokens.map((tok) => (
                        <Card key={tok.token} shadow="sm" padding="md" radius="md" withBorder>
                            <Group justify="space-between" wrap="nowrap" gap="sm">
                                <Stack gap={4} style={{flex: 1, minWidth: 0}}>
                                    <Text
                                        component="a"
                                        href={`/book/${tok.serie_hash}`}
                                        size="sm"
                                        fw={600}
                                        c="var(--mantine-primary-color-filled)"
                                        style={{textDecoration: 'none'}}
                                    >
                                        {tok.serie_name || tok.serie_hash}
                                    </Text>
                                    <Group gap={4} wrap="nowrap">
                                        <IconTag size={14} style={{flexShrink: 0}}/>
                                        <Text size="xs" fw={500} truncate>{tok.name || tok.token}</Text>
                                    </Group>
                                    {(() => {
                                        const days = daysUntil(tok.expires_at);
                                        return (
                                            <Group gap={4} wrap="nowrap">
                                                <Tooltip label={t('share_expires_tooltip', {date: formatDate(tok.expires_at, t)})}>
                                                    <IconClock size={16} style={{flexShrink: 0, color: days !== null && days <= 0 ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-dimmed)'}}/>
                                                </Tooltip>
                                                <Text size="sm" fw={500}>
                                                    {tok.expires_at ? (days !== null && days > 0 ? t('share_expires_in_days', {days}) : t('share_expired')) : t('share_no_expiry')}
                                                </Text>
                                            </Group>
                                        );
                                    })()}
                                    <Group gap={4} wrap="nowrap">
                                        <Text size="xs" c="dimmed">
                                            {t('share_created_by', {user: tok.created_by || '—'})}
                                        </Text>
                                        <Text size="xs" c="dimmed">|</Text>
                                        <Text size="xs" c="dimmed">
                                            {t('share_created_at', {date: formatDate(tok.created_at, t)})}
                                        </Text>
                                    </Group>
                                    {tok.authorities && (
                                        <Group gap={4} mt={2}>
                                            {(Array.isArray(tok.authorities) ? tok.authorities : String(tok.authorities).split(',').filter(Boolean)).map((a: string) => (
                                                <Badge key={a} size="xs" variant="light">{a.trim()}</Badge>
                                            ))}
                                        </Group>
                                    )}
                                </Stack>
                                <Group gap={4} wrap="nowrap">
                                    <CopyButton value={`${window.location.origin}/sharing/${tok.token}`}>
                                        {({copy}) => (
                                            <Tooltip label={t('share_copy')}>
                                                <ActionIcon variant="subtle" onClick={copy}>
                                                    <IconCopy size={18}/>
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
                                            <IconTrash size={18}/>
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                        </Card>
                    ))}
                </Stack>
            )}
        </Stack>
    );
};
