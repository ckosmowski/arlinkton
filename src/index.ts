import * as commander from 'commander';
import * as fs from 'fs';
import * as ipc from 'node-ipc';
import * as path from 'path';
import ArchiveProcess from './ArchiveProcess';
import ArchiveQuery from './ArchiveQuery';
import ArlinktonConfig from './ArlinktonConfig';
import Shelf from './Shelf';
import chalk from "chalk";
import * as crypto from "crypto";

commander
  .option('-d --debug', 'Enable debug mode')
  .option('-c --config', 'Path to config')
  .option('-s --start', 'Start the archive service')
  .option('-r --run', 'Run the archiving once')
  .option('-x --exit', 'Exit the archiving process')
  .option('--mothball', 'Mothball current archive state')
  .option('-q --query <query>', 'Query the archive')
  .option('-l --list', 'list the found files')
  .option('--copy <target>', 'Copy all found files to target')
  .option('-a --attic <n>', 'Include last n zip files into search')
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
  const result = new ArchiveQuery(config, commander.attic, commander.copy).execute(commander.query);
  if (commander.list) {
    result.forEach(f => console.log(chalk.green(path.relative(process.cwd(), f))));
  }
}

if (commander.mothball) {
  new Shelf(config).mothball();
}

if (commander.exit) {
  ipc.config.stopRetrying = true;
  ipc.config.silent = true;
  const processId = crypto.createHash('md5').update(config.paths.in).digest("hex");
  ipc.connectTo(processId, () => {
    ipc.of[processId].on(
      'connect',
      () => {
        ipc.of[processId].emit(
          'exit',
          'doexit'
        );
      }
    );
    ipc.of[processId].on(
      'disconnect',
      () => {
        console.log("disconnected");
      }
    );
  });
}
