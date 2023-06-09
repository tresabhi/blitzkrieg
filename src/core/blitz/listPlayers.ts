import { BlitzServer } from '../../constants/servers';
import { Account, AccountList } from '../../types/accountList';
import { WARGAMING_APPLICATION_ID } from '../node/arguments';
import getWargamingResponse from './getWargamingResponse';

export type AccountListWithServer = (Account & {
  server: 'com' | 'eu' | 'asia';
})[];

export const usernamePattern = /^[a-zA-Z0-9_]{3,24}$/;
export const usernamePatternWithoutPosition = /[a-zA-Z0-9_]{3,24}/;

export default async function listPlayers(search: string, limit = 9) {
  const trimmedSearch = search.trim();
  const normalizedLimit = Math.round(limit / 3);
  const encodedSearch = encodeURIComponent(trimmedSearch);

  if (usernamePattern.test(trimmedSearch)) {
    return (
      await Promise.all([
        getWargamingResponse<AccountList>(
          `https://api.wotblitz.com/wotb/account/list/?application_id=${WARGAMING_APPLICATION_ID}&search=${encodedSearch}&limit=${normalizedLimit}`,
        ).then(
          (value) =>
            value &&
            value.map((account) => ({
              ...account,
              server: 'com' as BlitzServer,
            })),
        ),
        getWargamingResponse<AccountList>(
          `https://api.wotblitz.eu/wotb/account/list/?application_id=${WARGAMING_APPLICATION_ID}&search=${encodedSearch}&limit=${normalizedLimit}`,
        ).then(
          (value) =>
            value &&
            value.map((account) => ({
              ...account,
              server: 'eu' as BlitzServer,
            })),
        ),
        getWargamingResponse<AccountList>(
          `https://api.wotblitz.asia/wotb/account/list/?application_id=${WARGAMING_APPLICATION_ID}&search=${encodedSearch}&limit=${normalizedLimit}`,
        ).then(
          (value) =>
            value &&
            value.map((account) => ({
              ...account,
              server: 'asia' as BlitzServer,
            })),
        ),
      ])
    )
      .filter(Boolean)
      .flat();
  } else {
    return [];
  }
}
