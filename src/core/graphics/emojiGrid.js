/**
 * emojiGrid.js
 *
 * A module for creating and managing 2D grid-based maps using emojis.
 * This module follows the functional programming paradigm and avoids external dependencies.
 */

/**
 * Enum for grid layer types
 * @readonly
 * @enum {string}
 */
export const GRID_LAYER_TYPE = {
  BACKGROUND: 'background',
  COLLISION: 'collision',
  EVENT: 'event',
  SPRITE: 'sprite',
  GUI: 'gui'
};

/**
 * Creates a grid layer with the specified dimensions
 *
 * @param {number} width - Width of the grid in cells
 * @param {number} height - Height of the grid in cells
 * @param {string} type - Type of layer (from GRID_LAYER_TYPE)
 * @param {string} defaultEmoji - Default emoji to fill the grid with (empty string for no default)
 * @returns {Object} A grid layer object
 */
export const createGridLayer = (width, height, type, defaultEmoji = '') => {
  // Validate input
  if (width <= 0 || height <= 0) {
    throw new Error('Grid dimensions must be positive numbers');
  }

  if (!Object.values(GRID_LAYER_TYPE).includes(type)) {
    throw new Error(`Invalid layer type: ${type}`);
  }

  // Create the grid data structure as a 2D array
  const cells = Array(height).fill().map(() =>
    Array(width).fill().map(() => defaultEmoji)
  );

  // Layer properties
  const properties = {
    visible: true,
    opacity: 1.0,
    name: type
  };

  // Return the layer object
  return {
    type,
    width,
    height,
    cells,
    properties,

    /**
     * Gets the emoji at the specified cell
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string} The emoji at the specified cell, or empty string if out of bounds
     */
    getCell: (x, y) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        return cells[y][x];
      }
      return '';
    },

    /**
     * Sets the emoji at the specified cell
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {string} emoji - Emoji to set
     * @returns {boolean} True if the cell was set, false if out of bounds
     */
    setCell: (x, y, emoji) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        cells[y][x] = emoji;
        return true;
      }
      return false;
    },

    /**
     * Fills a rectangular area with the specified emoji
     *
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     * @param {number} endX - Ending X coordinate
     * @param {number} endY - Ending Y coordinate
     * @param {string} emoji - Emoji to fill with
     * @returns {void}
     */
    fillRect: (startX, startY, endX, endY, emoji) => {
      const minX = Math.max(0, Math.min(startX, endX));
      const maxX = Math.min(width - 1, Math.max(startX, endX));
      const minY = Math.max(0, Math.min(startY, endY));
      const maxY = Math.min(height - 1, Math.max(startY, endY));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          cells[y][x] = emoji;
        }
      }
    },

    /**
     * Clears the entire layer (sets all cells to empty string)
     *
     * @returns {void}
     */
    clear: () => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          cells[y][x] = '';
        }
      }
    },

    /**
     * Sets a property value
     *
     * @param {string} key - Property name
     * @param {any} value - Property value
     * @returns {void}
     */
    setProperty: (key, value) => {
      properties[key] = value;
    },

    /**
     * Gets a property value
     *
     * @param {string} key - Property name
     * @returns {any} Property value
     */
    getProperty: (key) => {
      return properties[key];
    },

    /**
     * Resizes the layer
     *
     * @param {number} newWidth - New width
     * @param {number} newHeight - New height
     * @returns {void}
     */
    resize: (newWidth, newHeight) => {
      if (newWidth <= 0 || newHeight <= 0) {
        throw new Error('Grid dimensions must be positive numbers');
      }

      // Create new cells array with the new dimensions
      const newCells = Array(newHeight).fill().map(() =>
        Array(newWidth).fill('')
      );

      // Copy existing cells to the new array
      const copyWidth = Math.min(width, newWidth);
      const copyHeight = Math.min(height, newHeight);

      for (let y = 0; y < copyHeight; y++) {
        for (let x = 0; x < copyWidth; x++) {
          newCells[y][x] = cells[y][x];
        }
      }

      // Update the layer
      cells.length = 0;
      Array.prototype.push.apply(cells, newCells);
      width = newWidth;
      height = newHeight;
    }
  };
};

/**
 * Creates a grid map with multiple layers
 *
 * @param {number} width - Width of the grid in cells
 * @param {number} height - Height of the grid in cells
 * @param {number} cellSize - Size of each cell in pixels
 * @param {Object} options - Additional options
 * @returns {Object} A grid map object
 */
export const createGridMap = (width, height, cellSize, options = {}) => {
  // Validate input
  if (width <= 0 || height <= 0 || cellSize <= 0) {
    throw new Error('Grid dimensions and cell size must be positive numbers');
  }

  // Create layers for each type
  const layers = {
    [GRID_LAYER_TYPE.BACKGROUND]: createGridLayer(width, height, GRID_LAYER_TYPE.BACKGROUND, options.defaultBackgroundEmoji || '⬜'),
    [GRID_LAYER_TYPE.COLLISION]: createGridLayer(width, height, GRID_LAYER_TYPE.COLLISION, options.defaultCollisionEmoji || ''),
    [GRID_LAYER_TYPE.EVENT]: createGridLayer(width, height, GRID_LAYER_TYPE.EVENT, options.defaultEventEmoji || ''),
    [GRID_LAYER_TYPE.SPRITE]: createGridLayer(width, height, GRID_LAYER_TYPE.SPRITE, options.defaultSpriteEmoji || ''),
    [GRID_LAYER_TYPE.GUI]: createGridLayer(width, height, GRID_LAYER_TYPE.GUI, options.defaultGuiEmoji || '')
  };

  // Map properties
  const properties = {
    name: options.name || 'New Map',
    backgroundColor: options.backgroundColor || '#FFFFFF',
    gridColor: options.gridColor || '#CCCCCC',
    showGrid: options.showGrid !== undefined ? options.showGrid : true,
    ...options
  };

  // Camera position (for scrolling)
  let cameraX = 0;
  let cameraY = 0;

  // Return the map object
  return {
    width,
    height,
    cellSize,
    layers,
    properties,

    /**
     * Gets a specific layer
     *
     * @param {string} type - Layer type (from GRID_LAYER_TYPE)
     * @returns {Object} The layer object
     */
    getLayer: (type) => {
      if (!layers[type]) {
        throw new Error(`Invalid layer type: ${type}`);
      }
      return layers[type];
    },

    /**
     * Gets all layers as an array
     *
     * @returns {Array} Array of layer objects
     */
    getAllLayers: () => {
      return Object.values(layers);
    },

    /**
     * Gets the cell content for all layers at the specified coordinates
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} Object with layer types as keys and emoji content as values
     */
    getCellContent: (x, y) => {
      const content = {};
      Object.entries(layers).forEach(([type, layer]) => {
        content[type] = layer.getCell(x, y);
      });
      return content;
    },

    /**
     * Sets a property value
     *
     * @param {string} key - Property name
     * @param {any} value - Property value
     * @returns {void}
     */
    setProperty: (key, value) => {
      properties[key] = value;
    },

    /**
     * Gets a property value
     *
     * @param {string} key - Property name
     * @returns {any} Property value
     */
    getProperty: (key) => {
      return properties[key];
    },

    /**
     * Resizes the map and all its layers
     *
     * @param {number} newWidth - New width
     * @param {number} newHeight - New height
     * @returns {void}
     */
    resize: (newWidth, newHeight) => {
      if (newWidth <= 0 || newHeight <= 0) {
        throw new Error('Grid dimensions must be positive numbers');
      }

      // Resize all layers
      Object.values(layers).forEach(layer => {
        layer.resize(newWidth, newHeight);
      });

      // Update map dimensions
      width = newWidth;
      height = newHeight;
    },

    /**
     * Sets the camera position
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {void}
     */
    setCamera: (x, y) => {
      cameraX = x;
      cameraY = y;
    },

    /**
     * Gets the camera position
     *
     * @returns {Object} Object with x and y properties
     */
    getCamera: () => {
      return { x: cameraX, y: cameraY };
    },

    /**
     * Moves the camera by the specified amount
     *
     * @param {number} deltaX - X amount to move
     * @param {number} deltaY - Y amount to move
     * @returns {void}
     */
    moveCamera: (deltaX, deltaY) => {
      cameraX += deltaX;
      cameraY += deltaY;
    },

    /**
     * Converts screen coordinates to grid coordinates
     *
     * @param {number} screenX - X coordinate on screen
     * @param {number} screenY - Y coordinate on screen
     * @returns {Object} Object with x and y grid coordinates
     */
    screenToGrid: (screenX, screenY) => {
      const gridX = Math.floor((screenX + cameraX) / cellSize);
      const gridY = Math.floor((screenY + cameraY) / cellSize);
      return { x: gridX, y: gridY };
    },

    /**
     * Converts grid coordinates to screen coordinates
     *
     * @param {number} gridX - X coordinate on grid
     * @param {number} gridY - Y coordinate on grid
     * @returns {Object} Object with x and y screen coordinates (center of cell)
     */
    gridToScreen: (gridX, gridY) => {
      const screenX = (gridX * cellSize) + (cellSize / 2) - cameraX;
      const screenY = (gridY * cellSize) + (cellSize / 2) - cameraY;
      return { x: screenX, y: screenY };
    },

    /**
     * Snaps a screen coordinate to the nearest grid cell
     *
     * @param {number} screenX - X coordinate on screen
     * @param {number} screenY - Y coordinate on screen
     * @returns {Object} Object with snapped x and y screen coordinates
     */
    snapToGrid: (screenX, screenY) => {
      const gridCoords = this.screenToGrid(screenX, screenY);
      return this.gridToScreen(gridCoords.x, gridCoords.y);
    },

    /**
     * Exports the map data as a serializable object
     *
     * @returns {Object} Serializable map data
     */
    exportData: () => {
      const layerData = {};
      Object.entries(layers).forEach(([type, layer]) => {
        layerData[type] = {
          cells: layer.cells,
          properties: { ...layer.properties }
        };
      });

      return {
        width,
        height,
        cellSize,
        properties: { ...properties },
        layers: layerData
      };
    },

    /**
     * Imports map data from a serialized object
     *
     * @param {Object} data - Serialized map data
     * @returns {boolean} True if import was successful
     */
    importData: (data) => {
      if (!data || !data.width || !data.height || !data.cellSize || !data.layers) {
        return false;
      }

      // Update map dimensions and properties
      width = data.width;
      height = data.height;
      cellSize = data.cellSize;
      Object.assign(properties, data.properties || {});

      // Update layers
      Object.entries(data.layers).forEach(([type, layerData]) => {
        if (layers[type] && layerData.cells) {
          // Resize the layer if needed
          if (layers[type].width !== width || layers[type].height !== height) {
            layers[type].resize(width, height);
          }

          // Copy cell data
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              if (layerData.cells[y] && layerData.cells[y][x] !== undefined) {
                layers[type].setCell(x, y, layerData.cells[y][x]);
              }
            }
          }

          // Copy properties
          if (layerData.properties) {
            Object.entries(layerData.properties).forEach(([key, value]) => {
              layers[type].setProperty(key, value);
            });
          }
        }
      });

      return true;
    }
  };
};

/**
 * Creates a grid renderer that can render a grid map on a canvas
 *
 * @param {Object} emojiRenderer - An emoji renderer created with createEmojiRenderer
 * @returns {Object} A grid renderer object
 */
export const createGridRenderer = (emojiRenderer) => {
  // Validate input
  if (!emojiRenderer || !emojiRenderer.renderEmoji) {
    throw new Error('Invalid emoji renderer provided to createGridRenderer');
  }

  // Get the canvas context from the emoji renderer
  const ctx = emojiRenderer.getContext();

  /**
   * Renders a grid map
   *
   * @param {Object} gridMap - A grid map created with createGridMap
   * @param {number} startX - Starting X coordinate on canvas
   * @param {number} startY - Starting Y coordinate on canvas
   * @param {number} emojiSize - Size of emojis in pixels
   * @param {Object} options - Additional rendering options
   * @returns {void}
   */
  const renderGridMap = (gridMap, startX, startY, emojiSize, options = {}) => {
    const ctx = emojiRenderer.getContext();
    const cellSize = gridMap.cellSize;
    const camera = gridMap.getCamera();

    // Calculate visible area
    const visibleStartX = Math.floor(camera.x / cellSize);
    const visibleStartY = Math.floor(camera.y / cellSize);
    const visibleEndX = Math.ceil((camera.x + ctx.canvas.width) / cellSize);
    const visibleEndY = Math.ceil((camera.y + ctx.canvas.height) / cellSize);

    // Clamp to map boundaries
    const startCol = Math.max(0, visibleStartX);
    const startRow = Math.max(0, visibleStartY);
    const endCol = Math.min(gridMap.width - 1, visibleEndX);
    const endRow = Math.min(gridMap.height - 1, visibleEndY);

    // Clear canvas or fill with background color
    if (options.clear !== false) {
      const backgroundColor = gridMap.getProperty('backgroundColor') || '#FFFFFF';
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // Draw grid lines if enabled
    if (gridMap.getProperty('showGrid')) {
      ctx.save();
      ctx.strokeStyle = gridMap.getProperty('gridColor') || '#CCCCCC';
      ctx.lineWidth = 1;

      // Adjust for camera position
      const offsetX = startX - camera.x;
      const offsetY = startY - camera.y;

      // Draw vertical grid lines
      for (let x = startCol; x <= endCol + 1; x++) {
        const lineX = offsetX + (x * cellSize);
        ctx.beginPath();
        ctx.moveTo(lineX, offsetY + (startRow * cellSize));
        ctx.lineTo(lineX, offsetY + ((endRow + 1) * cellSize));
        ctx.stroke();
      }

      // Draw horizontal grid lines
      for (let y = startRow; y <= endRow + 1; y++) {
        const lineY = offsetY + (y * cellSize);
        ctx.beginPath();
        ctx.moveTo(offsetX + (startCol * cellSize), lineY);
        ctx.lineTo(offsetX + ((endCol + 1) * cellSize), lineY);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Render each layer in order
    const layerOrder = [
      GRID_LAYER_TYPE.BACKGROUND,
      GRID_LAYER_TYPE.COLLISION,
      GRID_LAYER_TYPE.EVENT,
      GRID_LAYER_TYPE.SPRITE,
      GRID_LAYER_TYPE.GUI
    ];

    layerOrder.forEach(layerType => {
      const layer = gridMap.getLayer(layerType);

      // Skip invisible layers
      if (!layer.getProperty('visible')) {
        return;
      }

      // Set layer opacity
      ctx.save();
      ctx.globalAlpha = layer.getProperty('opacity');

      // Render visible cells
      for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
          const emoji = layer.getCell(x, y);
          if (emoji) {
            // Calculate screen position
            const screenPos = gridMap.gridToScreen(x, y);
            emojiRenderer.renderEmoji(emoji, screenPos.x, screenPos.y, emojiSize);
          }
        }
      }

      ctx.restore();
    });
  };

  /**
   * Renders a single grid cell with highlight
   *
   * @param {Object} gridMap - A grid map created with createGridMap
   * @param {number} gridX - X coordinate on grid
   * @param {number} gridY - Y coordinate on grid
   * @param {number} emojiSize - Size of emojis in pixels
   * @param {string} highlightColor - Color for the highlight (default: 'rgba(255, 255, 0, 0.3)')
   * @returns {void}
   */
  const renderHighlightedCell = (gridMap, gridX, gridY, emojiSize, highlightColor = 'rgba(255, 255, 0, 0.3)') => {
    // Skip if out of bounds
    if (gridX < 0 || gridX >= gridMap.width || gridY < 0 || gridY >= gridMap.height) {
      return;
    }

    const ctx = emojiRenderer.getContext();
    const cellSize = gridMap.cellSize;
    const screenPos = gridMap.gridToScreen(gridX, gridY);

    // Draw highlight
    ctx.save();
    ctx.fillStyle = highlightColor;
    ctx.fillRect(
      screenPos.x - (cellSize / 2),
      screenPos.y - (cellSize / 2),
      cellSize,
      cellSize
    );
    ctx.restore();

    // Render cell content
    const content = gridMap.getCellContent(gridX, gridY);
    Object.entries(content).forEach(([layerType, emoji]) => {
      if (emoji && gridMap.getLayer(layerType).getProperty('visible')) {
        emojiRenderer.renderEmoji(emoji, screenPos.x, screenPos.y, emojiSize);
      }
    });
  };

  /**
   * Renders a selection rectangle
   *
   * @param {Object} gridMap - A grid map created with createGridMap
   * @param {number} startGridX - Starting X coordinate on grid
   * @param {number} startGridY - Starting Y coordinate on grid
   * @param {number} endGridX - Ending X coordinate on grid
   * @param {number} endGridY - Ending Y coordinate on grid
   * @param {string} selectionColor - Color for the selection (default: 'rgba(0, 100, 255, 0.3)')
   * @returns {void}
   */
  const renderSelectionRect = (gridMap, startGridX, startGridY, endGridX, endGridY, selectionColor = 'rgba(0, 100, 255, 0.3)') => {
    const ctx = emojiRenderer.getContext();
    const cellSize = gridMap.cellSize;

    // Calculate corners
    const minX = Math.min(startGridX, endGridX);
    const maxX = Math.max(startGridX, endGridX);
    const minY = Math.min(startGridY, endGridY);
    const maxY = Math.max(startGridY, endGridY);

    // Calculate screen positions
    const topLeft = gridMap.gridToScreen(minX, minY);
    const width = (maxX - minX + 1) * cellSize;
    const height = (maxY - minY + 1) * cellSize;

    // Draw selection rectangle
    ctx.save();
    ctx.fillStyle = selectionColor;
    ctx.fillRect(
      topLeft.x - (cellSize / 2),
      topLeft.y - (cellSize / 2),
      width,
      height
    );

    // Draw border
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      topLeft.x - (cellSize / 2),
      topLeft.y - (cellSize / 2),
      width,
      height
    );
    ctx.restore();
  };

  // Return the public API
  return {
    renderGridMap,
    renderHighlightedCell,
    renderSelectionRect
  };
};
