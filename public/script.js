// Открытие формы для подтверждения участия
function openModal() {
    const modal = document.getElementById("modal");
    modal.classList.add("show");
    setTimeout(() => {
        document.querySelector("#modal .modal-content").classList.add("show");
    }, 0); // Плавное появление
}

// Закрытие формы для подтверждения участия
function closeModal() {
    const modal = document.getElementById("modal");
    document.querySelector("#modal .modal-content").classList.remove("show");
    setTimeout(() => {
        modal.classList.remove("show");
    }, 100);
}

// Открытие модального окна для сообщения об успешном подтверждении
function openConfirmationModal(message) {
    const confirmationModal = document.getElementById("confirmationModal");
    document.getElementById("confirmationMessage").textContent = message;
    confirmationModal.classList.add("show");
    document.getElementById("firstName").value = "";
    document.getElementById("lastName").value = "";
    setTimeout(() => {
        document.querySelector("#confirmationModal .modal-content").classList.add("show");
    }, 0);
}

// Закрытие модального окна для сообщения об успешном подтверждении
function closeConfirmationModal() {
    const confirmationModal = document.getElementById("confirmationModal");
    document.querySelector("#confirmationModal .modal-content").classList.remove("show");
    setTimeout(() => {
        confirmationModal.classList.remove("show");
    }, 100);
}

// Обработчик формы подтверждения участия
document.getElementById("confirmationForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("firstName").value;
    const surname = document.getElementById("lastName").value;

    // Отправка данных на backend
    fetch('/api/confirm-attendance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, surname })
    })
    .then(response => response.json())
    .then(data => {
        closeModal(); // Закрываем форму
        openConfirmationModal(data.message || "Спасибо за подтверждение!"); // Открываем модальное окно для сообщения
    })
    .catch(error => {
        console.error('Ошибка:', error);
        openConfirmationModal("Произошла ошибка. Попробуйте снова.");
    });
});
