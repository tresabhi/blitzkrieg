import { SlashCommandBuilder } from 'discord.js';
import escapeHTML from 'escape-html';
import Breakdown from '../components/Breakdown.js';
import NoBattlesInPeriod from '../components/NoBattlesInPeriod.js';
import PoweredByBlitzStars from '../components/PoweredByBlitzStars.js';
import TitleBar from '../components/TitleBar.js';
import Wrapper from '../components/Wrapper.js';
import { BLITZ_SERVERS } from '../constants/servers.js';
import usernameAutocomplete from '../core/autocomplete/username.js';
import getBlitzAccount from '../core/blitz/getBlitzAccount.js';
import getWargamingResponse from '../core/blitz/getWargamingResponse.js';
import getTankStatsOverTime from '../core/blitzstars/getTankStatsOverTime.js';
import last5AM from '../core/blitzstars/last5AM.js';
import { tankopedia } from '../core/blitzstars/tankopedia.js';
import cmdName from '../core/interaction/cmdName.js';
import addUsernameOption from '../core/options/addUsernameOption.js';
import { args } from '../core/process/args.js';
import screenshotHTML from '../core/ui/screenshotHTML.js';
import { CommandRegistry } from '../events/interactionCreate.js';
import { AccountInfo, AllStats } from '../types/accountInfo.js';
import { PlayerClanData } from '../types/playerClanData.js';
import { TanksStats } from '../types/tanksStats.js';
import resolveTankName from '../utilities/resolveTankName.js';

export default {
  inProduction: true,
  inDevelopment: true,
  inPublic: true,

  command: new SlashCommandBuilder()
    .setName(cmdName('today'))
    .setDescription('A general daily breakdown of your performance')
    .addStringOption(addUsernameOption),

  async execute(interaction) {
    const username = interaction.options.getString('username')!;
    const blitzAccount = await getBlitzAccount(interaction, username);
    if (!blitzAccount) return;
    const { id, server } = blitzAccount;
    const tankStatsOverTime = await getTankStatsOverTime(
      server,
      id,
      last5AM().getTime() / 1000,
      new Date().getTime() / 1000,
    );
    if (!tankStatsOverTime) return;
    const accountInfo = await getWargamingResponse<AccountInfo>(
      `https://api.wotblitz.${server}/wotb/account/info/?application_id=${args['wargaming-application-id']}&account_id=${id}`,
    );
    if (!accountInfo) return;
    const clanData = await getWargamingResponse<PlayerClanData>(
      `https://api.wotblitz.${server}/wotb/clans/accountinfo/?application_id=${args['wargaming-application-id']}&account_id=${id}&extra=clan`,
    );
    if (!clanData) return;
    const careerTankStatsRaw = await getWargamingResponse<TanksStats>(
      `https://api.wotblitz.${server}/wotb/tanks/stats/?application_id=${args['wargaming-application-id']}&account_id=${id}`,
    );
    if (!careerTankStatsRaw) return;
    const careerStats: Record<number, AllStats> = {};

    Object.entries(careerTankStatsRaw[id]).forEach(([, tankStats]) => {
      careerStats[tankStats.tank_id] = tankStats.all;
    });

    const rows = Object.entries(tankStatsOverTime).map(
      ([tankId, tankStats]) => {
        const career = careerStats[tankId as unknown as number];

        return Breakdown.Row(
          resolveTankName({
            tank_id: tankId as unknown as number,
            name: tankopedia.data[tankId as unknown as number].name,
          }),
          tankStats.wins / tankStats.battles,
          career.wins / career.battles,
          -Infinity,
          -Infinity,
          tankStats.damage_dealt / tankStats.battles,
          career.damage_dealt / career.battles,
          (tankStats.battles - tankStats.survived_battles) / tankStats.battles,
          (career.battles - career.survived_battles) / career.battles,
          tankStats.battles,
          career.battles,
          tankopedia.data[tankId as unknown as number].images.normal,
        );
      },
    );

    const screenshot = await screenshotHTML(
      Wrapper(
        TitleBar(
          escapeHTML(accountInfo[id].nickname),
          clanData[id]?.clan ? `[${clanData[id]?.clan?.tag}]` : '',
          clanData[id]?.clan
            ? `https://wotblitz-gc.gcdn.co/icons/clanEmblems1x/clan-icon-v2-${clanData[id]?.clan?.emblem_set_id}.png`
            : undefined,
          `Today's breakdown • ${new Date().toDateString()} • ${
            BLITZ_SERVERS[server]
          }`,
        ),

        rows.length === 0 ? NoBattlesInPeriod() : Breakdown.Root(...rows),

        PoweredByBlitzStars(),
      ),
    );

    await interaction.editReply({ files: [screenshot] });

    console.log(`Showing daily breakdown for ${accountInfo[id].nickname}`);
  },

  autocomplete: usernameAutocomplete,
} satisfies CommandRegistry;
