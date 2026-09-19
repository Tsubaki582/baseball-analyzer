/* ============================================
   utils.js - ユーティリティ関数
   ============================================ */

/**
 * 日付をYYYY-MM-DD形式で取得
 */
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 日付をフォーマット (YYYY年MM月DD日)
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

/**
 * 球種の日本語名を取得
 */
function getPitchTypeName(type) {
    const pitchTypes = {
        'straight': 'ストレート',
        'slider': 'スライダー',
        'curve': 'カーブ',
        'fork': 'フォーク',
        'change': 'チェンジ',
        'changeup': 'チェンジ',
        'twoSeam': 'ツーシーム',
        'split': 'スプリット'
    };
    return pitchTypes[type] || type;
}

/**
 * 投球結果の日本語名を取得
 */
function getResultName(result) {
    const results = {
        'look': '見逃し',
        'swing': '空振り',
        'foul': 'ファウル',
        'ball': 'ボール',
        'hitByPitch': '死球',
        'inPlay': 'インプレー'
    };
    return results[result] || result;
}

/**
 * 打球種類の日本語名を取得
 */
function getHitTypeName(type) {
    const hitTypes = {
        'groundBall': 'ゴロ',
        'fly': 'フライ',
        'liner': 'ライナー',
        'bunt': 'バント'
    };
    return hitTypes[type] || type;
}

/**
 * 打球方向の日本語名を取得
 */
function getDirectionName(direction) {
    const directions = {
        'pitcher': '投手',
        'catcher': '捕手',
        'first': '一塁',
        'second': '二塁',
        'third': '三塁',
        'shortstop': '遊撃',
        'left': '左方向',
        'leftCenter': '左中間',
        'center': '中堅',
        'rightCenter': '右中間',
        'right': '右翼',
        'thirdShort': '三遊間',
        'shortRegular': '遊撃手正面',
        'secondShort': '二遊間',
        'firstSecond': '一二塁間',
        'firstLine': '一塁線',
        'thirdLine': '三塁線'
    };
    return directions[direction] || direction;
}

/**
 * 打席結果の日本語名を取得
 */
function getAtBatResultName(result) {
    const results = {
        'strikeout': '三振',
        'walk': '四球',
        'hitByPitch': '死球',
        'single': '単打',
        'double': '二塁打',
        'triple': '三塁打',
        'homerun': '本塁打',
        'groundOut': 'ゴロアウト',
        'flyOut': 'フライアウト',
        'lineOut': 'ライナーアウト',
        'buntOut': 'バントアウト',
        'error': 'エラー',
        'sacrifice': '犠打',
        'sacFly': '犠飛',
        'other': 'その他'
    };
    return results[result] || result;
}

/**
 * コース名を取得 (座標ベース)
 */
function getCourseName(row, col) {
    const courseMap = {
        '0-0': 'ボールゾーン(左上)',
        '0-1': 'ボールゾーン(上)',
        '0-2': 'ボールゾーン(上中央)',
        '0-3': 'ボールゾーン(上)',
        '0-4': 'ボールゾーン(右上)',
        '1-0': 'ボールゾーン(左)',
        '1-1': 'ストライクゾーン(左上)',
        '1-2': 'ストライクゾーン(上)',
        '1-3': 'ストライクゾーン(右上)',
        '1-4': 'ボールゾーン(右)',
        '2-0': 'ボールゾーン(左)',
        '2-1': 'ストライクゾーン(左)',
        '2-2': 'ストライクゾーン(中央)',
        '2-3': 'ストライクゾーン(右)',
        '2-4': 'ボールゾーン(右)',
        '3-0': 'ボールゾーン(左)',
        '3-1': 'ストライクゾーン(左下)',
        '3-2': 'ストライクゾーン(下)',
        '3-3': 'ストライクゾーン(右下)',
        '3-4': 'ボールゾーン(右)',
        '4-0': 'ボールゾーン(左下)',
        '4-1': 'ボールゾーン(下)',
        '4-2': 'ボールゾーン(下中央)',
        '4-3': 'ボールゾーン(下)',
        '4-4': 'ボールゾーン(右下)'
    };
    if (courseMap[`${row}-${col}`]) return courseMap[`${row}-${col}`];
    if (row <= 2 && col <= 2) {
        const legacy = {
            '0-0': '外角高め',
            '0-1': '中央高め',
            '0-2': '内角高め',
            '1-0': '外角',
            '1-1': '中央',
            '1-2': '内角',
            '2-0': '外角低め',
            '2-1': '中央低め',
            '2-2': '内角低め'
        };
        return legacy[`${row}-${col}`] || '不明';
    }
    return '不明';
}

/**
 * 打法の日本語名を取得
 */
function getBattingName(batting) {
    const battings = {
        'right': '右打ち',
        'left': '左打ち',
        'switch': '両打ち'
    };
    return battings[batting] || batting;
}

/**
 * 投法の日本語名を取得
 */
function getThrowName(throw_) {
    const throws = {
        'right': '右投げ',
        'left': '左投げ'
    };
    return throws[throw_] || throw_;
}

/**
 * 守備位置の日本語名を取得
 */
function getPositionName(position) {
    const positions = {
        'P': '投手',
        'C': '捕手',
        '1B': '一塁手',
        '2B': '二塁手',
        '3B': '三塁手',
        'SS': '遊撃手',
        'LF': '左翼手',
        'CF': '中堅手',
        'RF': '右翼手',
        'DH': 'DH'
    };
    return positions[position] || position;
}

/**
 * イニングが進行しているかをチェック
 */
function isValidInning(inning) {
    return inning >= 1 && inning <= 9;
}

/**
 * 攻守が正しいかをチェック (0 = 表, 1 = 裏)
 */
function getOrderName(order) {
    return order === 0 ? '表' : '裏';
}

/**
 * サムネイル用スコア文字列
 */
function getScoreDisplay(ownScore, opponentScore) {
    return `${ownScore} - ${opponentScore}`;
}

/**
 * 打率を計算
 */
function calculateBattingAverage(hits, atBats) {
    if (atBats === 0) return '.000';
    const avg = hits / atBats;
    return '.' + String(Math.floor(avg * 1000)).padStart(3, '0');
}

/**
 * 長打率を計算
 */
function calculateSluggingPercentage(bases, atBats) {
    if (atBats === 0) return '.000';
    const slugging = bases / atBats;
    return '.' + String(Math.floor(slugging * 1000)).padStart(3, '0');
}

/**
 * OPSを計算 (出塁率 + 長打率)
 */
function calculateOPS(hits, walks, atBats, hbp, bases) {
    if (atBats === 0) return '.000';
    const obp = (hits + walks + hbp) / (atBats + walks + hbp);
    const slg = bases / atBats;
    const ops = obp + slg;
    return '.' + String(Math.floor(ops * 1000)).padStart(3, '0');
}

/**
 * ユニークIDを生成
 */
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 深いコピー
 */
function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * オブジェクトが空かをチェック
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * 配列から要素を削除
 */
function removeFromArray(arr, element) {
    const index = arr.indexOf(element);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

/**
 * 配列から指定インデックスの要素を削除
 */
function removeAtIndex(arr, index) {
    if (index > -1 && index < arr.length) {
        arr.splice(index, 1);
    }
    return arr;
}

/**
 * 配列の要素を上下に入れ替え
 */
function moveArrayElement(arr, fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) {
        return arr;
    }
    const element = arr.splice(fromIndex, 1)[0];
    arr.splice(toIndex, 0, element);
    return arr;
}

/**
 * 数値をパディング (例: 05)
 */
function padNumber(num, length = 2) {
    return String(num).padStart(length, '0');
}

/**
 * 現在のカウント (B-S) の文字列を生成
 */
function getCountDisplay(balls, strikes) {
    return `${balls}-${strikes}`;
}

/**
 * アウト数の文字列を生成
 */
function getOutsDisplay(outs) {
    return `${outs}アウト`;
}

/**
 * イニング・表裏の文字列を生成
 */
function getInningDisplay(inning, order) {
    const orderName = order === 0 ? '表' : '裏';
    return `${inning}回${orderName}`;
}

/**
 * 小数点以下2桁で表示
 */
function formatDecimal(num, digits = 2) {
    return Number(num).toFixed(digits);
}

/**
 * 大数字をコンマ区切りで表示
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 色を明度で調整
 */
function adjustBrightness(color, percent) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return (usePound ? '#' : '') + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * ローカルストレージの値を安全に取得
 */
function safeGetLocal(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return defaultValue;
    }
}

/**
 * ローカルストレージに安全に保存
 */
function safeSaveLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error writing to localStorage:', e);
        return false;
    }
}

/**
 * ローカルストレージから削除
 */
function safeRemoveLocal(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error('Error removing from localStorage:', e);
        return false;
    }
}

/**
 * ストライクゾーンの座標を取得 (9分割)
 */
function getStrikeZoneCoordinates(row, col, perspective = 'catcher') {
    // 各ゾーンの中心座標 (相対位置)
    const zones = [
        [0.167, 0.167], [0.5, 0.167], [0.833, 0.167],  // 高め
        [0.167, 0.5],   [0.5, 0.5],   [0.833, 0.5],    // 中央
        [0.167, 0.833], [0.5, 0.833], [0.833, 0.833]   // 低め
    ];

    if (perspective === 'pitcher') {
        // 投手目線は左右反転
        return [1 - zones[row * 3 + col][0], zones[row * 3 + col][1]];
    }
    return zones[row * 3 + col];
}

/**
 * グラウンド上の打球位置を取得
 */
function getFieldPosition(x, y, canvasWidth, canvasHeight) {
    // キャンバスのパーセンテージ位置を計算
    const percentX = x / canvasWidth;
    const percentY = y / canvasHeight;

    // ホームベース中心を原点とした場合の判定
    // 1B方向: x > 0.5, y < 0.5
    // 3B方向: x < 0.5, y < 0.5
    // 外野: y > 0.5
    
    if (percentY < 0.3) {
        // 内野
        if (percentX > 0.6) return 'right';
        if (percentX < 0.4) return 'left';
        return 'center';
    } else if (percentY < 0.7) {
        // 外野浅め
        if (percentX > 0.65) return 'rightCenter';
        if (percentX < 0.35) return 'leftCenter';
        return 'center';
    } else {
        // 外野
        if (percentX > 0.6) return 'right';
        if (percentX < 0.4) return 'left';
        return 'center';
    }
}

/**
 * 環境情報 (デバッグ用)
 */
function logEnvironmentInfo() {
    console.log('=== 野球分析アプリ ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Platform:', navigator.platform);
    console.log('LocalStorage available:', typeof(Storage) !== 'undefined');
    const data = safeGetLocal('gameData', null);
    console.log('Stored data:', data);
}

/**
 * バージョン情報
 */
const APP_VERSION = '1.0.0';
const APP_NAME = '野球分析アプリ';
