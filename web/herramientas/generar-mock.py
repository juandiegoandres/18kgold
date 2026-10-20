#!/usr/bin/env python3
"""Genera web/public/mock/catalogo.json desde la BD vieja (legado-php/data/18gold.sqlite).

Uso (desde la raíz del repo):
    python3 web/herramientas/generar-mock.py

- El precio se calcula igual que el Worker (ARQUITECTURA §1): gramo → peso × precio_gramo + mano_obra;
  pieza → precio_pieza; descuento (porcentaje | valor) y redondeo a la centena.
- Copia las fotos tal cual a web/public/mock/productos/.
- Quita emojis de las descripciones (regla: sin emojis en la interfaz).
- El mock NO va a producción: el workflow borra dist/mock después del build.
"""
import json, re, shutil, sqlite3, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
BD = RAIZ / 'legado-php/data/18gold.sqlite'
FOTOS = RAIZ / 'legado-php/public/uploads/productos'
SALIDA = RAIZ / 'web/public/mock'

EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍]')


def numero(v):
    return float(str(v or '0').replace('.', '').replace(',', '.') or 0)


def centena(x):
    # round() de PHP: mitades hacia arriba
    return int((x / 100) + 0.5) * 100 if x >= 0 else -int((-x / 100) + 0.5) * 100


def main():
    con = sqlite3.connect(BD)
    con.row_factory = sqlite3.Row
    aj = {r['clave']: r['valor'] for r in con.execute('select clave, valor from ajustes')}
    gramo = {'nacional': numero(aj['precio_gramo_nacional']), 'italiano': numero(aj['precio_gramo_italiano'])}
    ult = con.execute('select max(creado) from precios_historial').fetchone()[0]

    cats = [dict(r) for r in con.execute('select id, slug, nombre, orden from categorias order by orden')]
    por_id = {c['id']: c for c in cats}

    (SALIDA / 'productos').mkdir(parents=True, exist_ok=True)
    productos = []
    filas = con.execute('select * from productos where activo = 1 order by id').fetchall()
    for p in filas:
        if p['tipo_precio'] == 'pieza':
            base = float(p['precio_pieza'] or 0)
        else:
            base = float(p['peso_gramos'] or 0) * gramo.get(p['tipo_oro'], gramo['nacional']) + float(p['mano_obra'] or 0)
        final = base
        dv = float(p['descuento_val'] or 0)
        if p['descuento_tipo'] == 'porcentaje' and dv > 0:
            final = base - base * dv / 100
        elif p['descuento_tipo'] == 'valor' and dv > 0:
            final = max(0, base - dv)
        base, final = centena(base), centena(final)

        rutas = [r[0] for r in con.execute('select ruta from producto_imagenes where producto_id = ? order by orden, id', (p['id'],))]
        if not rutas and p['imagen']:
            rutas = [p['imagen']]
        imagenes = []
        for ruta in rutas:
            origen = FOTOS / ruta
            if not origen.exists():
                continue
            destino = SALIDA / 'productos' / ruta
            if not destino.exists():
                shutil.copy(origen, destino)
            imagenes.append(f'/mock/productos/{ruta}')

        cat = por_id.get(p['categoria_id'], {})
        productos.append({
            'id': p['id'], 'slug': p['slug'], 'sku': p['sku'] or f"KP-{p['id']:03d}",
            'nombre': p['nombre'],
            'descripcion': EMOJI.sub('', p['descripcion'] or '').strip(),
            'categoria': cat.get('slug'), 'categoria_nombre': cat.get('nombre'),
            'tipo_oro': p['tipo_oro'], 'tipo_precio': p['tipo_precio'],
            'peso_gramos': float(p['peso_gramos'] or 0), 'medidas': p['medidas'] or '',
            'precio': final, 'precio_antes': base if final < base else None,
            'destacado': bool(p['destacado']), 'imagenes': imagenes, 'creado': p['creado'],
        })

    datos = {
        'marca': aj.get('marca', '18gold KPrada'),
        'precios': {'nacional': gramo['nacional'], 'italiano': gramo['italiano'], 'actualizado': ult},
        'ajustes': {
            'whatsapp': aj.get('whatsapp', '573178861724'), 'instagram': aj.get('instagram', '18GOLDKPRADA'),
            'tiktok': aj.get('tiktok', '18goldKprada'), 'anuncio': aj.get('anuncio', ''),
            'hechura_gramo': numero(aj.get('hechura_gramo', '60000')),
            'envio_valor': numero(aj.get('envio_valor', '15000')),
            'envio_gratis_desde': numero(aj.get('envio_gratis_desde', '500000')),
        },
        'categorias': [{'slug': c['slug'], 'nombre': c['nombre'], 'orden': c['orden']} for c in cats],
        'productos': productos,
    }
    (SALIDA / 'catalogo.json').write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(productos)} productos → {SALIDA / "catalogo.json"}', file=sys.stderr)


if __name__ == '__main__':
    main()
