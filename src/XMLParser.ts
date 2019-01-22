import * as fs from 'fs';
import * as saxes from 'saxes';
import * as stream from 'stream';

class SaxStream extends stream.Writable {
  constructor(private saxesParser: saxes.SaxesParser) {
    super();
  }
  public end() {
    super.end();
    this.saxesParser.close();
  }
  public _write(chunk, enc, next) {
    if (chunk == null) {
      this.saxesParser.close();
    }
    this.saxesParser.write(chunk);
    next();
  }
}
export default class XMLParser {

  private activeTag: string = null;
  private result: {[key: string]: string[]};

  public parse (fileName: string, queries: string[]): Promise<any> {
    this.activeTag = null;
    this.result = {};

    const search = queries.map(q => q.split(":"));

    const resultPromise = new Promise(((resolve, reject) => {
      const saxParser = new saxes.SaxesParser({ fileName });

      saxParser.onerror = (e) => {
        console.error("error!", e);
        reject(e);
      };

      saxParser.onopentag = (node) => {
        this.activeTag = node.name;
      };

      saxParser.ontext = (node) => {
        if (!this.activeTag) {
          return;
        }
        const nodeKV = search.find(kv => kv[0] === this.activeTag);
        if (nodeKV) {
          this.result[nodeKV[1]] = this.result[nodeKV[1]] || [];
          this.result[nodeKV[1]].push(node.trim());
        }
      };

      saxParser.onclosetag = (node) => {
        this.activeTag = null;
      };

      saxParser.onend = () => {
        resolve(this.result);
      };

      fs.createReadStream(fileName)
        .pipe(new SaxStream(saxParser));
    }));
    return resultPromise;
  }
}
