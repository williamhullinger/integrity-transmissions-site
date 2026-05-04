# Skyline Project

A pure HTML and CSS skyline illustration built as part of the freeCodeCamp Responsive Web Design curriculum.

This project creates a stylized city skyline using only HTML structure and advanced CSS techniques. No images and no JavaScript were used. Everything on the screen is generated through CSS gradients, borders, positioning, and layout systems.

This file is saved for reference and continued study of advanced CSS concepts.

---

## Overview

The Skyline project renders:

- A layered city skyline
- Background and foreground buildings
- A sun created using radial gradients
- Window lighting effects
- A responsive “night mode” activated via media query
- Full viewport layout with absolute positioning

The entire scene is constructed using CSS techniques rather than image assets.

---

## Technologies Used

- HTML5
- CSS3
- Flexbox
- CSS Variables (`:root`)
- Linear Gradients
- Radial Gradients
- Repeating Linear Gradients
- Media Queries
- Viewport Units (`vh`, `vw`)
- Absolute Positioning
- Border-based Shapes

---

## Project Structure

project-folder/
│
├── index.html
└── styles.css

---

## Key Concepts Practiced

### CSS Variables

Color themes are defined inside `:root` and allow centralized control of building and window colors. This also enables easy theme switching for night mode.

### Layout Architecture

Both background and foreground layers use Flexbox to align buildings along the bottom of the viewport and space them evenly across the screen.

### Layering with Positioning

The skyline layers are positioned absolutely so foreground and background elements can stack visually.

### Gradients for Visual Effects

Radial gradients create the sun and sky.  
Repeating linear gradients simulate building windows and textures.

### Border-Based Shapes

Triangular rooftops and angled structures are created using border tricks instead of images.

### Responsive Night Mode

At smaller screen sizes (`max-width: 1000px`), CSS variables are overridden to switch building colors to dark tones and window colors to gray. The sky gradient also darkens to simulate night mode without JavaScript.

---

## What This Project Demonstrates

- Advanced CSS visual rendering without images
- Strong understanding of gradients and layered backgrounds
- Layout control using Flexbox
- Creative use of border shapes
- Responsive design through variable overrides
- Viewport-based scaling
- Complex visual composition using simple HTML structure

---

## Lessons Learned

This project significantly strengthened understanding of:

- CSS gradients and visual layering systems
- Reusable variable-based theming
- Flexbox alignment strategies
- Absolute positioning for layered layouts
- Creating visual depth without images
- Responsive design via variable swapping
- Thinking in visual systems rather than just writing markup

The Skyline project reinforces how powerful CSS alone can be when used intentionally.

---

## Author

William Hullinger

Built as part of the freeCodeCamp Responsive Web Design Certification.
Saved for reference and continued CSS study.