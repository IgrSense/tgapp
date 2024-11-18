let tg = window.Telegram.WebApp;
tg.expand();

// Инициализация Mapbox
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN'; // Получите токен на mapbox.com

// Текущие координаты
let currentLocation = {
    lat: null,
    lng: null
};

// Инициализация карты
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [37.6156, 55.7522], // Москва по умолчанию
    zoom: 12
});

// Мини-карта
const miniMap = new mapboxgl.Map({
    container: 'mini-map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [37.6156, 55.7522],
    zoom: 12,
    interactive: false
});

// Маркер машины
let carMarker = null;

// Получение текущей геолокации
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            currentLocation.lat = position.coords.latitude;
            currentLocation.lng = position.coords.longitude;
            
            // Обновляем карты
            map.setCenter([currentLocation.lng, currentLocation.lat]);
            miniMap.setCenter([currentLocation.lng, currentLocation.lat]);
            
            // Добавляем маркер
            if (carMarker) carMarker.remove();
            carMarker = new mapboxgl.Marker()
                .setLngLat([currentLocation.lng, currentLocation.lat])
                .addTo(map);
            
            new mapboxgl.Marker()
                .setLngLat([currentLocation.lng, currentLocation.lat])
                .addTo(miniMap);
        });
    }
}

// Сохранение локации машины
function saveCarLocation() {
    if (currentLocation.lat && currentLocation.lng) {
        const data = {
            type: 'car_location',
            location: currentLocation
        };
        tg.sendData(JSON.stringify(data));
        tg.showAlert('Локация машины сохранена!');
    }
}

// Анимация для элементов
function animateElements() {
    const elements = document.querySelectorAll('.car-card, .stats-card, .user-card');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
}

// Переключение между видами
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.dataset.tab === 'dashboard') {
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('map').style.display = 'none';
        } else if (btn.dataset.tab === 'map') {
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('map').style.display = 'block';
            map.resize();
        }
    });
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    getCurrentLocation();
    animateElements();
    
    // Добавляем кнопку на MainButton
    tg.MainButton.setText('Сохранить локацию');
    tg.MainButton.onClick(saveCarLocation);
    tg.MainButton.show();
});

// Обновление темы
function updateTheme() {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor);
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.buttonColor);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.buttonTextColor);
}

updateTheme(); 