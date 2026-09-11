/* ============================================
   uiState.js - UI状態管理（新規ファイル）
   ============================================ */

/**
 * UI状態の一時的な管理
 * localStorageとは分離し、メモリに保持
 */
const UIState = {
    // 現在編集中のチーム情報
    editingTeam: null,  // 'own' または 'opponent'
    
    // 現在編集中の選手情報
    editingPlayer: {
        id: null,
        isStarter: true,
        targetTeam: null,  // 'own' または 'opponent'
        targetList: null   // 'lineup' または 'bench'
    },
    
    // チーム一時データ（編集中）
    tempTeamData: {
        own: null,
        opponent: null
    },
    
    // 守備位置の使用状況（スタメンのみ）
    usedPositions: {
        own: [],
        opponent: []
    },
    
    /**
     * UI状態を初期化
     */
    reset() {
        this.editingTeam = null;
        this.editingPlayer = {
            id: null,
            isStarter: true,
            targetTeam: null,
            targetList: null
        };
        this.tempTeamData = {
            own: null,
            opponent: null
        };
        this.usedPositions = {
            own: [],
            opponent: []
        };
    },
    
    /**
     * 編集中のチームを設定
     */
    setEditingTeam(teamType) {
        this.editingTeam = teamType;  // 'own' または 'opponent'
    },
    
    /**
     * 現在編集中のチーム情報を取得
     */
    getEditingTeam() {
        return this.editingTeam;
    },
    
    /**
     * 編集中の選手情報を設定
     */
    setEditingPlayer(playerId, isStarter, targetTeam, targetList) {
        this.editingPlayer = {
            id: playerId,
            isStarter: isStarter,
            targetTeam: targetTeam,
            targetList: targetList
        };
    },
    
    /**
     * 守備位置を登録（スタメンのみ）
     */
    registerPosition(teamType, position, playerId) {
        if (!this.usedPositions[teamType]) {
            this.usedPositions[teamType] = [];
        }
        
        // 既に登録されている場合は削除
        this.usedPositions[teamType] = this.usedPositions[teamType].filter(p => p !== position);
        
        // 新規登録
        this.usedPositions[teamType].push(position);
    },
    
    /**
     * 守備位置を登録解除
     */
    unregisterPosition(teamType, position) {
        if (this.usedPositions[teamType]) {
            this.usedPositions[teamType] = this.usedPositions[teamType].filter(p => p !== position);
        }
    },
    
    /**
     * 使用可能な守備位置を取得
     */
    getAvailablePositions(teamType, currentPosition = null) {
        const allPositions = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
        const used = this.usedPositions[teamType] || [];
        
        // 現在の位置は使用可能にする（編集中の選手の位置）
        if (currentPosition) {
            return allPositions.filter(pos => !used.includes(pos) || pos === currentPosition);
        }
        
        return allPositions.filter(pos => !used.includes(pos));
    },
    
    /**
     * テンポラリなチームデータを設定
     */
    setTempTeamData(teamType, teamData) {
        this.tempTeamData[teamType] = deepCopy(teamData);
    },
    
    /**
     * テンポラリなチームデータを取得
     */
    getTempTeamData(teamType) {
        return this.tempTeamData[teamType];
    },
    
    /**
     * テンポラリなチームデータをクリア
     */
    clearTempTeamData(teamType) {
        this.tempTeamData[teamType] = null;
    }
};
