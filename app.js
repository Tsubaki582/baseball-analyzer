/* ============================================
   app.js - メインアプリケーション
   ============================================ */

let currentMatch = null;
let currentPerspective = 'catcher';
let selectedCourseData = null;
let selectedHitData = null;
let selectedDirectionData = null;
let selectedRunnerBase = null;
let transitionTimer = null;
let atBatStartRunners = null;

const STARTER_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const DUPLICATE_LOCKED_POSITIONS = STARTER_POSITIONS.filter(position => position !== 'DH');

function createEmptyTeamSetupData(teamType) {
    return {
        teamType,
        name: '',
        players: [],
        lineup: Array.from({ length: 9 }, (_, index) => ({
            battingOrder: index + 1,
            playerId: '',
            position: ''
        })),
        pitcherId: '',
        bench: [],
        confirmed: false
    };
}

function addSafeEventListener(id, eventName, handler) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener(eventName, handler);
    }
    return element;
}

function ensureGameProgressState(gameState) {
    if (!gameState.batterIndices) {
        gameState.batterIndices = { top: gameState.currentBatterIndex || 0, bottom: 0 };
    }
    if (!gameState.currentBatterIndex && gameState.currentBatterIndex !== 0) {
        gameState.currentBatterIndex = gameState.order === 0 ? gameState.batterIndices.top : gameState.batterIndices.bottom;
    }
}

function getCurrentBatterIndex(gs) {
    ensureGameProgressState(gs);
    return gs.order === 0 ? gs.batterIndices.top : gs.batterIndices.bottom;
}

function setCurrentBatterIndex(gs, index) {
    ensureGameProgressState(gs);
    if (gs.order === 0) {
        gs.batterIndices.top = index;
    } else {
        gs.batterIndices.bottom = index;
    }
    gs.currentBatterIndex = index;
}

function getBattingTeam() {
    if (!currentMatch) return null;
    return currentMatch.gameState.order === 0 ? currentMatch.ownTeam : currentMatch.opponentTeam;
}

function getDefendingTeam() {
    if (!currentMatch) return null;
    return currentMatch.gameState.order === 0 ? currentMatch.opponentTeam : currentMatch.ownTeam;
}

function addRunsToBattingTeam(runs) {
    if (!currentMatch || runs <= 0) return;
    if (currentMatch.gameState.order === 0) {
        currentMatch.gameState.ownScore += runs;
    } else {
        currentMatch.gameState.opponentScore += runs;
    }
}

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
    addSafeEventListener('btnNewGame', 'click', () => {
        showScreen('matchSetupScreen');
        const matchDate = document.getElementById('matchDate');
        if (matchDate) {
            matchDate.value = getTodayDate();
        }
    });

    addSafeEventListener('btnPastGames', 'click', () => {
        if (document.getElementById('matchesList')) {
            displayMatchesList();
        }
        showScreen('pastGamesScreen');
    });

    addSafeEventListener('btnPlayerManagement', 'click', () => {
        showScreen('playerManagementScreen');
    });

    addSafeEventListener('btnAnalysis', 'click', () => {
        if (document.getElementById('analysisMatchSelect')) {
            loadAnalysisMatches();
        }
        showScreen('analysisScreen');
    });

    addSafeEventListener('backFromSetup', 'click', () => {
        showScreen('homeScreen');
    });

    addSafeEventListener('proceedToTeamSetup', 'click', () => {
        if (validateMatchSetup()) {
            showScreen('teamSetupScreen');
            initializeTeamSetup();
        }
    });

    addSafeEventListener('backFromTeamSetup', 'click', () => {
        showScreen('matchSetupScreen');
    });

    addSafeEventListener('startMatch', 'click', () => {
        if (validateTeamSetup()) {
            startGame();
        }
    });

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.getAttribute('data-tab'));
        });
    });

    addSafeEventListener('ownTeamName', 'input', (e) => updateTeamName('own', e.target.value));
    addSafeEventListener('opponentTeamName', 'input', (e) => updateTeamName('opponent', e.target.value));

    addSafeEventListener('addOwnPlayer', 'click', () => openPlayerModal('own'));
    addSafeEventListener('addOpponentPlayer', 'click', () => openPlayerModal('opponent'));
    addSafeEventListener('addOwnBench', 'click', () => addBenchSlot('own'));
    addSafeEventListener('addOpponentBench', 'click', () => addBenchSlot('opponent'));
    addSafeEventListener('cancelOwnOrder', 'click', () => resetOrderSelection('own'));
    addSafeEventListener('cancelOpponentOrder', 'click', () => resetOrderSelection('opponent'));
    addSafeEventListener('confirmOwnOrder', 'click', () => confirmTeamOrder('own'));
    addSafeEventListener('confirmOpponentOrder', 'click', () => confirmTeamOrder('opponent'));

    addSafeEventListener('closePlayerModal', 'click', closePlayerModal);
    addSafeEventListener('cancelPlayerModal', 'click', closePlayerModal);
    addSafeEventListener('confirmPlayerModal', 'click', () => {
        savePlayerFromModal();
    });
    addSafeEventListener('modalOverlay', 'click', () => {
        if (document.getElementById('playerModal')?.classList.contains('active')) {
            closePlayerModal();
        } else if (document.getElementById('runnersModal')?.classList.contains('active')) {
            hideModal('runnersModal');
        }
    });

    document.querySelectorAll('.player-type-tab').forEach(button => {
        button.addEventListener('click', () => {
            setPlayerModalType(button.getAttribute('data-player-type'));
        });
    });

    addSafeEventListener('backFromGameInput', 'click', () => {
        if (confirm('試合を終了しますか？')) {
            showScreen('matchEndScreen');
            displayMatchEndSummary();
        }
    });

    document.querySelectorAll('.pitch-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.pitch-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    document.querySelectorAll('.perspective-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            currentPerspective = this.getAttribute('data-perspective');
            document.querySelectorAll('.perspective-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            drawStrikeZone('strikeZone', currentPerspective);
        });
    });

    document.querySelectorAll('.result-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const result = this.getAttribute('data-result');
            document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            const inPlaySection = document.getElementById('inPlaySection');
            if (inPlaySection) {
                inPlaySection.style.display = result === 'inPlay' ? 'block' : 'none';
                if (result !== 'inPlay') {
                    document.querySelectorAll('.hit-type-btn').forEach(b => b.classList.remove('selected'));
                    document.querySelectorAll('[data-direction]').forEach(node => node.classList.remove('selected'));
                    document.getElementById('selectedDirection').textContent = '未選択';
                    document.getElementById('atBatResult').value = '';
                    selectedHitData = null;
                    selectedDirectionData = null;
                }
            }
        });
    });

    document.querySelectorAll('.hit-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.hit-type-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedHitData = this.getAttribute('data-hit');
        });
    });

    document.querySelectorAll('.runner-base').forEach(btn => {
        btn.addEventListener('click', () => openRunnerActions(btn.getAttribute('data-base')));
    });
    document.querySelectorAll('.runner-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleRunnerAction(btn.getAttribute('data-action'));
        });
    });
    addSafeEventListener('runnerActions', 'click', (e) => {
        e.stopPropagation();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.runner-base') && !e.target.closest('#runnerActions')) {
            closeRunnerActions();
        }
    });

    addSafeEventListener('recordPitch', 'click', () => {
        recordPitchData();
    });

    addSafeEventListener('undoLastPitch', 'click', () => {
        if (currentMatch && undoLastPitch(currentMatch)) {
            updateGameDisplay();
            showToast('最後の投球を取消しました');
        }
    });

    addSafeEventListener('editRunners', 'click', () => {
        updateRunnersModal();
        showModal('runnersModal');
    });
    addSafeEventListener('closeRunnersModal', 'click', () => hideModal('runnersModal'));
    addSafeEventListener('cancelRunnersModal', 'click', () => hideModal('runnersModal'));
    addSafeEventListener('confirmRunnersModal', 'click', () => {
        updateRunnersFromModal();
        hideModal('runnersModal');
    });

    addSafeEventListener('skipToNextBatter', 'click', () => moveBatterBy(1, true));
    addSafeEventListener('backToPreviousBatter', 'click', () => moveBatterBy(-1, false));
    addSafeEventListener('goToNextHalfInning', 'click', () => moveHalfInning(1));
    addSafeEventListener('goToPreviousHalfInning', 'click', () => moveHalfInning(-1));
    addSafeEventListener('switchToBottom', 'click', () => changeHalfInning('bottom'));
    addSafeEventListener('switchToNextTop', 'click', () => changeHalfInning('nextTop'));
    addSafeEventListener('moveToManualInning', 'click', () => {
        const inningValue = parseInt(document.getElementById('manualInningInput').value, 10);
        if (!Number.isInteger(inningValue) || inningValue < 1) {
            showToast('1以上のイニングを入力してください');
            return;
        }
        moveToInning(inningValue);
    });

    addSafeEventListener('navHistory', 'click', () => {
        displayPitchHistory(currentMatch);
        showScreen('pitchHistoryScreen');
    });
    addSafeEventListener('navCurrentAB', 'click', () => {
        displayCurrentAtBat();
        showScreen('currentAtBatScreen');
    });
    addSafeEventListener('navSettings', 'click', () => {
        showToast('設定画面はまだ実装中です');
    });
    addSafeEventListener('backFromHistory', 'click', () => showScreen('gameInputScreen'));
    addSafeEventListener('backFromCurrentAB', 'click', () => showScreen('gameInputScreen'));

    addSafeEventListener('saveMatchData', 'click', () => {
        addCompletedMatch(currentMatch);
        clearCurrentMatch();
        currentMatch = null;
        showToast('試合データを保存しました');
        showScreen('homeScreen');
    });
    addSafeEventListener('returnHome', 'click', () => showScreen('homeScreen'));

    addSafeEventListener('analysisMatchSelect', 'change', (e) => {
        if (e.target.value) {
            loadMatchAnalysis(e.target.value);
        }
    });
    addSafeEventListener('directionBatterSelect', 'change', (e) => {
        if (e.target.value && currentMatch) {
            displayHitDirectionAnalysis(currentMatch, e.target.value);
            drawFieldChart(currentMatch, e.target.value);
        }
    });
    addSafeEventListener('courseBatterSelect', 'change', (e) => {
        if (e.target.value && currentMatch) {
            displayCourseAnalysis(currentMatch, e.target.value);
        }
    });
    addSafeEventListener('backFromAnalysis', 'click', () => showScreen('homeScreen'));
    addSafeEventListener('backFromPastGames', 'click', () => showScreen('homeScreen'));
    addSafeEventListener('backFromPlayerMgmt', 'click', () => showScreen('homeScreen'));
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
    const ownErrors = validateSingleTeamSetup('own', true);
    if (ownErrors.length > 0) {
        switchTab('own-team');
        showToast(ownErrors[0]);
        return false;
    }

    const opponentErrors = validateSingleTeamSetup('opponent', true);
    if (opponentErrors.length > 0) {
        switchTab('opponent-team');
        showToast(opponentErrors[0]);
        return false;
    }

    return true;
}

/**
 * 試合を開始
 */
function startGame() {
    const ownTeamData = getTeamSetupData('own');
    const opponentTeamData = getTeamSetupData('opponent');
    const ownLineup = buildGameLineup(ownTeamData);
    const opponentLineup = buildGameLineup(opponentTeamData);
    const ownBench = buildGameBench(ownTeamData);
    const opponentBench = buildGameBench(opponentTeamData);
    const ownPitcher = buildGamePitcher(ownTeamData);
    const opponentPitcher = buildGamePitcher(opponentTeamData);

    if (ownLineup.length !== 9 || opponentLineup.length !== 9 || !ownPitcher || !opponentPitcher) {
        showToast('選手データが更新されたため、オーダーを確認し直してください');
        return;
    }

    // 試合データ初期化
    currentMatch = initializeMatchData();
    
    // 試合情報を設定
    currentMatch.matchInfo.date = document.getElementById('matchDate').value;
    currentMatch.matchInfo.opponent = document.getElementById('opponent').value;
    currentMatch.matchInfo.stadium = document.getElementById('stadium').value;
    currentMatch.matchInfo.tournament = document.getElementById('tournament').value;
    currentMatch.matchInfo.order = document.querySelector('input[name="order"]:checked').value;
    
    // チーム情報を設定
    currentMatch.ownTeam.name = ownTeamData.name;
    currentMatch.opponentTeam.name = opponentTeamData.name;
    currentMatch.ownTeam.lineup = ownLineup;
    currentMatch.opponentTeam.lineup = opponentLineup;
    currentMatch.ownTeam.bench = ownBench;
    currentMatch.opponentTeam.bench = opponentBench;
    currentMatch.ownTeam.pitcher = ownPitcher;
    currentMatch.opponentTeam.pitcher = opponentPitcher;
    
    // ゲーム状態を初期化
    currentMatch.gameState.isActive = true;
    currentMatch.gameState.inning = 1;
    currentMatch.gameState.order = currentMatch.matchInfo.order === 'home' ? 0 : 1;
    currentMatch.gameState.batterIndices = { top: 0, bottom: 0 };
    currentMatch.gameState.currentBatterIndex = 0;
    atBatStartRunners = null;
    
    // 保存
    saveCurrentMatch(currentMatch);
    
    // 試合入力画面を表示
    showScreen('gameInputScreen');
    updateGameDisplay();
    drawStrikeZone('strikeZone', 'catcher');
    drawFieldDiagram('fieldDiagram');
    closeRunnerActions();
    
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
    const team = getBattingTeam();
    const oppositeTeam = getDefendingTeam();
    const batterIndex = getCurrentBatterIndex(gs);
    
    // 現在の打者
    if (team?.lineup[batterIndex]) {
        const batter = team.lineup[batterIndex];
        document.getElementById('batterNumber').textContent = batter.number;
        document.getElementById('batterName').textContent = batter.name;
        document.getElementById('batterMeta').textContent = `${batterIndex + 1}番`;
    }
    
    // 現在の投手
    const pitcher = oppositeTeam.pitcher || oppositeTeam.lineup[gs.currentPitcherIndex];
    if (pitcher) {
        document.getElementById('pitcherNumber').textContent = pitcher.number;
        document.getElementById('pitcherName').textContent = pitcher.name;
        document.getElementById('pitcherMeta').textContent = `${getBattingName(pitcher.batting)} / ${getThrowName(pitcher.throw)}`;
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
    document.querySelector('[data-base="base1"]')?.classList.toggle('occupied', Boolean(runners.base1));
    document.querySelector('[data-base="base2"]')?.classList.toggle('occupied', Boolean(runners.base2));
    document.querySelector('[data-base="base3"]')?.classList.toggle('occupied', Boolean(runners.base3));
    document.querySelector('[data-base="home"]')?.classList.remove('occupied');
}

/**
 * チーム設定画面を初期化
 */
function initializeTeamSetup() {
    const ownTeamNameInput = document.getElementById('ownTeamName');
    const opponentTeamNameInput = document.getElementById('opponentTeamName');
    const preservedOwnName = ownTeamNameInput?.value || '';
    const preservedOpponentName = opponentTeamNameInput?.value || '';
    const ownTeamData = createEmptyTeamSetupData('own');
    const opponentTeamData = createEmptyTeamSetupData('opponent');

    ownTeamData.name = preservedOwnName;
    opponentTeamData.name = preservedOpponentName;

    UIState.reset();
    UIState.setTempTeamData('own', ownTeamData);
    UIState.setTempTeamData('opponent', opponentTeamData);
    if (ownTeamNameInput) {
        ownTeamNameInput.value = preservedOwnName;
    }
    if (opponentTeamNameInput) {
        opponentTeamNameInput.value = preservedOpponentName;
    }
    switchTab('own-team');
    renderTeamSetup();
}

/**
 * 選手モーダルを開く
 */
function openPlayerModal(teamType, playerId = null) {
    getTeamSetupData(teamType);
    UIState.setEditingTeam(teamType);
    UIState.setEditingPlayer(playerId, true, teamType, 'master');
    resetPlayerModalState();
    const teamData = getTeamSetupData(teamType);
    const player = playerId ? findTeamPlayer(teamData, playerId) : null;
    document.getElementById('playerModalTitle').textContent = `${teamType === 'own' ? '自チーム' : '相手チーム'}の選手${player ? 'を編集' : 'を追加'}`;
    document.getElementById('confirmPlayerModal').textContent = player ? '更新' : '保存';

    if (player) {
        document.getElementById('playerName').value = player.name;
        document.getElementById('playerBatting').value = player.batting;
        document.getElementById('playerThrow').value = player.throw;
        setPlayerModalType(player.playerType || player.playerTypes?.[0] || 'fielder');
    }
    showModal('playerModal');
}

/**
 * モーダルから選手データを保存
 */
function savePlayerFromModal() {
    const teamType = UIState.getEditingTeam();
    const name = document.getElementById('playerName').value;
    const batting = document.getElementById('playerBatting').value;
    const throw_ = document.getElementById('playerThrow').value;
    const editingPlayerId = UIState.editingPlayer?.id;

    if (!teamType) {
        showToast('追加先のチームを選び直してください');
        closePlayerModal();
        return;
    }

    if (!name || !batting || !throw_) {
        showToast('選手名・打席・投げを入力してください');
        return;
    }

    const playerType = document.getElementById('playerModal').dataset.playerType || 'fielder';
    const teamData = getTeamSetupData(teamType);
    const existingPlayer = editingPlayerId ? findTeamPlayer(teamData, editingPlayerId) : null;
    const player = {
        ...initializePlayerData(),
        ...deepCopy(existingPlayer || {}),
        id: existingPlayer?.id || generateId(),
        name: name.trim(),
        batting,
        throw: throw_,
        playerType,
        playerTypes: [playerType]
    };

    if (existingPlayer) {
        teamData.players = teamData.players.map(item => item.id === player.id ? player : item);
    } else {
        teamData.players.push(player);
    }
    teamData.confirmed = false;
    renderTeamSetup();
    closePlayerModal();
    showToast(`${player.name}を${existingPlayer ? '更新' : '登録'}しました`);
}

function getTeamSetupData(teamType) {
    let teamData = UIState.getTempTeamData(teamType);
    if (!teamData) {
        teamData = createEmptyTeamSetupData(teamType);
        UIState.setTempTeamData(teamType, teamData);
    }
    return teamData;
}

function updateTeamName(teamType, name) {
    const teamData = getTeamSetupData(teamType);
    teamData.name = name;
    teamData.confirmed = false;
    updateOrderSheetTitle(teamType);
}

function updateOrderSheetTitle(teamType) {
    const teamData = getTeamSetupData(teamType);
    const title = document.getElementById(teamType === 'own' ? 'ownOrderSheetTeamName' : 'opponentOrderSheetTeamName');
    if (title) {
        title.textContent = teamData.name || (teamType === 'own' ? '自チーム' : '相手チーム');
    }
}

function resetPlayerModalState() {
    const modal = document.getElementById('playerModal');
    modal.dataset.playerType = 'fielder';
    document.getElementById('playerName').value = '';
    document.getElementById('playerBatting').value = '';
    document.getElementById('playerThrow').value = '';
    setPlayerModalType('fielder');
}

function closePlayerModal() {
    resetPlayerModalState();
    UIState.setEditingTeam(null);
    UIState.setEditingPlayer(null, true, null, null);
    hideModal('playerModal');
}

function setPlayerModalType(playerType) {
    const modal = document.getElementById('playerModal');
    modal.dataset.playerType = playerType;
    document.querySelectorAll('.player-type-tab').forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-player-type') === playerType);
    });

    const description = document.getElementById('playerTypeDescription');
    if (description) {
        description.textContent = playerType === 'pitcher'
            ? '投手として登録します。内部では playerType に加えて playerTypes 配列も保持し、将来の二刀流拡張に備えます。'
            : '野手として登録します。内部では playerType に加えて playerTypes 配列も保持し、将来の二刀流拡張に備えます。';
    }
}

function renderTeamSetup() {
    ['own', 'opponent'].forEach(teamType => {
        const teamData = getTeamSetupData(teamType);
        updateOrderSheetTitle(teamType);
        renderRegisteredPlayers(teamType, teamData);
        renderLineupRows(teamType, teamData);
        renderPitcherSection(teamType, teamData);
        renderBenchRows(teamType, teamData);
    });
}

function renderRegisteredPlayers(teamType, teamData) {
    const container = document.getElementById(teamType === 'own' ? 'ownTeamPlayersMaster' : 'opponentTeamPlayersMaster');
    if (!container) return;

    container.innerHTML = '';
    if (teamData.players.length === 0) {
        container.innerHTML = '<div class="empty-state">まだ選手が登録されていません</div>';
        return;
    }

    teamData.players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-master-item';

        const info = document.createElement('div');
        info.className = 'player-master-info';
        info.innerHTML = `
            <div class="player-item-name">${player.name}</div>
            <div class="player-item-meta">${player.playerType === 'pitcher' ? '投手' : '野手'} / ${getBattingName(player.batting)} / ${getThrowName(player.throw)}</div>
        `;

        const badge = document.createElement('div');
        badge.className = `player-type-badge ${player.playerType}`;
        badge.textContent = player.playerType === 'pitcher' ? '投手' : '野手';

        const removeButton = document.createElement('button');
        removeButton.className = 'player-item-btn remove';
        removeButton.textContent = '削除';
        removeButton.addEventListener('click', () => removeRegisteredPlayer(teamType, player.id));

        const editButton = document.createElement('button');
        editButton.className = 'player-item-btn';
        editButton.textContent = '編集';
        editButton.addEventListener('click', () => openPlayerModal(teamType, player.id));

        const actions = document.createElement('div');
        actions.className = 'player-item-actions';
        actions.appendChild(editButton);
        actions.appendChild(removeButton);

        item.appendChild(badge);
        item.appendChild(info);
        item.appendChild(actions);
        container.appendChild(item);
    });
}

function renderLineupRows(teamType, teamData) {
    const container = document.getElementById(teamType === 'own' ? 'ownTeamLineup' : 'opponentTeamLineup');
    if (!container) return;

    container.innerHTML = '';
    teamData.lineup.forEach((slot, index) => {
        const row = document.createElement('div');
        row.className = 'order-row-card';

        const order = document.createElement('div');
        order.className = 'order-slot-label';
        order.textContent = `${slot.battingOrder}`;

        const playerSelect = createPlayerSelect(teamType, slot.playerId, { type: 'lineup', index });
        playerSelect.addEventListener('change', (e) => {
            slot.playerId = e.target.value;
            if (!slot.playerId) {
                slot.position = '';
            }
            teamData.confirmed = false;
            renderTeamSetup();
        });

        const positionSelect = createPositionSelect(teamType, slot.position, index);
        positionSelect.disabled = !slot.playerId;
        positionSelect.addEventListener('change', (e) => {
            slot.position = e.target.value;
            teamData.confirmed = false;
            renderTeamSetup();
        });

        const player = findTeamPlayer(teamData, slot.playerId);
        const summary = document.createElement('div');
        summary.className = 'order-player-summary';
        summary.innerHTML = `
            <span class="order-player-name">${player ? player.name : '未選択'}</span>
            <span class="order-player-meta">${player ? `${getBattingName(player.batting)} / ${getThrowName(player.throw)}` : '打席・利き腕を表示'}</span>
        `;

        row.appendChild(order);
        row.appendChild(buildFieldGroup('選手名', playerSelect, 'order-field wide'));
        row.appendChild(buildFieldGroup('守備', positionSelect, 'order-field'));
        row.appendChild(summary);
        container.appendChild(row);
    });
}

function renderPitcherSection(teamType, teamData) {
    const container = document.getElementById(teamType === 'own' ? 'ownTeamPitcher' : 'opponentTeamPitcher');
    if (!container) return;

    container.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'order-row-card pitcher-row';

    const label = document.createElement('div');
    label.className = 'order-slot-label pitcher';
    label.textContent = 'P';

    const select = createPlayerSelect(teamType, teamData.pitcherId, { type: 'pitcher' }, player => player.playerTypes.includes('pitcher'));
    select.addEventListener('change', (e) => {
        teamData.pitcherId = e.target.value;
        teamData.confirmed = false;
        renderTeamSetup();
    });

    const player = findTeamPlayer(teamData, teamData.pitcherId);
    const summary = document.createElement('div');
    summary.className = 'order-player-summary';
    summary.innerHTML = `
        <span class="order-player-name">${player ? player.name : '未選択'}</span>
        <span class="order-player-meta">${player ? `投手 / ${getBattingName(player.batting)} / ${getThrowName(player.throw)}` : '投手登録済み選手から選択'}</span>
    `;

    row.appendChild(label);
    row.appendChild(buildFieldGroup('選手名', select, 'order-field wide'));
    row.appendChild(summary);
    container.appendChild(row);
}

function renderBenchRows(teamType, teamData) {
    const container = document.getElementById(teamType === 'own' ? 'ownTeamBench' : 'opponentTeamBench');
    if (!container) return;

    container.innerHTML = '';
    if (teamData.bench.length === 0) {
        container.innerHTML = '<div class="empty-state compact">控え選手はまだ追加されていません</div>';
        return;
    }

    teamData.bench.forEach((benchSlot, index) => {
        const row = document.createElement('div');
        row.className = 'order-row-card bench-row';

        const label = document.createElement('div');
        label.className = 'order-slot-label bench';
        label.textContent = `控${index + 1}`;

        const select = createPlayerSelect(teamType, benchSlot.playerId, { type: 'bench', index });
        select.addEventListener('change', (e) => {
            benchSlot.playerId = e.target.value;
            teamData.confirmed = false;
            renderTeamSetup();
        });

        const player = findTeamPlayer(teamData, benchSlot.playerId);
        const summary = document.createElement('div');
        summary.className = 'order-player-summary';
        summary.innerHTML = `
            <span class="order-player-name">${player ? player.name : '未選択'}</span>
            <span class="order-player-meta">${player ? `${getBattingName(player.batting)} / ${getThrowName(player.throw)}` : '控え選手を選択'}</span>
        `;

        const removeButton = document.createElement('button');
        removeButton.className = 'player-item-btn remove';
        removeButton.textContent = '削除';
        removeButton.addEventListener('click', () => removeBenchSlot(teamType, index));

        row.appendChild(label);
        row.appendChild(buildFieldGroup('選手名', select, 'order-field wide'));
        row.appendChild(summary);
        row.appendChild(removeButton);
        container.appendChild(row);
    });
}

function buildFieldGroup(labelText, element, className = 'order-field') {
    const wrapper = document.createElement('div');
    wrapper.className = className;

    const label = document.createElement('label');
    label.className = 'order-field-label';
    label.textContent = labelText;

    wrapper.appendChild(label);
    wrapper.appendChild(element);
    return wrapper;
}

function createPlayerSelect(teamType, currentPlayerId, context, filterFn = () => true) {
    const teamData = getTeamSetupData(teamType);
    const select = document.createElement('select');
    select.className = 'form-input';
    select.innerHTML = '<option value="">選択してください</option>';

    const assignedIds = collectAssignedPlayerIds(teamData, context);
    teamData.players
        .filter(player => filterFn(player))
        .forEach(player => {
            if (assignedIds.has(player.id) && player.id !== currentPlayerId) {
                return;
            }

            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `${player.name} (${getBattingName(player.batting)} / ${getThrowName(player.throw)})`;
            option.selected = player.id === currentPlayerId;
            select.appendChild(option);
        });

    return select;
}

function createPositionSelect(teamType, currentPosition, lineupIndex) {
    const select = document.createElement('select');
    select.className = 'form-input';
    select.innerHTML = '<option value="">選択してください</option>';

    const teamData = getTeamSetupData(teamType);
    const usedPositions = collectUsedPositions(teamData, lineupIndex);
    STARTER_POSITIONS.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = getPositionName(position);
        option.selected = position === currentPosition;
        option.disabled = usedPositions.has(position) && position !== currentPosition && position !== 'DH';
        select.appendChild(option);
    });

    return select;
}

function collectAssignedPlayerIds(teamData, context) {
    const assignedIds = new Set();

    if (context.type !== 'pitcher') {
        teamData.lineup.forEach((slot, index) => {
            if (!slot.playerId) return;
            if (context.type === 'lineup' && context.index === index) return;
            assignedIds.add(slot.playerId);
        });
    }

    teamData.bench.forEach((slot, index) => {
        if (!slot.playerId) return;
        if (context.type === 'bench' && context.index === index) return;
        assignedIds.add(slot.playerId);
    });

    if (teamData.pitcherId && context.type !== 'pitcher') {
        assignedIds.add(teamData.pitcherId);
    }

    return assignedIds;
}

function collectUsedPositions(teamData, currentIndex) {
    const usedPositions = new Set();
    teamData.lineup.forEach((slot, index) => {
        if (!slot.position || index === currentIndex || !DUPLICATE_LOCKED_POSITIONS.includes(slot.position)) {
            return;
        }
        usedPositions.add(slot.position);
    });
    return usedPositions;
}

function addBenchSlot(teamType) {
    const teamData = getTeamSetupData(teamType);
    teamData.bench.push({ playerId: '' });
    teamData.confirmed = false;
    renderTeamSetup();
}

function removeBenchSlot(teamType, benchIndex) {
    const teamData = getTeamSetupData(teamType);
    teamData.bench.splice(benchIndex, 1);
    teamData.confirmed = false;
    renderTeamSetup();
}

function removeRegisteredPlayer(teamType, playerId) {
    const teamData = getTeamSetupData(teamType);
    teamData.players = teamData.players.filter(player => player.id !== playerId);
    teamData.lineup.forEach(slot => {
        if (slot.playerId === playerId) {
            slot.playerId = '';
            slot.position = '';
        }
    });
    teamData.bench.forEach(slot => {
        if (slot.playerId === playerId) {
            slot.playerId = '';
        }
    });
    if (teamData.pitcherId === playerId) {
        teamData.pitcherId = '';
    }
    teamData.confirmed = false;
    renderTeamSetup();
}

function resetOrderSelection(teamType) {
    const teamData = getTeamSetupData(teamType);
    teamData.lineup = createEmptyTeamSetupData(teamType).lineup;
    teamData.bench = [];
    teamData.pitcherId = '';
    teamData.confirmed = false;
    renderTeamSetup();
    showToast(`${teamType === 'own' ? '自チーム' : '相手チーム'}のオーダーをリセットしました`);
}

function confirmTeamOrder(teamType) {
    const errors = validateSingleTeamSetup(teamType, false);
    if (errors.length > 0) {
        showToast(errors[0]);
        return false;
    }

    const teamData = getTeamSetupData(teamType);
    teamData.confirmed = true;
    renderTeamSetup();
    showToast(`${teamType === 'own' ? '自チーム' : '相手チーム'}のオーダーを確定しました`);
    return true;
}

function validateSingleTeamSetup(teamType, requireConfirmed = false) {
    const teamData = getTeamSetupData(teamType);
    const teamLabel = teamType === 'own' ? '自チーム' : '相手チーム';
    const errors = [];

    if (!teamData.name.trim()) {
        errors.push(`${teamLabel}名を入力してください`);
    }

    if (teamData.players.length === 0) {
        errors.push(`${teamLabel}の登録済み選手がありません`);
    }

    teamData.lineup.forEach((slot, index) => {
        if (!slot.playerId) {
            errors.push(`${teamLabel}の${index + 1}番打者が未設定です`);
            return;
        }
        if (!findTeamPlayer(teamData, slot.playerId)) {
            errors.push(`${teamLabel}の${index + 1}番に設定した選手が登録一覧に存在しません`);
        }
        if (!slot.position) {
            errors.push(`${teamLabel}の${index + 1}番の守備位置を選択してください`);
        }
    });

    const duplicatePlayer = findDuplicateAssignedPlayer(teamData);
    if (duplicatePlayer) {
        errors.push(`${teamLabel}で「${duplicatePlayer.name}」が重複登録されています`);
    }

    const duplicatePosition = findDuplicatePosition(teamData);
    if (duplicatePosition) {
        errors.push(`${teamLabel}の${getPositionName(duplicatePosition)}が重複しています`);
    }

    if (!teamData.pitcherId) {
        errors.push(`${teamLabel}の投手が設定されていません`);
    } else if (!findTeamPlayer(teamData, teamData.pitcherId)) {
        errors.push(`${teamLabel}の投手に設定した選手が登録一覧に存在しません`);
    } else if (!findTeamPlayer(teamData, teamData.pitcherId).playerTypes.includes('pitcher')) {
        errors.push(`${teamLabel}の投手には投手登録済みの選手を設定してください`);
    }

    if (requireConfirmed && !teamData.confirmed) {
        errors.push(`${teamLabel}のオーダーを「この内容で決定」してください`);
    }

    return Array.from(new Set(errors));
}

function findDuplicateAssignedPlayer(teamData) {
    const lineupIds = teamData.lineup.map(slot => slot.playerId).filter(Boolean);
    const benchIds = teamData.bench.map(slot => slot.playerId).filter(Boolean);
    const seenLineup = new Set();
    const seenBench = new Set();

    for (const playerId of lineupIds) {
        if (seenLineup.has(playerId)) {
            return findTeamPlayer(teamData, playerId);
        }
        seenLineup.add(playerId);
    }

    for (const playerId of benchIds) {
        if (seenBench.has(playerId) || seenLineup.has(playerId) || playerId === teamData.pitcherId) {
            return findTeamPlayer(teamData, playerId);
        }
        seenBench.add(playerId);
    }

    return null;
}

function findDuplicatePosition(teamData) {
    const used = new Set();
    for (const slot of teamData.lineup) {
        if (!slot.position || !DUPLICATE_LOCKED_POSITIONS.includes(slot.position)) {
            continue;
        }
        if (used.has(slot.position)) {
            return slot.position;
        }
        used.add(slot.position);
    }
    return null;
}

function findTeamPlayer(teamData, playerId) {
    return teamData.players.find(player => player.id === playerId) || null;
}

function buildGameLineup(teamData) {
    return teamData.lineup.map(slot => {
        const player = findTeamPlayer(teamData, slot.playerId);
        return player ? buildGamePlayer(player, {
            battingOrder: slot.battingOrder,
            position: slot.position
        }) : null;
    }).filter(Boolean);
}

function buildGameBench(teamData) {
    return teamData.bench
        .map(slot => findTeamPlayer(teamData, slot.playerId))
        .filter(Boolean)
        .map(player => buildGamePlayer(player));
}

function buildGamePitcher(teamData) {
    const player = findTeamPlayer(teamData, teamData.pitcherId);
    return player ? buildGamePlayer(player, { position: 'P' }) : null;
}

function buildGamePlayer(player, overrides = {}) {
    return {
        ...initializePlayerData(),
        ...deepCopy(player),
        number: player.number || '-',
        ...overrides
    };
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
    const battingTeam = getBattingTeam();
    const defendingTeam = getDefendingTeam();
    const batterIndex = getCurrentBatterIndex(currentMatch.gameState);
    pitchData.inning = currentMatch.gameState.inning;
    pitchData.order = currentMatch.gameState.order;
    pitchData.pitchType = pitchType;
    pitchData.speed = speed ? parseFloat(speed) : null;
    pitchData.result = result;
    pitchData.perspective = currentPerspective;
    pitchData.batter = battingTeam.lineup[batterIndex] || null;
    pitchData.pitcher = defendingTeam.pitcher || defendingTeam.lineup[currentMatch.gameState.currentPitcherIndex] || null;
    
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
        const selectedDirectionElement = document.querySelector('[data-direction].selected');
        const selectedDirection = selectedDirectionElement ? selectedDirectionElement.getAttribute('data-direction') : null;
        
        if (!hitTypeBtn || !selectedDirection) {
            showToast('打球種類と方向を選択してください');
            return;
        }
        
        pitchData.hitType = hitTypeBtn.getAttribute('data-hit');
        pitchData.direction = selectedDirection;
        selectedHitData = pitchData.hitType;
        selectedDirectionData = selectedDirection;
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
    if (atBatStartRunners === null && gs.balls === 0 && gs.strikes === 0) {
        atBatStartRunners = deepCopy(gs.runners);
    }
    
    if (result === 'look' || result === 'swing') {
        gs.strikes++;
    } else if (result === 'foul') {
        if (gs.strikes < 2) gs.strikes++;
    } else if (result === 'ball') {
        gs.balls++;
    }
    
    // ストライク/ボール数を更新
    pitchData.balls = gs.balls;
    pitchData.strikes = gs.strikes;
    pitchData.runnersBefore = deepCopy(gs.runners);
    pitchData.runners = deepCopy(gs.runners);
    
    // 投球を記録
    recordPitch(currentMatch, pitchData);
    
    // アウト判定
    let atBatFinished = false;
    if (result === 'inPlay') {
        atBatFinished = true;
        processAtBatResult(pitchData.atBatResult);
    } else if (result === 'hitByPitch') {
        atBatFinished = true;
        processAtBatResult('hitByPitch');
    } else if (gs.strikes >= 3) {
        atBatFinished = true;
        processAtBatResult('strikeout');
    } else if (gs.balls >= 4) {
        atBatFinished = true;
        processAtBatResult('walk');
    }

    if (atBatFinished) {
        pitchData.runners = deepCopy(gs.runners);
    }
    
    updateGameDisplay();
    showToast('投球を記録しました');
    
    // 入力フォームをクリア
    clearPitchForm();
    if (atBatFinished) {
        closeRunnerActions();
    }
}

/**
 * 打席結果を処理
 */
function processAtBatResult(result) {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    const runnersAtBatStart = atBatStartRunners ? deepCopy(atBatStartRunners) : deepCopy(gs.runners);
    const battingTeam = getBattingTeam();
    const batterIndex = getCurrentBatterIndex(gs);
    const batter = battingTeam?.lineup[batterIndex] || null;
    
    // アウトになる結果
    const outResults = ['strikeout', 'groundOut', 'flyOut', 'lineOut', 'buntOut', 'sacrifice', 'sacFly'];
    const scoringMap = { single: 1, double: 2, triple: 3 };
    let runsScored = 0;
    let willEndInning = false;
    
    if (outResults.includes(result)) {
        gs.outs++;
        willEndInning = gs.outs >= 3;
    } else {
        if (result === 'homerun') {
            runsScored += advanceRunnersForHomerun();
        } else if (scoringMap[result]) {
            runsScored += advanceRunnersByBases(scoringMap[result], batter);
        } else if (result === 'walk' || result === 'hitByPitch') {
            runsScored += advanceRunnersForWalk(batter);
        } else if (result === 'error' || result === 'fielderChoice' || result === 'other') {
            runsScored += advanceRunnersByBases(1, batter);
        }
    }

    addRunsToBattingTeam(runsScored);
    recordAtBat(currentMatch, {
        id: generateId(),
        timestamp: new Date().toISOString(),
        inning: gs.inning,
        order: gs.order,
        batter,
        pitcher: (getDefendingTeam()?.pitcher || null),
        result,
        hitType: selectedHitData,
        direction: selectedDirectionData,
        runners: runnersAtBatStart,
        runsScored
    });

    if (willEndInning) {
        endInning();
    } else {
        advanceBatter(true);
    }
    
    gs.strikes = 0;
    gs.balls = 0;
    atBatStartRunners = null;
}

/**
 * イニングを終了
 */
function endInning() {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    const nextOrder = gs.order === 0 ? 1 : 0;
    const nextInning = gs.order === 1 ? gs.inning + 1 : gs.inning;
    
    gs.inning = nextInning;
    gs.order = nextOrder;
    
    gs.outs = 0;
    gs.balls = 0;
    gs.strikes = 0;
    gs.runners = { base1: null, base2: null, base3: null };
    atBatStartRunners = null;
    setCurrentBatterIndex(gs, getCurrentBatterIndex(gs));
    const defendingPitcher = getDefendingTeam()?.pitcher?.name || '-';
    const battingTeam = getBattingTeam();
    const nextBatterIndex = getCurrentBatterIndex(gs);
    const nextBatter = battingTeam?.lineup?.[nextBatterIndex];
    showTransitionOverlay(`${gs.inning}回${getOrderName(gs.order)}\n投手：${defendingPitcher}\n打者：${nextBatterIndex + 1}番 ${nextBatter?.name || '-'}`);
    
    // 9回を超えたら試合終了フラグ
    if (gs.inning > 9) {
        gs.isActive = false;
    }
    
    saveCurrentMatch(currentMatch);
}

/**
 * 次の打者に移行
 */
function advanceBatter(showAnnouncement = false) {
    if (!currentMatch) return;
    
    const gs = currentMatch.gameState;
    const team = getBattingTeam();
    const currentIndex = getCurrentBatterIndex(gs);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= team.lineup.length) {
        nextIndex = 0;
    }
    setCurrentBatterIndex(gs, nextIndex);
    atBatStartRunners = null;

    if (showAnnouncement) {
        const nextBatter = team.lineup[nextIndex];
        showTransitionOverlay(`次の打者\n${nextIndex + 1}番 ${nextBatter?.name || '-'}`);
    }
    
    saveCurrentMatch(currentMatch);
}

/**
 * 投球フォームをクリア
 */
function clearPitchForm() {
    document.querySelectorAll('.pitch-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.result-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.hit-type-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('[data-direction]').forEach(node => node.classList.remove('selected'));
    document.getElementById('pitchSpeed').value = '';
    document.getElementById('selectedCourse').textContent = '未選択';
    document.getElementById('selectedDirection').textContent = '未選択';
    document.getElementById('atBatResult').value = '';
    document.getElementById('inPlaySection').style.display = 'none';
    selectedHitData = null;
    selectedDirectionData = null;
    
    // ストライクゾーンをリドロー
    drawStrikeZone('strikeZone', currentPerspective);
    drawFieldDiagram('fieldDiagram');
}

function showTransitionOverlay(message, duration = 1400) {
    const overlay = document.getElementById('transitionOverlay');
    const messageNode = document.getElementById('transitionMessage');
    if (!overlay || !messageNode) return;
    if (transitionTimer) {
        clearTimeout(transitionTimer);
    }
    messageNode.textContent = message;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    transitionTimer = setTimeout(() => {
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
    }, duration);
}

function advanceRunnersByBases(baseCount, batter) {
    if (!currentMatch) return 0;
    const gs = currentMatch.gameState;
    const nextRunners = { base1: null, base2: null, base3: null };
    let runs = 0;
    const current = gs.runners;
    const moveRunner = (runner, startBase) => {
        if (!runner) return;
        const destination = startBase + baseCount;
        if (destination >= 4) {
            runs++;
            return;
        }
        nextRunners[`base${destination}`] = runner;
    };

    moveRunner(current.base3, 3);
    moveRunner(current.base2, 2);
    moveRunner(current.base1, 1);

    if (baseCount >= 4) {
        runs++;
    } else {
        nextRunners[`base${baseCount}`] = batter;
    }

    gs.runners = nextRunners;
    return runs;
}

function advanceRunnersForHomerun() {
    if (!currentMatch) return 0;
    const gs = currentMatch.gameState;
    let runs = 1;
    if (gs.runners.base1) runs++;
    if (gs.runners.base2) runs++;
    if (gs.runners.base3) runs++;
    gs.runners = { base1: null, base2: null, base3: null };
    return runs;
}

function advanceRunnersForWalk(batter) {
    if (!currentMatch) return 0;
    const gs = currentMatch.gameState;
    const current = gs.runners;
    const nextRunners = { ...current };
    let runs = 0;

    const forceAtFirst = Boolean(current.base1);
    const forceAtSecond = Boolean(current.base1 && current.base2);
    const forceAtThird = Boolean(current.base1 && current.base2 && current.base3);

    if (forceAtThird) {
        runs++;
        nextRunners.base3 = current.base2;
        nextRunners.base2 = current.base1;
        nextRunners.base1 = batter;
    } else if (forceAtSecond) {
        nextRunners.base3 = current.base2;
        nextRunners.base2 = current.base1;
        nextRunners.base1 = batter;
    } else if (forceAtFirst) {
        nextRunners.base2 = current.base1;
        nextRunners.base1 = batter;
    } else {
        nextRunners.base1 = batter;
    }

    gs.runners = nextRunners;
    return runs;
}

function openRunnerActions(base) {
    selectedRunnerBase = base;
    const panel = document.getElementById('runnerActions');
    const title = document.getElementById('runnerActionsTitle');
    if (!panel || !title) return;
    const labelMap = { base1: '一塁', base2: '二塁', base3: '三塁', home: '本塁' };
    title.textContent = `${labelMap[base] || '塁'} の操作`;
    panel.style.display = 'block';
}

function closeRunnerActions() {
    const panel = document.getElementById('runnerActions');
    if (panel) panel.style.display = 'none';
    selectedRunnerBase = null;
}

function getRunnerSlot(base) {
    if (base === 'base1' || base === 'base2' || base === 'base3') return base;
    return null;
}

function moveRunnerBetweenBases(fromBase, toBase) {
    if (!currentMatch || !fromBase || !toBase) return;
    const runners = currentMatch.gameState.runners;
    if (!runners[fromBase] || runners[toBase]) {
        return;
    }
    runners[toBase] = runners[fromBase];
    runners[fromBase] = null;
}

function handleRunnerAction(action) {
    if (!currentMatch || !selectedRunnerBase) return;
    const gs = currentMatch.gameState;
    const slot = getRunnerSlot(selectedRunnerBase);
    const battingTeam = getBattingTeam();
    const batter = battingTeam?.lineup?.[getCurrentBatterIndex(gs)] || null;

    if (slot) {
        if (action === 'toggle') {
            if (gs.runners[slot]) {
                gs.runners[slot] = null;
            } else {
                if (!batter) {
                    showToast('打者情報が見つかりません');
                    return;
                }
                const alreadyOnBase = ['base1', 'base2', 'base3'].some(base => gs.runners[base]?.id === batter.id);
                if (alreadyOnBase) {
                    showToast('同じ選手が既に塁上にいます');
                    return;
                }
                gs.runners[slot] = batter;
            }
        } else if (action === 'advance') {
            if (slot === 'base1') moveRunnerBetweenBases('base1', 'base2');
            if (slot === 'base2') moveRunnerBetweenBases('base2', 'base3');
            if (slot === 'base3' && gs.runners.base3) {
                gs.runners.base3 = null;
                addRunsToBattingTeam(1);
            }
        } else if (action === 'retreat') {
            if (slot === 'base2') moveRunnerBetweenBases('base2', 'base1');
            if (slot === 'base3') moveRunnerBetweenBases('base3', 'base2');
        } else if (action === 'score' && gs.runners[slot]) {
            gs.runners[slot] = null;
            addRunsToBattingTeam(1);
        }
    } else if (selectedRunnerBase === 'home' && action === 'score') {
        if (gs.runners.base3) {
            gs.runners.base3 = null;
            addRunsToBattingTeam(1);
        } else {
            showToast('三塁走者がいないため得点にできません');
            return;
        }
    }

    saveCurrentMatch(currentMatch);
    updateGameDisplay();
    closeRunnerActions();
}

function moveBatterBy(step, showAnnouncement) {
    if (!currentMatch) return;
    const gs = currentMatch.gameState;
    const team = getBattingTeam();
    const lineupLength = team?.lineup?.length || 9;
    const currentIndex = getCurrentBatterIndex(gs);
    const nextIndex = (currentIndex + step + lineupLength) % lineupLength;
    setCurrentBatterIndex(gs, nextIndex);
    atBatStartRunners = null;
    gs.balls = 0;
    gs.strikes = 0;
    saveCurrentMatch(currentMatch);
    updateGameDisplay();
    clearPitchForm();
    if (showAnnouncement) {
        const nextBatter = team?.lineup?.[nextIndex];
        showTransitionOverlay(`次の打者\n${nextIndex + 1}番 ${nextBatter?.name || '-'}`);
    }
}

function moveHalfInning(step) {
    if (!currentMatch) return;
    const gs = currentMatch.gameState;
    let totalHalf = ((gs.inning - 1) * 2) + gs.order + step;
    if (totalHalf < 0) totalHalf = 0;
    gs.inning = Math.floor(totalHalf / 2) + 1;
    gs.order = totalHalf % 2;
    gs.outs = 0;
    gs.balls = 0;
    gs.strikes = 0;
    gs.runners = { base1: null, base2: null, base3: null };
    atBatStartRunners = null;
    setCurrentBatterIndex(gs, getCurrentBatterIndex(gs));
    saveCurrentMatch(currentMatch);
    updateGameDisplay();
    clearPitchForm();
    showTransitionOverlay(`${gs.inning}回${getOrderName(gs.order)} に移動`);
}

function changeHalfInning(mode) {
    if (!currentMatch) return;
    const gs = currentMatch.gameState;
    if (mode === 'bottom') {
        if (gs.order === 0) {
            gs.order = 1;
        } else {
            gs.order = 0;
            gs.inning += 1;
        }
    } else if (mode === 'nextTop') {
        if (gs.order === 1) {
            gs.order = 0;
            gs.inning += 1;
        } else {
            gs.order = 1;
        }
    }
    gs.outs = 0;
    gs.balls = 0;
    gs.strikes = 0;
    gs.runners = { base1: null, base2: null, base3: null };
    atBatStartRunners = null;
    setCurrentBatterIndex(gs, getCurrentBatterIndex(gs));
    saveCurrentMatch(currentMatch);
    updateGameDisplay();
    clearPitchForm();
    showTransitionOverlay(`${gs.inning}回${getOrderName(gs.order)} に変更`);
}

function moveToInning(inning) {
    if (!currentMatch) return;
    const gs = currentMatch.gameState;
    gs.inning = inning;
    gs.outs = 0;
    gs.balls = 0;
    gs.strikes = 0;
    gs.runners = { base1: null, base2: null, base3: null };
    atBatStartRunners = null;
    setCurrentBatterIndex(gs, getCurrentBatterIndex(gs));
    saveCurrentMatch(currentMatch);
    updateGameDisplay();
    clearPitchForm();
    showTransitionOverlay(`${inning}回${getOrderName(gs.order)} に移動`);
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
    const batter = team.lineup[getCurrentBatterIndex(gs)];
    
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
        'pitcher': {x: 150, y: 200},
        'catcher': {x: 150, y: 248},
        'first': {x: 225, y: 190},
        'second': {x: 186, y: 150},
        'third': {x: 76, y: 190},
        'shortstop': {x: 116, y: 150},
        'left': {x: 50, y: 115},
        'center': {x: 150, y: 70},
        'right': {x: 250, y: 115},
        'leftCenter': {x: 95, y: 95},
        'rightCenter': {x: 205, y: 95}
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
