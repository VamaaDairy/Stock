import { NextRequest, NextResponse } from "next/server"
import {
  getAllProductsFromDB,
  addProductToDB,
  updateProductInDB,
  deleteProductFromDB,
} from "@/lib/db/products"

export async function GET() {
  try {
    const products = await getAllProductsFromDB()
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name || !body.skuCode || !body.category || !body.unit) {
      return NextResponse.json(
        { success: false, error: "Product name, SKU code, category, and unit are required" },
        { status: 400 }
      )
    }

    const newProduct = await addProductToDB(body)
    return NextResponse.json({ success: true, data: newProduct })
  } catch (error) {
    console.error("POST /api/products error:", error)
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id || !body.name || !body.skuCode || !body.category || !body.unit) {
      return NextResponse.json(
        { success: false, error: "Product ID, name, SKU code, category, and unit are required" },
        { status: 400 }
      )
    }

    await updateProductInDB(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PUT /api/products error:", error)
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 })
    }

    await deleteProductFromDB(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/products error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 })
  }
}
