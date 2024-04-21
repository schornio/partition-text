import { describe, expect, test } from '@jest/globals';
import { partitionMarkdown } from './partitionMarkdown.js';

describe('partitionMarkdown', () => {
  test('should partition the markdown into chunks of the specified length', () => {
    const text =
      '# Lorem ipsum\n\nDolor sit amet, consectetur adipiscing elit.\n\n## Lorem ipsum2\n\n2Dolor sit amet, consectetur adipiscing elit.';
    const chunkLength = 6;

    const expected = [
      '# EXAMPLE TITLE\n\n## Lorem ipsum\n\nDolor sit amet, consectetur adipiscing elit.\n',
      '# EXAMPLE TITLE\n\n## Lorem ipsum\n\n### Lorem ipsum2\n\n2Dolor sit amet, consectetur adipiscing elit.\n',
    ];

    const result = partitionMarkdown(
      text,
      (data: string) => data.split(' ').length,
      { documentTitle: 'EXAMPLE TITLE', tokensPerPartition: chunkLength },
    );

    expect(result).toEqual(expected);
  });

  test('should partition within a too long text', () => {
    const text =
      '# Lorem ipsum\n\nDolor sit amet, consectetur adipiscing elit.';
    const chunkLength = 3;

    const expected = [
      '# Lorem ipsum\n\nDolor sit amet,\n',
      '# Lorem ipsum\n\nconsectetur adipiscing elit.\n',
    ];

    const result = partitionMarkdown(
      text,
      (data: string) => data.split(' ').length,
      { tokensPerPartition: chunkLength },
    );

    expect(result).toEqual(expected);
  });

  test('should partition within a too long table', () => {
    const text = `
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Row 1    | Row 1    | Row 1    |
| Row 2    | Row 2    | Row 2    |
| Row 3    | Row 3    | Row 3    |
| Row 4    | Row 4    | Row 4    |
    `;
    const chunkLength =
      '| Row 1    | Row 1    | Row 1    | | Row 2    | Row 2    | Row 2    |'.split(
        /\s+/gu,
      ).length;

    const expected = [
      '| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Row 1    | Row 1    | Row 1    |\n| Row 2    | Row 2    | Row 2    |\n',
      '| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Row 3    | Row 3    | Row 3    |\n| Row 4    | Row 4    | Row 4    |\n',
    ];

    const result = partitionMarkdown(
      text,
      (data: string) => data.split(' ').length,
      { tokensPerPartition: chunkLength },
    );

    expect(result).toEqual(expected);
  });

  test('should fall back if table header is too large', () => {
    const text = `
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Row 1    | Row 1    | Row 1    |
    `;
    const chunkLength = 1;

    const result = partitionMarkdown(
      text,
      (data: string) => data.split(' ').length,
      { tokensPerPartition: chunkLength },
    );

    expect(result).toHaveLength(
      text.split(/\s+/gu).filter((word) => word.length > 0).length,
    );
  });

  test('should fall back if table row is too large', () => {
    const text = `
| Header | Header | Header |
| ------ | ------ | ------ |
| Row 2  | Row 2  | Row is to big! |
    `;
    const chunkLength = '| Header | Header | Header |'.split(/\s+/gu).length;

    const result = partitionMarkdown(
      text,
      (data: string) => data.split(' ').length,
      { tokensPerPartition: chunkLength },
    );

    expect(result).toHaveLength(
      Math.ceil(
        text.split(/\s+/gu).filter((word) => word.length > 0).length /
          chunkLength,
      ),
    );
  });

  test('should handle empty text', () => {
    const text = '';
    const expected: string[] = [];

    const result = partitionMarkdown(
      text,
      (data: string) => data.split('').length,
    );

    expect(result).toEqual(expected);
  });
});
