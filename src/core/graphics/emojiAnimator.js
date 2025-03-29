/**
 * emojiAnimator.js
 *
 * A module for creating and managing emoji animations on HTML5 Canvas.
 * This module follows the functional programming paradigm and integrates
 * with the existing emojiRenderer system.
 */

/**
 * Creates an animation frame object
 *
 * @param {string} emoji - The emoji to display in this frame
 * @param {number} duration - Duration of the frame in milliseconds
 * @param {Object} options - Additional frame options
 * @param {number} options.scale - Scale factor for the emoji (1.0 = normal size)
 * @param {number} options.rotation - Rotation in radians
 * @param {number} options.opacity - Opacity from 0.0 to 1.0
 * @returns {Object} Animation frame object
 */
export const createAnimationFrame = (emoji, duration, options = {}) => ({
  emoji,
  duration,
  scale: options.scale !== undefined ? options.scale : 1.0,
  rotation: options.rotation !== undefined ? options.rotation : 0,
  opacity: options.opacity !== undefined ? options.opacity : 1.0
});

/**
 * Creates an animation sequence from an array of frames
 *
 * @param {Array<Object>} frames - Array of animation frame objects
 * @param {Object} options - Animation options
 * @param {boolean} options.loop - Whether the animation should loop
 * @param {string} options.name - Name identifier for the animation
 * @returns {Object} Animation sequence object
 */
export const createAnimation = (frames, options = {}) => ({
  frames: [...frames],
  loop: options.loop !== undefined ? options.loop : true,
  name: options.name || `animation_${Date.now()}`,
  totalDuration: frames.reduce((sum, frame) => sum + frame.duration, 0)
});

/**
 * Creates a transition between two emojis
 *
 * @param {string} fromEmoji - Starting emoji
 * @param {string} toEmoji - Ending emoji
 * @param {number} duration - Total duration of transition in milliseconds
 * @param {string} transitionType - Type of transition ('fade', 'scale', 'rotate', 'pulse')
 * @param {number} frameCount - Number of frames to generate for the transition
 * @returns {Object} Animation sequence for the transition
 */
export const createEmojiTransition = (fromEmoji, toEmoji, duration, transitionType = 'fade', frameCount = 10) => {
  const frames = [];
  const frameDuration = duration / frameCount;

  // Generate transition frames based on the transition type
  for (let i = 0; i < frameCount; i++) {
    const progress = i / (frameCount - 1); // 0.0 to 1.0
    const options = {};

    // Different transition effects
    switch (transitionType) {
      case 'fade':
        if (i < frameCount / 2) {
          // First half: fade out fromEmoji
          options.opacity = 1 - (progress * 2);
          frames.push(createAnimationFrame(fromEmoji, frameDuration, options));
        } else {
          // Second half: fade in toEmoji
          options.opacity = (progress * 2) - 1;
          frames.push(createAnimationFrame(toEmoji, frameDuration, options));
        }
        break;

      case 'scale':
        if (i < frameCount / 2) {
          // First half: scale down fromEmoji
          options.scale = 1 - (progress * 2) * 0.5; // Scale down to 0.5
          frames.push(createAnimationFrame(fromEmoji, frameDuration, options));
        } else {
          // Second half: scale up toEmoji
          options.scale = 0.5 + ((progress * 2) - 1) * 0.5; // Scale up from 0.5 to 1.0
          frames.push(createAnimationFrame(toEmoji, frameDuration, options));
        }
        break;

      case 'rotate':
        if (i < frameCount / 2) {
          // First half: rotate fromEmoji
          options.rotation = progress * Math.PI; // Rotate up to 180 degrees
          frames.push(createAnimationFrame(fromEmoji, frameDuration, options));
        } else {
          // Second half: rotate toEmoji
          options.rotation = progress * Math.PI; // Continue rotation
          frames.push(createAnimationFrame(toEmoji, frameDuration, options));
        }
        break;

      case 'pulse':
        if (i < frameCount / 2) {
          // First half: pulse fromEmoji
          options.scale = 1 + Math.sin(progress * Math.PI) * 0.2; // Pulse up to 1.2x
          frames.push(createAnimationFrame(fromEmoji, frameDuration, options));
        } else {
          // Second half: pulse toEmoji
          options.scale = 1 + Math.sin(progress * Math.PI) * 0.2; // Pulse up to 1.2x
          frames.push(createAnimationFrame(toEmoji, frameDuration, options));
        }
        break;

      default:
        // Simple swap in the middle
        if (i < frameCount / 2) {
          frames.push(createAnimationFrame(fromEmoji, frameDuration, options));
        } else {
          frames.push(createAnimationFrame(toEmoji, frameDuration, options));
        }
    }
  }

  return createAnimation(frames, {
    loop: false,
    name: `transition_${fromEmoji}_to_${toEmoji}_${transitionType}`
  });
};

/**
 * Creates an emoji animator that can play animations on a specified canvas
 *
 * @param {Object} emojiRenderer - An instance of emojiRenderer
 * @returns {Object} An object with methods for animation management and playback
 */
export const createEmojiAnimator = (emojiRenderer) => {
  // Validate input
  if (!emojiRenderer || !emojiRenderer.renderEmoji) {
    throw new Error('Invalid emojiRenderer provided to createEmojiAnimator');
  }

  // Store active animations
  const activeAnimations = new Map();

  // Animation frame request ID for the animation loop
  let animationFrameId = null;

  /**
   * Starts playing an animation at the specified position
   *
   * @param {string} animationId - Unique identifier for this animation instance
   * @param {Object} animation - Animation sequence object
   * @param {number} x - X coordinate on canvas
   * @param {number} y - Y coordinate on canvas
   * @param {number} size - Base size for the emoji
   * @param {Object} options - Additional rendering options
   * @param {Function} onComplete - Callback function when animation completes
   * @returns {string} The animation ID
   */
  const playAnimation = (animationId, animation, x, y, size, options = {}, onComplete = null) => {
    const id = animationId || `anim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    activeAnimations.set(id, {
      animation,
      x,
      y,
      size,
      options,
      onComplete,
      startTime: Date.now(),
      currentFrameIndex: 0,
      isPlaying: true
    });

    // Start the animation loop if it's not already running
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(animationLoop);
    }

    return id;
  };

  /**
   * Stops a specific animation
   *
   * @param {string} animationId - ID of the animation to stop
   * @returns {boolean} True if the animation was found and stopped
   */
  const stopAnimation = (animationId) => {
    if (activeAnimations.has(animationId)) {
      activeAnimations.delete(animationId);

      // If no more animations are active, stop the animation loop
      if (activeAnimations.size === 0) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      return true;
    }

    return false;
  };

  /**
   * Stops all currently playing animations
   */
  const stopAllAnimations = () => {
    activeAnimations.clear();

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  /**
   * Pauses a specific animation
   *
   * @param {string} animationId - ID of the animation to pause
   * @returns {boolean} True if the animation was found and paused
   */
  const pauseAnimation = (animationId) => {
    if (activeAnimations.has(animationId)) {
      const animationState = activeAnimations.get(animationId);
      animationState.isPlaying = false;
      activeAnimations.set(animationId, animationState);
      return true;
    }

    return false;
  };

  /**
   * Resumes a paused animation
   *
   * @param {string} animationId - ID of the animation to resume
   * @returns {boolean} True if the animation was found and resumed
   */
  const resumeAnimation = (animationId) => {
    if (activeAnimations.has(animationId)) {
      const animationState = activeAnimations.get(animationId);
      animationState.isPlaying = true;
      animationState.startTime = Date.now() - animationState.elapsedTime;
      activeAnimations.set(animationId, animationState);

      // Restart the animation loop if it's not running
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(animationLoop);
      }

      return true;
    }

    return false;
  };

  /**
   * The main animation loop that updates and renders all active animations
   */
  const animationLoop = () => {
    const currentTime = Date.now();

    // Process each active animation
    for (const [id, state] of activeAnimations.entries()) {
      if (!state.isPlaying) {
        // Skip paused animations but store elapsed time
        state.elapsedTime = currentTime - state.startTime;
        continue;
      }

      const { animation, x, y, size, options, startTime, onComplete } = state;
      const elapsedTime = currentTime - startTime;

      // Find the current frame based on elapsed time
      let frameTime = 0;
      let currentFrameIndex = 0;
      let currentFrame = null;

      // Calculate which frame we should be on
      for (let i = 0; i < animation.frames.length; i++) {
        const frame = animation.frames[i];

        if (frameTime + frame.duration > elapsedTime) {
          // Found the current frame
          currentFrameIndex = i;
          currentFrame = frame;
          break;
        }

        frameTime += frame.duration;
      }

      // If we've gone past the last frame
      if (currentFrame === null) {
        if (animation.loop) {
          // Loop back to the beginning
          state.startTime = currentTime;
          currentFrameIndex = 0;
          currentFrame = animation.frames[0];
        } else {
          // Animation is complete
          stopAnimation(id);

          if (onComplete && typeof onComplete === 'function') {
            onComplete();
          }

          continue;
        }
      }

      // Update the current frame index in the state
      state.currentFrameIndex = currentFrameIndex;

      // Render the current frame with its transformations
      renderAnimationFrame(currentFrame, x, y, size, options);
    }

    // Continue the animation loop if there are active animations
    if (activeAnimations.size > 0) {
      animationFrameId = requestAnimationFrame(animationLoop);
    } else {
      animationFrameId = null;
    }
  };

  /**
   * Renders a single animation frame with transformations
   *
   * @param {Object} frame - The animation frame to render
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} baseSize - Base size for the emoji
   * @param {Object} options - Additional rendering options
   */
  const renderAnimationFrame = (frame, x, y, baseSize, options = {}) => {
    const ctx = emojiRenderer.getContext();

    // Save the current context state
    ctx.save();

    // Apply transformations
    ctx.translate(x, y);

    if (frame.rotation !== 0) {
      ctx.rotate(frame.rotation);
    }

    if (frame.scale !== 1.0) {
      ctx.scale(frame.scale, frame.scale);
    }

    if (frame.opacity !== 1.0) {
      ctx.globalAlpha = frame.opacity;
    }

    // Render the emoji at the origin (transformations have been applied)
    emojiRenderer.renderEmoji(frame.emoji, 0, 0, baseSize * frame.scale, options);

    // Restore the context state
    ctx.restore();
  };

  /**
   * Creates a sequence of frames that cycle through an array of emojis
   *
   * @param {Array<string>} emojis - Array of emoji characters to cycle through
   * @param {number} frameDuration - Duration of each frame in milliseconds
   * @param {Object} options - Animation options
   * @returns {Object} Animation sequence
   */
  const createEmojiCycleAnimation = (emojis, frameDuration, options = {}) => {
    const frames = emojis.map(emoji => createAnimationFrame(emoji, frameDuration));
    return createAnimation(frames, options);
  };

  /**
   * Creates a "typing" animation that gradually reveals an emoji
   *
   * @param {string} emoji - The emoji to animate
   * @param {number} duration - Total duration of the animation
   * @param {number} frameCount - Number of frames to generate
   * @returns {Object} Animation sequence
   */
  const createTypingAnimation = (emoji, duration, frameCount = 5) => {
    const frames = [];
    const frameDuration = duration / frameCount;

    for (let i = 0; i < frameCount; i++) {
      const progress = (i + 1) / frameCount;
      frames.push(createAnimationFrame(emoji, frameDuration, { opacity: progress }));
    }

    return createAnimation(frames, { loop: false, name: `typing_${emoji}` });
  };

  /**
   * Creates a "bounce" animation for an emoji
   *
   * @param {string} emoji - The emoji to animate
   * @param {number} duration - Total duration of the animation
   * @param {number} frameCount - Number of frames to generate
   * @param {number} bounceHeight - Maximum scale factor during bounce
   * @returns {Object} Animation sequence
   */
  const createBounceAnimation = (emoji, duration, frameCount = 10, bounceHeight = 1.3) => {
    const frames = [];
    const frameDuration = duration / frameCount;

    for (let i = 0; i < frameCount; i++) {
      const progress = i / (frameCount - 1);
      const scale = 1 + Math.sin(progress * Math.PI) * (bounceHeight - 1);
      frames.push(createAnimationFrame(emoji, frameDuration, { scale }));
    }

    return createAnimation(frames, { loop: true, name: `bounce_${emoji}` });
  };

  /**
   * Creates a "shake" animation for an emoji
   *
   * @param {string} emoji - The emoji to animate
   * @param {number} duration - Total duration of the animation
   * @param {number} frameCount - Number of frames to generate
   * @param {number} intensity - Maximum rotation in radians
   * @returns {Object} Animation sequence
   */
  const createShakeAnimation = (emoji, duration, frameCount = 10, intensity = 0.2) => {
    const frames = [];
    const frameDuration = duration / frameCount;

    for (let i = 0; i < frameCount; i++) {
      const progress = i / (frameCount - 1);
      const rotation = Math.sin(progress * Math.PI * 4) * intensity;
      frames.push(createAnimationFrame(emoji, frameDuration, { rotation }));
    }

    return createAnimation(frames, { loop: true, name: `shake_${emoji}` });
  };

  /**
   * Gets the context used by the emojiRenderer
   * This is needed for applying transformations
   *
   * @returns {CanvasRenderingContext2D} The canvas 2D rendering context
   */
  const getContext = () => {
    // This assumes the emojiRenderer has a way to access its context
    // If not, this would need to be passed in or handled differently
    return emojiRenderer.ctx || null;
  };

  // Return the public API
  return {
    playAnimation,
    stopAnimation,
    stopAllAnimations,
    pauseAnimation,
    resumeAnimation,
    createEmojiCycleAnimation,
    createTypingAnimation,
    createBounceAnimation,
    createShakeAnimation,
    getContext
  };
};
