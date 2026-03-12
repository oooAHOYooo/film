// Autumn Film Page JavaScript

(function () {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        setupNavigation();
        setupFileRendering();
        setupBookmarkRendering();
        setupAccordions();

        if (typeof hydrateSection === 'function') {
            hydrateSection('autumn');
        } else {
            const checkHydrate = setInterval(() => {
                if (typeof hydrateSection === 'function') {
                    clearInterval(checkHydrate);
                    hydrateSection('autumn');
                }
            }, 100);
        }
    }

    function setupNavigation() {
        const nav = document.getElementById('autumnNav');
        const mobileToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        const navLinkItems = document.querySelectorAll('.nav-link-item');

        if (!nav) return;

        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('open');
            });
        }

        navLinkItems.forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });

        navLinkItems.forEach(link => {
            link.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        const sections = document.querySelectorAll('.section-anchor');

        function updateActiveNav() {
            let current = '';
            sections.forEach(section => {
                if (window.pageYOffset >= section.offsetTop - 120) {
                    current = section.getAttribute('id');
                }
            });
            navLinkItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) link.classList.add('active');
            });
        }

        const scrollProgress = document.getElementById('scrollProgress');
        const updateScrollProgress = () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.pageYOffset / windowHeight) * 100;
            if (scrollProgress) scrollProgress.style.width = scrolled + '%';
        };

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
            updateActiveNav();
            updateScrollProgress();
        });

        updateScrollProgress();
        updateActiveNav();
    }

    function setupFileRendering() {
        if (window.renderFiles) {
            overrideRenderFiles();
        } else {
            const check = setInterval(() => {
                if (window.renderFiles) { clearInterval(check); overrideRenderFiles(); }
            }, 100);
        }
    }

    function overrideRenderFiles() {
        window.renderFiles = function (el, files) {
            if (!el) return;
            el.innerHTML = '';
            if (!files || !files.length) {
                el.innerHTML = '<div class="empty-state"><p>No files yet.</p></div>';
                return;
            }
            const categories = {};
            files.forEach(f => {
                const cat = f.category || 'Other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(f);
            });
            Object.keys(categories).sort().forEach(category => {
                const wrap = document.createElement('div');
                wrap.style.marginBottom = '40px';
                const h3 = document.createElement('h3');
                h3.textContent = category;
                h3.style.cssText = 'font-size:1.25rem;font-weight:600;margin-bottom:16px;color:var(--text-primary)';
                wrap.appendChild(h3);
                const table = document.createElement('table');
                table.className = 'vault-table';
                const thead = document.createElement('thead');
                thead.style.backgroundColor = 'rgba(224,122,48,0.1)';
                const headerRow = document.createElement('tr');
                ['Name', 'Last Updated', 'Action'].forEach(text => {
                    const th = document.createElement('th');
                    th.textContent = text;
                    th.style.cssText = 'padding:12px 16px;text-align:left;border-bottom:1px solid var(--glass-border);font-weight:600;color:var(--text-primary)';
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);
                const tbody = document.createElement('tbody');
                categories[category].forEach((f, i) => {
                    const row = document.createElement('tr');
                    const bg0 = 'var(--glass-bg)', bg1 = 'rgba(28,18,9,0.5)', bgHover = 'rgba(224,122,48,0.1)';
                    row.style.borderBottom = i < categories[category].length - 1 ? '1px solid var(--glass-border)' : 'none';
                    row.style.backgroundColor = i % 2 === 0 ? bg0 : bg1;
                    row.addEventListener('mouseenter', () => row.style.backgroundColor = bgHover);
                    row.addEventListener('mouseleave', () => row.style.backgroundColor = i % 2 === 0 ? bg0 : bg1);
                    const nameCell = document.createElement('td');
                    nameCell.textContent = f.label || f.path;
                    nameCell.style.cssText = 'padding:12px 16px;font-weight:500;color:var(--text-primary)';
                    const updatedCell = document.createElement('td');
                    updatedCell.textContent = f.lastUpdated || '—';
                    updatedCell.style.cssText = 'padding:12px 16px;color:var(--text-muted);font-size:0.9rem';
                    const actionCell = document.createElement('td');
                    actionCell.style.padding = '12px 16px';
                    const isVideo = f.path && (f.path.includes('.mov') || f.path.includes('.mp4') || f.path.includes('.webm'));
                    if (isVideo) {
                        const btn = document.createElement('button');
                        btn.className = 'btn';
                        btn.textContent = 'Play';
                        btn.style.cssText = 'padding:6px 12px;font-size:0.875rem';
                        btn.addEventListener('click', () => window.openVideoModal && window.openVideoModal(f.path, f.label));
                        actionCell.appendChild(btn);
                    } else {
                        const a = document.createElement('a');
                        a.href = f.path;
                        a.className = 'btn';
                        a.textContent = /draft/i.test(category) ? 'Download' : 'Open';
                        a.target = '_blank';
                        a.style.cssText = 'padding:6px 12px;font-size:0.875rem;text-decoration:none';
                        actionCell.appendChild(a);
                    }
                    row.appendChild(nameCell);
                    row.appendChild(updatedCell);
                    row.appendChild(actionCell);
                    tbody.appendChild(row);
                });
                table.appendChild(tbody);
                wrap.appendChild(table);
                el.appendChild(wrap);
            });
        };
    }

    function setupBookmarkRendering() {
        if (window.renderBookmarks) {
            overrideRenderBookmarks();
        } else {
            const check = setInterval(() => {
                if (window.renderBookmarks) { clearInterval(check); overrideRenderBookmarks(); }
            }, 100);
        }
    }

    function overrideRenderBookmarks() {
        window.renderBookmarks = function (el, bookmarks) {
            if (!el) return;
            el.innerHTML = '';
            if (!bookmarks || !bookmarks.length) {
                el.innerHTML = '<div class="bookmarks-empty"><p>No bookmarks yet.</p></div>';
                return;
            }
            const ul = document.createElement('ul');
            ul.className = 'list';
            bookmarks.forEach(b => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = b.url;
                a.textContent = b.title;
                a.target = '_blank';
                if (b.description) {
                    const desc = document.createElement('small');
                    desc.textContent = ` - ${b.description}`;
                    desc.style.color = 'var(--text-muted)';
                    a.appendChild(desc);
                }
                li.appendChild(a);
                ul.appendChild(li);
            });
            el.appendChild(ul);
        };
    }

    function setupAccordions() {
        document.querySelectorAll('details').forEach(d => {
            d.addEventListener('toggle', () => { /* reserved */ });
        });
    }

})();
