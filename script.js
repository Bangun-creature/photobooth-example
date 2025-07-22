const webcamFeed = document.getElementById("webcamFeed");
const startButton = document.getElementById("startButton");
const countdownOverlay = document.getElementById("countdown");
const photosPreview = document.getElementById("photosPreview");
const downloadButton = document.getElementById("downloadButton");
const hiddenCanvas = document.getElementById("hiddenCanvas");
const context = hiddenCanvas.getContext("2d");

let capturedPhotos = [];
const NUMBER_OF_PHOTOS = 3;
let photoCount = 0;

// Request access to the user's webcam
async function setupWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamFeed.srcObject = stream;
    startButton.disabled = false; // Enable start button once webcam is ready
  } catch (err) {
    console.error("Error accessing webcam: ", err);
    alert(
      "Could not access your webcam. Please ensure you have a camera and grant permissions."
    );
    startButton.disabled = true;
  }
}

// Start the countdown and photo capture process
startButton.addEventListener("click", () => {
  startButton.disabled = true;
  downloadButton.style.display = "none";
  photosPreview.innerHTML = ""; // Clear previous photos
  capturedPhotos = [];
  photoCount = 0;
  takePhotoSequence();
});

// Main sequence for taking photos
function takePhotoSequence() {
  if (photoCount < NUMBER_OF_PHOTOS) {
    let count = 3;
    countdownOverlay.style.display = "flex";
    countdownOverlay.textContent = count;

    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownOverlay.textContent = count;
      } else {
        clearInterval(countdownInterval);
        countdownOverlay.style.display = "none";
        capturePhoto();
        photoCount++;
        setTimeout(takePhotoSequence, 1000); // Wait a bit before next photo or finishing
      }
    }, 1000);
  } else {
    downloadButton.style.display = "block"; // Show download button
  }
}

// Capture a photo from the webcam feed
function capturePhoto() {
  // hiddenCanvas.width = webcamFeed.videoWidth;
  // hiddenCanvas.height = webcamFeed.videoHeight;
  // context.drawImage(webcamFeed, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
  // const photoDataUrl = hiddenCanvas.toDataURL("image/png");
  // capturedPhotos.push(photoDataUrl);
  // displayPhoto(photoDataUrl);

  hiddenCanvas.width = webcamFeed.videoWidth;
  hiddenCanvas.height = webcamFeed.videoHeight;

  // Save the current canvas state (important for transformations)
  context.save();

  // Move the origin to the right edge of the canvas
  context.translate(hiddenCanvas.width, 0);

  // Flip the context horizontally
  context.scale(-1, 1);

  // Draw the image, which will now be flipped
  context.drawImage(webcamFeed, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

  // Restore the canvas state to its original (un-flipped) state
  context.restore();

  const photoDataUrl = hiddenCanvas.toDataURL("image/png");
  capturedPhotos.push(photoDataUrl);
  displayPhoto(photoDataUrl);
}

// Display the captured photo in the preview area
function displayPhoto(photoDataUrl) {
  const img = document.createElement("img");
  img.src = photoDataUrl;
  photosPreview.appendChild(img);
}

// Download all photos combined into one PNG
// downloadButton.addEventListener("click", () => {
//   if (capturedPhotos.length === 0) {
//     alert("No photos to download!");
//     return;
//   }

//   // Calculate total height for the combined image
//   let totalHeight = 0;
//   let maxWidth = 0;

//   // Create temporary images to get their dimensions
//   const tempImages = [];
//   let imagesLoaded = 0;

//   capturedPhotos.forEach((photoDataUrl, index) => {
//     const img = new Image();
//     img.src = photoDataUrl;
//     img.onload = () => {
//       tempImages[index] = img;
//       maxWidth = Math.max(maxWidth, img.width);
//       totalHeight += img.height;
//       imagesLoaded++;

//       if (imagesLoaded === capturedPhotos.length) {
//         // All images loaded, proceed to draw on canvas
//         const finalCanvas = document.createElement("canvas");
//         finalCanvas.width = maxWidth;
//         finalCanvas.height = totalHeight;
//         const finalContext = finalCanvas.getContext("2d");

//         let currentY = 0;
//         tempImages.forEach((imgToDraw) => {
//           // Draw each image, centering it if its width is less than maxWidth
//           const xOffset = (maxWidth - imgToDraw.width) / 2;
//           finalContext.drawImage(
//             imgToDraw,
//             xOffset,
//             currentY,
//             imgToDraw.width,
//             imgToDraw.height
//           );
//           currentY += imgToDraw.height;
//         });

//         const downloadLink = document.createElement("a");
//         downloadLink.href = finalCanvas.toDataURL("image/png");
//         downloadLink.download = "photobooth_combined.png";
//         document.body.appendChild(downloadLink);
//         downloadLink.click();
//         document.body.removeChild(downloadLink);
//       }
//     };
//   });
// });

// ... (kode JavaScript sebelumnya) ...

// Download all photos combined into one PNG
downloadButton.addEventListener("click", () => {
  if (capturedPhotos.length === 0) {
    alert("No photos to download!");
    return;
  }

  // Define padding and gap
  const PADDING = 20; // Padding around the entire combined image
  const GAP = 15; // Gap between each photo

  // Calculate total height for the combined image
  let totalPhotosHeight = 0;
  let maxWidth = 0;

  const tempImages = [];
  let imagesLoaded = 0;

  capturedPhotos.forEach((photoDataUrl, index) => {
    const img = new Image();
    img.src = photoDataUrl;
    img.onload = () => {
      tempImages[index] = img;
      maxWidth = Math.max(maxWidth, img.width);
      totalPhotosHeight += img.height;
      imagesLoaded++;

      if (imagesLoaded === capturedPhotos.length) {
        // All images loaded, proceed to draw on canvas

        // Calculate final canvas dimensions including padding and gaps
        const finalCanvasWidth = maxWidth + PADDING * 2;
        const finalCanvasHeight =
          totalPhotosHeight + GAP * (NUMBER_OF_PHOTOS - 1) + PADDING * 2;

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = finalCanvasWidth;
        finalCanvas.height = finalCanvasHeight;
        const finalContext = finalCanvas.getContext("2d");

        // Set background to white
        finalContext.fillStyle = "white";
        finalContext.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);

        let currentY = PADDING; // Start drawing photos after top padding
        tempImages.forEach((imgToDraw) => {
          // Draw each image, centering it if its width is less than maxWidth
          const xOffset = PADDING + (maxWidth - imgToDraw.width) / 2;
          finalContext.drawImage(
            imgToDraw,
            xOffset,
            currentY,
            imgToDraw.width,
            imgToDraw.height
          );
          currentY += imgToDraw.height + GAP; // Move Y for the next photo, adding the gap
        });

        const downloadLink = document.createElement("a");
        downloadLink.href = finalCanvas.toDataURL("image/png");
        downloadLink.download = "photobooth_combined.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
  });
});

// ... (kode JavaScript setelahnya) ...

// Initialize webcam when the page loads
window.onload = setupWebcam;
