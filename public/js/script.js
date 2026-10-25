/**
 * ShelfWise - Frontend Client Script
 * Lightweight vanilla JavaScript for Bootstrap 5 interactions.
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Return Modal Handling (Desk & In-line returns)
  const returnModalEl = document.getElementById('returnModal');
  if (returnModalEl) {
    const modalBookTitle = document.getElementById('modalBookTitle');
    const modalMemberName = document.getElementById('modalMemberName');
    const modalDueDate = document.getElementById('modalDueDate');
    const modalIssueId = document.getElementById('modalIssueId');
    const modalReturnForm = document.getElementById('modalReturnForm');
    const modalFineAlert = document.getElementById('modalFineAlert');
    const modalOnTimeAlert = document.getElementById('modalOnTimeAlert');
    const modalDaysLateText = document.getElementById('modalDaysLateText');
    const modalFineCalc = document.getElementById('modalFineCalc');
    const modalFineAmount = document.getElementById('modalFineAmount');

    function populateReturnModal(issueId, title, member, due, daysLate, fine) {
      if (modalIssueId) modalIssueId.value = issueId || '';
      if (modalReturnForm) modalReturnForm.action = '/circulation/return/' + encodeURIComponent(issueId || '');
      if (modalBookTitle) modalBookTitle.textContent = title || '—';
      if (modalMemberName) modalMemberName.textContent = member || '—';
      if (modalDueDate) modalDueDate.textContent = due || '—';

      const days = Number(daysLate) || 0;
      const fineAmt = Number(fine) || (days > 0 ? days * 2 : 0);

      if (days > 0) {
        if (modalFineAlert) modalFineAlert.classList.remove('d-none');
        if (modalOnTimeAlert) modalOnTimeAlert.classList.add('d-none');
        if (modalDaysLateText) {
          modalDaysLateText.textContent = days + (days === 1 ? ' day' : ' days');
        }
        if (modalFineCalc) {
          modalFineCalc.textContent = days + (days === 1 ? ' day' : ' days') + ' × ₹2';
        }
        if (modalFineAmount) {
          modalFineAmount.textContent = fineAmt;
        }
      } else {
        if (modalFineAlert) modalFineAlert.classList.add('d-none');
        if (modalOnTimeAlert) modalOnTimeAlert.classList.remove('d-none');
      }
    }

    returnModalEl.addEventListener('show.bs.modal', function (event) {
      const button = event.relatedTarget;
      if (!button) return;

      const issueId = button.getAttribute('data-issue-id');
      const title = button.getAttribute('data-book-title');
      const member = button.getAttribute('data-member-name');
      const due = button.getAttribute('data-due-date');
      const daysLate = button.getAttribute('data-days-late');
      const fine = button.getAttribute('data-fine');

      populateReturnModal(issueId, title, member, due, daysLate, fine);
    });

    // Auto-open modal if auto-open attribute or URL query param ?issue_id= is present
    const urlParams = new URLSearchParams(window.location.search);
    const targetIssueId = returnModalEl.getAttribute('data-auto-open') || urlParams.get('issue_id');

    if (targetIssueId) {
      const targetBtn = document.querySelector('.return-btn[data-issue-id="' + targetIssueId + '"]');
      if (targetBtn && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        targetBtn.click();
      }
    }
  }

  // 2. Double-Submit Prevention on POST Forms
  const postForms = document.querySelectorAll('form[method="POST"]');
  postForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (form.checkValidity && !form.checkValidity()) {
        return; // Don't disable if form has invalid fields
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        setTimeout(function () {
          submitBtn.disabled = true;
          submitBtn.classList.add('disabled');
        }, 20);
      }
    });
  });

  // 3. Bootstrap Client-side Validation helper (.needs-validation)
  const validationForms = document.querySelectorAll('.needs-validation');
  Array.prototype.slice.call(validationForms).forEach(function (form) {
    form.addEventListener(
      'submit',
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      },
      false
    );
  });
});
