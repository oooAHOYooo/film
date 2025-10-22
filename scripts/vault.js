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
    categoryDiv.style.marginBottom = '32px';
    
    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = category;
    categoryTitle.style.marginBottom = '16px';
    categoryTitle.style.color = '#75c0ff';
    categoryDiv.appendChild(categoryTitle);
    
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
    linkHeader.textContent = 'Link';
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
      const link = document.createElement('a');
      link.href = f.path;
      link.textContent = 'Open';
      link.target = '_blank';
      link.className = 'btn';
      link.style.display = 'inline-block';
      link.style.padding = '6px 12px';
      link.style.fontSize = '14px';
      link.style.textDecoration = 'none';
      linkCell.appendChild(link);
      linkCell.style.padding = '12px 16px';
      
      row.appendChild(nameCell);
      row.appendChild(updatedCell);
      row.appendChild(linkCell);
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    categoryDiv.appendChild(table);
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

async function hydrateSection(key) {
  const data = await loadJson(`/data/${key}.json`);
  renderList(document.querySelector('[data-notes]'), data.notes);
  renderList(document.querySelector('[data-ideas]'), data.ideas);
  renderFiles(document.querySelector('[data-files]'), data.files);
  renderBookmarks(document.querySelector('[data-bookmarks]'), data.bookmarks);
}
