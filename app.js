(function () {
  'use strict';

  // DOM build

  const stage = document.getElementById('stage');

  LEVELS.forEach(level => {
    const col = document.createElement('div');
    col.className = 'column';
    col.dataset.level = level.id;

    const articlesHTML = level.articles.map((article, i) => {
      const paragraphs = article.text
        .split('\n\n')
        .map(p => `<p>${p}</p>`)
        .join('');

      return `
        <div class="article" data-idx="${i}">
          <div class="article-trigger">
            <span class="article-num">${String(i + 1).padStart(2, '0')}</span>
            <span class="article-title-text">${article.title}</span>
            <span class="article-icon" aria-hidden="true"></span>
          </div>
          <div class="article-body" role="region" aria-label="${article.title}">
            <div class="article-body-inner">
              <div class="article-text">${paragraphs}</div>
            </div>
          </div>
        </div>`;
    }).join('');

    col.innerHTML = `
      <!-- ── Default face (visible in resting state) ── -->
      <div class="col-face" aria-hidden="true">
        <div class="face-badge">${level.id}</div>
        <div class="face-rule"></div>
        <div class="face-info">
          <div class="face-name">${level.name}</div>
          <div class="face-desc">${level.desc}</div>
          <div class="face-hint">Explore →</div>
        </div>
      </div>

      <!-- ── Narrow vertical label (desktop inactive state) ── -->
      <div class="col-side-label" aria-hidden="true">${level.id}</div>

      <!-- ── Content panel (visible when column is active) ── -->
      <div class="col-content" role="region" aria-label="${level.name} texts">
        <div class="content-header">
          <button class="back-btn" aria-label="Return to level selection">
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path d="M5 1L1 5L5 9M1 5H13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            All Levels
          </button>
          <div class="content-heading">${level.name}</div>
          <div class="content-sub">${level.articles.length} texts · tap a title to read</div>
        </div>
        <div class="articles">${articlesHTML}</div>
      </div>

      <!-- ── Overlay darkens column when inactive ── -->
      <div class="col-overlay" aria-hidden="true"></div>

      <!-- ── Decorative dots (resting state only) ── -->
      <div class="col-deco" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    `;

    stage.appendChild(col);
  });

  /**
   * Expand the given column; push all others to the background.
   * @param {HTMLElement} col
   */
  function expandColumn(col) {
    stage.classList.add('has-active');
    document.querySelectorAll('.column').forEach(c => {
      c.classList.toggle('active',   c === col);
      c.classList.toggle('inactive', c !== col);
    });
    // Scroll content to top whenever a column is opened
    const content = col.querySelector('.col-content');
    if (content) content.scrollTop = 0;
  }

  /**
   * Return to the default equal-column/row state.
   */
  function collapseAll() {
    // Tag the active column so closing-specific CSS transitions apply
    const wasActive = stage.querySelector('.column.active');
    if (wasActive) {
	    wasActive.classList.add('collapsing');
	    // Remove after: dur-fade delay (0.3s) + dur-fade duration (0.3s) + small buffer
	    setTimeout(() => wasActive.classList.remove('collapsing'), 700);
    }

    stage.classList.remove('has-active');
    document.querySelectorAll('.column').forEach(c => {
      c.classList.remove('active', 'inactive');
    });
    // Close all open articles
    document.querySelectorAll('.article.open').forEach(a => {
      a.classList.remove('open');
    });
  }

  /**
   * Toggle an article open/closed. Collapses any other open article
   * within the same column first.
   * @param {HTMLElement} article
   * @param {HTMLElement} col
   */
  function toggleArticle(article, col) {
    col.querySelectorAll('.article.open').forEach(a => {
      if (a !== article) a.classList.remove('open');
    });
    article.classList.toggle('open');
  }

  //Event handling
  stage.addEventListener('click', e => {
    // Back button (mobile) — must be checked before anything else
    if (e.target.closest('.back-btn')) {
      collapseAll();
      return;
    }

    const col = e.target.closest('.column');
    if (!col) return;

    const isActive   = col.classList.contains('active');
    const isInactive = col.classList.contains('inactive');

    // Inactive background column > return to default
    if (isInactive) {
      collapseAll();
      return;
    }

    // Click inside already-active column > handle article accordion
    if (isActive) {
      const trigger = e.target.closest('.article-trigger');
      if (!trigger) return;
      const article = trigger.closest('.article');
      if (article) toggleArticle(article, col);
      return;
    }

    // Default column > expand it
    expandColumn(col);
  });

  // Keyboard support: Enter/Space on a column face activates it
  stage.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const col = e.target.closest('.column');
    if (!col || col.classList.contains('active')) return;
    e.preventDefault();
    if (col.classList.contains('inactive')) {
      collapseAll();
    } else {
      expandColumn(col);
    }
  });

})();

/* Theme management */
(function () {
  'use strict';

  const STORAGE_KEY = 'linguaLevels_theme';
  const html        = document.documentElement;
  const btn         = document.getElementById('themeToggle');

  /**
   * Resolve what the OS currently prefers.
   * @returns {'dark'|'light'}
   */
  function osPrefers() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  /**
   * Apply a theme. Pass null to revert to OS default.
   * @param {'light'|'dark'|null} theme
   */
  function applyTheme(theme) {
    if (theme) {
      html.setAttribute('data-theme', theme);
    } else {
      html.removeAttribute('data-theme');
    }
  }

  /**
   * Determine the currently active theme (respecting OS default when no
   * explicit override is stored).
   * @returns {'light'|'dark'}
   */
  function activeTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || osPrefers();
  }

  // Restore saved preference
  const saved = localStorage.getItem(STORAGE_KEY);
  applyTheme(saved);

  // Toggle
  if (btn) {
    btn.addEventListener('click', () => {
      const current = activeTheme();
      const next    = current === 'dark' ? 'light' : 'dark';

      // If next matches what the OS would give us anyway, clear the override
      // so the site tracks OS changes automatically in the future.
      if (next === osPrefers()) {
        localStorage.removeItem(STORAGE_KEY);
        applyTheme(null);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
      }
    });
  }

  // Live OS preference changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(null);
    }
  });

})();
