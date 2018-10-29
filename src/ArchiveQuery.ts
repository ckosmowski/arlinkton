import * as exp from 'expressionify';
import * as fs from "fs";
import * as path from "path";
import ArlinktonConfig, { Tag } from './ArlinktonConfig';
import TreeWalker from './TreeWalker';

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

  constructor(private config: ArlinktonConfig) {
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

    let result = [];

    if (fs.existsSync(queryPath)) {
      const walker = new TreeWalker(queryPath);
      result = walker.walkSync();
    }
    return result.map(f => fs.readlinkSync(path.resolve(queryPath, f)));
  }

}
