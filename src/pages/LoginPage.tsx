import {useState} from 'react';
import {Alert, Avatar, Box, Button, Center, Paper, PasswordInput, Text, TextInput, Title} from '@mantine/core';
import {useNavigate} from 'react-router-dom';
import {IconLock} from '@tabler/icons-react';
import {useAuthStore, type AuthUserInfo} from '../store/authStore';
import {useTranslation} from 'react-i18next';
import {AXIOS_INSTANCE} from '../api/custom-instance';
import {I18N} from '../components/I18N';

export const LoginPage = () => {
    const {t} = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const setUser = useAuthStore((state) => state.setUser);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError(t('login_enter_login_pass'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = btoa(`${username}:${password}`);

            const userData = await AXIOS_INSTANCE.get('/api/v1/users/me', {
                headers: {Authorization: `Basic ${token}`}
            }).then(r => r.data);

            const roles: string[] = Array.isArray(userData.roles) ? userData.roles 
                : typeof userData.roles === 'string' ? userData.roles.split(',').map((s: string) => s.trim()) : [];
            const authorities: string[] = Array.isArray(userData.authorities) ? userData.authorities
                : (userData.authoritiesSet || []);
            const isAdmin = roles.some((r: string) => r.toUpperCase() === 'ADMIN');

            const userInfo: AuthUserInfo = {
                id: userData.id as number,
                userName: username,
                isAdmin,
                roles,
                authorities,
            };

            setAuth(username, token);
            setUser(userInfo);
            navigate('/');
        } catch (e: any) {
            setError(e.message || t('login_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--mantine-color-body)',
                backgroundImage: 'radial-gradient(circle at center, var(--mantine-color-dark-6) 0%, var(--mantine-color-body) 100%)'
            }}
        >
            <Paper radius="xl" p={40} shadow="xl" withBorder w={400} style={{position: 'relative'}}>
                <Center mb="md">
                    <Avatar src="/logo.png" size={128} radius="xl">
                        <IconLock size={40}/>
                    </Avatar>
                </Center>

                <Title ta="center" order={2} mb="xs"><I18N>login_welcome_back</I18N></Title>
                <Text ta="center" c="dimmed" size="sm" mb="xl"><I18N>login_for_access</I18N></Text>

                {error && <Alert color="red" mb="md" radius="md">{error}</Alert>}

                <TextInput
                    label={t('login')}
                    required
                    size="md"
                    variant="filled"
                    value={username}
                    onChange={(e) => setUsername(e.currentTarget.value)}
                />

                <PasswordInput
                    label={t('password')}
                    required
                    mt="md"
                    size="md"
                    variant="filled"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                />

                <Button fullWidth mt="xl" size="md" radius="md" onClick={handleLogin} loading={loading}>
                    {t('authorize')}
                </Button>
            </Paper>
        </Box>
    );
};
