import {
  addFontFromFile,
  formatText,
  addPaperFromFile
} from './utils/helpers.mjs';
import {
  generateImages,
  downloadAsPDF,
  deleteAll
} from './generate-images.mjs';
import { setInkColor, toggleDrawCanvas } from './utils/draw.mjs';


const pageEl = document.querySelector('.page-a');

const setTextareaStyle = (attrib, v) => (pageEl.style[attrib] = v);

/**
 * Add event listeners here, they will be automatically mapped with addEventListener later
 */
const EVENT_MAP = {
  '#generate-image-form': {
    on: 'submit',
    action: (e) => {
      e.preventDefault();
      generateImages();
    }
  },
  '#handwriting-font': {
    on: 'change',
    action: (e) =>
      document.body.style.setProperty('--handwriting-font', e.target.value)
  },
  '#font-size': {
    on: 'change',
    action: (e) => {
      if (e.target.value > 30) {
        alert('Font-size is too big try upto 30');
      } else {
        setTextareaStyle('fontSize', e.target.value + 'pt');
        e.preventDefault();
      }
    }
  },
  '#letter-spacing': {
    on: 'change',
    action: (e) => {
      if (e.target.value > 40) {
        alert('Letter Spacing is too big try a number upto 40');
      } else {
        setTextareaStyle('letterSpacing', e.target.value + 'px');
        e.preventDefault();
      }
    }
  },
  '#word-spacing': {
    on: 'change',
    action: (e) => {
      if (e.target.value > 100) {
        alert('Word Spacing is too big try a number upto hundred');
      } else {
        setTextareaStyle('wordSpacing', e.target.value + 'px');
        e.preventDefault();
      }
    }
  },
  '#top-padding': {
    on: 'input',
    action: (e) => {
      pageEl.querySelector('.paper-content').style.paddingTop =
        e.target.value + 'px';
    }
  },
  '#left-padding': {
    on: 'input',
    action: (e) => {
      pageEl.querySelector('.paper-content').style.paddingLeft =
        e.target.value + 'px';
    }
  },
  '#text-rotation': {
    on: 'input',
    action: (e) => {
      const paperContent = pageEl.querySelector('.paper-content');
      paperContent.style.setProperty('--text-rotation', `${e.target.value}deg`);
      paperContent.style.transform = `rotate(${e.target.value}deg)`;
    }
  },
  '#font-file': {
    on: 'change',
    action: (e) => addFontFromFile(e.target.files[0])
  },
  '#ink-color': {
    on: 'change',
    action: (e) => {
      document.body.style.setProperty('--ink-color', e.target.value);
      setInkColor(e.target.value);
    }
  },
  '#bor-color': {
    on: 'change',
    action: (e) => {
      document.body.style.setProperty('--bor-color', e.target.value);
      //setInkColor(e.target.value);
    }
  },
  
  '#paper-line-toggle': {
    on: 'change',
    action: (e) => pageEl.classList.toggle('lines', e.target.checked)
  },
  '#draw-diagram-button': {
    on: 'click',
    action: () => {
      toggleDrawCanvas();
    }
  },
  '.draw-container .close-button': {
    on: 'click',
    action: () => {
      toggleDrawCanvas();
    }
  },
  '#download-as-pdf-button': {
    on: 'click',
    action: () => {
      downloadAsPDF();
    }
  },
  '#delete-all-button': {
    on: 'click',
    action: () => {
      deleteAll();
    }
  },
  '.page-a .paper-content': {
    on: 'paste',
    action: formatText
  },
  '#paper-file': {
    on: 'change',
    action: (e) => addPaperFromFile(e.target.files[0])
  }
};

for (const eventSelector in EVENT_MAP) {
  const el = document.querySelector(eventSelector);
  if (el) {
    el.addEventListener(
      EVENT_MAP[eventSelector].on,
      EVENT_MAP[eventSelector].action
    );
  }
}

// Keep the preview aligned with the values shown in the controls on first load.
pageEl.querySelector('.paper-content').style.paddingTop =
  document.querySelector('#top-padding').value + 'px';
pageEl.querySelector('.paper-content').style.paddingLeft =
  document.querySelector('#left-padding').value + 'px';
const initialRotation = document.querySelector('#text-rotation').value;
pageEl.querySelector('.paper-content').style.setProperty(
  '--text-rotation',
  `${initialRotation}deg`
);
pageEl.querySelector('.paper-content').style.transform =
  `rotate(${initialRotation}deg)`;

const paperLineToggle = document.querySelector('#paper-line-toggle');
if (paperLineToggle) {
  pageEl.classList.toggle('lines', paperLineToggle.checked);
}

/**
 * This makes toggles, accessible.
 */
document.querySelectorAll('.switch-toggle input').forEach((toggleInput) => {
  toggleInput.addEventListener('change', (e) => {
    const statusEl = document.querySelector(
      `label[for="${toggleInput.id}"] .status`
    );

    if (toggleInput.checked) {
      if (statusEl) statusEl.textContent = 'on';
      toggleInput.setAttribute('aria-checked', true);
    } else {
      toggleInput.setAttribute('aria-checked', false);
      if (statusEl) statusEl.textContent = 'off';
    }
  });
});

/**
 * Set GitHub Contributors
 */

fetch('https://api.github.com/repos/jayadeep14/text-to-handwriting/contributors')
  .then((res) => {
    if (!res.ok) {
      throw new Error(`GitHub contributors request failed: ${res.status}`);
    }
    return res.json();
  })
  .then((res) => {
    const contributorsEl = document.querySelector('#project-contributors');
    if (!contributorsEl || !Array.isArray(res)) return;

    contributorsEl.innerHTML = res
      .map(
        (contributor) => /* html */ `
        <div class="contributor-profile shadow">
          <a href="${contributor.html_url}">
            <img 
              alt="GitHub avatar of contributor ${contributor.login}" 
              class="contributor-avatar" 
              loading="lazy" 
              src="${contributor.avatar_url}" 
            />
            <div class="contributor-username">${contributor.login}</div>
          </a>
        </div>
      `
      )
      .join('');
  })
  .catch((error) => console.error('Could not load GitHub contributors.', error));
