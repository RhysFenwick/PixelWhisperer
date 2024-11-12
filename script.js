////////////////////////////////////////
// Colour-selecting tools
////////////////////////////////////////

// Object listing common colours
const colorList = {
    "FF0000": "Red",
    "00FFFF": "Cyan",
    "0000FF": "Blue",
    "00008B": "DarkBlue",
    "ADD8E6": "LightBlue",
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
    "FF4500": "OrangeRed",
    "FF8C00": "DarkOrange",
    "FFB6C1": "LightPink",
    "FF69B4": "HotPink",
    "FF1493": "DeepPink",
    "8B0000": "DarkRed",
    "DC143C": "Crimson",
    "FFD700": "Gold",
    "FFFFE0": "LightYellow",
    "F0E68C": "Khaki",
    "BDB76B": "DarkKhaki",
    "EE82EE": "Violet",
    "8A2BE2": "BlueViolet",
    "9400D3": "DarkViolet",
    "4B0082": "Indigo",
    "ADFF2F": "GreenYellow",
    "32CD32": "LimeGreen",
    "98FB98": "PaleGreen",
    "006400": "DarkGreen",
    "556B2F": "DarkOliveGreen",
    "008080": "Teal",
    "E0FFFF": "LightCyan",
    "4682B4": "SteelBlue",
    "B0C4DE": "LightSteelBlue",
    "191970": "MidnightBlue",
    "D2B48C": "Tan",
    "D2691E": "Chocolate",
    "DAA520": "Golden-Brown",
    "B8860B": "Dark Golden-Brown",
    "D3D3D3": "LightGray",
    "696969": "DimGray"
};


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

// Takes colorList and a sample hex code, returns entry on colorList as array [hex_as_string, name_as_string]
function closestColor(colorList, sample) {
    const sampleRgb = hexToRgb(sample);
    let closestHex = null;
    let closestDistance = Infinity;

    for (const [hex, name] of Object.entries(colorList)) {
        const colorRgb = hexToRgb(hex);
        const distance = colorDistance(sampleRgb, colorRgb);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestHex = hex;
        }
    }

    return [closestHex, colorList[closestHex]];
}

////////////////////////////////////////
// Webpage interactivity
////////////////////////////////////////

// On click, captures the page as a canvas then uses getImageData to get RGB of the clicked pixel, calls closestColor, and prints the output to the color_name element.
// Add click event listener to the image
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
    const [closestHex, colorName] = closestColor(colorList, hex);

    // Update the paragraphs with the closest color name and hex code
    document.getElementById("color-name").textContent = `${colorName}`;
    document.getElementById("color-hex").textContent = `${hex}`;

    // Update the progress bars with the RGB values
    document.getElementById("red-amount").style.width = `${pixelData[0]*100/255}%`;
    document.getElementById("green-amount").style.width = `${pixelData[1]*100/255}%`;
    document.getElementById("blue-amount").style.width = `${pixelData[2]*100/255}%`;
});

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
