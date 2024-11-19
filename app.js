let tg = window.Telegram.WebApp;
tg.expand();

// Добавим проверку доступных методов
console.log('Доступные методы WebApp:', Object.keys(tg));
console.log('Версия WebApp:', tg.version);

// Функции для работы с localStorage
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        return false;
    }
}

function loadFromLocalStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
        return null;
    }
}

// Обновляем функции для работы с полноэкранным режимом и домашним экраном
async function toggleFullscreen() {
    try {
        console.log('isFullscreen доступен:', 'isFullscreen' in tg);
        console.log('requestFullscreen доступен:', 'requestFullscreen' in tg);
        console.log('exitFullscreen доступен:', 'exitFullscreen' in tg);
        
        if (!('requestFullscreen' in tg)) {
            tg.showAlert("Функция полного экрана пока не поддерживается в этой версии Telegram");
            return;
        }

        if (!tg.isFullscreen) {
            tg.showAlert("Включаем полноэкранный режим...");
            await tg.requestFullscreen();
        } else {
            tg.showAlert("Выключаем полноэкранный режим...");
            await tg.exitFullscreen();
        }
    } catch (error) {
        tg.showAlert('Ошибка: ' + error.message);
        console.error('Ошибка переключения полноэкранного режима:', error);
    }
}

async function addToHomescreen() {
    try {
        console.log('checkHomeScreenStatus доступен:', 'checkHomeScreenStatus' in tg);
        console.log('addToHomeScreen доступен:', 'addToHomeScreen' in tg);
        
        if (!('checkHomeScreenStatus' in tg)) {
            tg.showAlert("Функция добавления на домашний экран пока не поддерживается в этой версии Telegram");
            return;
        }

        const status = await tg.checkHomeScreenStatus();
        console.log('Статус домашнего экрана:', status);
        tg.showAlert("Статус: " + JSON.stringify(status));
        
        if (status.can_add) {
            await tg.addToHomeScreen();
            tg.showAlert("Приложение добавлено на домашний экран!");
        } else {
            tg.showAlert("Невозможно добавить на домашний экран");
        }
    } catch (error) {
        tg.showAlert('Ошибка: ' + error.message);
        console.error('Ошибка добавления на домашний экран:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем наличие элементов перед добавлением обработчиков
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const homeScreenBtn = document.getElementById('homeScreenBtn');
    const menuBtn = document.getElementById('menuBtn');
    const searchBtn = document.getElementById('searchBtn');
    const menuPanel = document.getElementById('menuPanel');
    const searchPanel = document.getElementById('searchPanel');
    
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFullscreen();
        });
    }
    
    if (homeScreenBtn) {
        homeScreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addToHomescreen();
        });
    }
    
    if (menuBtn && menuPanel) {
        menuBtn.onclick = () => {
            menuPanel.classList.toggle('active');
        };
    }
    
    if (searchBtn && searchPanel) {
        searchBtn.onclick = () => {
            searchPanel.classList.toggle('active');
        };
    }
    
    // Инициализируем safe areas
    updateSafeAreas();
});

// Функция обновления safe areas
function updateSafeAreas() {
    const root = document.documentElement;
    const safeArea = tg.safeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };
    const contentSafeArea = tg.contentSafeAreaInset || { top: 0, bottom: 0, left: 0, right: 0 };

    root.style.setProperty('--safe-area-top', `${safeArea.top}px`);
    root.style.setProperty('--safe-area-bottom', `${safeArea.bottom}px`);
    root.style.setProperty('--safe-area-left', `${safeArea.left}px`);
    root.style.setProperty('--safe-area-right', `${safeArea.right}px`);
    
    root.style.setProperty('--content-safe-area-top', `${contentSafeArea.top}px`);
    root.style.setProperty('--content-safe-area-bottom', `${contentSafeArea.bottom}px`);
    root.style.setProperty('--content-safe-area-left', `${contentSafeArea.left}px`);
    root.style.setProperty('--content-safe-area-right', `${contentSafeArea.right}px`);
}

// Добавляем обработчики событий Telegram WebApp
tg.onEvent('fullscreenChanged', () => {
    document.body.classList.toggle('fullscreen', tg.isFullscreen);
    updateSafeAreas();
});

tg.onEvent('safeAreaChanged', updateSafeAreas);
tg.onEvent('contentSafeAreaChanged', updateSafeAreas); 