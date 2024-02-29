import Head from '@/app/editor/head'

export default function Layout({ children }) {
  return (
    <>
      <Head />
      {children}
    </>
  )
}
