import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { FigmaParser } from './lib/figma-parser';
import { HtmlGenerator } from './lib/html-generator';
import { writeFile } from 'fs/promises';
import { z } from 'zod';

class FigmaToHtmlMCPServer {
  private mcpServer: McpServer;
  private apiToken: string | undefined;
  private figmaParser: FigmaParser | null;
  private htmlGenerator: HtmlGenerator;

  constructor() {
    this.apiToken = process.env.FIGMA_API_TOKEN;
    if (!this.apiToken) {
      console.error('Warning: FIGMA_API_TOKEN environment variable is not set');
    }

    this.mcpServer = new McpServer(
      {
        name: 'figma-to-html-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.figmaParser = null;
    this.htmlGenerator = new HtmlGenerator();

    this.setupTools();
  }

  private setupTools(): void {
    const inputSchema = z.object({
      figma_url: z.string().describe('Figma 文件或页面的 URL，例如: https://figma.com/file/xxx/xxx 或 https://figma.com/file/xxx/xxx?node-id=xxx'),
      output_file: z.string().optional().describe('可选，输出 HTML 文件的路径。默认为 ./figma-export.html'),
    });

    this.mcpServer.registerTool('convert_figma_to_html', {
      description: '将 Figma 设计文件转换为 HTML 代码。支持完整的 Figma URL（包含 file key 和 node-id）',
      inputSchema,
    }, async (args: { figma_url: string; output_file?: string }) => {
      try {
        return await this.handleConvert(args);
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleConvert(args: { figma_url: string; output_file?: string }) {
    if (!this.apiToken) {
      throw new Error(
        'FIGMA_API_TOKEN environment variable is not set. ' +
        'Please set it in your environment or .env file.'
      );
    }

    const { figma_url, output_file } = args;

    if (!figma_url) {
      throw new Error('Missing required parameter: figma_url');
    }

    const outputFile = output_file || './figma-export.html';

    if (!this.figmaParser) {
      this.figmaParser = new FigmaParser(this.apiToken);
    }

    const fileData = await this.figmaParser.parse(figma_url);
    const html = await this.htmlGenerator.generate(fileData);
    await writeFile(outputFile, html, 'utf8');

    const maxPreviewLength = 1500;
    const preview = html.length > maxPreviewLength
      ? html.substring(0, maxPreviewLength) + '\n... (truncated)'
      : html;

    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully converted Figma design to HTML!\n\n` +
                `File saved to: ${outputFile}\n` +
                `Total size: ${html.length} characters\n\n` +
                `HTML Preview:\n${preview}`,
        },
      ],
    };
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.error('Figma to HTML MCP Server running on stdio');
  }
}

const server = new FigmaToHtmlMCPServer();
server.start().catch(console.error);
