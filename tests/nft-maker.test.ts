import {
  buildSetup,
  checkUniqGeneratedDna,
  startCreating,
} from '../src/nft-maker';
import config from '../src/config';

describe('nft-maker tests', () => {
  it('generate examples', async () => {
    buildSetup();
    await startCreating();
    const checkDna = checkUniqGeneratedDna({ noConsole: true });
    const lastConfig =
      config.layerConfigurations[config.layerConfigurations.length - 1];
    expect(checkDna).toEqual(lastConfig.growEditionSizeTo);
  });
});
