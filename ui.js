/* ============================================
   ui.js - UI操作・表示制御
   ============================================ */

/**
 * 画面を切り替える
 */
function showScreen(screenId) {
    // 全スクリーンを非表示
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 指定スクリーンを表示
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
}

/**
 * モーダルを表示
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');
    if (modal) {
        modal.classList.add('active');
    }
    if (overlay) {
        overlay.classList.add('active');
    }
}

/**
 * モーダルを非表示
 */
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modalOverlay');
    if (modal) {
        modal.classList.remove('active');
    }
    if (!document.querySelector('.modal.active') && overlay) {
        overlay.classList.remove('active');
    }
}

/**
 * タブを切り替える
 */
function switchTab(tabName) {
    // 全タブボタンから active を削除
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // クリックされたボタンに active を追加
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // 全タブコンテンツを非表示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 対応するタブコンテンツを表示
    const normalizedTabName = tabName.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    document.getElementById(`${tabName}Tab`)?.classList.add('active');
    document.getElementById(`${normalizedTabName}Tab`)?.classList.add('active');
}

/**
 * ボタンの選択状態を切り替える
 */
function toggleButtonSelection(button) {
    // 同じグループの他のボタンから selected を削除
    const parent = button.parentElement;
    parent?.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // クリックされたボタンに selected を追加
    button.classList.add('selected');
}

/**
 * ストライクゾーンを描画
 */
function drawStrikeZone(containerId, perspective = 'catcher') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const gridSize = 5;
    const cellSize = 60;
    const viewSize = gridSize * cellSize;
    svg.setAttribute('viewBox', `0 0 ${viewSize} ${viewSize}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // グリッドラインを描画
    for (let i = 0; i <= gridSize; i++) {
        const pos = i * cellSize;
        
        // 縦線
        const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vline.setAttribute('x1', pos);
        vline.setAttribute('y1', '0');
        vline.setAttribute('x2', pos);
        vline.setAttribute('y2', viewSize);
        vline.setAttribute('stroke', '#e0e0e0');
        vline.setAttribute('stroke-width', '1');
        svg.appendChild(vline);
        
        // 横線
        const hline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hline.setAttribute('x1', '0');
        hline.setAttribute('y1', pos);
        hline.setAttribute('x2', viewSize);
        hline.setAttribute('y2', pos);
        hline.setAttribute('stroke', '#e0e0e0');
        hline.setAttribute('stroke-width', '1');
        svg.appendChild(hline);
    }

    const strikeZoneFrame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    strikeZoneFrame.setAttribute('x', cellSize);
    strikeZoneFrame.setAttribute('y', cellSize);
    strikeZoneFrame.setAttribute('width', cellSize * 3);
    strikeZoneFrame.setAttribute('height', cellSize * 3);
    strikeZoneFrame.setAttribute('fill', 'none');
    strikeZoneFrame.setAttribute('stroke', '#0066cc');
    strikeZoneFrame.setAttribute('stroke-width', '3');
    svg.appendChild(strikeZoneFrame);
    
    // クリッカブルなセル
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const isStrikeZone = row >= 1 && row <= 3 && col >= 1 && col <= 3;
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            const x = col * cellSize;
            const y = row * cellSize;
            
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', cellSize);
            rect.setAttribute('height', cellSize);
            rect.setAttribute('stroke', 'none');
            rect.setAttribute('class', `zone-cell ${isStrikeZone ? 'strike-zone-cell' : 'ball-zone'}`);
            rect.setAttribute('data-row', row);
            rect.setAttribute('data-col', col);
            rect.setAttribute('data-perspective', perspective);
            rect.style.cursor = 'pointer';
            
            rect.addEventListener('click', (e) => {
                selectCourse(row, col, perspective);
            });
            
            svg.appendChild(rect);
            
            // ラベル
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + (cellSize / 2));
            text.setAttribute('y', y + cellSize - 6);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '8');
            text.setAttribute('fill', '#999');
            text.setAttribute('pointer-events', 'none');
            text.textContent = `${row + 1}-${col + 1}`;
            svg.appendChild(text);
        }
    }
    
    container.appendChild(svg);
}

/**
 * コースを選択
 */
function selectCourse(row, col, perspective) {
    // 前の選択を削除
    document.querySelectorAll('[data-perspective="' + perspective + '"]').forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // 新しい選択を追加
    const selected = document.querySelector(`[data-row="${row}"][data-col="${col}"][data-perspective="${perspective}"]`);
    if (selected) {
        selected.classList.add('selected');
        document.getElementById('selectedCourse').textContent = getCourseName(row, col, 'modern');
        if (typeof selectedCourseData !== 'undefined') {
            selectedCourseData = { row, col, perspective };
        }
    }
}

/**
 * グラウンド図を描画
 */
function drawFieldDiagram(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 320');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // グラウンドの背景
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', '300');
    bg.setAttribute('height', '300');
    bg.setAttribute('fill', '#f0f8ff');
    svg.appendChild(bg);
    
    // ホームベース
    const home = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    home.setAttribute('points', '150,280 145,270 155,270');
    home.setAttribute('fill', '#ffffff');
    home.setAttribute('stroke', '#0066cc');
    home.setAttribute('stroke-width', '2');
    svg.appendChild(home);
    
    // 塁
    const bases = [
        {x: 240, y: 150, name: '一塁'},
        {x: 150, y: 60, name: '二塁'},
        {x: 60, y: 150, name: '三塁'}
    ];
    
    bases.forEach(base => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', base.x - 8);
        rect.setAttribute('y', base.y - 8);
        rect.setAttribute('width', '16');
        rect.setAttribute('height', '16');
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('stroke', '#0066cc');
        rect.setAttribute('stroke-width', '1');
        svg.appendChild(rect);
    });
    
    // ファウルライン
    const foulLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    foulLine1.setAttribute('x1', '150');
    foulLine1.setAttribute('y1', '280');
    foulLine1.setAttribute('x2', '240');
    foulLine1.setAttribute('y2', '150');
    foulLine1.setAttribute('stroke', '#999');
    foulLine1.setAttribute('stroke-width', '1');
    foulLine1.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(foulLine1);
    
    const foulLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    foulLine2.setAttribute('x1', '150');
    foulLine2.setAttribute('y1', '280');
    foulLine2.setAttribute('x2', '60');
    foulLine2.setAttribute('y2', '150');
    foulLine2.setAttribute('stroke', '#999');
    foulLine2.setAttribute('stroke-width', '1');
    foulLine2.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(foulLine2);
    
    // クリッカブルな打球方向ボタン
    const directions = [
        {x: 150, y: 200, name: '投手', value: 'pitcher'},
        {x: 150, y: 248, name: '捕手', value: 'catcher'},
        {x: 225, y: 190, name: '一塁', value: 'first'},
        {x: 186, y: 150, name: '二塁', value: 'second'},
        {x: 76, y: 190, name: '三塁', value: 'third'},
        {x: 116, y: 150, name: '遊撃', value: 'shortstop'},
        {x: 50, y: 115, name: '左翼', value: 'left'},
        {x: 150, y: 70, name: '中堅', value: 'center'},
        {x: 250, y: 115, name: '右翼', value: 'right'},
        {x: 95, y: 95, name: '左中間', value: 'leftCenter'},
        {x: 205, y: 95, name: '右中間', value: 'rightCenter'}
    ];
    
    directions.forEach(dir => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', dir.x);
        circle.setAttribute('cy', dir.y);
        circle.setAttribute('r', '13');
        circle.setAttribute('data-direction', dir.value);
        circle.setAttribute('class', 'field-node');
        circle.style.cursor = 'pointer';
        
        circle.addEventListener('click', () => {
            selectDirection(dir.value, dir.name);
        });
        
        svg.appendChild(circle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', dir.x);
        text.setAttribute('y', dir.y + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '9');
        text.setAttribute('fill', '#0066cc');
        text.setAttribute('pointer-events', 'none');
        text.textContent = dir.name;
        svg.appendChild(text);
    });
    
    container.appendChild(svg);
}

/**
 * 打球方向を選択
 */
function selectDirection(direction, directionName) {
    // 前の選択を削除
    document.querySelectorAll('[data-direction]').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 新しい選択を追加
    const selected = document.querySelector(`[data-direction="${direction}"]`);
    if (selected) {
        selected.classList.add('selected');
        document.getElementById('selectedDirection').textContent = directionName;
        if (typeof selectedDirectionData !== 'undefined') {
            selectedDirectionData = direction;
        }
    }
}

/**
 * 選手をリストに追加（UI表示）
 */
function addPlayerToList(player, listType, isOpponent = false) {
    const listId = isOpponent ? 
        (listType === 'lineup' ? 'opponentTeamLineup' : 'opponentTeamBench') :
        (listType === 'lineup' ? 'ownTeamLineup' : 'ownTeamBench');
    
    const list = document.getElementById(listId);
    if (!list) return;
    
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    playerItem.setAttribute('data-player-id', player.id);
    
    playerItem.innerHTML = `
        <div class="player-item-number">${player.number || '-'}</div>
        <div class="player-item-info">
            <div class="player-item-name">${player.name}</div>
            <div class="player-item-meta">${getBattingName(player.batting)} / ${getPositionName(player.position)}</div>
        </div>
        <div class="player-item-actions">
            <button class="player-item-btn remove" onclick="removePlayerFromList('${player.id}', '${listId}')">削除</button>
        </div>
    `;
    
    list.appendChild(playerItem);
}

/**
 * プレイヤーをリストから削除
 */
function removePlayerFromList(playerId, listId) {
    const item = document.querySelector(`#${listId} [data-player-id="${playerId}"]`);
    if (item) {
        item.remove();
    }
}

/**
 * 投球履歴を表示
 */
function displayPitchHistory(matchData) {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    matchData.pitches.forEach((pitch, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const courseName = pitch.course ? getCourseName(pitch.course.row, pitch.course.col) : '未定義';
        const resultName = getResultName(pitch.result);
        const pitchTypeName = getPitchTypeName(pitch.pitchType);
        
        historyItem.innerHTML = `
            <div class="history-pitch-number">${index + 1}球目</div>
            <div class="history-pitch-info">
                <div class="history-pitch-detail">
                    <span class="history-pitch-label">球種</span>
                    <span class="history-pitch-value">${pitchTypeName}</span>
                </div>
                <div class="history-pitch-detail">
                    <span class="history-pitch-label">球速</span>
                    <span class="history-pitch-value">${pitch.speed || '-'} km/h</span>
                </div>
                <div class="history-pitch-detail">
                    <span class="history-pitch-label">コース</span>
                    <span class="history-pitch-value">${courseName}</span>
                </div>
                <div class="history-pitch-detail">
                    <span class="history-pitch-label">結果</span>
                    <span class="history-pitch-value">${resultName}</span>
                </div>
            </div>
            <div class="history-pitch-info">
                <div class="history-pitch-detail">
                    <span class="history-pitch-label">カウント</span>
                    <span class="history-pitch-value">${pitch.balls}-${pitch.strikes}</span>
                </div>
                <div class="history-pitch-detail" ${pitch.inPlay ? '' : 'style="display: none;"'}>
                    <span class="history-pitch-label">打球種</span>
                    <span class="history-pitch-value">${pitch.hitType ? getHitTypeName(pitch.hitType) : '-'}</span>
                </div>
                <div class="history-pitch-detail" ${pitch.direction ? '' : 'style="display: none;"'}>
                    <span class="history-pitch-label">打球方向</span>
                    <span class="history-pitch-value">${pitch.direction ? getDirectionName(pitch.direction) : '-'}</span>
                </div>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

/**
 * 分析リストを表示
 */
function displayAnalysisList(stats, type = 'batter') {
    const container = type === 'batter' ? 
        document.getElementById('batterList') : 
        document.getElementById('pitcherList');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(stats).forEach(stat => {
        const analysisItem = document.createElement('div');
        analysisItem.className = 'analysis-item';
        
        if (type === 'batter') {
            const avg = calculateBattingAverage(stat.hits, stat.atBats);
            analysisItem.innerHTML = `
                <div class="analysis-item-header">
                    <div class="analysis-item-name">${stat.player.name}</div>
                    <div class="analysis-item-number">#${stat.player.number}</div>
                </div>
                <div class="analysis-item-stats">
                    <div class="stat-row">
                        <span class="stat-label">打席</span>
                        <span class="stat-value">${stat.atBats}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">安打</span>
                        <span class="stat-value">${stat.hits}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">打率</span>
                        <span class="stat-value">${avg}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">三振</span>
                        <span class="stat-value">${stat.strikeouts}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">四球</span>
                        <span class="stat-value">${stat.walks}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">本塁打</span>
                        <span class="stat-value">${stat.homeruns}</span>
                    </div>
                </div>
            `;
        } else {
            analysisItem.innerHTML = `
                <div class="analysis-item-header">
                    <div class="analysis-item-name">${stat.player.name}</div>
                    <div class="analysis-item-number">#${stat.player.number}</div>
                </div>
                <div class="analysis-item-stats">
                    <div class="stat-row">
                        <span class="stat-label">投球数</span>
                        <span class="stat-value">${stat.pitches}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">ストライク</span>
                        <span class="stat-value">${stat.strikes}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">ボール</span>
                        <span class="stat-value">${stat.balls}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">三振</span>
                        <span class="stat-value">${stat.strikeouts}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">四球</span>
                        <span class="stat-value">${stat.walks}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">被安打</span>
                        <span class="stat-value">${stat.hits}</span>
                    </div>
                </div>
            `;
        }
        
        container.appendChild(analysisItem);
    });
}

/**
 * 試合リストを表示
 */
function displayMatchesList() {
    const matches = getCompletedMatches();
    const container = document.getElementById('pastGamesList');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (matches.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">完了した試合がありません</div>';
        return;
    }
    
    matches.forEach(match => {
        const gameItem = document.createElement('div');
        gameItem.className = 'game-item';
        
        const date = formatDate(match.matchInfo.date);
        const score = getScoreDisplay(match.gameState.ownScore, match.gameState.opponentScore);
        
        gameItem.innerHTML = `
            <div class="game-date">${date}</div>
            <div class="game-opponent">${match.ownTeam.name} vs ${match.opponentTeam.name}</div>
            <div class="game-score">${score}</div>
        `;
        
        gameItem.addEventListener('click', () => {
            // 試合を開いて分析画面へ
            document.getElementById('analysisMatchSelect').value = match.id;
            loadMatchAnalysis(match.id);
        });
        
        container.appendChild(gameItem);
    });
}

/**
 * ストライクゾーンに投球をプロット
 */
function plotPitchesOnStrikeZone(containerId, pitches) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const maxCourse = pitches.reduce((max, pitch) => {
        if (!pitch.course) return max;
        return Math.max(max, pitch.course.row, pitch.course.col);
    }, 2);
    const gridSize = Math.max(3, maxCourse + 1);
    const cellSize = 300 / gridSize;
    svg.setAttribute('viewBox', '0 0 300 300');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    
    // グリッド描画
    for (let i = 0; i <= gridSize; i++) {
        const pos = i * cellSize;
        
        const vline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vline.setAttribute('x1', pos);
        vline.setAttribute('y1', '0');
        vline.setAttribute('x2', pos);
        vline.setAttribute('y2', '300');
        vline.setAttribute('stroke', '#e0e0e0');
        vline.setAttribute('stroke-width', '1');
        svg.appendChild(vline);
        
        const hline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hline.setAttribute('x1', '0');
        hline.setAttribute('y1', pos);
        hline.setAttribute('x2', '300');
        hline.setAttribute('y2', pos);
        hline.setAttribute('stroke', '#e0e0e0');
        hline.setAttribute('stroke-width', '1');
        svg.appendChild(hline);
    }
    
    // ストライクゾーンの枠線
    const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const strikeStart = gridSize === 5 ? cellSize : 0;
    const strikeSize = gridSize === 5 ? cellSize * 3 : 300;
    frame.setAttribute('x', strikeStart);
    frame.setAttribute('y', strikeStart);
    frame.setAttribute('width', strikeSize);
    frame.setAttribute('height', strikeSize);
    frame.setAttribute('fill', 'none');
    frame.setAttribute('stroke', '#0066cc');
    frame.setAttribute('stroke-width', '2');
    svg.appendChild(frame);
    
    // 投球をプロット
    pitches.forEach((pitch, index) => {
        if (!pitch.course) return;
        
        const x = pitch.course.col * cellSize + (cellSize / 2);
        const y = pitch.course.row * cellSize + (cellSize / 2);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '12');
        circle.setAttribute('fill', '#0066cc');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '10');
        text.setAttribute('fill', 'white');
        text.setAttribute('pointer-events', 'none');
        text.textContent = index + 1;
        svg.appendChild(text);
    });
    
    container.appendChild(svg);
}

/**
 * 打球方向分析を表示
 */
function displayHitDirectionAnalysis(matchData, batterId) {
    const statsList = document.getElementById('directionStats');
    if (!statsList) return;
    
    statsList.innerHTML = '';
    
    const directions = ['pitcher', 'catcher', 'first', 'second', 'third', 'shortstop', 'left', 'center', 'right', 'leftCenter', 'rightCenter'];
    const directionCounts = {};
    
    directions.forEach(dir => directionCounts[dir] = 0);
    
    // 打者の投球データから打球方向をカウント
    matchData.pitches.forEach(pitch => {
        if (pitch.batter && pitch.batter.id === batterId && pitch.direction) {
            if (directionCounts.hasOwnProperty(pitch.direction)) {
                directionCounts[pitch.direction]++;
            }
        }
    });
    
    directions.forEach(dir => {
        const item = document.createElement('div');
        item.className = 'direction-stat-item';
        item.innerHTML = `
            <div class="direction-stat-label">${getDirectionName(dir)}</div>
            <div class="direction-stat-value">${directionCounts[dir]}</div>
        `;
        statsList.appendChild(item);
    });
}

/**
 * ローディングアニメーション表示
 */
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loadingOverlay';
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
    `;
    loading.innerHTML = '<div style="font-size: 24px; color: #0066cc;">読込中...</div>';
    document.body.appendChild(loading);
}

/**
 * ローディングアニメーション非表示
 */
function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.remove();
    }
}

/**
 * トースト通知を表示
 */
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 200;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

/**
 * 確認ダイアログを表示
 */
function showConfirmDialog(message, onConfirm, onCancel) {
    const result = confirm(message);
    if (result) {
        onConfirm && onConfirm();
    } else {
        onCancel && onCancel();
    }
}
