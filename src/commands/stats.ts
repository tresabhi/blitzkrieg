import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import markdownEscape from 'markdown-escape';
import { CommandRegistry } from '../behaviors/interactionCreate.js';
import { SKILLED_COLOR } from '../constants/colors.js';
import { AccountInfo, AllStats } from '../types/accountInfo.js';
import { PeriodStatistics, PlayerStatistics } from '../types/statistics.js';
import addIGNOption from '../utilities/addIGNOption.js';
import addServerChoices from '../utilities/addServerChoices.js';
import { args } from '../utilities/args.js';
import blitzLinks from '../utilities/blitzLinks.js';
import extractUser from '../utilities/extractUser.js';
import getBlitzAccount from '../utilities/getBlitzAccount.js';
import getBlitzStarsAccount from '../utilities/getBlitzStarsAccount.js';
import getWargamingResponse from '../utilities/getWargamingResponse.js';
import poweredByBlitzStars from '../utilities/poweredByBlitzStars.js';

type Period = 'today' | '30' | '90' | 'career';

export default {
  inProduction: true,
  inDevelopment: true,
  inPublic: true,

  command: new SlashCommandBuilder()
    .setName('stats')
    .setDescription("Gets the user's in-game statistics")
    .addStringOption((option) =>
      option
        .setName('period')
        .setDescription('The last number of days of stats')
        .setChoices(
          { name: 'Today', value: 'today' satisfies Period },
          { name: '30 Days', value: '30' satisfies Period },
          { name: '90 Days', value: '90' satisfies Period },
          { name: 'Career', value: 'career' satisfies Period },
        )
        .setRequired(true),
    )
    .addStringOption(addServerChoices)
    .addStringOption(addIGNOption),

  async execute(interaction) {
    const period = interaction.options.getString('period') as Period;

    const extractedUser = await extractUser(interaction);
    if (!extractedUser) return;

    const { name, server } = extractedUser;
    const command = `stats ${server} ${name} ${period}`;

    const blitzAccount = await getBlitzAccount(interaction, name, server);
    if (!blitzAccount) return;

    const blitzStarsAccount = (await getBlitzStarsAccount(
      interaction,
      blitzAccount.account_id,
      name,
    )) as PlayerStatistics;
    if (!blitzStarsAccount) return;

    async function reply(stats: PeriodStatistics) {
      await interaction.editReply({
        embeds: [
          poweredByBlitzStars(
            new EmbedBuilder()
              .setColor(SKILLED_COLOR)
              .setTitle(
                `${markdownEscape(blitzStarsAccount.nickname)}'s ${
                  period === 'career' ? period : `${period} day`
                } stats`,
              )
              .setDescription(
                `${
                  period === 'today'
                    ? '**⚠ "Today" stats are in development. Some stats are not available/wrong.**\n\n'
                    : ''
                }${[
                  ['Winrate', `${stats.special.winrate.toFixed(2)}%`],
                  ['Survival', `${stats.special.survivalRate.toFixed(2)}%`],
                  [
                    'Accuracy',
                    `${((stats.all.hits / stats.all.shots) * 100).toFixed(2)}%`,
                  ],
                  ['WN8', stats.wn8.toFixed(0)],
                  ['WN7', stats.wn7.toFixed(0)],
                  [],
                  ['Battles', stats.all.battles],
                  ['Wins', stats.all.wins],
                  ['Losses', stats.all.losses],
                  ['Average tier', stats.avg_tier.toFixed(2)],
                  [],
                  [
                    'Shots per battle',
                    (stats.all.shots / stats.all.battles).toFixed(2),
                  ],
                  ['Hits per battle', stats.special.hpb.toFixed(2)],
                  ['Damage per battle', stats.special.dpb.toFixed(0)],
                  ['Kills per battle', stats.special.kpb.toFixed(2)],
                  ['Spots per battle', stats.special.spb.toFixed(2)],
                  [
                    'XP per battle',
                    (stats.all.xp / stats.all.battles).toFixed(0),
                  ],
                  [],
                  ['Damage ratio', stats.special.damageRatio.toFixed(2)],
                  ['Kills to death ratio', stats.special.kdr.toFixed(2)],
                ]
                  .filter((array) => array[1] !== `${-Infinity}`)
                  .map((array) =>
                    array.length === 0 ? '' : `**${array[0]}**: ${array[1]}`,
                  )
                  .join('\n')}\n\n${blitzLinks(blitzStarsAccount)}`,
              ),
          ),
        ],
      });

      console.log(`Showing ${blitzStarsAccount.nickname}'s ${period} stats`);
    }

    let stats: PeriodStatistics | null = null;

    if (period === 'career') {
      stats = blitzStarsAccount.statistics;
    } else if (period === 'today') {
      const accountInfo = await getWargamingResponse<AccountInfo>(
        `https://api.wotblitz.${server}/wotb/account/info/?application_id=${args['wargaming-application-id']}&account_id=${blitzAccount.account_id}`,
      );

      const a1 = blitzStarsAccount.statistics;
      const a2 = accountInfo[blitzAccount.account_id].statistics;

      const battles = a2.all.battles - a1.all.battles;

      function pb(value: (allStats: AllStats) => number) {
        return (value(a2.all) - value(a1.all)) / battles;
      }
      function diff(value: (allStats: AllStats) => number) {
        return value(a2.all) - value(a1.all);
      }
      function span(
        value1: (allStats: AllStats) => number,
        value2: (allStats: AllStats) => number,
      ) {
        return (
          (value1(a2.all) - value1(a1.all)) / (value2(a2.all) - value2(a1.all))
        );
      }

      stats = {
        all: {
          battles,
          capture_points: pb((a) => a.capture_points),
          damage_dealt: pb((a) => a.damage_dealt),
          damage_received: pb((a) => a.damage_received),
          dropped_capture_points: diff((a) => a.dropped_capture_points),
          frags: pb((a) => a.frags),
          frags8p: pb((a) => a.frags8p),
          hits: diff((a) => a.hits),
          losses: diff((a) => a.losses),
          max_frags: pb((a) => a.max_frags),
          max_frags_tank_id: pb((a) => a.max_frags_tank_id),
          max_xp: pb((a) => a.max_xp),
          max_xp_tank_id: pb((a) => a.max_xp_tank_id),
          shots: diff((a) => a.shots),
          spotted: pb((a) => a.spotted),
          survived_battles: pb((a) => a.survived_battles),
          win_and_survived: pb((a) => a.win_and_survived),
          wins: diff((a) => a.wins),
          xp: diff((a) => a.xp),
        },
        special: {
          winrate: pb((a) => a.wins) * 100,
          dpb: pb((a) => a.damage_dealt),
          survivalRate: pb((a) => a.survived_battles) * 100,
          damageRatio: span(
            (a) => a.damage_dealt,
            (a) => a.damage_received,
          ),
          hitRate: pb((a) => a.hits / a.shots),
          hpb: pb((a) => a.hits),
          kdr:
            diff((a) => a.frags) / diff((a) => a.battles - a.survived_battles),
          kpb: pb((a) => a.frags),
          spb: pb((a) => a.spotted),
        },

        avg_tier: -Infinity,
        pwp: -Infinity,
        wn7: -Infinity,
        wn8: -Infinity,
      };

      reply(stats);
    } else {
      stats = blitzStarsAccount[`period${period}d`];
    }

    if (stats) {
      reply(stats);
    }
  },
} satisfies CommandRegistry;
