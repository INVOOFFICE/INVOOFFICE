// FAQ toggle + Mobile menu
export function toggleFaq(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');

    document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
    });

    if (!isActive) {
        item.classList.add('active');
    }
}

export function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    const btn = document.querySelector('.mobile-menu-btn');
    const isOpen = nav.classList.toggle('active');
    btn.textContent = isOpen ? '✕' : '☰';
    btn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu, { once: true });
        });
    }
}

function closeMobileMenu() {
    const nav = document.querySelector('.nav-links');
    const btn = document.querySelector('.mobile-menu-btn');
    nav.classList.remove('active');
    btn.textContent = '☰';
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

window.toggleFaq = toggleFaq;
window.toggleMobileMenu = toggleMobileMenu;
