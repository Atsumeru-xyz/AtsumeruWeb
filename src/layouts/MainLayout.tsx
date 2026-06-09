import {
    ActionIcon,
    AppShell,
    Box,
    Button,
    Group,
    Image,
    Modal,
    Stack,
    Text,
    TextInput,
    Tooltip,
    UnstyledButton,
    useComputedColorScheme,
    useMantineColorScheme
} from '@mantine/core';
import {IconBooks, IconHome, IconLogout, IconMoon, IconSearch, IconSettings, IconSun, IconHelpHexagon, IconX} from '@tabler/icons-react';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {useAuthStore} from '../store/authStore';
import {useUIStore} from '../store/uiStore';
import {useTranslation} from 'react-i18next';
import {useDebouncedCallback} from '@mantine/hooks';
import {I18N} from "../components/I18N.tsx";
import {useEffect, useRef, useState} from 'react';
import {AXIOS_INSTANCE} from '../api/custom-instance';
import type {AuthUserInfo} from '../store/authStore';
import {ServerStatusOverlay} from '../components/ServerStatusOverlay';
import {PwaInstallBanner} from '../components/PwaInstallBanner';
import {SearchPanel} from '../components/SearchPanel';

export function MainLayout() {
    const {i18n, t} = useTranslation();
    const {setColorScheme} = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark');
    const logout = useAuthStore((s) => s.logout);
    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const setUser = useAuthStore((s) => s.setUser);
    const navigate = useNavigate();
    const location = useLocation();
    const setSearchQuery = useUIStore((state) => state.setSearchQuery);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [mobileSearchValue, setMobileSearchValue] = useState('');
    const prevPathname = useRef(location.pathname);

    useEffect(() => {
        if (prevPathname.current !== location.pathname) {
            prevPathname.current = location.pathname;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMobileSearchOpen(false);
            setMobileSearchValue('');
        }
    }, [location.pathname]);

    useEffect(() => {
        if (token && !user) {
            AXIOS_INSTANCE.get('/api/v1/users/me')
                .then(r => r.data)
                .then((userData: any) => {
                    const roles: string[] = Array.isArray(userData.roles) ? userData.roles
                        : typeof userData.roles === 'string' ? userData.roles.split(',').map((s: string) => s.trim()) : [];
                    const authorities: string[] = Array.isArray(userData.authorities) ? userData.authorities
                        : (userData.authoritiesSet || []);
                    const isAdmin = roles.some((r: string) => r.toUpperCase() === 'ADMIN');
                    const userInfo: AuthUserInfo = {
                        id: userData.id as number,
                        userName: userData.user_name || '',
                        isAdmin,
                        roles,
                        authorities,
                    };
                    setUser(userInfo);
                })
                .catch(() => {});
        }
    }, [token, user, setUser]);

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
                <Group h="100%" px="md" justify="space-between" wrap="nowrap">
                    <Group style={{cursor: 'pointer', flexShrink: 0}} onClick={() => navigate('/')}>
                        <Image src="/logo.png" w={32} h={32} fit="contain"/>
                        <Text fw={700} size="xl" visibleFrom="xs">
                            Atsumeru
                        </Text>
                    </Group>
                    <Box pos="relative" visibleFrom="sm" style={{flex: '1 1 auto', maxWidth: 560, minWidth: 0}}>
                        <TextInput
                            id="header-search-input"
                            placeholder={t('search_ellipsize')}
                            leftSection={<IconSearch size={16}/>}
                            value={searchValue}
                            onChange={(e) => {
                                const v = e.currentTarget.value;
                                setSearchValue(v);
                                handleSearch(v);
                            }}
                            onFocus={() => setSearchFocused(true)}
                        />
                        {searchFocused && (
                            <SearchPanel
                                query={searchValue}
                                onClose={() => setSearchFocused(false)}
                                inputId="header-search-input"
                            />
                        )}
                    </Box>
                    <Group style={{flexShrink: 0}}>
                        <ActionIcon hiddenFrom="sm" onClick={() => setMobileSearchOpen(true)} variant="subtle" size="lg">
                            <IconSearch size={18}/>
                        </ActionIcon>
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
                            <ActionIcon onClick={() => setLogoutOpen(true)} variant="subtle" color="red" size="lg">
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

            <ServerStatusOverlay/>

            <PwaInstallBanner/>

            <Modal
                opened={logoutOpen}
                onClose={() => setLogoutOpen(false)}
                title={t('logout')}
            >
                <Stack>
                    <Text><I18N>logout_confirm</I18N></Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setLogoutOpen(false)}>
                            <I18N>cancel</I18N>
                        </Button>
                        <Button color="red" onClick={() => { setLogoutOpen(false); logout(); }}>
                            {t('logout')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {mobileSearchOpen && (
                <>
                    <Box style={{position: 'fixed', inset: 0, zIndex: 299}} onClick={() => { setMobileSearchOpen(false); setMobileSearchValue(''); }}/>
                    <Box style={{
                        position: 'fixed', top: 60, left: 0, right: 0, zIndex: 300,
                        maxHeight: 'calc(100vh - 60px)', overflowY: 'auto',
                    }} bg="var(--mantine-color-body)" p="md" pb={0}>
                        <Box pos="relative">
                            <TextInput
                                id="mobile-search-input"
                                placeholder={t('search_ellipsize')}
                                leftSection={<IconSearch size={16}/>}
                                value={mobileSearchValue}
                                onChange={(e) => {
                                    const v = e.currentTarget.value;
                                    setMobileSearchValue(v);
                                    handleSearch(v);
                                }}
                                autoFocus
                                rightSection={
                                    <ActionIcon variant="subtle" onClick={() => { setMobileSearchOpen(false); setMobileSearchValue(''); }}>
                                        <IconX size={16}/>
                                    </ActionIcon>
                                }
                            />
                            {mobileSearchValue && (
                                <SearchPanel
                                    query={mobileSearchValue}
                                    onClose={() => { setMobileSearchOpen(false); setMobileSearchValue(''); }}
                                    inputId="mobile-search-input"
                                />
                            )}
                        </Box>
                    </Box>
                </>
            )}

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