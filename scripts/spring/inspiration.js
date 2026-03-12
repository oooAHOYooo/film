// Spring Inspiration Gallery JavaScript

(function () {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    async function init() {
        await loadAndRenderInspiration();
        setupSmoothScroll();
        setupNavHighlight();
    }

    async function loadAndRenderInspiration() {
        const data = await loadJson('/data/spring.json');
        if (!data || !data.inspiration) return;

        const inspiration = data.inspiration;
        const categories = {
            'Vibes': document.getElementById('vibes-grid')
        };

        // Clear grids
        Object.values(categories).forEach(grid => {
            if (grid) grid.innerHTML = '';
        });

        // Group items
        const grouped = {};
        inspiration.forEach(item => {
            const cat = item.category || 'Misc';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });

        // Render each category
        Object.entries(categories).forEach(([name, grid]) => {
            if (!grid) return;
            const items = grouped[name] || [];

            if (items.length === 0) {
                grid.innerHTML = '<div class="empty-inspo">No items in this section yet.</div>';
                return;
            }

            items.forEach((item, index) => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';

                const img = document.createElement('img');
                img.src = item.url;
                img.alt = item.title || 'Inspiration';
                img.loading = 'lazy';

                const info = document.createElement('div');
                info.className = 'gallery-item-info';

                const title = document.createElement('h4');
                title.textContent = item.title || 'Untitled';

                info.appendChild(title);
                galleryItem.appendChild(img);
                galleryItem.appendChild(info);

                grid.appendChild(galleryItem);
            });
        });
    }

    function setupSmoothScroll() {
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    function setupNavHighlight() {
        const sections = document.querySelectorAll('.inspo-section');
        const navItems = document.querySelectorAll('.nav-item');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.pageYOffset >= sectionTop - 150) {
                    current = section.getAttribute('id');
                }
            });

            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === '#' + current) {
                    item.classList.add('active');
                }
            });
        });
    }

    async function loadJson(path) {
        try {
            const res = await fetch(path + '?v=' + Date.now());
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return await res.json();
        } catch (e) {
            console.warn('loadJson failed', path, e);
            return null;
        }
    }

})();
