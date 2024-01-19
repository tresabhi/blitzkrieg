import { CacheType, ChatInputCommandInteraction } from 'discord.js';
import markdownEscape from 'markdown-escape';
import { Region } from '../../constants/regions';
import searchPlayersAcrossRegions from '../blitz/searchPlayersAcrossRegions';
import { getBlitzFromDiscord } from '../blitzkrieg/discordBlitz';
import { UserError } from '../blitzkrieg/userError';

export const serverAndIdPattern = /(com|eu|asia)\/[0-9]+/;

export interface ResolvedPlayer {
  region: Region;
  id: number;
}

export default async function resolvePlayerFromCommand(
  interaction: ChatInputCommandInteraction<CacheType>,
) {
  const commandUsername = interaction.options.getString('username');

  if (commandUsername) {
    if (serverAndIdPattern.test(commandUsername)) {
      const [server, accountId] = commandUsername.split('/');

      return {
        region: server as Region,
        id: Number(accountId),
      } satisfies ResolvedPlayer;
    } else {
      const accounts = await searchPlayersAcrossRegions(commandUsername);

      if (accounts[0]) {
        return {
          region: accounts[0].region,
          id: accounts[0].account_id,
        } satisfies ResolvedPlayer;
      } else {
        throw new UserError(
          'Could not find user',
          `I couldn't find user "${markdownEscape(
            commandUsername,
          )}". Try picking an user from the search result, typing in a valid username, or using the \`/link\` command.`,
        );
      }
    }
  } else {
    const account = await getBlitzFromDiscord(parseInt(interaction.user.id));

    if (account) {
      return { region: account.region, id: account.blitz };
    } else {
      throw new UserError(
        "You're account isn't linked with Blitzkrieg yet",
        'Use the `/link` command to get started.', // TODO: add shortcut button too
      );
    }
  }
}
