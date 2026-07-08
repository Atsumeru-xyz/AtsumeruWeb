import {useState} from 'react';
import {Box, Button, Checkbox, Group, Stack, Text, TextInput, UnstyledButton, Divider} from '@mantine/core';
import {IconArrowLeft, IconSearch, IconPlus, IconMinus} from '@tabler/icons-react';
import {useTranslation} from 'react-i18next';
import {useFilterStore} from '../../store/filterStore';
import {getFilterValueLabel, ENUM_FILTER_IDS} from '../../config/filter-value-config';
import type {Filters} from '../../api/model/filters';

interface FilterSubmenuProps {
  filter: Filters;
  onBack: () => void;
}

type ValueState = 'none' | 'include' | 'exclude';

const ENUM_VALUE_KEYS: Record<string, Record<string, string>> = {
  status: {
    UNKNOWN: 'status_unknown', ONGOING: 'status_ongoing', COMPLETE: 'status_complete',
    SINGLE: 'status_single', LICENSED: 'status_licensed', ANNOUNCEMENT: 'status_announcement',
    ON_HOLD: 'status_on_hold', CANCELED: 'status_canceled', EMPTY: 'status_empty',
    NOT_RELEASED: 'status_not_released', ANTHOLOGY: 'status_anthology', MAGAZINE: 'status_magazine',
  },
  type: {
    UNKNOWN: 'content_type_unknown', MANGA: 'content_type_manga', MANHWA: 'content_type_manhwa',
    MANHUA: 'content_type_manhua', WEBCOMICS: 'content_type_webcomics', COMICS: 'content_type_comics',
    DOUJINSHI: 'content_type_doujinshi', RUMANGA: 'content_type_rumanga', OEL_MANGA: 'content_type_oel_manga',
    LIGHT_NOVEL: 'content_type_light_novel', NOVEL: 'content_type_novel', BOOK: 'content_type_book',
  },
  genres: {
    '0': 'genre_action', '1': 'genre_adult', '2': 'genre_adventure', '3': 'genre_comedy',
    '4': 'genre_doujinshi', '5': 'genre_drama', '6': 'genre_ecchi', '7': 'genre_fantasy',
    '8': 'genre_gender_bender', '9': 'genre_harem', '10': 'genre_historical', '11': 'genre_horror',
    '12': 'genre_josei', '13': 'genre_magic', '14': 'genre_martial_arts', '15': 'genre_mecha',
    '16': 'genre_mystery', '17': 'genre_oneshot', '18': 'genre_psychological', '19': 'genre_romance',
    '20': 'genre_school_life', '21': 'genre_sci_fi', '22': 'genre_seinen', '23': 'genre_shoujo',
    '24': 'genre_shoujo_ai', '25': 'genre_shounen', '26': 'genre_shounen_ai', '27': 'genre_slice_of_life',
    '28': 'genre_sports', '29': 'genre_supernatural', '30': 'genre_tragedy', '31': 'genre_yaoi',
    '32': 'genre_yuri',
  },
  translation_status: {
    UNKNOWN: 'translation_status_unknown', ONGOING: 'translation_status_ongoing',
    COMPLETE: 'translation_status_complete', ON_HOLD: 'translation_status_on_hold',
    DROPPED: 'translation_status_dropped',
  },
  plot_type: {
    UNKNOWN: 'plot_type_unknown', MAIN_STORY: 'plot_type_main_story',
    ALTERNATIVE_STORY: 'plot_type_alternative_story', PREQUEL: 'plot_type_prequel',
    SEQUEL: 'plot_type_sequel', ADAPTATION: 'plot_type_adaptation', SPIN_OFF: 'plot_type_spin_off',
    OTHER: 'plot_type_other',
  },
  censorship: {
    UNKNOWN: 'censorship_unknown', CENSORED: 'censorship_censored',
    UNCENSORED: 'censorship_uncensored', DECENSORED: 'censorship_decensored',
    PARTIALLY_CENSORED: 'censorship_partially_censored', MOSAIC_CENSORSHIP: 'censorship_mosaic_censorship',
  },
  color: {
    UNKNOWN: 'color_unknown', MONOCHROME: 'color_monochrome',
    PARTIALLY_COLORED: 'color_partially_colored', FULL_COLOR: 'color_full_color',
    COLORED: 'color_colored',
  },
  age_rating: {
    UNKNOWN: 'age_rating_unknown', EVERYONE: 'age_rating_everyone',
    EVERYONE_TEN_PLUS: 'age_rating_everyone_ten_plus', TEEN: 'age_rating_teen',
    MATURE: 'age_rating_mature', ADULTS_ONLY: 'age_rating_adults_only',
  },
};

export const FilterSubmenu = ({filter, onBack}: FilterSubmenuProps) => {
  const {t} = useTranslation();
  const {multiFilters, strictMatch, setMultiFilter, setStrictMatch} = useFilterStore();
  const [search, setSearch] = useState('');

  const selectedValues = multiFilters[filter.id] ?? [];

  const getState = (value: string): ValueState => {
    if (selectedValues.includes(value)) return 'include';
    if (selectedValues.includes(`-${value}`)) return 'exclude';
    return 'none';
  };

  const cycleState = (value: string) => {
    const current = getState(value);
    let next: string[];

    if (current === 'none') {
      next = [...selectedValues, value];
    } else if (current === 'include') {
      next = selectedValues.map(v => v === value ? `-${value}` : v);
    } else {
      next = selectedValues.filter(v => v !== `-${value}`);
    }

    setMultiFilter(filter.id, next);
  };

  const getLocalizedLabel = (value: string): string => {
    const keys = ENUM_VALUE_KEYS[filter.id];
    if (keys && keys[value]) return t(keys[value]);
    return value;
  };

  const matchesSearch = (value: string): boolean => {
    const q = search.toLowerCase();
    if (value.toLowerCase().includes(q)) return true;
    return getLocalizedLabel(value).toLowerCase().includes(q);
  };

  const filteredValues = search
    ? filter.values.filter(matchesSearch)
    : filter.values;

  return (
    <Stack h="100%" gap={0}>
      <Group p="sm" justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <UnstyledButton onClick={onBack}>
            <IconArrowLeft size={20}/>
          </UnstyledButton>
          <Text fw={600}>{filter.name}</Text>
        </Group>
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => setMultiFilter(filter.id, [])}
        >
          сбросить
        </Button>
      </Group>
      <Divider />
      <Box p="sm">
        <TextInput
          placeholder={`Фильтр по ${filter.name.toLowerCase()}...`}
          leftSection={<IconSearch size={16}/>}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          size="sm"
        />
      </Box>
      <Group px="sm" pb="xs">
        <Checkbox
          label="Строгое совпадение"
          checked={strictMatch}
          onChange={(e) => setStrictMatch(e.currentTarget.checked)}
          size="sm"
        />
      </Group>
      <Divider />
      <Box p="sm" style={{flex: 1, overflow: 'auto', minHeight: 0}}>
        <Stack gap={2}>
          {filteredValues.map(value => {
            const state = getState(value);
            return (
              <Group
                key={value}
                gap="sm"
                p={4}
                style={{cursor: 'pointer', borderRadius: 'var(--mantine-radius-sm)'}}
                onClick={() => cycleState(value)}
                wrap="nowrap"
              >
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: state === 'none' ? '1px solid var(--mantine-color-default-border)' : 'none',
                    background: state === 'include' ? 'var(--mantine-color-green-filled)' :
                                state === 'exclude' ? 'var(--mantine-color-red-filled)' : 'transparent',
                  }}
                >
                  {state === 'include' && <IconPlus size={12} color="white"/>}
                  {state === 'exclude' && <IconMinus size={12} color="white"/>}
                </Box>
                <Text size="sm">{getLocalizedLabel(value)}</Text>
              </Group>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
};
