# Parent Teacher Conference Form

A clean, accessible HTML form styled with CSS and built as a **learning reference**.  
This project intentionally demonstrates **CSS pseudo-classes** used in real-world forms, alongside proper HTML structure.

---

##  Primary Learning Goal

The primary goal of this project is to **practice and reference common CSS pseudo-classes** used in forms:

- `:focus`
- `:hover`
- `:checked`
- `::before`
- `::placeholder`

All styling choices are secondary to understanding **how and why** these pseudo-classes are used.

---

##  Project Purpose

This form simulates a Parent–Teacher Conference request form.  
It is designed to be revisited later as a **reference for form behavior**, not just layout.

Key focuses:
- Form usability
- Visual feedback for user actions
- Radio button state styling
- Clean, readable selectors

---

##  Project Structure

```
parent-teacher-conference-form/
├── index.html
├── styles.css
└── README.md
```

---

##  HTML Concepts Used

### Semantic Structure
- `<main>` wraps the primary content
- `<header>` introduces the form
- `<fieldset>` and `<legend>` group related controls
- `<label>` is used for every form input

These choices directly support CSS pseudo-class behavior.

---

##  CSS Pseudo-Classes Used (Core Reference)

### `:focus`
Used to highlight inputs when the user interacts with them via keyboard or mouse.

**Where to look:**  
```css
input:focus,
textarea:focus
```

**Why it matters:**  
Improves accessibility and makes active fields obvious.

---

### `:hover`
Used on the submit button to show interactivity.

**Where to look:**  
```css
.submit-btn:hover
```

**Why it matters:**  
Provides immediate feedback that an element is clickable.

---

### `:checked`
Used to style radio buttons when selected.

**Where to look:**  
```css
.radio:checked::before
.radio-option:has(.radio:checked)
```

**Why it matters:**  
Allows visual state changes without JavaScript.

---

### `::before`
Used to create the inner dot of a custom radio button.

**Where to look:**  
```css
.radio::before
```

**Why it matters:**  
Creates UI elements without extra HTML.

---

### `::placeholder`
Used to style placeholder text inside inputs.

**Where to look:**  
```css
input::placeholder,
textarea::placeholder
```

**Why it matters:**  
Improves readability and visual consistency.

---

## 🔘 Radio Button Pattern (Pseudo-Class Focus)

### HTML Pattern
```html
<label class="radio-option">
  <input type="radio" class="radio" name="contactMethod">
  <span class="radio-text">Email</span>
</label>
```

### CSS Behavior
- `:checked` controls selection state
- `::before` renders the inner dot
- `:has()` highlights the selected row

This pattern demonstrates how **pseudo-classes drive UI behavior**.

---

##  CSS Philosophy

- Pseudo-classes are used instead of JavaScript where possible
- Styling reacts to **user state**, not hard-coded classes
- Selectors are kept readable and intentional
- Code is written to be revisited and reused

---

##  Accessibility Notes

- Focus states are visible
- Labels increase click targets
- Radio selection is clear visually and structurally
- Keyboard navigation is supported

---

##  Reuse Value

This project can be reused as a reference for:
- Any form with radio buttons
- Learning pseudo-classes
- Designing interactive form feedback
- Practicing state-based CSS

---

##  Author

**William Hullinger**  
Learning Web Development  
Focus: HTML, CSS, and state-driven UI

---

##  Notes for Future Reference

- Pseudo-classes replace many JavaScript use cases
- `:checked` + `::before` is a powerful pattern
- Focus styles are not optional — they are UX
- Keep selectors readable, not clever
