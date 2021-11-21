import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  accessSync,
  constants,
} from 'fs';
import { packToFs } from 'ipfs-car/pack/fs';
import { FsBlockStore } from 'ipfs-car/blockstore/fs';
import { unpackStream } from 'ipfs-car/unpack';
import { cwd, exit } from 'process';
import config from './config';

const basePath = cwd();
const buildDir = `${basePath}/${config.outputDirName}`;
const imagesOutputDir = `${buildDir}/${config.outputImagesDirName}`;
const jsonOutputDir = `${buildDir}/${config.outputJsonDirName}`;
const packedOutputDir = `${buildDir}/${config.outputPackedDirName}`;
const metadataFilePath = `${buildDir}/${config.outputJsonDirName}/${config.outputJsonFileName}`;

const pack = async (type: 'images' | 'metadata') => {
  if (!existsSync(packedOutputDir)) {
    mkdirSync(packedOutputDir);
  }
  try {
    return await packToFs({
      input: type === 'metadata' ? jsonOutputDir : imagesOutputDir,
      output: `${packedOutputDir}/${type}.car`,
      blockstore: new FsBlockStore(),
      wrapWithDirectory: false,
    });
  } catch (e) {
    console.log(`Pack: ${(e as unknown as Error).message}`);
    exit();
  }
};

interface FileInfo {
  name: string;
  cid: string;
}

const getFileCIDsList = async (type: 'images' | 'metadata') => {
  const inStream = createReadStream(`${packedOutputDir}/${type}.car`);

  const list: FileInfo[] = [];
  try {
    for await (const file of unpackStream(inStream)) {
      const { name, cid } = file;
      if (file.type === 'raw') {
        list.push({ name, cid: cid.toString() });
      }
    }
  } catch (e) {
    console.log(`Get CIDs: ${(e as unknown as Error).message}`);
    exit();
  }
  return list;
};

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

const getMetadataItemCid = (imagesInfoList: FileInfo[], fileName: string) => {
  return imagesInfoList.find((item) => item.name === fileName)?.cid;
};

const updateSummaryMetadataFile = (imagesInfoList: FileInfo[]) => {
  const metadataFile = getMetadataFile();
  const newMetadataFile = { ...metadataFile };
  const newEditions = [...newMetadataFile.editions];
  if (newEditions && newEditions.length) {
    const modifiedEditions = newEditions.map(
      (item: {
        image: { href: string };
        fileName: string;
        fileUri: string;
      }) => {
        const prevImgHref = item.image.href;
        const cid = getMetadataItemCid(imagesInfoList, prevImgHref) || '';
        item.image.href = `https://ipfs.io/ipfs/${cid}`;
        item.fileUri = `ipfs://${cid}`;
        return item;
      }
    );

    newMetadataFile.editions = modifiedEditions;

    writeFileSync(metadataFilePath, JSON.stringify(newMetadataFile, null, 2));
  } else {
    console.log("Couldn't find any items in metadata file");
    exit();
  }
};

const updateMetadataFiles = (imagesInfoList: FileInfo[]) => {
  for (const imageInfo of imagesInfoList) {
    const metadataFile = `${jsonOutputDir}/${
      imageInfo.name.split('.')[0]
    }.json`;
    const rawdata = readFileSync(metadataFile);
    const fileJSON = JSON.parse(rawdata.toString());
    fileJSON.image.href = `https://ipfs.io/ipfs/${imageInfo.cid}`;
    fileJSON.fileUri = `ipfs://${imageInfo.cid}`;
    writeFileSync(metadataFile, JSON.stringify(fileJSON, null, 2));
  }
};

const saveMetadataCIDsList = (metadataList: FileInfo[]) => {
  writeFileSync(
    `${packedOutputDir}/metadataList.json`,
    JSON.stringify(metadataList, null, 2)
  );
};

export const ipfsPack = async () => {
  if (config.svgBase64DataOnly) {
    console.log(
      'This command is applicable only for image output, not encoded inline SVGs!'
    );
    exit();
  }

  try {
    // Pack all images into ipfs car file
    await pack('images');
    const imagesList = await getFileCIDsList('images');

    // Update all metadata json files with the CIDs from images car file
    updateMetadataFiles(imagesList);
    updateSummaryMetadataFile(imagesList);

    // Pack all metadata json files
    await pack('metadata');
    const metadataList = await getFileCIDsList('metadata');

    // Sace the list of metadata json files CIDs from metadataa car file
    saveMetadataCIDsList(metadataList);

    console.log('Done! Check the output directory.');
  } catch (e) {
    console.log(`Ipfs pack: ${(e as unknown as Error).message}`);
  }
};
