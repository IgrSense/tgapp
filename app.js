class WaterSimulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.viscosity = 1.0;
        this.particleCount = 1000;
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: 0,
                vy: 0,
                radius: 2
            });
        }
    }

    update() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Гравитация
            particle.vy += 0.1 * this.viscosity;
            
            // Отражение от стен
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -0.5;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -0.5;
            
            // Трение
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        });
    }

    draw() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = '#00f';
            this.ctx.fill();
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    setViscosity(value) {
        this.viscosity = value;
    }

    setParticleCount(value) {
        this.particleCount = value;
        this.init();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('waterCanvas');
    const simulation = new WaterSimulation(canvas);
    
    // Обработчики для слайдеров
    document.getElementById('viscosity').addEventListener('input', (e) => {
        simulation.setViscosity(parseFloat(e.target.value));
    });
    
    document.getElementById('particles').addEventListener('input', (e) => {
        simulation.setParticleCount(parseInt(e.target.value));
    });
    
    simulation.animate();
    
    // Отправка данных в Telegram
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        setInterval(() => {
            const data = {
                type: 'water_simulation',
                parameters: {
                    viscosity: simulation.viscosity,
                    particles: simulation.particleCount
                }
            };
            tg.sendData(JSON.stringify(data));
        }, 5000);
    }
}); 