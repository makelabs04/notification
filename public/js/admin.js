// Admin panel JS utilities
document.addEventListener('DOMContentLoaded', () => {
  // Auto-hide alerts after 5 seconds
  document.querySelectorAll('.alert').forEach(el => {
    setTimeout(() => { el.style.opacity = '0'; }, 5000);
  });

  // Confirm before toggle actions
  document.querySelectorAll('form[action*="/toggle"]').forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Are you sure you want to change this user\'s status?')) {
        e.preventDefault();
      }
    });
  });
});