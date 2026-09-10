let modalOkHandler = null;
let modalCancelHandler = null;

function closeModal() {
  const modal = document.getElementById('customModal');
  modal.style.display = 'none';
  const okBtn = document.getElementById('modalOkBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');
  if (modalOkHandler) {
    okBtn.removeEventListener('click', modalOkHandler);
    modalOkHandler = null;
  }
  if (modalCancelHandler) {
    cancelBtn.removeEventListener('click', modalCancelHandler);
    modalCancelHandler = null;
  }
}

function showAlert(message, onClose) {
  closeModal();

  const modal = document.getElementById('customModal');
  const okBtn = document.getElementById('modalOkBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');

  document.getElementById('modalMessage').textContent = message;
  okBtn.textContent = '확인';
  cancelBtn.style.display = 'none';

  modalOkHandler = function () {
    closeModal();
    cancelBtn.style.display = 'inline-block';
    if (onClose) {
      onClose();
    }
  };

  okBtn.addEventListener('click', modalOkHandler);
  modal.style.display = 'flex';
}

function showConfirm(message, onYes, onNo) {
  closeModal();

  const modal = document.getElementById('customModal');
  const okBtn = document.getElementById('modalOkBtn');
  const cancelBtn = document.getElementById('modalCancelBtn');

  document.getElementById('modalMessage').textContent = message;
  okBtn.textContent = '확인';
  cancelBtn.textContent = '취소';
  cancelBtn.style.display = 'inline-block';

  modalOkHandler = function () {
    closeModal();
    if (onYes) {
      onYes();
    }
  };
  modalCancelHandler = function () {
    closeModal();
    if (onNo) {
      onNo();
    }
  };

  okBtn.addEventListener('click', modalOkHandler);
  cancelBtn.addEventListener('click', modalCancelHandler);
  modal.style.display = 'flex';
}
