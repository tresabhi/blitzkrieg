import sharp from 'sharp';
import { readDVPLFile } from '../blitz/readDVPLFile';
import { DdsStream } from '../streams/dds';
import { ToJpgOptions } from './toJpg';

export async function readTexture(
  path: string,
  options?: Partial<Omit<ToJpgOptions, 'format'>>,
) {
  const ddsTexturePath = path.replace('.tex', '.dx11.dds.dvpl');
  const decompressedDvpl = await readDVPLFile(ddsTexturePath);
  const stream = new DdsStream(decompressedDvpl);
  const ddsRaw = await stream.dds();
  const png = await sharp(ddsRaw.data, { raw: ddsRaw }).png().toBuffer();

  return png;

  // const isDds = existsSync(ddsTexturePath);
  // const resolvedTexturePath = isDds
  //   ? ddsTexturePath
  //   : ddsTexturePath.replace('.dds', '.pvr');
  // const decompressedTexture = await readDVPLFile(resolvedTexturePath);
  // const jpg = await toJpg(decompressedTexture, {
  //   ...options,
  //   format: isDds ? 'dds' : 'pvr',
  // });

  // return jpg;
}
