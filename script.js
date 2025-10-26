////////////////////////////////////////
// Declarations and set-up
////////////////////////////////////////

let colourList = {}, eLabList = {}, totalList = [];
let zoom = 1, inv_zoom = 1;
let relativeX = 0, relativeY = 0;
let debugMode = false;  
let fullImageData, fullData; // Will hold the full image data to prevent many calls to getImageData
let brightness = 50; // Default brightness (no change)
let contrast = 50; // Default contrast (no change)
let lastMouseX = 0, lastMouseY = 0; // Last known mouse coords (for when scrolling the image without using a mouse)
let lastCrosshairX = 0, lastCrosshairY = 0; // Similar to lastMouseX/Y but for the crosshair (i.e. relative to viewport not image)
let lastTouchX = 0, lastTouchY = 0; // Similar to lastMouse but for touch
let isZoomAdjusted = false; // Whether zoom has been auto-adjusted yet

const horizontalLine = document.getElementById('horizontal-line');
const verticalLine = document.getElementById('vertical-line');
const pixelXY = document.getElementById('pixel-xy');
const pic = document.getElementById('picker-image');
const original_pic = document.getElementById('original-image'); // Backup image for zooming out
const frame = document.getElementById('picture-frame');
const fence = document.getElementById('image-fence');
const imgbox = document.getElementById('img-box');
const arrowpad = document.getElementById('arrowpad');
const pic_caption = document.getElementById('pic-caption');
horizontalLine.style.width = `${fence.width}px`;
verticalLine.style.height = `${fence.height}px`;
const brightness_slider = document.getElementById('brightness');
const brightness_reset = document.getElementById('brightness-reset');
const contrast_slider = document.getElementById('contrast');
const contrast_reset = document.getElementById('contrast-reset');
const tap_threshold = 10; // Pixel movement needed to become a drag rather than a tap

// Set up canvas; blank until picture load
const canvas = document.createElement("canvas");
const ctx = canvas.getContext('2d', { willReadFrequently: true });

////////////////////////////////////////
// Set up colour lists
////////////////////////////////////////

fetch('colours.json')
  .then(response => response.json())
  .then(data => {
    colourList = convertHexList(data.colourList);
    eLabList = convertHexList(data.elabList);
    totalList = colourList; // Default to full list
    // At this point totalList has the format { colourName: [ { hex: "#FFFFFF", rgb: { r: 255, g: 255, b: 255 } }, ... ], ... }

    // Now the global vars are populated and accessible
    console.log("Fetched colours!");
  })
  .catch(error => console.error('Error loading JSON:', error));

// Can reference colourList/eLabList anywhere, but they'll be empty until fetch finishes


////////////////////////////////////////
// Colour-selecting tools
////////////////////////////////////////

// Used to preconvert hex codes to RGB for the colour distance function
function convertHexList(hexObj) { // Technically takes an object of lists
  const processedList = {};

  for (const [colour, hexCodes] of Object.entries(hexObj)) {
    processedList[colour] = hexCodes.map(hex => {
      const fullHex = hex.startsWith('#') ? hex : `#${hex}`;
      const r = parseInt(fullHex.slice(1, 3), 16);
      const g = parseInt(fullHex.slice(3, 5), 16);
      const b = parseInt(fullHex.slice(5, 7), 16);

      return {
        hex: fullHex.toUpperCase(),
        rgb: { r, g, b }
      };
    });
  }

  console.log(processedList)
  return processedList;
}


// Takes a hex code string, returns three numbers
function hexToRgb(hex) {
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

// Takes three numbers and returns a hex code string
function rgbToHex(r, g, b) {
  const brightnessFactor = brightness / 50; // Convert brightness to a factor between 0 and 2
  const contrastFactor = contrast / 50; // Convert contrast to a factor between 0 and 2
  // Controls for brightness
  r = Math.min(255, Math.floor(r * brightnessFactor));
  g = Math.min(255, Math.floor(g * brightnessFactor));
  b = Math.min(255, Math.floor(b * brightnessFactor));

  // ...Then contrast
  r = Math.min(255, Math.max(0, Math.floor((r - 128) * contrastFactor + 128)));
  g = Math.min(255, Math.max(0, Math.floor((g - 128) * contrastFactor + 128)));
  b = Math.min(255, Math.max(0, Math.floor((b - 128) * contrastFactor + 128)));

  // Returns a hex code string in the format RRGGBB
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Takes two numbers, returns a number
function colourDistance(colour1, colour2) {
  return (
    Math.pow(colour1.r - colour2.r, 2) +
    Math.pow(colour1.g - colour2.g, 2) +
    Math.pow(colour1.b - colour2.b, 2)
  )
}

// Takes totalList and a sample hex code, returns entry on totalList as array [hex_as_string, name_as_string]
function closestcolour(totalList, sample) {
  const sampleRgb = hexToRgb(sample);
  let closestHex = null;
  let closestName = null;
  let closestDistance = Infinity;

  for (const [name, hexList] of Object.entries(totalList)) {
    for (const hex of hexList) {
      const colourRgb = hex.rgb;
      const distance = colourDistance(sampleRgb, colourRgb);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestHex = hex;
        closestName = name;
      }
    }
  }

  return [closestHex, closestName];
}


////////////////////////////////////////
// Webpage interactivity
////////////////////////////////////////

// Set up brightness slider
brightness_slider.oninput = function() { 
  brightness = this.value;
  changeBrightness(); // Call the function to change brightness
}

// Set up brightness reset button
brightness_reset.addEventListener('click', function() {
  brightness_slider.value = 50; // Reset slider to 50
  brightness = 50; // Reset brightness variable
  changeBrightness(); // Call the function to change brightness
})

// Function to change brightness of the image
function changeBrightness() {
  // Brightness will be 1-100, default to 50; need to map 1-50-100 to 0-1-[some high number]
  pic.style.filter = `brightness(${brightness*2}%) contrast(${contrast*2}%)`;
}

// And do the same for contrast

// Set up contrast slider
contrast_slider.oninput = function() { 
  contrast = this.value;
  changeContrast(); // Call the function to change contrast
}

// Set up contrast reset button
contrast_reset.addEventListener('click', function() {
  contrast_slider.value = 50; // Reset slider to 50
  contrast = 50; // Reset contrast variable
  changeContrast(); // Call the function to change contrast
})

// Function to change contrast of the image
function changeContrast() {
  // Contrast will be 1-100, default to 50; need to map 1-50-100 to 0-1-[some high number]
  pic.style.filter = `brightness(${brightness*2}%) contrast(${contrast*2}%)`;
}

// Set up magnifying glass & slider
const magGlass = document.getElementById("mag-glass");
const magSlider = document.getElementById("mag-res");

// Add squares
var magSize = 11; // Initial square length of magnifying glass - should be an odd number!
const magPixels = document.getElementById("mag-glass").children; // HTMLCollection is live - will update as mag-glass changes

// Changes the magnifying glass to the chosen resolution
function magZoom() {
  // Set grid styling as a square
  magGlass.style.gridTemplate = "auto ".repeat(magSize).concat("/ ","auto ".repeat(magSize));

  // Wipe the slate...
  magGlass.innerHTML = '';

  // ...And add all the squares again
  for (var i=0; i<magSize**2;i++) {
    var d = document.createElement("div");
    d.className = "mag-pixel";
    magGlass.appendChild(d)
  }

  // Make central square black-bordered
  magPixels.item((magPixels.length - 1) / 2).style.border = "2px black solid";
  magPixels.item((magPixels.length - 1) / 2).style.borderRadius = "2px";
}

// Add magnifying glass slider functionality
magSlider.oninput = function() {
  if (this.value%2) { // If it's odd
    magSize = this.value;
  }
  magZoom();
}

// Gets pixel data from list (rather than getImageData() being called every time)
function getPixelFromFullData(x, y) {
  x = Math.max(0, Math.min(canvas.width - 1, x));
  y = Math.max(0, Math.min(canvas.height - 1, y));
  const index = (y * canvas.width + x) * 4;
  return [
    fullData[index],     // R
    fullData[index + 1], // G
    fullData[index + 2], // B
    fullData[index + 3], // A
  ];
}

// Triggered on mouse move or arrow keys
function updateFocus() {

  // Make sure variables are clamped as needed
  // Very messy but so be it
  if (lastMouseX < 0) {
    lastMouseX = 0;
  }
  else if (lastCrosshairX > fence.getBoundingClientRect().width) {
    lastCrosshairX = fence.getBoundingClientRect().width;
  }

  if (lastCrosshairY < 0) {
    lastCrosshairY = 0;
  }
  else if (lastCrosshairY > fence.getBoundingClientRect().height) {
    lastCrosshairY = fence.getBoundingClientRect().height;
  }

  if (lastMouseX < 0) {
    lastMouseX = 0;
  }
  else if (lastMouseX > pic.width) {
    lastMouseX = pic.width;
  }

  if (lastMouseY < 0) {
    lastMouseY = 0;
  }
  else if (lastMouseY > pic.height) {
    lastMouseY = pic.height;
  }

  const pixelData = getPixelFromFullData(lastMouseX, lastMouseY);
  const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
  const [colourHex, colourName] = closestcolour(totalList, hex);

  document.getElementById("colour-name").textContent = `${colourHex.hex} - ${colourName}`;
  document.getElementById("colour-hex").textContent = `${hex}`;

  document.getElementById("red-amount").style.width = `${pixelData[0] * 100 / 255}%`;
  document.getElementById("green-amount").style.width = `${pixelData[1] * 100 / 255}%`;
  document.getElementById("blue-amount").style.width = `${pixelData[2] * 100 / 255}%`;

  
  for (let i = 0; i < magPixels.length; i++) {
    const magRow = Math.floor(i / magSize); // Row number in the magnifying glass
    const magCol = i % magSize; // Column number in the magnifying glass

    let magPixelX = Math.floor((lastMouseX - (magSize - 1)/2 + magCol));
    let magPixelY = Math.floor((lastMouseY - (magSize - 1)/2 + magRow));

    const magData = getPixelFromFullData(magPixelX, magPixelY);
    const magColour = rgbToHex(magData[0], magData[1], magData[2]);
    magPixels.item(i).style.backgroundColor = "#" + magColour;
  }

  horizontalLine.style.top = `${lastCrosshairY - 1 + (imgbox.getBoundingClientRect().height - fence.getBoundingClientRect().height)/2}px`;
  verticalLine.style.left = `${lastCrosshairX - 1 + (imgbox.getBoundingClientRect().width - fence.getBoundingClientRect().width)/2}px`;
  pixelXY.textContent = `${Math.ceil(lastMouseX * inv_zoom / zoom)} right, ${Math.ceil(lastMouseY * inv_zoom / zoom)} down`;
  pic_caption.textContent = `This pixel is approximately ${colourName}.`
}

// On mouseover or drag, captures the page as a canvas then uses getPixelFromFullData() to get RGB of the clicked pixel, calls closestcolour, and prints the output to the colour_name element.
function moveOrDrag(x,y) {
  const rect = pic.getBoundingClientRect();
  const fence_rect = fence.getBoundingClientRect();
  lastMouseX = x - Math.floor(rect.left);
  lastMouseY = y - Math.floor(rect.top);
  lastCrosshairX = x - Math.floor(fence_rect.left);
  lastCrosshairY = y - Math.floor(fence_rect.top);
  updateFocus();
}

// Handles selecting pixels in the image
function clickOrTap(tapX,tapY) {
  const rect = pic.getBoundingClientRect();
  const x = tapX - Math.floor(rect.left);
  const y = tapY - Math.floor(rect.top);
  var pixelData;
  if (zoom < 1 ) {
    pixelData = ctx.getImageData(x, y, 1, 1).data;
  }
  else {
    pixelData = ctx.getImageData(Math.floor(x/zoom), Math.floor(y/zoom), 1, 1).data;
  } 

  const pixelList = document.getElementById('pixel-list');
  const pixel = document.createElement('li');
  const pixel_xy = document.getElementById('pixel-xy').textContent.split(' ');
  const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
  const name = closestcolour(totalList, hex)[1];

  // Add colour square to pixel list
  const colourSquare = document.createElement('div');
  colourSquare.className = 'colour-square';
  colourSquare.style.backgroundColor = `#${hex}`;

  pixel.appendChild(document.createTextNode(`${pixel_xy[0]}, ${pixel_xy[2]} - ${hex} (${name})`));
  pixel.appendChild(colourSquare);
  pixelList.appendChild(pixel);

  // Then also move to that point
  moveOrDrag(tapX,tapY);
}

// Mouse listeners
pic.addEventListener("mousemove", function(event) {
  moveOrDrag(event.clientX, event.clientY);
});

pic.addEventListener('click', function(event) {
  clickOrTap(event.clientX, event.clientY);
});

// Touch listener logic
// Touch listeners
pic.addEventListener('touchstart', e => {
  e.preventDefault(); // block page scroll
  const t = e.touches[0];
  lastTouchX = t.clientX;
  lastTouchY = t.clientY;
  moved = false;
}, { passive: false });

pic.addEventListener('touchmove', e => {
  e.preventDefault(); // block page scroll
  const t = e.touches[0];
  if (Math.abs(t.clientX - lastTouchX) > tap_threshold ||
      Math.abs(t.clientY - lastTouchY) > tap_threshold) {
    moved = true;
  }
  moveOrDrag(t.clientX, t.clientY);
}, { passive: false });

pic.addEventListener('touchend', e => {
  e.preventDefault(); // block page scroll
  if (!moved) {
    // Treat as click/tap
    clickOrTap(lastTouchX, lastTouchY);
  }
});

// Pop-up function
function popUp() {
    var popup = document.getElementById("image-popup-text");
  popup.classList.toggle("show");
}

// Pop-up event listener
const imagePopup = document.getElementById("image-popup-icon");
imagePopup.addEventListener('click', function () {
  popUp();
});

////////////////////////////////////////
// Pixel info buttons
////////////////////////////////////////

// Handles clearing the pixel list - TODO: Add confirmation dialog
document.getElementById('clear-button').addEventListener('click', function() {
  document.getElementById('pixel-list').innerHTML = '';
});

// Handles copying the pixel list to the clipboard
document.getElementById('copy-button').addEventListener('click', function() {
  navigator.clipboard.writeText(pixelListToString(document.getElementById('pixel-list')));
  // Make the list go grey briefly to indicate it's been copied
  document.getElementById('pixel-list').style.backgroundColor = '#f0f0f0';
  setTimeout(() => {{document.getElementById('pixel-list').style.backgroundColor = 'white';}}, 250);
});

// Handles saving the pixel list to a CSV
document.getElementById('export-button').addEventListener('click', function() {
  const blob = new Blob([pixelListToCSV(document.getElementById('pixel-list'))], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pixel-list.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// Turns the pixel-list into a well-formatted CSV
function pixelListToCSV(pixelList) {
  const rows = Array.from(pixelList.children).map(pixel => {
    const line = pixel.textContent.trim(); // "472, 211 - D7D243 - Dark Khaki"
    const [coordPart, colour] = line.split(' - ');
    const [x, y] = coordPart.split(',').map(n => n.trim());
    const [hex, name] = colour.split("(");
    return `${x},${y},${hex.trim()},${name.trim().slice(0,-1)}`;
  });

  // Add header
  rows.unshift('X Coord,Y Coord,Hex Code,Colour Name');

  return rows.join('\n');
}

function pixelListToString(pixelList) {
  var pixelText = Array.from(pixelList.children).map(pixel => pixel.textContent).join('?');
  pixelText = pixelText.replaceAll("\n", "-");
  pixelText = pixelText.replaceAll('?', '\n');
  return pixelText;
}

////////////////////////////////////////
// New image buttons
////////////////////////////////////////

// General crosshair refresh function
function refreshCrosshairs() {
  // Lengthen the crosshairs but keep them narrow
  horizontalLine.style.width = `${fence.getBoundingClientRect().width}px`;
  verticalLine.style.height = `${fence.getBoundingClientRect().height}px`;
}

// Handle image upload
document.getElementById('image-upload-button').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      isZoomAdjusted = false; // New image, so reset zoom adjust flag
      pic.src = e.target.result;
      original_pic.src = e.target.result; // Set the backup image to the uploaded one
      updateImageData(); // Update the image data

      refreshCrosshairs();
    };
    reader.readAsDataURL(file);
  }
  window.scrollTo(0,0); // Scroll to top (shouldn't make a difference on PC, but useful on mobile)
});
  
// Handle camera capture
const cameraButton = document.getElementById('camera-button');
const closeButton = document.getElementById('camera-close-button');
const video = document.getElementById('camera-preview');

// Camera button logic
cameraButton.addEventListener('click', async () => {
  // Prompt user for camera access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: {facingMode : 'environment'} });
    video.srcObject = stream;
    video.style.display = 'block'; // Show video preview
    closeButton.style.display = 'block'; // Show close button
    cameraButton.textContent = 'Capture Photo';

    cameraButton.onclick = () => {
      if (closeButton.style.display == 'block') { // As a proxy for "is the camera currently active"
        isZoomAdjusted = false; // New image, so reset zoom adjust flag
        // Create a canvas to capture the current frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Set captured image to the <img> element
        pic.src = canvas.toDataURL('image/png');
        original_pic.src = canvas.toDataURL('image/png'); // Set the backup image to the captured one
        updateImageData(); // Update the image data with new image
        refreshCrosshairs();

        // Stop the video stream and hide the preview - doesn't seem to work, added proxy above instead.
        stream.getTracks().forEach(track => track.stop());
        video.style.display = 'none';
        cameraButton.textContent = 'Take Photo'; // Reset button text
      }    
    };
  } catch (error) {
    console.error('Camera access was denied:', error);
  }
  window.scrollTo(0,0);
});

closeButton.addEventListener('click', async () => {
// Prompt user for camera access
video.style.display = 'none'; // Hide video preview
closeButton.style.display = 'none'; // Hide close button
cameraButton.textContent = 'Take Photo';
});

// ELAB checkbox toggle
const elabCheck = document.getElementById('elab-mode');

// ELAB changer
function elabChanger() {
  if (elabCheck.checked) {
    // Make ELAB mode
    document.getElementById('page-heading').textContent = "Pixel Whisperer (ELAB Mode)";
    totalList = eLabList
  }
  else {
    // Make normal
    document.getElementById('page-heading').textContent = "Pixel Whisperer";
    totalList = colourList
  }
}


// Event listener for ELAB checkbox
elabCheck.addEventListener('change', function() {
  elabChanger();
});

// Listener for people pressing the zoom in or zoom out buttons
document.getElementById('zoom-in').addEventListener('click', function() {
  changeZoom(zoom * 2);
});
document.getElementById('zoom-out').addEventListener('click', function() {
  changeZoom(zoom / 2);
});

// Function to change zoom
function changeZoom(selected_zoom) {
  // selected_zoom can be <1 (zoom out) or >=1 (zoom in)
  zoom = selected_zoom;

  redrawCanvas(original_pic, zoom);

  frame.parentElement.scrollTop = relativeY * zoom;
  frame.parentElement.scrollLeft = relativeX * zoom;
  refreshCrosshairs();

  // Update zoom level display
  document.getElementById('zoom-level').textContent = `x${zoom}`;
}


// Redraws canvas on zoom change
function redrawCanvas(imgElement, zoomFactor) {
  const w = imgElement.naturalWidth;
  const h = imgElement.naturalHeight;

  // Canvas size is scaled by zoom factor (can be <1 or >1)
  canvas.width  = Math.max(1, Math.round(w * zoomFactor));
  canvas.height = Math.max(1, Math.round(h * zoomFactor));

  ctx.imageSmoothingEnabled = false; // nearest-neighbour always
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    imgElement,
    0, 0, w, h,                   // source
    0, 0, canvas.width, canvas.height // destination
  );

  // Update the visible <img>
  pic.src = canvas.toDataURL();

  updateImageData(); // keeps fullData in sync
}


////////////////////////////////////////
// Image/canvas setup
////////////////////////////////////////

function updateImageData() {
fullImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
fullData = fullImageData.data;
}

////////////////////////////////////////
// Debug logic
////////////////////////////////////////

function debug(onOff) {
  debugMode = true;
  // Find the stylesheet (in this case the second one)
  const sheet = document.styleSheets[1];

  let debugClass; // Will become the debug CSS class

  // Loop through the CSS rules to find the target class
  for (let rule of sheet.cssRules) {
    if (rule.selectorText === '.debug') {
      debugClass = rule; // Save the debug class
      break;
    }
  }

  if (onOff) {
    console.log("Debug mode on!");
    debugClass.style.removeProperty('display'); // Empties the debug class, revealing elements
    
  }
  else {
    console.log("Debug mode off!");
    debugClass.style.display = 'none'; // Hides all elements with the debug class
    changeZoom(1); // Resets zoom to 1
  }
}

// Listens for keyboard input to detect debug mode activation and move image

let inputSequence = [];
const debugSequence = ['d', 'e', 'b', 'u', 'g']; // The sequence to trigger debug mode
const hideDebugSequence = ['r', 'e', 's', 'e','t']; // The sequence to hide debug mode

document.addEventListener('keydown', function(event) {
    inputSequence.push(event.key);

    // First, check for image movement
    const step = 1;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault(); // block page scroll
        scrollImage("y",false);
        break;
      case 'ArrowDown':
        event.preventDefault(); // block page scroll
        scrollImage("y",true);
        break;
      case 'ArrowLeft':
        event.preventDefault(); // block page scroll
        scrollImage("x",false);
        break;
      case 'ArrowRight':
        event.preventDefault(); // block page scroll
        scrollImage("x",true);
        break;
    }

    // Then check for hidden codes

    if (inputSequence.length > debugSequence.length) {
        inputSequence.shift(); // Remove the oldest input if it exceeds the target length
    }

    if (inputSequence.join('') === debugSequence.join('')) {
        console.log('Sequence matched!');
        debug(true); // Call the debug function
        inputSequence = []; // Reset sequence after match
    }
    else if (inputSequence.join('') === hideDebugSequence.join('')) {
        console.log('Reset sequence matched!');
        debug(false); // Call the debug function
        inputSequence = []; // Reset sequence after match
    }
});

// Handles moving either the scrollbars or the crosshairs
// Takes string of either 'x' or 'y' and directional bool (true for down/right, false for up/left) plus optional step distance
function scrollImage(axis, increment_up, step=1) {
  let dir = step;
  if (!increment_up) {
    dir *= -1;
  }

  let scrollName;
  if (axis == 'x') {
    scrollName = 'scrollLeft';
    lastMouseX += dir;
  }
  else {
    scrollName = 'scrollTop';
    lastMouseY += dir;
  }

  const before_scroll = frame.parentElement[scrollName]; // Number - should get val not ref
  frame.parentElement[scrollName] += dir;

  if (frame.parentElement[scrollName] == before_scroll) { // No change - scrolling as far as you can!
    if (axis == 'x') {
    lastCrosshairX += dir;
    }
    else {
      lastCrosshairY += dir;
    }
  }

  updateFocus();
}

// Runs it initially
if (!(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) { // Real
  console.log("Removing debug features");
  debug(false); // Turn off debug mode
}
else { // It is in debug mode
  debug(true);
  document.documentElement.style.background = '#222222';
}

////////////////////////////////////////
// Initisalisation
////////////////////////////////////////

// Bind/set up arrow pad
function initArrowPad() {
  document.getElementById("up").addEventListener("click", () => scrollImage("y", false, 1));
  document.getElementById("down").addEventListener("click", () => scrollImage("y", true, 1));
  document.getElementById("left").addEventListener("click", () => scrollImage("x", false, 1));
  document.getElementById("right").addEventListener("click", () => scrollImage("x", true, 1));

  document.getElementById("fast-up").addEventListener("click", () => scrollImage("y", false, 5));
  document.getElementById("fast-down").addEventListener("click", () => scrollImage("y", true, 5));
  document.getElementById("fast-left").addEventListener("click", () => scrollImage("x", false, 5));
  document.getElementById("fast-right").addEventListener("click", () => scrollImage("x", true, 5));
}

// Function to call on page load
function init() {
  // Uncheck ELAB mode by default (and call change function)
  elabCheck.checked = false;
  elabChanger();
  // Do the same for brightness
  brightness_slider.value = 50;
  changeBrightness();
  // ...And contrast
  contrast_slider.value = 50;
  changeContrast();

  // Adjust zoom to fit image in frame
  adjustZoomToFit();

  // Set up magnifying glass
  magZoom();

  // Set up arrow pad
  initArrowPad();

  // Should be called on picture load; duplicating here to make sure it happens the first time as well
  canvas.width = pic.width;
  canvas.height = pic.height;
  ctx.drawImage(pic, 0, 0, pic.width, pic.height);
  updateImageData(); // Initialise the data

  // Start off the crosshair in the middle
  refreshCrosshairs();
  horizontalLine.style.top = `${Math.floor((fence.height)/2)}px`;
  verticalLine.style.left = `${Math.floor((fence.width)/2)}px`;
};

// Called when picture is first loaded
pic.onload = function () {
  canvas.width = pic.width;
  canvas.height = pic.height;
  ctx.drawImage(pic, 0, 0, pic.width, pic.height);
  updateImageData(); // Initialise the data
  if (!isZoomAdjusted) {
    adjustZoomToFit();
  }

  // Start off the crosshair in the middle
  refreshCrosshairs();
  horizontalLine.style.top = `${Math.floor((fence.height)/2)}px`;
  verticalLine.style.left = `${Math.floor((fence.width)/2)}px`;
};

// When a picture is loaded, adjust zoom to whatever level would best fit it in the frame
function adjustZoomToFit() {
  isZoomAdjusted = true;
  // Calculate best fit zoom
  const frameWidth = frame.getBoundingClientRect().width;
  const frameHeight = frame.getBoundingClientRect().height;
  // Zooms must be powers of two (1, 2, 0.5, 0.25, etc)
  const initialWidthRatio = frameWidth / pic.width;
  const initialHeightRatio = frameHeight / pic.height;
  console.log(`Initial dimensions: ${frameWidth} ${frameHeight}`);
  console.log(`Image dimensions: ${pic.width} ${pic.height}`);
  const widthRatio = Math.pow(2, Math.floor(Math.log2(initialWidthRatio)));
  const heightRatio = Math.pow(2, Math.floor(Math.log2(initialHeightRatio)));
  const bestFitZoom = Math.min(widthRatio, heightRatio, 1); // Don't exceed 1x zoom
  changeZoom(bestFitZoom);
  console.log(`Best fit zoom: ${bestFitZoom}`);
};

// See if it's a touch device and offer onscreen options if so
function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

if (isTouchDevice()) {
  console.log("This device supports touch input.");
  // Implement touch-specific logic
  arrowpad.style.display = 'block';

} else {
  console.log("This device does not appear to support touch input.");
  // Implement non-touch-specific logic
}

// Detect window resize
window.addEventListener("resize", function() {
  // Code to execute when the window is resized
  console.log("Window resized!");
  // Example: Get and display current window dimensions
  updateFocus();
  refreshCrosshairs();
});
