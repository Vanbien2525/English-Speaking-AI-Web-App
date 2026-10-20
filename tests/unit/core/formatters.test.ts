import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatScoreBasisPoints } from '../../../src/core/utils/formatters.ts';

describe('formatScoreBasisPoints', () => {
  it('formats standard basis points scores correctly', () => {
    assert.equal(formatScoreBasisPoints(8500), '85.00%');
    assert.equal(formatScoreBasisPoints(5000), '50.00%');
    assert.equal(formatScoreBasisPoints(1234), '12.34%');
    assert.equal(formatScoreBasisPoints(50), '0.50%');
  });

  it('handles boundary values 0 and 10000', () => {
    assert.equal(formatScoreBasisPoints(0), '0.00%');
    assert.equal(formatScoreBasisPoints(10000), '100.00%');
  });

  it('clamps values lower than 0 to 0.00%', () => {
    assert.equal(formatScoreBasisPoints(-1), '0.00%');
    assert.equal(formatScoreBasisPoints(-5000), '0.00%');
  });

  it('clamps values higher than 10000 to 100.00%', () => {
    assert.equal(formatScoreBasisPoints(10001), '100.00%');
    assert.equal(formatScoreBasisPoints(15000), '100.00%');
  });
});
