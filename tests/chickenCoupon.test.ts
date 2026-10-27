import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chickenCouponDiscount, couponPhoneStatus } from '../supabase/functions/_shared/chickenCoupon';

test('100% coupon makes one full pack free, second quantity stays paid', () => {
  const lines = [{productId:'quarter', weight:'250 g', quantity:2, price:120}];
  assert.equal(240 - chickenCouponDiscount(lines,100),120);
});
test('100% coupon takes the full price of one pack of any size', () => {
  assert.equal(chickenCouponDiscount([{productId:'q',weight:'250 gm',quantity:1,price:120}],100),120);
  assert.equal(chickenCouponDiscount([{productId:'h',weight:'500 g',quantity:1,price:250}],100),250);
  assert.equal(chickenCouponDiscount([{productId:'k',weight:'1 kg',quantity:1,price:480}],100),480);
});
test('two 500 g packs at 250 each deduct 250 so one pack stays paid', () => {
  assert.equal(500-chickenCouponDiscount([{productId:'h',weight:'500 g',quantity:2,price:250}],100),250);
});
test('partial percentages apply to one pack only', () => {
  assert.equal(chickenCouponDiscount([{productId:'h',weight:'500 g',quantity:2,price:250}],50),125);
});
test('unpriced lines grant no discount', () => {
  assert.equal(chickenCouponDiscount([{productId:'x',weight:'Standard',quantity:1,price:0}],100),0);
});
test('multiple variants discount only the single highest-priced pack', () => {
  assert.equal(chickenCouponDiscount([{productId:'a',weight:'250 g',quantity:2,price:120},{productId:'b',weight:'500 g',quantity:1,price:250}],100),250);
});
test('a phone cannot redeem again, including from a different account', () => {
  assert.equal(couponPhoneStatus('a','a',true),'used');
  assert.equal(couponPhoneStatus('a','b',true),'used');
  assert.equal(couponPhoneStatus('a','b',false),'other-account');
  assert.equal(couponPhoneStatus('a','a',false),'resume');
});
