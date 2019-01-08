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
  XML = "xml",
  DATE = "date"
}

class Split {
  public regex: string;
  public path: string;
  public flags: string;
}

export class Tag {
  public name: string;
  public type: TagType;
  public tagName: string;
  public split: (fileName: string, additional?: string) => string[];
  public query: (query: string) => string[];
}
