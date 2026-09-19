/* ============================================
   storage.js - LocalStorage管理
   ============================================ */

const STORAGE_KEYS = {
    CURRENT_MATCH: 'baseball_current_match',
    MATCHES_LIST: 'baseball_matches_list',
    TEAMS_LIST: 'baseball_teams_list',
    PLAYERS_LIST: 'baseball_players_list'
};

/**
 * 試合データの初期化
 */
function initializeMatchData() {
    return {
        id: generateId(),
        createdAt: new Date().toISOString(),
        matchInfo: {
            date: getTodayDate(),
            opponent: '',
            stadium: '',
            tournament: '',
            order: 'home'  // home = 先攻, away = 後攻
        },
        ownTeam: {
            name: '',
            lineup: [],  // スタメン9人
            bench: [],   // 控え選手
            pitcher: null
        },
        opponentTeam: {
            name: '',
            lineup: [],
            bench: [],
            pitcher: null
        },
        gameState: {
            inning: 1,
            order: 0,  // 0 = 表, 1 = 裏
            outs: 0,
            balls: 0,
            strikes: 0,
            ownScore: 0,
            opponentScore: 0,
            runners: {
                base1: null,
                base2: null,
                base3: null
            },
            currentBatterIndex: 0,
            currentPitcherIndex: 0,
            isActive: false
        },
        pitches: [],  // 投球履歴
        atBats: [],   // 打席履歴
        substitutions: []  // 交代履歴
    };
}

/**
 * 選手データの初期化
 */
function initializePlayerData() {
    return {
        number: null,
        name: '',
        batting: '',      // right, left, switch
        throw: '',        // right, left
        playerType: 'fielder',
        playerTypes: ['fielder'],  // 将来の二刀流対応に備え、複数適性を持てる配列も保持する
        position: '',     // P, C, 1B, 2B, 3B, SS, LF, CF, RF, DH
        atBats: 0,
        hits: 0,
        runs: 0,
        rbis: 0,
        strikeouts: 0,
        walks: 0,
        hitByPitch: 0,
        errors: 0,
        doubles: 0,
        triples: 0,
        homeruns: 0
    };
}

/**
 * 投球データの初期化
 */
function initializePitchData() {
    return {
        id: generateId(),
        timestamp: new Date().toISOString(),
        inning: 1,
        order: 0,  // 0 = 表, 1 = 裏
        batter: null,      // プレイヤー情報
        pitcher: null,     // プレイヤー情報
        sequenceInAB: 0,   // この打席での球数
        pitchType: '',     // ストレート等
        speed: null,
        course: null,      // {row: 0-2, col: 0-2}
        perspective: 'catcher',
        result: '',        // 見逃し、空振り等
        balls: 0,
        strikes: 0,
        inPlay: false,
        hitType: null,     // ゴロ、フライ等
        direction: null,   // 打球方向
        atBatResult: null, // 打席の結果
        runners: {}        // 走者状況
    };
}

/**
 * 試合データを保存
 */
function saveCurrentMatch(matchData) {
    return safeSaveLocal(STORAGE_KEYS.CURRENT_MATCH, matchData);
}

/**
 * 現在の試合データを取得
 */
function getCurrentMatch() {
    return safeGetLocal(STORAGE_KEYS.CURRENT_MATCH, null);
}

/**
 * 現在の試合データをクリア
 */
function clearCurrentMatch() {
    return safeRemoveLocal(STORAGE_KEYS.CURRENT_MATCH);
}

/**
 * 完了した試合をリストに追加
 */
function addCompletedMatch(matchData) {
    const matchesList = safeGetLocal(STORAGE_KEYS.MATCHES_LIST, []);
    matchesList.push(matchData);
    return safeSaveLocal(STORAGE_KEYS.MATCHES_LIST, matchesList);
}

/**
 * 完了した試合のリストを取得
 */
function getCompletedMatches() {
    return safeGetLocal(STORAGE_KEYS.MATCHES_LIST, []);
}

/**
 * 特定の試合データを取得
 */
function getMatchById(matchId) {
    const matches = getCompletedMatches();
    return matches.find(match => match.id === matchId) || null;
}

/**
 * 試合を削除
 */
function deleteMatch(matchId) {
    let matches = getCompletedMatches();
    matches = matches.filter(match => match.id !== matchId);
    return safeSaveLocal(STORAGE_KEYS.MATCHES_LIST, matches);
}

/**
 * チームデータを保存
 */
function saveTeam(teamData) {
    const teams = safeGetLocal(STORAGE_KEYS.TEAMS_LIST, []);
    const existingIndex = teams.findIndex(t => t.id === teamData.id);
    
    if (existingIndex >= 0) {
        teams[existingIndex] = teamData;
    } else {
        teams.push(teamData);
    }
    
    return safeSaveLocal(STORAGE_KEYS.TEAMS_LIST, teams);
}

/**
 * 登録済みチームのリストを取得
 */
function getTeams() {
    return safeGetLocal(STORAGE_KEYS.TEAMS_LIST, []);
}

/**
 * 特定のチームを取得
 */
function getTeamById(teamId) {
    const teams = getTeams();
    return teams.find(team => team.id === teamId) || null;
}

/**
 * チームを削除
 */
function deleteTeam(teamId) {
    let teams = getTeams();
    teams = teams.filter(team => team.id !== teamId);
    return safeSaveLocal(STORAGE_KEYS.TEAMS_LIST, teams);
}

/**
 * プレイヤーデータを保存 (チームに紐付けない独立した選手データベース)
 */
function savePlayer(playerData) {
    const players = safeGetLocal(STORAGE_KEYS.PLAYERS_LIST, []);
    const existingIndex = players.findIndex(p => p.id === playerData.id);
    
    if (existingIndex >= 0) {
        players[existingIndex] = playerData;
    } else {
        players.push(playerData);
    }
    
    return safeSaveLocal(STORAGE_KEYS.PLAYERS_LIST, players);
}

/**
 * 全プレイヤーを取得
 */
function getAllPlayers() {
    return safeGetLocal(STORAGE_KEYS.PLAYERS_LIST, []);
}

/**
 * プレイヤーを削除
 */
function deletePlayer(playerId) {
    let players = getAllPlayers();
    players = players.filter(player => player.id !== playerId);
    return safeSaveLocal(STORAGE_KEYS.PLAYERS_LIST, players);
}

/**
 * 投球を記録
 */
function recordPitch(matchData, pitchData) {
    matchData.pitches.push(pitchData);
    return saveCurrentMatch(matchData);
}

/**
 * 打席を記録
 */
function recordAtBat(matchData, atBatData) {
    matchData.atBats.push(atBatData);
    return saveCurrentMatch(matchData);
}

/**
 * 最後の投球を取消
 */
function undoLastPitch(matchData) {
    if (matchData.pitches.length > 0) {
        const lastPitch = matchData.pitches.pop();
        
        // ゲーム状態を戻す
        matchData.gameState.balls = Math.max(0, matchData.gameState.balls - (lastPitch.result === 'ball' ? 1 : 0));
        matchData.gameState.strikes = Math.max(0, matchData.gameState.strikes - (lastPitch.result === 'look' || lastPitch.result === 'foul' ? 1 : 0));
        
        saveCurrentMatch(matchData);
        return true;
    }
    return false;
}

/**
 * 投球履歴から打席の投球を取得
 */
function getAtBatPitches(matchData, batterIndex, atBatNumber) {
    return matchData.pitches.filter(pitch => 
        pitch.batter && pitch.batter.index === batterIndex && pitch.sequenceInAB > 0
    );
}

/**
 * 打者ごとの成績を集計
 */
function calculateBatterStats(matchData) {
    const stats = {};
    
    matchData.atBats.forEach(atBat => {
        const batterId = atBat.batter.id;
        
        if (!stats[batterId]) {
            stats[batterId] = {
                player: atBat.batter,
                atBats: 0,
                hits: 0,
                runs: 0,
                rbis: 0,
                strikeouts: 0,
                walks: 0,
                hitByPitch: 0,
                doubles: 0,
                triples: 0,
                homeruns: 0,
                singles: 0,
                groundOuts: 0,
                flyOuts: 0,
                lineOuts: 0,
                errors: 0,
                sacrifices: 0,
                sacFlies: 0,
                pitches: []
            };
        }
        
        const stat = stats[batterId];
        
        // 打席数と結果を記録
        if (atBat.result !== 'walk' && atBat.result !== 'hitByPitch' && atBat.result !== 'sacrifice' && atBat.result !== 'sacFly' && atBat.result !== 'error') {
            stat.atBats++;
        }
        
        switch(atBat.result) {
            case 'strikeout':
                stat.strikeouts++;
                break;
            case 'walk':
                stat.walks++;
                break;
            case 'hitByPitch':
                stat.hitByPitch++;
                break;
            case 'single':
                stat.hits++;
                stat.singles++;
                break;
            case 'double':
                stat.hits++;
                stat.doubles++;
                break;
            case 'triple':
                stat.hits++;
                stat.triples++;
                break;
            case 'homerun':
                stat.hits++;
                stat.homeruns++;
                stat.runs++;
                stat.rbis++;
                break;
            case 'groundOut':
                stat.groundOuts++;
                break;
            case 'flyOut':
                stat.flyOuts++;
                break;
            case 'lineOut':
                stat.lineOuts++;
                break;
            case 'error':
                stat.errors++;
                break;
            case 'sacrifice':
                stat.sacrifices++;
                break;
            case 'sacFly':
                stat.sacFlies++;
                break;
        }
    });
    
    return stats;
}

/**
 * 投手ごとの成績を集計
 */
function calculatePitcherStats(matchData) {
    const stats = {};
    
    matchData.pitches.forEach(pitch => {
        if (!pitch.pitcher) return;
        
        const pitcherId = pitch.pitcher.id;
        
        if (!stats[pitcherId]) {
            stats[pitcherId] = {
                player: pitch.pitcher,
                pitches: 0,
                strikes: 0,
                balls: 0,
                strikeouts: 0,
                walks: 0,
                hits: 0,
                runsAllowed: 0,
                earnedRuns: 0,
                homeruns: 0,
                hitByPitch: 0
            };
        }
        
        const stat = stats[pitcherId];
        stat.pitches++;
        
        if (pitch.result === 'look' || pitch.result === 'swing' && pitch.result !== 'foul' || pitch.result === 'foul') {
            stat.strikes++;
        } else if (pitch.result === 'ball' || pitch.result === 'hitByPitch') {
            if (pitch.result === 'ball') {
                stat.balls++;
            } else {
                stat.hitByPitch++;
            }
        }
    });
    
    return stats;
}

/**
 * 全データをエクスポート (バックアップ用)
 */
function exportAllData() {
    return {
        currentMatch: getCurrentMatch(),
        completedMatches: getCompletedMatches(),
        teams: getTeams(),
        players: getAllPlayers(),
        exportedAt: new Date().toISOString()
    };
}

/**
 * 全データをインポート (復元用)
 */
function importAllData(data) {
    try {
        if (data.currentMatch) {
            safeSaveLocal(STORAGE_KEYS.CURRENT_MATCH, data.currentMatch);
        }
        if (data.completedMatches) {
            safeSaveLocal(STORAGE_KEYS.MATCHES_LIST, data.completedMatches);
        }
        if (data.teams) {
            safeSaveLocal(STORAGE_KEYS.TEAMS_LIST, data.teams);
        }
        if (data.players) {
            safeSaveLocal(STORAGE_KEYS.PLAYERS_LIST, data.players);
        }
        return true;
    } catch (e) {
        console.error('Error importing data:', e);
        return false;
    }
}

/**
 * 全データをクリア (デバッグ用)
 */
function clearAllData() {
    safeRemoveLocal(STORAGE_KEYS.CURRENT_MATCH);
    safeRemoveLocal(STORAGE_KEYS.MATCHES_LIST);
    safeRemoveLocal(STORAGE_KEYS.TEAMS_LIST);
    safeRemoveLocal(STORAGE_KEYS.PLAYERS_LIST);
}

/**
 * ストレージサイズをチェック
 */
function getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return (total / 1024).toFixed(2) + ' KB';
}

/**
 * ストレージ情報をログ
 */
function logStorageInfo() {
    console.log('=== ストレージ情報 ===');
    console.log('使用容量:', getStorageSize());
    console.log('完了した試合:', getCompletedMatches().length);
    console.log('登録済みチーム:', getTeams().length);
    console.log('プレイヤーデータ:', getAllPlayers().length);
}
