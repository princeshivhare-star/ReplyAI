import test from 'node:test'
import assert from 'node:assert/strict'
import { findMatchingRule, matchesRule } from './_rules.js'

test('contains matching is case-insensitive', () => {
  assert.equal(matchesRule('How much is THIS?', { keyword: 'this', match_type: 'contains' }), true)
  assert.equal(matchesRule('Shipping?', { keyword: 'price', match_type: 'contains' }), false)
})

test('exact matching trims surrounding whitespace', () => {
  assert.equal(matchesRule('  PRICE  ', { keyword: 'price', match_type: 'exact' }), true)
  assert.equal(matchesRule('price today', { keyword: 'price', match_type: 'exact' }), false)
})

test('startsWith matches only the beginning of a message', () => {
  assert.equal(matchesRule('Shipping to Canada?', { keyword: 'shipping', match_type: 'startsWith' }), true)
  assert.equal(matchesRule('Do you offer shipping?', { keyword: 'shipping', match_type: 'startsWith' }), false)
})

test('the first matching rule wins', () => {
  const first = { keyword: 'price', match_type: 'contains', reply_message: 'first' }
  const second = { keyword: 'price', match_type: 'contains', reply_message: 'second' }
  assert.equal(findMatchingRule('What is the price?', [first, second]), first)
  assert.equal(findMatchingRule('Hello', [first, second]), null)
})
