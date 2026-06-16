import type { FigmaFileData } from './figma-parser';
import { NodeRenderer } from './node-renderer';

export class HtmlGenerator {
  private nodeRenderer: NodeRenderer;

  constructor() {
    this.nodeRenderer = new NodeRenderer();
  }

  async generate(fileData: FigmaFileData): Promise<string> {
    if (!fileData || !fileData.document) {
      throw new Error('Invalid Figma file data');
    }

    console.error('[HTML Generator] Starting HTML generation...');

    const fileName = fileData.name || 'Figma Export';
    const content = this.nodeRenderer.render(fileData.document, 1);

    console.error('[HTML Generator] HTML generation complete.');

    return this.wrapHtml(fileName, content);
  }

  private wrapHtml(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  position: relative;
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

[data-type="FRAME"],
[data-type="GROUP"],
[data-type="COMPONENT"],
[data-type="INSTANCE"],
[data-type="BOOLEAN_OPERATION"] {
  position: absolute;
}

[data-type="TEXT"] {
  white-space: pre-wrap;
  word-wrap: break-word;
  position: absolute;
}

[data-type="RECTANGLE"],
[data-type="ELLIPSE"],
[data-type="LINE"],
[data-type="VECTOR"],
[data-type="STAR"],
[data-type="REGULAR_POLYGON"],
[data-type="IMAGE"] {
  position: absolute;
}
  </style>
</head>
<body>
${content}
</body>
</html>`;
  }
}
