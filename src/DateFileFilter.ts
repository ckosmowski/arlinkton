import FileFilter from './FileFilter';
import {ComparisonOperator} from './ComparisonOperator';
import ArlinktonConfig from './ArlinktonConfig';
import * as path from 'path';

export default class DateFileFilter implements FileFilter {

  public constructor(private tagName: string, private config: ArlinktonConfig, private dateArray: string[], private operator: ComparisonOperator) {
  }

  public accept(archivePath: string): boolean {
    const relPath = path.relative(path.join(this.config.paths.archive, this.tagName), archivePath);
    const compArray = relPath.split(/\\|\//).slice(0, this.dateArray.length);
    console.log(this.dateArray, compArray);
    return this.compare(compArray.join("-"), this.dateArray.join("-"));
  }

  public acceptDir(archivePath: string): boolean {
    const relPath = path.relative(path.join(this.config.paths.archive, this.tagName), archivePath);
    const compArray = relPath.split(/\\|\//).slice(0, this.dateArray.length);
    console.log(this.dateArray, compArray);
    return this.compare(compArray.join("-"), this.dateArray.join("-"));
  }

  public compare(a: string, b: string) {
    console.log("comparing: " + a + "," + b);
    const comp = a.localeCompare(b);
    switch (this.operator) {
      case ComparisonOperator.GREATER_THAN:
        return comp === 1;
      case ComparisonOperator.EQUALS:
        return comp === 0;
      case ComparisonOperator.LESS_THAN:
        return comp === -1;
      case ComparisonOperator.GREATER_THAN_OR_EQUALS:
        return comp === 1 || comp === 0;
      case ComparisonOperator.LESS_THAN_OR_EQUALS:
        return comp === -1 || comp === 0;
    }
    return false;
  }

}