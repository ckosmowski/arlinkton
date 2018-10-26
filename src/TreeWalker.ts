import * as fs from 'fs';
import * as path from 'path';

export default class TreeWalker {
  constructor(private rootPath: string) {

  }

  public walk(callback: (filePath: string, stat: fs.Stats) => void, done: (err: any, success: boolean) => void) {
    this.dive(this.rootPath, callback, done);
  }

  private dive(dir: string, callback, done) {
    fs.readdir(dir, (err, list) => {
      if (err) return done(err);
      let pending = list.length;
      if (!pending) return done(null, true);
      list.forEach((file) => {
        const filePath = path.resolve(dir, file);
        fs.lstat(filePath, (errf, stat) => {
          if (stat && stat.isDirectory()) {
            this.dive(filePath, callback, (errd, res) => {
              pending = pending - 1;
              console.log(pending);
              if (!pending) done(errd, true);
            });
          } else {
            pending = pending - 1;
            console.log(pending);
            callback(filePath, stat);
            if (!(pending)) done(null, true);
          }
        });
      });
    });
  }

}