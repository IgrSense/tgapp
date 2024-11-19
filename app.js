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

        try {
            const status = await tg.checkHomeScreenStatus();
            if (!status) {
                tg.showAlert("Функция недоступна в текущей версии Telegram");
                return;
            }
            
            if (status.can_add) {
                await tg.addToHomeScreen();
                tg.showAlert("Приложение добавлено на домашний экран!");
            } else {
                tg.showAlert("Невозможно добавить на домашний экран: " + (status.reason || 'неизвестная причина'));
            }
        } catch (error) {
            tg.showAlert("Ошибка проверки статуса: " + error.message);
        }
    } catch (error) {
        tg.showAlert('Ошибка: ' + error.message);
        console.error('Ошибка добавления на домашний экран:', error);
    }
}

// Добавляем функцию для переключения страниц
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // Если открываем карту, обновляем её размер
    if (pageId === 'mapPage' && window.map) {
        window.map.container.fitToViewport();
    }
}

// Добавляем моковые данные
const mockData = {
    history: [
        {
            date: '2024-03-15',
            time: '14:30',
            location: 'Shopping Mall',
            duration: '2h 15m',
            cost: '$45.00'
        },
        {
            date: '2024-03-15',
            time: '10:15',
            location: 'City Center',
            duration: '1h 30m',
            cost: '$32.50'
        },
        {
            date: '2024-03-14',
            time: '19:45',
            location: 'Airport',
            duration: '3h 00m',
            cost: '$67.00'
        }
    ],
    profile: {
        name: 'Jane Cooper',
        avatar: 'https://i.imgur.com/jOjPXr9.jpg',
        stats: {
            totalTrips: 42,
            totalDistance: '1,250 km',
            totalTime: '83h'
        }
    }
};

// Функция для отображения истории
function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    historyList.innerHTML = mockData.history.map(item => `
        <div class="history-item modern animate__animated animate__fadeInUp">
            <div class="history-item-header">
                <div class="history-date">
                    <h3>${item.date}</h3>
                    <p>${item.time}</p>
                </div>
                <div class="history-cost">${item.cost}</div>
            </div>
            <div class="history-details">
                <p class="history-location">${item.location}</p>
                <p class="history-duration">${item.duration}</p>
            </div>
        </div>
    `).join('');
}

// Функция для отображения профиля
function renderProfile() {
    const profileContent = document.querySelector('.profile-content');
    if (!profileContent) return;

    const profile = mockData.profile;
    profileContent.innerHTML = `
        <div class="profile-header modern">
            <img src="${profile.avatar}" alt="${profile.name}" class="profile-avatar">
            <h2>${profile.name}</h2>
        </div>
        <div class="profile-stats modern">
            <div class="stat">
                <h3>${profile.stats.totalTrips}</h3>
                <p>Total Trips</p>
            </div>
            <div class="stat">
                <h3>${profile.stats.totalDistance}</h3>
                <p>Distance</p>
            </div>
            <div class="stat">
                <h3>${profile.stats.totalTime}</h3>
                <p>Drive Time</p>
            </div>
        </div>
    `;
}

// Обновляем обработчики навигации
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

    // Добавляем обработчики для навигационных кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Убираем активный класс со всех кнопок
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Определяем, какую страницу показывать
            const tab = btn.dataset.tab;
            switch(tab) {
                case 'dashboard':
                    switchPage('dashboard');
                    break;
                case 'map':
                    switchPage('mapPage');
                    break;
                case 'history':
                    switchPage('historyPage');
                    break;
                case 'profile':
                    switchPage('profilePage');
                    break;
            }
        });
    });

    // Добавляем обработчик для кнопки "Назад"
    const backToMainBtn = document.getElementById('backToMain');
    if (backToMainBtn) {
        backToMainBtn.addEventListener('click', () => {
            switchPage('dashboard');
            // Обновляем активную кнопку в навигации
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === 'dashboard');
            });
        });
    }

    // Добавляем рендеринг истории и профиля при переключении вкладок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab === 'history') {
                renderHistory();
            } else if (tab === 'profile') {
                renderProfile();
            }
        });
    });
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

// Текущие координаты
let currentLocation = {
    lat: null,
    lng: null
};

// Объекты карт
let map = null;
let miniMap = null;
let carMarker = null;

// Инициализация карт
function initMaps() {
    try {
        // Основная карта
        map = new ymaps.Map('map', {
            center: [55.7522, 37.6156], // Москва
            zoom: 12,
            controls: ['zoomControl']
        });

        // Мини-карта
        miniMap = new ymaps.Map('mini-map', {
            center: [55.7522, 37.6156],
            zoom: 12,
            controls: []
        });

        // Отключаем зум на мини-карте
        miniMap.behaviors.disable(['scrollZoom', 'drag']);
        
        // Получаем текущую геолокацию
        getCurrentLocation();
        
    } catch (error) {
        console.error('Ошибка инициализации карт:', error);
    }
}

// Получение геолокации
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            currentLocation.lat = position.coords.latitude;
            currentLocation.lng = position.coords.longitude;
            
            const coords = [currentLocation.lat, currentLocation.lng];
            
            // Центрируем карты
            if (map && miniMap) {
                map.setCenter(coords);
                miniMap.setCenter(coords);
                
                // Добавляем маркер
                addMarker(coords);
            }
        });
    }
}

// Добавляем маркер на карты
function addMarker(coords) {
    try {
        // Удаляем старый маркер если есть
        if (carMarker) {
            map.geoObjects.remove(carMarker);
            miniMap.geoObjects.remove(carMarker);
        }

        // Создаем новый маркер
        carMarker = new ymaps.Placemark(coords, {
            balloonContent: 'Ваша машина здесь'
        }, {
            preset: 'islands#redAutoIcon'
        });

        // Добавляем на обе карты
        map.geoObjects.add(carMarker);
        miniMap.geoObjects.add(carMarker.clone());
    } catch (error) {
        console.error('Ошибка добавления маркера:', error);
    }
}

// Добавляем инициализацию карт при загрузке API
ymaps.ready(() => {
    initMaps();
    
    // Обновляем размер карты при переключении на вкладку с картой
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.tab === 'map') {
            btn.addEventListener('click', () => {
                setTimeout(() => {
                    if (map) {
                        map.container.fitToViewport();
                    }
                }, 100);
            });
        }
    });
}); 