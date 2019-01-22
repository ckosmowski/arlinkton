import * as fs from 'fs';
import * as path from 'path';
import FileFilter from './FileFilter';

export default class TreeWalker {
  constructor(private rootPath: string) {

  }

  public walkSync(recurse: boolean, filter?: FileFilter): string[] {
    return this.diveSync(this.rootPath, recurse, filter);
  }

  public walk(callback: (filePath: string, stat: fs.Stats) => void,
              done: (err: any, success: boolean) => void) {
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
              if (!pending) done(errd, true);
            });
          } else {
            pending = pending - 1;
            callback(filePath, stat);
            if (!(pending)) done(null, true);
          }
        });
      });
    });
  }

  private diveSync(dir, recurse: boolean, filter?: FileFilter): string[] {
    let results = [];
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      if (!file) return results;
      const filePath = path.resolve(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (recurse && (!filter || filter.acceptDir(filePath))) {
          results = results.concat(this.diveSync(filePath, recurse, filter));
        }
      } else {
        if (!filter || filter.accept(filePath)) {
          results.push(filePath);
        }
      }
    });
    return results;
  }
}
