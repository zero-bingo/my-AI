export interface FigmaFileData {
  document: FigmaNode;
  name: string;
  schemaVersion: number;
  styles?: Record<string, unknown>;
}

export interface FigmaNode {
  id?: string | number;
  name?: string;
  type?: string;
  visible?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  absoluteTransform?: number[][];
  renderBounds?: FigmaRect;
  absoluteRenderBounds?: FigmaRect | null;
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE' | string;
  layoutWrap?: 'WRAP' | 'NO_WRAP' | string;
  itemSpacing?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  style?: FigmaStyle;
  children?: FigmaNode[];
  text?: FigmaText;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: string;
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  effects?: FigmaEffect[];
  characters?: string;
}

export interface FigmaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaPaint {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  opacity?: number;
  gradientStops?: FigmaGradientStop[];
  gradientTransform?: number[][];
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface FigmaGradientStop {
  color: FigmaColor;
  position: number;
  opacity?: number;
}

export interface FigmaEffect {
  type: string;
  visible?: boolean;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
}

export interface FigmaStyle {
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeights?: {
    t: number;
    r: number;
    b: number;
    l: number;
  };
  strokeAlign?: string;
  effects?: FigmaEffect[];
  opacity?: number;
  cornerRadius?: number;
  radii?: {
    tl?: number;
    tr?: number;
    br?: number;
    bl?: number;
  };
}

export interface FigmaText {
  characters: string;
  segments?: FigmaTextSegment[];
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' | string;
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM' | string;
  fontSize?: number;
  fontName?: {
    family: string;
    style?: string;
  };
  fontWeight?: number;
  lineHeight?: {
    unit: 'PIXELS' | 'PERCENT';
    value: number;
  };
  letterSpacing?: {
    unit: 'PIXELS' | 'PERCENT';
    value: number;
  };
  textDecoration?: string;
  textCase?: string;
}

export interface FigmaTextSegment {
  start?: number;
  end?: number;
  fontSize?: number;
  fontName?: {
    family: string;
    style?: string;
  };
  fontWeight?: number;
  letterSpacing?: {
    unit: 'PERCENT' | 'PIXELS';
    value: number;
  };
  lineHeight?: {
    unit: 'PIXELS' | 'PERCENT';
    value: number;
  };
  fills?: FigmaPaint[];
  textDecoration?: string;
  textCase?: string;
}

export interface CompositionInput {
  kind?: 'composition' | string;
  bounds?: FigmaRect;
  absOrigin: {
    x: number;
    y: number;
  };
  children: FigmaNode[];
}

interface CacheEntry {
  data: FigmaFileData;
  timestamp: number;
}

export class FigmaParser {
  private apiToken: string;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL = 300000;

  constructor(apiToken: string) {
    if (!apiToken) {
      throw new Error('FIGMA_API_TOKEN environment variable is not set');
    }
    this.apiToken = apiToken;
  }

  parseUrl(url: string): { fileKey: string; nodeId: string | null } {
    if (!url) {
      throw new Error('figma_url is required');
    }

    const match = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)(?:\/.*)?(?:\?node-id=([^&]+))?/);

    if (!match) {
      throw new Error(
        'Invalid Figma URL format. Expected formats:\n' +
        '  - https://figma.com/file/xxx/xxx\n' +
        '  - https://figma.com/file/xxx/xxx?node-id=xxx\n' +
        '  - https://figma.com/design/xxx/xxx'
      );
    }

    return {
      fileKey: match[2],
      nodeId: match[3] || null,
    };
  }

  async fetchFile(fileKey: string, nodeId: string | null): Promise<FigmaFileData> {
    const baseUrl = 'https://api.figma.com/v1/files';

    const params = new (globalThis as typeof globalThis & { URLSearchParams: typeof URLSearchParams }).URLSearchParams();
    if (nodeId) {
      params.set('ids', nodeId);
    }
    params.set('depth', '3');

    const url = `${baseUrl}/${fileKey}?${params.toString()}`;

    const maxRetries = 3;
    let retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await (globalThis as typeof globalThis & { fetch: typeof fetch }).fetch(url, {
          headers: {
            'X-Figma-Token': this.apiToken,
          },
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : retryDelay;
          console.error(`Figma API rate limit exceeded. Retrying after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryDelay *= 2;
          continue;
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          const errorMsg = (error as { message?: string; err?: string }).message || (error as { err?: string }).err || `HTTP ${response.status}`;
          throw new Error(`Figma API Error: ${errorMsg}`);
        }

        return await response.json() as FigmaFileData;
      } catch (error) {
        if ((error as Error).message.includes('FIGMA_API_TOKEN') ||
            (error as Error).message.includes('Figma API Error')) {
          throw error;
        }
        if (attempt < maxRetries) {
          console.error(`Fetch attempt ${attempt} failed: ${(error as Error).message}. Retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2;
          continue;
        }
        throw new Error(`Failed to fetch Figma file after ${maxRetries} attempts: ${(error as Error).message}`);
      }
    }

    throw new Error('Failed to fetch Figma file: max retries exceeded');
  }

  async parse(figmaUrl: string): Promise<FigmaFileData> {
    const { fileKey, nodeId } = this.parseUrl(figmaUrl);
    const cacheKey = `${fileKey}:${nodeId || 'root'}`;

    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.error(`[Figma Parser] Using cached data for ${cacheKey}`);
      return cached.data;
    }

    const data = await this.fetchFile(fileKey, nodeId);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    console.error(`[Figma Parser] Cached data for ${cacheKey}`);
    return data;
  }

  convertToComposition(fileData: FigmaFileData): CompositionInput {
    const document = fileData.document;
    const bounds = document.absoluteRenderBounds || document.renderBounds || { x: 0, y: 0, width: 0, height: 0 };

    const cleanedChildren = this.cleanNodeTree(document.children || []);

    return {
      kind: 'composition',
      bounds,
      absOrigin: { x: 0, y: 0 },
      children: cleanedChildren,
    };
  }

  private cleanNodeTree(nodes: FigmaNode[]): FigmaNode[] {
    return nodes.map((node) => this.cleanNode(node));
  }

  private cleanNode(node: FigmaNode): FigmaNode {
    const cleaned: FigmaNode = { ...node };

    if (node.absoluteTransform) {
      cleaned.absoluteTransform = this.cleanTransform(node.absoluteTransform);
    }

    if (node.children && node.children.length > 0) {
      cleaned.children = this.cleanNodeTree(node.children);
    }

    return cleaned;
  }

  private cleanTransform(transform: number[][]): number[][] {
    if (!transform || !Array.isArray(transform) || transform.length !== 2) {
      return [[1, 0, 0], [0, 1, 0]];
    }

    const row1 = transform[0] || [];
    const row2 = transform[1] || [];

    const cleanRow = (row: number[]): number[] => {
      const result: number[] = [];
      for (let i = 0; i < 3; i++) {
        const val = row[i];
        if (typeof val === 'number' && isFinite(val)) {
          result.push(val);
        } else {
          result.push(i === 0 ? 1 : 0);
        }
      }
      return result;
    };

    return [cleanRow(row1), cleanRow(row2)];
  }
}
