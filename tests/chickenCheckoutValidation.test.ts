import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chickenCheckoutError } from '../src/lib/chickenCheckoutValidation';

test('empty phone in the reported coupon request is rejected specifically as phone', () => {
  assert.equal(chickenCheckoutError('Vani', '', 1)?.field, 'phone');
});
test('phone must contain exactly ten numeric digits', () => {
  for (const phone of ['123456789', '12345678901', '12345abc90']) assert.equal(chickenCheckoutError('Customer', phone, 1)?.field, 'phone');
  assert.equal(chickenCheckoutError('Customer', '9999999999', 1), null);
});
test('name and selected products are required independently', () => {
  assert.equal(chickenCheckoutError('', '9999999999', 1)?.field, 'name');
  assert.equal(chickenCheckoutError('Customer', '9999999999', 0)?.field, 'items');
});