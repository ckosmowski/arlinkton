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

  constructor(private config: ArlinktonConfig, private attic: boolean, private target: string) {
  }

  public execute(query: string): string[] {
    return this.evaluateExpression(query);
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
      const filename = path.relative(this.config.paths.store, source);
      if (this.target) {
        const targetPath = path.join(this.target, filename);
        try {
          mkdirp.sync(path.dirname(targetPath));
        } catch (e) {
          // nothing
        }
        fs.copyFileSync(source, targetPath);
      }
      return source;
    });

    if (this.attic && fs.existsSync(atticPath)) {
      const list = fs.readdirSync(atticPath);
      console.log(list);
      list.forEach((filename) => {
        const zipFile = new AdmZip(`${atticPath}/${filename}`);
        const entryPath = `archive/${tagPath}`.replace(/\\/g, "/");
        const entry = zipFile.getEntries();
        entry.forEach((en) => {
          console.log(en.entryName.replace(/\\/g, "/"));
          console.log(entryPath);
          if (en.entryName.replace(/\\/g, "/").startsWith(entryPath)) {
            const storePath = `store/${zipFile.readAsText(en.entryName, "UTF-8")}`;
            result.push(`${filename}:${storePath}`);
            if (this.target) {
              try {
                mkdirp.sync(path.dirname(
                  path.join(this.target, path.relative("store", storePath))));
              } catch (e) {
                // nothing
              }
              console.log(storePath);
              console.log(this.target);
              const b: Buffer = zipFile.readFile(storePath);
              fs.writeFileSync(path.join(this.target, path.relative("store", storePath)), b);
            }
          }
        });
        //console.dir(zipFile);
        //console.log(entryPath);
        //console.dir(entry);
      });
    }

    return result;

  }

}
