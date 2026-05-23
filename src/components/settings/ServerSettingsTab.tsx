import {useEffect, useState} from 'react';
import {
    Alert,
    Center,
    Divider,
    Loader,
    Stack,
    Switch,
    Text,
    Title,
} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {
    getSettings,
    updateSettings as apiUpdateSettings
} from '../../api/generated/settings/settings';
import type {ServerSettings} from '../../api/model';
import {useTranslation} from 'react-i18next';
import {I18N} from '../I18N';

function snakeToCamel(s: string): string {
    return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s: string): string {
    return s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}

function mapKeysToCamel(obj: Record<string, unknown>): ServerSettings {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
        result[snakeToCamel(key)] = obj[key];
    }
    return result as ServerSettings;
}

function mapKeysToSnake(obj: ServerSettings): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[camelToSnake(key)] = value;
        }
    }
    return result;
}

export const ServerSettingsTab = () => {
    const {t} = useTranslation();
    const [settings, setSettings] = useState<ServerSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = () => {
        setLoading(true);
        setError(null);
        getSettings().then((response: unknown) => {
            const data: any = (response as any)?.data || response;
            const mapped = mapKeysToCamel(data);
            setSettings(mapped);
            setLoading(false);
        }).catch((e) => {
            setError(String(e.message || e));
            setLoading(false);
        });
    };

    useEffect(() => { fetchSettings(); }, []);

    const updateSetting = (key: keyof ServerSettings, value: boolean) => {
        if (!settings) return;
        const updated = {...settings, [key]: value};
        setSettings(updated);
        const snakePayload = mapKeysToSnake(updated);
        apiUpdateSettings(snakePayload as ServerSettings).then(() => {
            notifications.show({message: t('settings_server_updated'), color: 'green'});
        }).catch((e) => {
            notifications.show({message: String(e.message || e) || t('settings_server_update_error'), color: 'red'});
            fetchSettings();
        });
    };

    if (loading) return <Center h={200}><Loader/></Center>;
    if (error) return <Alert color="red" title={t('error')}>{error}</Alert>;
    if (!settings) return <Alert color="gray"><I18N>settings_no_server_settings</I18N></Alert>;

    return (
        <Stack>
            <Title order={3}><I18N>settings_server</I18N></Title>

            <Stack gap="md">
                <Stack gap="xs">
                    <Text fw={600} size="sm" c="dimmed" tt="uppercase"><I18N>settings_lists</I18N></Text>
                    <Switch
                        label={<I18N>settings_allow_loading_list_with_volumes</I18N>}
                        checked={settings.allowLoadingListWithVolumes ?? false}
                        onChange={(e) => updateSetting('allowLoadingListWithVolumes', e.currentTarget.checked)}
                    />
                </Stack>

                <Divider/>

                <Stack gap="xs">
                    <Text fw={600} size="sm" c="dimmed" tt="uppercase"><I18N>settings_logs</I18N></Text>
                    <Switch
                        label={<I18N>settings_disable_request_logging</I18N>}
                        checked={settings.disableRequestLoggingIntoConsole ?? false}
                        onChange={(e) => updateSetting('disableRequestLoggingIntoConsole', e.currentTarget.checked)}
                    />
                </Stack>

                <Divider/>

                <Stack gap="xs">
                    <Text fw={600} size="sm" c="dimmed" tt="uppercase"><I18N>settings_file_watcher</I18N></Text>
                    <Switch
                        label={<I18N>settings_disable_watch_for_modified_files</I18N>}
                        checked={settings.disableWatchForModifiedFiles ?? false}
                        onChange={(e) => updateSetting('disableWatchForModifiedFiles', e.currentTarget.checked)}
                    />
                    <Switch
                        label={<I18N>settings_disable_file_watcher</I18N>}
                        checked={settings.disableFileWatcher ?? false}
                        onChange={(e) => updateSetting('disableFileWatcher', e.currentTarget.checked)}
                    />
                </Stack>
            </Stack>
        </Stack>
    );
};
