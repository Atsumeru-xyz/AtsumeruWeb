import {useEffect, useRef, useState} from 'react';
import {Modal, Progress, Stack, Text} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {AXIOS_INSTANCE} from '../api/custom-instance';
import {I18N} from './I18N';
import {useTranslation} from 'react-i18next';

interface ImportStatusSnake {
    import_active?: boolean;
    active?: boolean;
    last_start_time?: number;
    running_ms?: number;
    imported?: number;
    total?: number;
    percent?: number;
}

interface MetadataUpdateStatusSnake {
    metadata_update_active?: boolean;
    update_active?: boolean;
    updateActive?: boolean;
    running_ms?: number;
    updated?: number;
    total?: number;
    percent?: number;
}

interface CoversCachingStatusSnake {
    covers_caching_active?: boolean;
    coversCachingActive?: boolean;
    running_ms?: number;
    saved?: number;
    total?: number;
    percent?: number;
}

interface ServicesStatusSnake {
    importer?: ImportStatusSnake;
    metadata_update?: MetadataUpdateStatusSnake;
    covers_caching?: CoversCachingStatusSnake;
}

const POLL_INTERVAL = 1000;

export function ServerStatusOverlay() {
    const {t} = useTranslation();
    const [importing, setImporting] = useState(false);
    const [updatingMeta, setUpdatingMeta] = useState(false);
    const [cachingCovers, setCachingCovers] = useState(false);
    const [importInfo, setImportInfo] = useState<{imported: number; total: number; percent: number}>({imported: 0, total: 0, percent: 0});
    const [metaInfo, setMetaInfo] = useState<{updated: number; total: number; percent: number}>({updated: 0, total: 0, percent: 0});
    const [cacheInfo, setCacheInfo] = useState<{saved: number; total: number; percent: number}>({saved: 0, total: 0, percent: 0});
    const notifyIdRef = useRef<string | null>(null);
    const wasCachingRef = useRef(false);

    useEffect(() => {
        const poll = async () => {
            try {
                const res = await AXIOS_INSTANCE.get('/api/v1/services/status');
                const data = res.data as ServicesStatusSnake;

                const imp = data.importer || {};
                const isImporting = !!(imp.import_active ?? imp.active);
                setImporting(isImporting);
                setImportInfo({
                    imported: imp.imported ?? 0,
                    total: imp.total ?? 0,
                    percent: imp.percent ?? 0,
                });

                const meta = data.metadata_update || {};
                const isUpdating = !!(meta.metadata_update_active ?? meta.update_active ?? meta.updateActive);
                setUpdatingMeta(isUpdating);
                setMetaInfo({
                    updated: meta.updated ?? 0,
                    total: meta.total ?? 0,
                    percent: meta.percent ?? 0,
                });

                const cache = data.covers_caching || {};
                const isCaching = !!(cache.covers_caching_active ?? cache.coversCachingActive);
                setCachingCovers(isCaching);
                setCacheInfo({
                    saved: cache.saved ?? 0,
                    total: cache.total ?? 0,
                    percent: cache.percent ?? 0,
                });

                if (isCaching && !notifyIdRef.current) {
                    wasCachingRef.current = true;
                    notifyIdRef.current = notifications.show({
                        id: 'covers-caching',
                        loading: true,
                        title: t('settings_covers_caching'),
                        message: t('settings_covers_caching_progress', {
                            saved: cache.saved ?? 0,
                            total: cache.total ?? 0,
                            percent: Math.round(cache.percent ?? 0),
                        }),
                        autoClose: false,
                        withCloseButton: false,
                    });
                } else if (isCaching && notifyIdRef.current) {
                    notifications.update({
                        id: notifyIdRef.current,
                        loading: true,
                        title: t('settings_covers_caching'),
                        message: t('settings_covers_caching_progress', {
                            saved: cache.saved ?? 0,
                            total: cache.total ?? 0,
                            percent: Math.round(cache.percent ?? 0),
                        }),
                        autoClose: false,
                        withCloseButton: false,
                    });
                } else if (!isCaching && notifyIdRef.current) {
                    notifications.hide(notifyIdRef.current);
                    notifyIdRef.current = null;
                    if (wasCachingRef.current) {
                        wasCachingRef.current = false;
                        notifications.show({
                            title: t('settings_covers_caching'),
                            message: t('settings_covers_caching_done'),
                            color: 'green',
                        });
                    }
                }
            } catch {
                // silently ignore polling errors
            }
        };

        poll();
        const interval = setInterval(poll, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [t]);

    const blocked = importing || updatingMeta;
    const importPercent = Math.min(100, Math.max(0, Math.round(importInfo.percent * 100) || 0));
    const metaPercent = Math.min(100, Math.max(0, Math.round(metaInfo.percent * 100) || 0));

    return (
        <Modal
            opened={blocked}
            onClose={() => {}}
            closeOnClickOutside={false}
            closeOnEscape={false}
            withCloseButton={false}
            title={importing ? <I18N>settings_importing_title</I18N> : <I18N>settings_updating_meta_title</I18N>}
            centered
            size="sm"
        >
            <Stack>
                {importing && (
                    <Stack gap={4}>
                        <Text size="sm"><I18N values={{
                            imported: importInfo.imported,
                            total: importInfo.total,
                        }}>settings_importing_progress</I18N></Text>
                        <Progress value={importPercent} animated striped/>
                    </Stack>
                )}
                {updatingMeta && (
                    <Stack gap={4}>
                        <Text size="sm"><I18N values={{
                            updated: metaInfo.updated,
                            total: metaInfo.total,
                        }}>settings_updating_meta_progress</I18N></Text>
                        <Progress value={metaPercent} animated striped/>
                    </Stack>
                )}
            </Stack>
        </Modal>
    );
}
