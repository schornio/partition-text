import { pickUntilFromEnd, pickUntilFromStart } from './pickUntil.js';

const TOKENS_PER_PARTITION_DEFAULT = 1000;

export function partitionText(
  text: string,
  calculateTokenAmount: (data: string) => number,
  options?: { paddingTokensAmount?: number; tokensPerPartition?: number },
) {
  const tokensPerPartition =
    options?.tokensPerPartition ?? TOKENS_PER_PARTITION_DEFAULT;
  const paddingTokensAmount = options?.paddingTokensAmount ?? 0;

  let slicesAmount = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const sliceSize = Math.ceil(text.length / slicesAmount);
    const partitions = [];

    let allPartitionsWithinTokenLimit = true;
    for (let i = 0; i < slicesAmount; i += 1) {
      const start = i * sliceSize;
      const end = start + sliceSize;
      const partition = text.substring(start, end);
      const tokenAmount = calculateTokenAmount(partition);

      if (tokenAmount > tokensPerPartition) {
        allPartitionsWithinTokenLimit = false;
        break;
      }

      partitions.push(partition);
    }

    if (allPartitionsWithinTokenLimit) {
      const partitionsWithPadding = [];

      let paddingStartIndex = -1;
      let paddingEndIndex = 1;

      for (const partition of partitions) {
        const paddingStartPartition = partitions[paddingStartIndex];
        const paddingStart = paddingStartPartition
          ? pickUntilFromEnd(paddingStartPartition, calculateTokenAmount, {
              tokensToPick: paddingTokensAmount,
            })
          : undefined;
        const paddingEndPartition = partitions[paddingEndIndex];
        const paddingEnd = paddingEndPartition
          ? pickUntilFromStart(paddingEndPartition, calculateTokenAmount, {
              tokensToPick: paddingTokensAmount,
            })
          : undefined;

        partitionsWithPadding.push({
          paddingEnd,
          paddingStart,
          partition,
        });

        paddingStartIndex += 1;
        paddingEndIndex += 1;
      }

      return partitionsWithPadding;
    } else {
      slicesAmount += 1;
    }
  }
}
