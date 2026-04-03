import {AspectRatio, Badge, Box, Card, Group, Overlay, Progress, Stack, Text} from '@mantine/core';
import {IconCheck, IconFlame, IconHeart} from '@tabler/icons-react';
import type {IBaseBookItem} from '../api/model';
import {SecureImage} from './SecureImage';
import {useNavigate} from 'react-router-dom';
import {BOOK_STATUS_CONFIG, type BookStatus} from '../config/book-status-config';
import {I18N} from "./I18N.tsx";

interface BookCardProps {
    book: IBaseBookItem;
    height?: number;
}

export const BookCard = ({book}: BookCardProps) => {
    const navigate = useNavigate();
    const imageHash = book.cover;

    const config = BOOK_STATUS_CONFIG[book.status as BookStatus] || BOOK_STATUS_CONFIG.UNKNOWN;
    const Icon = config.icon;

    const totalReadPages = book.volumes?.reduce((sum, volume) => {
        return sum + (volume.history?.current_page ?? 0);
    }, 0) ?? 0;

    const totalVolumesPages = book.volumes?.reduce((sum, volume) => {
        return sum + (volume?.pages_count ?? 0);
    }, 0) ?? 0;

    const progress = totalVolumesPages > 0
        ? (totalReadPages / totalVolumesPages) * 100
        : 0;

    const isCompleted = totalVolumesPages > 0 && progress >= 100;

    return (
        <Card
            shadow="sm"
            padding={0}
            radius="md"
            withBorder
            style={{cursor: 'pointer', height: '100%', transition: 'transform 0.2s'}}
            onClick={() => navigate(`/book/${book.id}`)}
            className="book-card-hover"
        >
            <Card.Section>
                <AspectRatio ratio={2 / 3}>
                    <Box pos="relative" w="100%" h="100%">

                        {imageHash ? (
                            <SecureImage hash={imageHash} alt={book.title || ''} height="100%"/>
                        ) : (
                            <Box bg="gray.8" w="100%" h="100%"
                                 style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <Text c="dimmed" size="xs"><I18N>no_cover</I18N></Text>
                            </Box>
                        )}

                        {isCompleted && (
                            <Overlay
                                color="#000"
                                backgroundOpacity={0.65}
                                zIndex={5}
                                blur={2}
                            >
                                <Stack align="center" justify="center" h="100%" gap={4}>
                                    <IconCheck size={60} color="white" stroke={3}/>
                                </Stack>
                            </Overlay>
                        )}
                    </Box>
                </AspectRatio>
            </Card.Section>

            <Box p="xs">
                <Text fw={600} lineClamp={1} size="md" title={book.title}>
                    {book.title}
                </Text>

                <Text fw={600} lineClamp={1} size="xs" title={book.alt_title}>
                    {book.alt_title}
                </Text>

                <Group
                    gap={4}
                    style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        zIndex: 10
                    }}
                >
                    {book.is_mature && (
                        <Badge
                            color="#d35400"
                            variant="filled"
                            size="sm"
                            px={6}
                            style={{boxShadow: '0 3px 4px rgba(0,0,0,0.5)'}}
                            leftSection={<IconHeart size={14}/>}
                        >
                            16+
                        </Badge>
                    )}

                    {book.is_adult && (
                        <Badge
                            color="#c0392b"
                            variant="filled"
                            size="sm"
                            px={6}
                            style={{boxShadow: '0 3px 4px rgba(0,0,0,0.5)'}}
                            leftSection={<IconFlame size={14}/>}
                        >
                            18+
                        </Badge>
                    )}
                </Group>

                <Group gap={6} mt={4}>
                    {<Badge leftSection={<Icon size={14} stroke={2}/>} color={config.color} variant="light" tt="none"
                            size="md">{config.label}</Badge>}
                </Group>

                <Group gap="xs" align="center" mt={6}>
                    <Progress value={progress} size="xs" style={{flex: 1}}/>
                    <Text size="xs" c="dimmed">
                        {progress.toFixed(1)}%
                    </Text>
                </Group>
            </Box>
        </Card>
    );
};