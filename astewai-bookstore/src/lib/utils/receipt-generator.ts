/**
 * Minimal receipt PDF generator shim.
 * Produces a tiny PDF-like buffer as a placeholder for builds and tests.
 * Replace with a real implementation when ready (e.g., pdfkit, puppeteer).
 */
export async function generateReceiptPDF({ request, user }: { request: any; user: any }): Promise<Buffer> {
  const content = `Receipt for ${user?.email || 'customer'} - Request ${request?.id || 'N/A'}`
  // Return a Buffer so callers can set Content-Type application/pdf. This is not a real PDF.
  return Buffer.from(content, 'utf-8')
}

export default generateReceiptPDF
