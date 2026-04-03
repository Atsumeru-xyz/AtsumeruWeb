import {Box, Button, Group, ScrollArea, Stack, Text, Title} from '@mantine/core';
import {BookCard} from './BookCard';
import type {IBaseBookItem} from '../api/model';
import {useNavigate} from 'react-router-dom';
import type {ReactNode} from "react";
import {I18N} from "./I18N.tsx";

interface HorizontalListProps {
    title: ReactNode;
    data?: IBaseBookItem[];
    isLoading: boolean;
    largeCards?: boolean;
    emptyMessage?: ReactNode;
    showLibraryButton?: boolean;
}

export const HorizontalList = ({
                                   title, data, isLoading, largeCards = false, emptyMessage, showLibraryButton
                               }: HorizontalListProps) => {
    const navigate = useNavigate();
    const cardWidth = largeCards ? 180 : 140;

    if (!isLoading && (!data || data.length === 0)) {
        if (!emptyMessage) return null;

        return (
            <Stack my="xl" align="center" bg="var(--mantine-color-body)" p="lg"
                   style={{borderRadius: 8, border: 'var(--mantine-color-dimmed)'}}>
                <Text c="dimmed">{emptyMessage}</Text>
                {showLibraryButton && (
                    <Button variant="light" onClick={() => navigate('/library')}><I18N>go_to_library</I18N></Button>
                )}
            </Stack>
        )
    }

    return (
        <Box mb="sm">
            <Title order={3} mb="md" px="xs">{title}</Title>
            <ScrollArea type="hover" scrollbarSize={8} offsetScrollbars>
                <Group align="flex-start" wrap="nowrap" px="xs" pb="md" gap="md">
                    {isLoading
                        ? Array(5).fill(0).map((_, i) => (
                            <Box key={i} w={cardWidth} h={cardWidth * 1.5} bg="var(--mantine-color-default-hover)"
                                 style={{borderRadius: 8}}/>
                        ))
                        : data?.map((book) => (
                            <Box key={book.id} w={cardWidth} style={{flexShrink: 0}}>
                                <BookCard book={book}/>
                            </Box>
                        ))
                    }
                </Group>
            </ScrollArea>
        </Box>
    );
};