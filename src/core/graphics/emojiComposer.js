/**
 * emojiComposer.js
 *
 * A module for creating and managing emoji compositions through layering and customization.
 * This module follows the functional programming paradigm and integrates with the existing
 * emoji rendering system.
 */

/**
 * Creates a layer object for an emoji composition
 *
 * @param {string} emoji - The emoji character for this layer
 * @param {Object} options - Layer options
 * @param {number} options.x - X offset from center (default: 0)
 * @param {number} options.y - Y offset from center (default: 0)
 * @param {number} options.scale - Scale factor (default: 1.0)
 * @param {number} options.rotation - Rotation in radians (default: 0)
 * @param {number} options.opacity - Opacity from 0.0 to 1.0 (default: 1.0)
 * @param {number} options.zIndex - Layer stacking order (default: 0)
 * @returns {Object} Layer object
 */
export const createCompositionLayer = (emoji, options = {}) => ({
  emoji,
  x: options.x !== undefined ? options.x : 0,
  y: options.y !== undefined ? options.y : 0,
  scale: options.scale !== undefined ? options.scale : 1.0,
  rotation: options.rotation !== undefined ? options.rotation : 0,
  opacity: options.opacity !== undefined ? options.opacity : 1.0,
  zIndex: options.zIndex !== undefined ? options.zIndex : 0
});

/**
 * Creates an emoji composition from multiple layers
 *
 * @param {Array<Object>} layers - Array of layer objects
 * @param {Object} options - Composition options
 * @param {string} options.name - Name of the composition
 * @param {string} options.description - Description of the composition
 * @param {number} options.baseSize - Base size for the composition in pixels
 * @returns {Object} Emoji composition object
 */
export const createEmojiComposition = (layers = [], options = {}) => ({
  layers: [...layers].sort((a, b) => a.zIndex - b.zIndex), // Sort by zIndex
  name: options.name || `composition_${Date.now()}`,
  description: options.description || '',
  baseSize: options.baseSize || 64,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * Creates an emoji composer that can create, edit, and render emoji compositions
 *
 * @param {Object} emojiRenderer - An instance of emojiRenderer
 * @returns {Object} An object with methods for composition management
 */
export const createEmojiComposer = (emojiRenderer) => {
  // Validate input
  if (!emojiRenderer || !emojiRenderer.renderEmoji) {
    throw new Error('Invalid emojiRenderer provided to createEmojiComposer');
  }

  // Store compositions
  const compositions = new Map();

  /**
   * Renders a composition to a canvas
   *
   * @param {Object} composition - The emoji composition to render
   * @param {number} x - X coordinate on canvas (center of composition)
   * @param {number} y - Y coordinate on canvas (center of composition)
   * @param {number} size - Size multiplier (1.0 = original size)
   * @param {Object} options - Additional rendering options
   * @returns {void}
   */
  const renderComposition = (composition, x, y, size = 1.0, options = {}) => {
    const ctx = emojiRenderer.getContext();
    const effectiveSize = composition.baseSize * size;

    // Save the current context state
    ctx.save();

    // Apply global composition transformations
    ctx.translate(x, y);

    // Render each layer
    composition.layers.forEach(layer => {
      // Save state for this layer
      ctx.save();

      // Apply layer transformations
      ctx.translate(layer.x * size, layer.y * size);

      if (layer.rotation !== 0) {
        ctx.rotate(layer.rotation);
      }

      if (layer.opacity !== 1.0) {
        ctx.globalAlpha = layer.opacity;
      }

      // Render the emoji
      const layerSize = effectiveSize * layer.scale;
      emojiRenderer.renderEmoji(layer.emoji, 0, 0, layerSize, options);

      // Restore state after this layer
      ctx.restore();
    });

    // Restore the original context state
    ctx.restore();
  };

  /**
   * Creates a new composition and stores it
   *
   * @param {string} id - Unique identifier for the composition
   * @param {Array<Object>} layers - Array of layer objects
   * @param {Object} options - Composition options
   * @returns {Object} The created composition
   */
  const createComposition = (id, layers = [], options = {}) => {
    const compositionId = id || `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const composition = createEmojiComposition(layers, options);
    compositions.set(compositionId, composition);
    return composition;
  };

  /**
   * Retrieves a stored composition by ID
   *
   * @param {string} id - The composition ID
   * @returns {Object|null} The composition or null if not found
   */
  const getComposition = (id) => {
    return compositions.has(id) ? compositions.get(id) : null;
  };

  /**
   * Updates an existing composition
   *
   * @param {string} id - The composition ID
   * @param {Object} updates - The properties to update
   * @returns {Object|null} The updated composition or null if not found
   */
  const updateComposition = (id, updates = {}) => {
    if (!compositions.has(id)) {
      return null;
    }

    const composition = compositions.get(id);
    const updated = {
      ...composition,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // If layers are provided, sort them by zIndex
    if (updates.layers) {
      updated.layers = [...updates.layers].sort((a, b) => a.zIndex - b.zIndex);
    }

    compositions.set(id, updated);
    return updated;
  };

  /**
   * Deletes a composition
   *
   * @param {string} id - The composition ID
   * @returns {boolean} True if the composition was found and deleted
   */
  const deleteComposition = (id) => {
    return compositions.delete(id);
  };

  /**
   * Adds a layer to an existing composition
   *
   * @param {string} compositionId - The composition ID
   * @param {Object} layer - The layer to add
   * @returns {Object|null} The updated composition or null if not found
   */
  const addLayer = (compositionId, layer) => {
    if (!compositions.has(compositionId)) {
      return null;
    }

    const composition = compositions.get(compositionId);
    const updatedLayers = [...composition.layers, layer].sort((a, b) => a.zIndex - b.zIndex);

    return updateComposition(compositionId, { layers: updatedLayers });
  };

  /**
   * Updates a layer in an existing composition
   *
   * @param {string} compositionId - The composition ID
   * @param {number} layerIndex - The index of the layer to update
   * @param {Object} updates - The properties to update
   * @returns {Object|null} The updated composition or null if not found
   */
  const updateLayer = (compositionId, layerIndex, updates) => {
    if (!compositions.has(compositionId)) {
      return null;
    }

    const composition = compositions.get(compositionId);

    if (layerIndex < 0 || layerIndex >= composition.layers.length) {
      return null;
    }

    const updatedLayers = [...composition.layers];
    updatedLayers[layerIndex] = {
      ...updatedLayers[layerIndex],
      ...updates
    };

    return updateComposition(compositionId, {
      layers: updatedLayers.sort((a, b) => a.zIndex - b.zIndex)
    });
  };

  /**
   * Removes a layer from an existing composition
   *
   * @param {string} compositionId - The composition ID
   * @param {number} layerIndex - The index of the layer to remove
   * @returns {Object|null} The updated composition or null if not found
   */
  const removeLayer = (compositionId, layerIndex) => {
    if (!compositions.has(compositionId)) {
      return null;
    }

    const composition = compositions.get(compositionId);

    if (layerIndex < 0 || layerIndex >= composition.layers.length) {
      return null;
    }

    const updatedLayers = composition.layers.filter((_, index) => index !== layerIndex);
    return updateComposition(compositionId, { layers: updatedLayers });
  };

  /**
   * Exports a composition to a serializable JSON object
   *
   * @param {string} compositionId - The composition ID
   * @returns {Object|null} The exported composition or null if not found
   */
  const exportComposition = (compositionId) => {
    if (!compositions.has(compositionId)) {
      return null;
    }

    return JSON.parse(JSON.stringify(compositions.get(compositionId)));
  };

  /**
   * Imports a composition from a JSON object
   *
   * @param {string} id - The ID to assign to the imported composition
   * @param {Object} data - The composition data to import
   * @returns {Object} The imported composition
   */
  const importComposition = (id, data) => {
    const compositionId = id || `imported_${Date.now()}`;

    // Validate the imported data
    if (!data || !Array.isArray(data.layers)) {
      throw new Error('Invalid composition data');
    }

    // Create a new composition from the imported data
    const composition = {
      layers: data.layers.map(layer => ({
        emoji: layer.emoji || '❓',
        x: layer.x !== undefined ? layer.x : 0,
        y: layer.y !== undefined ? layer.y : 0,
        scale: layer.scale !== undefined ? layer.scale : 1.0,
        rotation: layer.rotation !== undefined ? layer.rotation : 0,
        opacity: layer.opacity !== undefined ? layer.opacity : 1.0,
        zIndex: layer.zIndex !== undefined ? layer.zIndex : 0
      })).sort((a, b) => a.zIndex - b.zIndex),
      name: data.name || `imported_${Date.now()}`,
      description: data.description || '',
      baseSize: data.baseSize || 64,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    compositions.set(compositionId, composition);
    return composition;
  };

  /**
   * Renders a composition to an offscreen canvas and returns it
   *
   * @param {Object|string} compositionOrId - The composition object or ID
   * @param {number} size - Size of the output canvas
   * @returns {HTMLCanvasElement} The rendered composition canvas
   */
  const renderToCanvas = (compositionOrId, size = 128) => {
    // Get the composition
    const composition = typeof compositionOrId === 'string'
      ? getComposition(compositionOrId)
      : compositionOrId;

    if (!composition) {
      throw new Error('Invalid composition');
    }

    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Create a temporary renderer for this canvas
    const tempRenderer = createEmojiRenderer(ctx);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render each layer
    composition.layers.forEach(layer => {
      // Save state for this layer
      ctx.save();

      // Apply layer transformations
      ctx.translate(size / 2 + layer.x, size / 2 + layer.y);

      if (layer.rotation !== 0) {
        ctx.rotate(layer.rotation);
      }

      if (layer.opacity !== 1.0) {
        ctx.globalAlpha = layer.opacity;
      }

      // Calculate the size based on the composition's base size and the layer's scale
      const layerSize = (composition.baseSize / 64) * size * layer.scale;

      // Render the emoji
      tempRenderer.renderEmoji(layer.emoji, 0, 0, layerSize);

      // Restore state after this layer
      ctx.restore();
    });

    return canvas;
  };

  /**
   * Converts a composition to a data URL
   *
   * @param {Object|string} compositionOrId - The composition object or ID
   * @param {number} size - Size of the output image
   * @param {string} type - Image MIME type (default: 'image/png')
   * @param {number} quality - Image quality for JPEG (0-1)
   * @returns {string} Data URL of the composition
   */
  const toDataURL = (compositionOrId, size = 128, type = 'image/png', quality = 0.92) => {
    const canvas = renderToCanvas(compositionOrId, size);
    return canvas.toDataURL(type, quality);
  };

  /**
   * Lists all stored compositions
   *
   * @returns {Array<Object>} Array of compositions with their IDs
   */
  const listCompositions = () => {
    return Array.from(compositions.entries()).map(([id, composition]) => ({
      id,
      ...composition
    }));
  };

  /**
   * Creates a preview function that renders a composition with interactive controls
   *
   * @param {HTMLElement} container - Container element for the preview
   * @param {string} compositionId - ID of the composition to preview
   * @returns {Object} Preview controller
   */
  const createPreview = (container, compositionId) => {
    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('Invalid container element');
    }

    if (!compositions.has(compositionId)) {
      throw new Error(`Composition with ID ${compositionId} not found`);
    }

    // Create preview elements
    const previewContainer = document.createElement('div');
    previewContainer.className = 'emoji-composition-preview';
    container.appendChild(previewContainer);

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.style.border = '1px solid #ccc';
    canvas.style.backgroundColor = '#f9f9f9';
    previewContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const previewRenderer = createEmojiRenderer(ctx);

    // Create controls
    const controls = document.createElement('div');
    controls.className = 'emoji-composition-controls';
    controls.style.marginTop = '10px';
    previewContainer.appendChild(controls);

    // Size control
    const sizeControl = document.createElement('div');
    sizeControl.style.marginBottom = '10px';

    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Size: ';
    sizeControl.appendChild(sizeLabel);

    const sizeSlider = document.createElement('input');
    sizeSlider.type = 'range';
    sizeSlider.min = '0.5';
    sizeSlider.max = '2';
    sizeSlider.step = '0.1';
    sizeSlider.value = '1';
    sizeControl.appendChild(sizeSlider);

    controls.appendChild(sizeControl);

    // Render the composition
    const render = () => {
      const composition = compositions.get(compositionId);
      const size = parseFloat(sizeSlider.value);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render composition
      renderComposition(composition, canvas.width / 2, canvas.height / 2, size);
    };

    // Add event listeners
    sizeSlider.addEventListener('input', render);

    // Initial render
    render();

    // Return controller
    return {
      render,
      updateComposition: (updates) => {
        updateComposition(compositionId, updates);
        render();
      },
      destroy: () => {
        container.removeChild(previewContainer);
      }
    };
  };

  // Return the public API
  return {
    renderComposition,
    createComposition,
    getComposition,
    updateComposition,
    deleteComposition,
    addLayer,
    updateLayer,
    removeLayer,
    exportComposition,
    importComposition,
    renderToCanvas,
    toDataURL,
    listCompositions,
    createPreview
  };
};

/**
 * Creates a UI for composing and customizing emojis
 *
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.container - Container element for the UI
 * @param {Object} options.emojiRenderer - An instance of emojiRenderer
 * @param {Function} options.onSave - Callback when a composition is saved
 * @param {Object} options.initialComposition - Optional initial composition to edit
 * @returns {Object} Composer UI controller
 */
export const createEmojiComposerUI = (options) => {
  // Validate required options
  if (!options.container || !(options.container instanceof HTMLElement)) {
    throw new Error('Invalid container element provided to createEmojiComposerUI');
  }

  if (!options.emojiRenderer || !options.emojiRenderer.renderEmoji) {
    throw new Error('Invalid emojiRenderer provided to createEmojiComposerUI');
  }

  // Create composer instance
  const composer = createEmojiComposer(options.emojiRenderer);

  // State variables
  let currentCompositionId = null;
  let selectedLayerIndex = -1;
  let composerElement = null;

  // Create the composer UI
  const createComposerElement = () => {
    // Create main container
    composerElement = document.createElement('div');
    composerElement.className = 'emoji-composer-ui';

    // Add styles
    addComposerStyles();

    // Create composition canvas
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'emoji-composer-canvas-container';

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    canvas.className = 'emoji-composer-canvas';
    canvasContainer.appendChild(canvas);

    composerElement.appendChild(canvasContainer);

    // Create layers panel
    const layersPanel = document.createElement('div');
    layersPanel.className = 'emoji-composer-layers-panel';

    const layersTitle = document.createElement('h3');
    layersTitle.textContent = 'Layers';
    layersPanel.appendChild(layersTitle);

    const layersList = document.createElement('div');
    layersList.className = 'emoji-composer-layers-list';
    layersPanel.appendChild(layersList);

    const addLayerBtn = document.createElement('button');
    addLayerBtn.textContent = 'Add Layer';
    addLayerBtn.className = 'emoji-composer-add-layer-btn';
    addLayerBtn.addEventListener('click', () => {
      // Create a new layer with default emoji
      const newLayer = createCompositionLayer('😀');

      // Add to current composition
      if (currentCompositionId) {
        const updatedComposition = composer.addLayer(currentCompositionId, newLayer);
        if (updatedComposition) {
          // Select the new layer
          selectedLayerIndex = updatedComposition.layers.length - 1;
          updateUI();
        }
      } else {
        // Create a new composition with this layer
        const composition = composer.createComposition(
          null,
          [newLayer],
          { name: 'New Composition' }
        );
        currentCompositionId = Array.from(composer.listCompositions())[0].id;
        selectedLayerIndex = 0;
        updateUI();
      }
    });
    layersPanel.appendChild(addLayerBtn);

    composerElement.appendChild(layersPanel);

    // Create properties panel
    const propertiesPanel = document.createElement('div');
    propertiesPanel.className = 'emoji-composer-properties-panel';

    const propertiesTitle = document.createElement('h3');
    propertiesTitle.textContent = 'Properties';
    propertiesPanel.appendChild(propertiesTitle);

    const propertiesForm = document.createElement('div');
    propertiesForm.className = 'emoji-composer-properties-form';
    propertiesPanel.appendChild(propertiesForm);

    composerElement.appendChild(propertiesPanel);

    // Create action buttons
    const actionsPanel = document.createElement('div');
    actionsPanel.className = 'emoji-composer-actions-panel';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'emoji-composer-save-btn';
    saveBtn.addEventListener('click', () => {
      if (currentCompositionId && typeof options.onSave === 'function') {
        const composition = composer.getComposition(currentCompositionId);
        options.onSave(currentCompositionId, composition);
      }
    });
    actionsPanel.appendChild(saveBtn);

    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export';
    exportBtn.className = 'emoji-composer-export-btn';
    exportBtn.addEventListener('click', () => {
      if (currentCompositionId) {
        const exported = composer.exportComposition(currentCompositionId);
        if (exported) {
          // Create a download link for the JSON
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exported));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", `${exported.name || 'composition'}.json`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
        }
      }
    });
    actionsPanel.appendChild(exportBtn);

    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import';
    importBtn.className = 'emoji-composer-import-btn';
    importBtn.addEventListener('click', () => {
      // Create a file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/json';
      fileInput.style.display = 'none';

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              const imported = composer.importComposition(null, data);
              currentCompositionId = Array.from(composer.listCompositions()).pop().id;
              selectedLayerIndex = imported.layers.length > 0 ? 0 : -1;
              updateUI();
            } catch (error) {
              console.error('Error importing composition:', error);
              alert('Invalid composition file');
            }
          };
          reader.readAsText(file);
        }
        fileInput.remove();
      });

      document.body.appendChild(fileInput);
      fileInput.click();
    });
    actionsPanel.appendChild(importBtn);

    const imageExportBtn = document.createElement('button');
    imageExportBtn.textContent = 'Export Image';
    imageExportBtn.className = 'emoji-composer-image-export-btn';
    imageExportBtn.addEventListener('click', () => {
      if (currentCompositionId) {
        const dataURL = composer.toDataURL(currentCompositionId, 256);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataURL);
        downloadAnchorNode.setAttribute("download", `${composer.getComposition(currentCompositionId).name || 'composition'}.png`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    });
    actionsPanel.appendChild(imageExportBtn);

    composerElement.appendChild(actionsPanel);

    // Add to container
    options.container.appendChild(composerElement);

    // Initialize with existing composition if provided
    if (options.initialComposition) {
      const composition = composer.importComposition(null, options.initialComposition);
      currentCompositionId = Array.from(composer.listCompositions())[0].id;
      selectedLayerIndex = composition.layers.length > 0 ? 0 : -1;
    }

    // Initial UI update
    updateUI();

    return {
      canvas,
      layersList,
      propertiesForm
    };
  };

  /**
   * Adds CSS styles for the emoji composer
   */
  const addComposerStyles = () => {
    const styleId = 'emoji-composer-styles';

    // Check if styles already exist
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .emoji-composer-ui {
          display: grid;
          grid-template-columns: 1fr 250px;
          grid-template-rows: auto 1fr auto;
          grid-template-areas:
            "canvas layers"
            "canvas properties"
            "canvas actions";
          gap: 15px;
          max-width: 800px;
          margin: 0 auto;
          padding: 15px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 5px;
        }

        .emoji-composer-canvas-container {
          grid-area: canvas;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
        }

        .emoji-composer-canvas {
          background-color: #f0f0f0;
          border: 1px solid #ccc;
        }

        .emoji-composer-layers-panel {
          grid-area: layers;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
        }

        .emoji-composer-layers-list {
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 10px;
        }

        .emoji-composer-layer-item {
          display: flex;
          align-items: center;
          padding: 8px;
          margin-bottom: 5px;
          border: 1px solid #eee;
          border-radius: 4px;
          cursor: pointer;
        }

        .emoji-composer-layer-item.selected {
          background-color: #e6f7ff;
          border-color: #91d5ff;
        }

        .emoji-composer-layer-emoji {
          font-size: 24px;
          margin-right: 10px;
        }

        .emoji-composer-layer-info {
          flex: 1;
        }

        .emoji-composer-layer-controls {
          display: flex;
          gap: 5px;
        }

        .emoji-composer-layer-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 2px 5px;
          color: #666;
        }

        .emoji-composer-layer-btn:hover {
          color: #000;
        }

        .emoji-composer-properties-panel {
          grid-area: properties;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
        }

        .emoji-composer-properties-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .emoji-composer-property-row {
          display: flex;
          align-items: center;
        }

        .emoji-composer-property-label {
          width: 80px;
          font-size: 14px;
          color: #666;
        }

        .emoji-composer-property-input {
          flex: 1;
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .emoji-composer-actions-panel {
          grid-area: actions;
          display: flex;
          gap: 10px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
        }

        .emoji-composer-actions-panel button {
          padding: 8px 12px;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }

        .emoji-composer-actions-panel button:hover {
          background-color: #e0e0e0;
        }

        .emoji-composer-save-btn {
          background-color: #1890ff !important;
          color: white;
        }

        .emoji-composer-save-btn:hover {
          background-color: #096dd9 !important;
        }

        .emoji-composer-add-layer-btn {
          width: 100%;
          padding: 8px;
          background-color: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }

        .emoji-composer-add-layer-btn:hover {
          background-color: #e0e0e0;
        }

        .emoji-composer-emoji-selector {
          width: 100%;
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }
      `;
      document.head.appendChild(style);
    }
  };

  /**
   * Updates the UI to reflect the current state
   */
  const updateUI = () => {
    if (!composerElement) {
      return;
    }

    const canvas = composerElement.querySelector('.emoji-composer-canvas');
    const ctx = canvas.getContext('2d');
    const layersList = composerElement.querySelector('.emoji-composer-layers-list');
    const propertiesForm = composerElement.querySelector('.emoji-composer-properties-form');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get current composition
    const composition = currentCompositionId ? composer.getComposition(currentCompositionId) : null;

    // If no composition, show empty state
    if (!composition) {
      layersList.innerHTML = '<div class="emoji-composer-empty-state">No composition selected</div>';
      propertiesForm.innerHTML = '';
      return;
    }

    // Render the composition
    const renderer = createEmojiRenderer(ctx);
    composer.renderComposition(composition, canvas.width / 2, canvas.height / 2, 1.0);

    // Update layers list
    layersList.innerHTML = '';
    composition.layers.forEach((layer, index) => {
      const layerItem = document.createElement('div');
      layerItem.className = `emoji-composer-layer-item ${index === selectedLayerIndex ? 'selected' : ''}`;
      layerItem.innerHTML = `
        <div class="emoji-composer-layer-emoji">${layer.emoji}</div>
        <div class="emoji-composer-layer-info">Layer ${index + 1}</div>
        <div class="emoji-composer-layer-controls">
          <button class="emoji-composer-layer-btn emoji-composer-layer-up-btn" title="Move Up">↑</button>
          <button class="emoji-composer-layer-btn emoji-composer-layer-down-btn" title="Move Down">↓</button>
          <button class="emoji-composer-layer-btn emoji-composer-layer-delete-btn" title="Delete">×</button>
        </div>
      `;

      // Add click handler to select layer
      layerItem.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          selectedLayerIndex = index;
          updateUI();
        }
      });

      // Add button handlers
      const upBtn = layerItem.querySelector('.emoji-composer-layer-up-btn');
      const downBtn = layerItem.querySelector('.emoji-composer-layer-down-btn');
      const deleteBtn = layerItem.querySelector('.emoji-composer-layer-delete-btn');

      upBtn.addEventListener('click', () => {
        if (index > 0) {
          // Increase z-index to move up
          const updatedLayer = { ...layer, zIndex: layer.zIndex + 1 };
          composer.updateLayer(currentCompositionId, index, updatedLayer);
          selectedLayerIndex = index;
          updateUI();
        }
      });

      downBtn.addEventListener('click', () => {
        if (index < composition.layers.length - 1) {
          // Decrease z-index to move down
          const updatedLayer = { ...layer, zIndex: layer.zIndex - 1 };
          composer.updateLayer(currentCompositionId, index, updatedLayer);
          selectedLayerIndex = index;
          updateUI();
        }
      });

      deleteBtn.addEventListener('click', () => {
        composer.removeLayer(currentCompositionId, index);
        if (selectedLayerIndex === index) {
          selectedLayerIndex = Math.min(index, composition.layers.length - 2);
        }
        updateUI();
      });

      layersList.appendChild(layerItem);
    });

    // Update properties form
    propertiesForm.innerHTML = '';

    // If a layer is selected, show its properties
    if (selectedLayerIndex >= 0 && selectedLayerIndex < composition.layers.length) {
      const layer = composition.layers[selectedLayerIndex];

      // Emoji selector
      const emojiRow = document.createElement('div');
      emojiRow.className = 'emoji-composer-property-row';
      emojiRow.innerHTML = `
        <div class="emoji-composer-property-label">Emoji</div>
        <div class="emoji-composer-property-value">
          <input type="text" class="emoji-composer-property-input emoji-composer-emoji-selector" value="${layer.emoji}">
        </div>
      `;
      propertiesForm.appendChild(emojiRow);

      // X position
      const xRow = document.createElement('div');
      xRow.className = 'emoji-composer-property-row';
      xRow.innerHTML = `
        <div class="emoji-composer-property-label">X Offset</div>
        <div class="emoji-composer-property-value">
          <input type="range" class="emoji-composer-property-input" min="-50" max="50" value="${layer.x}">
          <span>${layer.x}px</span>
        </div>
      `;
      propertiesForm.appendChild(xRow);

      // Y position
      const yRow = document.createElement('div');
      yRow.className = 'emoji-composer-property-row';
      yRow.innerHTML = `
        <div class="emoji-composer-property-label">Y Offset</div>
        <div class="emoji-composer-property-value">
          <input type="range" class="emoji-composer-property-input" min="-50" max="50" value="${layer.y}">
          <span>${layer.y}px</span>
        </div>
      `;
      propertiesForm.appendChild(yRow);

      // Scale
      const scaleRow = document.createElement('div');
      scaleRow.className = 'emoji-composer-property-row';
      scaleRow.innerHTML = `
        <div class="emoji-composer-property-label">Scale</div>
        <div class="emoji-composer-property-value">
          <input type="range" class="emoji-composer-property-input" min="0.5" max="2" step="0.1" value="${layer.scale}">
          <span>${layer.scale.toFixed(1)}x</span>
        </div>
      `;
      propertiesForm.appendChild(scaleRow);

      // Rotation
      const rotationRow = document.createElement('div');
      rotationRow.className = 'emoji-composer-property-row';
      rotationRow.innerHTML = `
        <div class="emoji-composer-property-label">Rotation</div>
        <div class="emoji-composer-property-value">
          <input type="range" class="emoji-composer-property-input" min="0" max="${Math.PI * 2}" step="0.1" value="${layer.rotation}">
          <span>${Math.round(layer.rotation * 180 / Math.PI)}°</span>
        </div>
      `;
      propertiesForm.appendChild(rotationRow);

      // Opacity
      const opacityRow = document.createElement('div');
      opacityRow.className = 'emoji-composer-property-row';
      opacityRow.innerHTML = `
        <div class="emoji-composer-property-label">Opacity</div>
        <div class="emoji-composer-property-value">
          <input type="range" class="emoji-composer-property-input" min="0" max="1" step="0.1" value="${layer.opacity}">
          <span>${Math.round(layer.opacity * 100)}%</span>
        </div>
      `;
      propertiesForm.appendChild(opacityRow);

      // Add event listeners to update the layer properties
      const inputs = propertiesForm.querySelectorAll('input');
      inputs.forEach(input => {
        input.addEventListener('input', (e) => {
          const property = e.target.closest('.emoji-composer-property-row').querySelector('.emoji-composer-property-label').textContent.toLowerCase().split(' ')[0];
          let value = e.target.value;

          // Convert to appropriate type
          if (property === 'emoji') {
            // No conversion needed for emoji
          } else if (['x', 'y', 'rotation', 'scale', 'opacity'].includes(property)) {
            value = parseFloat(value);
          }

          // Update the display value
          if (property !== 'emoji') {
            const span = e.target.nextElementSibling;
            if (property === 'rotation') {
              span.textContent = `${Math.round(value * 180 / Math.PI)}°`;
            } else if (property === 'opacity') {
              span.textContent = `${Math.round(value * 100)}%`;
            } else if (property === 'scale') {
              span.textContent = `${parseFloat(value).toFixed(1)}x`;
            } else {
              span.textContent = `${value}px`;
            }
          }

          // Update the layer
          const updates = { [property]: value };
          composer.updateLayer(currentCompositionId, selectedLayerIndex, updates);

          // Re-render the composition
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          composer.renderComposition(composition, canvas.width / 2, canvas.height / 2, 1.0);
        });
      });

      // Add emoji picker integration for the emoji selector
      const emojiSelector = propertiesForm.querySelector('.emoji-composer-emoji-selector');
      if (emojiSelector && typeof createEmojiPicker === 'function') {
        emojiSelector.addEventListener('click', () => {
          // Create a temporary container for the picker
          const pickerContainer = document.createElement('div');
          pickerContainer.style.position = 'absolute';
          pickerContainer.style.zIndex = '1000';

          // Position near the emoji selector
          const rect = emojiSelector.getBoundingClientRect();
          pickerContainer.style.top = `${rect.bottom + 5}px`;
          pickerContainer.style.left = `${rect.left}px`;

          document.body.appendChild(pickerContainer);

          // Create the picker
          const picker = createEmojiPicker({
            container: pickerContainer,
            onEmojiSelect: (emoji) => {
              // Update the emoji selector value
              emojiSelector.value = emoji;

              // Update the layer
              composer.updateLayer(currentCompositionId, selectedLayerIndex, { emoji });

              // Re-render and update UI
              updateUI();

              // Remove the picker
              document.body.removeChild(pickerContainer);
            }
          });

          // Show the picker
          picker.show();

          // Add click outside handler to close picker
          const handleClickOutside = (e) => {
            if (!pickerContainer.contains(e.target) && e.target !== emojiSelector) {
              document.body.removeChild(pickerContainer);
              document.removeEventListener('click', handleClickOutside);
            }
          };

          // Delay adding the event listener to prevent immediate closing
          setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
          }, 100);
        });
      }
    } else {
      // Show composition properties if no layer is selected
      const nameRow = document.createElement('div');
      nameRow.className = 'emoji-composer-property-row';
      nameRow.innerHTML = `
        <div class="emoji-composer-property-label">Name</div>
        <div class="emoji-composer-property-value">
          <input type="text" class="emoji-composer-property-input" value="${composition.name}">
        </div>
      `;
      propertiesForm.appendChild(nameRow);

      const descriptionRow = document.createElement('div');
      descriptionRow.className = 'emoji-composer-property-row';
      descriptionRow.innerHTML = `
        <div class="emoji-composer-property-label">Description</div>
        <div class="emoji-composer-property-value">
          <input type="text" class="emoji-composer-property-input" value="${composition.description}">
        </div>
      `;
      propertiesForm.appendChild(descriptionRow);

      const baseSizeRow = document.createElement('div');
      baseSizeRow.className = 'emoji-composer-property-row';
      baseSizeRow.innerHTML = `
        <div class="emoji-composer-property-label">Base Size</div>
        <div class="emoji-composer-property-value">
          <input type="number" class="emoji-composer-property-input" min="16" max="128" value="${composition.baseSize}">
        </div>
      `;
      propertiesForm.appendChild(baseSizeRow);

      // Add event listeners to update the composition properties
      const inputs = propertiesForm.querySelectorAll('input');
      inputs.forEach(input => {
        input.addEventListener('input', (e) => {
          const property = e.target.closest('.emoji-composer-property-row').querySelector('.emoji-composer-property-label').textContent.toLowerCase();
          let value = e.target.value;

          // Convert to appropriate type
          if (property === 'base size') {
            value = parseInt(value, 10);
          }

          // Update the composition
          const updates = { [property === 'base size' ? 'baseSize' : property]: value };
          composer.updateComposition(currentCompositionId, updates);

          // Re-render the composition
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          composer.renderComposition(composition, canvas.width / 2, canvas.height / 2, 1.0);
        });
      });
    }
  };

  // Initialize the UI
  const ui = createComposerElement();

  // Return the public API
  return {
    getComposer: () => composer,
    getCurrentCompositionId: () => currentCompositionId,
    setComposition: (compositionId) => {
      if (composer.getComposition(compositionId)) {
        currentCompositionId = compositionId;
        selectedLayerIndex = -1;
        updateUI();
        return true;
      }
      return false;
    },
    createNewComposition: (name = 'New Composition') => {
      const composition = composer.createComposition(null, [], { name });
      currentCompositionId = Array.from(composer.listCompositions())[0].id;
      selectedLayerIndex = -1;
      updateUI();
      return currentCompositionId;
    },
    updateUI,
    destroy: () => {
      if (composerElement && options.container.contains(composerElement)) {
        options.container.removeChild(composerElement);
      }
    }
  };
};
