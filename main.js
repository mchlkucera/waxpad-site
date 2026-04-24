document.addEventListener('DOMContentLoaded', () => {

  // --- Scroll fade-in ---
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  fadeEls.forEach(el => fadeObserver.observe(el));

  // --- Tab switching (shared logic) ---
  const tabs = document.querySelectorAll('.mockup-tabs .tab[data-tab]');
  const contents = document.querySelectorAll('.tab-content[data-tab-content]');
  const useCases = document.querySelectorAll('.use-case[data-mockup-tab]');

  let currentTab = '0';

  function switchToTab(idx, animate) {
    const idxStr = String(idx);
    if (idxStr === currentTab) return;
    currentTab = idxStr;

    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    tabs.forEach(t => {
      if (t.getAttribute('data-tab') === idxStr) t.classList.add('active');
    });
    contents.forEach(c => {
      if (c.getAttribute('data-tab-content') === idxStr) c.classList.add('active');
    });

    // Update active use-case highlight
    useCases.forEach(uc => {
      if (uc.getAttribute('data-mockup-tab') === idxStr) {
        uc.classList.add('is-active');
      } else {
        uc.classList.remove('is-active');
      }
    });

    // Stream-in animation on the new tab content
    if (animate !== false) {
      const activeContent = document.querySelector(`.tab-content[data-tab-content="${idxStr}"]`);
      if (activeContent) streamIn(activeContent);
    }
  }

  // --- Blue glow flash on animation end ---
  function flashMockup(container) {
    const mockupEl = container.closest('.mockup');
    if (!mockupEl) return;
    mockupEl.classList.remove('cleanup-flash');
    // Force reflow to restart animation
    void mockupEl.offsetWidth;
    mockupEl.classList.add('cleanup-flash');
    mockupEl.addEventListener('animationend', () => {
      mockupEl.classList.remove('cleanup-flash');
    }, { once: true });
  }

  // --- LLM streaming animation ---
  function streamIn(container) {
    const tabIdx = container.getAttribute('data-tab-content');

    // Cleanup tab (3): reverse animation — notes are already there, get checked off
    if (tabIdx === '3') {
      streamCleanup(container);
      return;
    }

    // Collect only real content children (skip old cursors)
    const allChildren = Array.from(container.children);
    const lines = allChildren.filter(el => !el.classList.contains('stream-cursor'));

    // Hide all lines
    lines.forEach(el => {
      el.classList.remove('stream-visible');
      el.classList.add('stream-line');
    });

    // Remove any existing cursor
    container.querySelectorAll('.stream-cursor').forEach(c => c.remove());

    // Add cursor — absolutely positioned, doesn't affect layout
    const cursor = document.createElement('span');
    cursor.className = 'stream-cursor';
    cursor.textContent = '\u258C';
    container.appendChild(cursor);

    let lineIndex = 0;
    const totalLines = lines.length;
    const perLine = Math.max(20, Math.min(40, 500 / Math.max(totalLines, 1)));

    function revealNext() {
      if (lineIndex >= totalLines) {
        // Animation done — flash + clean up classes so contenteditable works
        lines.forEach(el => el.classList.remove('stream-line', 'stream-visible'));
        flashMockup(container);
        setTimeout(() => {
          cursor.classList.add('stream-cursor-fade');
          setTimeout(() => cursor.remove(), 400);
        }, 150);
        return;
      }

      const line = lines[lineIndex];
      line.classList.add('stream-visible');

      // Position cursor just below the revealed line
      const lineRect = line.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      cursor.style.top = (lineRect.bottom - containerRect.top) + 'px';

      lineIndex++;

      const tag = line.tagName?.toLowerCase();
      let delay = perLine;
      if (tag === 'h2' || tag === 'hr') delay = 10;
      else if (tag === 'h3') delay = 15;
      else delay = perLine + Math.random() * 10;

      setTimeout(revealNext, delay);
    }

    setTimeout(revealNext, 40);
  }

  // --- Cleanup tab: notes visible → cross out → collapse → counter increments ---
  function streamCleanup(container) {
    const allChildren = Array.from(container.children);
    const lines = allChildren.filter(el => !el.classList.contains('stream-cursor'));

    const notes = lines.filter(el => el.classList.contains('cleanup-note'));
    const divider = container.querySelector('.cleanup-divider');
    const counterEl = container.querySelector('.cleanup-counter');
    const countSpan = container.querySelector('.cleanup-count');
    const stats = Array.from(container.querySelectorAll('.cleanup-stat'));

    // Reset all state
    lines.forEach(el => {
      el.classList.remove('stream-line', 'stream-visible', 'cleanup-crossed', 'cleanup-gone', 'cleanup-show');
    });
    if (countSpan) countSpan.textContent = '0';

    // Show counter line immediately (with count at 0)
    if (divider) divider.classList.add('cleanup-show');
    if (counterEl) counterEl.classList.add('cleanup-show');

    // Hide stats
    stats.forEach(el => el.classList.remove('cleanup-show'));

    let moved = 0;

    // Animate: cross out each note, then collapse it, increment counter
    let i = 0;
    function processNext() {
      if (i >= notes.length) {
        // All notes processed — flash then show stats
        flashMockup(container);

        let j = 0;
        function showStat() {
          if (j >= stats.length) return;
          stats[j].classList.add('cleanup-show');
          j++;
          setTimeout(showStat, 100);
        }
        setTimeout(showStat, 300);
        return;
      }

      const note = notes[i];

      // Step 1: cross out
      note.classList.add('cleanup-crossed');

      // Step 2: after brief pause, collapse and increment counter
      setTimeout(() => {
        note.classList.add('cleanup-gone');
        moved++;
        if (countSpan) countSpan.textContent = String(moved);
      }, 120);

      i++;
      setTimeout(processNext, 80 + Math.random() * 30);
    }

    // Start after showing the messy notes for a beat
    setTimeout(processNext, 400);
  }

  // Click on use-case sections to switch tabs and scroll into center
  useCases.forEach(uc => {
    uc.addEventListener('click', () => {
      const idx = uc.getAttribute('data-mockup-tab');
      switchToTab(idx, true);
      scrollLocked = true;
      clearTimeout(scrollLockTimer);
      // Smooth scroll the clicked use-case to center of viewport
      uc.scrollIntoView({ behavior: 'smooth', block: 'center' });
      scrollLockTimer = setTimeout(() => { scrollLocked = false; }, 2000);
    });
  });

  // Manual tab clicks
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = tab.getAttribute('data-tab');
      switchToTab(idx, true);
      scrollLocked = true;
      clearTimeout(scrollLockTimer);
      scrollLockTimer = setTimeout(() => { scrollLocked = false; }, 2000);
    });
  });

  let scrollLocked = false;
  let scrollLockTimer = null;

  // --- Scroll-driven tab switching: pick the most-centered use-case ---
  // Instead of firing on every intersection, we track visibility ratios
  // and pick the winner on each scroll frame.
  const visibilityMap = new Map();

  const useCaseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      visibilityMap.set(entry.target, entry.intersectionRatio);
    });

    if (scrollLocked) return;

    // Find the use-case with the highest visibility ratio
    let bestTarget = null;
    let bestRatio = 0;

    visibilityMap.forEach((ratio, target) => {
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestTarget = target;
      }
    });

    if (bestTarget && bestRatio > 0.15) {
      const tabIdx = bestTarget.getAttribute('data-mockup-tab');
      switchToTab(tabIdx, true);
    }
  }, {
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
    rootMargin: '-15% 0px -15% 0px'
  });

  useCases.forEach(uc => useCaseObserver.observe(uc));

  // Initialize first use-case as active (no animation on load)
  if (useCases.length > 0) {
    useCases[0].classList.add('is-active');
  }

  // --- Clickable checkboxes ---
  const uncheckedSvg = '<svg width="14" height="14" viewBox="0 0 14 14"><rect x="0.5" y="0.5" width="13" height="13" rx="2.5" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/></svg>';
  const checkedSvg = '<svg width="14" height="14" viewBox="0 0 14 14"><rect width="14" height="14" rx="3" fill="#4D8EFF"/><path d="M4 7.5L6 9.5L10 4.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

  document.addEventListener('click', (e) => {
    const box = e.target.closest('.check-box');
    if (!box) return;
    e.preventDefault();
    e.stopPropagation();

    const line = box.closest('.mockup-check');
    const isChecked = box.classList.contains('checked');

    if (isChecked) {
      box.classList.remove('checked');
      box.innerHTML = uncheckedSvg;
      if (line) {
        line.classList.remove('checked');
        const s = line.querySelector('s');
        if (s) s.replaceWith(...s.childNodes);
      }
    } else {
      box.classList.add('checked');
      box.innerHTML = checkedSvg;
      if (line) {
        line.classList.add('checked');
        // Wrap remaining text nodes and inline elements in <s>
        const nodes = Array.from(line.childNodes).filter(n =>
          n !== box && !n.classList?.contains('check-dash') && !n.classList?.contains('check-box')
        );
        if (nodes.length && !line.querySelector('s')) {
          const s = document.createElement('s');
          nodes.forEach(n => s.appendChild(n));
          line.appendChild(s);
        }
      }
    }
  });

});
