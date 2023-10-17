import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { COMMANDS_RAW, CommandRegistry } from '../events/interactionCreate';

const RAW_PATH = `https://raw.githubusercontent.com/tresabhi/blitzkrieg/main/docs/`;
const DOCS = {
  permissions: 'guide/permissions',
  embeds: 'guide/embeds',
  introduction: 'guide/introduction',
  invite: 'guide/invite',
  timezones: 'guide/timezones',
};
const DOC_DESCRIPTIONS: Record<keyof typeof DOCS, string> = {
  permissions: 'The permissions needed for the bot to function',
  embeds: 'How embeds work',
  introduction: 'About the bot',
  invite: 'How to invite the bot',
  timezones: 'How Blitzkrieg infers and uses your timezone',
};

function addDocsSubcommands(option: SlashCommandSubcommandsOnlyBuilder) {
  Object.entries(DOC_DESCRIPTIONS).forEach(([key, value]) => {
    option.addSubcommand((sub) => sub.setName(key).setDescription(value));
  });

  return option;
}

export const aboutCommand: CommandRegistry = {
  inProduction: true,
  inPublic: true,

  command: addDocsSubcommands(
    new SlashCommandBuilder()
      .setName('about')
      .setDescription('All the info you need about the bot')
      .addSubcommand((option) =>
        option
          .setName('commands')
          .setDescription('List of all commands and their descriptions'),
      ),
  ),

  async handler(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'commands') {
      return `# Commands\n\nBlitzkrieg offers the following commands:\n\n${(
        await Promise.all(COMMANDS_RAW)
      )
        .filter((registry) => registry.inPublic && registry.inProduction)
        .sort((a, b) => (a.command.name < b.command.name ? -1 : 1))
        .map(
          (registry) =>
            `- \`/${registry.command.name}\`: ${registry.command.description}`,
        )
        .join('\n')}`;
    }

    const url = `${RAW_PATH}${DOCS[subcommand as keyof typeof DOCS]}.md`;
    const content = fetch(url).then((response) => response.text());

    return content;
  },
};
