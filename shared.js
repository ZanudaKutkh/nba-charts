// shared.js - Общие функции и данные для NBA Charts

// Общие константы
const NBA_COLORS = {
    'dunk': '#FF6B35',
    '3pt_above': '#5DADE2', 
    'corner': '#27AE60',
    'mid': '#E74C3C'
};

const SHOT_TYPE_NAMES = {
    'dunk': 'Данки',
    '3pt_above': 'Трешки с дуги',
    'corner': 'Угловые трешки', 
    'mid': 'Мидрейндж'
};

const KEY_PLAYERS_WITH_SHOTS = [
    { name: 'Evan Mobley', shot_type: 'dunk' },
    { name: 'DeMar DeRozan', shot_type: 'mid' },
    { name: 'Zach LaVine', shot_type: '3pt_above' },
    { name: 'Darius Garland', shot_type: '3pt_above' },
    { name: 'Payton Pritchard', shot_type: '3pt_above' },
    { name: 'Keyonte George', shot_type: '3pt_above' },
    { name: 'Devin Booker', shot_type: '3pt_above' }
];

// Утилиты
const NBA_Utils = {
    // Проверка ключевого игрока
    isKeyPlayer(playerName, shotType) {
        return KEY_PLAYERS_WITH_SHOTS.some(kp => 
            playerName && playerName.includes(kp.name) && shotType === kp.shot_type
        );
    },

    // Расчет очков
    calculatePoints(player) {
        const pointsPerShot = (player.shot_type === '3pt_above' || player.shot_type === 'corner') ? 3 : 2;
        return player.fgm * pointsPerShot;
    },

    // Парсинг CSV для игроков
    parsePlayersCSV(csvText) {
        const lines = csvText.trim().split('\n');
        
        return lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(',');
                return {
                    player_name: values[0],
                    shot_type: values[1],
                    fga: parseInt(values[2]),
                    fgm: parseInt(values[3]),
                    pps: parseFloat(values[4]),
                    fg_pct: parseFloat(values[5]),
                    rate: parseFloat(values[6])
                };
            })
            .filter(row => row.fga >= 100 && row.shot_type !== '3pt_all')
            .map(row => ({
                ...row,
                totalPoints: this.calculatePoints(row)
            }));
    },

    // Парсинг CSV для лиги
    parseLeagueCSV(csvText) {
        const lines = csvText.trim().split('\n');
        
        return lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const values = line.split(',');
                return {
                    season: values[0],
                    shot_type: values[1],
                    fga: parseInt(values[2]),
                    fgm: parseInt(values[3]),
                    pps: parseFloat(values[4]),
                    fg_pct: parseFloat(values[5]),
                    rate: parseFloat(values[6])
                };
            })
            .filter(row => row.shot_type !== '3pt_all');
    },

    // Загрузка данных игроков
    async loadPlayersData() {
        try {
            const response = await fetch('./top50_players_2024.csv');
            const csvText = await response.text();
            return this.parsePlayersCSV(csvText);
        } catch (error) {
            console.error('Ошибка загрузки данных игроков:', error);
            return [];
        }
    },

    // Загрузка данных лиги
    async loadLeagueData() {
        try {
            const response = await fetch('./league_pps_history.csv');
            const csvText = await response.text();
            return this.parseLeagueCSV(csvText);
        } catch (error) {
            console.error('Ошибка загрузки данных лиги:', error);
            return [];
        }
    },

    // Парсинг года из сезона (например "1996-97" -> 1996)
    parseYear(season) {
        return parseInt(season.split('-')[0]);
    },

    // Получение адаптивных размеров графика
    getChartDimensions() {
        const containerWidth = Math.min(window.innerWidth - 40, 1000);
        const containerHeight = Math.min(window.innerHeight * 0.7, 700);
        
        return {
            width: containerWidth,
            height: containerHeight,
            margin: { 
                top: containerHeight * 0.12, 
                right: containerWidth * 0.12, 
                bottom: containerHeight * 0.12, 
                left: containerWidth * 0.08 
            }
        };
    },

    // Создание сетки
    createGrid(g, xScale, yScale, width, height) {
        const xTicks = xScale.ticks(Math.max(4, Math.floor(width / 150)));
        const yTicks = yScale.ticks(Math.max(4, Math.floor(height / 80)));

        // Вертикальные линии сетки
        g.selectAll('.x-grid')
            .data(xTicks)
            .enter()
            .append('line')
            .attr('x1', d => xScale(d))
            .attr('y1', 0)
            .attr('x2', d => xScale(d))
            .attr('y2', height)
            .attr('stroke', '#e8e4df')
            .attr('stroke-width', 1);

        // Горизонтальные линии сетки
        g.selectAll('.y-grid')
            .data(yTicks)
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('y1', d => yScale(d))
            .attr('x2', width)
            .attr('y2', d => yScale(d))
            .attr('stroke', '#e8e4df')
            .attr('stroke-width', 1);
    },

    // Создание осей
    createAxes(g, xScale, yScale, width, height, margin, xLabel, yLabel) {
        // Оси
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('class', 'tick-label');

        g.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .attr('class', 'tick-label');

        // Названия осей
        g.append('text')
            .attr('class', 'axis-label')
            .attr('x', width / 2)
            .attr('y', height + margin.bottom * 0.7)
            .attr('text-anchor', 'middle')
            .text(xLabel);

        g.append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -margin.left * 0.7)
            .attr('text-anchor', 'middle')
            .text(yLabel);
    }
};

// Hover handlers
const NBA_Hover = {
    // Hover для PPS Matrix
    handlePPSMouseOver(event, d) {
        d3.select(event.target)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');

        const hoverInfo = document.getElementById('hover-info');
        hoverInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 1rem;">${d.player_name}</div>
            <div style="color: #bbb; margin-bottom: 12px;">${SHOT_TYPE_NAMES[d.shot_type]}</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.85rem;">
                <div>
                    <div style="font-weight: bold; color: #fff;">${d.pps.toFixed(3)}</div>
                    <div style="color: #aaa;">Очки за бросок</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #fff;">${d.fga}</div>
                    <div style="color: #aaa;">Количество бросков</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #fff;">${d.totalPoints}</div>
                    <div style="color: #aaa;">Всего очков</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #fff;">${(d.fg_pct * 100).toFixed(1)}%</div>
                    <div style="color: #aaa;">Процент попаданий</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #fff;">${(d.rate * 100).toFixed(1)}%</div>
                    <div style="color: #aaa;">Доля бросков</div>
                </div>
            </div>
        `;
        hoverInfo.style.display = 'block';
    },

    // Hover для Evolution
    handleEvolutionMouseOver(event, d, shotType) {
        d3.select(event.target)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');

        const hoverInfo = document.getElementById('hover-info');
        hoverInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 1rem;">${SHOT_TYPE_NAMES[shotType]}</div>
            <div style="color: #bbb; margin-bottom: 12px;">Сезон ${d.season}</div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 0.85rem;">
                <div>
                    <div style="font-weight: bold; color: #fff;">${d.pps.toFixed(3)}</div>
                    <div style="color: #aaa;">Очки за бросок</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #fff;">${(d.rate * 100).toFixed(1)}%</div>
                    <div style="color: #aaa;">Доля от всех бросков</div>
                </div>
            </div>
        `;
        hoverInfo.style.display = 'block';
    },

    // Hover для Stacked Area
    handleStackedMouseOver(event, d) {
        d3.select(event.target)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');

        const hoverInfo = document.getElementById('hover-info');
        hoverInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; font-size: 1rem;">${SHOT_TYPE_NAMES[d.data.shot_type]}</div>
            <div style="color: #bbb; margin-bottom: 12px;">Сезон ${d.data.season}</div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px; font-size: 0.85rem;">
                <div>
                    <div style="font-weight: bold; color: #fff;">${d.data.rate.toFixed(1)}%</div>
                    <div style="color: #aaa;">Доля от всех бросков</div>
                </div>
                <div>
                    <div style="font-weight: bold; color: #fff;">${d.data.pps.toFixed(3)}</div>
                    <div style="color: #aaa;">Очки за бросок</div>
                </div>
            </div>
        `;
        hoverInfo.style.display = 'block';
    },

    // Универсальный mouseout
    handleMouseOut(event) {
        d3.select(event.target)
            .style('filter', 'none');
        
        document.getElementById('hover-info').style.display = 'none';
    }
};

// Функция загрузки D3.js
function loadD3(callback) {
    if (typeof d3 !== 'undefined') {
        callback();
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
    script.onload = callback;
    script.onerror = () => {
        console.error('Ошибка загрузки D3.js');
    };
    document.head.appendChild(script);
}