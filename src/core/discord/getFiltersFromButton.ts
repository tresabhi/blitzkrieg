import { ButtonInteraction } from 'discord.js';
import { TreeType } from '../../components/Tanks';
import { StatFilters } from '../statistics/filterStats';

export function getFiltersFromButton(interaction: ButtonInteraction) {
  const url = new URL(`https://example.com/${interaction.customId}`);

  return {
    nation: url.searchParams.get('nation') ?? undefined,
    tank: parseInt(url.searchParams.get('tank') ?? '0') || undefined,
    tankType: url.searchParams.get('tank-class') ?? undefined,
    treeType:
      (url.searchParams.get('tree-type') as TreeType | undefined) ?? undefined,
    tier: parseInt(url.searchParams.get('tier') ?? '0') || undefined,
  } satisfies StatFilters;
}
