// Chart bars animation — IntersectionObserver sur .chart-bar et .mockup-bar
const chartBars = document.querySelectorAll('.chart-bar, .mockup-bar');
const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'none';
            entry.target.offsetHeight; // trigger reflow
            entry.target.style.animation = 'growBar 0.8s ease-out forwards';
        }
    });
}, { threshold: 0.3 });

chartBars.forEach(bar => chartObserver.observe(bar));
