export default function ResultLayout({
  children,
  pairing,
}: {
  children: React.ReactNode
  pairing: React.ReactNode
}) {
  return (
    <>
      {children}
      {pairing}
    </>
  )
}
