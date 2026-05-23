import {useState} from 'react';
import {
    Button,
    Card,
    Group,
    Modal,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    IconTrashX,
    IconHash,
    IconFileDownload,
} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {clearCache} from '../../api/generated/server/server';
import {
    createUniqueIds,
    injectAllFromDatabase
} from '../../api/generated/metadata/metadata';
import {I18N} from '../I18N';
import {useTranslation} from 'react-i18next';

interface AtsumeruMessageResponse {
    code?: number;
    message?: string;
}

export const MiscTab = () => {
    const {t} = useTranslation();

    const [confirmAction, setConfirmAction] = useState<{
        key: string;
        title: string;
        description: string;
        action: () => Promise<unknown>;
        successMsg: string;
        errorMsg: string;
    } | null>(null);

    const [executing, setExecuting] = useState(false);

    const handleExecute = async () => {
        if (!confirmAction) return;
        setExecuting(true);
        try {
            const response: unknown = await confirmAction.action();
            const resp = response as AtsumeruMessageResponse;
            if (resp && typeof resp.code === 'number' && (resp.code < 200 || resp.code >= 300)) {
                notifications.show({message: resp.message || confirmAction.errorMsg, color: 'red'});
            } else {
                notifications.show({message: confirmAction.successMsg, color: 'green'});
            }
        } catch (e: any) {
            notifications.show({message: String(e.message || e) || confirmAction.errorMsg, color: 'red'});
        } finally {
            setExecuting(false);
            setConfirmAction(null);
        }
    };

    const actions = [
        {
            key: 'clear_cache',
            icon: IconTrashX,
            title: t('settings_clear_server_cache'),
            description: t('settings_clear_server_cache_summary'),
            action: () => clearCache(),
            successMsg: t('settings_cache_cleared'),
            errorMsg: t('settings_unable_to_clear_cache'),
        },
        {
            key: 'generate_hashes',
            icon: IconHash,
            title: t('settings_generate_unique_hashes'),
            description: t('settings_generate_unique_hashes_summary'),
            action: () => createUniqueIds({into_archives: true, into_database: false, force: false}),
            successMsg: t('settings_procedure_launched'),
            errorMsg: t('settings_unable_to_launch_procedure'),
        },
        {
            key: 'insert_metadata',
            icon: IconFileDownload,
            title: t('settings_insert_all_metadata'),
            description: t('settings_insert_all_metadata_summary'),
            action: () => injectAllFromDatabase(),
            successMsg: t('settings_procedure_launched'),
            errorMsg: t('settings_unable_to_launch_procedure'),
        },
    ];

    return (
        <Stack>
            <Title order={3}><I18N>settings_other</I18N></Title>

            {actions.map((act) => (
                <Card key={act.key} withBorder padding="md" radius="md">
                    <Group justify="space-between" wrap="nowrap" align="center">
                        <Group gap="sm" wrap="nowrap" style={{flex: 1, minWidth: 0}}>
                            <act.icon size={24} style={{flexShrink: 0}}/>
                            <Stack gap={2} style={{flex: 1, minWidth: 0}}>
                                <Text fw={600}>{act.title}</Text>
                                <Text size="sm" c="dimmed">{act.description}</Text>
                            </Stack>
                        </Group>
                        <Button
                            variant="light"
                            color="red"
                            onClick={() => setConfirmAction(act)}
                            style={{flexShrink: 0}}
                        >
                            <I18N>settings_execute</I18N>
                        </Button>
                    </Group>
                </Card>
            ))}

            <Modal
                opened={confirmAction !== null}
                onClose={() => setConfirmAction(null)}
                title={confirmAction?.title}
            >
                {confirmAction && (
                    <Stack>
                        <Text size="sm">{confirmAction.description}</Text>
                        <Text size="sm" c="red" fw={500}><I18N>settings_this_cant_be_undone</I18N></Text>
                        <Group justify="flex-end">
                            <Button variant="default" onClick={() => setConfirmAction(null)}>
                                <I18N>cancel</I18N>
                            </Button>
                            <Button color="red" onClick={handleExecute} loading={executing}>
                                <I18N>settings_execute</I18N>
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};
