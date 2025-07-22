const webcamFeed = document.getElementById("webcamFeed");
const startButton = document.getElementById("startButton");
const countdownOverlay = document.getElementById("countdown");
const photosPreview = document.getElementById("photosPreview");
const downloadButton = document.getElementById("downloadButton");
const printButton = document.getElementById("printButton");
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
  printButton.style.display = "none";
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
    printButton.style.display = "block"; // Show download button
  }
}

// Capture a photo from the webcam feed
function capturePhoto() {
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

// Event listener untuk tombol 'Print Photos'
printButton.addEventListener("click", () => {
  // Pastikan ada foto yang ditangkap sebelum mencoba mencetak
  if (capturedPhotos.length === 0) {
    alert("No photos to print! Please capture photos first.");
    return;
  }

  // Definisi padding dan gap yang sama seperti untuk download
  const PADDING = 20;
  const GAP = 15;

  let totalPhotosHeight = 0;
  let maxWidth = 0;

  const tempImages = [];
  let imagesLoaded = 0;

  // Langkah 1: Memuat ulang gambar yang ditangkap ke objek Image
  capturedPhotos.forEach((photoDataUrl, index) => {
    const img = new Image();
    img.src = photoDataUrl;
    img.onload = () => {
      tempImages[index] = img;
      maxWidth = Math.max(maxWidth, img.width);
      totalPhotosHeight += img.height;
      imagesLoaded++;

      // Setelah semua gambar dimuat
      if (imagesLoaded === capturedPhotos.length) {
        // Langkah 2: Buat kanvas baru untuk menggabungkan gambar untuk dicetak
        const finalCanvasWidth = maxWidth + PADDING * 2;
        const finalCanvasHeight =
          totalPhotosHeight + GAP * (NUMBER_OF_PHOTOS - 1) + PADDING * 2;

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = finalCanvasWidth;
        finalCanvas.height = finalCanvasHeight;
        const finalContext = finalCanvas.getContext("2d");

        // Isi background kanvas dengan warna putih
        finalContext.fillStyle = "white";
        finalContext.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);

        let currentY = PADDING;
        tempImages.forEach((imgToDraw) => {
          const xOffset = PADDING + (maxWidth - imgToDraw.width) / 2;
          finalContext.drawImage(
            imgToDraw,
            xOffset,
            currentY,
            imgToDraw.width,
            imgToDraw.height
          );
          currentY += imgToDraw.height + GAP;
        });

        // Langkah 3: Konversi kanvas menjadi Data URL (gambar base64)
        const dataURL = finalCanvas.toDataURL("image/png");

        // Langkah 4: Buka jendela browser baru khusus untuk pencetakan
        const printWindow = window.open("", "_blank");

        // Tuliskan HTML dasar ke jendela baru dengan tag <img> berisi gambar Anda
        printWindow.document.write("<html><head><title>Print Photos</title>");
        printWindow.document.write("<style>");
        // CSS untuk memastikan gambar tampil optimal di halaman cetak
        printWindow.document.write(
          "body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: white; }"
        );
        printWindow.document.write(
          "img { max-width: 100%; height: auto; display: block; }"
        );
        printWindow.document.write(
          "@media print { body { background-color: white; } img { width: 100%; height: auto; page-break-after: always; } }"
        );
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");
        // Langkah 5: Panggil window.print() setelah gambar dimuat, lalu tutup jendela setelah dicetak/dibatalkan
        printWindow.document.write(
          '<img src="' +
            dataURL +
            '" onload="window.print(); window.onafterprint = function() { window.close(); }"/>'
        );
        printWindow.document.write("</body></html>");
        printWindow.document.close();
      }
    };
  });
});

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
