import { SlashCommandBuilder } from 'discord.js';
import { CYCLIC_API } from '../constants/cyclic';
import getWargamingResponse from '../core/blitz/getWargamingResponse';
import resolveTankId from '../core/blitz/resolveTankId';
import addStatTypeSubCommandGroups from '../core/discord/addStatTypeSubCommandGroups';
import autocompleteTanks from '../core/discord/autocompleteTanks';
import autocompleteUsername from '../core/discord/autocompleteUsername';
import interactionToURL from '../core/discord/interactionToURL';
import linkButton from '../core/discord/linkButton';
import primaryButton from '../core/discord/primaryButton';
import resolvePeriodFromButton from '../core/discord/resolvePeriodFromButton';
import resolvePeriodFromCommand from '../core/discord/resolvePeriodFromCommand';
import resolvePlayerFromButton from '../core/discord/resolvePlayerFromButton';
import resolvePlayerFromCommand from '../core/discord/resolvePlayerFromCommand';
import { WARGAMING_APPLICATION_ID } from '../core/node/arguments';
import { CommandRegistry } from '../events/interactionCreate';
import { StatType } from '../renderers/fullStats';
import stats from '../renderers/stats';
import { AccountInfo } from '../types/accountInfo';

export const statsCommand: CommandRegistry = {
  inProduction: true,
  inDevelopment: false,
  inPublic: true,

  command: addStatTypeSubCommandGroups(
    new SlashCommandBuilder()
      .setName('stats')
      .setDescription('In-game statistics'),
  ),

  async handler(interaction) {
    const commandGroup = interaction.options.getSubcommandGroup(
      true,
    ) as StatType;
    const player = await resolvePlayerFromCommand(interaction);
    const period = resolvePeriodFromCommand(player.server, interaction);
    const tankIdRaw = interaction.options.getString('tank')!;
    const tankId =
      commandGroup === 'tank' ? await resolveTankId(tankIdRaw) : null;
    const start = interaction.options.getInteger('start');
    const end = interaction.options.getInteger('end');
    const path = interactionToURL(interaction, {
      ...player,
      tankId,
      start,
      end,
    });
    const { nickname } = (
      await getWargamingResponse<AccountInfo>(
        `https://api.wotblitz.${player.server}/wotb/account/info/?application_id=${WARGAMING_APPLICATION_ID}&account_id=${player.id}`,
      )
    )[player.id];

    return [
      await stats(commandGroup, period, player, tankId),
      primaryButton(path, 'Refresh'),
      linkButton(`${CYCLIC_API}/${path}`, 'Embed'),
      linkButton(
        `https://www.blitzstars.com/player/${player.server}/${nickname}`,
        'BlitzStars',
      ),
    ];
  },

  autocomplete: (interaction) => {
    autocompleteUsername(interaction);
    autocompleteTanks(interaction);
  },

  async button(interaction) {
    const url = new URL(`${CYCLIC_API}/${interaction.customId}`);
    const path = url.pathname.split('/').filter(Boolean);
    const commandGroup = path[1] as StatType;
    const player = await resolvePlayerFromButton(interaction);
    const period = resolvePeriodFromButton(player.server, interaction);

    return await stats(
      commandGroup,
      period,
      player,
      parseInt(url.searchParams.get('tankId')!),
    );
  },
};
