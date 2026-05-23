import {useEffect, useState} from 'react';
import {Center, Image, Skeleton} from '@mantine/core';
import {useQuery} from '@tanstack/react-query';
import {IconPhotoOff} from '@tabler/icons-react';
import {AXIOS_INSTANCE} from '../api/custom-instance';

interface SecureImageProps {
    hash: string;
    alt: string;
    height?: number | string;
    fit?: 'cover' | 'contain';
    token?: string;
}

const fetchImageBlob = async (hash: string, token?: string) => {
    const cleanHash = hash.replace(/\?t=\d+/, "");
    const url = token
        ? `/api/v1/share/${token}/cover/${cleanHash}?type=thumbnail`
        : `/api/v1/cover/${cleanHash}?type=thumbnail`;

    const response = await AXIOS_INSTANCE.get(url, {
        responseType: 'blob'
    });
    return response.data as Blob;
};

export const SecureImage = ({hash, alt, height = 300, fit = 'cover', token}: SecureImageProps) => {
    const {data: blob, isLoading, isError} = useQuery({
        queryKey: ['image', hash, token],
        queryFn: () => fetchImageBlob(hash, token),

        staleTime: Infinity,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
    });

    const [objectUrl, setObjectUrl] = useState<string | null>(null);

    useEffect(() => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            setObjectUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [blob]);

    if (isLoading) {
        return <Skeleton height={height} radius="md"/>;
    }

    if (isError || !blob) {
        return (
            <Center h={height} bg="gray.1">
                <IconPhotoOff color="gray"/>
            </Center>
        );
    }

    return (
        <Image
            src={objectUrl || undefined}
            alt={alt}
            height={height}
            fit={fit}
            radius="md"
            style={{transition: 'opacity 0.3s ease-in-out'}}
        />
    );
};