import {AppShell, Group, Text, ActionIcon, Image, Tooltip, useComputedColorScheme, useMantineColorScheme} from '@mantine/core';
import {IconArrowLeft, IconMoon, IconSun, IconHelpHexagon} from '@tabler/icons-react';
import {Outlet, useNavigate, useParams, useLocation} from 'react-router-dom';
import {useTranslation} from 'react-i18next';

export const SharingLayout = () => {
    const {t, i18n} = useTranslation();
    const navigate = useNavigate();
    const {token} = useParams<{ token?: string }>();
    const location = useLocation();
    const isReader = location.pathname.includes('/read/');
    const {setColorScheme} = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark');

    const toggleLanguage = () => {
        const isRu = i18n.language.toLowerCase().startsWith('ru');
        i18n.changeLanguage(isRu ? 'en' : 'ru');
    };

    const getDisplayLanguage = () => {
        const lang = i18n.language.toLowerCase();
        if (lang.startsWith('ru')) return 'Ру';
        if (lang.startsWith('en')) return 'En';
        return lang.substring(0, 2).toUpperCase();
    };

    return (
        <AppShell header={{height: isReader ? 0 : 60}} padding={0}>
            <AppShell.Header style={{display: isReader ? 'none' : undefined}}>
                <Group h="100%" px="md" justify="space-between">
                    <Group style={{cursor: 'pointer'}} onClick={() => navigate(`/sharing/${token}`)}>
                        <Image src="/logo.png" w={32} h={32} fit="contain"/>
                        <Text fw={700} size="xl" visibleFrom="xs">Atsumeru</Text>
                    </Group>
                    <Group>
                        <ActionIcon onClick={() => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')} variant="subtle" size="lg">
                            {computedColorScheme === 'dark' ? <IconSun size={18}/> : <IconMoon size={18}/>}
                        </ActionIcon>
                        <ActionIcon onClick={toggleLanguage} variant="subtle" size="lg">
                            {getDisplayLanguage()}
                        </ActionIcon>
                        <Tooltip label="F.A.Q">
                            <ActionIcon component="a" href="https://atsumeru.xyz/guides" target="_blank" rel="noopener noreferrer" variant="subtle" size="lg">
                                <IconHelpHexagon size={18}/>
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Main className={isReader ? 'reader-fullscreen' : undefined}>
                <Outlet/>
            </AppShell.Main>
        </AppShell>
    );
};
