import { Link } from 'react-router'

export default function NoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container">
        <span className="material-symbols-outlined text-[48px] text-primary">checkroom</span>
      </div>
      <h1 className="text-2xl font-semibold text-on-surface">No encontramos lo que buscabas</h1>
      <p className="mt-2 text-sm text-on-surface-variant">La página que pediste no existe o fue movida.</p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-hover"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
