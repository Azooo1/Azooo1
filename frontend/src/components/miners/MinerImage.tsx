import { getMinerImageById, getMinerTier } from '../../utils/minerTheme'

export default function MinerImage({
  minerTypeId,
  price,
  image,
  className = 'h-24 w-24 object-contain',
}: {
  minerTypeId: string
  price: number
  image?: string | null
  className?: string
}) {
  const tier = getMinerTier(price)
  const src = image || getMinerImageById(minerTypeId, price)
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={(e) => {
        ;(e.target as HTMLImageElement).src = tier.image
      }}
    />
  )
}
