import * as AdmZip from 'adm-zip';
import * as fs from "fs";
import * as path from 'path';
import ArlinktonConfig from "./ArlinktonConfig";
import TreeWalker from './TreeWalker';

export default class Shelf {

  constructor(private config: ArlinktonConfig) {
  }

  public mothball(cb?: () => void) {
    // creating archives
    const zip = new AdmZip();
    // add file directly
    //var content = "inner content of the file";
    //zip.addFile("test.txt", Buffer.alloc(content.length, content), "entry comment goes here");
    // add local file
    const treeWalker = new TreeWalker(this.config.paths.archive);
    treeWalker.walk((filePath, stat) => {
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(filePath);
        const relFilePath = path.relative(this.config.paths.archive, filePath).replace(/\\/g, "/");
        const relTarget = path.relative(this.config.paths.store, target);
        console.log(`${filePath}:${stat.isSymbolicLink()} => ${target}`);
        zip.addFile(`archive/${relFilePath}_arl.txt`,
          Buffer.alloc(relTarget.length, relTarget), relTarget);
        const zipTargetName = path.join("store", path.dirname(relTarget)).replace(/\\/g, "/");
        const zipEntryName = path.join("store", relTarget).replace(/\\/g, "/")
        if (!zip.getEntry(zipEntryName)) {
          zip.addLocalFile(target, zipTargetName);
        }
        //fs.writeFileSync(`${filePath}_arl.txt`, path.relative(this.config.paths.store, target));
        fs.unlinkSync(filePath);
      }
    }, (err, success) => {
      console.log(err, success);
      //zip.addLocalFolder(this.config.paths.store, "store");
      //zip.addLocalFolder(this.config.paths.archive, "archive");

      zip.writeZip(path.join(this.config.paths.attic, `${this.getDateString()}.zip`));
      if (cb) cb();
    });

    // get everything as a buffer
    //var willSendthis = zip.toBuffer();
    // or write everything to disk

  }

  private getDateString() {
    const now = new Date();
    const result = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1)
      .toString().padStart(2, "0")}${(now.getUTCDate()
      .toString()).padStart(2, "0")}${(now.getUTCHours()
      .toString()).padStart(2, "0")}${now.getUTCMinutes()
      .toString().padStart(2, "0")}${now.getUTCSeconds()
      .toString().padStart(2, "0")}`;
    return result;
  }

}
