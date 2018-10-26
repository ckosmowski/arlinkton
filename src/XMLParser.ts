import * as fs from 'fs';
import * as saxes from 'saxes';
import { SaxesParser } from 'saxes';
import * as stream from 'stream';

class SaxStream extends stream.Writable {
  constructor(private saxesParser: SaxesParser) {
    super();
  }
  public end() {
    super.end();
    this.saxesParser.close();
  }
  public _write(chunk, enc, next) {
    console.log(chunk);
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
        // unhandled errors will throw, since this is a proper node
        // event emitter.
        console.error("error!", e);
        // clear the error
        reject(e);
      };

      saxParser.onopentag = (node) => {
        console.log(node);
        this.activeTag = node.name;
      };

      saxParser.ontext = (node) => {
        if (!this.activeTag) {
          return;
        }
        console.log(node);
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
        console.log("END");
        resolve(this.result);
      };
// pipe is supported, and it's readable/writable
// same chunks coming in also go out.

      fs.createReadStream(fileName)
        .pipe(new SaxStream(saxParser));
    }));
    return resultPromise;
  }
}
