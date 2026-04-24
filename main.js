document.addEventListener('DOMContentLoaded', () => {

  // --- Scroll fade-in (IntersectionObserver) ---
  const fadeEls = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  fadeEls.forEach(el => observer.observe(el));

  // --- Checkbox toggle ---
  document.querySelectorAll('[data-checkbox]').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      cb.classList.toggle('checked');
    });
  });

  // --- 3D tilt on mockup (mouse follow) ---
  const wrap = document.getElementById('mockup-wrap');
  const mockup = document.getElementById('mockup');

  if (wrap && mockup) {
    let bounds;
    let raf = null;

    wrap.addEventListener('mouseenter', () => {
      bounds = wrap.getBoundingClientRect();
      mockup.style.animationPlayState = 'paused';
    });

    wrap.addEventListener('mousemove', (e) => {
      if (!bounds) return;
      if (raf) cancelAnimationFrame(raf);

      raf = requestAnimationFrame(() => {
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;
        const cx = bounds.width / 2;
        const cy = bounds.height / 2;

        const rotateY = ((x - cx) / cx) * 5;
        const rotateX = ((cy - y) / cy) * 5;

        mockup.style.transition = 'transform 0.12s ease-out';
        mockup.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        // Shift glow
        const glow = wrap.querySelector('.mockup-glow');
        if (glow) {
          const gx = 50 + ((x - cx) / cx) * 15;
          const gy = 50 + ((y - cy) / cy) * 15;
          glow.style.background = `radial-gradient(
            ellipse at ${gx}% ${gy}%,
            rgba(77, 142, 255, 0.12) 0%,
            rgba(77, 142, 255, 0.03) 40%,
            transparent 70%
          )`;
        }
      });
    });

    wrap.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);

      mockup.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      mockup.style.transform = 'translateY(0)';

      const glow = wrap.querySelector('.mockup-glow');
      if (glow) glow.style.background = '';

      setTimeout(() => {
        mockup.style.transition = '';
        mockup.style.animationPlayState = 'running';
      }, 500);
    });
  }

});
