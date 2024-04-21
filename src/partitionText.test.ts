import { describe, expect, test } from '@jest/globals';
import { partitionText } from './partitionText.js';

function createPartition(
  arr: [string | undefined, string, string | undefined][],
) {
  return arr.map(([paddingStart, partition, paddingEnd]) => ({
    paddingEnd,
    paddingStart,
    partition,
  }));
}

describe('partitionText', () => {
  test('should partition the text into chunks of the specified length', () => {
    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
    const chunkLength = 10;
    const expected = createPartition([
      [undefined, 'Lorem ipsu', ''],
      ['', 'm dolor si', ''],
      ['', 't amet, co', ''],
      ['', 'nsectetur ', ''],
      ['', 'adipiscing', ''],
      ['', ' elit.', undefined],
    ]);

    const result = partitionText(
      text,
      (data: string) => data.split('').length,
      { tokensPerPartition: chunkLength },
    );

    expect(result).toEqual(expected);
  });

  test('should handle empty text', () => {
    const text = '';
    const chunkLength = 5;
    const expected = createPartition([[undefined, '', undefined]]);

    const result = partitionText(
      text,
      (data: string) => data.split('').length,
      { tokensPerPartition: chunkLength },
    );

    expect(result).toEqual(expected);
  });

  test('should handle text shorter than the chunk length', () => {
    const text = 'Hello';
    const expected = createPartition([[undefined, 'Hello', undefined]]);

    const result = partitionText(text, (data: string) => data.split('').length);

    expect(result).toEqual(expected);
  });
});
