import { BLITZ_SERVERS, BlitzServer } from '../../constants/servers';
import { TanksStats } from '../../types/tanksStats';
import { WARGAMING_APPLICATION_ID } from '../node/arguments';
import throwError from '../node/throwError';
import getWargamingResponse from './getWargamingResponse';

export default async function getTankStats(server: BlitzServer, id: number) {
  const tankStats = await getWargamingResponse<TanksStats>(
    `https://api.wotblitz.${server}/wotb/tanks/stats/?application_id=${WARGAMING_APPLICATION_ID}&account_id=${id}`,
  );

  if (tankStats[id] === null) {
    throw throwError(
      'No tank stats available',
      `Wargaming says there is no tank stats for this account. This account may not have any battles/tanks or exist in the ${BLITZ_SERVERS[server]} server.`,
    );
  }

  return tankStats[id];
}
