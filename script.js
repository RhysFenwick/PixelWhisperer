////////////////////////////////////////
// Colour-selecting tools
////////////////////////////////////////

// Object listing common colours
const colorList = {
  "FF0000": "Red",
  "00FFFF": "Cyan",
  "0000FF": "Blue",
  "00008B": "Dark Blue",
  "ADD8E6": "Light Blue",
  "800080": "Purple",
  "FFFF00": "Yellow",
  "00FF00": "Lime",
  "FF00FF": "Magenta",
  "FFC0CB": "Pink",
  "FFFFFF": "White",
  "C0C0C0": "Silver",
  "808080": "Grey",
  "000000": "Black",
  "FFA500": "Orange",
  "A52A2A": "Brown",
  "800000": "Maroon",
  "008000": "Green",
  "808000": "Olive",
  "7FFFD4": "Aquamarine",
  "FF4500": "Orange-Red",
  "FF8C00": "Dark Orange",
  "FFB6C1": "Light Pink",
  "FF69B4": "Hot Pink",
  "FF1493": "Deep Pink",
  "8B0000": "Dark Red",
  "DC143C": "Crimson",
  "FFD700": "Gold",
  "FFFFE0": "Light Yellow",
  "F0E68C": "Khaki",
  "BDB76B": "Dark Khaki",
  "EE82EE": "Violet",
  "8A2BE2": "Blue Violet",
  "9400D3": "Dark Violet",
  "4B0082": "Indigo",
  "ADFF2F": "Green-Yellow",
  "32CD32": "Lime Green",
  "98FB98": "Pale Green",
  "006400": "Dark Green",
  "556B2F": "Dark Olive Green",
  "008080": "Teal",
  "E0FFFF": "Light Cyan",
  "4682B4": "Steel Blue",
  "B0C4DE": "Light Steel Blue",
  "191970": "Midnight Blue",
  "D2B48C": "Tan",
  "D2691E": "Chocolate",
  "DAA520": "Golden-Brown",
  "B8860B": "Dark Golden-Brown",
  "D3D3D3": "Light Grey",
  "696969": "Dim Grey",
  "FF7F50": "Soft Orange",
  "FA8072": "Light Red-Orange",
  "FFA07A": "Very Light Red-Orange",
  "A0522D": "Red-Brown",
  "F4A460": "Pale Brown",
  "BC8F8F": "Soft Brown",
  "CD853F": "Warm Brown",
  "DA70D6": "Soft Purple",
  "D8BFD8": "Pale Purple",
  "E6E6FA": "Very Pale Purple",
  "DDA0DD": "Light Purple",
  "DB7093": "Soft Pink-Red",
  "2E8B57": "Dark Green-Blue",
  "3CB371": "Soft Green-Blue",
  "00FF7F": "Bright Green",
  "7FFF00": "Yellow-Green",
  "6495ED": "Soft Blue",
  "1E90FF": "Bright Blue",
  "7B68EE": "Light Blue-Purple",
  "483D8B": "Dark Blue-Purple",
  "708090": "Blue-Grey",
  "2F4F4F": "Dark Blue-Grey",
  "FFDAB9": "Pale Orange",
  "FFE4B5": "Very Pale Yellow",
  "EEE8AA": "Soft Yellow",
  "F5FFFA": "Very Pale Green",
  "F0FFF0": "Pale Green",
  "F0F8FF": "Very Pale Blue",
  "F8F8FF": "Soft White",
  "F5F5DC": "Very Pale Yellow-Brown"
};

const elabList = {
  "51A2F3": "Grey",
  "BCFFFE": "White",
  "C2E5AE": "Pale Yellow",
  "B09835": "Orange",
  "9C6C4D": "Dull Red",
  "6942AF": "Purple",
  "0199FF": "Deep Blue",
  "56F0D5": "Blue Green",
  "BDE142": "Green Yellow",
  "D0C686": "Orange",
  "D7ADC4": "Rose Red",
  "D27DFF": "Purple",
  "00D089": "Green",
  "FAC8FF": "Pink",
  "CDECFF": "Pink/Green"
};

var totalList = {...colorList};


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
function colorDistance(color1, color2) {
    return Math.sqrt(
        Math.pow(color1.r - color2.r, 2) +
        Math.pow(color1.g - color2.g, 2) +
        Math.pow(color1.b - color2.b, 2)
    );
}

// Takes totalList and a sample hex code, returns entry on totalList as array [hex_as_string, name_as_string]
function closestColor(totalList, sample) {
    const sampleRgb = hexToRgb(sample);
    let closestHex = null;
    let closestDistance = Infinity;

    for (const [hex, name] of Object.entries(totalList)) {
        const colorRgb = hexToRgb(hex);
        const distance = colorDistance(sampleRgb, colorRgb);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestHex = hex;
        }
    }

    return [closestHex, totalList[closestHex]];
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

  // ...Amd add all the squares again
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

// On mouseover, captures the page as a canvas then uses getImageData to get RGB of the clicked pixel, calls closestColor, and prints the output to the color_name element.
// Add mousemove event listener to the image
document.getElementById("picker-image").addEventListener("mousemove", function(event) {
    const img = event.target;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to the image dimensions
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Get the clicked pixel's color
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pixelData = ctx.getImageData(x, y, 1, 1).data;

    const hex = rgbToHex(pixelData[0], pixelData[1], pixelData[2]);
    const [colorHex, colorName] = closestColor(totalList, hex);

    // Update the paragraphs with the closest color name and hex code
    document.getElementById("color-name").textContent = `${colorHex} - ${colorName}`;
    document.getElementById("color-hex").textContent = `${hex}`;

    // Update the progress bars with the RGB values
    document.getElementById("red-amount").style.width = `${pixelData[0]*100/255}%`;
    document.getElementById("green-amount").style.width = `${pixelData[1]*100/255}%`;
    document.getElementById("blue-amount").style.width = `${pixelData[2]*100/255}%`;

    // Get magnifying glass pixel colours
    for (var i=0;i<magPixels.length;i++) {
      var magColorComponents = ctx.getImageData((x - (magSize - 1)/2 + i%magSize), (y - (magSize - 1)/2 + i/magSize), 1, 1).data; // Gets x/y coords based on i
      var magColor = rgbToHex(magColorComponents[0],magColorComponents[1],magColorComponents[2]);
      magPixels.item(i).style.backgroundColor = "#" + magColor;
    }
});

// Handles crosshairs moving over image

document.getElementById('picker-image').addEventListener('mousemove', function(event) {
  const imgBox = event.currentTarget.parentElement;
  const rect = imgBox.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const horizontalLine = document.getElementById('horizontal-line');
  const verticalLine = document.getElementById('vertical-line');
  const pixelXY = document.getElementById('pixel-xy');

  horizontalLine.style.top = `${y}px`;
  verticalLine.style.left = `${x}px`;

  pixelXY.textContent = `${Math.round(x)} left, ${Math.round(y)} down`;
});

// Handles selecting pixels in the image

document.getElementById('picker-image').addEventListener('click', function(event) {
  const img = event.target;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions to the image dimensions
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw the image onto the canvas
  ctx.drawImage(img, 0, 0, img.width, img.height);

  // Get the clicked pixel's color
  const rect = img.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const pixelData = ctx.getImageData(x, y, 1, 1).data;

  // Update the pixel-list with the pixel details
  const pixelList = document.getElementById('pixel-list');
  var pixel = document.createElement('li');
  pixel.appendChild(document.createTextNode(`${Math.round(x)}, ${Math.round(y)} - ${rgbToHex(pixelData[0], pixelData[1], pixelData[2])} \n ${closestColor(totalList, rgbToHex(pixelData[0], pixelData[1], pixelData[2]))[1]}`));
  pixelList.appendChild(pixel);
});

// Handles clearing the pixel list - TODO: Add confirmation dialog
document.getElementById('clear-button').addEventListener('click', function() {
  document.getElementById('pixel-list').innerHTML = '';
});

// Handles copying the pixel list to the clipboard
document.getElementById('copy-button').addEventListener('click', function() {
  navigator.clipboard.writeText(pixelListToString());
  // Make the list go grey briefly to indicate it's been copied
  document.getElementById('pixel-list').style.backgroundColor = '#f0f0f0';
  setTimeout(() => {{document.getElementById('pixel-list').style.backgroundColor = 'white';}}, 250);
});

// Handles saving the pixel list to a file
document.getElementById('export-button').addEventListener('click', function() {
  const blob = new Blob([pixelListToString()], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pixel-list.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// Turns the pixel-list into a well-formatted string
function pixelListToString() {
  const pixelList = document.getElementById('pixel-list');
  var pixelText = Array.from(pixelList.children).map(pixel => pixel.textContent).join('?');
  pixelText = pixelText.replaceAll("\n", "-");
  pixelText = pixelText.replaceAll('?', '\n');
  return pixelText;
};


// Allows for image upload
document.getElementById('image-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('picker-image').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Handle image upload
document.getElementById('image-upload').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
    document.getElementById('picker-image').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});
  
// Handle camera capture
const cameraButton = document.getElementById('camera-button');
const closeButton = document.getElementById('camera-close-button');
const video = document.getElementById('camera-preview');
const img = document.getElementById('picker-image');

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
        img.src = canvas.toDataURL('image/png');

        // Stop the video stream and hide the preview - doesn;t seem to work, added proxy above instead.
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
    totalList = {...colorList, ...elabList};
  }
  else {
    // Make normal
    document.getElementById('page-heading').textContent = "Pixel Whisperer - Turn picture colours into words.";
    totalList = {...colorList};
  }
});

// Function to call on page load
function init() {
  // Uncheck ELAB mode
  elabCheck.checked = false;
};
