import test from 'node:test'
import assert from 'node:assert/strict'
import { PLAN_LIMITS } from './_plans.js'

test('free and paid plans have matching rule and monthly AI limits', () => {
  assert.deepEqual(PLAN_LIMITS.free, { name: 'Free', ruleLimit: 3, monthlyAiLimit: 20 })
  assert.deepEqual(PLAN_LIMITS.starter, { name: 'Starter', ruleLimit: 5, monthlyAiLimit: 50 })
  assert.deepEqual(PLAN_LIMITS.growth, { name: 'Growth', ruleLimit: null, monthlyAiLimit: 1000 })
})
