import { initTelegramApp, requestFullscreen, addToHomeScreen } from './utils/tgApp.js';

document.addEventListener('DOMContentLoaded', () => {
    const tg = initTelegramApp();
    
    // Добавляем кнопки управления в интерфейс
    const controls = document.createElement('div');
    controls.className = 'app-controls';
    controls.innerHTML = `
        <button id="fullscreenBtn" class="control-btn">
            Полный экран
        </button>
        <button id="addToHomeBtn" class="control-btn">
            Добавить на главный экран
        </button>
    `;
    document.body.appendChild(controls);

    // Обработчики событий для кнопок
    document.getElementById('fullscreenBtn').addEventListener('click', requestFullscreen);
    document.getElementById('addToHomeBtn').addEventListener('click', addToHomeScreen);

    // Остальной код вашего приложения...
}); 