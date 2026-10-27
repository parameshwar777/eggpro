import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chickenCouponDiscount, couponPhoneStatus } from '../supabase/functions/_shared/chickenCoupon';
import { eligibleOfferLines, OFFER_PRODUCT_ERROR } from '../supabase/functions/_shared/offerProducts';

test('product-specific coupon rejects a different chicken product', () => {
  assert.throws(() => chickenCouponDiscount([{productId:'other',quantity:1,price:250}],100,'selected'), {message:OFFER_PRODUCT_ERROR});
});
test('mixed cart discounts only one pack of the selected product', () => {
  assert.equal(chickenCouponDiscount([{productId:'selected',quantity:2,price:250},{productId:'other',quantity:1,price:500}],100,'selected'),250);
});
test('different weight variant cannot use the product-specific offer', () => {
  assert.throws(() => eligibleOfferLines([{productId:'half-kg',quantity:1}], 'one-kg'), {message:OFFER_PRODUCT_ERROR});
});

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
test('changing an applied 100% coupon from one 250-rupee pack to two retains the free pack', () => {
  const totals = [1,2,1].map(quantity => quantity * 250 - chickenCouponDiscount([{productId:'h',weight:'500 g',quantity,price:250}],100));
  assert.deepEqual(totals,[0,250,0]);
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
