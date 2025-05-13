document.addEventListener('DOMContentLoaded', () => {
    const burgerMenuButton = document.querySelector('.burger-menu');
    const overlayMenu = document.getElementById('overlayMenu');
    const closeMenuButton = document.querySelector('.close-menu');
    const overlayLinks = document.querySelectorAll('.overlay-content a'); // Select all links in overlay

    if (burgerMenuButton && overlayMenu && closeMenuButton) {
        // Toggle overlay with burger button
        burgerMenuButton.addEventListener('click', () => {
            overlayMenu.classList.toggle('active');
            // Toggle ARIA attribute for accessibility
            const isExpanded = burgerMenuButton.getAttribute('aria-expanded') === 'true';
            burgerMenuButton.setAttribute('aria-expanded', !isExpanded);
        });

        // Close overlay with close button
        closeMenuButton.addEventListener('click', () => {
            overlayMenu.classList.remove('active');
            burgerMenuButton.setAttribute('aria-expanded', 'false'); // Reset ARIA on close
        });

        // Close overlay when a link inside it is clicked (optional but good UX)
        overlayLinks.forEach(link => {
            link.addEventListener('click', () => {
                overlayMenu.classList.remove('active');
                burgerMenuButton.setAttribute('aria-expanded', 'false'); // Reset ARIA on link click
            });
        });

        // Optional: Close overlay if user clicks outside the content area
        // overlayMenu.addEventListener('click', (event) => {
        //     // Check if the click is directly on the overlay background, not on its content
        //     if (event.target === overlayMenu) {
        //          overlayMenu.classList.remove('active');
        //          burgerMenuButton.setAttribute('aria-expanded', 'false');
        //     }
        // });

    } else {
        console.error("Burger menu, overlay, or close button elements not found!");
    }
});