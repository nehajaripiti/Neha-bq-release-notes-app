// Global state
let allReleaseNotes = [];
let filteredNotes = [];
let currentCategory = 'all';
let searchQuery = '';
let selectedNote = null;

// Progress Ring settings for Character Counter
const circle = document.querySelector('.progress-ring__circle');
const radius = circle ? circle.r.baseVal.value : 10;
const circumference = 2 * Math.PI * radius;

if (circle) {
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;
}

// Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = refreshBtn.querySelector('.spinner-icon');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterTabs = document.getElementById('filter-tabs');
const showingCountEl = document.getElementById('showing-count');
const totalCountEl = document.getElementById('total-count');

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessageEl = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const notesGrid = document.getElementById('notes-grid');

const retryBtn = document.getElementById('retry-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalPreviewBadge = document.getElementById('preview-badge');
const modalPreviewDate = document.getElementById('preview-date');
const modalPreviewText = document.getElementById('preview-text');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const charNumber = document.getElementById('char-number');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const submitTweetBtn = document.getElementById('submit-tweet-btn');
const tagPills = document.querySelectorAll('.tag-pill');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// API call to fetch release notes
async function fetchReleaseNotes() {
    showLoading(true);
    refreshIcon.classList.add('spinning');
    
    try {
        const response = await fetch('/api/release-notes');
        const result = await response.json();
        
        if (result.success) {
            allReleaseNotes = result.data;
            totalCountEl.textContent = allReleaseNotes.length;
            applyFiltersAndSearch();
            showError(false);
        } else {
            throw new Error(result.error || "Unknown server error");
        }
    } catch (error) {
        console.error("Error fetching release notes:", error);
        errorMessageEl.textContent = `Could not load release notes: ${error.message}`;
        showError(true);
    } finally {
        showLoading(false);
        refreshIcon.classList.remove('spinning');
    }
}

// UI State Toggles
function showLoading(isLoading) {
    if (isLoading) {
        loadingState.style.display = 'grid';
        notesGrid.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
    }
}

function showError(isError) {
    if (isError) {
        errorState.style.display = 'block';
        notesGrid.style.display = 'none';
        emptyState.style.display = 'none';
        loadingState.style.display = 'none';
    } else {
        errorState.style.display = 'none';
    }
}

// Render the grid of cards
function renderNotes() {
    notesGrid.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        notesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        showingCountEl.textContent = '0';
        return;
    }
    
    emptyState.style.display = 'none';
    notesGrid.style.display = 'grid';
    showingCountEl.textContent = filteredNotes.length;
    
    filteredNotes.forEach(note => {
        const card = document.createElement('article');
        card.className = 'note-card';
        
        // Define styling token based on category type
        const catClass = `badge-${note.type.toLowerCase()}`;
        
        // Set category color variable for card line animation
        let catColor = '#38bdf8';
        if (note.type === 'Feature') catColor = '#10b981';
        else if (note.type === 'Announcement') catColor = '#3b82f6';
        else if (note.type === 'Issue') catColor = '#f97316';
        else if (note.type === 'Change') catColor = '#a855f7';
        else if (note.type === 'Deprecation') catColor = '#f43f5e';
        else if (note.type === 'Update') catColor = '#14b8a6';
        
        card.style.setProperty('--category-color', catColor);
        
        // Highlight matched search terms if search query exists
        let displayedContent = note.content;
        if (searchQuery) {
            const escapedQuery = searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');
            
            // Temporary container to parse HTML, match text node queries only, keeping HTML tags safe
            const temp = document.createElement('div');
            temp.innerHTML = note.content;
            highlightTextNodes(temp, regex);
            displayedContent = temp.innerHTML;
        }
        
        // Ensure links in content open in new window
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = displayedContent;
        contentDiv.querySelectorAll('a').forEach(a => {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        });
        
        // Make HTML layout for Card
        card.innerHTML = `
            <div>
                <div class="card-header">
                    <span class="badge ${catClass}">
                        ${getCategoryIcon(note.type)} ${note.type}
                    </span>
                    <span class="card-date">
                        <i class="fa-regular fa-calendar"></i> ${note.date}
                    </span>
                </div>
                <div class="card-body">
                    ${contentDiv.innerHTML}
                </div>
            </div>
            <div class="card-actions">
                <a href="${note.link}" target="_blank" rel="noopener noreferrer" class="btn-text-link" title="Read in official docs">
                    <span>Docs Note</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <button class="btn-action-icon share-x-btn" title="Share on X (Twitter)">
                    <i class="fa-brands fa-x-twitter"></i>
                </button>
            </div>
        `;
        
        // Add event listener to share button
        const shareBtn = card.querySelector('.share-x-btn');
        shareBtn.addEventListener('click', () => openTweetModal(note));
        
        notesGrid.appendChild(card);
    });
}

// Help find and highlight search matches safely within HTML
function highlightTextNodes(element, regex) {
    if (element.nodeType === Node.TEXT_NODE) {
        if (element.nodeValue.match(regex)) {
            const span = document.createElement('span');
            span.innerHTML = element.nodeValue.replace(regex, '<mark class="search-highlight">$1</mark>');
            element.parentNode.replaceChild(span, element);
        }
    } else if (element.nodeType === Node.ELEMENT_NODE && element.nodeName !== 'A' && element.nodeName !== 'CODE') {
        // Safe to highlight inside p, li, span, but skip anchors & code blocks to avoid breaking links/syntax
        for (let i = element.childNodes.length - 1; i >= 0; i--) {
            highlightTextNodes(element.childNodes[i], regex);
        }
    }
}

// Category icons map
function getCategoryIcon(type) {
    switch (type) {
        case 'Feature': return '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        case 'Announcement': return '<i class="fa-solid fa-bullhorn"></i>';
        case 'Issue': return '<i class="fa-solid fa-triangle-exclamation"></i>';
        case 'Change': return '<i class="fa-solid fa-sliders"></i>';
        case 'Deprecation': return '<i class="fa-solid fa-ban"></i>';
        default: return '<i class="fa-solid fa-info-circle"></i>';
    }
}

// Apply searches & category selectors local-side
function applyFiltersAndSearch() {
    filteredNotes = allReleaseNotes.filter(note => {
        const matchesCategory = currentCategory === 'all' || note.type === currentCategory;
        
        let matchesSearch = true;
        if (searchQuery) {
            const cleanText = cleanHtmlToText(note.content).toLowerCase();
            const cleanTitle = note.date.toLowerCase();
            const cleanType = note.type.toLowerCase();
            const query = searchQuery.toLowerCase();
            
            matchesSearch = cleanText.includes(query) || 
                            cleanTitle.includes(query) || 
                            cleanType.includes(query);
        }
        
        return matchesCategory && matchesSearch;
    });
    
    renderNotes();
}

// Helper: Strip HTML tags to make plain text
function cleanHtmlToText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Replace structural items with text-friendly tags before stripping
    temp.querySelectorAll('code').forEach(c => {
        c.innerText = ` \`${c.innerText}\` `;
    });
    
    // For lists, format bullets
    temp.querySelectorAll('li').forEach(li => {
        li.innerText = `\n• ${li.innerText}`;
    });
    
    let text = temp.textContent || temp.innerText || "";
    // Clean spaces
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n');
    return text.trim();
}

// Formulate pre-composed Tweet text
function generateTweetDraft(note) {
    const link = note.link || "https://cloud.google.com/bigquery/docs/release-notes";
    const header = `BigQuery ${note.type} (${note.date}):\n`;
    const hashtags = `\n\n#BigQuery #GoogleCloud`;
    
    // Twitter max length is 280
    // Account for link, header, spacing, hashtags
    const maxTextLen = 280 - header.length - link.length - hashtags.length - 6; 
    
    let cleanText = cleanHtmlToText(note.content);
    
    // Remove newline bullets for shorter layout
    cleanText = cleanText.replace(/\n• /g, ', ').replace(/\n/g, ' ');
    
    if (cleanText.length > maxTextLen) {
        cleanText = cleanText.substring(0, maxTextLen - 3) + "...";
    }
    
    return `${header}${cleanText}${hashtags}\n${link}`;
}

// Modal handling
function openTweetModal(note) {
    selectedNote = note;
    
    // Set preview details
    modalPreviewBadge.textContent = note.type;
    modalPreviewBadge.className = `preview-badge text-${note.type.toLowerCase()}`;
    modalPreviewDate.textContent = note.date;
    modalPreviewText.innerHTML = note.content;
    
    // Set category color border in modal preview
    let catColor = '#38bdf8';
    if (note.type === 'Feature') catColor = '#10b981';
    else if (note.type === 'Announcement') catColor = '#3b82f6';
    else if (note.type === 'Issue') catColor = '#f97316';
    else if (note.type === 'Change') catColor = '#a855f7';
    else if (note.type === 'Deprecation') catColor = '#f43f5e';
    
    document.querySelector('.note-preview-box').style.setProperty('--category-color', catColor);
    
    // Populate textarea with draft
    const draft = generateTweetDraft(note);
    tweetTextarea.value = draft;
    
    updateCharacterCount();
    
    // Open modal
    tweetModal.classList.add('active');
    tweetTextarea.focus();
}

function closeTweetModal() {
    tweetModal.classList.remove('active');
    selectedNote = null;
}

// Live character counter and progress wheel
function updateCharacterCount() {
    const len = tweetTextarea.value.length;
    const remaining = 280 - len;
    
    charNumber.textContent = remaining;
    
    // Color alert classes
    charCounter.className = 'character-counter';
    if (remaining <= 20 && remaining > 0) {
        charCounter.classList.add('warning');
    } else if (remaining <= 0) {
        charCounter.classList.add('danger');
    }
    
    // Progress wheel logic
    if (circle) {
        const percentage = Math.min(len / 280, 1);
        const offset = circumference - (percentage * circumference);
        circle.style.strokeDashoffset = offset;
        
        // Progress color
        if (remaining <= 0) {
            circle.style.stroke = '#f43f5e'; // Red
        } else if (remaining <= 20) {
            circle.style.stroke = '#f97316'; // Orange
        } else {
            circle.style.stroke = '#1d9bf0'; // Twitter Blue
        }
    }
    
    // Disable submit button if over limit
    if (remaining < 0 || len === 0) {
        submitTweetBtn.disabled = true;
        submitTweetBtn.style.opacity = '0.5';
        submitTweetBtn.style.cursor = 'not-allowed';
    } else {
        submitTweetBtn.disabled = false;
        submitTweetBtn.style.opacity = '1';
        submitTweetBtn.style.cursor = 'pointer';
    }
}

// Toast Alerts
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 2500);
}

// Event Listeners setup
function setupEvents() {
    // Refresh
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        applyFiltersAndSearch();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        applyFiltersAndSearch();
        searchInput.focus();
    });
    
    // Filters
    filterTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;
        
        // Remove active class
        filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        
        // Add active
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        
        applyFiltersAndSearch();
    });
    
    // Clear filters empty state
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        
        filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        filterTabs.querySelector('[data-category="all"]').classList.add('active');
        currentCategory = 'all';
        
        applyFiltersAndSearch();
    });
    
    // Modal controls
    closeModalBtn.addEventListener('click', closeTweetModal);
    
    // Close modal on overlay click
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });
    
    // Textarea input
    tweetTextarea.addEventListener('input', updateCharacterCount);
    
    // Tag Pills inside composer
    tagPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const tag = pill.dataset.tag;
            const currentVal = tweetTextarea.value;
            
            // Check if tag already exists in tweet text
            if (!currentVal.includes(tag)) {
                // Insert tags before the URL link
                const linkIndex = currentVal.lastIndexOf('https://');
                if (linkIndex !== -1) {
                    const beforeLink = currentVal.substring(0, linkIndex).trim();
                    const link = currentVal.substring(linkIndex);
                    tweetTextarea.value = `${beforeLink} ${tag}\n\n${link}`;
                } else {
                    tweetTextarea.value = `${currentVal.trim()} ${tag}`;
                }
                updateCharacterCount();
                tweetTextarea.focus();
            }
        });
    });
    
    // Copy Clipboard
    copyTweetBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(tweetTextarea.value);
            
            // Visual success feedback on copy button
            const icon = copyTweetBtn.querySelector('i');
            const origClass = icon.className;
            icon.className = 'fa-solid fa-check text-feature';
            copyTweetBtn.style.borderColor = '#10b981';
            
            showToast("Tweet text copied to clipboard!");
            
            setTimeout(() => {
                icon.className = origClass;
                copyTweetBtn.style.borderColor = '';
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text:", err);
            showToast("Failed to copy text. Please select and copy manually.");
        }
    });
    
    // Submit Tweet on X (Twitter Intent)
    submitTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const encodedText = encodeURIComponent(text);
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        
        window.open(intentUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
        showToast("Opened Twitter Share!");
    });
    
    // Keyboard handlers
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('active')) {
            closeTweetModal();
        }
    });
}

// Initial fire
document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    fetchReleaseNotes();
});
