/* NASS ELECTRO+ — Halftone 3D sphere generator
   Génère une sphère 3D constituée de points bleus, comme sur le logo,
   qui tourne en continu à 360° sur l'axe Y. */

(function () {
  function buildSphere(el, opts) {
    const options = Object.assign({
      radius: 140,
      rings: 14,       // nombre d'anneaux de latitude
      dotsPerRing: 24, // points par anneau
      dotSize: 10,     // taille de base des points (px)
    }, opts || {});

    const { radius, rings, dotsPerRing, dotSize } = options;
    el.innerHTML = '';
    // Ajouter un halo lumineux derrière
    const glow = document.createElement('div');
    glow.className = 'sphere-glow';
    el.appendChild(glow);

    for (let i = 0; i < rings; i++) {
      // Latitude de -80° à +80° (évite les pôles trop serrés)
      const lat = -80 + (160 * i) / (rings - 1);
      const latRad = (lat * Math.PI) / 180;
      const y = radius * Math.sin(latRad);
      const ringRadius = radius * Math.cos(latRad);
      // Densité de points proportionnelle au rayon de l'anneau
      const count = Math.max(6, Math.round((dotsPerRing * ringRadius) / radius));
      for (let j = 0; j < count; j++) {
        const angle = (j * 360) / count;
        const dot = document.createElement('span');
        dot.className = 'dot';
        // Taille dégressive vers les pôles pour donner du volume
        const size = dotSize * (0.55 + 0.45 * Math.cos(latRad));
        dot.style.width = size + 'px';
        dot.style.height = size + 'px';
        dot.style.marginTop = -size / 2 + 'px';
        dot.style.marginLeft = -size / 2 + 'px';
        // Placement 3D : on tourne autour de Y puis on translate vers l'anneau
        dot.style.transform =
          'rotateY(' + angle + 'deg) translateZ(' + ringRadius + 'px) translateY(' + y + 'px)';
        el.appendChild(dot);
      }
    }
  }

  window.buildSphere = buildSphere;

  function buildOrbitText(el, text, opts) {
    const options = Object.assign({ radius: 195, fontSize: 22 }, opts || {});
    el.innerHTML = '';
    const chars = text.split('');
    const step = 360 / chars.length;
    chars.forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'orbit-char';
      if (ch === '+') span.classList.add('plus');
      if (ch === ' ') {
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = ch;
      }
      span.style.transform =
        'rotateY(' + (i * step) + 'deg) translateZ(' + options.radius + 'px)';
      el.appendChild(span);
    });
  }
  window.buildOrbitText = buildOrbitText;

  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('sphere');
    if (el) buildSphere(el);
    const orbit = document.getElementById('sphereOrbit');
    if (orbit) buildOrbitText(orbit, ' NASS ELECTRO+  •  NASS ELECTRO+  •  ');
  });
})();
