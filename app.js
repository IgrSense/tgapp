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

// Добавляем токен Mapbox (можно использовать дефолтный)
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

// Объекты карт
let map = null;
let miniMap = null;
let carMarker = null;
let parkedLocation = null;
let routeToCarPath = null;

// Инициализация карт
function initMaps() {
    try {
        // Основная карта
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [37.6156, 55.7522], // Москва
            zoom: 12
        });

        // Добавляем контролы
        map.addControl(new mapboxgl.NavigationControl());
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }));

        // Мини-карта
        miniMap = new mapboxgl.Map({
            container: 'mini-map',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [37.6156, 55.7522],
            zoom: 12,
            interactive: false // Отключаем взаимодействие
        });

        // Получаем текущую геолокацию
        getCurrentLocation();
        
    } catch (error) {
        console.error('Ошибка инициализации карт:', error);
        tg.showAlert('Ошибка инициализации карт: ' + error.message);
    }
}

// Обновляем функцию добавления маркера
function addMarker(coords) {
    try {
        // Удаляем старый маркер если есть
        if (carMarker) {
            carMarker.remove();
        }

        // Создаем HTML элемент для маркера
        const el = document.createElement('div');
        el.className = 'car-marker';
        el.innerHTML = '🚗';
        el.style.fontSize = '24px';

        // Создаем новый маркер
        carMarker = new mapboxgl.Marker(el)
            .setLngLat([coords[1], coords[0]])
            .setPopup(new mapboxgl.Popup().setHTML('Ваша машина здесь'))
            .addTo(map);

        // Добавляем маркер на мини-карту
        new mapboxgl.Marker(el.cloneNode(true))
            .setLngLat([coords[1], coords[0]])
            .addTo(miniMap);

    } catch (error) {
        console.error('Ошибка добавления маркера:', error);
    }
}

// Обновляем функцию построения маршрута
async function buildRoute(startPoint, endPoint) {
    try {
        // Получаем маршрут от API Mapbox
        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/walking/${startPoint[1]},${startPoint[0]};${endPoint[1]},${endPoint[0]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const json = await query.json();
        const data = json.routes[0];
        const route = data.geometry.coordinates;

        // Удаляем старый маршрут если есть
        if (map.getSource('route')) {
            map.removeLayer('route');
            map.removeSource('route');
        }

        // Добавляем новый маршрут
        map.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': route
                }
            }
        });

        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#7B61FF',
                'line-width': 6
            }
        });

        // Показываем информацию о маршруте
        const duration = Math.round(data.duration / 60);
        const distance = (data.distance / 1000).toFixed(1);
        tg.showAlert(`Расстояние до машины: ${distance} км\nВремя пешком: ${duration} мин`);

        // Подстраиваем карту под маршрут
        const coordinates = route;
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.fitBounds(bounds, {
            padding: 50
        });

    } catch (error) {
        console.error('Ошибка построения маршрута:', error);
        tg.showAlert('Ошибка построения маршрута: ' + error.message);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initMaps();
    // ... остальной код ...
}); 