const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.join(projectRoot, 'public', 'pdfjs')

function tryCopy(srcRelPaths, destPath) {
  for (const rel of srcRelPaths) {
    const src = path.join(projectRoot, rel)
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.copyFileSync(src, destPath)
      console.log(`copied: ${src} -> ${destPath}`)
      return true
    }
  }
  return false
}

const dest = path.join(publicDir, 'pdf.worker.min.js')

// Try common locations for the worker in pdfjs-dist
const candidates = [
  'node_modules/pdfjs-dist/build/pdf.worker.min.js',
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'node_modules/pdfjs-dist/pdf.worker.min.js',
  'node_modules/pdfjs-dist/pdf.worker.min.mjs',
]

if (!tryCopy(candidates, dest)) {
  console.error('pdf.worker not found in expected node_modules locations. Please run `pnpm add pdfjs-dist` or copy the worker manually.')
  process.exitCode = 1
} else {
  // Write an informational file with the version encoded (optional)
  try {
    const pkg = require(path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'package.json'))
    if (pkg && pkg.version) {
      fs.writeFileSync(path.join(publicDir, 'pdf.worker.version.txt'), pkg.version)
    }
  } catch (e) {
    // ignore
  }
}
