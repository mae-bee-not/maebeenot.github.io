// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

function setupCatExplosion() {
    const button = document.querySelector(".btn-explode-pushable");
    if (button) {
        const audio = document.getElementById("catBOOM"); // Find audio element once
        if (!audio) {
            console.error("Cat explosion audio element #catBOOM not found.");
            return;
        }

        button.addEventListener("click", function () {
            // Ensure audio is ready before playing? Might not be necessary for clicks
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Error playing cat explosion sound:", e)); // Catch potential errors

            // Use requestAnimationFrame for style updates
            requestAnimationFrame(() => {
               // Assuming 'this' refers to the button, might need explicit reference
               button.style.transform = "translateY(-6px)"; // Apply initial press effect immediately?
            });


            setTimeout(() => {
                 requestAnimationFrame(() => {
                    button.style.transform = "translateY(-4px)"; // Return to standard "front" state
                 });
            }, 200); // Adjust timing maybe? Should match CSS transition ideally
        });
    }
}

// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

function calculateAge(birthDate) {
  // Ensure birthDate is a Date object
  if (!(birthDate instanceof Date)) {
      birthDate = new Date(birthDate);
      if (isNaN(birthDate)) { // Check if the date conversion was valid
          console.error("Invalid birthDate provided to calculateAge");
          return "?"; // Return a placeholder
      }
  }

  var now = new Date();
  // Handle potential edge case where birthday is today
  var age = now.getFullYear() - birthDate.getFullYear();
  var monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
}

// Function to setup age calculation display (call this from specific pages)
function setupAgeDisplay() {
    var myBirthday = new Date('2004-10-23'); // Ensure this format is parsed correctly
    var ageElement = document.getElementById('myAge');
    if (ageElement) {
        ageElement.textContent = calculateAge(myBirthday);
    }
}