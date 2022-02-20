#!/usr/bin/env node

import { exit, argv } from 'process';
import { startCreating, buildSetup, checkUniqGeneratedDna } from './nft-maker';
import { executePreviewGeneration } from './create-preview';
import { ipfsPack } from './ipfs-pack';
import packageJson from '../package.json';

const COMMANDS = {
  generate: 'generate',
  preview: 'preview',
  pack: 'pack',
  check: 'check',
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
