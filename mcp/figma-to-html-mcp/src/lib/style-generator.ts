import type { FigmaNode } from './figma-parser';

export class StyleGenerator {
  getNodeStyle(node: FigmaNode): string {
    const styles: string[] = [];

    this.addDimensions(node, styles);
    this.addLayout(node, styles);
    this.addStyleProperties(node, styles);
    this.addFills(node, styles);
    this.addTextStyles(node, styles);

    return styles.join('; ');
  }

  private addDimensions(node: FigmaNode, styles: string[]): void {
    if (node.width) styles.push(`width: ${node.width}px`);
    if (node.height) styles.push(`height: ${node.height}px`);
    if (node.x !== undefined && node.x !== null) styles.push(`left: ${node.x}px`);
    if (node.y !== undefined && node.y !== null) styles.push(`top: ${node.y}px`);
  }

  private addLayout(node: FigmaNode, styles: string[]): void {
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      styles.push('display: flex');
      styles.push(`flex-direction: ${node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'}`);

      if (node.itemSpacing) styles.push(`gap: ${node.itemSpacing}px`);

      if (node.paddingTop !== undefined) styles.push(`padding-top: ${node.paddingTop}px`);
      if (node.paddingRight !== undefined) styles.push(`padding-right: ${node.paddingRight}px`);
      if (node.paddingBottom !== undefined) styles.push(`padding-bottom: ${node.paddingBottom}px`);
      if (node.paddingLeft !== undefined) styles.push(`padding-left: ${node.paddingLeft}px`);

      if (node.primaryAxisAlignItems) {
        const alignMap: Record<string, string> = {
          'MIN': 'flex-start',
          'MAX': 'flex-end',
          'CENTER': 'center',
          'SPACE_BETWEEN': 'space-between',
          'SPACE_AROUND': 'space-around',
          'SPACE_EVENLY': 'space-evenly',
        };
        styles.push(`justify-content: ${alignMap[node.primaryAxisAlignItems] || node.primaryAxisAlignItems.toLowerCase()}`);
      }

      if (node.counterAxisAlignItems) {
        const alignMap: Record<string, string> = {
          'MIN': 'flex-start',
          'MAX': 'flex-end',
          'CENTER': 'center',
          'BASELINE': 'baseline',
        };
        styles.push(`align-items: ${alignMap[node.counterAxisAlignItems] || node.counterAxisAlignItems.toLowerCase()}`);
      }
    } else {
      styles.push('position: absolute');
    }
  }

  private addStyleProperties(node: FigmaNode, styles: string[]): void {
    if (!node.style) return;

    if (node.style.opacity !== undefined && node.style.opacity !== null) {
      styles.push(`opacity: ${node.style.opacity}`);
    }

    this.addFillsFromStyle(node.style, styles);
    this.addBorderRadius(node.style, styles);
    this.addStrokes(node, styles);
    this.addEffects(node.style, styles);
  }

  private addFillsFromStyle(style: NonNullable<FigmaNode['style']>, styles: string[]): void {
    if (!style.fills || style.fills.length === 0) return;

    for (const fill of style.fills) {
      if (fill.visible === false) continue;

      if (fill.type === 'SOLID' && fill.color) {
        const { r, g, b, a = 1 } = fill.color;
        styles.push(`background-color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
      } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
        const stops = fill.gradientStops.map(s => {
          const { r, g, b, a = 1 } = s.color;
          return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${s.position * 100}%`;
        }).join(', ');
        styles.push(`background: linear-gradient(180deg, ${stops})`);
      } else if (fill.type === 'GRADIENT_RADIAL' && fill.gradientStops) {
        const stops = fill.gradientStops.map(s => {
          const { r, g, b, a = 1 } = s.color;
          return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${s.position * 100}%`;
        }).join(', ');
        styles.push(`background: radial-gradient(circle, ${stops})`);
      }
    }
  }

  private addBorderRadius(style: NonNullable<FigmaNode['style']>, styles: string[]): void {
    if (style.cornerRadius) {
      styles.push(`border-radius: ${style.cornerRadius}px`);
    } else if (style.radii) {
      const { tl = 0, tr = 0, br = 0, bl = 0 } = style.radii;
      styles.push(`border-radius: ${tl}px ${tr}px ${br}px ${bl}px`);
    }
  }

  private addStrokes(node: FigmaNode, styles: string[]): void {
    const style = node.style;
    if (!style?.strokes || style.strokes.length === 0) return;

    for (const stroke of style.strokes) {
      if (stroke.visible === false) continue;

      if (stroke.type === 'SOLID' && stroke.color) {
        const { r, g, b, a = 1 } = stroke.color;
        const weight = style.strokeWeights
          ? Math.max(style.strokeWeights.t || 0, style.strokeWeights.r || 0, style.strokeWeights.b || 0, style.strokeWeights.l || 0)
          : (node.strokeWeight || 1);
        styles.push(`border: ${weight}px solid rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
      }
    }
  }

  private addEffects(style: NonNullable<FigmaNode['style']>, styles: string[]): void {
    if (!style.effects || style.effects.length === 0) return;

    const shadows: string[] = [];
    const blurs: string[] = [];

    for (const effect of style.effects) {
      if (effect.visible === false) continue;

      if (effect.type === 'DROP_SHADOW' && effect.color) {
        const { r, g, b, a = 1 } = effect.color;
        const offsetX = effect.offset?.x || 0;
        const offsetY = effect.offset?.y || 0;
        const radius = effect.radius || 0;
        shadows.push(`${offsetX}px ${offsetY}px ${radius}px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
      } else if (effect.type === 'INNER_SHADOW' && effect.color) {
        const { r, g, b, a = 1 } = effect.color;
        const offsetX = effect.offset?.x || 0;
        const offsetY = effect.offset?.y || 0;
        const radius = effect.radius || 0;
        shadows.push(`inset ${offsetX}px ${offsetY}px ${radius}px rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
      } else if (effect.type === 'BACKGROUND_BLUR') {
        const radius = effect.radius || 0;
        blurs.push(`blur(${radius}px)`);
      }
    }

    if (shadows.length > 0) styles.push(`box-shadow: ${shadows.join(', ')}`);
    if (blurs.length > 0) styles.push(`backdrop-filter: ${blurs.join(' ')}`);
  }

  private addFills(node: FigmaNode, styles: string[]): void {
    if (!node.fills || node.fills.length === 0) return;
    if (node.style?.fills?.length) return;

    for (const fill of node.fills) {
      if (fill.visible === false) continue;

      if (fill.type === 'SOLID' && fill.color) {
        const { r, g, b, a = 1 } = fill.color;
        styles.push(`background-color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
      }
    }
  }

  private addTextStyles(node: FigmaNode, styles: string[]): void {
    if (!node.text) return;

    const text = node.text;

    if (text.fontSize) styles.push(`font-size: ${text.fontSize}px`);
    if (text.fontName) styles.push(`font-family: "${text.fontName.family}", sans-serif`);
    if (text.fontWeight) styles.push(`font-weight: ${text.fontWeight}`);

    if (text.textAlignHorizontal) {
      styles.push(`text-align: ${text.textAlignHorizontal.toLowerCase()}`);
    }

    if (text.textAlignVertical) {
      const alignMap: Record<string, string> = {
        'TOP': 'flex-start',
        'CENTER': 'center',
        'BOTTOM': 'flex-end',
      };
      styles.push(`display: flex; align-items: ${alignMap[text.textAlignVertical] || 'center'}`);
    }

    if (text.lineHeight) {
      const lineHeight = text.lineHeight.unit === 'PIXELS' ? `${text.lineHeight.value}px` : `${text.lineHeight.value}%`;
      styles.push(`line-height: ${lineHeight}`);
    }

    if (text.letterSpacing) {
      const letterSpacing = text.letterSpacing.unit === 'PIXELS' ? `${text.letterSpacing.value}px` : `${text.letterSpacing.value}%`;
      styles.push(`letter-spacing: ${letterSpacing}`);
    }

    if (text.textDecoration) {
      styles.push(`text-decoration: ${text.textDecoration.toLowerCase()}`);
    }

    if (text.textCase) {
      const caseMap: Record<string, string> = {
        'UPPER': 'uppercase',
        'LOWER': 'lowercase',
        'TITLE': 'capitalize',
      };
      styles.push(`text-transform: ${caseMap[text.textCase] || 'none'}`);
    }
  }

  getLineStyle(node: FigmaNode): string {
    const styles: string[] = [];

    if (node.x !== undefined && node.x !== null) styles.push(`left: ${node.x}px`);
    if (node.y !== undefined && node.y !== null) styles.push(`top: ${node.y}px`);

    const weight = node.strokeWeight || 1;
    styles.push(`height: ${weight}px`);
    styles.push(`width: ${node.width || 0}px`);

    if (node.style?.strokes && node.style.strokes.length > 0) {
      const stroke = node.style.strokes[0];
      if (stroke.type === 'SOLID' && stroke.color) {
        const { r, g, b, a = 1 } = stroke.color;
        styles.push(`background-color: rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`);
      }
    }

    return styles.join('; ');
  }
}
