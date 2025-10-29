import { NextRequest } from 'next/server'

import { JWTPayload } from '@/app/lib/auth'
import { createErrorResponse, createResponse, withRole } from '@/app/lib/api-utils'
import { prisma } from '@/app/lib/prisma'
import { createProductSchema } from '@/app/lib/validations'
import SKUGenerator from '@/app/lib/sku-generator'
import { ensureProductStockItem } from '@/app/lib/warehouse-utils'

// GET /api/products
export const GET = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF', 'WAREHOUSE_STAFF'], async (request: NextRequest, user: JWTPayload) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = {}

    // Filter by merchant if not admin and not warehouse staff
    if (user.role !== 'SJFS_ADMIN' && user.role !== 'WAREHOUSE_STAFF') {
      where.merchantId = user.merchantId
    }

    if (category) where.category = category
    if (brand) where.brand = brand
    if (isActive !== null) where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true
            }
          },
          stockItems: {
            include: {
              warehouse: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          },
          serialNumbers: {
            where: { status: 'AVAILABLE' },
            select: {
              id: true,
              serialNo: true
            }
          },
          _count: {
            select: {
              orderItems: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)
    
    return createResponse({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        totalPages, // Add this for compatibility
        totalItems: total, // Add this for compatibility
        currentPage: page // Add this for compatibility
      }
    }, 200, 'Products retrieved successfully')
  } catch (error) {
    console.error('Get products error:', error)
    return createErrorResponse('Failed to retrieve products', 500)
  }
})

// POST /api/products
export const POST = withRole(['SJFS_ADMIN', 'MERCHANT_ADMIN', 'MERCHANT_STAFF'], async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    
    // Set merchant ID
    let merchantId: string | null
    if (user.role === 'SJFS_ADMIN') {
      // For admins, merchantId is now required
      merchantId = body.merchantId ?? null
      if (!merchantId) {
        return createErrorResponse('Merchant ID is required. Admins must select a merchant to create a product.', 400)
      }
    } else {
      // For non-admin users, use their merchantId (required)
      merchantId = user.merchantId ?? null
      if (!merchantId) {
        return createErrorResponse('Merchant ID is required', 400)
      }
    }

    // Get merchant's primary warehouse for SKU generation (if merchant is specified)
    let merchant = null
    if (merchantId) {
      merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          warehouses: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      })

      if (!merchant) {
        return createErrorResponse('Merchant not found', 404)
      }
    }

    // Generate auto SKU if not provided
    let sku = body.sku
    if (!sku) {
      const warehouseCode = merchant?.warehouses[0]?.city || merchant?.city || 'ADMIN'
      sku = await SKUGenerator.generateSKU({
        warehouseCode,
        category: body.category,
        merchantId: merchantId || 'admin'
      })
    }

    // Production-ready SKU uniqueness check: block only if a non-deleted product with the same SKU exists for the same merchant (or admin)
    // If you add soft-delete (isDeleted), this will future-proof the logic
    let existingProduct = await prisma.product.findFirst({
      where: {
        sku,
        merchantId: merchantId ?? null,
        // Uncomment the next line if you add soft-delete in the future:
        // isDeleted: false
      }
    });
    if (existingProduct) {
      return createErrorResponse('A product with this SKU already exists for this merchant or admin.', 400);
    }

    // Prepare product data with auto-generated SKU
    const productData = {
      ...body,
      sku,
      ...(merchantId ? { merchantId } : {})
    }

    // Extract quantity from body (not in validation schema)
    let { quantity, ...productDataWithoutQuantity } = productData

    // If no dimensions provided, default to 10x10x10
    if (!productDataWithoutQuantity.dimensions) {
      productDataWithoutQuantity.dimensions = { length: 10, width: 10, height: 10 }
    }

    // Validate the data
    const validatedData = createProductSchema.parse(productDataWithoutQuantity)

    // Create product - handle optional merchant for admins
    const createData: any = {
      ...validatedData
    }
    
    if (merchantId) {
      createData.merchant = {
        connect: { id: merchantId }
      }
    }

    const newProduct = await prisma.product.create({
      data: createData,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true
          }
        }
      }
    })

    // Always create initial stock item (even if quantity is 0)
    const initialQuantity = quantity || 0
    
    // Get any active warehouse (prefer merchant's warehouse, fallback to any)
    let warehouse: any = null;
    if (merchantId) {
      warehouse = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          warehouses: {
            where: { isActive: true },
            take: 1
          }
        }
      });
    }

    let warehouseId: string | null = null;
    if (warehouse && warehouse.warehouses && warehouse.warehouses[0]) {
      warehouseId = warehouse.warehouses[0].id;
    } else {
      let anyWarehouse = await prisma.warehouseLocation.findFirst({
        where: { isActive: true }
      });
      if (!anyWarehouse) {
        console.log('No active warehouse found, creating default warehouse...');
        anyWarehouse = await prisma.warehouseLocation.create({
          data: {
            name: 'Main Warehouse',
            code: 'MAIN-001',
            address: 'Default Address',
            city: 'Lagos',
            state: 'Lagos',
            country: 'Nigeria',
            isActive: true,
            capacity: 10000
          }
        });
        console.log('Created default warehouse:', anyWarehouse.name);
      }
      if (anyWarehouse) {
        warehouseId = anyWarehouse.id;
      }
    }

    let stockItem = null;
    if (warehouseId) {
      stockItem = await prisma.stockItem.create({
        data: {
          productId: newProduct.id,
          warehouseId: warehouseId,
          quantity: initialQuantity,
          availableQuantity: initialQuantity,
          reservedQuantity: 0,
          reorderLevel: 10, // Default reorder level
          maxStockLevel: 100 // Default max stock level
        }
      });
    }

    // Respond to client immediately after product and stock item creation
    const response = createResponse(newProduct, 201, 'Product created successfully');

    // Run audit log and stock movement creation in the background
    Promise.all([
      (async () => {
        if (stockItem && initialQuantity > 0) {
          await prisma.stockMovement.create({
            data: {
              stockItemId: stockItem.id,
              movementType: 'STOCK_IN',
              quantity: initialQuantity,
              referenceType: 'INITIAL_STOCK',
              performedBy: user.userId,
              notes: 'Initial stock entry'
            }
          });
        }
      })(),
      prisma.auditLog.create({
        data: {
          user: {
            connect: { id: user.userId }
          },
          action: 'CREATE_PRODUCT',
          entityType: 'products',
          entityId: newProduct.id,
          newValues: validatedData
        }
      })
    ]).catch((err) => {
      console.error('Background product creation tasks failed:', err);
    });

    return response;
  } catch (error) {
    console.error('Create product error:', error)
    if (error instanceof Error && error.message.includes('validation')) {
      return createErrorResponse('Invalid input data', 400)
    }
    return createErrorResponse('Failed to create product', 500)
  }
})
