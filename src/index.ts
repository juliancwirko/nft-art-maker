#!/usr/bin/env node

import { argv, exit } from 'process';
import { buildSetup, checkUniqGeneratedDna, startCreating } from './nft-maker';
import { executePreviewGeneration } from './create-preview';
import { ipfsPack, updateMetadataImageCID } from './ipfs-pack';
import packageJson from '../package.json';
import { uploadCar } from './upload-car';

const COMMANDS = {
  generate: 'generate',
  preview: 'preview',
  pack: 'pack',
  check: 'check',
  upload: 'upload',
  updateImageCID: 'updateImageCID',
};

const args = argv;
const command = args ? args[2] : undefined;

// Show version number
if (command === '--version' || command === '-v') {
  console.log(packageJson.version);
  exit();
}

if (!command || !Object.keys(COMMANDS).includes(command)) {
  const availableCommands = Object.keys(COMMANDS);
  console.log(
    `Plaese provide a proper command. Available commands: ${[
      ...availableCommands,
      '--version',
      '-v',
    ].join(', ')}`
  );
  exit(9);
}

if (command === COMMANDS.generate) {
  buildSetup();
  startCreating();
}

if (command === COMMANDS.preview) {
  executePreviewGeneration();
}

if (command === COMMANDS.pack) {
  ipfsPack();
}

if (command === COMMANDS.check) {
  checkUniqGeneratedDna({ noConsole: false });
}

if (command === COMMANDS.upload) {
  uploadCar();
}

if (command === COMMANDS.updateImageCID) {
  updateMetadataImageCID();
}
