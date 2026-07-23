/* NASS ELECTRO+ — Globe pointillé 3D
   Un seul texte voyage lentement en figures ∞ / 8
   en s'enroulant autour de la sphère (pas un cercle plat). */

(function () {
  function buildSphere(el, opts) {
    const options = Object.assign({
      radius: 140,
      rings: 14,
      dotsPerRing: 24,
      dotSize: 10,
    }, opts || {});

    const { radius, rings, dotsPerRing, dotSize } = options;
    el.innerHTML = '';
    const glow = document.createElement('div');
    glow.className = 'sphere-glow';
    el.appendChild(glow);

    for (let i = 0; i < rings; i++) {
      const lat = -80 + (160 * i) / (rings - 1);
      const latRad = (lat * Math.PI) / 180;
      const y = radius * Math.sin(latRad);
      const ringRadius = radius * Math.cos(latRad);
      const count = Math.max(6, Math.round((dotsPerRing * ringRadius) / radius));
      for (let j = 0; j < count; j++) {
        const angle = (j * 360) / count;
        const dot = document.createElement('span');
        dot.className = 'dot';
        const size = dotSize * (0.55 + 0.45 * Math.cos(latRad));
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        dot.style.marginTop = -size / 2 + 'px';
        dot.style.marginLeft = -size / 2 + 'px';
        dot.style.transform =
          'rotateY(' + angle + 'deg) translateZ(' + ringRadius + 'px) translateY(' + y + 'px)';
        el.appendChild(dot);
      }
    }
  }

  window.buildSphere = buildSphere;

  /* Rotation 3D d'un point (rx, ry, rz en radians) */
  function rotate3(p, rx, ry, rz) {
    let { x, y, z } = p;
    // X
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);
    y = y1; z = z1;
    // Y
    let x2 = x * Math.cos(ry) + z * Math.sin(ry);
    let z2 = -x * Math.sin(ry) + z * Math.cos(ry);
    x = x2; z = z2;
    // Z
    let x3 = x * Math.cos(rz) - y * Math.sin(rz);
    let y3 = x * Math.sin(rz) + y * Math.cos(rz);
    return { x: x3, y: y3, z: z };
  }

  /**
   * Figure ∞ / 8 enroulée SUR la sphère.
   * Longitude qui avance + latitude en double oscillation (sin 2t)
   * → croisement type ∞, passage devant / derrière le globe.
   */
  function infinityOnSphere(t, R, lobeAmp) {
    const lon = t;
    const lat = lobeAmp * Math.sin(2 * t); // 2 lobes → ∞
    const cl = Math.cos(lat);
    return {
      x: R * cl * Math.cos(lon),
      y: R * Math.sin(lat),
      z: R * cl * Math.sin(lon),
    };
  }

  function buildInfinityOrbit(el, text, opts) {
    const options = Object.assign({
      radius: 178,       // juste autour de la sphère (rayon ~140)
      speed: 0.035,      // très lent : ~1 boucle ∞ / ~28 s
      precess: 0.045,    // bascule lente de l'∞ pour varier les figures
      lobeAmp: 0.62,     // amplitude des lobes (radians)
      wordSpread: 0.42,  // écart angulaire du mot le long du chemin
    }, opts || {});

    el.innerHTML = '';
    const chars = String(text).split('');
    const spans = chars.map((ch) => {
      const span = document.createElement('span');
      span.className = 'orbit-char';
      if (ch === '+') span.classList.add('plus');
      span.innerHTML = ch === ' ' ? '&nbsp;' : ch;
      el.appendChild(span);
      return span;
    });

    const n = spans.length || 1;
    let raf = 0;
    const t0 = performance.now();

    function frame(now) {
      const elapsed = (now - t0) / 1000;
      // Position du centre du mot sur le chemin ∞
      const base = elapsed * options.speed * Math.PI * 2;

      // Précession douce : l'∞ bascule autour du globe
      // → figures 8 / ∞ sous des angles variables, jamais figé
      const rx = Math.sin(elapsed * options.precess * 0.7) * 0.55;
      const ry = elapsed * options.precess * 0.55;
      const rz = Math.sin(elapsed * options.precess * 0.35) * 0.35;

      spans.forEach((span, i) => {
        // Lettres regroupées : un seul mot qui glisse sur le chemin
        const offset =
          n === 1 ? 0 : ((i / (n - 1)) - 0.5) * options.wordSpread;
        const t = base + offset;
        const raw = infinityOnSphere(t, options.radius, options.lobeAmp);
        const p = rotate3(raw, rx, ry, rz);

        // Profondeur : devant (z+) plus grand / opaque, derrière plus discret
        const depth = (p.z / options.radius + 1) / 2; // 0..1
        const scale = 0.62 + 0.55 * depth;
        const opacity = 0.28 + 0.72 * depth;

        span.style.transform =
          'translate3d(' +
          p.x.toFixed(2) + 'px,' +
          p.y.toFixed(2) + 'px,' +
          p.z.toFixed(2) + 'px) scale(' +
          scale.toFixed(3) + ')';
        span.style.opacity = opacity.toFixed(3);
        span.style.zIndex = String(Math.round(p.z + 400));
      });

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return function stop() {
      cancelAnimationFrame(raf);
    };
  }

  window.buildInfinityOrbit = buildInfinityOrbit;
  window.buildOrbitText = function (el, text, opts) {
    return buildInfinityOrbit(el, text, opts);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('sphere');
    if (el) buildSphere(el);
    const orbit = document.getElementById('sphereOrbit');
    if (orbit) {
      // Un seul NASS ELECTRO+ — lent — ∞ autour de la sphère
      buildInfinityOrbit(orbit, 'NASS ELECTRO+', {
        radius: 178,
        speed: 0.032,
        precess: 0.04,
        lobeAmp: 0.65,
        wordSpread: 0.4,
      });
    }
  });
})();
