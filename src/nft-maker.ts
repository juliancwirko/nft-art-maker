import * as path from 'path';
import { cwd, exit } from 'process';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { createCanvas, Image, loadImage } from 'canvas';
import { imgToSvg } from './img-to-svg';
import { optimize, OptimizedSvg } from 'svgo';
import * as dotProp from 'dot-prop';
import config from './config';

interface LayerElement {
  id: number;
  name: string | undefined;
  filename: string;
  path: string;
  weight: number;
}

interface Layer {
  id: number;
  name: string;
  elements: LayerElement[];
  opacity: number;
}

// Because the Metadata structure can be defined by end user, probably can be improved later
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TempMetadata = any;

const {
  format,
  description,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  svgBase64DataOnly,
  layersDirName,
  outputDirName,
  outputJsonFileName,
  outputJsonDirName,
  outputImagesDirName,
  editionNameFormat,
  shuffleLayerConfigurations,
  outputMetadataFileExtension,
  additionalTraitsFileName,
} = config;

const basePath = cwd();
const buildDir = `${basePath}/${outputDirName}`;
const layersDir = `${basePath}/${layersDirName}`;

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext('2d');

const metadataList: TempMetadata[] = [];
let attributesList: { trait_type: string; value: string }[] = [];
const dnaList = new Set();

const getSortedMetadata = (metadataList: TempMetadata[]) => {
  return metadataList.sort((a, b) => {
    const first =
      dotProp.get<number>(a, config.metadataSchemaMapper.edition) || 0;
    const second =
      dotProp.get<number>(b, config.metadataSchemaMapper.edition) || 0;
    return first - second;
  });
};

export const checkUniqueGeneratedDna = ({
  metaList = [],
  noConsole = true,
}: {
  metaList?: TempMetadata[];
  noConsole?: boolean;
}) => {
  if (metaList.length > 0) {
    return metaList.length;
  }
  const metadata = fs.readFileSync(`${buildDir}/${outputJsonFileName}`, 'utf8');
  if (metadata) {
    const itemsLength = JSON.parse(metadata).editions.length;
    !noConsole && console.log(`Generated ${itemsLength} unique items!`);
    return itemsLength;
  } else {
    console.log("Can't load main metadata file");
  }
};

export const buildSetup = () => {
  if (!layerConfigurations) {
    console.log(
      'You have to configure layers first. See the docs on how to do it. You can also provide other settings in the config file.'
    );
    exit(9);
  }

  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  !svgBase64DataOnly &&
    fs.mkdirSync(path.join(buildDir, `/${outputJsonDirName}`));
  !svgBase64DataOnly &&
    fs.mkdirSync(path.join(buildDir, `/${outputImagesDirName}`));
};

const getRarityWeight = (_str: string) => {
  const nameWithoutExtension = _str.slice(0, -4);
  let nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str: string) => {
  const dna = Number(_str.split(':').shift());
  return dna;
};

const cleanName = (_str: string) => {
  const nameWithoutExtension = _str.slice(0, -4);
  const nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

export const getElements = (path: string) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^/.]/g.test(item))
    .map((i, index) => {
      return {
        id: index,
        name: cleanName(i),
        filename: i,
        path: `${path}${i}`,
        weight: getRarityWeight(i),
      };
    });
};

const layersSetup = (layersOrder: { name: string; opacity?: number }[]) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    name: layerObj.name,
    elements: getElements(`${layersDir}/${layerObj.name}/`),
    opacity: layerObj['opacity'] != undefined ? layerObj['opacity'] : 1,
  }));
  return layers;
};

const prepareMetadataAndAssets = (_edition: number) => {
  const hash = createHash('sha256');

  const image = svgBase64DataOnly
    ? imgToSvg(ctx.getImageData(0, 0, format.width, format.height))
    : `${_edition}.png`;

  const dataToHash = svgBase64DataOnly
    ? (optimize(image, { multipass: true }) as OptimizedSvg).data
    : canvas.toBuffer('image/png');

  hash.update(dataToHash);

  if (attributesList.length > 0 && additionalTraitsFileName != '') {
    const additionalTraits = fs.readFileSync(
      `${layersDir}/${additionalTraitsFileName}`,
      'utf8'
    );
    const traitsList = JSON.parse(additionalTraits);
    const trait = traitsList[Math.floor(Math.random() * traitsList.length)];
    Object.keys(trait).forEach((key) => {
      attributesList.push({
        trait_type: key,
        value: trait[key],
      });
    });
  }

  const tempMetadata = {};

  dotProp.set(
    tempMetadata,
    config.metadataSchemaMapper.name,
    `${editionNameFormat}${_edition}`
  );
  dotProp.set(
    tempMetadata,
    config.metadataSchemaMapper.description,
    description
  );
  dotProp.set(tempMetadata, config.metadataSchemaMapper.edition, _edition);
  dotProp.set(
    tempMetadata,
    config.metadataSchemaMapper.attributes,
    attributesList
  );
  dotProp.set(tempMetadata, config.metadataSchemaMapper.tags, config.tags);
  dotProp.set(
    tempMetadata,
    config.metadataSchemaMapper['image.href'],
    !svgBase64DataOnly ? image : ''
  );
  dotProp.set(
    tempMetadata,
    config.metadataSchemaMapper['image.hash'],
    hash.digest('hex')
  );

  if (svgBase64DataOnly) {
    dotProp.set(
      tempMetadata,
      config.metadataSchemaMapper.base64SvgDataUri,
      (
        optimize(image, {
          multipass: true,
          datauri: 'base64',
        }) as OptimizedSvg
      ).data
    );
  }

  metadataList.push(tempMetadata);

  if (!svgBase64DataOnly) {
    fs.writeFileSync(
      `${buildDir}/${outputJsonDirName}/${_edition}${outputMetadataFileExtension}`,
      JSON.stringify(tempMetadata, null, 2)
    );

    fs.writeFileSync(
      `${buildDir}/${outputImagesDirName}/${_edition}.png`,
      canvas.toBuffer('image/png')
    );
  }

  attributesList = [];
};

const addAttributes = (_element: {
  layer: { opacity: number; selectedElement: LayerElement; name: string };
  loadedImage: Image;
}) => {
  const selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name || '',
  });
};

const loadLayerImg = async (_layer: {
  name: string;
  opacity: number;
  selectedElement: LayerElement;
}) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    const image = await loadImage(`${_layer.selectedElement.path}`);
    resolve({ layer: _layer, loadedImage: image });
  });
};

const drawElement = (_renderObject: {
  layer: { opacity: number; selectedElement: LayerElement; name: string };
  loadedImage: Image;
}) => {
  ctx.globalAlpha = _renderObject.layer.opacity;
  ctx.drawImage(_renderObject.loadedImage, 0, 0, format.width, format.height);
  addAttributes(_renderObject);
};

const constructLayerToDna = (_dna: string[] = [], _layers: Layer[] = []) => {
  const mappedDnaToLayers = _layers.map((layer, index) => {
    const selectedElement = layer.elements.find(
      (e) => e.id === cleanDna(_dna[index])
    );
    return {
      name: layer.name,
      opacity: layer.opacity,
      selectedElement: selectedElement as LayerElement,
    };
  });
  return mappedDnaToLayers;
};

const isDnaUnique = (_DnaList = new Set(), _dna: string[] = []) => {
  return !_DnaList.has(_dna.join(''));
};

const createDna = (_layers: Layer[]) => {
  const randNum: string[] = [];
  _layers.forEach((layer) => {
    let totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (let i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}`
        );
      }
    }
  });
  return randNum;
};

const writeMetaData = (_data: string) => {
  fs.writeFileSync(`${buildDir}/${outputJsonFileName}`, _data);
};

const getProvenanceHash = () => {
  const hash = createHash('sha256');

  const hashes = getSortedMetadata(metadataList)
    .map((metadataObj) =>
      dotProp.get<string>(
        metadataObj,
        config.metadataSchemaMapper['image.hash']
      )
    )
    .join('');
  hash.update(hashes);

  return hash.digest('hex');
};

const shuffle = (array: number[]) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

const checkLayersGrowSizeConfigValidity = (array: number[]) =>
  array.slice(1).every((e, i) => e > array[i]);

const printProgress = (editionCount: number, size: number) => {
  process.stdout.write(`#${editionCount} of ${size} processed.\r`);
};

export const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  let abstractedIndexes: number[] = [];
  if (
    !checkLayersGrowSizeConfigValidity(
      layerConfigurations.map(
        (item: { growEditionSizeTo: number }) => item.growEditionSizeTo
      )
    )
  ) {
    console.log(
      "Your 'layerConfiguration' is not valid. Please check if 'growEditionSizeTo' are ascending numbers."
    );
    exit();
  }
  for (
    let i = 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
  if (shuffleLayerConfigurations) {
    abstractedIndexes = shuffle(abstractedIndexes);
  }

  console.log('Processing, please wait!');

  while (layerConfigIndex < layerConfigurations.length) {
    const layers = layersSetup(
      layerConfigurations[layerConfigIndex].layersOrder
    );
    const growEditionSizeTo =
      layerConfigurations[layerConfigIndex].growEditionSizeTo;
    while (editionCount <= growEditionSizeTo) {
      const newDna = createDna(layers);

      if (isDnaUnique(dnaList, newDna)) {
        const results = constructLayerToDna(newDna, layers);

        const loadedElements: Promise<{
          layer: {
            opacity: number;
            selectedElement: LayerElement;
            name: string;
          };
          loadedImage: Image;
        }>[] = [];

        results.forEach((layer) => {
          loadedElements.push(
            loadLayerImg(layer) as Promise<{
              layer: {
                opacity: number;
                selectedElement: LayerElement;
                name: string;
              };
              loadedImage: Image;
            }>
          );
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          ctx.clearRect(0, 0, format.width, format.height);
          renderObjectArray.forEach((renderObject) => {
            drawElement(renderObject);
          });
          prepareMetadataAndAssets(abstractedIndexes[0]);
        });

        dnaList.add(newDna.join(''));
        printProgress(editionCount, growEditionSizeTo);
        editionCount++;
        abstractedIndexes.shift();
      } else {
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `🚨 You need more layers or elements to grow your edition to ${growEditionSizeTo} artworks! 🚨`
          );
          console.log(
            '🚨 Even if the last index of the assets is equal to the whole expected collection amount, indexes are missing. Below you will find the precise amount of assets generated. 🚨'
          );
          break;
        }
      }
    }
    layerConfigIndex++;
  }

  const metadata = {
    editions: getSortedMetadata(metadataList),
    provenanceHash: getProvenanceHash(),
  };

  console.log(
    `Check out the output directory. Generated ${checkUniqueGeneratedDna({
      metaList: metadataList,
    })} unique items!`
  );

  writeMetaData(JSON.stringify(metadata, null, 2));
};
