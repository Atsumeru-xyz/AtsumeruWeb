import {AspectRatio, Box, Card, Overlay, Progress, Text} from '@mantine/core';
import type {VolumeItem} from '../api/model';
import {SecureImage} from './SecureImage';
import {useNavigate} from 'react-router-dom';
import {IconCheck} from '@tabler/icons-react';
import {I18N} from "./I18N.tsx";

interface VolumeCardProps {
    volume: VolumeItem;
    bookId: string;
    coverId?: string;
    token?: string;
    onRead?: (volumeId: string) => void;
    showContinue?: boolean;
}

export const VolumeCard = ({volume, bookId, token, onRead, showContinue}: VolumeCardProps) => {
    const navigate = useNavigate();

    const currentPage = volume.history?.current_page || 0;
    const totalPages = volume.pages_count || 1;
    const progress = (currentPage / totalPages) * 100;
    const isRead = progress >= 95 || volume.read;

    const handleClick = () => {
        if (onRead) onRead(volume.id || '');
        else navigate(`/read/${bookId}/${volume.id}`);
    };

    return (
        <Card
            shadow="sm"
            padding={0}
            radius="md"
            withBorder
            style={{cursor: 'pointer', height: '100%', position: 'relative'}}
            onClick={handleClick}
        >
            <Card.Section>
                <AspectRatio ratio={2 / 3}>
                    {!volume.read || showContinue ? (
                        <SecureImage hash={volume.id || ''} alt={volume.title || 'Cover'} height="100%" token={token}/>
                    ) : (
                        <Box bg="gray.8" w="100%" h="100%"/>
                    )}
                    {isRead && !showContinue && (
                        <Overlay color="#000" backgroundOpacity={0.65} zIndex={5} blur={2} center>
                            <IconCheck size={60} color="white" stroke={3}/>
                        </Overlay>
                    )}
                </AspectRatio>
            </Card.Section>

            {progress > 0 && !isRead && (
                <Progress value={progress} size="xs" radius={0}/>
            )}

            <Box p="xs">
                <Text fw={600} size="sm" lineClamp={1}>
                    {volume.title || <I18N values={{val: volume.volume}}>volume_label</I18N>}
                </Text>
                <Text size="xs" c="dimmed">
                    <I18N values={{val: volume.history?.current_page ?? 0, val2: volume.pages_count}}>pages_label</I18N>
                </Text>
            </Box>
        </Card>
    );
};