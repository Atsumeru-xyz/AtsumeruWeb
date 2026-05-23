import {Center, Loader, Stack, Text, Tabs} from '@mantine/core';
import {IconSettings, IconUsers, IconFolder, IconCategory, IconDots, IconShare} from '@tabler/icons-react';
import {useAuthStore} from '../store/authStore';
import {I18N} from '../components/I18N';
import {UserManagementTab} from '../components/settings/UserManagementTab';
import {ImportFoldersTab} from '../components/settings/ImportFoldersTab';
import {CategoriesTab} from '../components/settings/CategoriesTab';
import {ServerSettingsTab} from '../components/settings/ServerSettingsTab';
import {MiscTab} from '../components/settings/MiscTab';
import {SharingTab} from '../components/settings/SharingTab';
import {useState} from 'react';

export const SettingsPage = () => {
    const isAdmin = useAuthStore((state) => state.isAdmin());
    const [activeTab, setActiveTab] = useState<string | null>('users');

    if (isAdmin === undefined) {
        return <Center h="70vh"><Loader/></Center>;
    }

    if (!isAdmin) {
        return (
            <Center h="100%" mih="70vh">
                <Stack align="center" gap="md">
                    <Text ta="center" maw={400} c="dimmed" size="lg">
                        <I18N>settings_admin_only</I18N>
                    </Text>
                </Stack>
            </Center>
        );
    }

    return (
        <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="xl" p="md" px={{base: 4, sm: 'md'}}>
            <Tabs.List>
                <Tabs.Tab value="users" leftSection={<IconUsers size={16}/>}>
                    <I18N>settings_users</I18N>
                </Tabs.Tab>
                <Tabs.Tab value="folders" leftSection={<IconFolder size={16}/>}>
                    <I18N>settings_import_folders</I18N>
                </Tabs.Tab>
                <Tabs.Tab value="categories" leftSection={<IconCategory size={16}/>}>
                    <I18N>settings_categories</I18N>
                </Tabs.Tab>
                <Tabs.Tab value="sharing" leftSection={<IconShare size={16}/>}>
                    <I18N>sharing</I18N>
                </Tabs.Tab>
                <Tabs.Tab value="server" leftSection={<IconSettings size={16}/>}>
                    <I18N>settings_server</I18N>
                </Tabs.Tab>
                <Tabs.Tab value="other" leftSection={<IconDots size={16}/>}>
                    <I18N>settings_other</I18N>
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="users" pt="md">
                <UserManagementTab/>
            </Tabs.Panel>
            <Tabs.Panel value="folders" pt="md">
                <ImportFoldersTab/>
            </Tabs.Panel>
            <Tabs.Panel value="categories" pt="md">
                <CategoriesTab/>
            </Tabs.Panel>
            <Tabs.Panel value="server" pt="md">
                <ServerSettingsTab/>
            </Tabs.Panel>
            <Tabs.Panel value="other" pt="md">
                <MiscTab/>
            </Tabs.Panel>
            <Tabs.Panel value="sharing" pt="md">
                <SharingTab/>
            </Tabs.Panel>
        </Tabs>
    );
};
