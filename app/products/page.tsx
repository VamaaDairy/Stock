import { products } from "@/lib/data/products"
import { ProductList } from "@/components/products/ProductList"

export default function Products() {
  return (
    <div className="flex flex-col flex-1 p-8 bg-white">
      <h1 className="text-2xl font-semibold text-black mb-6">Products</h1>
      <ProductList products={products} />
    </div>
  )
}
