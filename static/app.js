// static/app.js

document.addEventListener('DOMContentLoaded', () => {
  let releaseNotesData = [];
  let filteredNotes = []; // Keeps track of active filtered list for CSV export
  const selectedUpdates = new Set();
  let currentFilter = 'All';
  let searchQuery = '';

  const refreshBtn = document.getElementById('refreshBtn');
  const searchInput = document.getElementById('searchInput');
  const categoryFilters = document.getElementById('categoryFilters');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const feedContainer = document.getElementById('feed');
  const floatingBar = document.getElementById('floatingBar');
  const selectedCountEl = document.getElementById('selectedCount');
  const tweetSelectedBtn = document.getElementById('tweetSelectedBtn');
  const clearSelectionBtn = document.getElementById('clearSelectionBtn');

  // Load release notes on initialization
  loadReleaseNotes();

  // Refresh button event listener
  refreshBtn.addEventListener('click', loadReleaseNotes);

  // Search input listener with simple debounce
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value.toLowerCase().strip();
      applyFilters();
    }, 200);
  });

  // Helper string strip method if not present
  if (!String.prototype.strip) {
    String.prototype.strip = function () {
      return this.trim();
    };
  }

  // Category filter tags listeners
  categoryFilters.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;

    // Toggle active classes
    categoryFilters.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.dataset.filter;
    applyFilters();
  });

  // Export to CSV Event
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  // Floating Action Bar Events
  clearSelectionBtn.addEventListener('click', clearAllSelections);
  tweetSelectedBtn.addEventListener('click', tweetSelectedItems);

  // Load feed from API
  async function loadReleaseNotes() {
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    showSkeletons();
    clearAllSelections();

    try {
      const response = await fetch('/api/release-notes');
      const data = await response.json();

      if (data.success) {
        releaseNotesData = data.entries;
        applyFilters();
      } else {
        showErrorState(data.error || 'Failed to fetch release notes.');
      }
    } catch (error) {
      showErrorState('Network error or server unavailable.');
      console.error(error);
    } finally {
      refreshBtn.classList.remove('loading');
      refreshBtn.disabled = false;
    }
  }

  // Render Skeleton Loader Cards
  function showSkeletons() {
    feedContainer.innerHTML = Array(3).fill(0).map(() => `
      <div class="skeleton-card"></div>
    `).join('');
  }

  // Error State Display
  function showErrorState(message) {
    feedContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <h3>Something went wrong</h3>
        <p>${message}</p>
        <button class="btn-refresh" onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }

  // Apply Search & Category Filters
  function applyFilters() {
    filteredNotes = [];

    releaseNotesData.forEach(entry => {
      // Filter individual sub-items inside each day
      const matchingSubItems = entry.sub_items.filter(item => {
        const matchesCategory = currentFilter === 'All' || item.type.toLowerCase() === currentFilter.toLowerCase();
        
        // Simple HTML stripping for text-only search matching
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.html;
        const textContent = tempDiv.textContent.toLowerCase();
        const matchesSearch = textContent.includes(searchQuery) || entry.title.toLowerCase().includes(searchQuery) || item.type.toLowerCase().includes(searchQuery);

        return matchesCategory && matchesSearch;
      });

      if (matchingSubItems.length > 0) {
        filteredNotes.push({
          ...entry,
          sub_items: matchingSubItems
        });
      }
    });

    renderFeed(filteredNotes);
  }

  // Render actual feed content
  function renderFeed(groupedEntries) {
    if (groupedEntries.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <h3>No release notes found</h3>
          <p>Try refining your search or category filters.</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = groupedEntries.map(entry => {
      const dateString = entry.title; // e.g., "June 16, 2026"
      
      const subItemsHtml = entry.sub_items.map((item, idx) => {
        const uniqueId = `${entry.id}_${idx}`;
        const isChecked = selectedUpdates.has(uniqueId) ? 'checked' : '';
        const selectedClass = selectedUpdates.has(uniqueId) ? 'selected' : '';

        // Safely extract plain text snippet for sharing
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.html;
        const plainText = tempDiv.textContent.replace(/\s+/g, ' ').trim();

        return `
          <div class="release-card ${selectedClass}" data-id="${uniqueId}" data-category="${item.type}">
            <div class="checkbox-container">
              <input type="checkbox" class="card-checkbox" data-id="${uniqueId}" data-date="${dateString}" data-text="${escapeHtml(plainText)}" data-link="${entry.link}" ${isChecked}>
            </div>
            <div class="card-body">
              <div class="card-header-row">
                <span class="badge">${item.type}</span>
                <div class="card-actions">
                  <button class="btn-copy single-copy-btn" data-text="${escapeHtml(plainText)}">
                    <svg viewBox="0 0 24 24">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    <span>Copy</span>
                  </button>
                  <button class="btn-tweet single-tweet-btn" data-date="${dateString}" data-type="${item.type}" data-text="${escapeHtml(plainText)}" data-link="${entry.link}">
                    <svg viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Tweet
                  </button>
                </div>
              </div>
              <div class="content-text">${item.html}</div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="date-group">
          <div class="date-header">
            <span class="date-title">${dateString}</span>
            <div class="date-line"></div>
          </div>
          ${subItemsHtml}
        </div>
      `;
    }).join('');

    // Attach card event listeners
    attachCardListeners();
  }

  // Attach card specific event handlers
  function attachCardListeners() {
    // Checkbox and Card Selection toggle
    document.querySelectorAll('.card-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const card = document.querySelector(`.release-card[data-id="${id}"]`);

        if (e.target.checked) {
          selectedUpdates.add(id);
          card.classList.add('selected');
        } else {
          selectedUpdates.delete(id);
          card.classList.remove('selected');
        }
        updateFloatingBar();
      });
    });

    // Single Tweet Button Listener
    document.querySelectorAll('.single-tweet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = btn.dataset.date;
        const type = btn.dataset.type;
        const text = btn.dataset.text;
        const link = btn.dataset.link;
        
        tweetSingle(date, type, text, link);
      });
    });

    // Single Copy Button Listener
    document.querySelectorAll('.single-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = btn.dataset.text;
        navigator.clipboard.writeText(text).then(() => {
          const span = btn.querySelector('span');
          const originalText = span.textContent;
          span.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            span.textContent = originalText;
            btn.classList.remove('copied');
          }, 1500);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      });
    });
  }

  // Export filtered notes to CSV
  function exportToCSV() {
    if (!filteredNotes || filteredNotes.length === 0) {
      alert('No release notes available to export.');
      return;
    }

    let csvRows = ["Date,Category,Description,Link"];

    filteredNotes.forEach(entry => {
      const date = entry.title;
      const link = entry.link;
      entry.sub_items.forEach(item => {
        const category = item.type;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.html;
        const description = tempDiv.textContent.replace(/"/g, '""').replace(/\s+/g, ' ').trim();
        csvRows.push(`"${date}","${category}","${description}","${link}"`);
      });
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", url);
    downloadLink.setAttribute("download", `bigquery_release_notes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  // Update floating bar selection stats
  function updateFloatingBar() {
    const size = selectedUpdates.size;
    selectedCountEl.textContent = size;
    
    if (size > 0) {
      floatingBar.classList.add('visible');
    } else {
      floatingBar.classList.remove('visible');
    }
  }

  // Clear all checked items
  function clearAllSelections() {
    selectedUpdates.clear();
    document.querySelectorAll('.card-checkbox').forEach(cb => {
      cb.checked = false;
    });
    document.querySelectorAll('.release-card').forEach(card => {
      card.classList.remove('selected');
    });
    updateFloatingBar();
  }

  // Tweet single update helper
  function tweetSingle(date, type, text, link) {
    // Truncate text nicely to fit in Twitter's 280-char limit
    const prefix = `BigQuery [${type}] - ${date}: `;
    const suffix = `\n\n#BigQuery #GoogleCloud\n${link}`;
    
    // Available length for the actual message text
    const maxTextLength = 280 - prefix.length - suffix.length;
    let cleanText = text;
    if (cleanText.length > maxTextLength) {
      cleanText = cleanText.substring(0, maxTextLength - 3) + '...';
    }

    const tweetText = encodeURIComponent(prefix + cleanText + suffix);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  }

  // Tweet combined multi-selection updates
  function tweetSelectedItems() {
    if (selectedUpdates.size === 0) return;

    const selectedCheckboxes = Array.from(document.querySelectorAll('.card-checkbox:checked'));
    
    let combinedText = `🔍 Google BigQuery Updates Summary:\n\n`;
    
    selectedCheckboxes.forEach((cb, idx) => {
      const card = cb.closest('.release-card');
      const category = card.dataset.category;
      const date = cb.dataset.date;
      const text = cb.dataset.text;
      
      const snippet = text.length > 60 ? text.substring(0, 57) + '...' : text;
      combinedText += `• [${category}] (${date}): ${snippet}\n`;
    });

    const suffix = `\nCheck out the full release notes:\nhttps://docs.cloud.google.com/bigquery/docs/release-notes\n#BigQuery #GoogleCloud`;
    
    // Fit to 280 limit
    if ((combinedText + suffix).length > 280) {
      // If too long, make it a broader digest call to action
      combinedText = `🚀 Check out these ${selectedUpdates.size} new updates in Google BigQuery, including topics on:\n`;
      selectedCheckboxes.forEach((cb) => {
        const card = cb.closest('.release-card');
        const category = card.dataset.category;
        const text = cb.dataset.text.substring(0, 30) + '...';
        combinedText += `- [${category}]: ${text}\n`;
      });
      
      if ((combinedText + suffix).length > 280) {
        combinedText = `🚀 Ready to review ${selectedUpdates.size} new updates for Google BigQuery covering features, announcements, and issues!`;
      }
    }

    const tweetText = encodeURIComponent(combinedText + suffix);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  }

  // Simple HTML Escaper
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
