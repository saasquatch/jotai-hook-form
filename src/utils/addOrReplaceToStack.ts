import { ErrorStack, ErrorType } from '../core/types';

export function addOrReplaceToStack(
  stack: ErrorStack,
  error: ErrorType | undefined
) {
  if (!error) return stack;

  const hasSimilarError = stack.findIndex(
    e =>
      e.jsonPointer === error.jsonPointer && e.error?.type === error.error?.type
  );

  if (hasSimilarError === -1) {
    return [...stack, error];
  }

  const rep = stack.slice();
  rep[hasSimilarError] = error;
  return rep;
}
