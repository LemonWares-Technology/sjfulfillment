import { NextRequest } from 'next/server'
import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'

// GET /api/analytics/export
export const GET = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN'], async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end') || new Date().toISOString()
    const format = searchParams.get('format') || 'excel'

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // Build where clause based on user role
    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end
      }
    }

    if (user.role === 'MERCHANT_ADMIN' && user.merchantId) {
      whereClause.merchantId = user.merchantId
    }

    // Get comprehensive data for export
    const [
      orders,
      products,
      orderItems
    ] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          merchant: {
            select: { businessName: true }
          },
          orderItems: {
            include: {
              product: {
                select: { name: true, sku: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.findMany({
        where: user.role === 'MERCHANT_ADMIN' && user.merchantId ? { merchantId: user.merchantId } : {},
        include: {
          stockItems: {
            select: { quantity: true }
          }
        }
      }),
      prisma.orderItem.findMany({
        where: {
          order: whereClause
        },
        include: {
          product: {
            select: { name: true, sku: true, category: true }
          },
          order: {
            select: { orderNumber: true, createdAt: true }
          }
        }
      })
    ])

    if (format === 'excel') {
      // Generate Excel file
      const ExcelJS = require('exceljs')
      const workbook = new ExcelJS.Workbook()
      
      // Orders sheet
      const ordersSheet = workbook.addWorksheet('Orders')
      ordersSheet.columns = [
        { header: 'Order Number', key: 'orderNumber', width: 15 },
        { header: 'Customer Name', key: 'customerName', width: 20 },
        { header: 'Customer Email', key: 'customerEmail', width: 25 },
        { header: 'Total Amount', key: 'totalAmount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Order Date', key: 'createdAt', width: 20 },
        { header: 'Merchant', key: 'merchantName', width: 20 }
      ]

      orders.forEach(order => {
        ordersSheet.addRow({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          totalAmount: Number(order.totalAmount),
          status: order.status,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt.toISOString().split('T')[0],
          merchantName: order.merchant?.businessName || 'N/A'
        })
      })

      // Products sheet
      const productsSheet = workbook.addWorksheet('Products')
      productsSheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Unit Price', key: 'unitPrice', width: 15 },
        { header: 'Current Stock', key: 'currentStock', width: 15 },
        { header: 'Status', key: 'isActive', width: 10 }
      ]

      products.forEach(product => {
        const totalStock = product.stockItems.reduce((sum, item) => sum + item.quantity, 0)
        productsSheet.addRow({
          sku: product.sku,
          name: product.name,
          category: product.category || 'Uncategorized',
          unitPrice: Number(product.unitPrice || 0),
          currentStock: totalStock,
          isActive: product.isActive ? 'Active' : 'Inactive'
        })
      })

      // Order Items sheet
      const orderItemsSheet = workbook.addWorksheet('Order Items')
      orderItemsSheet.columns = [
        { header: 'Order Number', key: 'orderNumber', width: 15 },
        { header: 'Product SKU', key: 'productSku', width: 15 },
        { header: 'Product Name', key: 'productName', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Order Date', key: 'orderDate', width: 20 }
      ]

      orderItems.forEach(item => {
        orderItemsSheet.addRow({
          orderNumber: item.order.orderNumber,
          productSku: item.product.sku,
          productName: item.product.name,
          category: item.product.category || 'Uncategorized',
          quantity: item.quantity,
          orderDate: item.order.createdAt.toISOString().split('T')[0]
        })
      })

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer()

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="analytics-report-${startDate.split('T')[0]}-to-${endDate.split('T')[0]}.xlsx"`
        }
      })

    } else if (format === 'pdf') {
      // Generate PDF file
      const PDFDocument = require('pdfkit')
      const doc = new PDFDocument()
      
      // Set up response headers
      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      
      return new Promise<Response>((resolve) => {
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks)
          resolve(new Response(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="analytics-report-${startDate.split('T')[0]}-to-${endDate.split('T')[0]}.pdf"`
            }
          }))
        })

        // Add content to PDF
        doc.fontSize(20).text('Analytics Report', 50, 50)
        doc.fontSize(12).text(`Period: ${startDate.split('T')[0]} to ${endDate.split('T')[0]}`, 50, 80)
        
        let yPosition = 120
        
        // Orders summary
        doc.fontSize(16).text('Orders Summary', 50, yPosition)
        yPosition += 30
        
        doc.fontSize(12).text(`Total Orders: ${orders.length}`, 50, yPosition)
        yPosition += 20
        
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
        doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 50, yPosition)
        yPosition += 20
        
        // Status breakdown
        const statusCounts = orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        doc.text('Status Breakdown:', 50, yPosition)
        yPosition += 20
        
        Object.entries(statusCounts).forEach(([status, count]) => {
          doc.text(`  ${status}: ${count}`, 70, yPosition)
          yPosition += 15
        })
        
        yPosition += 20
        
        // Products summary
        doc.fontSize(16).text('Products Summary', 50, yPosition)
        yPosition += 30
        
        doc.fontSize(12).text(`Total Products: ${products.length}`, 50, yPosition)
        yPosition += 20
        
        const activeProducts = products.filter(p => p.isActive).length
        doc.text(`Active Products: ${activeProducts}`, 50, yPosition)
        yPosition += 20
        
        // Low stock products
        const lowStockProducts = products.filter(p => 
          p.stockItems.reduce((sum, item) => sum + item.quantity, 0) < 10
        )
        
        if (lowStockProducts.length > 0) {
          doc.text(`Low Stock Products: ${lowStockProducts.length}`, 50, yPosition)
          yPosition += 20
        }
        
        doc.end()
      })
    }

    return createErrorResponse('Unsupported format', 400)

  } catch (error) {
    console.error('Export analytics error:', error)
    return createErrorResponse('Failed to export analytics data', 500)
  }
})

