import { useReferencias } from '@/core/stores/referencias.store'
import { colorDesdeNombre, esColorClaro } from '../utils/colores'
import { cx } from '../utils/clases'

const MOSTRAR_POR_DEFECTO = ['categoria', 'color', 'talla', 'temporada']

export default function ChipsProducto({ producto: p, mostrar = MOSTRAR_POR_DEFECTO }) {
  const { nombre } = useReferencias()

  const textoDe = (atributo) => {
    switch (atributo) {
      case 'categoria':
        return p.categoria?.nombre ?? nombre('categorias', p.categoria_id)
      case 'coleccion':
        return p.coleccion?.nombre ?? nombre('colecciones', p.coleccion_id)
      case 'color':
        return p.color?.nombre ?? nombre('colores', p.color_id)
      case 'talla':
        return p.talla?.nombre ?? nombre('tallas', p.talla_id)
      case 'temporada':
        return p.temporada?.nombre ?? nombre('temporadas', p.temporada_id)
    }
    return null
  }

  const chips = []
  for (const atributo of mostrar) {
    const texto = textoDe(atributo)
    if (!texto) continue
    chips.push({ atributo, texto, muestra: atributo === 'color' ? colorDesdeNombre(texto) : null })
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span key={chip.atributo} className={cx('chip-suave', chip.atributo === 'talla' && 'font-semibold')}>
          {chip.muestra && (
            <span
              className={cx(
                'inline-block h-3 w-3 rounded-full',
                esColorClaro(chip.muestra) ? 'border border-outline' : 'border border-outline-variant',
              )}
              style={{ backgroundColor: chip.muestra }}
              aria-hidden="true"
            ></span>
          )}
          {chip.texto}
        </span>
      ))}
    </div>
  )
}
