import { Suspense } from 'react'
import { Outlet } from 'react-router'
import Toasts from '@/shared/components/Toasts'
import SesionExpirada from '@/shared/components/SesionExpirada'

export default function Raiz() {
  return (
    <>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
      <Toasts />
      <SesionExpirada />
    </>
  )
}
