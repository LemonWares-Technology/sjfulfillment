import { NextRequest } from 'next/server'
import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'

// GET /api/export
export const GET = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'], async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const format = searchParams.get('format') || 'excel'
    const includeImages = searchParams.get('includeImages') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const itemIds = searchParams.get('itemIds')

    if (!type) {
      return createErrorResponse('Export type is required', 400)
    }

    // Build where clause based on user role and filters
    const whereClause: any = {}
    
    if (user.role === 'MERCHANT_ADMIN' && user.merchantId) {
      whereClause.merchantId = user.merchantId
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    }

    if (itemIds) {
      const ids = itemIds.split(',')
      whereClause.id = { in: ids }
    }

    let data: any[] = []
    let filename = `${type}-export`

    // Fetch data based on type
    switch (type) {
      case 'products':
        data = await fetchProductsData(whereClause, includeImages)
        filename = 'products-export'
        break
      case 'orders':
        data = await fetchOrdersData(whereClause)
        filename = 'orders-export'
        break
      case 'customers':
        data = await fetchCustomersData(whereClause)
        filename = 'customers-export'
        break
      case 'returns':
        data = await fetchReturnsData(whereClause)
        filename = 'returns-export'
        break
      case 'warehouses':
        data = await fetchWarehousesData(whereClause)
        filename = 'warehouses-export'
        break
      default:
        return createErrorResponse('Unsupported export type', 400)
    }

    // Generate file based on format
    if (format === 'excel') {
      return generateExcelFile(data, filename, type)
    } else if (format === 'pdf') {
      return generatePDFFile(data, filename, type)
    } else if (format === 'csv') {
      return generateCSVFile(data, filename, type)
    }

    return createErrorResponse('Unsupported export format', 400)

  } catch (error) {
    console.error('Export error:', error)
    return createErrorResponse('Failed to generate export', 500)
  }
})

async function fetchProductsData(whereClause: any, includeImages: boolean) {
  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      merchant: {
        select: { businessName: true }
      },
      stockItems: {
        select: { quantity: true, availableQuantity: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return products.map(product => ({
    'Product ID': product.id,
    'Name': product.name,
    'SKU': product.sku,
    'Description': product.description,
    'Category': product.category,
    'Brand': product.brand,
    'Unit Price': Number(product.unitPrice || 0),
    'Weight': Number(product.weight || 0),
    'Dimensions': product.dimensions ? JSON.stringify(product.dimensions) : '',
    'Has Expiry': product.hasExpiry,
    'Is Perishable': product.isPerishable,
    'Barcode': product.barcodeData,
    'Images': includeImages ? (product.images || []).join('; ') : (product.images || []).length,
    'Total Stock': product.stockItems.reduce((sum, item) => sum + item.quantity, 0),
    'Available Stock': product.stockItems.reduce((sum, item) => sum + item.availableQuantity, 0),
    'Merchant': product.merchant?.businessName || 'N/A',
    'Status': product.isActive ? 'Active' : 'Inactive',
    'Created At': product.createdAt.toISOString().split('T')[0],
    'Updated At': product.updatedAt.toISOString().split('T')[0]
  }))
}

async function fetchOrdersData(whereClause: any) {
  const orders = await prisma.order.findMany({
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
  })

  return orders.map(order => ({
    'Order ID': order.id,
    'Order Number': order.orderNumber,
    'Customer Name': order.customerName,
    'Customer Email': order.customerEmail,
    'Customer Phone': order.customerPhone,
    'Shipping Address': order.shippingAddress ? JSON.stringify(order.shippingAddress) : '',
    'Total Amount': Number(order.totalAmount),
    'Delivery Fee': Number(order.deliveryFee),
    'Payment Method': order.paymentMethod,
    'Status': order.status,
    'Items Count': order.orderItems.length,
    'Items': order.orderItems.map(item => `${item.product.name} (${item.quantity}x)`).join('; '),
    'Merchant': order.merchant?.businessName || 'N/A',
    'Created At': order.createdAt.toISOString().split('T')[0],
    'Updated At': order.updatedAt.toISOString().split('T')[0]
  }))
}

async function fetchCustomersData(whereClause: any) {
  // Get unique customers from orders
  const orders = await prisma.order.findMany({
    where: whereClause,
    select: {
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      totalAmount: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Group by customer email
  const customerMap = new Map()
  orders.forEach(order => {
    if (!customerMap.has(order.customerEmail)) {
      customerMap.set(order.customerEmail, {
        'Customer Name': order.customerName,
        'Email': order.customerEmail,
        'Phone': order.customerPhone,
        'Total Orders': 0,
        'Total Spent': 0,
        'First Order': order.createdAt.toISOString().split('T')[0],
        'Last Order': order.createdAt.toISOString().split('T')[0]
      })
    }
    
    const customer = customerMap.get(order.customerEmail)
    customer['Total Orders'] += 1
    customer['Total Spent'] += Number(order.totalAmount)
    if (order.createdAt < new Date(customer['First Order'])) {
      customer['First Order'] = order.createdAt.toISOString().split('T')[0]
    }
    if (order.createdAt > new Date(customer['Last Order'])) {
      customer['Last Order'] = order.createdAt.toISOString().split('T')[0]
    }
  })

  return Array.from(customerMap.values())
}

async function fetchReturnsData(whereClause: any) {
  const returns = await prisma.return.findMany({
    where: whereClause,
    include: {
      order: {
        select: {
          orderNumber: true,
          customerName: true,
          customerEmail: true
        }
      },
      returnItems: {
        include: {
          orderItem: {
            include: {
              product: {
                select: { name: true, sku: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return returns.map(returnItem => ({
    'Return ID': returnItem.id,
    'Return Number': returnItem.returnNumber,
    'Order Number': returnItem.order.orderNumber,
    'Customer Name': returnItem.order.customerName,
    'Customer Email': returnItem.order.customerEmail,
    'Reason': returnItem.reason,
    'Status': returnItem.status,
    'Refund Amount': Number(returnItem.refundAmount),
    'Items Count': returnItem.returnItems.length,
    'Items': returnItem.returnItems.map(item => 
      `${item.orderItem.product.name} (${item.quantity}x) - ${item.condition}`
    ).join('; '),
    'Requested At': returnItem.createdAt.toISOString().split('T')[0],
    'Processed At': returnItem.processedAt ? returnItem.processedAt.toISOString().split('T')[0] : ''
  }))
}

async function fetchWarehousesData(whereClause: any) {
  const warehouses = await prisma.warehouseLocation.findMany({
    where: whereClause,
    include: {
      zones: {
        select: {
          name: true,
          code: true,
          zoneType: true,
          capacity: true,
          isActive: true
        }
      },
      merchants: {
        select: { businessName: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return warehouses.map(warehouse => ({
    'Warehouse ID': warehouse.id,
    'Name': warehouse.name,
    'Code': warehouse.code,
    'Address': warehouse.address,
    'City': warehouse.city,
    'State': warehouse.state,
    'Country': warehouse.country,
    'Capacity': warehouse.capacity,
    'Zones Count': warehouse.zones.length,
    'Zones': warehouse.zones.map(zone => 
      `${zone.name} (${zone.zoneType}) - ${zone.capacity} units`
    ).join('; '),
    'Merchants Count': warehouse.merchants.length,
    'Merchants': warehouse.merchants.map(m => m.businessName).join('; '),
    'Status': warehouse.isActive ? 'Active' : 'Inactive',
    'Created At': warehouse.createdAt.toISOString().split('T')[0]
  }))
}

async function generateExcelFile(data: any[], filename: string, type: string) {
  const ExcelJS = require('exceljs')
  const workbook = new ExcelJS.Workbook()
  
  const worksheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Export`)
  
  if (data.length === 0) {
    worksheet.addRow(['No data available'])
    const buffer = await workbook.xlsx.writeBuffer()
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`
      }
    })
  }

  // Add headers
  const headers = Object.keys(data[0])
  worksheet.addRow(headers)

  // Style headers
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }

  // Add data
  data.forEach(row => {
    const values = headers.map(header => row[header])
    worksheet.addRow(values)
  })

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })
    column.width = Math.min(maxLength + 2, 50)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`
    }
  })
}

async function generatePDFFile(data: any[], filename: string, type: string) {
  const PDFDocument = require('pdfkit')
  const doc = new PDFDocument()
  
  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  
  return new Promise<Response>((resolve) => {
    doc.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`
        }
      }))
    })

    // Add content to PDF
    doc.fontSize(20).text(`${type.charAt(0).toUpperCase() + type.slice(1)} Export Report`, 50, 50)
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80)
    doc.text(`Total Records: ${data.length}`, 50, 100)
    
    let yPosition = 130
    
    if (data.length === 0) {
      doc.text('No data available', 50, yPosition)
    } else {
      // Add table headers
      const headers = Object.keys(data[0])
      const colWidth = 500 / headers.length
      
      headers.forEach((header, index) => {
        doc.text(header, 50 + (index * colWidth), yPosition, { width: colWidth - 10 })
      })
      
      yPosition += 20
      
      // Add data rows (limit to first 50 rows for PDF)
      data.slice(0, 50).forEach((row, rowIndex) => {
        if (yPosition > 700) {
          doc.addPage()
          yPosition = 50
        }
        
        headers.forEach((header, colIndex) => {
          const value = row[header] ? row[header].toString().substring(0, 20) : ''
          doc.text(value, 50 + (colIndex * colWidth), yPosition, { width: colWidth - 10 })
        })
        
        yPosition += 15
      })
      
      if (data.length > 50) {
        doc.text(`... and ${data.length - 50} more records`, 50, yPosition + 10)
      }
    }
    
    doc.end()
  })
}

async function generateCSVFile(data: any[], filename: string, type: string) {
  if (data.length === 0) {
    return new Response('No data available', {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    })
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}.csv"`
    }
  })
}

