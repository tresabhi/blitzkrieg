import { decompress } from 'lz4js';
import { CdonReadStream } from '../streams/cdon';

export function superDecompress<Type>(buffer: Buffer) {
  const decompressed = Buffer.from(decompress(buffer));
  const read = new CdonReadStream(decompressed);
  return read.cdon() as Type;
}
