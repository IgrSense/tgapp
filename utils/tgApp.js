export const initTelegramApp = () => {
    const tg = window.Telegram.WebApp;
    
    // Включаем расширение окна на весь экран
    tg.expand();
    
    // Добавляем слушатели событий
    tg.onEvent('viewportChanged', () => {
        const safeArea = tg.safeAreaInset;
        document.documentElement.style.setProperty('--safe-area-top', safeArea.top + 'px');
        document.documentElement.style.setProperty('--safe-area-bottom', safeArea.bottom + 'px');
    });

    return tg;
};

export const requestFullscreen = async () => {
    const tg = window.Telegram.WebApp;
    try {
        await tg.requestFullscreen();
    } catch (error) {
        console.error('Ошибка при переходе в полноэкранный режим:', error);
    }
};

export const exitFullscreen = () => {
    const tg = window.Telegram.WebApp;
    tg.exitFullscreen();
};

export const addToHomeScreen = async () => {
    const tg = window.Telegram.WebApp;
    try {
        const status = await tg.checkHomeScreenStatus();
        if (status.supported) {
            await tg.addToHomeScreen();
        }
    } catch (error) {
        console.error('Ошибка при добавлении на домашний экран:', error);
    }
}; 