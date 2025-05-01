////////////////////////////////////////
// Declarations and set-up
////////////////////////////////////////

let colourList = {};
let eLabList = {};
let totalList = [];
let zoom = 1;
let inv_zoom = 1; // Zoom used for zooming out - relevant in some ways but not others!

// The x/y coordinates of the selected pixel (zoom-invariant: the bottom right of a 100x100 pic will be 100,100 even when zoomed)
let relativeX = 0;
let relativeY = 0;

const horizontalLine = document.getElementById('horizontal-line');
const verticalLine = document.getElementById('vertical-line');
const pixelXY = document.getElementById('pixel-xy');

const pic = document.getElementById('picker-image');
const original_pic = document.getElementById('original-image'); // Used as a backup for zoom-out
const frame = document.getElementById('picture-frame');
horizontalLine.style.width = `${pic.width}px`;
verticalLine.style.height = `${pic.height}px`;

////////////////////////////////////////
// Set up colour lists
////////////////////////////////////////

fetch('colours.json')
  .then(response => response.json())
  .then(data => {
    colourList = data.colourList;
    eLabList = data.elabList;
    totalList = colourList;
    // Now the global vars are populated and accessible
    console.log("Fetched colours!");
  })
  .catch(error => console.error('Error loading JSON:', error));

// Can reference colourList/eLabList anywhere, but they'll be empty until fetch finishes


////////////////////////////////////////
// Colour-selecting tools
////////////////////////////////////////


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
      const colourRgb = hexToRgb(hex);
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

// Set up magnifying glass & slider
const magGlass = document.getElementById("mag-glass");
const magSlider = document.getElementById("mag-res");

// Add squares
var magSize = 11; // Initial square length of magnifying glass - should be an odd number!
const magPixels = document.getElementById("mag-glass").children; // HTMLCollection is live - will update as mag-glass changes

// Changes the magnifying glass to the chosen resolution
function magZoom() {
  console.log(magSize);
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

magZoom(); // Call magSize as initial setup

// On mouseover, captures the page as a canvas then uses getImageData to get RGB of the clicked pixel, calls closestcolour, and prints the output to the colour_name element.
// Add mousemove event listener to the image
pic.addEventListener("mousemove", function(event) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to the image dimensions
    canvas.width = pic.width;
    canvas.height = pic.height;

    // Draw the image onto the canvas
    ctx.drawImage(pic, 0, 0, pic.width, pic.height);

    // Get the mouseover'ed pixel's colour
    const rect = pic.getBoundingClientRect();
    const x = event.clientX - Math.floor(rect.left);
    const y = event.clientY - Math.floor(rect.top);
    const pixelData = ctx.getImageData(Math.floor(x/zoom), Math.floor(y/zoom), 1, 1).data;

    const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
    const [colourHex, colourName] = closestcolour(totalList, hex);

    // Update the paragraphs with the closest colour name and hex code
    document.getElementById("colour-name").textContent = `${colourHex} - ${colourName}`;
    document.getElementById("colour-hex").textContent = `${hex}`;

    // Update the progress bars with the RGB values
    document.getElementById("red-amount").style.width = `${pixelData[0]*100/255}%`;
    document.getElementById("green-amount").style.width = `${pixelData[1]*100/255}%`;
    document.getElementById("blue-amount").style.width = `${pixelData[2]*100/255}%`;

    // Get magnifying glass pixel colours
    for (var i=0;i<magPixels.length;i++) {
      // These formulae are hideous and need fixing - a mess of edge cases atm
      var magPixelX = (x  - (magSize - 1)/2 + i%magSize)/zoom + Math.floor(zoom/2);
      var magPixelY = (y  - (magSize - 1)/2 + Math.floor(i/magSize))/zoom + Math.floor(zoom/2);

      if (i%magSize < (magSize - 1)/2) {
        magPixelY += (1/zoom)/2;
      }

      var magcolourComponents = ctx.getImageData(magPixelX, magPixelY, 1, 1).data; // Gets x/y coords based on i
      var magcolour = rgbToHex(magcolourComponents[0],magcolourComponents[1],magcolourComponents[2]);
      magPixels.item(i).style.backgroundColor = "#" + magcolour;
    }
});

// Handles crosshairs moving over image
pic.addEventListener('mousemove', function(event) {
  const rect = document.getElementById('img-box').getBoundingClientRect();
  const x = event.offsetX;
  const y = event.offsetY;

  horizontalLine.style.top = `${y*zoom}px`;
  verticalLine.style.left = `${x*zoom}px`;

  pixelXY.textContent = `${x*inv_zoom} right, ${y*inv_zoom} down`;
});

// Handles selecting pixels in the image

pic.addEventListener('click', function(event) {
  const img = event.target;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions to the image dimensions
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // Get the clicked pixel's colour
  const rect = pic.getBoundingClientRect();
  const x = event.clientX - Math.floor(rect.left);
  const y = event.clientY - Math.floor(rect.top);
  const pixelData = ctx.getImageData(Math.floor(x/zoom), Math.floor(y/zoom), 1, 1).data;

  // Update the pixel-list with the pixel details
  const pixelList = document.getElementById('pixel-list');
  const pixel = document.createElement('li');
  const pixel_xy = document.getElementById('pixel-xy').textContent.split(' '); // Array
  pixel.appendChild(document.createTextNode(`${pixel_xy[0]}, ${pixel_xy[2]} - ${rgbToHex(pixelData[0], pixelData[1], pixelData[2])} (${closestcolour(totalList, rgbToHex(pixelData[0], pixelData[1], pixelData[2]))[1]})`));
  pixelList.appendChild(pixel);
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
  document.getElementById('pixel-list').style.backgroundcolor = '#f0f0f0';
  setTimeout(() => {{document.getElementById('pixel-list').style.backgroundcolor = 'white';}}, 250);
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

// General refresh function
function refreshImage() {
  // Lengthen the crosshairs but keep them narrow
  horizontalLine.style.width = `${pic.width*zoom}px`;
  verticalLine.style.height = `${pic.height*zoom}px`;
}

// Handle image upload
document.getElementById('image-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
    pic.src = e.target.result;
    original_pic.src = e.target.result; // Set the backup image to the uploaded one
    refreshImage();
    };
    reader.readAsDataURL(file);
  }
});
  
// Handle camera capture
const cameraButton = document.getElementById('camera-button');
const closeButton = document.getElementById('camera-close-button');
const video = document.getElementById('camera-preview');

// Camera button logic
cameraButton.addEventListener('click', async () => {
  // Prompt user for camera access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.style.display = 'block'; // Show video preview
    closeButton.style.display = 'block'; // Show close button
    cameraButton.textContent = 'Capture Photo';

    cameraButton.onclick = () => {
      if (closeButton.style.display == 'block') { // As a proxy for "is the camera currently active"
        // Create a canvas to capture the current frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Set captured image to the <img> element
        pic.src = canvas.toDataURL('image/png');
        original_pic.src = canvas.toDataURL('image/png'); // Set the backup image to the captured one
        refreshImage();

        // Stop the video stream and hide the preview - doesn't seem to work, added proxy above instead.
        stream.getTracks().forEach(track => track.stop());
        video.style.display = 'none';
        cameraButton.textContent = 'Take Photo'; // Reset button text
      }    
    };
  } catch (error) {
    console.error('Camera access was denied:', error);
  }
});

closeButton.addEventListener('click', async () => {
// Prompt user for camera access
video.style.display = 'none'; // Show video preview
closeButton.style.display = 'none'; // Show close button
cameraButton.textContent = 'Take Photo';
});

// Add magnifying glass slider functionality
magSlider.oninput = function() {
  if (this.value%2) { // If it's odd
    magSize = this.value;
  }
  magZoom();
}

// Listener for ELAB checkbox toggle
const elabCheck = document.getElementById('elab-mode');
elabCheck.addEventListener('change', function() {
  if (elabCheck.checked) {
    // Make ELAB mode
    document.getElementById('page-heading').textContent = "Pixel Whisperer - ELab Mode";
    totalList = eLabList
  }
  else {
    // Make normal
    document.getElementById('page-heading').textContent = "Pixel Whisperer - Turn picture colours into words.";
    totalList = colourList
  }
});

// Listener for zoom functionality
document.querySelectorAll('input[name="zoom"]').forEach(radio => {
  radio.addEventListener('change', function () {
    // Sets zoom
    const selected_zoom = parseFloat(this.value);

    if (selected_zoom < 1) { // Zooming out
      zoom = 1;
      inv_zoom = 1/selected_zoom; // E.g. will be 2 for 0.5x zoom
      downsampleImage(pic,original_pic,inv_zoom);
    }
    else {
      pic.src = original_pic.src; // Reset to original image
      zoom = selected_zoom;
      inv_zoom = 1;
    }


    frame.style.transform = `scale(${zoom})`;
    frame.parentElement.scrollTop = relativeY*zoom;
    frame.parentElement.scrollLeft = relativeX*zoom;
    refreshImage();
  });
});

function downsampleImage(outElement, inElement, zoomout) {
  const w = inElement.naturalWidth;
  const h = inElement.naturalHeight;

  const inputCanvas = document.createElement('canvas');
  const ctx = inputCanvas.getContext('2d');
  inputCanvas.width = w;
  inputCanvas.height = h;
  ctx.drawImage(inElement, 0, 0);

  const inputData = ctx.getImageData(0, 0, w, h).data;

  const outW = Math.floor(w / zoomout);
  const outH = Math.floor(h / zoomout);

  const outputCanvas = document.createElement('canvas');
  const outputCtx = outputCanvas.getContext('2d');
  outputCanvas.width = outW;
  outputCanvas.height = outH;
  const outputImageData = outputCtx.createImageData(outW, outH);
  const outputData = outputImageData.data;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const srcX = x * zoomout;
      const srcY = y * zoomout;
      const srcIndex = (srcY * w + srcX) * 4;
      const dstIndex = (y * outW + x) * 4;

      for (let i = 0; i < 4; i++) {
        outputData[dstIndex + i] = inputData[srcIndex + i]; // copy RGBA
      }
    }
  }

  outputCtx.putImageData(outputImageData, 0, 0);
  outElement.src = outputCanvas.toDataURL();
}




// Function to call on page load
function init() {
  // Uncheck ELAB mode
  elabCheck.checked = false;

  // Make sure the correct zoom radio button is checked
  document.getElementById('zoom-1').click();
};
