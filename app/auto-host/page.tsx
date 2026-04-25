import DisplayView from './DisplayView'

export const metadata = { title: 'Speed Dating' }

export const dynamic = 'force-dynamic'

export default async function AutoHostPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>
}) {
  const { productId } = await searchParams

  if (!productId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-orange-800 to-orange-950 flex items-center justify-center">
        <div className="text-center text-white px-6">
          <div className="text-7xl mb-8">💛</div>
          <h1 className="text-5xl font-bold mb-4">Welcome to Speed Dating!</h1>
          <p className="text-xl text-orange-200">Get ready — the event is about to begin.</p>
        </div>
      </div>
    )
  }

  return <DisplayView productId={productId} />
}
