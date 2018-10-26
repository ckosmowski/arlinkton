import * as chokidar from 'chokidar';
import * as fs from "fs";
import * as mkdirp from 'mkdirp';
import * as path from "path";
import ArlinktonConfig, { Tag, TagType } from './ArlinktonConfig';
import XMLParser from './XMLParser';

export default class ArchiveProcess {

  public storePath: string;
  public archivePath: string;
  public inPath: string;
  public errorPath: string;
  private acceptRegex: RegExp;
  private watcher: chokidar.FSWatcher;

  constructor(private config: ArlinktonConfig) {
    this.storePath = config.paths.store;
    this.archivePath = config.paths.archive;
    this.inPath = config.paths.in;
    this.errorPath = config.paths.error;
    this.acceptRegex = /.*/;
    if (this.config.accept) {
      this.acceptRegex = new RegExp(this.config.accept);
    }
  }

  public stop() {
    this.watcher.close();
  }

  public start() {
    this.watcher = this.createWatcher();
    // Something to use when events are received.
    const log = console.log.bind(console);
// Add event listeners.
    this.watcher.on('add', (p) => {
      log(`File ${path.relative(this.inPath, p)} has been added`);

      const fileName = path.relative(this.inPath, p);
      let destDir = "";
      let destPath = "";
      const parsed = path.parse(fileName);
      const relDir = parsed.dir;
      console.log(relDir);
      let success = false;

      if (!this.acceptRegex.test(fileName)) {
        log(`Filename does not match ${fileName}`);
        destDir = path.resolve(this.errorPath, relDir);
      } else {
        destDir = path.resolve(this.storePath, relDir);
        success = true;
      }

      destPath = path.resolve(destDir, parsed.base);
      mkdirp.sync(destDir);
      fs.renameSync(p, destPath);

      if (success) {
        this.config.tags.forEach((t) => {
          if (t.filter && !new RegExp(t.filter).test(fileName)) {
            return;
          }
          let baseString = "";

          if (t.type === TagType.FILENAME) {
            baseString = parsed.base;
            this.handleTag(t, baseString, destPath);
          }

          if (t.type === TagType.XML) {
            const xmlParser = new XMLParser();
            xmlParser.parse(destPath, t.tagNames.split(";")).then((result) => {
              Object.keys(result).forEach((key) => {
                result[key].forEach((tagString) => {
                  this.handleTag(t, tagString, destPath);
                });
              });
            }).catch((e) => {
              console.log(e);
            });
          }

        });
      }
    })
      .on('change', p => log(`File ${p} has been changed`))
      .on('unlink', p => log(`File ${p} has been removed`));

  }

  private createWatcher(): chokidar.FSWatcher {
    if (!fs.existsSync(this.inPath)) {
      mkdirp.sync(this.inPath);
    }
    return chokidar.watch(this.inPath, {
      awaitWriteFinish: true,
      ignored: /(^|[\/\\])\../,
      persistent: true
    });
  }

  private handleTag(t: Tag, baseString: string, destPath: string) {
    const tagRegex = new RegExp(t.regex);
    const result = tagRegex.exec(baseString);
    const fileNameOnly = path.parse(destPath).base;
    console.dir(result);

    const parts = t.path.split("/");
    const tagPath = parts.map((part) => {
      const value = result.groups[part];
      if (t.split && t.split[part]) {
        const splitRegex = new RegExp(t.split[part].regex, "g");
        const splitResults = [];
        let res;
        do {
          res = splitRegex.exec(value);
          if (res != null) {
            splitResults.push(res);
          }
        } while (res);
        console.log(splitResults);
        let partPath = "";
        splitResults.forEach((splitResult) => {
          const subPath = t.split[part].path.split("/")
            .map(sub => splitResult.groups[sub])
            .join("/");
          partPath = path.join(partPath, subPath);
        });
        return partPath;
      }
      return value;
    }).join("/");

    const tagDir = path.resolve(this.archivePath, t.name, tagPath);
    mkdirp.sync(tagDir);
    try {
      fs.symlinkSync(destPath, path.resolve(tagDir, fileNameOnly));
    } catch (e) {
      if (e.code !== "EEXIST") {
        throw new Error(e);
      }
    }
    console.log(tagPath);
  }
}
