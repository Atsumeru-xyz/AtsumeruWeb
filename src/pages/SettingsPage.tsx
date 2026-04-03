import { Center, Stack, Title, Text, Button, Group, Tooltip } from '@mantine/core';
import { IconExternalLink, IconBrandWindows, IconBrandApple, IconBrandDebian } from '@tabler/icons-react';
import {I18N} from "../components/I18N.tsx";

export const SettingsPage = () => {
    return (
        <Center h="100%" mih="70vh">
            <Stack align="center" gap="md">

                <Title order={2} c="custom">
                    <I18N>section_in_development</I18N>
                </Title>

                <Text ta="center" maw={400} c="dimmed">
                    <I18N>section_settings_development_note</I18N>
                </Text>

                <Group gap="md" c="dimmed" mt="xs" mb="xs">
                    <Tooltip label={<I18N>available_for_windows</I18N>} withArrow>
                        <IconBrandWindows stroke={1.5} size={28} />
                    </Tooltip>

                    <Tooltip label={<I18N>available_for_linux</I18N>} withArrow>
                        <IconBrandDebian stroke={1.5} size={28} />
                    </Tooltip>

                    <Tooltip label={<I18N>available_for_mac</I18N>} withArrow>
                        <IconBrandApple stroke={1.5} size={28} />
                    </Tooltip>
                </Group>

                <Button
                    component="a"
                    href="https://github.com/Atsumeru-xyz/AtsumeruManager"
                    target="_blank"
                    rel="noopener noreferrer"
                    mt="sm"
                    rightSection={<IconExternalLink size={18} />}
                >
                    Atsumeru Manager
                </Button>

            </Stack>
        </Center>
    );
};
