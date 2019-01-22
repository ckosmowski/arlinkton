import * as path from 'path';
import ArlinktonConfig from './ArlinktonConfig';
import { ComparisonOperator } from './ComparisonOperator';
import FileFilter from './FileFilter';

export default class DateFileFilter implements FileFilter {

  public constructor(private tagName: string, private config: ArlinktonConfig,
                     private dateArray: string[], private operator: ComparisonOperator) {
  }

  public accept(archivePath: string): boolean {

    const relPath = path.relative(path.join(this.config.paths.archive, this.tagName), archivePath);
    const compArray = relPath.split(/\\|\//).slice(0, 3);
    if (compArray[0] === "..") {
      return;
    }
    const result = this.compare(compArray, this.dateArray);
    return result;
  }

  public acceptDir(archivePath: string): boolean {
    const relPath = path.relative(path.join(this.config.paths.archive, this.tagName), archivePath);
    const compArray = relPath.split(/\\|\//).slice(0, 3);
    if (compArray[0] === "..") {
      return;
    }
    const result = this.compare(compArray, this.dateArray, true);
    return result;
  }

  public compare(ar: string[], br: string[], isDir: boolean = false) {

    let a = ar.join("-");
    let b = this.fillDate(br, ar.length).join("-");

    if (this.operator === ComparisonOperator.EQUALS && isDir) {
      if (ar.length > br.length) {
        return true;
      }
    }

    if ((this.operator === ComparisonOperator.EQUALS && !isDir)) {
      b = br.join("-");
      a = this.fillDate(ar, br.length).join("-");
    }

    const comp = a.localeCompare(b);
    switch (this.operator) {
      case ComparisonOperator.GREATER_THAN:
        return comp === 1 || comp === 0;
      case ComparisonOperator.EQUALS:
        return comp === 0;
      case ComparisonOperator.LESS_THAN:
        return comp === -1 || comp === 0;
      case ComparisonOperator.GREATER_THAN_OR_EQUALS:
        return comp === 1 || comp === 0;
      case ComparisonOperator.LESS_THAN_OR_EQUALS:
        return comp === -1 || comp === 0;
    }
    return false;
  }

  public fillDate(dateArray: string[], targetLength): string[] {
    const result: string[] = [].concat(dateArray);
    while (result.length < targetLength) {
      result.push("01");
    }
    while (result.length > targetLength) {
      result.pop();
    }
    return result;
  }

}
