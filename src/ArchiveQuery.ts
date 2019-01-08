import * as exp from 'expressionify';
import * as fs from "fs";
import * as path from "path";
import ArlinktonConfig, { Tag } from './ArlinktonConfig';
import TreeWalker from './TreeWalker';
import * as mkdirp from 'mkdirp';
import * as AdmZip from 'adm-zip';
import chalk from 'chalk';

export default class ArchiveQuery {

  private listOperators = {
    '=': {
      execute: this.listEquals.bind(this),
      priority: 3,
      type: 'binary'
    },
    AND: {
      execute: this.listAnd.bind(this),
      priority: 2,
      type: 'binary'
    },
    OR: {
      execute: this.listOr.bind(this),
      priority: 1,
      type: 'binary'
    },
    "~": {
      execute: this.listStartsWith.bind(this),
      priority: 3,
      type: 'binary'
    },
  };

  private evaluateExpression = exp({
    operators: this.listOperators,
    parseOperand: this.parseOperand.bind(this)
  });

  constructor(private config: ArlinktonConfig, private attic: number) {
  }

  public execute(query: string): string[] {
    const finalList =  this.evaluateExpression(query);
    return finalList;
  }

  private listOr(x: string[], y: string[]) {
    if (this.config.debug) {
      console.log(chalk.red("\n--OR--\n"));
    }
    return [...new Set(x.concat(y))];
  }

  private listAnd(x: string[], y: string[]) {
    if (this.config.debug) {
      console.log(chalk.red("\n--AND--\n"));
    }
    return [...new Set(x.filter(e => y.includes(e)))];
  }

  private listEquals(tag: string, query: string) {
    return this.getList(tag, query, false);
  }

  private listStartsWith(tag: string, query: string) {
    return this.getList(tag, query, true);
  }

  private getList(tag: string, query: string, startsWith: boolean = false) {

    const queryTag: Tag = this.config.tags.find(t => t.name === tag);
    const tagResult = queryTag.query ? queryTag.query(query) : queryTag.split(query);
    const queryArray = (tagResult instanceof Array ? tagResult : [tagResult]);
    const tagPath = path.join(tag, queryArray.join("/"));
    const queryPath = path.resolve(this.config.paths.archive, tagPath);
    const atticPath = this.config.paths.attic;

    if (this.config.debug) {
      console.log(chalk.blue(`\n=> Query: ${path.relative(process.cwd(), queryPath)}\n`));
    }

    let result = [];

    if (fs.existsSync(queryPath)) {
      const walker = new TreeWalker(queryPath);
      result = walker.walkSync(startsWith);
    }
    result = result.map((f) => {
      const source = fs.readlinkSync(path.resolve(queryPath, f));
      return source;
    });

    if (this.attic && fs.existsSync(atticPath)) {
      let list = fs.readdirSync(atticPath);
      list.sort((a, b) => {
        return b.split(".")[0].localeCompare(a.split(".")[0]);
      });
      list = list.slice(0, this.attic);
      if (this.config.debug) {
        console.log(chalk.green(`Searching in archive and in the following .zip files:`));
        list.forEach(el => console.log(path.relative(process.cwd(), path.join(atticPath, el))));
      }
      list.forEach((filename) => {
        const zipFile = new AdmZip(`${atticPath}/${filename}`);
        const entryPath = `archive/${tagPath}`.replace(/\\/g, "/");
        const entry = zipFile.getEntries();
        entry.forEach((en) => {
          // console.log(en.entryName.replace(/\\/g, "/"));
          // console.log(entryPath);
          const compare = en.entryName.replace(/\\/g, "/");
          let matches: boolean = false;
          if (startsWith) {
            matches = compare.startsWith(`${entryPath}/`);
          } else {
            matches = path.dirname(compare) === entryPath;
          }
          if (matches) {
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

  private parseOperand(operand: string) {
    return operand;
  }

}
