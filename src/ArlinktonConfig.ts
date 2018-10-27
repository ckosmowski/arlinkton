export default class ArlinktonConfig {
  public debug: boolean;
  public accept: string;
  public tags: [Tag];
  public paths: Paths;
}

class Paths {
  public in: string;
  public archive: string;
  public store: string;
  public attic: string;
  public error: string;
}

export enum TagType {
  FILENAME = "filename",
  CONTENT = "content",
  XML = "xml"
}

class Split {
  public regex: string;
  public path: string;
  public flags: string;
}

export class Tag {
  public filter: string;
  public name: string;
  public type: TagType;
  public tagNames: string;
  public regex: string;
  public path: string;
  public split: {[key: string]: Split};
}
