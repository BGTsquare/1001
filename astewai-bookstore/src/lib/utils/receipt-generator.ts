import type { PurchaseRequest } from '@/types';
import { format } from 'date-fns';

interface ReceiptData {
  request: PurchaseRequest;
  user: {
    id: string;
    email: string;
    display_name: string;
  };
}

interface ReceiptTemplateData {
  itemName: string;
  itemType: string;
  receiptNumber: string;
  receiptDate: string;
  request: PurchaseRequest;
  user: {
    id: string;
    email: string;
    display_name: string;
  };
}

export async function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  const { request, user } = data;
  
  const itemName = request.book?.title || request.bundle?.title || 'Unknown Item';
  const itemType = request.item_type === 'book' ? 'Book' : 'Bundle';
  const receiptNumber = `AST-${request.id.slice(-8).toUpperCase()}`;
  const receiptDate = format(new Date(request.updated_at || request.created_at), 'MMMM d, yyyy');

  const templateData: ReceiptTemplateData = {
    itemName,
    itemType,
    receiptNumber,
    receiptDate,
    request,
    user
  };

  // Try to generate PDF from HTML, fallback to text
  try {
    const htmlContent = generateReceiptHTML(templateData);
    return await generatePDFFromHTML(htmlContent);
  } catch (error) {
    console.warn('PDF generation failed, falling back to text format:', error);
    return generateTextReceipt(templateData);
  }
}

function generateReceiptHTML(data: ReceiptTemplateData): string {
  const { itemName, itemType, receiptNumber, receiptDate, request, user } = data;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt - ${receiptNumber}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
            line-height: 1.6;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #2563eb;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .info-section {
            flex: 1;
          }
          .info-section h3 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #374151;
          }
          .info-section p {
            margin: 5px 0;
            font-size: 14px;
          }
          .item-details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #e5e7eb;
          }
          .item-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
          }
          .item-title {
            font-size: 18px;
            font-weight: bold;
            margin-right: 10px;
          }
          .item-type {
            background: #e5e7eb;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .item-author {
            color: #6b7280;
            margin-bottom: 10px;
          }
          .item-description {
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
          }
          .payment-summary {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border: 1px solid #bfdbfe;
          }
          .payment-summary h3 {
            margin-bottom: 15px;
            color: #1e40af;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .summary-total {
            display: flex;
            justify-content: space-between;
            font-size: 18px;
            font-weight: bold;
            padding-top: 15px;
            border-top: 2px solid #bfdbfe;
            color: #059669;
          }
          .additional-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .additional-info h4 {
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: bold;
          }
          .additional-info p {
            font-size: 13px;
            color: #6b7280;
            background: white;
            padding: 10px;
            border-radius: 4px;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          .footer p {
            margin: 5px 0;
          }
          .status-badge {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <!-- Header -->
          <div class="header">
            <div class="logo">Astewai Digital Bookstore</div>
            <div class="subtitle">Digital Content Purchase Receipt</div>
          </div>

          <!-- Receipt Info -->
          <div class="receipt-info">
            <div class="info-section">
              <h3>Receipt Information</h3>
              <p><strong>Receipt #:</strong> ${receiptNumber}</p>
              <p><strong>Date:</strong> ${receiptDate}</p>
              <p><strong>Status:</strong> <span class="status-badge">${request.status === 'completed' ? 'Completed' : 'Approved'}</span></p>
            </div>
            
            <div class="info-section">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${user.display_name}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Customer ID:</strong> ${user.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          <!-- Item Details -->
          <div class="item-details">
            <h3>Purchase Details</h3>
            <div class="item-header">
              <div class="item-title">${itemName}</div>
              <div class="item-type">${itemType}</div>
            </div>
            ${request.book?.author ? `<div class="item-author">by ${request.book.author}</div>` : ''}
            ${(request.book?.description || request.bundle?.description) ? 
              `<div class="item-description">${request.book?.description || request.bundle?.description}</div>` : ''}
            <div style="margin-top: 15px; display: flex; justify-content: space-between; font-size: 14px;">
              <div><strong>Item ID:</strong> ${request.item_id}</div>
              <div><strong>Purchase Date:</strong> ${format(new Date(request.created_at), 'MMM d, yyyy')}</div>
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="payment-summary">
            <h3>Payment Summary</h3>
            <div class="summary-row">
              <span>Item Price:</span>
              <span>$${request.amount.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Taxes:</span>
              <span>$0.00</span>
            </div>
            <div class="summary-row">
              <span>Fees:</span>
              <span>$0.00</span>
            </div>
            <div class="summary-total">
              <span>Total Paid:</span>
              <span>$${request.amount.toFixed(2)}</span>
            </div>
          </div>

          ${(request.user_message || request.admin_notes) ? `
          <!-- Additional Information -->
          <div class="additional-info">
            <h3>Additional Information</h3>
            ${request.user_message ? `
              <h4>Customer Message:</h4>
              <p>${request.user_message}</p>
            ` : ''}
            ${request.admin_notes ? `
              <h4>Admin Notes:</h4>
              <p>${request.admin_notes}</p>
            ` : ''}
          </div>
          ` : ''}

          <!-- Footer -->
          <div class="footer">
            <p><strong>Thank you for your purchase!</strong></p>
            <p>This is a digital receipt for your records.</p>
            <p>For support, contact us at support@astewai.com</p>
            <p style="margin-top: 20px;">Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' HH:mm')}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateTextReceipt(data: ReceiptTemplateData): Buffer {
  const { itemName, itemType, receiptNumber, receiptDate, request, user } = data;
  
  const textContent = `
ASTEWAI DIGITAL BOOKSTORE
Payment Receipt

Receipt #: ${receiptNumber}
Date: ${receiptDate}
Status: ${request.status === 'completed' ? 'Completed' : 'Approved'}

Customer: ${user.display_name}
Email: ${user.email}

Item: ${itemName} (${itemType})
${request.book?.author ? `Author: ${request.book.author}` : ''}
Amount: $${request.amount.toFixed(2)}

Thank you for your purchase!
Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' HH:mm')}
  `;

  return Buffer.from(textContent, 'utf-8');
}

// Helper function to convert HTML to PDF using puppeteer (if available)
export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  try {
    // This would require puppeteer to be installed
    // const puppeteer = require('puppeteer');
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdf = await page.pdf({
    //   format: 'A4',
    //   printBackground: true,
    //   margin: {
    //     top: '20px',
    //     right: '20px',
    //     bottom: '20px',
    //     left: '20px'
    //   }
    // });
    // await browser.close();
    // return pdf;
    
    // Fallback: return HTML as text for now
    return Buffer.from(html, 'utf-8');
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error; // Re-throw to trigger fallback in main function
  }
}