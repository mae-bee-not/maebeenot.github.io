document.getElementById('cat-explosion').onclick = function() {
  // Move the button down
  this.style.transform = 'translateY(10px)';
  
  // Get the audio element and play the sound
  var audio = document.getElementById('catBOOM');
  audio.play();
  
  // Optional: reset the button position after a delay
  setTimeout(() => {
    this.style.transform = 'translateY(0px)';
  }, 200); // Reset after 200 milliseconds
};



// rainbow mouse cursor

 document.addEventListener('DOMContentLoaded', () => {
    const beeArea = document.querySelector('.bee-area');
    if (beeArea) {
      new cursoreffects.rainbowCursor({
        element: beeArea, // Target the bee-area specifically
        length: 20,
        colors: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'],
        size: 3
      });
    }
  });


//fake bee cursor put on top of rainbow

document.addEventListener('DOMContentLoaded', () => {
  const beeCursor = document.createElement('div');
  beeCursor.style.position = 'fixed';
  beeCursor.style.pointerEvents = 'none'; // Make sure it doesn't interfere with mouse events
  beeCursor.style.zIndex = '1000'; // Keep it on top
  beeCursor.style.width = '57px'; // Width of the cursor image
  beeCursor.style.height = '53px'; // Height of the cursor image
  beeCursor.style.backgroundImage = "url('/coolbugs/minecraft_bee57x53.png')";
  beeCursor.style.backgroundSize = 'contain';
  document.body.appendChild(beeCursor);

  document.addEventListener('mousemove', function(e) {
    // Check if the mouse is over the bee-area
    let beeArea = document.querySelector('.bee-area');
    let rect = beeArea.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
      beeCursor.style.left = e.pageX - 28 + 'px'; // Adjust X coordinate to center the image
      beeCursor.style.top = e.pageY - 26 + 'px'; // Adjust Y coordinate to center the image
      beeCursor.style.display = 'block';
    } else {
      beeCursor.style.display = 'none'; // Hide custom cursor when not over bee-area
    }
  });

  // Initialize the rainbow cursor in the bee-area only
  const beeArea = document.querySelector('.bee-area');
  if (beeArea) {
    new cursoreffects.rainbowCursor({
      element: beeArea,
      length: 10,
      colors: ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'],
      size: 3
    });
  }
});

