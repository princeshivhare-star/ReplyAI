import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const children = [
  spawn(process.execPath, [resolve(root, 'api/dev-server.js')], { cwd: root, stdio: 'inherit' }),
  spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1'], { cwd: root, stdio: 'inherit' }),
]

let shuttingDown = false
function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM')
  }
  process.exitCode = exitCode
}

for (const child of children) {
  child.on('error', (error) => {
    console.error('Unable to start development service:', error.message)
    shutdown(1)
  })
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`Development service exited (${signal || code})`)
      shutdown(code || 1)
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
