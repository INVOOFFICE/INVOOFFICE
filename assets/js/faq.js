// FAQ toggle + Mobile menu
export function toggleFaq(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');

    // Close all
    document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
    });

    // Open clicked if wasn't active
    if (!isActive) {
        item.classList.add('active');
    }
}

export function toggleMobileMenu() {
    // Simple alert for demo - in production would toggle a mobile menu
    alert('Menu mobile - En production, ceci ouvrirait un menu latéral responsive');
}

// Attach to window for inline onclick handlers in HTML
window.toggleFaq = toggleFaq;
window.toggleMobileMenu = toggleMobileMenu;
