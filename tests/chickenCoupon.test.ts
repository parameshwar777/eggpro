import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chickenCouponDiscount, couponPhoneStatus } from '../supabase/functions/_shared/chickenCoupon';

test('100% coupon makes only the first 250 g free, second quantity stays paid', () => {
  const lines = [{productId:'quarter', weight:'250 g', quantity:2, price:120}];
  assert.equal(240 - chickenCouponDiscount(lines,100),120);
});
test('250 g is free within quarter, half and one kilogram packs', () => {
  assert.equal(chickenCouponDiscount([{productId:'q',weight:'250 gm',quantity:1,price:120}],100),120);
  assert.equal(chickenCouponDiscount([{productId:'h',weight:'500 g',quantity:1,price:250}],100),125);
  assert.equal(chickenCouponDiscount([{productId:'k',weight:'1 kg',quantity:1,price:480}],100),120);
});
test('two 500 g packs at 250 each deduct only 125 for the first 250 g', () => {
  assert.equal(500-chickenCouponDiscount([{productId:'h',weight:'500 g',quantity:2,price:250}],100),375);
});
test('unknown weights do not grant an unchecked free portion', () => {
  assert.equal(chickenCouponDiscount([{productId:'x',weight:'Standard',quantity:1,price:250}],100),0);
});
test('multiple quarter variants still receive only one free portion', () => {
  assert.equal(chickenCouponDiscount([{productId:'a',weight:'250 g',quantity:2,price:120},{productId:'b',weight:'250 g',quantity:1,price:140}],100),140);
});
test('a phone cannot redeem again, including from a different account', () => {
  assert.equal(couponPhoneStatus('a','a',true),'used');
  assert.equal(couponPhoneStatus('a','b',true),'used');
  assert.equal(couponPhoneStatus('a','b',false),'other-account');
  assert.equal(couponPhoneStatus('a','a',false),'resume');
});