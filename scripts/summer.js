// Summer Film Page JavaScript - Executive Production Hub

(function() {
    'use strict';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        setupNavigation();
        setupFileRendering();
        setupStillsRendering();
        setupBookmarkRendering();
        setupStillsExpand();
        setupInspirationFilters();
        setupBookmarkModal();
        setupAccordions();
        
        // Hydrate after all overrides are set up
        if (typeof hydrateSection === 'function') {
            hydrateSection('summer');
        } else {
            // Wait for vault.js to load
            const checkHydrate = setInterval(() => {
                if (typeof hydrateSection === 'function') {
                    clearInterval(checkHydrate);
                    hydrateSection('summer');
                }
            }, 100);
        }
    }

    // Navigation functionality
    function setupNavigation() {
        const nav = document.getElementById('summerNav');
        const mobileToggle = document.getElementById('mobileNavToggle');
        const navLinks = document.getElementById('navLinks');
        const navLinkItems = document.querySelectorAll('.nav-link-item');

        if (!nav) return;

        // Mobile menu toggle
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('open');
            });
        }

        // Close mobile menu when clicking a link
        navLinkItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
            });
        });

        // Smooth scroll for anchor links
        navLinkItems.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });

        // Active link highlighting based on scroll position
        const sections = document.querySelectorAll('.section-anchor');
        
        function updateActiveNav() {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.pageYOffset >= sectionTop - 120) {
                    current = section.getAttribute('id');
                }
            });

            navLinkItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        }

        // Scroll progress indicator
        const scrollProgress = document.getElementById('scrollProgress');
        const updateScrollProgress = () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.pageYOffset / windowHeight) * 100;
            if (scrollProgress) {
                scrollProgress.style.width = scrolled + '%';
            }
        };

        // Scroll effect on nav
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            updateActiveNav();
            updateScrollProgress();
        });

        // Initial scroll progress
        updateScrollProgress();
        updateActiveNav();
    }

    // Override renderFiles to support new vault card layout
    function setupFileRendering() {
        if (window.renderFiles) {
            overrideRenderFiles();
        } else {
            const checkRenderFiles = setInterval(() => {
                if (window.renderFiles) {
                    clearInterval(checkRenderFiles);
                    overrideRenderFiles();
                }
            }, 100);
        }
    }

    function overrideRenderFiles() {
        const originalRenderFiles = window.renderFiles;
        window.renderFiles = function(el, files) {
            if (!el) return;
            el.innerHTML = '';
            if (!files || !files.length) {
                el.innerHTML = '<div class="empty-state"><p>No files yet.</p></div>';
                return;
            }
            
            // Group files by category
            const categories = {};
            files.forEach(f => {
                const category = f.category || 'Other';
                if (!categories[category]) categories[category] = [];
                categories[category].push(f);
            });
            
            // Render each category as a table
            Object.keys(categories).sort().forEach(category => {
                const categoryFiles = categories[category];
                
                // Create category section
                const categoryDiv = document.createElement('div');
                categoryDiv.style.marginBottom = '40px';
                
                const categoryHeader = document.createElement('h3');
                categoryHeader.textContent = category;
                categoryHeader.style.fontSize = '1.25rem';
                categoryHeader.style.fontWeight = '600';
                categoryHeader.style.marginBottom = '16px';
                categoryHeader.style.color = 'var(--text-primary)';
                categoryDiv.appendChild(categoryHeader);
                
                // Create table
                const table = document.createElement('table');
                table.className = 'vault-table';
                table.style.width = '100%';
                table.style.borderCollapse = 'collapse';
                table.style.border = '1px solid var(--glass-border)';
                table.style.borderRadius = 'var(--soft)';
                table.style.overflow = 'hidden';
                table.style.background = 'var(--glass-bg)';
                
                // Create table header
                const thead = document.createElement('thead');
                thead.style.backgroundColor = 'rgba(88, 166, 255, 0.1)';
                const headerRow = document.createElement('tr');
                
                const nameHeader = document.createElement('th');
                nameHeader.textContent = 'Name';
                nameHeader.style.padding = '12px 16px';
                nameHeader.style.textAlign = 'left';
                nameHeader.style.borderBottom = '1px solid var(--glass-border)';
                nameHeader.style.fontWeight = '600';
                nameHeader.style.color = 'var(--text-primary)';
                
                const updatedHeader = document.createElement('th');
                updatedHeader.textContent = 'Last Updated';
                updatedHeader.style.padding = '12px 16px';
                updatedHeader.style.textAlign = 'left';
                updatedHeader.style.borderBottom = '1px solid var(--glass-border)';
                updatedHeader.style.fontWeight = '600';
                updatedHeader.style.color = 'var(--text-primary)';
                
                const actionHeader = document.createElement('th');
                actionHeader.textContent = 'Action';
                actionHeader.style.padding = '12px 16px';
                actionHeader.style.textAlign = 'left';
                actionHeader.style.borderBottom = '1px solid var(--glass-border)';
                actionHeader.style.fontWeight = '600';
                actionHeader.style.color = 'var(--text-primary)';
                
                headerRow.appendChild(nameHeader);
                headerRow.appendChild(updatedHeader);
                headerRow.appendChild(actionHeader);
                thead.appendChild(headerRow);
                table.appendChild(thead);
                
                // Create table body
                const tbody = document.createElement('tbody');
                categoryFiles.forEach((f, index) => {
                    const row = document.createElement('tr');
                    row.style.borderBottom = index < categoryFiles.length - 1 ? '1px solid var(--glass-border)' : 'none';
                    row.style.backgroundColor = index % 2 === 0 ? 'var(--glass-bg)' : 'rgba(22, 27, 34, 0.5)';
                    row.style.transition = 'background-color 0.2s ease';
                    
                    row.addEventListener('mouseenter', () => {
                        row.style.backgroundColor = 'rgba(88, 166, 255, 0.1)';
                    });
                    row.addEventListener('mouseleave', () => {
                        row.style.backgroundColor = index % 2 === 0 ? 'var(--glass-bg)' : 'rgba(22, 27, 34, 0.5)';
                    });
                    
                    // Name cell
                    const nameCell = document.createElement('td');
                    nameCell.textContent = f.label || f.path;
                    nameCell.style.padding = '12px 16px';
                    nameCell.style.fontWeight = '500';
                    nameCell.style.color = 'var(--text-primary)';
                    
                    // Last updated cell
                    const updatedCell = document.createElement('td');
                    updatedCell.textContent = f.lastUpdated || '—';
                    updatedCell.style.padding = '12px 16px';
                    updatedCell.style.color = 'var(--text-muted)';
                    updatedCell.style.fontSize = '0.9rem';
                    
                    // Action cell
                    const actionCell = document.createElement('td');
                    actionCell.style.padding = '12px 16px';
                    
                    // Check if it's a video file
                    const isVideo = f.path && (f.path.includes('.mov') || f.path.includes('.mp4') || f.path.includes('.webm'));
                    
                    if (isVideo) {
                        const playBtn = document.createElement('button');
                        playBtn.className = 'btn';
                        playBtn.textContent = 'Play';
                        playBtn.style.padding = '6px 12px';
                        playBtn.style.fontSize = '0.875rem';
                        playBtn.addEventListener('click', () => {
                            if (window.openVideoModal) {
                                window.openVideoModal(f.path, f.label);
                            }
                        });
                        actionCell.appendChild(playBtn);
                    } else {
                        const link = document.createElement('a');
                        link.href = f.path;
                        link.className = 'btn';
                        link.textContent = /draft/i.test(category) ? 'Download' : 'Open';
                        link.target = '_blank';
                        link.style.padding = '6px 12px';
                        link.style.fontSize = '0.875rem';
                        link.style.textDecoration = 'none';
                        if (/draft/i.test(category) && !f.path.includes('http')) {
                            link.setAttribute('download', '');
                        }
                        actionCell.appendChild(link);
                    }
                    
                    row.appendChild(nameCell);
                    row.appendChild(updatedCell);
                    row.appendChild(actionCell);
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                categoryDiv.appendChild(table);
                el.appendChild(categoryDiv);
            });
        };
    }


    // Override renderGallery for stills
    function setupStillsRendering() {
        if (window.renderGallery) {
            overrideRenderGallery();
        } else {
            const checkRenderGallery = setInterval(() => {
                if (window.renderGallery) {
                    clearInterval(checkRenderGallery);
                    overrideRenderGallery();
                }
            }, 100);
        }
    }

    function overrideRenderGallery() {
        const originalRenderGallery = window.renderGallery;
        window.renderGallery = function(el, gallery) {
            if (el && el.hasAttribute('data-stills')) {
                // Store stills data for lightbox
                window.__summerStillsData = gallery;
                originalRenderGallery(el, gallery);
                // Split stills after a short delay to ensure rendering is complete
                setTimeout(splitStills, 200);
            } else {
                originalRenderGallery(el, gallery);
            }
        };
    }

    function splitStills() {
        const stillsContainer = document.querySelector('[data-stills]');
        const preview = document.getElementById('stillsPreview');
        const full = document.getElementById('stillsFull');
        const expandBtn = document.getElementById('expandStills');
        
        if (!stillsContainer || !preview || !full) return;
        
        const gallery = stillsContainer.querySelector('.gallery');
        if (!gallery) return;
        
        const items = Array.from(gallery.children);
        if (items.length === 0) return;
        
        const previewItems = items.slice(0, 4);
        const fullItems = items.slice(4);

        // Create preview gallery
        if (previewItems.length > 0) {
            const previewGallery = document.createElement('div');
            previewGallery.className = 'gallery';
            previewItems.forEach(item => {
                const cloned = item.cloneNode(true);
                previewGallery.appendChild(cloned);
            });
            preview.innerHTML = '';
            preview.appendChild(previewGallery);
            
            // Re-attach click handlers
            previewGallery.querySelectorAll('.gallery-item').forEach((item, idx) => {
                item.addEventListener('click', () => {
                    const allStills = window.__summerStillsData || [];
                    if (allStills.length > 0 && window.openGalleryModalWithList) {
                        window.openGalleryModalWithList(allStills, idx);
                    }
                });
            });
        }

        // Create full gallery
        if (fullItems.length > 0) {
            const fullGallery = document.createElement('div');
            fullGallery.className = 'gallery';
            fullItems.forEach(item => {
                const cloned = item.cloneNode(true);
                fullGallery.appendChild(cloned);
            });
            full.innerHTML = '';
            full.appendChild(fullGallery);
            
            // Re-attach click handlers
            fullGallery.querySelectorAll('.gallery-item').forEach((item, idx) => {
                item.addEventListener('click', () => {
                    const allStills = window.__summerStillsData || [];
                    if (allStills.length > 0 && window.openGalleryModalWithList) {
                        window.openGalleryModalWithList(allStills, idx + 4);
                    }
                });
            });
        }

        // Hide original container if we have more than 4 items
        if (items.length > 4) {
            stillsContainer.style.display = 'none';
        } else {
            // If 4 or fewer, just show in preview
            preview.innerHTML = '';
            preview.appendChild(gallery.cloneNode(true));
            stillsContainer.style.display = 'none';
            if (expandBtn) expandBtn.style.display = 'none';
        }
    }

    // Stills expand/collapse
    function setupStillsExpand() {
        const expandBtn = document.getElementById('expandStills');
        const preview = document.getElementById('stillsPreview');
        const full = document.getElementById('stillsFull');
        
        if (!expandBtn || !preview || !full) return;

        let isExpanded = false;

        expandBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                preview.style.display = 'none';
                full.style.display = 'grid';
                expandBtn.textContent = 'Show less';
            } else {
                preview.style.display = 'grid';
                full.style.display = 'none';
                expandBtn.textContent = 'View all stills';
            }
        });
    }

    // Inspiration filters
    function setupInspirationFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const inspirationGallery = document.querySelector('.inspiration-gallery');
        
        if (!filterBtns.length || !inspirationGallery) return;

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                filterInspirationGallery(filter);
            });
        });
    }

    function filterInspirationGallery(filter) {
        const galleryItems = document.querySelectorAll('.inspiration-gallery .gallery-item');
        
        galleryItems.forEach(item => {
            if (filter === 'all') {
                item.style.display = '';
            } else {
                // Simple keyword matching based on image title/alt
                const img = item.querySelector('img');
                const title = img ? (img.alt || img.title || '').toLowerCase() : '';
                const matches = title.includes(filter);
                item.style.display = matches ? '' : 'none';
            }
        });
    }

    // Override renderBookmarks to add empty state
    function setupBookmarkRendering() {
        if (window.renderBookmarks) {
            overrideRenderBookmarks();
        } else {
            const checkRenderBookmarks = setInterval(() => {
                if (window.renderBookmarks) {
                    clearInterval(checkRenderBookmarks);
                    overrideRenderBookmarks();
                }
            }, 100);
        }
    }

    function overrideRenderBookmarks() {
        const originalRenderBookmarks = window.renderBookmarks;
        window.renderBookmarks = function(el, bookmarks) {
            if (!el) return;
            el.innerHTML = '';
            if (!bookmarks || !bookmarks.length) {
                el.innerHTML = '<div class="bookmarks-empty"><p>No bookmarks yet. Click "Add Bookmark" to get started.</p></div>';
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
                    desc.style.color = '#a9b8c6';
                    a.appendChild(desc);
                }
                li.appendChild(a);
                ul.appendChild(li);
            });
            el.appendChild(ul);
        };
    }

    // Bookmark modal
    function setupBookmarkModal() {
        const addBtn = document.getElementById('addBookmarkBtn');
        const modal = document.getElementById('bookmarkModal');
        
        if (addBtn && modal) {
            addBtn.addEventListener('click', () => {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        }

        // Close modal on outside click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeBookmarkModal();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closeBookmarkModal();
                }
            });
        }
    }

    // Make closeBookmarkModal available globally
    window.closeBookmarkModal = function() {
        const modal = document.getElementById('bookmarkModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Setup accordions
    function setupAccordions() {
        const accordions = document.querySelectorAll('details');
        accordions.forEach(accordion => {
            accordion.addEventListener('toggle', () => {
                // Optional: Add any accordion-specific behavior here
            });
        });
    }

})();
