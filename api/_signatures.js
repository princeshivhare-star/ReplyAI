import { createHmac, timingSafeEqual } from 'node:crypto'

export function constantTimeStringEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyMetaSignature(rawBody, signature, appSecret) {
  if (!Buffer.isBuffer(rawBody) || !signature || !appSecret) return false
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`
  return constantTimeStringEqual(signature, expected)
}
