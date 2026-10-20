// Movimiento: Lenis (scroll suave) + GSAP ScrollTrigger para REVELADOS AL ENTRAR.
// Nada flota ni hace parallax: los elementos aparecen una vez y se quedan quietos.
//
// Atributos que entiende revelar():
//   data-titular        titular que sube por líneas con máscara (SplitText)
//   data-linea          línea de 1px que se dibuja de izquierda a derecha
//   data-descubrir      bloque (foto) que se descubre con clip-path
//   data-aparecer       sube 14px y aparece; con ="hijos" lo hace cada hijo en cascada
//   data-contador="N"   cuenta de 0 a N (formato pesos)
//
// Seguridad: el contenido es visible por defecto (CSS no oculta nada). GSAP oculta justo antes
// de animar; lo visible al cargar se anima de inmediato y lo del final de la página se
// dispara al llegar al fondo aunque nunca alcance el 88% de la ventana (ver inicio()). Con prefers-reduced-motion no se anima nada.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { pesos } from './formato.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;

export function iniciarScrollSuave() {
  if (lenis || sinMovimiento()) return lenis;
  // Lenis y la restauración automática del navegador se pelean (la página «salta» al cargar)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function obtenerLenis() {
  return lenis;
}

export function detenerScroll(si) {
  if (!lenis) {
    document.documentElement.style.overflow = si ? 'hidden' : '';
    return;
  }
  si ? lenis.stop() : lenis.start();
}

/**
 * Inicio del revelado: cuando el borde superior llega al 88% de la ventana.
 * - Lo que ya está en pantalla al cargar tiene inicio negativo → se anima de una vez.
 * - Lo que está tan abajo que nunca llegaría al 88% se adelanta al final del scroll
 *   (no usamos clamp(): fija en 0 lo visible al cargar y lo dejaba oculto hasta mover la rueda).
 */
function inicio(el) {
  return () => {
    const pos = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.88;
    return Math.min(pos, ScrollTrigger.maxScroll(window) - 2);
  };
}

function disparador(el, extra = {}) {
  return { trigger: el, start: inicio(el), once: true, ...extra };
}

export async function revelar(raiz = document) {
  if (sinMovimiento()) return;
  const nuevos = (sel) => [...raiz.querySelectorAll(sel)].filter((el) => !el.dataset.revelado && (el.dataset.revelado = '1'));

  nuevos('[data-linea]').forEach((el) => {
    gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.out', transformOrigin: 'left center', scrollTrigger: disparador(el) });
  });

  nuevos('[data-descubrir]').forEach((el) => {
    const img = el.querySelector('img, canvas');
    const tl = gsap.timeline({ scrollTrigger: disparador(el) });
    tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.inOut', clearProps: 'clipPath' });
    if (img) tl.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out', clearProps: 'transform' }, 0.1);
  });

  nuevos('[data-aparecer]').forEach((el) => {
    const blancos = el.dataset.aparecer === 'hijos' ? [...el.children] : [el];
    gsap.fromTo(blancos, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: Math.min(0.08, 0.8 / blancos.length), clearProps: 'transform,opacity,visibility', scrollTrigger: disparador(el) });
  });

  nuevos('[data-contador]').forEach((el) => {
    const fin = Number(el.dataset.contador) || 0;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: fin, duration: 1.8, ease: 'power3.out', scrollTrigger: disparador(el),
      onStart: () => el.setAttribute('aria-live', 'off'),
      onUpdate: () => { el.textContent = pesos(Math.round(obj.v / 100) * 100); },
      onComplete: () => { el.textContent = pesos(fin); },
    });
  });

  const titulares = nuevos('[data-titular]');
  if (titulares.length) {
    try { await document.fonts.ready; } catch { /* sin API de fuentes */ }
    titulares.forEach((el) => {
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'linea-texto', autoSplit: true, aria: 'auto',
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: 0.09,
          scrollTrigger: disparador(el),
        }),
      });
    });
  }
  ScrollTrigger.refresh();
}

/** Recalcula posiciones (después de pintar contenido asíncrono). */
export function refrescar() {
  if (!sinMovimiento()) ScrollTrigger.refresh();
}

export { gsap, ScrollTrigger };
