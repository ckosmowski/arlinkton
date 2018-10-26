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
        console.log(filePath + ":" + stat.isSymbolicLink() + " => " + target);
        fs.writeFileSync(filePath + "_arl.txt", path.relative(this.config.paths.store, target));
        fs.unlinkSync(filePath);
      }
    }, (err, success) => {
      console.log(err, success);
      zip.addLocalFolder(this.config.paths.store, "store");
      zip.addLocalFolder(this.config.paths.archive, "archive");
      zip.writeZip(path.join(this.config.paths.attic, "mothballs.zip"));
      if (cb) cb();
    });

    // get everything as a buffer
    //var willSendthis = zip.toBuffer();
    // or write everything to disk

  }

}
