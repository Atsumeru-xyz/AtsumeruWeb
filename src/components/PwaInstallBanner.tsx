import {useEffect, useState} from 'react';
import {Button, Paper, Group, Text, ActionIcon} from '@mantine/core';
import {IconDownload, IconX} from '@tabler/icons-react';
import {I18N} from './I18N';
import {useTranslation} from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>;
}

export function PwaInstallBanner() {
    const {t} = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const {outcome} = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setVisible(false);
        }
    };

    if (!visible) return null;

    return (
        <Paper
            shadow="md"
            p="sm"
            style={{
                position: 'fixed',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1100,
                maxWidth: 400,
                width: 'calc(100% - 32px)',
            }}
            withBorder
        >
            <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" style={{flex: 1, minWidth: 0}}>
                    <IconDownload size={18} style={{flexShrink: 0}}/>
                    <Text size="sm" truncate="end">{t('pwa_install_banner')}</Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                    <Button size="xs" onClick={handleInstall}>
                        <I18N>pwa_install</I18N>
                    </Button>
                    <ActionIcon variant="subtle" size="sm" onClick={() => setVisible(false)}>
                        <IconX size={14}/>
                    </ActionIcon>
                </Group>
            </Group>
        </Paper>
    );
}
