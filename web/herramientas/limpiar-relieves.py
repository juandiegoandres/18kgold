# SOLO DESARROLLO. Limpia los mapas de alturas generados (fondo a 0, niveles, recorte cuadrado, 512 px, suavizado leve).
#   python3 herramientas/limpiar-relieves.py <origen.png> <destino.png> [--circulo]
import sys
import numpy as np
from PIL import Image, ImageFilter

origen, destino = sys.argv[1], sys.argv[2]
circulo = '--circulo' in sys.argv
im = Image.open(origen).convert('L')
a = np.asarray(im).astype(np.float32) / 255.0
h, w = a.shape
if circulo:
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx - w / 2, yy - h / 2)
    a[r > min(w, h) * 0.47] = 0
# Fondo: lo que está por debajo del umbral es 0; el resto se reescala a 0..1.
umbral = 0.085
a = np.clip((a - umbral) / (1 - umbral), 0, 1)
p = np.percentile(a[a > 0.02], 99.6) if (a > 0.02).any() else 1
a = np.clip(a / max(p, 1e-3), 0, 1)
# Recorte cuadrado alrededor del contenido.
ys, xs = np.where(a > 0.03)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
lado = int(max(y1 - y0, x1 - x0) * 1.03)
cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
lienzo = np.zeros((lado, lado), np.float32)
sy, sx = cy - lado // 2, cx - lado // 2
for j in range(lado):
    y = sy + j
    if 0 <= y < h:
        xa, xb = max(0, sx), min(w, sx + lado)
        lienzo[j, xa - sx:xb - sx] = a[y, xa:xb]
out = Image.fromarray((lienzo * 255).astype(np.uint8)).resize((512, 512), Image.LANCZOS)
out = out.filter(ImageFilter.GaussianBlur(1.1))
out.save(destino, optimize=True)
print(destino, 'contenido', x1 - x0, 'x', y1 - y0)
