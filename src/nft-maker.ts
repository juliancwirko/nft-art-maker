import path from 'path';
import { cwd, exit } from 'process';
import fs from 'fs';
import { createHash } from 'crypto';
import { createCanvas, loadImage, Image } from 'canvas';
import { imgToSvg } from './img-to-svg';
import { optimize, OptimizedSvg } from 'svgo';
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

interface TempMetadata {
  name: string;
  description: string;
  edition: number;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  tags?: string;
  base64SvgDataUri?: string;
  image: {
    href: string;
    hash: string;
  };
}

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
} = config;

const basePath = cwd();
const buildDir = `${basePath}/${outputDirName}`;
const layersDir = `${basePath}/${layersDirName}`;

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext('2d');

const metadataList: TempMetadata[] = [];
let attributesList: { trait_type: string; value: string }[] = [];
const dnaList: string[][] = [];

const getSortedMetadata = (metadataList: TempMetadata[]) => {
  return metadataList.sort((a, b) => a.edition - b.edition);
};

export const buildSetup = () => {
  if (!layerConfigurations) {
    console.log(
      'You have to configure layers first. See the docs on how to do it. You can also provide other settings in the config file.'
    );
    exit(9);
  }

  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
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
    nameWithoutWeight = 0;
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

const saveImage = (_editionCount: number) => {
  fs.writeFileSync(
    `${buildDir}/${outputImagesDirName}/${_editionCount}.png`,
    canvas.toBuffer('image/png')
  );
};

const addMetadata = (_dna: string[], _edition: number) => {
  const hash = createHash('sha256');

  const image = svgBase64DataOnly
    ? imgToSvg(ctx.getImageData(0, 0, format.width, format.height))
    : `${_edition}.png`;

  const dataToHash = svgBase64DataOnly
    ? (optimize(image, { multipass: true }) as OptimizedSvg).data
    : canvas.toBuffer('image/png');

  hash.update(dataToHash);

  const tempMetadata = {
    name: `${editionNameFormat}${_edition}`,
    description: description,
    edition: _edition,
    attributes: attributesList,
    tags: config.tags,
    ...(svgBase64DataOnly
      ? {
          base64SvgDataUri: (
            optimize(image, {
              multipass: true,
              datauri: 'base64',
            }) as OptimizedSvg
          ).data,
        }
      : {}),
    image: {
      href: !svgBase64DataOnly ? image : '',
      hash: hash.digest('hex'),
    },
  };

  metadataList.push(tempMetadata);

  attributesList = [];
};

const saveMetaDataSingleFile = (editionCount: number) => {
  const metadata = metadataList.find((meta) => meta.edition === editionCount);
  fs.writeFileSync(
    `${buildDir}/${outputJsonDirName}/${editionCount}.json`,
    JSON.stringify(metadata, null, 2)
  );
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
      (e) => e.id == cleanDna(_dna[index])
    );
    return {
      name: layer.name,
      opacity: layer.opacity,
      selectedElement: selectedElement as LayerElement,
    };
  });
  return mappedDnaToLayers;
};

const isDnaUnique = (_DnaList: string[][] = [], _dna: string[] = []) => {
  const foundDna = _DnaList.find((i: string[]) => i.join('') === _dna.join(''));
  return foundDna == undefined ? true : false;
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
    .map((metadataObj) => metadataObj.image.hash)
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
    while (
      editionCount <= layerConfigurations[layerConfigIndex].growEditionSizeTo
    ) {
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
          !svgBase64DataOnly && saveImage(abstractedIndexes[0]);
          addMetadata(newDna, abstractedIndexes[0]);
          !svgBase64DataOnly && saveMetaDataSingleFile(abstractedIndexes[0]);
        });
        dnaList.push(newDna);
        editionCount++;
        abstractedIndexes.shift();
      } else {
        failedCount++;
        if (failedCount >= uniqueDnaTorrance) {
          console.log(
            `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
          );
          break;
        }
      }
    }
    layerConfigIndex++;
  }

  console.log('Finished! Check out the output directory.');

  const metadata = {
    editions: getSortedMetadata(metadataList),
    provenanceHash: getProvenanceHash(),
  };

  writeMetaData(JSON.stringify(metadata, null, 2));
};
