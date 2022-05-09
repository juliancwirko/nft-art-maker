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
    console.log(config.layerConfigurations);
    const checkDna = checkUniqGeneratedDna({ noConsole: true });
    console.log(checkDna);
    const lastConfig =
      config.layerConfigurations[config.layerConfigurations.length - 1];
    expect(checkDna).toEqual(lastConfig.growEditionSizeTo);
  });
});
