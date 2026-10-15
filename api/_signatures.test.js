import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { constantTimeStringEqual, verifyMetaSignature } from './_signatures.js'

test('Meta webhook signature accepts the exact raw-body HMAC', () => {
  const body = Buffer.from('{"object":"instagram","entry":[]}')
  const secret = 'test-app-secret'
  const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`

  assert.equal(verifyMetaSignature(body, signature, secret), true)
  assert.equal(verifyMetaSignature(body, `${signature}x`, secret), false)
  assert.equal(verifyMetaSignature(Buffer.from('{}'), signature, secret), false)
})

test('constant-time token comparison rejects missing and unequal values', () => {
  assert.equal(constantTimeStringEqual('verify-token', 'verify-token'), true)
  assert.equal(constantTimeStringEqual('verify-token', 'other-token'), false)
  assert.equal(constantTimeStringEqual(undefined, 'verify-token'), false)
})
