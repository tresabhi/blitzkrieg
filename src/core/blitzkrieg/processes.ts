import { client } from '../discord/client';
import { discordBlitzDB } from './discordBlitzDB';

const EXIT_EVENTS = [
  'beforeExit',
  'exit',
  'SIGINT',
  'SIGTERM',
  'SIGUSR1',
  'SIGUSR2',
];

async function cleanup() {
  console.log('Cleaning up...');

  await Promise.all([discordBlitzDB.$disconnect(), client.destroy()]);

  console.log('Gracefully exiting...');

  EXIT_EVENTS.forEach((event) => process.off(event, cleanup));
  process.exit(0);
}

export function registerProcesses() {
  process.on('uncaughtException', console.error);
  client.on('error', console.error);

  EXIT_EVENTS.forEach((event) => process.on(event, cleanup));
}
