"use client"

import { useEffect, useState } from "react"

interface LastProduct {
  url: string
  productId: string
}

export function useLastProduct(): LastProduct | null {
  const [lastProduct, setLastProduct] = useState<LastProduct | null>(null)

  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('last_product='))
    if (!cookie) return

    const queryString = decodeURIComponent(cookie.split('=').slice(1).join('='))
    const params = new URLSearchParams(queryString)
    const productId = params.get('productId')
    if (!productId) return

    // Fetch events to verify the product is still upcoming
    fetch('/api/products/onlineSpeedDating')
      .then(res => res.ok ? res.json() : [])
      .then((events: { productId: number; gmtdatetime: string }[]) => {
        const event = events.find(e => e.productId === Number(productId))
        if (event && new Date(event.gmtdatetime) > new Date()) {
          setLastProduct({
            url: `/product?${queryString}`,
            productId,
          })
        }
      })
      .catch(() => {
        // Silently fail — don't show the button if we can't verify
      })
  }, [])

  return lastProduct
}
