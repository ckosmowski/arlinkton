import * as fs from 'fs';
import * as path from 'path';
import ArchiveProcess from './ArchiveProcess';
import ArlinktonConfig from './ArlinktonConfig';
import Shelf from './Shelf';
import * as commander from 'commander';

commander.option('-d --debug', 'Enable debug mode')
  .option('-c --config', 'Path to config')
  .option('-s --start', 'Start the archive service')
  .parse(process.argv);

let configFile = path.resolve("arlinkton.json");
if (commander.config) {
  configFile = path.resolve(commander.config);
}

const config = {
  paths: {
    archive: path.resolve("archive"),
    attic: path.resolve("attic"),
    error: path.resolve("error"),
    in: path.resolve("in"),
    store: path.resolve("store")
  }
} as ArlinktonConfig;

if (configFile && fs.existsSync(configFile)) {
  console.log(`Reading config file: ${configFile}`)
  Object.assign(config, require(configFile));
}

if (commander.debug) {
  console.info("Running in debug mode.");
}

if (!fs.existsSync(config.paths.error)) {
  fs.mkdirSync(config.paths.error);
}

if (commander.debug) {
  console.debug("Using config:");
  console.dir(config);
}
let archiveProcess;
if (commander.start) {
  archiveProcess = new ArchiveProcess(config);
  archiveProcess.start();
}
//new Shelf(archiveProcess).mothball();
