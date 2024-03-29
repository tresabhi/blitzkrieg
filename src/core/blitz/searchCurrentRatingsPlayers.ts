import { Region } from '../../constants/regions';
import { context } from '../blitzkrieg/context';
import regionToRegionSubdomain from './regionToRegionSubdomain';

type CurrentRatingsPlayerSearch = Record<
  number,
  {
    spa_id: number;
    nickname: string;
    clan_tag: string;
  } & (
    | {
        skip: true;
      }
    | {
        skip: false;
        mmr: number;
        season_number: number;
        calibrationBattlesLeft: number;
        number: number;
        updated_at: string;
        neighbors: [];
      }
  )
>;

export async function searchCurrentRatingsPlayers(
  region: Region,
  name: string,
) {
  const encodedSearch = encodeURIComponent(name);
  const response = await fetch(
    context === 'website'
      ? `/api/${region}/ratings/current/search/${encodedSearch}`
      : `https://${regionToRegionSubdomain(
          region,
        )}.wotblitz.com/en/api/rating-leaderboards/search/?prefix=${encodedSearch}`,
    { cache: 'no-store' },
  );
  const accountList = (await response.json()) as CurrentRatingsPlayerSearch;

  return accountList;
}
