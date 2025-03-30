/**
 * emojiPicker.js
 *
 * A module for creating and managing an emoji picker/selector component.
 * This module follows the functional programming paradigm and integrates
 * with the existing emoji rendering system.
 */

import { EMOJI_CATEGORIES, SKIN_TONES, applyEmojiSkinTone, supportsSkinTone } from './emojiUtils.js';

/**
 * Creates an emoji picker component
 *
 * @param {Object} options - Configuration options for the emoji picker
 * @param {HTMLElement} options.container - Container element to append the picker to
 * @param {Function} options.onEmojiSelect - Callback function when an emoji is selected
 * @param {boolean} options.showSkinTones - Whether to show skin tone options (default: true)
 * @param {boolean} options.showSearch - Whether to show search functionality (default: true)
 * @param {boolean} options.showRecents - Whether to show recently used emojis (default: true)
 * @param {boolean} options.showFavorites - Whether to show favorite emojis (default: true)
 * @param {number} options.recentCount - Maximum number of recent emojis to store (default: 20)
 * @param {number} options.favoritesCount - Maximum number of favorite emojis to store (default: 20)
 * @returns {Object} Emoji picker controller object
 */
export const createEmojiPicker = (options) => {
  // Validate required options
  if (!options.container || !(options.container instanceof HTMLElement)) {
    throw new Error('Invalid container element provided to createEmojiPicker');
  }

  if (!options.onEmojiSelect || typeof options.onEmojiSelect !== 'function') {
    throw new Error('Invalid onEmojiSelect callback provided to createEmojiPicker');
  }

  // Set default options
  const config = {
    showSkinTones: options.showSkinTones !== undefined ? options.showSkinTones : true,
    showSearch: options.showSearch !== undefined ? options.showSearch : true,
    showRecents: options.showRecents !== undefined ? options.showRecents : true,
    showFavorites: options.showFavorites !== undefined ? options.showFavorites : true,
    recentCount: options.recentCount || 20,
    favoritesCount: options.favoritesCount || 20
  };

  // State variables
  let currentCategory = Object.keys(EMOJI_CATEGORIES)[0];
  let currentSkinTone = null;
  let searchQuery = '';
  let recentEmojis = loadFromLocalStorage('emoji_picker_recents') || [];
  let favoriteEmojis = loadFromLocalStorage('emoji_picker_favorites') || [];
  let pickerElement = null;
  let isVisible = false;

  /**
   * Loads data from localStorage
   *
   * @param {string} key - The localStorage key
   * @returns {Array|null} The parsed data or null if not found
   */
  function loadFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }

  /**
   * Saves data to localStorage
   *
   * @param {string} key - The localStorage key
   * @param {any} data - The data to save
   */
  function saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Creates the emoji picker DOM structure
   */
  function createPickerElement() {
    // Create main container
    pickerElement = document.createElement('div');
    pickerElement.className = 'emoji-picker';
    pickerElement.style.display = 'none';

    // Add styles
    addPickerStyles();

    // Create header with search if enabled
    if (config.showSearch) {
      const header = createSearchHeader();
      pickerElement.appendChild(header);
    }

    // Create tabs for categories
    const tabs = createCategoryTabs();
    pickerElement.appendChild(tabs);

    // Create recents section if enabled
    if (config.showRecents) {
      const recentsSection = createRecentsSection();
      pickerElement.appendChild(recentsSection);
    }

    // Create favorites section if enabled
    if (config.showFavorites) {
      const favoritesSection = createFavoritesSection();
      pickerElement.appendChild(favoritesSection);
    }

    // Create main emoji grid
    const emojiGrid = createEmojiGrid();
    pickerElement.appendChild(emojiGrid);

    // Create skin tone selector if enabled
    if (config.showSkinTones) {
      const skinToneSelector = createSkinToneSelector();
      pickerElement.appendChild(skinToneSelector);
    }

    // Add to container
    options.container.appendChild(pickerElement);
  }

  /**
   * Adds CSS styles for the emoji picker
   */
  function addPickerStyles() {
    const styleId = 'emoji-picker-styles';

    // Check if styles already exist
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .emoji-picker {
          width: 320px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          font-family: Arial, sans-serif;
          overflow: hidden;
        }

        .emoji-picker-header {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .emoji-search {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .emoji-category-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .emoji-category-tab {
          padding: 10px;
          cursor: pointer;
          flex-shrink: 0;
          text-align: center;
        }

        .emoji-category-tab.active {
          border-bottom: 2px solid #007bff;
          color: #007bff;
        }

        .emoji-section {
          padding: 10px;
          border-bottom: 1px solid #eee;
        }

        .emoji-section-title {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #666;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 5px;
          padding: 10px;
          max-height: 200px;
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .emoji-item {
          font-size: 24px;
          text-align: center;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          user-select: none;
        }

        .emoji-item:hover {
          background-color: #f0f0f0;
        }

        .emoji-skin-tone-selector {
          display: flex;
          justify-content: space-around;
          padding: 10px;
          border-top: 1px solid #eee;
        }

        .emoji-skin-tone-option {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
        }

        .emoji-skin-tone-option.selected {
          border: 2px solid #007bff;
        }

        .emoji-skin-tone-default {
          background-color: #ffd83d;
        }

        .emoji-skin-tone-light {
          background-color: #ffdbac;
        }

        .emoji-skin-tone-medium-light {
          background-color: #f1c27d;
        }

        .emoji-skin-tone-medium {
          background-color: #e0ac69;
        }

        .emoji-skin-tone-medium-dark {
          background-color: #c68642;
        }

        .emoji-skin-tone-dark {
          background-color: #8d5524;
        }

        .emoji-no-results {
          padding: 20px;
          text-align: center;
          color: #666;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Creates the search header
   *
   * @returns {HTMLElement} The search header element
   */
  function createSearchHeader() {
    const header = document.createElement('div');
    header.className = 'emoji-picker-header';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'emoji-search';
    searchInput.placeholder = 'Search emojis...';
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      updateEmojiGrid();
    });

    header.appendChild(searchInput);
    return header;
  }

  /**
   * Creates the category tabs
   *
   * @returns {HTMLElement} The category tabs element
   */
  function createCategoryTabs() {
    const tabs = document.createElement('div');
    tabs.className = 'emoji-category-tabs';

    Object.entries(EMOJI_CATEGORIES).forEach(([key, category]) => {
      const tab = document.createElement('div');
      tab.className = `emoji-category-tab ${key === currentCategory ? 'active' : ''}`;
      tab.textContent = category.samples[0]; // Use first emoji as icon
      tab.title = category.name;
      tab.dataset.category = key;
      tab.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.emoji-category-tab').forEach(el => {
          el.classList.remove('active');
        });
        tab.classList.add('active');

        // Update current category and refresh grid
        currentCategory = key;
        searchQuery = '';
        if (config.showSearch) {
          const searchInput = pickerElement.querySelector('.emoji-search');
          if (searchInput) searchInput.value = '';
        }
        updateEmojiGrid();
      });

      tabs.appendChild(tab);
    });

    return tabs;
  }

  /**
   * Creates the recently used emojis section
   *
   * @returns {HTMLElement} The recents section element
   */
  function createRecentsSection() {
    const section = document.createElement('div');
    section.className = 'emoji-section emoji-recents-section';

    const title = document.createElement('h3');
    title.className = 'emoji-section-title';
    title.textContent = 'Recently Used';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'emoji-grid emoji-recents-grid';

    // Populate with recent emojis
    updateRecentsGrid(grid);

    section.appendChild(grid);

    // Hide if no recent emojis
    if (recentEmojis.length === 0) {
      section.style.display = 'none';
    }

    return section;
  }

  /**
   * Updates the recents grid with current recent emojis
   *
   * @param {HTMLElement} grid - The grid element to update
   */
  function updateRecentsGrid(grid) {
    // Clear existing content
    grid.innerHTML = '';

    if (recentEmojis.length === 0) {
      const noRecents = document.createElement('div');
      noRecents.className = 'emoji-no-results';
      noRecents.textContent = 'No recently used emojis';
      grid.appendChild(noRecents);
      return;
    }

    // Add recent emojis
    recentEmojis.forEach(emoji => {
      const emojiElement = createEmojiElement(emoji);
      grid.appendChild(emojiElement);
    });
  }

  /**
   * Creates the favorites section
   *
   * @returns {HTMLElement} The favorites section element
   */
  function createFavoritesSection() {
    const section = document.createElement('div');
    section.className = 'emoji-section emoji-favorites-section';

    const title = document.createElement('h3');
    title.className = 'emoji-section-title';
    title.textContent = 'Favorites';
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'emoji-grid emoji-favorites-grid';

    // Populate with favorite emojis
    updateFavoritesGrid(grid);

    section.appendChild(grid);

    // Hide if no favorite emojis
    if (favoriteEmojis.length === 0) {
      section.style.display = 'none';
    }

    return section;
  }

  /**
   * Updates the favorites grid with current favorite emojis
   *
   * @param {HTMLElement} grid - The grid element to update
   */
  function updateFavoritesGrid(grid) {
    // Clear existing content
    grid.innerHTML = '';

    if (favoriteEmojis.length === 0) {
      const noFavorites = document.createElement('div');
      noFavorites.className = 'emoji-no-results';
      noFavorites.textContent = 'No favorite emojis';
      grid.appendChild(noFavorites);
      return;
    }

    // Add favorite emojis
    favoriteEmojis.forEach(emoji => {
      const emojiElement = createEmojiElement(emoji);

      // Add double-click handler to remove from favorites
      emojiElement.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        removeFromFavorites(emoji);
        updateFavoritesGrid(grid);
      });

      grid.appendChild(emojiElement);
    });
  }

  /**
   * Creates the main emoji grid
   *
   * @returns {HTMLElement} The emoji grid element
   */
  function createEmojiGrid() {
    const grid = document.createElement('div');
    grid.className = 'emoji-grid emoji-main-grid';

    // Populate with emojis from current category
    updateEmojiGrid();

    return grid;
  }

  /**
   * Updates the main emoji grid based on current category and search query
   */
  function updateEmojiGrid() {
    const grid = pickerElement.querySelector('.emoji-main-grid');
    if (!grid) return;

    // Clear existing content
    grid.innerHTML = '';

    let emojisToShow = [];

    if (searchQuery) {
      // Search across all categories
      Object.values(EMOJI_CATEGORIES).forEach(category => {
        const matchingEmojis = category.samples.filter(emoji =>
          emoji.toLowerCase().includes(searchQuery)
        );
        emojisToShow = [...emojisToShow, ...matchingEmojis];
      });
    } else {
      // Show current category
      emojisToShow = EMOJI_CATEGORIES[currentCategory].samples;
    }

    if (emojisToShow.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'emoji-no-results';
      noResults.textContent = searchQuery ? 'No emojis found' : 'No emojis in this category';
      grid.appendChild(noResults);
      return;
    }

    // Add emojis to grid
    emojisToShow.forEach(emoji => {
      const emojiElement = createEmojiElement(emoji);
      grid.appendChild(emojiElement);
    });
  }

  /**
   * Creates an emoji element for the grid
   *
   * @param {string} emoji - The emoji character
   * @returns {HTMLElement} The emoji element
   */
  function createEmojiElement(emoji) {
    const element = document.createElement('div');
    element.className = 'emoji-item';

    // Apply skin tone if applicable
    const displayEmoji = supportsSkinTone(emoji) && currentSkinTone
      ? applyEmojiSkinTone(emoji, currentSkinTone)
      : emoji;

    element.textContent = displayEmoji;

    // Add click handler
    element.addEventListener('click', () => {
      selectEmoji(emoji);
    });

    // Add right-click handler for favorites
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      toggleFavorite(emoji);

      // Update favorites grid if visible
      if (config.showFavorites) {
        const favoritesGrid = pickerElement.querySelector('.emoji-favorites-grid');
        if (favoritesGrid) {
          updateFavoritesGrid(favoritesGrid);
        }

        // Show/hide favorites section based on whether there are favorites
        const favoritesSection = pickerElement.querySelector('.emoji-favorites-section');
        if (favoritesSection) {
          favoritesSection.style.display = favoriteEmojis.length > 0 ? 'block' : 'none';
        }
      }
    });

    return element;
  }

  /**
   * Creates the skin tone selector
   *
   * @returns {HTMLElement} The skin tone selector element
   */
  function createSkinToneSelector() {
    const selector = document.createElement('div');
    selector.className = 'emoji-skin-tone-selector';

    // Default (no skin tone)
    const defaultOption = document.createElement('div');
    defaultOption.className = 'emoji-skin-tone-option emoji-skin-tone-default selected';
    defaultOption.title = 'Default';
    defaultOption.addEventListener('click', () => {
      selectSkinTone(null);

      // Update selected indicator
      selector.querySelectorAll('.emoji-skin-tone-option').forEach(el => {
        el.classList.remove('selected');
      });
      defaultOption.classList.add('selected');
    });
    selector.appendChild(defaultOption);

    // Skin tone options
    const skinToneClasses = [
      'emoji-skin-tone-light',
      'emoji-skin-tone-medium-light',
      'emoji-skin-tone-medium',
      'emoji-skin-tone-medium-dark',
      'emoji-skin-tone-dark'
    ];

    Object.values(SKIN_TONES).forEach((tone, index) => {
      const option = document.createElement('div');
      option.className = `emoji-skin-tone-option ${skinToneClasses[index]}`;
      option.title = Object.keys(SKIN_TONES)[index].replace('_', ' ').toLowerCase();
      option.addEventListener('click', () => {
        selectSkinTone(tone);

        // Update selected indicator
        selector.querySelectorAll('.emoji-skin-tone-option').forEach(el => {
          el.classList.remove('selected');
        });
        option.classList.add('selected');
      });
      selector.appendChild(option);
    });

    return selector;
  }

  /**
   * Handles emoji selection
   *
   * @param {string} emoji - The selected emoji
   */
  function selectEmoji(emoji) {
    // Apply skin tone if applicable
    const selectedEmoji = supportsSkinTone(emoji) && currentSkinTone
      ? applyEmojiSkinTone(emoji, currentSkinTone)
      : emoji;

    // Add to recent emojis
    addToRecents(emoji);

    // Call the selection callback
    options.onEmojiSelect(selectedEmoji);
  }

  /**
   * Sets the current skin tone
   *
   * @param {string|null} skinTone - The skin tone to set
   */
  function selectSkinTone(skinTone) {
    currentSkinTone = skinTone;
    updateEmojiGrid();

    // Also update recents and favorites if they're visible
    if (config.showRecents) {
      const recentsGrid = pickerElement.querySelector('.emoji-recents-grid');
      if (recentsGrid) updateRecentsGrid(recentsGrid);
    }

    if (config.showFavorites) {
      const favoritesGrid = pickerElement.querySelector('.emoji-favorites-grid');
      if (favoritesGrid) updateFavoritesGrid(favoritesGrid);
    }
  }

  /**
   * Adds an emoji to the recent emojis list
   *
   * @param {string} emoji - The emoji to add
   */
  function addToRecents(emoji) {
    // Remove if already in the list
    recentEmojis = recentEmojis.filter(e => e !== emoji);

    // Add to the beginning
    recentEmojis.unshift(emoji);

    // Limit to configured count
    if (recentEmojis.length > config.recentCount) {
      recentEmojis = recentEmojis.slice(0, config.recentCount);
    }

    // Save to localStorage
    saveToLocalStorage('emoji_picker_recents', recentEmojis);

    // Update recents grid if visible
    if (config.showRecents) {
      const recentsGrid = pickerElement.querySelector('.emoji-recents-grid');
      if (recentsGrid) {
        updateRecentsGrid(recentsGrid);
      }

      // Show recents section if it was hidden
      const recentsSection = pickerElement.querySelector('.emoji-recents-section');
      if (recentsSection) {
        recentsSection.style.display = 'block';
      }
    }
  }

  /**
   * Toggles an emoji in the favorites list
   *
   * @param {string} emoji - The emoji to toggle
   */
  function toggleFavorite(emoji) {
    if (favoriteEmojis.includes(emoji)) {
      removeFromFavorites(emoji);
    } else {
      addToFavorites(emoji);
    }
  }

  /**
   * Adds an emoji to the favorites list
   *
   * @param {string} emoji - The emoji to add
   */
  function addToFavorites(emoji) {
    // Don't add if already in the list
    if (favoriteEmojis.includes(emoji)) return;

    // Add to the list
    favoriteEmojis.push(emoji);

    // Limit to configured count
    if (favoriteEmojis.length > config.favoritesCount) {
      favoriteEmojis = favoriteEmojis.slice(0, config.favoritesCount);
    }

    // Save to localStorage
    saveToLocalStorage('emoji_picker_favorites', favoriteEmojis);
  }

  /**
   * Removes an emoji from the favorites list
   *
   * @param {string} emoji - The emoji to remove
   */
  function removeFromFavorites(emoji) {
    favoriteEmojis = favoriteEmojis.filter(e => e !== emoji);

    // Save to localStorage
    saveToLocalStorage('emoji_picker_favorites', favoriteEmojis);
  }

  /**
   * Shows the emoji picker
   */
  function show() {
    if (!pickerElement) {
      createPickerElement();
    }

    pickerElement.style.display = 'block';
    isVisible = true;
  }

  /**
   * Hides the emoji picker
   */
  function hide() {
    if (pickerElement) {
      pickerElement.style.display = 'none';
    }
    isVisible = false;
  }

  /**
   * Toggles the visibility of the emoji picker
   */
  function toggle() {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  }

  /**
   * Sets the current category
   *
   * @param {string} category - The category key to set
   */
  function setCategory(category) {
    if (EMOJI_CATEGORIES[category]) {
      currentCategory = category;

      // Update UI if picker is created
      if (pickerElement) {
        // Update active tab
        const tabs = pickerElement.querySelectorAll('.emoji-category-tab');
        tabs.forEach(tab => {
          if (tab.dataset.category === category) {
            tab.classList.add('active');
          } else {
            tab.classList.remove('active');
          }
        });

        // Update emoji grid
        updateEmojiGrid();
      }
    }
  }

  /**
   * Gets the current state of the emoji picker
   *
   * @returns {Object} The current state
   */
  function getState() {
    return {
      currentCategory,
      currentSkinTone,
      searchQuery,
      recentEmojis,
      favoriteEmojis,
      isVisible
    };
  }

  // Initialize the picker if container is available
  if (options.container) {
    createPickerElement();
  }

  // Return the public API
  return {
    show,
    hide,
    toggle,
    setCategory,
    selectSkinTone,
    getState
  };
};

/**
 * Creates a simple emoji button that opens an emoji picker when clicked
 *
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container element to append the button to
 * @param {Function} options.onEmojiSelect - Callback function when an emoji is selected
 * @param {string} options.buttonText - Text to display on the button (default: "😀 Emoji")
 * @param {Object} options.pickerOptions - Additional options for the emoji picker
 * @returns {Object} Controller object with button and picker references
 */
export const createEmojiButton = (options) => {
  // Validate required options
  if (!options.container || !(options.container instanceof HTMLElement)) {
    throw new Error('Invalid container element provided to createEmojiButton');
  }

  if (!options.onEmojiSelect || typeof options.onEmojiSelect !== 'function') {
    throw new Error('Invalid onEmojiSelect callback provided to createEmojiButton');
  }

  // Create button element
  const button = document.createElement('button');
  button.className = 'emoji-button';
  button.textContent = options.buttonText || '😀 Emoji';
  options.container.appendChild(button);

  // Create picker container
  const pickerContainer = document.createElement('div');
  pickerContainer.className = 'emoji-picker-container';
  options.container.appendChild(pickerContainer);

  // Create emoji picker
  const picker = createEmojiPicker({
    container: pickerContainer,
    onEmojiSelect: (emoji) => {
      options.onEmojiSelect(emoji);
      picker.hide();
    },
    ...options.pickerOptions
  });

  // Add button click handler
  button.addEventListener('click', () => {
    picker.toggle();
  });

  // Add click outside handler to close picker
  document.addEventListener('click', (e) => {
    if (picker.getState().isVisible &&
        !pickerContainer.contains(e.target) &&
        !button.contains(e.target)) {
      picker.hide();
    }
  });

  // Add some basic styles
  const styleId = 'emoji-button-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .emoji-button {
        padding: 8px 12px;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }

      .emoji-button:hover {
        background-color: #e0e0e0;
      }

      .emoji-picker-container {
        position: relative;
        z-index: 1000;
      }

      .emoji-picker-container .emoji-picker {
        position: absolute;
        top: 10px;
        left: 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Return controller object
  return {
    button,
    picker
  };
};
