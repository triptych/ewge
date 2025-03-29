/**
 * emojiRenderer.js
 *
 * A module for rendering emoji characters on HTML5 Canvas.
 * This module follows the functional programming paradigm and avoids external dependencies.
 */

/**
 * Creates an emoji renderer that can draw emojis on a specified canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx - The canvas 2D rendering context
 * @returns {Object} An object with methods for emoji rendering
 */
export const createEmojiRenderer = (ctx) => {
  // Validate input
  if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
    throw new Error('Invalid canvas context provided to createEmojiRenderer');
  }

  /**
   * Renders a single emoji at the specified position
   *
   * @param {string} emoji - The emoji character to render
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} size - Font size for the emoji (in pixels)
   * @param {Object} options - Additional rendering options
   * @param {string} options.font - Font family to use (default: 'sans-serif')
   * @param {string} options.textBaseline - Canvas textBaseline property (default: 'middle')
   * @param {string} options.textAlign - Canvas textAlign property (default: 'center')
   * @returns {void}
   */
  const renderEmoji = (emoji, x, y, size, options = {}) => {
    // Save the current context state
    ctx.save();

    // Set font properties
    const fontFamily = options.font || 'sans-serif';
    ctx.font = `${size}px ${fontFamily}`;

    // Set text alignment properties
    ctx.textBaseline = options.textBaseline || 'middle';
    ctx.textAlign = options.textAlign || 'center';

    // Draw the emoji
    ctx.fillText(emoji, x, y);

    // Restore the context state
    ctx.restore();
  };

  /**
   * Renders a grid of emojis
   *
   * @param {Array<Array<string>>} emojiGrid - 2D array of emoji characters
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} cellSize - Size of each grid cell
   * @param {number} emojiSize - Size of emoji (in pixels)
   * @param {Object} options - Additional rendering options
   * @returns {void}
   */
  const renderEmojiGrid = (emojiGrid, startX, startY, cellSize, emojiSize, options = {}) => {
    if (!Array.isArray(emojiGrid) || !emojiGrid.length) {
      return;
    }

    emojiGrid.forEach((row, rowIndex) => {
      if (Array.isArray(row)) {
        row.forEach((emoji, colIndex) => {
          if (emoji) {
            const x = startX + (colIndex * cellSize) + (cellSize / 2);
            const y = startY + (rowIndex * cellSize) + (cellSize / 2);
            renderEmoji(emoji, x, y, emojiSize, options);
          }
        });
      }
    });
  };

  /**
   * Measures the rendered width of an emoji
   *
   * @param {string} emoji - The emoji character to measure
   * @param {number} size - Font size for the emoji (in pixels)
   * @param {string} font - Font family to use (default: 'sans-serif')
   * @returns {number} The width of the emoji in pixels
   */
  const measureEmojiWidth = (emoji, size, font = 'sans-serif') => {
    ctx.save();
    ctx.font = `${size}px ${font}`;
    const width = ctx.measureText(emoji).width;
    ctx.restore();
    return width;
  };

  /**
   * Clears the entire canvas
   *
   * @returns {void}
   */
  const clearCanvas = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // Return the public API
  return {
    renderEmoji,
    renderEmojiGrid,
    measureEmojiWidth,
    clearCanvas
  };
};

/**
 * Creates a canvas element and returns both the canvas and its 2D context
 *
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @param {boolean} appendToBody - Whether to append the canvas to document.body
 * @returns {Object} Object containing the canvas element and its 2D context
 */
export const createCanvas = (width, height, appendToBody = false) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  if (appendToBody && document.body) {
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');

  return {
    canvas,
    ctx
  };
};
