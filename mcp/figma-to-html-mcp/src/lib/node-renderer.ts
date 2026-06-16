import type { FigmaNode } from './figma-parser';
import { StyleGenerator } from './style-generator';

export class NodeRenderer {
  private styleGenerator: StyleGenerator;

  constructor() {
    this.styleGenerator = new StyleGenerator();
  }

  render(node: FigmaNode, indent = 0): string {
    if (node.visible === false) return '';

    const indentStr = '  '.repeat(indent);
    const style = this.styleGenerator.getNodeStyle(node);
    const attributes = this.getNodeAttributes(node);
    const attrStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';

    return this.renderNodeType(node, indentStr, style, attrStr, indent);
  }

  private getNodeAttributes(node: FigmaNode): string[] {
    const attributes: string[] = [];

    if (node.name) {
      attributes.push(`data-name="${this.escapeHtml(node.name)}"`);
    }
    if (node.type) {
      attributes.push(`data-type="${node.type}"`);
    }
    if (node.id) {
      attributes.push(`data-id="${node.id}"`);
    }

    return attributes;
  }

  private renderNodeType(
    node: FigmaNode,
    indentStr: string,
    style: string,
    attrStr: string,
    indent: number
  ): string {
    switch (node.type) {
      case 'DOCUMENT':
      case 'CANVAS':
        return this.renderContainer(node, indent);

      case 'FRAME':
      case 'GROUP':
      case 'COMPONENT':
      case 'INSTANCE':
      case 'BOOLEAN_OPERATION':
        return this.renderDiv(node, indentStr, style, attrStr, indent);

      case 'TEXT':
        return this.renderText(node, indentStr, style, attrStr);

      case 'RECTANGLE':
        return this.renderDiv(node, indentStr, style, attrStr, indent);

      case 'ELLIPSE':
        return this.renderEllipse(node, indentStr, style, attrStr);

      case 'LINE':
        return this.renderLine(node, indentStr, attrStr);

      case 'VECTOR':
      case 'STAR':
      case 'REGULAR_POLYGON':
        return this.renderDiv(node, indentStr, style, attrStr, indent);

      case 'SLICE':
        return '';

      case 'IMAGE':
        return this.renderImage(node, indentStr, style, attrStr);

      default:
        return `${indentStr}<!-- Unsupported node type: ${node.type} -->`;
    }
  }

  private renderContainer(node: FigmaNode, indent: number): string {
    return node.children?.map((child: FigmaNode) => this.render(child, indent)).join('\n') || '';
  }

  private renderDiv(
    node: FigmaNode,
    indentStr: string,
    style: string,
    attrStr: string,
    indent: number
  ): string {
    let html = `${indentStr}<div${attrStr} style="${style}">`;
    html += node.children?.map((child: FigmaNode) => '\n' + this.render(child, indent + 1)).join('') || '';
    html += `\n${indentStr}</div>`;
    return html;
  }

  private renderText(node: FigmaNode, indentStr: string, style: string, attrStr: string): string {
    const text = node.characters || (node.text?.characters || '');
    return `${indentStr}<span${attrStr} style="${style}">${this.escapeHtml(text)}</span>`;
  }

  private renderEllipse(node: FigmaNode, indentStr: string, style: string, attrStr: string): string {
    const ellipseStyle = `${style}; border-radius: 50%;`;
    return `${indentStr}<div${attrStr} style="${ellipseStyle}"></div>`;
  }

  private renderLine(node: FigmaNode, indentStr: string, attrStr: string): string {
    const lineStyle = this.styleGenerator.getLineStyle(node);
    return `${indentStr}<div${attrStr} style="${lineStyle}"></div>`;
  }

  private renderImage(node: FigmaNode, indentStr: string, style: string, attrStr: string): string {
    return `${indentStr}<img${attrStr} style="${style}" alt="${this.escapeHtml(node.name || '')}" />`;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
