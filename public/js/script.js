// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.flash-overlay');
  alerts.forEach(alert => {
    setTimeout(() => {
      // Bootstrap 5 uses alert.dispose() to dismiss alert programmatically
      bootstrap.Alert.getOrCreateInstance(alert).close();
    }, 4000); // dismiss after 4 seconds
  });
});
