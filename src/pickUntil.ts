const TOKENS_TO_PICK_DEFAULT = 10;

export function pickUntilFromStart(
  text: string,
  calculateTokenAmount: (data: string) => number,
  options?: { tokensToPick?: number },
) {
  const tokensToPick = options?.tokensToPick ?? TOKENS_TO_PICK_DEFAULT;

  let subText = '';
  let tokenAmount = 0;
  let indexEnd = 0;

  while (tokenAmount < tokensToPick && indexEnd < text.length) {
    indexEnd += 1;
    subText = text.substring(0, indexEnd);
    tokenAmount = calculateTokenAmount(subText);
  }

  return subText;
}

export function pickUntilFromEnd(
  text: string,
  calculateTokenAmount: (data: string) => number,
  options?: { tokensToPick?: number },
) {
  const tokensToPick = options?.tokensToPick ?? TOKENS_TO_PICK_DEFAULT;

  let subText = '';
  let tokenAmount = 0;
  let indexStart = text.length;

  while (tokenAmount < tokensToPick && indexStart > 0) {
    indexStart -= 1;
    subText = text.substring(indexStart);
    tokenAmount = calculateTokenAmount(subText);
  }

  return subText;
}
