import config from './config';
import { NFTStorage } from 'nft.storage';
import { CarIndexedReader } from '@ipld/car';
import { cwd, exit } from 'process';
import fs from 'fs';

const basePath = cwd();
const buildDir = `${basePath}/${config.outputDirName}`;
const packedOutputDir = `${buildDir}/${config.outputPackedDirName}`;

const packedImagesCarFile = `${packedOutputDir}/${config.outputImagesCarFileName}`;
const packedMetadataCarFile = `${packedOutputDir}/${config.outputMetadataCarFileName}`;
const imagesCarFileSize = fs.statSync(packedImagesCarFile)?.size;
const metadataCarFileSize = fs.statSync(packedMetadataCarFile)?.size;

const storage = new NFTStorage({ token: config.nftStorageApiToken });

export const uploadCar = async () => {
  try {
    if (!config.nftStorageApiToken) {
      console.log('Please provide your NFT.Storage API key.');
      exit(9);
    }
    let metadataSize = 0.01;
    let imagesSize = 0.01;
    const carReaderMetadata = await CarIndexedReader.fromFile(
      packedMetadataCarFile
    );
    const carReaderImages = await CarIndexedReader.fromFile(
      packedImagesCarFile
    );
    carReaderMetadata.close();
    carReaderImages.close();
    console.log('Uploading metadata .car file...');
    const cidMeta = await storage.storeCar(carReaderMetadata, {
      maxRetries: 10,
      onStoredChunk: (size: number) => {
        metadataSize = metadataSize + size;
        const percent = Math.round((metadataSize / metadataCarFileSize) * 100);
        console.log('Upload progress: ', `${percent < 100 ? percent : 100}%`);
      },
    });
    console.log('Uploading images .car file...');
    const cidImages = await storage.storeCar(carReaderImages, {
      maxRetries: 10,
      onStoredChunk: (size: number) => {
        imagesSize = imagesSize + size;
        const percent = Math.round((imagesSize / imagesCarFileSize) * 100);
        console.log('Upload progress: ', `${percent < 100 ? percent : 100}%`);
      },
    });
    console.log('Upload finished!');
    console.log(`CID of metadata: ${cidMeta}`);
    console.log(`CID of images: ${cidImages}`);
    return { cidMeta, cidImages };
  } catch (e) {
    console.log(e);
  }
};
