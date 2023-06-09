import { SlashCommandBuilder } from 'discord.js';
import GenericStats from '../components/GenericStats';
import NoData, { NoDataType } from '../components/NoData';
import PoweredBy, { PoweredByType } from '../components/PoweredBy';
import TitleBar from '../components/TitleBar';
import Wrapper from '../components/Wrapper';
import { BLITZ_SERVERS } from '../constants/servers';
import getBlitzClan from '../core/blitz/getBlitzClan';
import getWargamingResponse from '../core/blitz/getWargamingResponse';
import addClanChoices from '../core/discord/addClanChoices';
import autocompleteClan from '../core/discord/autocompleteClan';
import { WARGAMING_APPLICATION_ID } from '../core/node/arguments';
import { CommandRegistry } from '../events/interactionCreate';
import { AccountInfo } from '../types/accountInfo';
import { ClanInfo } from '../types/clanInfo';

const DEFAULT_THRESHOLD = 7;

export const inactiveCommand: CommandRegistry = {
  inProduction: true,
  inDevelopment: false,
  inPublic: true,

  command: new SlashCommandBuilder()
    .setName('inactive')
    .setDescription('Lists all inactive players')
    .addStringOption(addClanChoices)
    .addNumberOption((option) =>
      option
        .setName('threshold')
        .setDescription(
          `The number of days inactive (default: ${DEFAULT_THRESHOLD})`,
        )
        .setMinValue(0),
    ),

  async handler(interaction) {
    const clanName = interaction.options.getString('clan')!;
    const { server, id } = await getBlitzClan(clanName);
    const threshold =
      interaction.options.getNumber('threshold')! ?? DEFAULT_THRESHOLD;
    const time = new Date().getTime() / 1000;
    const clanData = (
      await getWargamingResponse<ClanInfo>(
        `https://api.wotblitz.${server}/wotb/clans/info/?application_id=${WARGAMING_APPLICATION_ID}&clan_id=${id}`,
      )
    )[id];
    const memberIds = clanData.members_ids;
    const accounts = await getWargamingResponse<AccountInfo>(
      `https://api.wotblitz.${server}/wotb/account/info/?application_id=${WARGAMING_APPLICATION_ID}&account_id=${memberIds.join(
        ',',
      )}`,
    );
    const inactive = memberIds
      .map((memberId) => {
        const member = accounts[memberId];
        const inactiveDays = (time - member.last_battle_time) / 60 / 60 / 24;

        return [member.nickname, inactiveDays] as [string, number];
      })
      .filter(([, inactiveDays]) => inactiveDays >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([name, days]) => [name, `${days.toFixed(0)} days`] as [string, string],
      );
    const hasInactiveMembers = inactive.length > 0;

    return (
      <Wrapper>
        <TitleBar
          name={clanData.name}
          nameDiscriminator="(Inactivity)"
          image={`https://wotblitz-gc.gcdn.co/icons/clanEmblems1x/clan-icon-v2-${clanData.emblem_set_id}.png`}
          description={`${threshold}+ Days • ${new Date().toDateString()} • ${
            BLITZ_SERVERS[server]
          }`}
        />

        {!hasInactiveMembers && <NoData type={NoDataType.PlayersInPeriod} />}
        {hasInactiveMembers && <GenericStats stats={inactive} />}

        <PoweredBy type={PoweredByType.Wargaming} />
      </Wrapper>
    );
  },

  autocomplete: autocompleteClan,
};
