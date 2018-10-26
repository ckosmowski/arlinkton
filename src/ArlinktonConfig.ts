export default class ArlinktonConfig {
  public accept: string;
  public tags: [Tag];
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
