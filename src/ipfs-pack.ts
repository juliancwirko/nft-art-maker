import {
  accessSync,
  constants,
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { packToFs } from 'ipfs-car/pack/fs';
import { FsBlockStore } from 'ipfs-car/blockstore/fs';
import { unpackStream } from 'ipfs-car/unpack';
import { cwd, exit } from 'process';
import { getProperty, setProperty } from 'dot-prop';
import config from './config';

const basePath = cwd();
const buildDir = `${basePath}/${config.outputDirName}`;
const imagesOutputDir = `${buildDir}/${config.outputImagesDirName}`;
const jsonOutputDir = `${buildDir}/${config.outputJsonDirName}`;
const packedOutputDir = `${buildDir}/${config.outputPackedDirName}`;
const metadataFilePath = `${buildDir}/${config.outputJsonFileName}`;

const pack = async (type: string) => {
  if (!existsSync(packedOutputDir)) {
    mkdirSync(packedOutputDir);
  }
  try {
    return await packToFs({
      input: type === 'images' ? imagesOutputDir : jsonOutputDir,
      output: `${packedOutputDir}/${
        type === 'images'
          ? config.outputImagesCarFileName
          : config.outputMetadataCarFileName
      }`,
      blockstore: new FsBlockStore(),
      wrapWithDirectory: false,
    });
  } catch (e) {
    console.log(`Pack: ${(e as unknown as Error).message}`);
    exit();
  }
};

const getBaseCID = async (type: string) => {
  const inStream = createReadStream(
    `${packedOutputDir}/${
      type === 'images'
        ? config.outputImagesCarFileName
        : config.outputMetadataCarFileName
    }`
  );

  let baseCid;
  try {
    for await (const file of unpackStream(inStream)) {
      if (file.type === 'directory') {
        baseCid = file.cid.toString();
      }
    }
  } catch (e) {
    console.log(`Get CIDs: ${(e as unknown as Error).message}`);
    exit();
  }

  return baseCid;
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

const getMetadataAssetsFiles = () => {
  try {
    accessSync(jsonOutputDir, constants.R_OK | constants.W_OK);
  } catch (err) {
    console.error('No access to the metadata JSON files!');
    exit();
  }
  return readdirSync(jsonOutputDir);
};

const updateSummaryMetadataFile = (imagesBaseCid: string | undefined) => {
  const metadataFile = getMetadataFile();
  const newMetadataFile = { ...metadataFile };
  const newEditions = [...newMetadataFile.editions];
  if (newEditions && newEditions.length && imagesBaseCid) {
    const modifiedEditions = newEditions.map(
      (item: Record<string, unknown>, iteration) => {
        const edition = config.metadataSchemaMapper.edition
          ? getProperty<Record<string, unknown>, string>(
              item,
              config.metadataSchemaMapper.edition
            )
          : iteration + 1;
        setProperty(
          item,
          config.metadataSchemaMapper['image.href'],
          `https://ipfs.io/ipfs/${imagesBaseCid}/${edition}.png`
        );
        setProperty(
          item,
          config.metadataSchemaMapper['image.ipfsUri'],
          `ipfs://${imagesBaseCid}/${edition}.png`
        );
        setProperty(
          item,
          config.metadataSchemaMapper['image.ipfsCid'],
          imagesBaseCid
        );
        const imageFilename = config.metadataSchemaMapper['image.fileName'];
        setProperty(item, imageFilename, `${edition}.png`);
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

const updateMetadataFiles = (imagesBaseCid: string | undefined) => {
  const metadataAssetsList = getMetadataAssetsFiles();

  for (const metadataFile of metadataAssetsList) {
    const rawdata = readFileSync(`${jsonOutputDir}/${metadataFile}`);
    const fileJSON = JSON.parse(rawdata.toString());
    const edition = metadataFile.split('.')[0];
    setProperty(
      fileJSON,
      config.metadataSchemaMapper['image.href'],
      `https://ipfs.io/ipfs/${imagesBaseCid}/${edition}.png`
    );
    setProperty(
      fileJSON,
      config.metadataSchemaMapper['image.ipfsUri'],
      `ipfs://${imagesBaseCid}/${edition}.png`
    );
    setProperty(
      fileJSON,
      config.metadataSchemaMapper['image.ipfsCid'],
      imagesBaseCid
    );
    setProperty(
      fileJSON,
      config.metadataSchemaMapper['image.fileName'],
      `${edition}.png`
    );
    writeFileSync(
      `${jsonOutputDir}/${metadataFile}`,
      JSON.stringify(fileJSON, null, 2)
    );
  }
};

export const updateMetadadaWithBaseCID = (
  baseMetadataCID: string | undefined
) => {
  if (baseMetadataCID) {
    const metadataFile = getMetadataFile();
    const newMetadataFile = { ...metadataFile };
    newMetadataFile.metadataFilesIpfsBaseCid = baseMetadataCID;
    writeFileSync(metadataFilePath, JSON.stringify(newMetadataFile, null, 2));
  }
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

    const baseImagesCID = await getBaseCID('images');

    // Update all metadata json files with the CIDs from images car file
    updateMetadataFiles(baseImagesCID);
    updateSummaryMetadataFile(baseImagesCID);

    // Pack all updated metadata json files
    await pack('metadata');

    const baseMetadataCID = await getBaseCID('metadata');

    // Add base metadata files CID into the main metadata.json file to be used later
    updateMetadadaWithBaseCID(baseMetadataCID);

    console.log('Done! Check the output directory.');
  } catch (e) {
    console.log(`Ipfs pack: ${(e as unknown as Error).message}`);
  }
};

// The function is not part of the standard flow and should be used only when you don't want to use the pack and upload functions.
// Meaning that you want to handle it by yourself.
// Then, you need to upload images, get the CID and update all metadata JSON files using this function.
export const updateMetadataImageCID = async () => {
  const imageCid = config.overwriteImageCID;

  if (!imageCid) {
    console.log(
      'There is no "overwriteImageCID" config option set. Task will exit without rewriting files.'
    );
    return;
  }
  updateMetadataFiles(imageCid);
  updateSummaryMetadataFile(imageCid);

  console.log('Done! Check the output directory.');
};
