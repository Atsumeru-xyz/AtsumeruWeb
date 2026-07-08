import {Box, Checkbox, Stack, Text, UnstyledButton, Group} from '@mantine/core';
import {IconChevronRight} from '@tabler/icons-react';
import {useFilterStore} from '../../store/filterStore';
import {getFilterValueLabel, ENUM_FILTER_IDS} from '../../config/filter-value-config';
import type {Filters} from '../../api/model/filters';

interface FilterSectionProps {
  filter: Filters;
  onOpenSubmenu?: () => void;
}

export const FilterSection = ({filter, onOpenSubmenu}: FilterSectionProps) => {
  const {multiFilters, singleFilters, setSingleFilter} = useFilterStore();

  if (filter.has_and_mode && !filter.single_mode) {
    const selectedCount = (multiFilters[filter.id] ?? []).length;
    return (
      <UnstyledButton onClick={onOpenSubmenu} style={{width: '100%'}}>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" fw={500}>{filter.name}</Text>
          <Group gap={4} wrap="nowrap">
            <Text size="xs" c="dimmed">
              {selectedCount > 0 ? `${selectedCount} выбрано` : 'Любые'}
            </Text>
            <IconChevronRight size={14} color="var(--mantine-color-dimmed)"/>
          </Group>
        </Group>
      </UnstyledButton>
    );
  }

  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>{filter.name}</Text>
      <Stack gap={2}>
        {filter.values.map(value => (
          <Checkbox
            key={value}
            label={ENUM_FILTER_IDS.includes(filter.id) ? getFilterValueLabel(filter.id, value) : value}
            checked={singleFilters[filter.id] === value}
            onChange={() => setSingleFilter(filter.id, value)}
            size="xs"
          />
        ))}
      </Stack>
    </Stack>
  );
};
