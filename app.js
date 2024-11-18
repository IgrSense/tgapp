let tg = window.Telegram.WebApp;

// Инициализация приложения
tg.expand();
tg.MainButton.setText('Главная кнопка');
tg.MainButton.show();

// Обработчик нажатия на главную кнопку
tg.MainButton.onClick(() => {
    sendData();
});

// Функция отправки данных в бот
function sendData() {
    const data = {
        message: "Привет от веб-приложения!"
    };
    tg.sendData(JSON.stringify(data));
    // Закрываем веб-приложение после отправки данных
    tg.close();
}

// Устанавливаем тему
document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor); 