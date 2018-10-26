import * as AdmZip from 'adm-zip';
import ArchiveProcess from './ArchiveProcess';
import * as path from 'path';
import TreeWalker from './TreeWalker';
import * as fs from "fs";

export default class Shelf {

  constructor(private archiveProcess: ArchiveProcess) {
  }

  public mothball(cb?: () => void) {
    // creating archives
    const zip = new AdmZip();
    // add file directly
    //var content = "inner content of the file";
    //zip.addFile("test.txt", Buffer.alloc(content.length, content), "entry comment goes here");
    // add local file
    const treeWalker = new TreeWalker(this.archiveProcess.archivePath);
    treeWalker.walk((filePath, stat) => {
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(filePath);
        console.log(filePath + ":" + stat.isSymbolicLink() + " => " + target);
        fs.writeFileSync(filePath + "_arl.txt", path.relative(this.archiveProcess.storePath, target));
        fs.unlinkSync(filePath);
      }
    }, (err, success) => {
      console.log(err, success);
      zip.addLocalFolder(this.archiveProcess.storePath, "store");
      zip.addLocalFolder(this.archiveProcess.archivePath, "archive");
      zip.writeZip(path.join(this.archiveProcess.folderPath, "mothballs.zip"));
      if (cb) cb();
    });

    // get everything as a buffer
    //var willSendthis = zip.toBuffer();
    // or write everything to disk

  }

}
