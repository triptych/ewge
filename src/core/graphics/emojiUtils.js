/**
 * emojiUtils.js
 *
 * Utility functions for working with emoji characters, including support for
 * emoji variants and skin tone modifiers.
 */

/**
 * Skin tone modifier code points
 * These are the Fitzpatrick skin tone modifiers that can be applied to certain emojis
 */
export const SKIN_TONES = {
  LIGHT: '\u{1F3FB}',      // Light skin tone
  MEDIUM_LIGHT: '\u{1F3FC}', // Medium-light skin tone
  MEDIUM: '\u{1F3FD}',     // Medium skin tone
  MEDIUM_DARK: '\u{1F3FE}', // Medium-dark skin tone
  DARK: '\u{1F3FF}'        // Dark skin tone
};

/**
 * Emoji presentation styles
 */
export const EMOJI_STYLE = {
  TEXT: '\u{FE0E}',        // Text presentation selector
  EMOJI: '\u{FE0F}'        // Emoji presentation selector
};

/**
 * Checks if a string is a single emoji character (may include modifiers)
 *
 * @param {string} str - The string to check
 * @returns {boolean} True if the string is a single emoji
 */
export const isSingleEmoji = (str) => {
  if (typeof str !== 'string' || str.length === 0) {
    return false;
  }

  // Remove skin tone modifiers and presentation selectors for the check
  const normalized = str
    .replace(new RegExp(`[${Object.values(SKIN_TONES).join('')}${Object.values(EMOJI_STYLE).join('')}]`, 'gu'), '');

  // Basic regex to check if the string contains a single emoji
  // This is a simplified approach and may not catch all edge cases
  const emojiRegex = /^(\p{Emoji}|\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;

  return emojiRegex.test(normalized);
};

/**
 * Applies a skin tone modifier to an emoji that supports it
 *
 * @param {string} emoji - The base emoji character
 * @param {string} skinTone - The skin tone modifier to apply
 * @returns {string} The emoji with the skin tone applied, or the original emoji if not applicable
 */
export const applyEmojiSkinTone = (emoji, skinTone) => {
  if (!emoji || !skinTone || !Object.values(SKIN_TONES).includes(skinTone)) {
    return emoji;
  }

  // Check if this emoji supports skin tones
  // This is a simplified approach - a more comprehensive solution would use
  // a database of emojis that support skin tones
  const supportsSkinTone = /^(\p{Emoji_Modifier_Base})$/u.test(emoji);

  return supportsSkinTone ? `${emoji}${skinTone}` : emoji;
};

/**
 * Applies a presentation style to an emoji
 *
 * @param {string} emoji - The emoji character
 * @param {string} style - The presentation style (text or emoji)
 * @returns {string} The emoji with the specified presentation style
 */
export const applyEmojiStyle = (emoji, style) => {
  if (!emoji || !style || !Object.values(EMOJI_STYLE).includes(style)) {
    return emoji;
  }

  return `${emoji}${style}`;
};

/**
 * Gets all skin tone variations of an emoji that supports skin tones
 *
 * @param {string} emoji - The base emoji character
 * @returns {Array<string>} Array of the emoji with all skin tone variations
 */
export const getAllSkinToneVariations = (emoji) => {
  if (!emoji) {
    return [];
  }

  // Check if this emoji supports skin tones
  const supportsSkinTone = /^(\p{Emoji_Modifier_Base})$/u.test(emoji);

  if (!supportsSkinTone) {
    return [emoji];
  }

  // Return the base emoji plus all skin tone variations
  return [
    emoji, // Base emoji without skin tone
    ...Object.values(SKIN_TONES).map(tone => `${emoji}${tone}`)
  ];
};

/**
 * Checks if an emoji supports skin tone modifiers
 *
 * @param {string} emoji - The emoji to check
 * @returns {boolean} True if the emoji supports skin tone modifiers
 */
export const supportsSkinTone = (emoji) => {
  if (!emoji) {
    return false;
  }

  return /^(\p{Emoji_Modifier_Base})$/u.test(emoji);
};

/**
 * Extracts the base emoji without any modifiers or presentation selectors
 *
 * @param {string} emoji - The emoji with possible modifiers
 * @returns {string} The base emoji without modifiers
 */
export const getBaseEmoji = (emoji) => {
  if (!emoji) {
    return '';
  }

  // Remove skin tone modifiers and presentation selectors
  return emoji.replace(
    new RegExp(`[${Object.values(SKIN_TONES).join('')}${Object.values(EMOJI_STYLE).join('')}]`, 'gu'),
    ''
  );
};

/**
 * Common emoji categories with sample emojis
 * This is a simplified list - a real implementation would have a more comprehensive database
 */
export const EMOJI_CATEGORIES = {
  FACES: {
    name: 'Faces & People',
    samples: ['😀', '😂', '😍', '🤔', '😎', '🙂', '😊', '🥰', '😇', '🤩']
  },
  ANIMALS: {
    name: 'Animals & Nature',
    samples: ['🐶', '🐱', '🐭', '🦊', '🐻', '🐼', '🦁', '🐮', '🐷', '🐸']
  },
  FOOD: {
    name: 'Food & Drink',
    samples: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑']
  },
  ACTIVITIES: {
    name: 'Activities',
    samples: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸']
  },
  TRAVEL: {
    name: 'Travel & Places',
    samples: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐']
  },
  OBJECTS: {
    name: 'Objects',
    samples: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️']
  },
  SYMBOLS: {
    name: 'Symbols',
    samples: ['❤️', '💔', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️']
  }
};

/**
 * Detects if the browser has proper emoji support
 *
 * @returns {boolean} True if the browser supports emoji rendering
 */
export const detectEmojiSupport = () => {
  // Create a canvas to test emoji rendering
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Test emoji
  const testEmoji = '🙂';

  // Set canvas and font
  canvas.width = 20;
  canvas.height = 20;
  ctx.textBaseline = 'top';
  ctx.font = '16px sans-serif';

  // Draw the emoji
  ctx.fillText(testEmoji, 0, 0);

  // Check if the canvas contains non-blank pixels
  // If the emoji is supported, the canvas should have colored pixels
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Check if there are any non-transparent pixels
  for (let i = 0; i < imageData.length; i += 4) {
    if (imageData[i + 3] > 0) { // Alpha channel
      return true;
    }
  }

  return false;
};
