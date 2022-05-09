import {
  buildSetup,
  checkUniqGeneratedDna,
  startCreating,
} from '../src/nft-maker';
import config from '../src/config';
import { ipfsPack } from '../src/ipfs-pack';
import { cwd } from 'process';
import { existsSync } from 'fs';

const basePath = cwd();
const buildDir = `${basePath}/${config.outputDirName}`;
const packedOutputDir = `${buildDir}/${config.outputPackedDirName}`;
const packedImagesDir = `${packedOutputDir}/${config.outputImagesCarFileName}`;
const packedMetadataDir = `${packedOutputDir}/${config.outputMetadataCarFileName}`;

describe('nft-maker tests', () => {
  it('generate examples', async () => {
    buildSetup();
    await startCreating();
    const checkDna = checkUniqGeneratedDna({ noConsole: true });
    const lastConfig =
      config.layerConfigurations[config.layerConfigurations.length - 1];
    expect(checkDna).toEqual(lastConfig.growEditionSizeTo);
    await ipfsPack();
    expect(existsSync(packedImagesDir)).toBeTruthy();
    expect(existsSync(packedMetadataDir)).toBeTruthy();
  });
});
