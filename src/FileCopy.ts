import * as path from "path";
import * as mkdirp from 'mkdirp';
import * as fs from "fs";
import * as AdmZip from 'adm-zip';
import chalk from "chalk";
import ArlinktonConfig from './ArlinktonConfig';

export default class FileCopy {

  public constructor(private config: ArlinktonConfig, private target: string) {
  }

  public doCopy(finalList: string[]) {
    const fileMap = finalList.reduce((map, fileName) => {
      let key = "_default";
      let value = fileName;
      if (fileName.includes(":")) {
        const parts = fileName.split(":");
        key = parts[0];
        value = parts[1];
      }
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(value);
      return map;
    }, {});

    if (this.target) {
      console.log(chalk.blue(`=> Copying found files to: ${this.target}\n`));
      Object.keys(fileMap).forEach((key) => {
        const values = fileMap[key];

        if (key === "_default") {
          console.log(chalk.green(`Copying ${values.length} files form archive...`))
          values.forEach((value) => {
            const filename = path.relative(this.config.paths.store, value);
            const targetPath = path.join(this.target, filename);
            try {
              mkdirp.sync(path.dirname(targetPath));
            } catch (e) {
              // nothing
            }
            fs.copyFileSync(value, targetPath);
          });
        } else if (key.includes(".zip")) {
          const zipFile = new AdmZip(`${this.config.paths.attic}/${key}`);
          console.log(chalk.green(`Copying ${values.length} files from .zip file: ${key}...`));
          values.forEach((value) => {
            if (this.target) {
              try {
                mkdirp.sync(path.dirname(
                  path.join(this.target, path.relative("store", value))));
              } catch (e) {
                // nothing
              }
              const b: Buffer = zipFile.readFile(value);
              fs.writeFileSync(path.join(this.target, path.relative("store", value)), b);
            }
          });
        }
      });
    }
  }
}
