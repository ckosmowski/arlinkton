import * as exp from 'expressionify';
import * as fs from "fs";
import * as path from "path";
import ArlinktonConfig, { Tag } from './ArlinktonConfig';
import TreeWalker from './TreeWalker';
import * as mkdirp from 'mkdirp';
import * as AdmZip from 'adm-zip';

export default class ArchiveQuery {

  private listOperators = {
    AND: {
      execute: this.listAnd.bind(this),
      priority: 2,
      type: 'binary'
    },
    OR: {
      execute: this.listOr.bind(this),
      priority: 1,
      type: 'binary'
    }
  };

  private evaluateExpression = exp({
    operators: this.listOperators,
    parseOperand: this.parseOperand.bind(this)
  });

  constructor(private config: ArlinktonConfig, private attic: number, private target: string) {
  }

  public execute(query: string): string[] {
    const finalList =  this.evaluateExpression(query);

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
      console.log(`Copying found files to: ${this.target}`)
      Object.keys(fileMap).forEach((key) => {
        const values = fileMap[key];

        if (key === "_default") {
          console.log(`Copying ${values.length} files form archive...`)
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
          console.log(`Copying ${values.length} files from .zip file: ${key}...`);
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

    return finalList;
  }

  private listOr(x: string[], y: string[]) {
    return [...new Set(x.concat(y))];
  }

  private listAnd(x: string[], y: string[]) {
    return [...new Set(x.filter(e => y.includes(e)))];
  }

  private parseOperand(operand: string) {
    const [tag, query] = operand.split(":");
    const queryTag: Tag = this.config.tags.find(t => t.name === tag);
    const tagResult = queryTag.query ? queryTag.query(query) : queryTag.split(query);
    const queryArray = (tagResult instanceof Array ? tagResult : [tagResult]);
    const tagPath = path.join(tag, queryArray.join("/"));
    const queryPath = path.resolve(this.config.paths.archive, tagPath);
    const atticPath = this.config.paths.attic;

    let result = [];

    if (fs.existsSync(queryPath)) {
      const walker = new TreeWalker(queryPath);
      result = walker.walkSync();
    }
    result = result.map((f) => {
      const source = fs.readlinkSync(path.resolve(queryPath, f));
      return source;
    });

    if (this.attic && fs.existsSync(atticPath)) {
      let list = fs.readdirSync(atticPath);
      list.sort((a, b) => {
        return a.split(".")[0].localeCompare(b.split(".")[0]);
      });
      list = list.slice(0, this.attic);
      console.log(`Searching in archive and in the following .zip files:`);
      list.forEach(el => console.log(path.relative(process.cwd(), path.join(atticPath, el))));
      list.forEach((filename) => {
        const zipFile = new AdmZip(`${atticPath}/${filename}`);
        const entryPath = `archive/${tagPath}`.replace(/\\/g, "/");
        const entry = zipFile.getEntries();
        entry.forEach((en) => {
          // console.log(en.entryName.replace(/\\/g, "/"));
          // console.log(entryPath);
          if (en.entryName.replace(/\\/g, "/").startsWith(entryPath)) {
            const storePath = `store/${zipFile.readAsText(en.entryName, "UTF-8")}`;
            result.push(`${filename}:${storePath}`);
          }
        });
        // console.dir(zipFile);
        // console.log(entryPath);
        // console.dir(entry);
      });
    }

    return result;

  }

}
