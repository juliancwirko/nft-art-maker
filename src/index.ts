#!/usr/bin/env node

import { exit, argv } from 'process';
import { startCreating, buildSetup } from './nft-maker';
import { executePreviewGeneration } from './create-preview';
import packageJson from '../package.json';

const COMMANDS = {
  generate: 'generate',
  preview: 'preview',
};

const args = argv;
const command = args ? args[2] : undefined;

// Show version number
if (command === '--version' || command === '-v') {
  console.log(packageJson.version);
  exit();
}

if (!command || !Object.keys(COMMANDS).includes(command)) {
  console.log(
    `Plaese provide a proper command. Available commands: ['${COMMANDS.generate}', '${COMMANDS.preview}', '--version', '-v']`
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