import {useState} from 'react';
import {Box, Button, Group, TextInput, Stack, Divider} from '@mantine/core';
import {IconSearch, IconX} from '@tabler/icons-react';
import {useFilterStore} from '../../store/filterStore';
import {FilterSection} from './FilterSection';
import {FilterSubmenu} from './FilterSubmenu';
import type {Filters} from '../../api/model/filters';

interface FilterPanelProps {
  filters: Filters[];
}

export const FilterPanel = ({filters}: FilterPanelProps) => {
  const {filterSearch, setFilterSearch, resetAllFilters} = useFilterStore();
  const [activeSubmenu, setActiveSubmenu] = useState<Filters | null>(null);

  const multiModeFilters = filters.filter(f => f.has_and_mode && !f.single_mode && f.id !== 'sort');
  const singleModeFilters = filters.filter(f => f.single_mode && f.id !== 'sort');

  if (activeSubmenu) {
    return <FilterSubmenu filter={activeSubmenu} onBack={() => setActiveSubmenu(null)} />;
  }

  return (
    <Stack h="100%" gap={0}>
      <Group p="sm" gap="xs" align="center">
        <TextInput
          placeholder="Поиск..."
          leftSection={<IconSearch size={16}/>}
          rightSection={filterSearch ? <IconX size={16} style={{cursor: 'pointer'}} onClick={() => setFilterSearch('')} /> : null}
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.currentTarget.value)}
          size="sm"
          clearable={false}
          style={{flex: 1, minWidth: 0}}
        />
        <Button variant="default" size="sm" onClick={resetAllFilters}>Сбросить</Button>
      </Group>
      <Divider />
      <Box p="sm" style={{flex: 1, overflow: 'auto', minHeight: 0}}>
        <Stack gap="md">
          {multiModeFilters.map(filter => (
            <FilterSection
              key={filter.id}
              filter={filter}
              onOpenSubmenu={() => setActiveSubmenu(filter)}
            />
          ))}
          {singleModeFilters.map(filter => (
            <FilterSection
              key={filter.id}
              filter={filter}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
};
