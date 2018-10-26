import * as fs from 'fs';
import * as path from 'path';
import ArchiveProcess from './ArchiveProcess';
import ArlinktonConfig from './ArlinktonConfig';
import TreeWalker from './TreeWalker';
import Shelf from './Shelf';

const args = process.argv;
const folderArg = args[2];
const debugMode = args.includes("--debug") || args.includes("-d");

if (!folderArg) {
  console.log("The folder to watch must be specified.");
  process.exit(1);
}

const folderPath = path.resolve(folderArg);
if (debugMode) {
  console.info("Running in debug mode.");
}
console.log("Watching: ", folderPath);
const configPath = path.resolve(folderPath, "arlinkton.json");
let config = {} as ArlinktonConfig;

console.log(configPath);
if (fs.existsSync(configPath)) {
  console.log("Reading config: ", configPath);
  config = require(configPath);
}

if (!fs.existsSync(path.resolve("err"))) {
  fs.mkdirSync(path.resolve("err"));
}

if (!fs.existsSync(path.resolve("in"))) {
  fs.mkdirSync(path.resolve("in"));
}

if (debugMode) {
  console.debug("Using config:");
  console.dir(config);
}

const archiveProcess = new ArchiveProcess(folderPath, config);
archiveProcess.start();
new Shelf(archiveProcess).mothball();
