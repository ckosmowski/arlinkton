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

  private tagHandlers = {
    filename: this.handleFilenameTags.bind(this),
    xml: this.handleXMLTags.bind(this)
  };

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

  public start(persistent?: boolean) {
    this.watcher = this.createWatcher(persistent);
    const log = console.log.bind(console);
    this.watcher.on('add', (p) => {
      // log(`File ${path.relative(this.inPath, p)} has been added`);

      const fileName = path.relative(this.inPath, p);
      let destDir = "";
      let destPath = "";
      const parsed = path.parse(fileName);
      const relDir = parsed.dir;
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

        const tagsByType: {[key: string]: Tag[]} = this.config.tags
          .reduce(((previousValue, tag: Tag) => {
            previousValue[tag.type] = previousValue[tag.type] || [];
            previousValue[tag.type].push(tag);
            return previousValue;
          }), {});

        Object.keys(tagsByType).forEach((key) => {
          console.log(key);
          const tags = tagsByType[key];
          this.tagHandlers[key.toString().toLowerCase()](destPath, tags);
        });
      }
    })
      .on('change', p => log(`File ${p} has been changed`))
      .on('unlink', p => log(`File ${p} has been removed`));

  }

  private handleTag(t: Tag, baseString: string, destPath: string) {
    const tagRegex = new RegExp(t.regex);
    const result = tagRegex.exec(baseString);
    const fileNameOnly = path.parse(destPath).base;

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
      const tagFile = path.resolve(tagDir, fileNameOnly);
      fs.symlinkSync(destPath, tagFile);
      if (this.config.debug) {
        console.log(`${path.relative(this.config.paths.store,
          destPath)} => ${path.relative(this.archivePath, tagFile)}`);
      }
    } catch (e) {
      if (e.code !== "EEXIST") {
        throw new Error(e);
      }
    }
  }

  private handleFilenameTags(destPath: string, tags: Tag[]) {
    const fileName = path.parse(destPath).base;
    tags.forEach((tag) => {
      if (tag.filter && !new RegExp(tag.filter).test(fileName)) {
        return;
      }
      this.handleTag(tag, fileName, destPath);
    });
  }

  private handleXMLTags(destPath: string, tags: Tag[]) {
    const fileName = path.parse(destPath).base;
    const activeTags = tags.filter((tag) => {
      return !tag.filter || new RegExp(tag.filter).test(fileName);
    });
    const tagNames = activeTags.map(tag => tag.tagNames);
    const xmlParser = new XMLParser();
    xmlParser.parse(destPath, tagNames).then((result) => {
      Object.keys(result).forEach((key) => {
        result[key].forEach((tagString) => {
          const t = activeTags.find(tag => tag.tagNames.split(":")[1] === key);
          if (t) {
            this.handleTag(t, tagString, destPath);
          }
        });
      });
    }).catch((e) => {
      console.log("Failed to parse xml: ", e);
    });
  }

  private createWatcher(persistent: boolean = true): chokidar.FSWatcher {
    if (!fs.existsSync(this.inPath)) {
      mkdirp.sync(this.inPath);
    }
    return chokidar.watch(this.inPath, {
      awaitWriteFinish: true,
      ignored: /(^|[\/\\])\../,
      persistent
    });
  }
}
