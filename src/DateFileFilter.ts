import FileFilter from './FileFilter';
import {ComparisonOperator} from './ComparisonOperator';
import ArlinktonConfig from './ArlinktonConfig';
import * as path from 'path';

export default class DateFileFilter implements FileFilter {

  public constructor(private tagName: string, private config: ArlinktonConfig, private dateArray: string[], private operator: ComparisonOperator) {
  }

  public accept(archivePath: string): boolean {

    const relPath = path.relative(path.join(this.config.paths.archive, this.tagName), archivePath);
    const compArray = relPath.split(/\\|\//).slice(0, 3);
    console.log(this.dateArray, compArray);
    const result = this.compare(compArray.join("-"), this.fillDate(this.dateArray, compArray.length).join("-"));
    console.log("Checking: " + archivePath + " => " + result);
    return result;
  }

  public acceptDir(archivePath: string): boolean {
    const relPath = path.relative(path.join(this.config.paths.archive, this.tagName), archivePath);
    const compArray = relPath.split(/\\|\//).slice(0, 3);
    console.log(this.dateArray, compArray);
    const result = this.compare(compArray.join("-"), this.fillDate(this.dateArray, compArray.length).join("-"));
    console.log("Checking dir: " + archivePath + " => " + result);
    return result;
  }

  public compare(a: string, b: string) {
    console.log("comparing: " + a + "," + b);
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