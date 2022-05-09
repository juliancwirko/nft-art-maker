import { uploadCar } from '../src/upload-car';

describe('Upload car to nft.storage', () => {
  it('Should upload the car files to nft.storage. Be sure to set ', async () => {
    const { cidMeta, cidImages } = await uploadCar();
    expect(typeof cidMeta).toBe('string');
    expect(typeof cidImages).toBe('string');
  });
});
