/* ============================================
   app.js - メインアプリケーション
   ============================================ */

let currentMatch = null;
let currentPerspective = 'catcher';
let selectedCourseData = null;
let selectedHitData = null;
let selectedDirectionData = null;

/**
 * アプリケーション初期化
 */
function initializeApp() {
    console.log('=== 野球分析アプリ起動 ===');
    
    // ホーム画面を表示
    showScreen('homeScreen');
    
    // イベントリスナー登録
    setupEventListeners();
    
    // 保存されたデータを確認
    const saved = getCurrentMatch();
    if (saved) {
        console.log('保存中の試合データを発見');
    }
}

/**
 * イベントリスナー設定
 */
function setupEventListeners() {
    // ホーム画面
    document.getElementById('btnNewGame').addEventListener('click', () => {
        showScreen('matchSetupScreen');
        document.getElementById('matchDate').value = getTodayDate();
    });
    
    document.getElementById('btnPastGames').addEventListener('click', () => {
        displayMatchesList();
        showScreen('pastGamesScreen');
    });
    
    document.getElementById('btnPlayerManagement').addEventListener('click', () => {
        showScreen('playerManagementScreen');
    });
    
    document.getElementById('btnAnalysis').addEventListener('click', () => {
        loadAnalysisMatches();
        showScreen('analysisScreen');
    });
    
    // 試合前設定画面
    document.getElementById('backFromSetup').addEventListener('click', () => {
        showScreen('homeScreen');
    });
    
    document.getElementById('proceedToTeamSetup').addEventListener('click', () => {
        if (validateMatchSetup()) {
            showScreen('teamSetupScreen');
            initializeTeamSetup();
        }
    });
    
    // チーム設定画面
    document.getElementById('backFromTeamSetup').addEventListener('click', () => {
        showScreen('matchSetupScreen');
    });
    
    document.getElementById('startMatch').addEventListener('click', () => {
        if (validateTeamSetup()) {
            startGame();
        }
    });
    
    // タブ切り替え
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.getAttribute('data-tab'));
        });
    });
    
    // 選手追加ボタン
    document.getElementById('addOwnPlayer').addEventListener('click', () => {
        openPlayerModal('ownTeamLineup');
    });
    
    document.getElementById('addOwnBench').addEventListener('click', () => {
        openPlayerModal('ownTeamBench');
    });
    
    document.getElementById('addOpponentPlayer').addEventListener('click', () => {
        openPlayerModal('opponentTeamLineup');
    });
    
    document.getElementById('addOpponentBench').addEventListener('click', () => {
        openPlayerModal('opponentTeamBench');
    });
    
    // 選手モーダル
    document.getElementById('closePlayerModal').addEventListener('click', () => {
        hideModal('playerModal');
    });
    
    document.getElementById('cancelPlayerModal').addEventListener('click', () => {
        hideModal('playerModal');
    });
    
    document.getElementById('confirmPlayerModal').addEventListener('click', () => {
        savePlayerFromModal();
    });
    
    // 試合入力画面
    document.getElementById('backFromGameInput').addEventListener('click', () => {
        if (confirm('試合を終了しますか？')) {
            showScreen('matchEndScreen');
            displayMatchEndSummary();
        }
    });
    
    // 球種選択
    document.querySelectorAll('.pitch-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.pitch-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // 視点切り替え
    document.querySelectorAll('.perspective-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentPerspective = this.getAttribute('data-perspective');
            document.querySelectorAll('.perspective-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            drawStrikeZone('strikeZone', currentPerspective);
        });
    });
    
    // 投球結果選択
    document.querySelectorAll('.result-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const result = this.getAttribute('data-result');
            document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            // インプレーの場合は打球情報表示
            const inPlaySection = document.getElementById('inPlaySection');
            if (result === 'inPlay') {
                inPlaySection.style.display = 'block';
            } else {
                inPlaySection.style.display = 'none';
            }
        });
    });
    
    // 打球種類選択
    document.querySelectorAll('.hit-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.hit-type-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedHitData = this.getAttribute('data-hit');
        });
    });
    
    // 投球記録ボタン
    document.getElementById('recordPitch').addEventListener('click', () => {
        recordPitchData();
    });
    
    document.getElementById('undoLastPitch').addEventListener('click', () => {
        if (currentMatch && undoLastPitch(currentMatch)) {
            updateGameDisplay();
            showToast('最後の投球を取消しました');
        }
    });
    
    // 走者編集
    document.getElementById('editRunners').addEventListener('click', () => {
        updateRunnersModal();
        showModal('runnersModal');
    });
    
    document.getElementById('closeRunnersModal').addEventListener('click', () => {
        hideModal('runnersModal');
    });
    
    document.getElementById('cancelRunnersModal').addEventListener('click', () => {
        hideModal('runnersModal');
    });
    
    document.getElementById('confirmRunnersModal').addEventListener('click', () => {
        updateRunnersFromModal();
        hideModal('runnersModal');
    });
    
    // ボトムナビゲーション
    document.getElementById('navHistory').addEventListener('click', () => {
        displayPitchHistory(currentMatch);
        showScreen('pitchHistoryScreen');
    });
    
    document.getElementById('navCurrentAB').addEventListener('click', () => {
        displayCurrentAtBat();
        showScreen('currentAtBatScreen');
    });
    
    document.getElementById('navSettings').addEventListener('click', () => {
        // 設定画面へ
        showToast('設定画面はまだ実装中です');
    });
    
    // 履歴画面から戻る
    document.getElementById('backFromHistory').addEventListener('click', () => {
        showScreen('gameInputScreen');
    });
    
    document.getElementById('backFromCurrentAB').addEventListener('click', () => {
        showScreen('gameInputScreen');
    });
    
    // 試合終了画面
    document.getElementById('saveMatchData').addEventListener('click', () => {
        addCompletedMatch(currentMatch);
        clearCurrentMatch();
        currentMatch = null;
        showToast('試合データを保存しました');
        showScreen('homeScreen');
    });
    
    document.getElementById('returnHome').addEventListener('click', () => {
        showScreen('homeScreen');
    });
    
    // 分析画面
    document.getElementById('analysisMatchSelect').addEventListener('change', (e) => {
        if (e.target.value) {
            loadMatchAnalysis(e.target.value);
        }
    });
    
    document.getElementById('directionBatterSelect').addEventListener('change', (e) => {
        if (e.target.value && currentMatch) {
            displayHitDirectionAnalysis(currentMatch, e.target.value);
            drawFieldChart(currentMatch, e.target.value);
        }
    });
    
    document.getElementById('courseBatterSelect').addEventListener('change', (e) => {
        if (e.target.value && currentMatch) {
            displayCourseAnalysis(currentMatch, e.target.value);
        }
    });
    
    document.getElementById('backFromAnalysis').addEventListener('click', () => {
        showScreen('homeScreen');
    });
    
    // 過去の試合画面
    document.getElementById('backFromPastGames').addEventListener('click', () => {
        showScreen('homeScreen');
    });
    
    // 選手管理画面
    document.getElementById('backFromPlayerMgmt').addEventListener('click', () => {
        showScreen('homeScreen');
    });
}

/**
 * 試合前設定バリデーション
 */
function validateMatchSetup() {
    const date = document.getElementById('matchDate').value;
    const opponent = document.getElementById('opponent').value;
    
    if (!date || !opponent) {
        showToast('試合日と対戦相手を入力してください');
        return false;
    }
    
    return true;
}

/**
 * チーム設定バリデーション
 */
function validateTeamSetup() {
    const ownTeamName = document.getElementById('ownTeamName').value;
    const opponentTeamName = document.getElementById('opponentTeamName').value;
    
    if (!ownTeamName || !opponentTeamName) {
        showToast('チーム名を入力してください');
        return false;
    }
    
    const ownLineup = document.getElementById('ownTeamLineup').querySelectorAll('.player-item');
    const opponentLineup = document.getElementById('opponentTeamLineup').querySelectorAll('.player-item');
    
    if (ownLineup.length !== 9 || opponentLineup.length !== 9) {
        showToast('スタメンは9人設定してください');
        return false;
    }
    
    return true;
}

/**
 * 試合を開始
 */
function startGame() {
    // 試合データ初期化
    currentMatch = initializeMatchData();
    
    // 試合情報を設定
    currentMatch.matchInfo.date = document.getElementById('matchDate').value;
    currentMatch.matchInfo.opponent = document.getElementById('opponent').value;
    currentMatch.matchInfo.stadium = document.getElementById('stadium').value;
    currentMatch.matchInfo.tournament = document.getElementById('tournament').value;
    currentMatch.matchInfo.order = document.querySelector('input[name="order"]:checked').value;
    
    // チーム情報を設定
    currentMatch.ownTeam.name = document.getElementById('ownTeamName').value;
    currentMatch.opponentTeam.name = document.getElementById('opponentTeamName').value;
    
    // スタメンを設定
    const ownLineup = Array.from(document.getElementById('ownTeamLineup').querySelectorAll('.player-item')).map((item, index) => {
        return {
            id: item.getAttribute('data-player-id'),
            name: item.querySelector('.player-item-name').textContent,
            number: item.querySelector('.player-item-number').textContent,
            battingOrder: index + 1,
            position: item.getAttribute('data-position') || 'DH'
        };
    });
    
    const opponentLineup = Array.from(document.getElementById('opponentTeamLineup').querySelectorAll('.player-item')).map((item, index) => {
        return {
            id: item.getAttribute('data-player-id'),
            name: item.querySelector('.player-item-name').textContent,
            number: item.querySelector('.player-item-number').textContent,
            battingOrder: index + 1,
            position: item.getAttribute('data-position') || 'DH'
        };
    });
    
    currentMatch.ownTeam.lineup = ownLineup;
    currentMatch.opponentTeam.lineup = opponentLineup;
    
    // ゲーム状態を初期化
    currentMatch.gameState.isActive = true;
    currentMatch.gameState.inning = 1;
    currentMatch.gameState.order = currentMatch.matchInfo.order === 'home' ? 0 : 1;
    
    // 保存
    saveCurrentMatch(currentMatch);
    
    // 試合入力画面を表示
    showScreen('gameInputScreen');
    updateGameDisplay();
    drawStrikeZone('strikeZone', 'catcher');
    drawFieldDiagram('fieldDiagram');
    
    showToast('試合を開始しました');
}

/**
 * ゲーム表示を更新
 */
function updateGameDisplay() {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    
    // イニング・表裏表示
    document.getElementById('inningDisplay').textContent = getInningDisplay(gs.inning, gs.order);
    document.getElementById('statusInning').textContent = gs.inning;
    document.getElementById('statusOrder').textContent = getOrderName(gs.order);
    
    // スコア表示
    document.getElementById('scoreOwn').textContent = gs.ownScore;
    document.getElementById('scoreOpponent').textContent = gs.opponentScore;
    document.getElementById('scoreOwnTeam').textContent = currentMatch.ownTeam.name;
    document.getElementById('scoreOpponentTeam').textContent = currentMatch.opponentTeam.name;
    
    // アウト・ボール・ストライク表示
    document.getElementById('statusOuts').textContent = gs.outs;
    document.getElementById('statusBalls').textContent = gs.balls;
    document.getElementById('statusStrikes').textContent = gs.strikes;
    
    // 現在の打者・投手表示
    updatePlayerDisplay();
    
    // 走者表示
    updateRunnersDisplay();
}

/**
 * 打者・投手表示を更新
 */
function updatePlayerDisplay() {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    const team = gs.order === 0 ? currentMatch.ownTeam : currentMatch.opponentTeam;
    const oppositeTeam = gs.order === 0 ? currentMatch.opponentTeam : currentMatch.ownTeam;
    
    // 現在の打者
    if (team.lineup[gs.currentBatterIndex]) {
        const batter = team.lineup[gs.currentBatterIndex];
        document.getElementById('bitterNumber').textContent = batter.number;
        document.getElementById('bitterName').textContent = batter.name;
        document.getElementById('bitterMeta').textContent = `${gs.currentBatterIndex + 1}番`;
    }
    
    // 現在の投手
    if (oppositeTeam.lineup[gs.currentPitcherIndex]) {
        const pitcher = oppositeTeam.lineup[gs.currentPitcherIndex];
        document.getElementById('pitcherNumber').textContent = pitcher.number;
        document.getElementById('pitcherName').textContent = pitcher.name;
        document.getElementById('pitcherMeta').textContent = '投手';
    }
}

/**
 * 走者表示を更新
 */
function updateRunnersDisplay() {
    if (!currentMatch) return;
    
    const runners = currentMatch.gameState.runners;
    
    document.getElementById('runner1').textContent = runners.base1 ? runners.base1.name : '-';
    document.getElementById('runner2').textContent = runners.base2 ? runners.base2.name : '-';
    document.getElementById('runner3').textContent = runners.base3 ? runners.base3.name : '-';
}

/**
 * チーム設定画面を初期化
 */
function initializeTeamSetup() {
    // 前のデータをクリア
    document.getElementById('ownTeamLineup').innerHTML = '';
    document.getElementById('ownTeamBench').innerHTML = '';
    document.getElementById('opponentTeamLineup').innerHTML = '';
    document.getElementById('opponentTeamBench').innerHTML = '';
}

/**
 * 選手モーダルを開く
 */
function openPlayerModal(targetListId) {
    document.getElementById('playerModalTitle').textContent = '選手を追加';
    document.getElementById('playerNumber').value = '';
    document.getElementById('playerName').value = '';
    document.getElementById('playerBatting').value = '';
    document.getElementById('playerThrow').value = '';
    document.getElementById('playerPosition').value = '';
    
    document.getElementById('confirmPlayerModal').setAttribute('data-target', targetListId);
    showModal('playerModal');
}

/**
 * モーダルから選手データを保存
 */
function savePlayerFromModal() {
    const number = document.getElementById('playerNumber').value;
    const name = document.getElementById('playerName').value;
    const batting = document.getElementById('playerBatting').value;
    const throw_ = document.getElementById('playerThrow').value;
    const position = document.getElementById('playerPosition').value;
    const targetListId = document.getElementById('confirmPlayerModal').getAttribute('data-target');
    
    if (!number || !name || !batting || !position) {
        showToast('全ての項目を入力してください');
        return;
    }
    
    const player = {
        id: generateId(),
        number,
        name,
        batting,
        throw: throw_,
        position
    };
    
    const isOpponent = targetListId.includes('opponent');
    addPlayerToList(player, targetListId.includes('bench') ? 'bench' : 'lineup', isOpponent);
    
    hideModal('playerModal');
    showToast(name + 'を追加しました');
}

/**
 * 投球データを記録
 */
function recordPitchData() {
    if (!currentMatch) return;
    
    const selectedPitchBtn = document.querySelector('.pitch-btn.selected');
    const selectedResultBtn = document.querySelector('.result-btn.selected');
    
    if (!selectedPitchBtn || !selectedResultBtn) {
        showToast('球種と投球結果を選択してください');
        return;
    }
    
    const pitchType = selectedPitchBtn.getAttribute('data-type');
    const result = selectedResultBtn.getAttribute('data-result');
    const speed = document.getElementById('pitchSpeed').value;
    
    const pitchData = initializePitchData();
    pitchData.inning = currentMatch.gameState.inning;
    pitchData.order = currentMatch.gameState.order;
    pitchData.pitchType = pitchType;
    pitchData.speed = speed ? parseFloat(speed) : null;
    pitchData.result = result;
    pitchData.perspective = currentPerspective;
    
    // コース情報
    const selectedCourse = document.querySelector('[data-row][data-col].selected');
    if (selectedCourse) {
        pitchData.course = {
            row: parseInt(selectedCourse.getAttribute('data-row')),
            col: parseInt(selectedCourse.getAttribute('data-col'))
        };
    }
    
    // インプレーの場合は打球情報も記録
    if (result === 'inPlay') {
        const hitTypeBtn = document.querySelector('.hit-type-btn.selected');
        const directionElements = document.querySelectorAll('[data-direction]');
        let selectedDirection = null;
        
        directionElements.forEach(el => {
            if (el.getAttribute('fill') === '#0066cc') {
                selectedDirection = el.getAttribute('data-direction');
            }
        });
        
        if (!hitTypeBtn || !selectedDirection) {
            showToast('打球種類と方向を選択してください');
            return;
        }
        
        pitchData.hitType = hitTypeBtn.getAttribute('data-hit');
        pitchData.direction = selectedDirection;
        pitchData.inPlay = true;
        
        // 打席結果も記録
        const atBatResult = document.getElementById('atBatResult').value;
        if (!atBatResult) {
            showToast('打席結果を選択してください');
            return;
        }
        pitchData.atBatResult = atBatResult;
    }
    
    // ゲーム状態を更新
    const gs = currentMatch.gameState;
    
    if (result === 'look' || (result === 'swing' && true) || result === 'foul') {
        // ストライク
        gs.strikes++;
        if (result !== 'foul') {
            gs.strikes = Math.min(gs.strikes, 2);
        }
    } else if (result === 'ball' || result === 'hitByPitch') {
        // ボール or 死球
        gs.balls++;
        gs.balls = Math.min(gs.balls, 3);
    }
    
    // ストライク/ボール数を更新
    pitchData.balls = gs.balls;
    pitchData.strikes = gs.strikes;
    
    // 投球を記録
    recordPitch(currentMatch, pitchData);
    
    // アウト判定
    if (result === 'inPlay') {
        processAtBatResult(pitchData.atBatResult);
    } else if (gs.strikes >= 3) {
        // 三振
        gs.strikes = 0;
        gs.balls = 0;
        processAtBatResult('strikeout');
    } else if (gs.balls >= 4) {
        // 四球
        gs.strikes = 0;
        gs.balls = 0;
        processAtBatResult('walk');
    }
    
    updateGameDisplay();
    showToast('投球を記録しました');
    
    // 入力フォームをクリア
    clearPitchForm();
}

/**
 * 打席結果を処理
 */
function processAtBatResult(result) {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    
    // アウトになる結果
    const outResults = ['strikeout', 'groundOut', 'flyOut', 'lineOut', 'buntOut', 'sacrifice'];
    
    if (outResults.includes(result)) {
        gs.outs++;
        
        if (gs.outs >= 3) {
            // 3アウト: イニングが終了
            endInning();
        } else {
            // 次の打者へ
            advanceBatter();
        }
    } else {
        // アウトでない: 打数を進める
        if (result === 'homerun') {
            gs.ownScore++;  // 本塁打はスコア
        }
        advanceBatter();
    }
    
    gs.strikes = 0;
    gs.balls = 0;
}

/**
 * イニングを終了
 */
function endInning() {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    
    // 裏→表に移行
    if (gs.order === 1) {
        gs.inning++;
        gs.order = 0;
    } else {
        gs.order = 1;
    }
    
    gs.outs = 0;
    gs.balls = 0;
    gs.strikes = 0;
    
    // 9回を超えたら試合終了フラグ
    if (gs.inning > 9) {
        gs.isActive = false;
    }
    
    saveCurrentMatch(currentMatch);
}

/**
 * 次の打者に移行
 */
function advanceBatter() {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    const team = gs.order === 0 ? currentMatch.ownTeam : currentMatch.opponentTeam;
    
    gs.currentBatterIndex++;
    if (gs.currentBatterIndex >= team.lineup.length) {
        gs.currentBatterIndex = 0;
    }
    
    saveCurrentMatch(currentMatch);
}

/**
 * 投球フォームをクリア
 */
function clearPitchForm() {
    document.querySelectorAll('.pitch-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.result-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('pitchSpeed').value = '';
    document.getElementById('selectedCourse').textContent = '未選択';
    document.getElementById('selectedDirection').textContent = '未選択';
    
    // ストライクゾーンをリドロー
    drawStrikeZone('strikeZone', currentPerspective);
}

/**
 * 走者モーダルを更新
 */
function updateRunnersModal() {
    if (!currentMatch) return;
    
    const team = currentMatch.gameState.order === 0 ? 
        currentMatch.ownTeam : currentMatch.opponentTeam;
    
    const runner1Select = document.getElementById('runner1Select');
    const runner2Select = document.getElementById('runner2Select');
    const runner3Select = document.getElementById('runner3Select');
    
    // オプションをクリア
    [runner1Select, runner2Select, runner3Select].forEach(select => {
        select.innerHTML = '<option value="">走者なし</option>';
    });
    
    // 打者を追加
    team.lineup.forEach(player => {
        const option = document.createElement('option');
        option.value = player.id;
        option.textContent = `#${player.number} ${player.name}`;
        runner1Select.appendChild(option.cloneNode(true));
        runner2Select.appendChild(option.cloneNode(true));
        runner3Select.appendChild(option.cloneNode(true));
    });
}

/**
 * 走者をモーダルから更新
 */
function updateRunnersFromModal() {
    if (!currentMatch) return;
    
    const runner1Id = document.getElementById('runner1Select').value;
    const runner2Id = document.getElementById('runner2Select').value;
    const runner3Id = document.getElementById('runner3Select').value;
    
    const team = currentMatch.gameState.order === 0 ? 
        currentMatch.ownTeam : currentMatch.opponentTeam;
    
    currentMatch.gameState.runners.base1 = runner1Id ? 
        team.lineup.find(p => p.id === runner1Id) : null;
    currentMatch.gameState.runners.base2 = runner2Id ? 
        team.lineup.find(p => p.id === runner2Id) : null;
    currentMatch.gameState.runners.base3 = runner3Id ? 
        team.lineup.find(p => p.id === runner3Id) : null;
    
    saveCurrentMatch(currentMatch);
    updateRunnersDisplay();
    showToast('走者を更新しました');
}

/**
 * 現在の打席を表示
 */
function displayCurrentAtBat() {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    const team = gs.order === 0 ? currentMatch.ownTeam : currentMatch.opponentTeam;
    const batter = team.lineup[gs.currentBatterIndex];
    
    document.getElementById('currentABTitle').textContent = 
        `${getInningDisplay(gs.inning, gs.order)} ${batter.number}番 ${batter.name}`;
    
    // 打者情報
    document.getElementById('currentABPlayerInfo').innerHTML = `
        <div style="padding: 12px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${batter.name}</div>
            <div style="font-size: 14px; color: #666; margin-bottom: 12px;">背番号: ${batter.number}</div>
        </div>
    `;
    
    // 投球チャート
    const abPitches = currentMatch.pitches.filter(p => 
        p.batter && p.batter.id === batter.id
    );
    
    if (abPitches.length > 0) {
        plotPitchesOnStrikeZone('currentABStrikeZone', abPitches);
    }
    
    // 投球順序
    const pitchSequence = document.getElementById('currentABPitches');
    pitchSequence.innerHTML = '';
    
    abPitches.forEach((pitch, index) => {
        const pitchItem = document.createElement('div');
        pitchItem.style.cssText = `
            padding: 12px;
            margin-bottom: 8px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #0066cc;
        `;
        pitchItem.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${index + 1}球目</div>
            <div style="font-size: 13px; color: #666;">
                ${getPitchTypeName(pitch.pitchType)} ${pitch.speed ? pitch.speed + 'km/h' : ''}<br>
                ${pitch.course ? getCourseName(pitch.course.row, pitch.course.col) : '-'}<br>
                <span style="color: #0066cc; font-weight: 600;">${getResultName(pitch.result)}</span>
            </div>
        `;
        pitchSequence.appendChild(pitchItem);
    });
}

/**
 * 試合終了のサマリーを表示
 */
function displayMatchEndSummary() {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    
    document.getElementById('finalOwnTeam').textContent = currentMatch.ownTeam.name;
    document.getElementById('finalOwnScore').textContent = gs.ownScore;
    document.getElementById('finalOpponentTeam').textContent = currentMatch.opponentTeam.name;
    document.getElementById('finalOpponentScore').textContent = gs.opponentScore;
    
    // 統計を表示
    document.getElementById('statInnings').textContent = gs.inning;
    document.getElementById('statTotalPitches').textContent = currentMatch.pitches.length;
    document.getElementById('statTotalAtBats').textContent = currentMatch.atBats.length;
    
    // 投手成績
    const pitcherStats = calculatePitcherStats(currentMatch);
    const pitcherStatsList = document.getElementById('pitcherStats');
    pitcherStatsList.innerHTML = '';
    
    Object.values(pitcherStats).slice(0, 3).forEach(stat => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <span>${stat.player.name} (#${stat.player.number})</span>
            <span>${stat.pitches}投 ${stat.strikes}S ${stat.balls}B</span>
        `;
        pitcherStatsList.appendChild(item);
    });
    
    // 打者成績
    const batterStats = calculateBatterStats(currentMatch);
    const batterStatsList = document.getElementById('batterStats');
    batterStatsList.innerHTML = '';
    
    Object.values(batterStats).slice(0, 5).forEach(stat => {
        const avg = calculateBattingAverage(stat.hits, stat.atBats);
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <span>${stat.player.name} (#${stat.player.number})</span>
            <span>${stat.atBats}打${stat.hits}安 ${avg}</span>
        `;
        batterStatsList.appendChild(item);
    });
}

/**
 * 分析マッチのリストを読み込む
 */
function loadAnalysisMatches() {
    const matches = getCompletedMatches();
    const select = document.getElementById('analysisMatchSelect');
    
    select.innerHTML = '<option value="">試合を選択してください</option>';
    
    matches.forEach(match => {
        const option = document.createElement('option');
        option.value = match.id;
        option.textContent = `${formatDate(match.matchInfo.date)} ${match.ownTeam.name} vs ${match.opponentTeam.name}`;
        select.appendChild(option);
    });
}

/**
 * 試合分析を読み込む
 */
function loadMatchAnalysis(matchId) {
    const match = getMatchById(matchId);
    if (!match) return;
    
    currentMatch = match;
    
    const analysisContent = document.getElementById('analysisContent');
    analysisContent.style.display = 'block';
    
    // 打者分析
    const batterStats = calculateBatterStats(match);
    displayAnalysisList(batterStats, 'batter');
    
    // 投手分析
    const pitcherStats = calculatePitcherStats(match);
    displayAnalysisList(pitcherStats, 'pitcher');
    
    // 打球方向分析の打者選択
    const directionSelect = document.getElementById('directionBatterSelect');
    const courseSelect = document.getElementById('courseBatterSelect');
    
    directionSelect.innerHTML = '<option value="">打者を選択</option>';
    courseSelect.innerHTML = '<option value="">打者を選択</option>';
    
    Object.values(batterStats).forEach(stat => {
        const option = document.createElement('option');
        option.value = stat.player.id;
        option.textContent = `#${stat.player.number} ${stat.player.name}`;
        directionSelect.appendChild(option.cloneNode(true));
        courseSelect.appendChild(option.cloneNode(true));
    });
}

/**
 * グラウンド図を描画（分析用）
 */
function drawFieldChart(matchData, batterId) {
    const container = document.getElementById('fieldChart');
    if (!container) return;
    
    container.innerHTML = '';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 300');
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
    const bases = [{x: 240, y: 150}, {x: 150, y: 60}, {x: 60, y: 150}];
    bases.forEach(base => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', base.x - 8);
        rect.setAttribute('y', base.y - 8);
        rect.setAttribute('width', '16');
        rect.setAttribute('height', '16');
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('stroke', '#0066cc');
        svg.appendChild(rect);
    });
    
    // 打球をプロット
    const directions = {
        'left': {x: 50, y: 200},
        'leftCenter': {x: 100, y: 120},
        'center': {x: 150, y: 50},
        'rightCenter': {x: 200, y: 120},
        'right': {x: 250, y: 200},
        'infield': {x: 150, y: 250}
    };
    
    const hitCounts = {};
    matchData.pitches.forEach(pitch => {
        if (pitch.batter && pitch.batter.id === batterId && pitch.direction) {
            if (!hitCounts[pitch.direction]) hitCounts[pitch.direction] = 0;
            hitCounts[pitch.direction]++;
        }
    });
    
    Object.keys(directions).forEach(dir => {
        const pos = directions[dir];
        const count = hitCounts[dir] || 0;
        
        if (count > 0) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pos.x);
            circle.setAttribute('cy', pos.y);
            circle.setAttribute('r', 12 + count * 3);
            circle.setAttribute('fill', '#0066cc');
            circle.setAttribute('opacity', '0.3');
            svg.appendChild(circle);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', pos.x);
            text.setAttribute('y', pos.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '16');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#0066cc');
            text.setAttribute('pointer-events', 'none');
            text.textContent = count;
            svg.appendChild(text);
        }
    });
    
    container.appendChild(svg);
}

/**
 * コース分析を表示
 */
function displayCourseAnalysis(matchData, batterId) {
    const courseStats = document.getElementById('courseStats');
    courseStats.innerHTML = '';
    
    const pitchTypeCounts = {};
    matchData.pitches.forEach(pitch => {
        if (pitch.batter && pitch.batter.id === batterId) {
            if (!pitchTypeCounts[pitch.pitchType]) {
                pitchTypeCounts[pitch.pitchType] = 0;
            }
            pitchTypeCounts[pitch.pitchType]++;
        }
    });
    
    Object.entries(pitchTypeCounts).forEach(([type, count]) => {
        const item = document.createElement('div');
        item.className = 'course-stat-item';
        item.innerHTML = `
            <span>${getPitchTypeName(type)}</span>
            <span>${count}球</span>
        `;
        courseStats.appendChild(item);
    });
    
    // ストライクゾーンにプロット
    const coursePitches = matchData.pitches.filter(p => 
        p.batter && p.batter.id === batterId
    );
    plotPitchesOnStrikeZone('courseStrikeZone', coursePitches);
}

/**
 * アプリ開始
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
