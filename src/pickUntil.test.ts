import { describe, expect, test } from '@jest/globals';
import { pickUntilFromEnd, pickUntilFromStart } from './pickUntil.js';

describe('pickUntil', () => {
  test('pick tokens until the limit is reached', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';
    const tokens = text.split('');

    const result = pickUntilFromStart(
      text,
      (data: string) => data.split('').length,
    );

    expect(result).toEqual(tokens.slice(0, 10).join(''));
  });

  test('pick tokens until the limit is reached with custom tokens to pick', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';
    const tokens = text.split('');

    const result = pickUntilFromStart(
      text,
      (data: string) => data.split('').length,
      {
        tokensToPick: 5,
      },
    );

    expect(result).toEqual(tokens.slice(0, 5).join(''));
  });

  test('pick all tokens if the limit is not reached', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';

    const result = pickUntilFromStart(
      text,
      (data: string) => data.split('').length,
      {
        tokensToPick: 100,
      },
    );

    expect(result).toEqual(text);
  });

  test('pick tokens until the limit is reached from the end', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';
    const tokens = text.split('');

    const result = pickUntilFromEnd(
      text,
      (data: string) => data.split('').length,
    );

    expect(result).toEqual(tokens.slice(-10).join(''));
  });

  test('pick tokens until the limit is reached from the end with custom tokens to pick', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';
    const tokens = text.split('');

    const result = pickUntilFromEnd(
      text,
      (data: string) => data.split('').length,
      {
        tokensToPick: 5,
      },
    );

    expect(result).toEqual(tokens.slice(-5).join(''));
  });

  test('pick all tokens if the limit is not reached from the end', () => {
    const text = 'abcdefghijklmnopqrstuvwxyz';

    const result = pickUntilFromEnd(
      text,
      (data: string) => data.split('').length,
      {
        tokensToPick: 100,
      },
    );

    expect(result).toEqual(text);
  });
});
