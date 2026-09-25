/* Runs before first paint: apply the saved text size so the page doesn't jump. */
try { var s = localStorage.getItem('vb-text'); if (s === 'lg' || s === 'xl') document.documentElement.dataset.text = s; } catch (e) {}
document.documentElement.classList.add('js');
