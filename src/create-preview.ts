import { cwd } from 'process';
import fs from 'fs';
import { createCanvas, loadImage, Image } from 'canvas';
import config from './config';

const basePath = cwd();
const buildDir = `${basePath}/output`;

interface Metadata {
  name: string;
  description: string;
  edition: number;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  base64SvgDataUri: string;
  image: {
    href: string;
    hash: string;
  };
}

export const executePreviewGeneration = () => {
  // read json data
  const rawdata = fs.readFileSync(
    `${basePath}/${config.outputDirName}/${config.outputJsonFileName}`
  );
  const metadataList = JSON.parse(rawdata.toString());

  const saveProjectPreviewImage = async (_data: Metadata[]) => {
    // Extract from preview config
    const { thumbWidth, thumbPerRow, imageRatio, imageName } = config.preview;
    // Calculate height on the fly
    const thumbHeight = thumbWidth * imageRatio;
    // Prepare canvas
    const previewCanvasWidth = thumbWidth * thumbPerRow;
    const previewCanvasHeight =
      thumbHeight * Math.ceil(_data.length / thumbPerRow);
    // Shout from the mountain tops
    console.log(
      `Preparing a ${previewCanvasWidth}x${previewCanvasHeight} project preview with ${_data.length} thumbnails.`
    );

    // Initiate the canvas now that we have calculated everything
    const previewPath = `${buildDir}/${imageName}`;
    const previewCanvas = createCanvas(previewCanvasWidth, previewCanvasHeight);
    const previewCtx = previewCanvas.getContext('2d');

    // Iterate all NFTs and insert thumbnail into preview image
    // Don't want to rely on "edition" for assuming index

    const drawImageFn = (img: Image, index: number) => {
      previewCtx.drawImage(
        img,
        thumbWidth * (index % thumbPerRow),
        thumbHeight * Math.trunc(index / thumbPerRow),
        thumbWidth,
        thumbHeight
      );
    };

    if (config.svgBase64DataOnly) {
      for (let index = 0; index < _data.length; index++) {
        const nft = _data[index];
        const image = new Image();
        image.src = nft.base64SvgDataUri;
        drawImageFn(image, index);
      }
    } else {
      for (let index = 0; index < _data.length; index++) {
        const nft = _data[index];
        try {
          const image = await loadImage(
            `${buildDir}/${config.outputImagesDirName}/${nft.edition}.png`
          );
          drawImageFn(image, index);
        } catch (e) {
          console.log((e as Error)?.message);
        }
      }
    }

    // Write Project Preview to file
    fs.writeFileSync(previewPath, previewCanvas.toBuffer('image/png'));
    console.log(`Project preview image located at: ${previewPath}`);
  };

  saveProjectPreviewImage(metadataList.editions);
};
