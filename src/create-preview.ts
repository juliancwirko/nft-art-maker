const basePath = process.cwd();
import fs from 'fs';
import { createCanvas, loadImage, Image } from 'canvas';
const buildDir = `${basePath}/output`;

import config from './config';

export const executePreviewGeneration = () => {
  // read json data
  const rawdata = fs.readFileSync(
    `${basePath}/${config.outputDirName}/${config.outputJsonDirName}/${config.outputJsonFileName}`
  );
  const metadataList = JSON.parse(rawdata.toString());

  const saveProjectPreviewImage = async (_data: Record<string, unknown>[]) => {
    // Extract from preview config
    const { thumbWidth, thumbPerRow, imageRatio, imageName } = config.preview;
    // Calculate height on the fly
    const thumbHeight = thumbWidth * imageRatio;
    // Prepare canvas
    const previewCanvasWidth = thumbWidth * thumbPerRow;
    const previewCanvasHeight =
      thumbHeight * Math.trunc(_data.length / thumbPerRow);
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
        image.src = nft.image as string;
        drawImageFn(image, index);
      }
    } else {
      for (let index = 0; index < _data.length; index++) {
        const nft = _data[index];
        await loadImage(
          `${buildDir}/${config.outputImagesDirName}/${nft.edition}.png`
        ).then((image) => {
          drawImageFn(image, index);
        });
      }
    }

    // Write Project Preview to file
    fs.writeFileSync(previewPath, previewCanvas.toBuffer('image/png'));
    console.log(`Project preview image located at: ${previewPath}`);
  };

  saveProjectPreviewImage(metadataList);
};
