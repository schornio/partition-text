import type { Heading, RootContent, Table, TableRow } from 'mdast';
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmTable } from 'micromark-extension-gfm-table';
import { toMarkdown } from 'mdast-util-to-markdown';

const TOKENS_PER_PARTITION_DEFAULT = 1000;

function shiftDepth(depth: number, shift: number) {
  return Math.min(6, Math.max(1, depth + shift)) as 1 | 2 | 3 | 4 | 5 | 6;
}

class Topic {
  headings: [
    Heading | undefined,
    Heading | undefined,
    Heading | undefined,
    Heading | undefined,
    Heading | undefined,
    Heading | undefined,
  ] = [undefined, undefined, undefined, undefined, undefined, undefined];
  title?: Heading;

  constructor(title?: string) {
    if (title) {
      this.title = {
        children: [{ type: 'text', value: title }],
        depth: 1,
        type: 'heading',
      };
    }
  }

  add(content: Heading) {
    for (let i: number = content.depth; i < this.headings.length; i += 1) {
      this.headings[i] = undefined;
    }
    this.headings[content.depth - 1] = content;
  }

  getHeaders() {
    return [
      ...(this.title ? [this.title] : []),
      ...this.headings
        .filter((heading): heading is Heading => Boolean(heading))
        .map((heading) => ({
          ...heading,
          depth: this.title ? shiftDepth(heading.depth, 1) : heading.depth,
        })),
    ];
  }
}

function getContentSize(
  content: RootContent,
  calculateTokenAmount: (data: string) => number,
) {
  const markdown = toMarkdown(content, { extensions: [gfmTableToMarkdown()] });
  return calculateTokenAmount(markdown);
}

function partitionMarkdownTable(
  table: Table,
  calculateTokenAmount: (data: string) => number,
  options: { tokensPerPartition: number },
) {
  const [headerRow, ...rows] = table.children;

  if (!headerRow) {
    // Table is empty, can't partition
    return undefined;
  }

  if (
    getContentSize(headerRow, calculateTokenAmount) > options.tokensPerPartition
  ) {
    // Header row is too big, can't partition
    return undefined;
  }

  const chunks: TableRow[][] = [];
  let currentChunk: TableRow[] = [headerRow];
  let currentContentSize = 0;

  for (const row of rows) {
    const contentSize = getContentSize(row, calculateTokenAmount);

    if (contentSize > options.tokensPerPartition) {
      // Row is too big, can't partition
      return undefined;
    }

    if (currentContentSize + contentSize > options.tokensPerPartition) {
      chunks.push(currentChunk);
      currentChunk = [headerRow];
      currentContentSize = 0;
    }

    currentChunk.push(row);
    currentContentSize += contentSize;
  }

  if (currentChunk.length > 1) {
    chunks.push(currentChunk);
  }

  return chunks.map((children) => ({
    children,
    type: 'table' as const,
  }));
}

function partitionSingleBigNode(
  content: RootContent,
  calculateTokenAmount: (data: string) => number,
  options: { tokensPerPartition: number },
) {
  const chunks: RootContent[] = [];
  if (content.type === 'table') {
    const tableChunks = partitionMarkdownTable(
      content,
      calculateTokenAmount,
      options,
    );
    if (tableChunks) {
      for (const tableChunk of tableChunks) {
        chunks.push(tableChunk);
      }
      return chunks;
    }
  }

  const text = toMarkdown(content, { extensions: [gfmTableToMarkdown()] });
  const allWords = text.split(/\s+/gu).filter((word) => word.length > 0);

  let currentWords: string[] = [];
  for (const word of allWords) {
    if (currentWords.length >= options.tokensPerPartition) {
      chunks.push({
        children: [{ type: 'text', value: currentWords.join(' ') }],
        type: 'paragraph',
      });
      currentWords = [];
    }
    currentWords.push(word);
  }

  chunks.push({
    children: [{ type: 'text', value: currentWords.join(' ') }],
    type: 'paragraph',
  });

  return chunks;
}

export function partitionMarkdown(
  markdown: string,
  calculateTokenAmount: (data: string) => number,
  options?: { documentTitle?: string; tokensPerPartition?: number },
) {
  const ast = fromMarkdown(markdown, {
    extensions: [gfmTable()],
    mdastExtensions: [gfmTableFromMarkdown()],
  });

  const astChildren = ast.children;

  const tokensPerPartition =
    options?.tokensPerPartition ?? TOKENS_PER_PARTITION_DEFAULT;

  const topic = new Topic(options?.documentTitle);

  const chunks: RootContent[][] = [];

  let currentChunk: RootContent[] = [];
  let currentContentSize = 0;
  for (const content of astChildren) {
    const contentSize = getContentSize(content, calculateTokenAmount);

    if (currentContentSize + contentSize > tokensPerPartition) {
      if (currentChunk.length > 0) {
        chunks.push([...topic.getHeaders(), ...currentChunk]);
        currentChunk = [];
        currentContentSize = 0;
      } else {
        const chunksWithoutTopic = partitionSingleBigNode(
          content,
          calculateTokenAmount,
          { tokensPerPartition },
        );

        for (const chunk of chunksWithoutTopic) {
          chunks.push([...topic.getHeaders(), chunk]);
        }

        currentChunk = [];
        currentContentSize = 0;

        continue;
      }
    }

    if (content.type === 'heading') {
      // console.log('Adding heading', content);
      topic.add(content);
    } else {
      currentChunk.push(content);
      currentContentSize += contentSize;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push([...topic.getHeaders(), ...currentChunk]);
  }

  return chunks.map((children) =>
    toMarkdown(
      {
        children,
        type: 'root',
      },
      { extensions: [gfmTableToMarkdown()] },
    ),
  );
}
