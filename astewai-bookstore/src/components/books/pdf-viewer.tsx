"use client"

import React, { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
// Required styles for text selection and annotation rendering
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

// Configure pdfjs worker.
// Next.js' bundler may not resolve the worker import from node_modules at runtime.
// A robust approach is to copy the worker file from `node_modules/pdfjs-dist/build` into
// the `public` directory (e.g. `public/pdfjs/pdf.worker.min.js`) and reference it via a static URL.
// See README below for PowerShell copy commands.
// Prefer a runtime-resolved absolute URL so the worker is fetched from the same
// origin as the app (helps when the dev server or app is served on a non-default
// host/port). Wrap in try/catch to avoid throwing during server-side evaluation.
try {
  const defaultWorkerPath = '/pdfjs/pdf.worker.min.js'
  // If running in the browser, use location.origin to build an absolute URL.
  const workerPath = typeof location !== 'undefined' ? `${location.origin}${defaultWorkerPath}` : defaultWorkerPath
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - pdfjs type may not accept all runtime shapes here
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath
} catch (err) {
  // If anything goes wrong, fall back to the relative path — react-pdf will
  // surface a helpful error and we show a fallback UI below.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js'
}

// If the worker fails to load (e.g., 404 on production), attempt to fallback to
// the published worker on unpkg for the installed pdfjs-dist version. We use
// the NEXT_PUBLIC_PDFJS_VERSION environment variable set at build time.
if (typeof window !== 'undefined') {
  const testWorker = async () => {
    const url = `${location.origin}/pdfjs/pdf.worker.min.js`
    try {
      const res = await fetch(url, { method: 'HEAD' })
      if (!res.ok) {
        const v = (process.env.NEXT_PUBLIC_PDFJS_VERSION || '').trim()
        if (v) {
          // Use unpkg CDN as a fallback
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${v}/build/pdf.worker.min.js`
        }
      }
    } catch (e) {
      // network failure - nothing else to do
    }
  }
  void testWorker()
}

interface PdfViewerProps {
  pdfUrl: string | null
  fallbackDownloadUrl?: string
}

export default function PdfViewer({ pdfUrl, fallbackDownloadUrl }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [workerFailed, setWorkerFailed] = useState(false)

  useEffect(() => {
    // reset when a new document is loaded
    setPageNumber(1)
    setScale(1.0)
  }, [pdfUrl])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1)
  }

  function onDocumentLoadError(error: unknown) {
    // If worker setup fails or document fails to parse, show fallback and
    // avoid noisy console output from pdf.js.
    // Keep a console.warn so developers still see the issue during development.
    // eslint-disable-next-line no-console
    console.warn('PDF Document load error (falling back to download):', error)
    setWorkerFailed(true)
  }

  if (!pdfUrl || workerFailed) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">Sorry, this document cannot be displayed at this time.</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col items-stretch">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setPageNumber((p) => Math.min(numPages || 1, p + 1))}
            disabled={pageNumber >= numPages}
            aria-label="Next page"
          >
            Next ›
          </button>
          <span className="text-sm text-muted-foreground">Page {pageNumber} / {numPages || '—'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
          <button
            className="btn btn-ghost"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<div className="text-muted-foreground">Loading PDF…</div>}
          error={<div className="text-muted-foreground">Failed to load PDF.</div>}
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  )
}
