import config from './config';
import { NFTStorage } from 'nft.storage';
import { CarIndexedReader } from '@ipld/car';
import { cwd, exit } from 'process';

const basePath = cwd();
const buildDir = `${basePath}/${config.outputDirName}`;
const packedOutputDir = `${buildDir}/${config.outputPackedDirName}`;
const packedImagesDir = `${packedOutputDir}/${config.outputImagesCarFileName}`;
const packedMetadataDir = `${packedOutputDir}/${config.outputMetadataCarFileName}`;
const storage = new NFTStorage({ token: config.nftStorageApiToken });
export const uploadCar = async () => {
  if (!config.nftStorageApiToken) {
    console.log('Please provide your NFT.Storage API key.');
    exit(9);
  }
  const carReaderMetadata = await CarIndexedReader.fromFile(packedMetadataDir);
  const carReaderImages = await CarIndexedReader.fromFile(packedImagesDir);
  console.log('Uploading...');
  const cidMeta = await storage.storeCar(carReaderMetadata);
  const cidImages = await storage.storeCar(carReaderImages);
  console.log(`CID of metadata: ${cidMeta}. CID of images: ${cidImages}`);
  return { cidMeta, cidImages };
};
