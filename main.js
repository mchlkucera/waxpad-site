document.addEventListener('DOMContentLoaded', () => {

  // --- Fade-in on scroll ---
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    fadeEls.forEach(el => observer.observe(el));
  }

  // --- Checkbox toggle ---
  document.querySelectorAll('.checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isChecked = cb.classList.toggle('checked');
      cb.setAttribute('aria-checked', isChecked ? 'true' : 'false');

      // Toggle strikethrough on sibling text
      const textEl = cb.nextElementSibling;
      if (textEl && textEl.classList.contains('mockup-text')) {
        // The CSS handles strikethrough via .checkbox.checked + .mockup-text
        // but we add a small animation
        textEl.style.transition = 'color 0.2s ease, text-decoration 0.2s ease';
      }
    });

    // Keyboard support
    cb.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        cb.click();
      }
    });
  });

  // --- Hide hint on content focus ---
  document.querySelectorAll('.mockup-content').forEach(content => {
    const mockup = content.closest('.mockup');
    const hint = mockup ? mockup.querySelector('.mockup-hint') : null;

    if (hint) {
      content.addEventListener('focus', () => {
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.3s ease';
      });

      content.addEventListener('blur', () => {
        hint.style.opacity = '';
      });
    }
  });

  // --- 3D tilt effect on all mockups ---
  document.querySelectorAll('.mockup-wrapper').forEach(wrapper => {
    const mockup = wrapper.querySelector('.mockup');
    if (!mockup) return;

    let bounds;
    let rafId = null;

    function updateBounds() {
      bounds = wrapper.getBoundingClientRect();
    }

    wrapper.addEventListener('mouseenter', () => {
      updateBounds();
      // Pause the floating animation while tilting
      mockup.style.animation = 'none';
    });

    wrapper.addEventListener('mousemove', (e) => {
      if (!bounds) return;
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const x = e.clientX - bounds.left;
        const y = e.clientY - bounds.top;
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;

        // Rotation: max 8 degrees
        const rotateY = ((x - centerX) / centerX) * 8;
        const rotateX = ((centerY - y) / centerY) * 6;

        // Subtle glow shift
        const glowX = 50 + ((x - centerX) / centerX) * 10;
        const glowY = 50 + ((y - centerY) / centerY) * 10;

        mockup.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

        const glow = wrapper.querySelector('.mockup-glow');
        if (glow) {
          glow.style.background = `radial-gradient(
            ellipse at ${glowX}% ${glowY}%,
            rgba(77, 142, 255, 0.14) 0%,
            rgba(77, 142, 255, 0.04) 40%,
            transparent 70%
          )`;
        }
      });
    });

    wrapper.addEventListener('mouseleave', () => {
      if (rafId) cancelAnimationFrame(rafId);

      mockup.style.transform = 'rotateX(0) rotateY(0) scale(1)';
      mockup.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

      const glow = wrapper.querySelector('.mockup-glow');
      if (glow) {
        glow.style.background = '';
      }

      // Re-enable floating animation after transition
      setTimeout(() => {
        mockup.style.transition = '';
        mockup.style.animation = '';
      }, 500);
    });

    // Reset transition on move start
    wrapper.addEventListener('mousemove', () => {
      mockup.style.transition = 'transform 0.1s ease-out';
    }, { once: false });
  });

});
