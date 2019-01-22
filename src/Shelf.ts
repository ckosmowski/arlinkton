import * as AdmZip from 'adm-zip';
import * as fs from "fs";
import * as path from 'path';
import ArlinktonConfig from "./ArlinktonConfig";
import TreeWalker from './TreeWalker';

export default class Shelf {

  constructor(private config: ArlinktonConfig) {
  }

  public mothball(cb?: () => void) {
    const zip = new AdmZip();
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
        const zipEntryName = path.join("store", relTarget).replace(/\\/g, "/");
        if (!zip.getEntry(zipEntryName)) {
          zip.addLocalFile(target, zipTargetName);
        }
        fs.unlinkSync(filePath);
      }
    }, (err, success) => {
      zip.writeZip(path.join(this.config.paths.attic, `${this.getDateString()}.zip`));
      if (cb) cb();
    });
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
