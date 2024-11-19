let tg = window.Telegram.WebApp;
tg.expand();

// Добавим проверку доступных методов
console.log('Доступные методы WebApp:', Object.keys(tg));
console.log('Версия WebApp:', tg.version);

// Обновляем стили для анимации (добавляем в начало файла после объявления tg)
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { 
            transform: scale(1);
            color: rgba(255, 255, 255, 0.7);
        }
        50% { 
            transform: scale(1.2);
            color: rgba(255, 255, 255, 1);
        }
        100% { 
            transform: scale(1);
            color: rgba(255, 255, 255, 0.7);
        }
    }

    .stat h3.pulse {
        animation: pulse 0.3s ease-in-out;
        transform-origin: center;
    }
`;
document.head.appendChild(style);

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
        if (!tg.isFullscreen) {
            await tg.expand(); // Сначала расширяем окно
            await tg.requestFullscreen();
        } else {
            await tg.exitFullscreen();
        }
    } catch (error) {
        console.error('Ошибка переключения полноэкранного режима:', error);
        tg.showAlert('Ошибка: ' + error.message);
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

// Обновляем моковые данные
const mockData = {
    history: [
        {
            date: '2024-03-15',
            time: '14:30',
            location: 'Shopping Mall',
            duration: '2h 15m',
            cost: '$45.00',
            paid: false
        },
        {
            date: '2024-03-15',
            time: '10:15',
            location: 'City Center',
            duration: '1h 30m',
            cost: '$32.50',
            paid: true
        },
        {
            date: '2024-03-14',
            time: '19:45',
            location: 'Airport',
            duration: '3h 00m',
            cost: '$67.00',
            paid: true
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

// Обновляем функцию отображения истории
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
                <p class="history-location">📍 ${item.location}</p>
                <p class="history-duration">⏱ ${item.duration}</p>
            </div>
            <div class="history-actions">
                ${item.paid 
                    ? '<button class="history-btn paid">✓ Оплачено</button>'
                    : '<button class="history-btn pay" onclick="payHistoryItem(this)">Оплатить</button>'
                }
            </div>
        </div>
    `).join('');

    // Добавляем обработчики для фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterHistory(e.target.textContent.toLowerCase());
        });
    });
}

// Добавляем функцию фильтрации
function filterHistory(filter) {
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
        const isPaid = item.querySelector('.history-btn.paid') !== null;
        switch(filter) {
            case 'paid':
                item.style.display = isPaid ? 'block' : 'none';
                break;
            case 'unpaid':
                item.style.display = !isPaid ? 'block' : 'none';
                break;
            default:
                item.style.display = 'block';
        }
    });
}

// Добавляем функцию оплаты
function payHistoryItem(button) {
    button.classList.remove('pay');
    button.classList.add('paid');
    button.textContent = '✓ Оплачено';
    button.onclick = null;
    
    // Анимация
    button.closest('.history-item').classList.add('animate__animated', 'animate__pulse');
    setTimeout(() => {
        button.closest('.history-item').classList.remove('animate__animated', 'animate__pulse');
    }, 1000);
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

// Добавляем переменные для отслеживания парковки на глобальном уровне
let isParked = false;
let parkingStartTime = null;
let parkingInterval = null;
let currentStats = {
    distance: 57,
    driveTime: 43,
    money: 324
};

// Обновляем функцию анимации чисел
function animateNumber(element, value) {
    if (!element) return;
    
    // Удаляем предыдущий класс анимации
    element.classList.remove('pulse');
    
    // Обновляем значение
    element.textContent = value;
    
    // Форсируем перерисовку
    void element.offsetWidth;
    
    // Добавляем анимацию
    element.classList.add('pulse');
    
    // Удаляем класс после завершения анимации
    setTimeout(() => {
        element.classList.remove('pulse');
    }, 300);
}

// Обновляем функцию обновления статистики
function updateStats() {
    if (!isParked) return;

    const now = new Date();
    const timeDiff = (now - parkingStartTime) / 1000; // разница в секундах

    // Обновляем расстояние (случайное изменение)
    currentStats.distance += Math.random() * 0.1;
    const distanceElement = document.querySelector('.stats-card.modern .stat:nth-child(1) h3');
    if (distanceElement) {
        animateNumber(distanceElement, `${Math.round(currentStats.distance)}km`);
    }

    // Обновляем время
    currentStats.driveTime = Math.floor(timeDiff / 60);
    const timeElement = document.querySelector('.stats-card.modern .stat:nth-child(2) h3');
    if (timeElement) {
        animateNumber(timeElement, `${currentStats.driveTime}min`);
    }

    // Обновляем деньги (1 цент в секунду)
    currentStats.money += 0.01;
    const moneyElement = document.querySelector('.stats-card.modern .stat:nth-child(3) h3');
    if (moneyElement) {
        animateNumber(moneyElement, `$${currentStats.money.toFixed(2)}`);
    }
}

// Обновляем начальные значения
function initializeStats() {
    const distanceElement = document.querySelector('.stats-card.modern .stat:nth-child(1) h3');
    const timeElement = document.querySelector('.stats-card.modern .stat:nth-child(2) h3');
    const moneyElement = document.querySelector('.stats-card.modern .stat:nth-child(3) h3');

    if (distanceElement) distanceElement.textContent = `${Math.round(currentStats.distance)}km`;
    if (timeElement) timeElement.textContent = `${currentStats.driveTime}min`;
    if (moneyElement) moneyElement.textContent = `$${currentStats.money.toFixed(2)}`;
}

// Вызываем инициализацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Обработчики для навигационных кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            switch(tab) {
                case 'dashboard':
                    switchPage('dashboard');
                    break;
                case 'map':
                    switchPage('mapPage');
                    if (map) map.container.fitToViewport();
                    break;
                case 'history':
                    switchPage('historyPage');
                    renderHistory();
                    break;
                case 'profile':
                    switchPage('profilePage');
                    renderProfile();
                    break;
            }
        });
    });

    // Обработчик для кнопки парковки
    const parkBtn = document.getElementById('parkBtn');
    if (parkBtn) {
        parkBtn.addEventListener('click', toggleParking);
    }

    // Обработчик для кнопки навигации
    const navigateBtn = document.getElementById('navigateBtn');
    if (navigateBtn) {
        navigateBtn.addEventListener('click', navigateToCar);
    }

    // Обработчик для кнопки "Назад"
    const backBtn = document.getElementById('backToMain');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            switchPage('dashboard');
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === 'dashboard');
            });
        });
    }

    // Инициализация статистики
    initializeStats();
});

// Обновляем функцию toggleParking
function toggleParking() {
    const parkBtn = document.getElementById('parkBtn');
    const navigateBtn = document.getElementById('navigateBtn');
    
    if (!isParked) {
        // Начинаем парковку
        isParked = true;
        parkingStartTime = new Date();
        
        if (parkBtn) {
            parkBtn.classList.add('active');
            parkBtn.querySelector('.text').textContent = 'Завершить парковку';
        }
        
        // Показываем кнопку навигации
        if (navigateBtn) {
            navigateBtn.style.display = 'flex';
        }
        
        // Запускаем интервал обновления статистики
        if (parkingInterval) clearInterval(parkingInterval);
        parkingInterval = setInterval(updateStats, 1000);
        
        // Сохраняем локацию парковки
        if (currentLocation.lat && currentLocation.lng) {
            parkedLocation = {...currentLocation};
            
            // Добавляем маркер на карты
            addMarker([parkedLocation.lat, parkedLocation.lng]);
            
            // Центрируем мини-карту на месте парковки
            if (miniMap) {
                miniMap.setCenter([parkedLocation.lat, parkedLocation.lng]);
            }
            
            // Отправляем данные в Telegram
            const data = {
                type: 'car_location',
                location: parkedLocation,
                parkingStartTime: parkingStartTime.toISOString()
            };
            tg.sendData(JSON.stringify(data));
            
            // Показываем уведомление
            tg.showAlert('Локация машины сохранена!');
        }
    } else {
        // Завершаем парковку
        isParked = false;
        clearInterval(parkingInterval);
        
        if (parkBtn) {
            parkBtn.classList.remove('active');
            parkBtn.querySelector('.text').textContent = 'Припарковаться';
        }
        
        // Скрываем кнопку навигации
        if (navigateBtn) {
            navigateBtn.style.display = 'none';
        }
        
        // Очищаем локацию парковки
        parkedLocation = null;
        
        // Удаляем маркер с карт
        if (carMarker) {
            map.geoObjects.remove(carMarker);
            miniMap.geoObjects.remove(carMarker);
        }
        
        // Добавляем запись в историю
        const historyEntry = {
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].slice(0, 5),
            location: 'Current Location',
            duration: `${currentStats.driveTime}min`,
            cost: `$${currentStats.money.toFixed(2)}`,
            paid: false
        };
        mockData.history.unshift(historyEntry);
        
        // Если открыта страница истории, обновляем её
        if (document.getElementById('historyPage').classList.contains('active')) {
            renderHistory();
        }
    }
}

// Добавляем глобальные переменные для маршрута
let routeToCarPath = null;

// Обновляем функцию navigateToCar
async function navigateToCar() {
    if (!parkedLocation) {
        tg.showAlert('Локация машины не сохранена');
        return;
    }

    // Получаем текущую геопозицию
    try {
        const position = await getCurrentPositionPromise();
        const startPoint = [position.coords.latitude, position.coords.longitude];
        const endPoint = [parkedLocation.lat, parkedLocation.lng];

        // Переключаемся на страницу карты
        switchPage('mapPage');

        // Строим маршрут
        await buildRoute(startPoint, endPoint);
        
        // Центрируем карту чтобы был виден весь маршрут
        if (routeToCarPath) {
            map.setBounds(routeToCarPath.getBounds(), {
                checkZoomRange: true,
                duration: 500
            });
        }
    } catch (error) {
        tg.showAlert('Ошибка построения маршрута: ' + error.message);
    }
}

// Функция для полу��ения геопозиции через Promise
function getCurrentPositionPromise() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Геолокация не поддерживается'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
}

// Функция построения маршрута
async function buildRoute(startPoint, endPoint) {
    if (!ymaps.multiRouter) {
        tg.showAlert('Ошибка: модуль построения маршрута не загружен');
        return;
    }

    // Удаляем предыдущий маршрут если есть
    if (routeToCarPath) {
        map.geoObjects.remove(routeToCarPath);
    }

    return new Promise((resolve, reject) => {
        // Создаем мультимаршрут
        const multiRoute = new ymaps.multiRouter.MultiRoute({
            referencePoints: [startPoint, endPoint],
            params: {
                routingMode: 'pedestrian'
            }
        }, {
            boundsAutoApply: true,
            routeActiveStrokeWidth: 6,
            routeActiveStrokeColor: "#7B61FF",
            routeActiveStrokeStyle: 'solid',
            routeStrokeWidth: 6,
            routeStrokeColor: "#7B61FF",
            routeStrokeStyle: 'solid',
            pinIconFillColor: "#7B61FF",
            wayPointStartIconFillColor: "#4CAF50",
            wayPointFinishIconFillColor: "#FF4B4B",
            wayPointStartIconColor: "#FFFFFF",
            wayPointFinishIconColor: "#FFFFFF",
            viaPointIconRadius: 7,
            viaPointIconFillColor: "#7B61FF",
            viaPointActiveIconFillColor: "#7B61FF",
            viaPointIconColor: "#FFFFFF",
            viaPointDraggable: true,
            pinVisible: true
        });

        // Добавляем маршрут на карту
        map.geoObjects.add(multiRoute);
        routeToCarPath = multiRoute;

        // Подписываемся на события
        multiRoute.model.events.add('requestsuccess', () => {
            const activeRoute = multiRoute.getActiveRoute();
            if (activeRoute) {
                const distance = activeRoute.properties.get("distance").text;
                const duration = activeRoute.properties.get("duration").text;
                tg.showAlert(`Расстояние до машины: ${distance}\nВремя пешком: ${duration}`);
            }
            resolve(multiRoute);
        });

        multiRoute.model.events.add('requestfail', (error) => {
            reject(new Error('Не удалось построить маршрут'));
        });
    });
}

// Обновляем инициализацию карт
function initMaps() {
    try {
        // Основная карта
        map = new ymaps.Map('map', {
            center: [55.7522, 37.6156],
            zoom: 12,
            controls: ['zoomControl', 'routeButtonControl']
        });

        // Добавляем элемент управления поиском
        let searchControl = new ymaps.control.SearchControl({
            options: {
                provider: 'yandex#search',
                size: 'large'
            }
        });
        map.controls.add(searchControl);

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
        tg.showAlert('Ошибка инициализации карт: ' + error.message);
    }
}

// Обновляем загрузку API Яндекс.Карт
ymaps.ready(() => {
    // Загружаем необходимые модули
    ymaps.modules.require([
        'multiRouter.MultiRoute',
        'control.SearchControl',
        'control.ZoomControl',
        'control.RouteButton'
    ]).then(function() {
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
    }).catch(error => {
        console.error('Ошибка загрузки модулей Яндекс.Карт:', error);
        tg.showAlert('Ошибка загрузки карт: ' + error.message);
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

// Получение геолокации
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
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
            },
            error => {
                tg.showAlert('Ошибка получения геолокации: ' + error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        tg.showAlert('Геолокация не поддерживается вашим устройством');
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