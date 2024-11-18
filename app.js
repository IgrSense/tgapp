let tg = window.Telegram.WebApp;
tg.expand();

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
}

// Добавляем маркер на карты
function addMarker(coords) {
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
}

// Получение геолокации
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            currentLocation.lat = position.coords.latitude;
            currentLocation.lng = position.coords.longitude;
            
            const coords = [currentLocation.lat, currentLocation.lng];
            
            // Центрируем карты
            map.setCenter(coords);
            miniMap.setCenter(coords);
            
            // Добавляем маркер
            addMarker(coords);
        });
    }
}

// Переменные для отслеживания времени
let parkingStartTime = null;
let parkingInterval = null;

// Загрузка изображения
function uploadCarImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('carImage').src = event.target.result;
                localStorage.setItem('carImage', event.target.result);
                
                // Добавляем анимацию
                const carCard = document.querySelector('.car-card');
                carCard.classList.add('animate__animated', 'animate__pulse');
                setTimeout(() => {
                    carCard.classList.remove('animate__animated', 'animate__pulse');
                }, 1000);
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Обновление времени парковки
function updateParkingTime() {
    if (parkingStartTime) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - parkingStartTime) / (1000 * 60));
        
        const parkingTimeElement = document.getElementById('parkingTime');
        const totalParkingTimeElement = document.getElementById('totalParkingTime');
        
        parkingTimeElement.textContent = diffInMinutes;
        totalParkingTimeElement.textContent = diffInMinutes;
        
        parkingTimeElement.classList.add('time-update');
        totalParkingTimeElement.classList.add('time-update');
        
        setTimeout(() => {
            parkingTimeElement.classList.remove('time-update');
            totalParkingTimeElement.classList.remove('time-update');
        }, 300);
    }
}

// Сохранение локации
function saveCarLocation() {
    if (currentLocation.lat && currentLocation.lng) {
        parkingStartTime = new Date();
        
        const data = {
            type: 'car_location',
            location: currentLocation,
            parkingStartTime: parkingStartTime.toISOString()
        };
        
        if (parkingInterval) clearInterval(parkingInterval);
        parkingInterval = setInterval(updateParkingTime, 60000);
        
        updateParkingTime();
        tg.sendData(JSON.stringify(data));
        tg.showAlert('Локация машины сохранена!');
    }
}

// UI взаимодействия
document.getElementById('menuBtn').onclick = () => {
    document.getElementById('menuPanel').classList.toggle('active');
};

document.getElementById('searchBtn').onclick = () => {
    document.getElementById('searchPanel').classList.toggle('active');
};

document.getElementById('backToMain').onclick = () => {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
};

// Навигация
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        
        if (tab === 'map') {
            document.getElementById('mapPage').classList.add('active');
            map.container.fitToViewport();
        } else if (tab === 'dashboard') {
            document.getElementById('dashboard').classList.add('active');
        }
    });
});

// Инициализация
ymaps.ready(() => {
    initMaps();
    getCurrentLocation();
    
    const savedImage = localStorage.getItem('carImage');
    if (savedImage) {
        document.getElementById('carImage').src = savedImage;
    }
    
    tg.MainButton.setText('Запомнить где припаркована');
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