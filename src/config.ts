import { cosmiconfigSync } from 'cosmiconfig';
import { cwd } from 'process';

const explorerSync = cosmiconfigSync('nftartmaker');
const customConfig = explorerSync.search(cwd());

// You can switch between default png files and encoded SVG source
const svgBase64DataOnly =
  Boolean(customConfig?.config?.svgBase64DataOnly) || false;

// For more info check: https://github.com/juliancwirko/nft-art-maker#layers-configuration
const layerConfigurations = customConfig?.config?.layerConfigurations;

// Width and height of the image
const format = customConfig?.config?.format || {
  width: 20,
  height: 20,
};

const defaultMetadataSchemaMapper = {
  name: 'name',
  description: 'description',
  edition: 'edition',
  attributes: 'attributes',
  base64SvgDataUri: 'base64SvgDataUri',
  'image.href': 'image.href',
  'image.hash': 'image.hash',
  'image.ipfsUri': 'image.ipfsUri',
  'image.ipfsCid': 'image.ipfsCid',
  'image.fileName': 'image.fileName',
};

const metadataSchemaMapper =
  customConfig?.config?.metadataSchemaMapper || defaultMetadataSchemaMapper;

// Rarity delimiter for a file name
const rarityDelimiter = customConfig?.config?.rarityDelimiter || '#';

// Amount of tries to be able to achieve required size of the collection
const uniqueDnaTorrance = customConfig?.config?.uniqueDnaTorrance || 10000;

// Collection name
const description =
  customConfig?.config?.description || 'Your collection name here';

const nftStorageApiToken =
  customConfig?.config?.nftStorageApiToken || 'Your nft.storage API token';

// Default names for the directories and files
const layersDirName = customConfig?.config?.layersDirName || 'layers';
const outputDirName = customConfig?.config?.outputDirName || 'output';
const outputJsonDirName = customConfig?.config?.outputJsonDirName || 'json';
const outputImagesDirName =
  customConfig?.config?.outputImagesDirName || 'images';
const outputPackedDirName =
  customConfig?.config?.outputPackedDirName || 'packed';
const outputJsonFileName =
  customConfig?.config?.outputJsonFileName || 'metadata.json';
const outputImagesCarFileName =
  customConfig?.config?.outputCarFileName || 'images.car';
const outputMetadataCarFileName =
  customConfig?.config?.outputCarFileName || 'metadata.car';
const outputMetadataFileExtension =
  typeof customConfig?.config?.outputMetadataFileExtension === 'string'
    ? customConfig?.config?.outputMetadataFileExtension
    : '.json';

const editionNameFormat = customConfig?.config?.editionNameFormat || '#';

const shuffleLayerConfigurations =
  customConfig?.config?.shuffleLayerConfigurations || true;

// Parameters for the preview file
const preview = customConfig?.config?.preview || {
  thumbPerRow: 20,
  thumbWidth: 60,
  imageRatio: format.width / format.height,
  imageName: 'preview.png',
};

// Tags for your collection as string. Format: 'tag1,tag2,tag3'.
const tags = customConfig?.config?.tags || '';

// Additional metadata for the collection (not from layers)
const additionalTraitsFileName =
  customConfig?.config?.additionalTraitsFileName || '';

const config = {
  format,
  description,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  preview,
  svgBase64DataOnly,
  layersDirName,
  outputDirName,
  outputJsonDirName,
  outputImagesDirName,
  outputJsonFileName,
  outputPackedDirName,
  outputImagesCarFileName,
  outputMetadataCarFileName,
  editionNameFormat,
  shuffleLayerConfigurations,
  tags,
  metadataSchemaMapper,
  defaultMetadataSchemaMapper,
  nftStorageApiToken,
  outputMetadataFileExtension,
  additionalTraitsFileName,
};

export default config;
