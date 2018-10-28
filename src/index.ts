import * as fs from 'fs';
import * as path from 'path';
import ArchiveProcess from './ArchiveProcess';
import ArlinktonConfig, {Tag} from './ArlinktonConfig';
import Shelf from './Shelf';
import * as commander from 'commander';

commander
  .option('-d --debug', 'Enable debug mode')
  .option('-c --config', 'Path to config')
  .option('-s --start', 'Start the archive service')
  .option('-r --run', 'Run the archiving once')
  .option('-q --query <query>', 'Run the archiving once')
  .action((query, cmd) => {
    console.log(query, cmd);
  })
  .parse(process.argv);

let configFile = path.resolve("arlinkton.js");
if (commander.config) {
  configFile = path.resolve(commander.config);
}

const config = {
  debug: commander.debug,
  paths: {
    archive: path.resolve("archive"),
    attic: path.resolve("attic"),
    error: path.resolve("error"),
    in: path.resolve("in"),
    store: path.resolve("store")
  }
} as ArlinktonConfig;

if (configFile && fs.existsSync(configFile)) {
  console.log(`Reading config file: ${configFile}`);
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

if (commander.run) {
  archiveProcess = new ArchiveProcess(config);
  archiveProcess.start(false);
}

if (commander.query) {
  const q: string[] = commander.query.split(":");
  const queryTag: Tag = config.tags.find(tag => tag.name === q[0]);
  const tagResult = queryTag.split(q[1]);
  const queryArray = (tagResult instanceof Array ? tagResult : [tagResult]);
  const tagPath = path.join(q[0], queryArray.join("/"));
  const queryPath = path.resolve(config.paths.archive, tagPath);
  console.log(queryPath);
  fs.readdir(queryPath, (err, files: string[]) => {
    console.log(files.map(f => fs.readlinkSync(path.resolve(queryPath, f))));
  });
}
//new Shelf(archiveProcess).mothball();
