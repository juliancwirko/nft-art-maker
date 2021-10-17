import path from 'path';
import fs from 'fs';
import sha1 from 'sha1';
import { createCanvas, loadImage, Image } from 'canvas';
import { imgToSvg } from './img-to-svg';
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

const {
  format,
  description,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  svgBase64DataOnly,
  layersDirName,
  outputDirName,
  outputJsonDirName,
  outputImagesDirName,
  outputJsonFileName,
} = config;

const basePath = process.cwd();
const buildDir = `${basePath}/${outputDirName}`;
const layersDir = `${basePath}/${layersDirName}`;

const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext('2d');

const metadataList: { edition: number }[] = [];
let attributesList: { trait_type: string; value: string }[] = [];
const dnaList: string[][] = [];

export const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
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
  const dateTime = Date.now();
  const tempMetadata = {
    dna: sha1(_dna.join('')),
    name: `#${_edition}`,
    description: description,
    image: svgBase64DataOnly
      ? imgToSvg(ctx.getImageData(0, 0, format.width, format.height))
      : `${_edition}.png`,
    edition: _edition,
    date: dateTime,
    attributes: attributesList,
  };
  metadataList.push(tempMetadata);
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
  fs.writeFileSync(
    `${buildDir}/${outputJsonDirName}/${outputJsonFileName}`,
    _data
  );
};

export const startCreating = async () => {
  let layerConfigIndex = 0;
  let editionCount = 1;
  let failedCount = 0;
  const abstractedIndexes: number[] = [];
  for (
    let i = 1;
    i <= layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo;
    i++
  ) {
    abstractedIndexes.push(i);
  }
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
          console.log(
            `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
              newDna.join('')
            )}`
          );
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
  writeMetaData(JSON.stringify(metadataList, null, 2));
};
