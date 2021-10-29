import { writeFileSync, readFileSync, accessSync, constants } from 'fs';
import { cwd, exit } from 'process';
import config from './config';

const basePath = cwd();
const buildDir = `${basePath}/${config.outputDirName}`;
const metadataFilePath = `${buildDir}/${config.outputJsonDirName}/${config.outputJsonFileName}`;

const getMetadataFile = () => {
  try {
    accessSync(metadataFilePath, constants.R_OK | constants.W_OK);
  } catch (err) {
    console.error('No access to the metadata JSON file!');
    exit();
  }

  const rawFile = readFileSync(metadataFilePath);
  return JSON.parse(rawFile.toString('utf8'));
};

// Updates image base URI prefix when using for example CAR with IPFS
const makeUpdateImgPaths = () => {
  const metadataFile = getMetadataFile();
  const newMetadataFile = { ...metadataFile };
  const newEditions = [...newMetadataFile.editions];
  if (newEditions && newEditions.length) {
    const modifiedEditions = newEditions.map(
      (item: { image: string; edition: string }) => {
        item.image = `${config.baseImgUri ? `${config.baseImgUri}/` : ''}${
          item.edition
        }.png`;
        return item;
      }
    );

    newMetadataFile.editions = modifiedEditions;

    writeFileSync(metadataFilePath, JSON.stringify(newMetadataFile, null, 2));
    console.log(`${config.outputJsonFileName} updated!`);
  } else {
    console.log("Couldn't find any items in metadata file");
  }
};

export const updateImgPaths = () => {
  if (config.svgBase64DataOnly) {
    console.log(
      'This command is applicable only for image output, not encoded inline SVGs!'
    );
    exit();
  }

  makeUpdateImgPaths();
};
