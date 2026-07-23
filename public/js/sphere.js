/* NASS ELECTRO+ — Globe pointillé 3D + texte en trajectoire ∞ */

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

  /* Lemniscate de Bernoulli (∞) autour du globe */
  function lemniscate(t, a) {
    const s = Math.sin(t);
    const c = Math.cos(t);
    const den = 1 + s * s;
    return {
      x: (a * c) / den,
      y: (a * s * c) / den,
      // légère profondeur pour passer devant / derrière le monde
      z: Math.sin(t * 2) * (a * 0.22),
    };
  }

  function buildInfinityOrbit(el, text, opts) {
    const options = Object.assign({
      radius: 210,
      speed: 0.55, // tours / seconde sur le chemin ∞
    }, opts || {});

    el.innerHTML = '';
    const chars = String(text).split('');
    const spans = chars.map((ch) => {
      const span = document.createElement('span');
      span.className = 'orbit-char';
      if (ch === '+') span.classList.add('plus');
      if (ch === ' ') {
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = ch;
      }
      el.appendChild(span);
      return span;
    });

    let raf = 0;
    let t0 = performance.now();

    function frame(now) {
      const elapsed = (now - t0) / 1000;
      const base = elapsed * options.speed * Math.PI * 2;
      const n = spans.length || 1;

      spans.forEach((span, i) => {
        // Décale chaque lettre le long du ∞
        const t = base + (i / n) * Math.PI * 2;
        const p = lemniscate(t, options.radius);
        const depth = (p.z + options.radius * 0.22) / (options.radius * 0.44); // 0..1
        const scale = 0.72 + 0.38 * depth;
        const opacity = 0.4 + 0.6 * depth;
        span.style.transform =
          'translate3d(' + p.x + 'px,' + p.y + 'px,' + p.z + 'px) scale(' + scale + ')';
        span.style.opacity = String(opacity);
        span.style.zIndex = String(Math.round(p.z + 200));
      });

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return function stop() {
      cancelAnimationFrame(raf);
    };
  }
  window.buildInfinityOrbit = buildInfinityOrbit;
  // Compat ancien nom
  window.buildOrbitText = function (el, text, opts) {
    return buildInfinityOrbit(el, text, opts);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('sphere');
    if (el) buildSphere(el);
    const orbit = document.getElementById('sphereOrbit');
    if (orbit) {
      buildInfinityOrbit(orbit, 'NASS ELECTRO+  •  NASS ELECTRO+  •  ', {
        radius: 205,
        speed: 0.42,
      });
    }
  });
})();
