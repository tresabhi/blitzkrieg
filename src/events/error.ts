import { EmbedBuilder, TextChannel } from 'discord.js';
import discord from '../../discord.json' assert { type: 'json' };
import { client } from '../bot';
import { NEGATIVE_COLOR } from '../constants/colors';
import isDev from '../core/node/isDev';

const PROCESS_ERROR_EVENTS = ['uncaughtException'];
const CLIENT_ERROR_EVENTS = ['error'];

export function handleError(error: Error, command: string) {
  console.error(error);

  (
    client.guilds.cache
      .get(discord.tres_guild_id)
      ?.channels.cache.get(discord.tres_log_channel) as TextChannel
  ).send({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${client.user?.username} ran into an error`)
        .setColor(NEGATIVE_COLOR)
        .setDescription(
          `\`\`\`${[command, error.name, error.message, error.stack]
            .filter((item) => item !== undefined)
            .join('\n\n')}\`\`\``,
        ),
    ],
  });
}

export function registerErrorHandlers() {
  if (!isDev()) {
    PROCESS_ERROR_EVENTS.forEach((name) =>
      process.on(name, (error) => handleError(error, 'process error')),
    );
    CLIENT_ERROR_EVENTS.forEach((name) =>
      client.on(name, (error) => handleError(error, 'client error')),
    );
  }
}
