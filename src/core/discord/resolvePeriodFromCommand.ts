import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import { Region } from '../../constants/regions';
import getPeriodNow from '../blitzkit/getPeriodNow';
import getPeriodStart from '../blitzkit/getPeriodStart';
import getTimeDaysAgo from '../blitzkit/getTimeDaysAgo';
import { translator } from '../localization/translator';
import { PeriodType } from './addPeriodSubCommands';
import { getPeriodOptionName } from './getPeriodOptionName';

export interface ResolvedPeriod {
  name: string;
  start: number;
  end: number;
}

export default function resolvePeriodFromCommand(
  region: Region,
  interaction: ChatInputCommandInteraction<CacheType>,
  forcedPeriod?: PeriodType,
) {
  const { translate } = translator(interaction.locale);
  let name: string;
  let start: number;
  let end: number;
  const periodSubcommand = forcedPeriod
    ? forcedPeriod
    : (interaction.options.getSubcommand() as PeriodType);

  if (periodSubcommand === 'custom') {
    const startOption = interaction.options.getInteger('start', true);
    const endOption = interaction.options.getInteger('end', true);
    const startDaysAgoMin = Math.min(startOption, endOption);
    const endDaysAgoMax = Math.max(startOption, endOption);

    name = translate('bot.common.periods.custom', [
      `${startDaysAgoMin}`,
      `${endDaysAgoMax}`,
    ]);
    start = getTimeDaysAgo(region, endDaysAgoMax);
    end = getTimeDaysAgo(region, startDaysAgoMin);
  } else {
    name = getPeriodOptionName(periodSubcommand, interaction.locale);
    start = getPeriodStart(region, periodSubcommand);
    end = getPeriodNow();
  }

  return {
    name,
    start,
    end,
  } satisfies ResolvedPeriod;
}
