import { NextRequest, NextResponse } from 'next/server'
import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'
import jsPDF from 'jspdf'

// GET /api/orders/[id]/receipt
export const GET = withRole(
  ["SJFS_ADMIN", "MERCHANT_ADMIN", "MERCHANT_STAFF", "WAREHOUSE_STAFF"],
  async (request: NextRequest, user: JWTPayload, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: orderId } = await params

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          merchant: {
            select: {
              businessName: true,
              businessEmail: true,
              businessPhone: true,
              address: true,
              city: true,
              state: true,
              country: true
            }
          },
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  unitPrice: true
                }
              }
            }
          }
        }
      })

      if (!order) {
        return createErrorResponse('Order not found', 404)
      }

      // Check access permissions
      if (user.role !== 'SJFS_ADMIN' && order.merchantId !== user.merchantId) {
        return createErrorResponse('Access denied', 403)
      }

      // Generate receipt document
      console.log('Generating receipt for order:', order.orderNumber)
      const receiptBuffer = await generateReceiptDocument(order)
      console.log('Receipt generated successfully, buffer size:', receiptBuffer.length)

      // Log receipt generation
      await prisma.auditLog.create({
        data: {
          user: {
            connect: { id: user.userId }
          },
          action: 'GENERATE_RECEIPT',
          entityType: 'Order',
          entityId: orderId,
          newValues: {
            orderNumber: order.orderNumber,
            customerEmail: order.customerEmail,
            totalAmount: order.totalAmount,
            generatedAt: new Date().toISOString()
          }
        }
      })

      return new NextResponse(receiptBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${order.orderNumber}.pdf"`,
          'Content-Length': receiptBuffer.length.toString()
        }
      })

    } catch (error) {
      console.error('Receipt generation error:', error)
      return createErrorResponse('Failed to generate receipt', 500)
    }
  }
)

async function generateReceiptDocument(order: any): Promise<Buffer> {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    // HEADER - Brand Banner
    doc.setFillColor(10, 10, 10)
    doc.rect(0, 0, pageWidth, 35, 'F')
    // Add logo instead of text, properly centered and sized
    try {
      const { logoBase64 } = require('@/app/lib/logo-base64')
      const logoWidth = 60
      const logoHeight = 24
      const logoY = 10
      const logoX = (pageWidth - logoWidth) / 2
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight)
      } else {
        doc.addImage('https://sjfulfillment.com/wp-content/uploads/2020/09/cropped-Main-Logo-white-886x.png', 'PNG', logoX, logoY, logoWidth, logoHeight)
      }
    } catch (error) {
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('SJFulfillment', pageWidth / 2, 22, { align: 'center' })
    }
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Order Receipt / Invoice', pageWidth / 2, 40, { align: 'center' })
    // Metadata
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`, 20, 45)
    doc.text(`Order Number: ${order.orderNumber}`, 20, 54)
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 120, 54)
    doc.text(`Status: ${order.status}`, 20, 62)
    doc.text(`Merchant: ${order.merchant?.businessName || 'N/A'}`, 120, 62)
    doc.setDrawColor(240, 140, 23)
    doc.setLineWidth(0.5)
    doc.line(20, 66, pageWidth - 20, 66)
    let yPos = 74
    // Customer Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(240, 140, 23)
    doc.text('Customer Information', 20, yPos)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Name: ${order.customerName}`, 20, yPos + 10)
    doc.text(`Email: ${order.customerEmail}`, 20, yPos + 16)
    doc.text(`Phone: ${order.customerPhone || 'N/A'}`, 20, yPos + 22)
    yPos += 34
    // Items Table Header
    doc.setFillColor(240, 140, 23)
    doc.rect(15, yPos, pageWidth - 30, 8, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Product', 18, yPos + 5.5)
    doc.text('SKU', 80, yPos + 5.5)
    doc.text('Qty', 120, yPos + 5.5)
    doc.text('Unit Price', 140, yPos + 5.5)
    doc.text('Total', 170, yPos + 5.5)
    yPos += 8
    // Items Table Rows
    order.orderItems.forEach((item: any, index: number) => {
      if (yPos > pageHeight - 30) {
        doc.addPage()
        doc.setFillColor(240, 140, 23)
        doc.rect(0, 0, pageWidth, 20, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.text('SJFulfillment - Order Receipt (cont.)', pageWidth / 2, 12, { align: 'center' })
        yPos = 30
        doc.setFillColor(240, 140, 23)
        doc.rect(15, yPos, pageWidth - 30, 8, 'F')
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.text('Product', 18, yPos + 5.5)
        doc.text('SKU', 80, yPos + 5.5)
        doc.text('Qty', 120, yPos + 5.5)
        doc.text('Unit Price', 140, yPos + 5.5)
        doc.text('Total', 170, yPos + 5.5)
        yPos += 8
      }
      const bgColor = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255]
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
      doc.rect(15, yPos, pageWidth - 30, 7, 'F')
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')
      doc.text((item.product.name || 'Unnamed').toString().substring(0, 25), 18, yPos + 4.5)
      doc.text((item.product.sku || 'N/A').toString().substring(0, 12), 80, yPos + 4.5)
      doc.text(`${item.quantity}`, 120, yPos + 4.5)
      doc.text(`NGN ${Number(item.product.unitPrice || 0).toLocaleString()}`, 140, yPos + 4.5)
      doc.text(`NGN ${Number(item.quantity * item.product.unitPrice).toLocaleString()}`, 170, yPos + 4.5)
      yPos += 7
    })
    // Total
    yPos += 10
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(240, 140, 23)
    doc.text(`Total: NGN ${Number(order.totalAmount).toLocaleString()}`, 20, yPos)
    // Footer on all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text('SJFulfillment © 2025 - Powered by Advanced Technology', pageWidth / 2, pageHeight - 8, { align: 'center' })
      doc.text(`Page ${i} of ${pageCount} | Confidential Document`, pageWidth / 2, pageHeight - 4, { align: 'center' })
    }
    return Buffer.from(doc.output('arraybuffer'))
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
}

