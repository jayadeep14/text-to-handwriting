import {
  applyPaperStyles,
  removePaperStyles,
  renderOutput
} from './utils/generate-utils.mjs';
import { createPDF } from './utils/helpers.mjs';

const pageEl = document.querySelector('.page-a');
let outputImages = [];

/**
 * To generate image, we add styles to DIV and convert that HTML Element into Image.
 */
async function convertDIVToImage() {
  const options = {
    scrollX: 0,
    scrollY: -window.scrollY,
    scale: document.querySelector('#resolution').value,
    useCORS: true
  };

  /** html2canvas comes from the library included in index.html */
  const canvas = await html2canvas(pageEl, options);

  /** Send image data for modification if effect is scanner */
  if (document.querySelector('#page-effects').value === 'scanner') {
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    contrastImage(imageData, 0.6);

    canvas.getContext('2d').putImageData(imageData, 0, 0);
  }

  outputImages.push(canvas);

  // Displaying number of images
  if (outputImages.length >= 1) {
    document.querySelector('#output-header').textContent =
      'Output ( ' + outputImages.length + ' )';
  }
}

/**
 * Split HTML content into reasonably safe chunks without
 * creating undefined values.
 *
 * This keeps whitespace because the original code relies on
 * the whitespace while rebuilding the HTML.
 */
function splitHTMLContent(html) {
  return html.split(/(\s+)/).filter((part) => part !== undefined);
}

/**
 * This is the function that gets called on clicking "Generate Image" button.
 */
export async function generateImages() {
  applyPaperStyles();
  pageEl.scroll(0, 0);

  const paperContentEl = document.querySelector(
    '.page-a .paper-content'
  );

  if (!paperContentEl) {
    console.error('Could not find .page-a .paper-content');
    removePaperStyles();
    return;
  }

  const scrollHeight = paperContentEl.scrollHeight;

  // Height of .paper-content when there is no content
  const clientHeight = 514;

  const totalPages = Math.ceil(scrollHeight / clientHeight);

  if (totalPages > 1) {
    /**
     * Warn the user when the content contains images.
     * Images can make HTML-based pagination inaccurate.
     */
    if (paperContentEl.innerHTML.includes('<img')) {
      alert(
        "You're trying to generate more than one page. Images and some formatting may not work correctly with multiple images"
      );
    }

    const initialPaperContent = paperContentEl.innerHTML;

    /**
     * Split the HTML into pieces while preserving whitespace.
     */
    const splitContent = splitHTMLContent(initialPaperContent);

    let wordCount = 0;

    for (let i = 0; i < totalPages; i++) {
      paperContentEl.innerHTML = '';

      const wordArray = [];

      /**
       * Add content until the page becomes taller than
       * the available page height.
       */
      while (
        wordCount < splitContent.length
      ) {
        const nextPart = splitContent[wordCount];

        // Never push undefined into wordArray.
        if (typeof nextPart !== 'string') {
          wordCount++;
          continue;
        }

        wordArray.push(nextPart);

        paperContentEl.innerHTML = wordArray.join('');

        /**
         * If adding this part makes the content exceed
         * the available height, remove that part and
         * leave it for the next page.
         */
        if (paperContentEl.scrollHeight > clientHeight) {
          wordArray.pop();
          paperContentEl.innerHTML = wordArray.join('');
          break;
        }

        wordCount++;
      }

      /**
       * Make sure we don't generate an empty page.
       */
      if (wordArray.length === 0) {
        break;
      }

      let wordString = wordArray.join('');

      /**
       * For pages after the first one, remove content that
       * might have been carried over from the previous page.
       */
      if (i !== 0) {
        let newWord = wordArray[wordArray.length - 1];

        /**
         * IMPORTANT:
         * Check that newWord exists before calling .split().
         * This prevents:
         *
         * TypeError: can't access property "split",
         * newWord is undefined
         */
        if (typeof newWord === 'string') {
          newWord = newWord.split('<br>')[0];

          wordString += newWord;
        }

        if (i !== 1) {
          // Remove everything up to the first space or <br>.
          wordString = wordString.replace(
            /^(.*?)(\s+|<br>)/,
            ''
          );
        }

        wordString = wordString.replace(/^\n/, '');

        if (wordString.startsWith('<br>')) {
          wordString = wordString.substring(4);
        }
      }

      /**
       * Put the page content back into the DOM.
       */
      paperContentEl.innerHTML = wordString;

      pageEl.scrollTo(0, 0);

      /**
       * Generate image for this page.
       */
      await convertDIVToImage();

      /**
       * Restore original content before processing
       * the next page.
       */
      paperContentEl.innerHTML = initialPaperContent;
    }
  } else {
    // Single image
    await convertDIVToImage();
  }

  removePaperStyles();

  renderOutput(outputImages);

  setRemoveImageListeners();
}

/**
 * Delete all generated images.
 */
export const deleteAll = () => {
  outputImages.splice(0, outputImages.length);

  renderOutput(outputImages);

  document.querySelector('#output-header').textContent =
    'Output' +
    (outputImages.length
      ? ' ( ' + outputImages.length + ' )'
      : '');
};

/**
 * Move an item in an array.
 */
const arrayMove = (arr, oldIndex, newIndex) => {
  if (newIndex >= arr.length) {
    let k = newIndex - arr.length + 1;

    while (k--) {
      arr.push(undefined);
    }
  }

  arr.splice(
    newIndex,
    0,
    arr.splice(oldIndex, 1)[0]
  );

  return arr;
};

/**
 * Move generated image left.
 */
export const moveLeft = (index) => {
  if (index === 0) return outputImages;

  outputImages = arrayMove(
    outputImages,
    index,
    index - 1
  );

  renderOutput(outputImages);
};

/**
 * Move generated image right.
 */
export const moveRight = (index) => {
  if (index + 1 === outputImages.length) {
    return outputImages;
  }

  outputImages = arrayMove(
    outputImages,
    index,
    index + 1
  );

  renderOutput(outputImages);
};

/**
 * Downloads generated images as PDF.
 */
export const downloadAsPDF = () => {
  createPDF(outputImages);
};

/**
 * Sets event listeners for close button on output images.
 */
function setRemoveImageListeners() {
  document
    .querySelectorAll(
      '.output-image-container > .close-button'
    )
    .forEach((closeButton) => {
      closeButton.addEventListener('click', (e) => {
        outputImages.splice(
          Number(e.target.dataset.index),
          1
        );

        // Display number of images after deletion.
        if (outputImages.length >= 0) {
          document.querySelector('#output-header').textContent =
            'Output' +
            (outputImages.length
              ? ' ( ' + outputImages.length + ' )'
              : '');
        }

        renderOutput(outputImages);

        // Reattach listeners after output changes.
        setRemoveImageListeners();
      });
    });

  document
    .querySelectorAll('.move-left')
    .forEach((leftButton) => {
      leftButton.addEventListener('click', (e) => {
        moveLeft(Number(e.target.dataset.index));

        renderOutput(outputImages);

        setRemoveImageListeners();
      });
    });

  document
    .querySelectorAll('.move-right')
    .forEach((rightButton) => {
      rightButton.addEventListener('click', (e) => {
        moveRight(Number(e.target.dataset.index));

        renderOutput(outputImages);

        setRemoveImageListeners();
      });
    });
}

/**
 * Modifies image data to add contrast.
 */
function contrastImage(imageData, contrast) {
  const data = imageData.data;

  contrast *= 255;

  const factor =
    (contrast + 255) /
    (255.01 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    data[i] =
      factor * (data[i] - 128) + 128;

    data[i + 1] =
      factor * (data[i + 1] - 128) + 128;

    data[i + 2] =
      factor * (data[i + 2] - 128) + 128;
  }

  return imageData;
}
