// 🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸🌸 //

function setupBlogButtons() {
    const blogButtons = document.querySelectorAll('[id^="blogButton"]');
    // Check if we are on a page with blog buttons
    if (!blogButtons.length && !document.getElementById('toggleAllBlogsButton')) {
      // console.log('Blog buttons not found on this page. Skipping setup.');
      return; // Exit if no blog buttons found
    }
  
  
    blogButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const blogNumber = e.target.id.replace('blogButton', '');
        const dots = document.getElementById(`dots${blogNumber}`);
        const moreText = document.getElementById(`more${blogNumber}`);
  
        if (dots && moreText) {
            const isExpanded = dots.style.display === "none";
            // Use inline-block maybe? Check your CSS if 'inline' causes layout issues
            dots.style.display = isExpanded ? "inline" : "none";
            moreText.style.display = isExpanded ? "none" : "inline";
            e.target.innerHTML = isExpanded ? "more!" : "less!";
            e.target.setAttribute('aria-expanded', String(!isExpanded)); // Ensure boolean is string
        } else {
            console.error(`Could not find dots${blogNumber} or more${blogNumber}`);
        }
      });
    });
  
    // Set up toggle all button
    const toggleAllButton = document.getElementById('toggleAllBlogsButton');
    if (toggleAllButton) {
      // Check initial state based on first blog post (assuming consistent start)
      const firstDots = document.getElementById('dots1');
      const initiallyCollapsed = firstDots ? firstDots.style.display !== "none" : true;
      toggleAllButton.textContent = initiallyCollapsed ? "Expand ALL!!" : "Collapse ALL!!";
  
      toggleAllButton.addEventListener('click', () => {
        // Determine if the action should be to expand or collapse
        // Check if *any* are currently collapsed (dots are visible) to decide action
        const shouldExpand = Array.from(document.querySelectorAll('[id^="dots"]'))
                                  .some(dots => dots.style.display !== "none");
  
        blogButtons.forEach(button => {
            const blogNumber = button.id.replace('blogButton', '');
            const dots = document.getElementById(`dots${blogNumber}`);
            const moreText = document.getElementById(`more${blogNumber}`);
  
            if(dots && moreText) {
                dots.style.display = shouldExpand ? "none" : "inline";
                moreText.style.display = shouldExpand ? "inline" : "none";
                button.innerHTML = shouldExpand ? "less!" : "more!";
                button.setAttribute('aria-expanded', String(shouldExpand)); // Set based on action
            }
        });
  
        // Update the toggle all button text based on the action just performed
        toggleAllButton.textContent = shouldExpand ? "Collapse ALL!!" : "Expand ALL!!";
      });
    }
  }