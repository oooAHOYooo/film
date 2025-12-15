async function loadJson(path) {
  try {
    const res = await fetch(path + '?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('loadJson failed', path, e);
    return { notes:[], ideas:[], tasks:[], files:[] };
  }
}

function renderList(el, items) {
  if (!el) return;
  el.innerHTML = '';
  if (!items || !items.length) { el.innerHTML = '<em>Empty</em>'; return; }
  const ul = document.createElement('ul');
  ul.className = 'list';
  items.forEach(v => {
    const li = document.createElement('li');
    li.textContent = typeof v === 'string' ? v : JSON.stringify(v);
    ul.appendChild(li);
  });
  el.appendChild(ul);
}

function renderFiles(el, files) {
  if (!el) return;
  el.innerHTML = '';
  if (!files || !files.length) { el.innerHTML = '<em>No files yet.</em>'; return; }
  
  // Group files by category
  const categories = {};
  files.forEach(f => {
    const category = f.category || 'Other';
    if (!categories[category]) categories[category] = [];
    categories[category].push(f);
  });
  
  // Render each category
  Object.keys(categories).sort().forEach(category => {
    const categoryDiv = document.createElement('div');
    categoryDiv.style.marginBottom = '20px';
    const isDrafts = /draft/i.test(category);

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = category;
    summary.style.cursor = 'pointer';
    summary.style.color = '#75c0ff';
    summary.style.fontWeight = '600';
    summary.style.fontSize = '1.2rem';
    summary.style.marginBottom = '12px';
    details.appendChild(summary);
    
    categoryDiv.appendChild(details);
    const containerEl = details;
    
    // Create table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.border = '1px solid #1e2530';
    table.style.borderRadius = '8px';
    table.style.overflow = 'hidden';
    
    // Create table header
    const thead = document.createElement('thead');
    thead.style.backgroundColor = '#1b263b';
    const headerRow = document.createElement('tr');
    
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'Name';
    nameHeader.style.padding = '12px 16px';
    nameHeader.style.textAlign = 'left';
    nameHeader.style.borderBottom = '1px solid #1e2530';
    nameHeader.style.fontWeight = '600';
    
    const updatedHeader = document.createElement('th');
    updatedHeader.textContent = 'Last Updated';
    updatedHeader.style.padding = '12px 16px';
    updatedHeader.style.textAlign = 'left';
    updatedHeader.style.borderBottom = '1px solid #1e2530';
    updatedHeader.style.fontWeight = '600';
    
    const linkHeader = document.createElement('th');
    linkHeader.textContent = isDrafts ? 'Download' : 'Link';
    linkHeader.style.padding = '12px 16px';
    linkHeader.style.textAlign = 'left';
    linkHeader.style.borderBottom = '1px solid #1e2530';
    linkHeader.style.fontWeight = '600';
    
    headerRow.appendChild(nameHeader);
    headerRow.appendChild(updatedHeader);
    headerRow.appendChild(linkHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    categories[category].forEach(f => {
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #1e2530';
      row.style.backgroundColor = '#11141a';
      
      // Name cell
      const nameCell = document.createElement('td');
      nameCell.textContent = f.label || f.path;
      nameCell.style.padding = '12px 16px';
      nameCell.style.fontWeight = '500';
      
      // Last updated cell
      const updatedCell = document.createElement('td');
      updatedCell.textContent = f.lastUpdated || 'Unknown';
      updatedCell.style.padding = '12px 16px';
      updatedCell.style.color = '#a9b8c6';
      updatedCell.style.fontSize = '14px';
      
      // Link cell
      const linkCell = document.createElement('td');
      linkCell.style.padding = '12px 16px';
      
      // Check if it's a video file
      const isVideo = f.path && (f.path.includes('.mov') || f.path.includes('.mp4') || f.path.includes('.webm') || f.path.includes('.avi') || f.path.includes('.mkv'));
      
      if (isVideo && !isDrafts) {
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Play';
        playBtn.className = 'btn';
        playBtn.style.display = 'inline-block';
        playBtn.style.padding = '6px 12px';
        playBtn.style.fontSize = '14px';
        playBtn.style.textDecoration = 'none';
        playBtn.addEventListener('click', () => openVideoModal(f.path, f.label));
        linkCell.appendChild(playBtn);
      } else {
        const link = document.createElement('a');
        link.href = f.path;
        link.textContent = isDrafts ? 'Download' : 'Open';
        link.target = '_blank';
        link.className = 'btn';
        link.style.display = 'inline-block';
        link.style.padding = '6px 12px';
        link.style.fontSize = '14px';
        link.style.textDecoration = 'none';
        if (isDrafts) {
          link.setAttribute('download', '');
          link.rel = 'noopener';
        }
        linkCell.appendChild(link);
      }
      
      row.appendChild(nameCell);
      row.appendChild(updatedCell);
      row.appendChild(linkCell);
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    // Append table to details container
    containerEl.appendChild(table);
    el.appendChild(categoryDiv);
  });
}

function renderBookmarks(el, bookmarks) {
  if (!el) return;
  el.innerHTML = '';
  if (!bookmarks || !bookmarks.length) { el.innerHTML = '<em>No bookmarks yet.</em>'; return; }
  const ul = document.createElement('ul');
  ul.className = 'list';
  bookmarks.forEach(b => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = b.url; a.textContent = b.title; a.target = '_blank';
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
}

let __currentGalleryList = [];
let __currentGalleryIndex = 0;
let __lastFocusedElement = null;

function renderGallery(el, gallery) {
  if (!el) return;
  el.innerHTML = '';
  if (!gallery || !gallery.length) { el.innerHTML = '<em>No images yet.</em>'; return; }
  
  const galleryDiv = document.createElement('div');
  galleryDiv.className = 'gallery';
  
  gallery.forEach((item, index) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-index', index);
    
    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.title || 'Gallery image';
    img.loading = 'lazy';
    
    const info = document.createElement('div');
    info.className = 'gallery-item-info';
    
    const title = document.createElement('h4');
    title.textContent = item.title || 'Untitled';
    
    const description = document.createElement('p');
    description.textContent = item.description || '';
    
    info.appendChild(title);
    if (item.description) {
      info.appendChild(description);
    }
    
    galleryItem.appendChild(img);
    galleryItem.appendChild(info);
    
    // Add click handler for modal with navigation
    galleryItem.addEventListener('click', () => openGalleryModalWithList(gallery, index));
    
    galleryDiv.appendChild(galleryItem);
  });
  
  el.appendChild(galleryDiv);
  
  // Create modal if it doesn't exist
  if (!document.querySelector('.gallery-modal')) {
    createGalleryModal();
  }
}

function createGalleryModal() {
  const modal = document.createElement('div');
  modal.className = 'gallery-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Image viewer');
  
  const content = document.createElement('div');
  content.className = 'gallery-modal-content';
  
  const img = document.createElement('img');
  img.alt = 'Gallery image';
  img.setAttribute('role', 'img');
  // Scroll container for the image
  const scroll = document.createElement('div');
  scroll.className = 'gallery-modal-scroll';
  scroll.appendChild(img);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'gallery-modal-close';
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('click', closeGalleryModal);
  closeBtn.setAttribute('aria-label', 'Close viewer');
  
  const prevBtn = document.createElement('button');
  prevBtn.className = 'gallery-modal-prev';
  prevBtn.innerHTML = '‹';
  prevBtn.title = 'Previous (Left Arrow)';
  prevBtn.addEventListener('click', showPrevImage);
  prevBtn.setAttribute('aria-label', 'Previous image');
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'gallery-modal-next';
  nextBtn.innerHTML = '›';
  nextBtn.title = 'Next (Right Arrow / Space)';
  nextBtn.addEventListener('click', showNextImage);
  nextBtn.setAttribute('aria-label', 'Next image');
  
  content.appendChild(scroll);
  content.appendChild(closeBtn);
  content.appendChild(prevBtn);
  content.appendChild(nextBtn);
  modal.appendChild(content);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeGalleryModal();
    }
  });
  
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeGalleryModal();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      showNextImage();
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPrevImage();
      return;
    }
  });
  
  // Trap focus within modal content
  content.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = Array.from(content.querySelectorAll('button')).filter(el => !el.disabled);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  
  document.body.appendChild(modal);
}

function openGalleryModal(imageUrl, title) {
  const modal = document.querySelector('.gallery-modal');
  const img = modal.querySelector('img');
  
  img.src = imageUrl;
  img.alt = title || 'Gallery image';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeGalleryModal() {
  const modal = document.querySelector('.gallery-modal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  if (__lastFocusedElement && typeof __lastFocusedElement.focus === 'function') {
    __lastFocusedElement.focus();
  }
  __lastFocusedElement = null;
}

function openGalleryModalWithList(list, index) {
  __currentGalleryList = Array.isArray(list) ? list : [];
  __currentGalleryIndex = typeof index === 'number' ? index : 0;
  __lastFocusedElement = document.activeElement || null;
  const modal = document.querySelector('.gallery-modal');
  const img = modal.querySelector('img');
  const nextBtn = modal.querySelector('.gallery-modal-next');
  const item = __currentGalleryList[__currentGalleryIndex] || {};
  img.src = item.url || '';
  img.alt = item.title || 'Gallery image';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  if (nextBtn) nextBtn.focus();
}

function showNextImage() {
  if (!__currentGalleryList.length) return;
  __currentGalleryIndex = (__currentGalleryIndex + 1) % __currentGalleryList.length;
  updateModalImage();
}

function showPrevImage() {
  if (!__currentGalleryList.length) return;
  __currentGalleryIndex = (__currentGalleryIndex - 1 + __currentGalleryList.length) % __currentGalleryList.length;
  updateModalImage();
}

function updateModalImage() {
  const modal = document.querySelector('.gallery-modal');
  if (!modal || !modal.classList.contains('active')) return;
  const img = modal.querySelector('img');
  const item = __currentGalleryList[__currentGalleryIndex] || {};
  img.src = item.url || '';
  img.alt = item.title || 'Gallery image';
}

function openVideoModal(videoUrl, title) {
  // Create video modal if it doesn't exist
  if (!document.querySelector('.video-modal')) {
    createVideoModal();
  }
  
  const modal = document.querySelector('.video-modal');
  const video = modal.querySelector('video');
  const titleEl = modal.querySelector('.video-modal-title');
  
  // Mobile optimizations
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  video.src = videoUrl;
  video.alt = title || 'Video';
  titleEl.textContent = title || 'Video';
  
  // Mobile-specific loading strategy
  if (isMobile) {
    video.load(); // Force load on mobile
    video.addEventListener('loadeddata', () => {
      // Video is ready to play
    }, { once: true });
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Prevent iOS Safari from going fullscreen automatically
  if (isMobile) {
    video.addEventListener('play', () => {
      video.style.objectFit = 'contain';
    });
  }
}

function createVideoModal() {
  const modal = document.createElement('div');
  modal.className = 'video-modal';
  
  const content = document.createElement('div');
  content.className = 'video-modal-content';
  
  const title = document.createElement('h3');
  title.className = 'video-modal-title';
  title.textContent = 'Video';
  
  const video = document.createElement('video');
  video.controls = true;
  video.preload = 'metadata';
  video.style.width = '100%';
  video.style.maxHeight = '80vh';
  video.style.borderRadius = '8px';
  
  // Mobile optimizations
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.setAttribute('x5-playsinline', 'true');
  video.setAttribute('x5-video-player-type', 'h5');
  video.setAttribute('x5-video-player-fullscreen', 'true');
  
  // Optimize for mobile performance
  video.setAttribute('preload', 'none');
  video.muted = false;
  
  // Fullscreen support
  video.setAttribute('webkitallowfullscreen', 'true');
  video.setAttribute('mozallowfullscreen', 'true');
  video.setAttribute('allowfullscreen', 'true');
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'video-modal-close';
  closeBtn.innerHTML = '×';
  closeBtn.addEventListener('click', closeVideoModal);
  
  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.className = 'video-modal-fullscreen';
  fullscreenBtn.innerHTML = '⛶';
  fullscreenBtn.title = 'Toggle Fullscreen';
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  
  content.appendChild(title);
  content.appendChild(video);
  content.appendChild(closeBtn);
  content.appendChild(fullscreenBtn);
  modal.appendChild(content);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeVideoModal();
    }
  });
  
  // Close modal with Escape key and fullscreen with F key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
        exitFullscreen();
      } else {
        closeVideoModal();
      }
    }
    if (e.key === 'f' || e.key === 'F') {
      if (modal.classList.contains('active')) {
        e.preventDefault();
        toggleFullscreen();
      }
    }
  });
  
  document.body.appendChild(modal);
}

function toggleFullscreen() {
  const modal = document.querySelector('.video-modal');
  const video = modal.querySelector('video');
  
  if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
    // Enter fullscreen
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.mozRequestFullScreen) {
      video.mozRequestFullScreen();
    } else if (video.msRequestFullscreen) {
      video.msRequestFullscreen();
    }
  } else {
    // Exit fullscreen
    exitFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function closeVideoModal() {
  const modal = document.querySelector('.video-modal');
  const video = modal.querySelector('video');
  
  // Exit fullscreen if active
  if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
    exitFullscreen();
  }
  
  // Pause video when closing
  video.pause();
  video.currentTime = 0;
  
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

async function hydrateSection(key) {
  const data = await loadJson(`/data/${key}.json`);
  renderList(document.querySelector('[data-notes]'), data.notes);
  renderList(document.querySelector('[data-ideas]'), data.ideas);
  renderFiles(document.querySelector('[data-files]'), data.files);
  renderBookmarks(document.querySelector('[data-bookmarks]'), data.bookmarks);
  renderGallery(document.querySelector('[data-gallery]'), data.gallery);
  renderGallery(document.querySelector('[data-inspiration]'), data.inspiration);
  renderGallery(document.querySelector('[data-stills]'), data.stills);
}
