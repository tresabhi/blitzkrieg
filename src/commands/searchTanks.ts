import { SlashCommandBuilder } from 'discord.js';
import { go } from 'fuzzysort';
import markdownEscape from 'markdown-escape';
import addTankChoices from '../LEGACY_core/discord/addTankChoices';
import embedInfo from '../LEGACY_core/discord/embedInfo';
import { TANK_NAMES_DIACRITICS } from '../core/blitzstars/tankopedia';
import { CommandRegistry } from '../events/interactionCreate';

export const searchTanksCommand: CommandRegistry = {
  inProduction: true,
  inPublic: true,

  command: new SlashCommandBuilder()
    .setName('search-tanks')
    .setDescription('Search tanks')
    .addStringOption((option) => addTankChoices(option).setAutocomplete(false))
    .addIntegerOption((option) =>
      option
        .setName('limit')
        .setDescription('The size of the search result (default: 25)')
        .setMinValue(1)
        .setMaxValue(100),
    ),

  async handler(interaction) {
    const tank = interaction.options.getString('tank')!;
    const limit = interaction.options.getInteger('limit') ?? 25;
    const results = go(tank, await TANK_NAMES_DIACRITICS, {
      limit,
      keys: ['combined'],
    }).map((result) => result.obj.original);

    return embedInfo(
      `Tank search for "${markdownEscape(tank)}"`,
      results.length === 0
        ? 'No tanks found.'
        : `\`\`\`\n${results.join('\n')}\n\`\`\``,
    );
  },
};
