import {
    ActionIcon,
    AppShell,
    Group,
    Image,
    Stack,
    Text,
    TextInput,
    Tooltip,
    UnstyledButton,
    useComputedColorScheme,
    useMantineColorScheme
} from '@mantine/core';
import {IconBooks, IconHome, IconLogout, IconMoon, IconSearch, IconSettings, IconSun, IconHelpHexagon} from '@tabler/icons-react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {useAuthStore} from '../store/authStore';
import {useUIStore} from '../store/uiStore';
import {useTranslation} from 'react-i18next';
import {useDebouncedCallback} from '@mantine/hooks';
import {I18N} from "../components/I18N.tsx";

export function MainLayout() {
    const {i18n, t} = useTranslation();
    const {setColorScheme} = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark');
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();
    const location = useLocation();
    const setSearchQuery = useUIStore((state) => state.setSearchQuery);

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

    const handleSearch = useDebouncedCallback((value: string) => {
        setSearchQuery(value);
    }, 500);

    const toggleColorScheme = () => {
        setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
    };

    const navItems = [
        {icon: IconHome, label: <I18N>section_hub</I18N>, path: '/'},
        {icon: IconBooks, label: <I18N>section_library</I18N>, path: '/library'},
        {icon: IconSettings, label: <I18N>section_settings</I18N>, path: '/settings'},
    ];

    const NavLink = ({item, minimal = false}: { item: typeof navItems[0], minimal?: boolean }) => {
        const isActive = location.pathname === item.path;
        const activeColor = 'var(--mantine-primary-color-filled)';
        const activeBg = 'var(--mantine-primary-color-light)';
        const inactiveColor = 'var(--mantine-color-dimmed)';

        return (
            <UnstyledButton
                onClick={() => navigate(item.path)}
                data-active={isActive || undefined}
                style={{
                    padding: minimal ? '8px 0' : '10px',
                    borderRadius: minimal ? 0 : '8px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: minimal ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: minimal ? 'center' : 'flex-start',
                    backgroundColor: !minimal && isActive ? activeBg : 'transparent',
                    color: isActive ? activeColor : inactiveColor,
                    transition: 'color 0.2s ease',
                }}
            >
                <item.icon size={minimal ? 22 : 24} stroke={1.5}/>
                <Text
                    ml={minimal ? 0 : "md"}
                    size={minimal ? "10px" : "sm"}
                    fw={500}
                    mt={minimal ? 2 : 0}
                >
                    {item.label}
                </Text>
            </UnstyledButton>
        );
    };

    return (
        <AppShell
            header={{height: 60}}
            navbar={{
                width: 250,
                breakpoint: 'sm',
                collapsed: {mobile: true},
            }}
            footer={{height: 60}}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group style={{cursor: 'pointer'}} onClick={() => navigate('/')}>
                        <Image src="/logo.png" w={32} h={32} fit="contain"/>
                        <Text fw={700} size="xl" visibleFrom="xs">
                            Atsumeru
                        </Text>
                    </Group>
                    <TextInput
                        placeholder={t('search_ellipsize')}
                        leftSection={<IconSearch size={16}/>}
                        visibleFrom="xs"
                        w={{base: 200, sm: 400}}
                        onChange={(e) => handleSearch(e.currentTarget.value)}
                    />
                    <Group>
                        <ActionIcon onClick={toggleColorScheme} variant="subtle" size="lg">
                            {computedColorScheme === 'dark' ? <IconSun size={18}/> : <IconMoon size={18}/>}
                        </ActionIcon>
                        <ActionIcon onClick={toggleLanguage} variant="subtle" size="lg">
                            {getDisplayLanguage()}
                        </ActionIcon>
                        <Tooltip label="F.A.Q">
                            <ActionIcon component="a" href="https://atsumeru.xyz/guides" target="_blank"
                                        rel="noopener noreferrer" variant="subtle" size="lg">
                                <IconHelpHexagon size={18}/>
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={t('logout')}>
                            <ActionIcon onClick={logout} variant="subtle" color="red" size="lg">
                                <IconLogout size={18}/>
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <Stack gap="xs">
                    {navItems.map((item) => <NavLink key={item.path} item={item}/>)}
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main>
                <Outlet/>
            </AppShell.Main>

            <AppShell.Footer zIndex={100} hiddenFrom="sm"
                             style={{borderTop: '1px solid var(--mantine-color-default-border)'}}>
                <Group h="100%" grow gap={0}>
                    {navItems.map((item) => (
                        <NavLink key={item.path} item={item} minimal/>
                    ))}
                </Group>
            </AppShell.Footer>
        </AppShell>
    );
}