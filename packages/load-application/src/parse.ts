import YAML, { Document, YAMLMap } from 'yaml';
import { get } from 'lodash';

class ParseYaml {
  private doc: Document.Parsed;
  constructor(private newJson: object, yamlData: string) {
    this.doc = YAML.parseDocument(yamlData);
  }
  run() {
    const { contents } = this.doc;
    if (contents instanceof YAMLMap) {
      const { items } = contents;
      const appName = get(this.newJson, 'appName');
      for (const item of items) {
        if (get(item, 'key.value') === 'name' && appName) {
          item.value = this.doc.createNode(appName);
        }
      }
    }
    return this.doc.toString();
  }
}

function parse(newJson: Record<string, any>, yamlData: string) {
  return new ParseYaml(newJson, yamlData).run();
}

export default parse;
