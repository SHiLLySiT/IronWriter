"use strict";

const VERSION = "0.2.0";
const MAX_EXPERIENCE = 30;
const MAX_PROGRESS = 10;

const CHALLENGE_RANKS = {
    troublesome: 12,
    dangerous: 8,
    formidable: 4,
    extreme: 2,
    epic: 1,
};

const STATS = {
    edge: 0,
    heart: 0,
    iron: 0,
    shadow: 0,
    wits: 0,
    health: 0,
    supply: 0,
    spirit: 0,
    momentum: 0,
    momentumMax: 0,
    momentumReset: 0,
    experience: 0,
    experienceSpent: 0,
    bonds: 0,
};

const DEBILITIES = {
    wounded: 0,
    shaken: 0,
    unprepared: 0,
    encumbered: 0,
    maimed: 0,
    corrupted: 0,
    cursed: 0,
    tormented: 0,
};

const EventType = {
    None: 'none',
    Fiction: 'fiction',
    Meta: 'meta',
    Roll: 'roll',
}

class Session {
    constructor() {
        this.version = VERSION;
        this.state = new GameState();
        /**
         * @type {Moment[]}
         */
        this.history = [];
        this.momentIndex = -1;
    }

    /**
     * @param {Moment} moment
     */
    addMoment(moment) {
        this.history.push(moment);
        moment.applyMoment(this.state);
        this.momentIndex++;
    }

    /**
     * @param {Moment} moment
     */
    updateMoment(index, moment) {
        this.history[index] = moment;
    }

    /**
     * @param {number} index
     */
    removeMoment(index) {
        this.history.splice(index, 1);
    }

    /**
     * @param {number} index
     */
    gotoMoment(index) {
        let dir = Math.sign(index - this.momentIndex);
        if (dir == -1) {
            for (let i = this.momentIndex; i > index; i--) {
                this.history[i].unapplyMoment(this.state, this.history[i]);
            }
        } else if (dir == 1) {
            for (let i = this.momentIndex + 1; i <= index; i++) {
                this.history[i].applyMoment(this.state);
            }
        }
        this.momentIndex = index;
    }

    gotoPresentMoment() {
        this.gotoMoment(this.history.length - 1);
    }
}

class GameState {
    constructor() {
        this.characterName = "";

        /**
         * @type {Object.<string, Number>}
         */
        this.stats = {};
        for (let p in STATS) {
            this.stats[p] = 0;
        }

        /**
         * @type {Object.<string, Boolean>}
         */
        this.debilities = {};
        for (let p in DEBILITIES) {
            this.debilities[p] = false;
        }

        /**
         * @type {Object.<string, Progress>}
         */
        this.progress = {};

        /**
         * @type {Object.<string, Bond>}
         */
        this.bonds = {};

        /**
         * @type {Object.<string, Asset>}
         */
        this.assets = {};
    }
}

class Asset {
    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
        /**
         * @type {Object.<string, AssetProperty>}
         */
        this.properties = {};
        this.upgrades = [false, false, false];
    }
}

class AssetProperty {
    constructor() {
        this.name = "";
        this.value = undefined;
    }
}

class Bond {
    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
    }
}

class Progress {
    /**
     * @param {String} name
     * @param {String} rank
     * @param {Number} value
     */
    constructor(name, rank, value) {
        this.name = name;
        this.rank = rank;
        this.value = value;
    }
}

class Moment {
    
    /**
     * @param {string} input
     * @param {string} type
     */
    constructor(input, type) {
        /**
         * @type {Action[]}
         */
        this.actions = [];
        /**
         * @type {GameState}
         */
        this.state = undefined;
        this.input = input;
        this.type = type;
    }

    /**
     * @param {Action} action
     */
    addAction(action) {
        if (action === undefined) {
            return;
        }
        this.actions.push(action);
    }

    /**
     * @param {GameState} gameState
     */
    applyMoment(gameState) {
        this.state = _.cloneDeep(gameState);
        for (let i = 0; i < this.actions.length; i++) {
            this.actions[i].applyAction(gameState, this);
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyMoment(gameState, moment) {
        for (let i = 0; i < this.actions.length; i++) {
            this.actions[i].unapplyAction(gameState, this);
        }
    }
}

class Action {
    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
    }
}

class AssetAction extends Action {
    /**
     * @param {string} assetId
     */
    constructor(assetId) {
        super();
        this.type = "AssetAction";
        this.assetId = assetId;
        this.action = "";
        this.assetName = "";
        this.upgradeIndex = -1;
        this.propertyId = "";
        this.propertyName = "";
        this.propertyValue = undefined;
        this.propertyModifier = "";
    }

   /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        if (this.action == "add") {
            gameState.assets[this.assetId] = new Asset(this.assetName);
        } else if (this.action == "remove") {
            delete gameState.assets[this.assetId];
        } else if (this.action == "update") {
            if (gameState.assets[this.assetId] === undefined) {
                return;
            }

            let prop = gameState.assets[this.assetId].properties[this.propertyId];
            if (prop === undefined) {
                let prop = new AssetProperty();
                prop.name = this.propertyName;
                prop.value = this.propertyValue;
                gameState.assets[this.assetId].properties[this.propertyId] = prop;
            } else {
                if (isNaN(prop.value)) {
                    prop.value = this.propertyValue;
                } else {
                    if (this.propertyModifier == "+") {
                        prop.value += this.propertyValue;
                    } else if (this.propertyModifier == "-") {
                        prop.value -= this.propertyValue;
                    } else {
                        prop.value = this.propertyValue;
                    }
                }
            }
        } else if (this.action == "upgrade") {
            if (gameState.assets[this.assetId] === undefined) {
                return;
            }

            gameState.assets[this.assetId].upgrades[this.upgradeIndex] = true;
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        gameState.assets[this.assetId] = moment.state.assets[this.assetId];
    }
}

class StatAction extends Action {
    /**
     * @param {String} stat
     * @param {String} modifier
     * @param {Number} value
     */
    constructor(statId, modifier, value) {
        super();
        this.type = "StatAction";
        this.statId = statId;
        this.modifier = modifier;
        this.value = value;
    }

   /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        if (this.modifier == "+") {
            gameState.stats[this.statId] += this.value;
        } else if (this.modifier == "-") {
            gameState.stats[this.statId] -= this.value;
        } else {
            gameState.stats[this.statId] = this.value;
        }
        
        if (gameState.stats.momentumReset < 0) {
            gameState.stats.momentumReset = 0;
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        gameState.stats[this.statId] = moment.state.stats[this.statId];
    }
}

class CharacterNameAction extends Action {
    /**
     * @param {string} newName
     */
    constructor(newName) {
        super();
        this.type = "CharacterNameAction";
        this.characterName = newName;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        gameState.characterName = this.characterName;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        gameState.characterName = moment.state.characterName;
    }
}

class DebilityAction extends Action {
    /**
     * @param {string} debilityId
     * @param {Boolean} value
     */
    constructor(debilityId, value) {
        super();
        this.type = "DebilityAction";
        this.debilityId = debilityId;
        this.value = value;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        gameState.debilities[this.debilityId] = this.value;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        gameState.debilities[this.debilityId] = moment.state.debilities[this.debilityId];
    }
}

class ProgressAction extends Action {
    constructor(progressId) {
        super();
        this.type = "ProgressAction";
        this.progressId = progressId;
        this.progressName = "";
        this.rank = "";
        this.action = "";
        this.modifier = "";
        this.value = 0;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        if (this.action == "add") {
            if (gameState.progress[this.progressId] !== undefined) {
                return;
            }

            gameState.progress[this.progressId] = new Progress(
                this.progressName,
                this.rank,
                0,
            );
        } else {
            if (gameState.progress[this.progressId] === undefined) {
                return;
            }

            if (this.action == "complete") {
                delete gameState.progress[this.progressId];
            } else if (this.action == "progress") {
                let state = gameState.progress[this.progressId];
                state.value = state.value + CHALLENGE_RANKS[state.rank];
            } else if (this.action == "tick") {
                let state = gameState.progress[this.progressId];
                if (this.modifier == "+") {
                    state.value += this.value;
                } else if (this.modifier == "-") {
                    state.value -= this.value;
                } else {
                    state.value = this.value;
                }
            }
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        if (this.action == "add") {
            gameState.progress[this.progressId] = moment.state.progress[this.progressId];
        } else if (this.action == "complete") {
            gameState.progress[this.progressId] = moment.state.progress[this.progressId];
        } else {
            if (gameState.progress[this.progressId] === undefined) {
                return;
            }

            if (this.action == "progress") {
                let state = gameState.progress[this.progressId];
                state.value = state.value - CHALLENGE_RANKS[state.rank];
            } else if (this.action == "tick") {
                let state = gameState.progress[this.progressId];
                state.value = moment.state.progress[this.progressId].value;
            }
        }
    }
}

class BondAction extends Action {
    /**
     * @param {string} bondId
     */
    constructor(bondId) {
        super();
        this.type = "BondAction";
        this.bondId = bondId;
        this.action = "";
        this.bondName = "";
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        if (this.action == "add") {
            if (gameState.bonds[this.bondId] === undefined) {
                gameState.bonds[this.bondId] = new Bond(this.bondName);
                gameState.stats.bonds++;
            }
        } else if (this.action == "remove") {
            if (gameState.bonds[this.bondId] !== undefined) {
                delete gameState.bonds[this.bondId];
                gameState.stats.bonds--;
            }
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        if (this.action == "add") {
            if (moment.state.bonds[this.bondId] === undefined) {
                delete gameState.bonds[this.bondId];
                gameState.stats.bonds--;
            }
        } else if (this.action == "remove") {
            if (moment.state.bonds[this.bondId] !== undefined) {
                gameState.bonds[this.bondId] = moment.state.bonds[this.bondId];
                gameState.stats.bonds++;
            }
        }
    }
}

class OracleAction extends Action {
    /**
     * @param {string} oracleType
     */
    constructor(oracleType) {
        super();
        this.type = "OracleAction";
        this.oracleType = oracleType;
    }

   /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        // oracles do not change state
    }

   /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        // oracles do not change state
    }
}

class RollAction extends Action {
    /**
     * @param {string} statAdd
     * @param {number} genericAdd
     * @param {string} source
     */
    constructor(statAdd, genericAdd, source) {
        super();
        this.type = "RollAction";
        
        this.statAddName = statAdd;
        this.genericAdd = Number(genericAdd);
        this.challenge = [0, 0];
        this.action = 0;
        this.source = source;
        
        this.reroll();
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        let statAddValue = 0;
        if (this.statAddName.length > 0) {
            statAddValue = gameState.stats[this.statAddName];
        }

        let actionValue = this.action;
        if (this.source != "actionDie" && moment.state.progress[this.source] !== undefined) {
            let ticks = moment.state.progress[this.source].value;
            actionValue = Math.floor(ticks / 4);
        }

        let result = "> Weak Hit";
        let totalAction = actionValue + statAddValue + this.genericAdd;
        if (totalAction < this.challenge[0] && totalAction < this.challenge[1]) {
            result = "> Miss"
        } else if (totalAction > this.challenge[0] && totalAction > this.challenge[1]) {
            result = "> Strong Hit"
        }
        if (this.challenge[0] == this.challenge[1]) {
            result += " (Match)";
        }

        let challengeOutput = "Challenge: [" + this.challenge[0] + ", " + this.challenge[1] + "]";

        let actionOutput = undefined;
        if (this.source != "actionDie" && moment.state.progress[this.source] !== undefined) {
            actionOutput = "Action: " + actionValue + " (" + moment.state.progress[this.source].name + ")";
        } else {
            actionOutput = "Action: [" + actionValue + "]";
        }
        
        if (this.statAddName.length > 0) {
            actionOutput += " + " + statAddValue + " (" + this.statAddName + ")";
        }
        if (this.genericAdd > 0) {
            actionOutput += " + " + this.genericAdd;
        }
        if (this.statAddName.length > 0 || this.genericAdd > 0) {
            actionOutput += " = " + totalAction;
        }

        moment.input = challengeOutput + "\n" + actionOutput + "\n" + result;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        
    }

    reroll() {
        this.challenge = new rpgDiceRoller.DiceRoll("2d10").rolls[0];
        this.action = new rpgDiceRoller.DiceRoll("1d6").rolls[0][0];
    }
}

const ACTION_TYPES = {
    "StatAction": StatAction,
    "CharacterNameAction": CharacterNameAction,
    "DebilityAction": DebilityAction,
    "ProgressAction": ProgressAction,
    "BondAction": BondAction,
    "OracleAction": OracleAction,
    "RollAction": RollAction,
    "AssetAction": AssetAction,
}

let statElements = {};
for (let p in STATS) {
    statElements[p] = undefined;
}

let debilityElements = {
    none: undefined,
};
for (let p in DEBILITIES) {
    debilityElements[p] = undefined;
}

let experience = undefined;
let submitButton = undefined;
let cancelButton = undefined;
let saveButton = undefined;
let fictionEventTemplate = undefined;
let metaEventTemplate = undefined;
let entryInput = undefined;
let eventHistory = undefined;
let progressCard = undefined;
let progressTrackTemplate = undefined;
let bondCard = undefined;
let bondTemplate = undefined;
let characterName = undefined;
let modeSwitch = undefined;
let assetCard = undefined;
let assetTemplate = undefined;
let confirmDialog = undefined;

let isControlPressed = false;
let bondProgressTrack = undefined;
let edittingEvent = null;
let oldEditEventColor = {
    background: "#FF",
    border: "#FF",
};
let oldInput = "";
let oldMode = false;

let session = new Session();

window.addEventListener("load", handleInit);

function handleInit() {
    window.mdc.autoInit();

    let rollContainer = document.querySelector(".roll-container");
    rollContainer.style.display = "none";

    let oracleContainer = document.querySelector(".oracle-container");
    oracleContainer.style.display = "none";

    let storyContainer = document.querySelector(".story-container");

    let inputTab = new mdc.tabBar.MDCTabBar(document.querySelector(".mdc-tab-bar"));
    inputTab.listen("MDCTabBar:activated", (event) => {
        if (event.detail.index == 0) {
            storyContainer.style.display = "block";
            rollContainer.style.display = "none";
            oracleContainer.style.display = "none";
        } else if (event.detail.index == 1) {
            storyContainer.style.display = "none";
            rollContainer.style.display = "flex";
            oracleContainer.style.display = "none";
        } else if (event.detail.index == 2) {
            storyContainer.style.display = "none";
            rollContainer.style.display = "none";
            oracleContainer.style.display = "flex";
        }

        // dropdown sizes reset when hidden via tab switching
        resizeDropdowns();
    });

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", resizeDropdowns);

    confirmDialog = document.getElementById("confirm-dialog").MDCDialog;

    entryInput = document.getElementById("event-input");

    eventHistory = document.getElementById("event-history");

    fictionEventTemplate = document.getElementById("fiction-event-template");
    fictionEventTemplate.remove();

    metaEventTemplate = document.getElementById("meta-event-template");
    metaEventTemplate.remove();

    characterName = document.getElementById("character-name");

    document.getElementById("import").addEventListener("click", () => {
        importSession();
    });

    document.getElementById("export").addEventListener("click", () => {
        exportSession();
    });

    document.getElementById("new").addEventListener("click", () => {
        let handler = (action) => { 
            confirmDialog.root_.removeEventListener("MDCDialog:closed", handler);
            if (action.detail.action == "accept") {
                newSession();
            }
        };
        confirmDialog.root_.addEventListener("MDCDialog:closed", handler);
        confirmDialog.content_.textContent = "Are you sure you want to start a new session? Your current session will be deleted.";
        confirmDialog.open();
    });

    document.getElementById("help").addEventListener("click", () => {
        window.open("https://github.com/SHiLLySiT/IronWriter/blob/master/readme.md");
    });

    modeSwitch = document.getElementById("mode-switch").MDCIconButtonToggle;

    document.getElementById("version").textContent = "v" + VERSION;

    submitButton = document.getElementById("submit-event");
    submitButton.addEventListener("click", handleSubmitEvent);

    cancelButton = document.getElementById("cancel-event");
    cancelButton.addEventListener("click", handleCancelEditEvent);
    cancelButton.style.display = "none";

    saveButton = document.getElementById("save-event");
    saveButton.addEventListener("click", handleSaveEditEvent);
    saveButton.style.display = "none";

    initProgressTrack();
    initExperience();
    initDebilities();
    initStats();
    initBonds();
    initRoll();
    initOracle();
    initAssets();

    window.requestAnimationFrame(() => {
        let str = localStorage.getItem("session");
        if (str === undefined || str === null) {
            newSession();
            refresh();
        } else {
            loadSession(str);
        }

        document.getElementById("page-container").style.display = "flex";

        let events = eventHistory.querySelectorAll("#event-history .event-base");
        if (events.length > 0) {
            let lastEvent = events[events.length - 1];
            lastEvent.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
    });    
}

function newSession() {
    session = new Session();
    
    let initialMoment = new Moment("", EventType.None);
    initialMoment.addAction(new CharacterNameAction("New Character"));
    initialMoment.addAction(new StatAction("momentum", "=", 2));
    initialMoment.addAction(new StatAction("momentumReset", "=", 2));
    initialMoment.addAction(new StatAction("momentumMax", "=", 10));
    initialMoment.addAction(new StatAction("health", "=", 5));
    initialMoment.addAction(new StatAction("supply", "=", 5));
    initialMoment.addAction(new StatAction("spirit", "=", 5));
    initialMoment.addAction(new StatAction("spirit", "=", 5));
    session.addMoment(initialMoment);

    saveSession();
    clearEventHistory();
    refresh();
}

function importSession() {
    let linkElement = document.createElement("input");
    linkElement.setAttribute("type", "file");
    linkElement.addEventListener("change", () => {
        let file = event.target.files[0];
        var reader = new FileReader();
        reader.addEventListener("load", () => {
            loadSession(reader.result); 
            saveSession();
        });
        reader.readAsText(file);
    });
    linkElement.click();
}

function exportSession() {
    let str = JSON.stringify(session);
    let uri = "data:application/json;charset=utf-8,"+ encodeURIComponent(str);

    let exportFileDefaultName = "data.json";

    let linkElement = document.createElement("a");
    linkElement.setAttribute("href", uri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
}

function saveSession() {
    let str = JSON.stringify(session);
    localStorage.setItem("session", str);
}

function loadSession(str) {
    let json = JSON.parse(str);
    session = _.merge(new Session, json);
    for (let i = 0; i < session.history.length; i++) {
        session.history[i] = _.merge(new Moment, session.history[i]);
        for (let j = 0; j < session.history[i].actions.length; j++) {
            let type = session.history[i].actions[j].type;
            session.history[i].actions[j] = _.merge(new ACTION_TYPES[type], session.history[i].actions[j]);
        }
    }

    for (let i = 0; i < session.history.length; i++) {
        let moment = session.history[i];
        if (moment.type == EventType.None) {
            continue;
        }
        addEvent(i, moment.input, moment.type);
    }
    refresh();
}

function initAssets() {
    assetCard = document.getElementById("asset-card");
    assetTemplate = document.getElementById("asset-template");
    assetTemplate.remove();
}

function initRoll() {
    let rollSource = document.getElementById("roll-source");
    let rollStats = document.getElementById("roll-stats");
    let rollAdd = document.getElementById("roll-add");

    let rollButton = document.getElementById("roll");
    rollButton.addEventListener("click", () => {
        doRoll(rollStats.MDCSelect.value, rollAdd.value, rollSource.MDCSelect.value);
    });
    
    let rollResetButton = document.getElementById("roll-reset");
    rollResetButton.addEventListener("click", () => {
        rollSource.MDCSelect.selectedIndex = 0;
        rollStats.MDCSelect.selectedIndex = -1;
        rollAdd.value = "";
    });
}

function initOracle() {
    let template = document.getElementById("oracle-template");
    let container = template.parentElement;
    template.remove();

    for (let type in ORACLE) {
        let item = template.cloneNode(true);
        item.querySelector(".js-value").textContent = type;
        item.addEventListener("click", () => handleSelectOracle(type));
        container.appendChild(item);
    }
}

function initStats() {
    for (let p in statElements) {
        let container = document.getElementById("stat-" + p);
        if (container === null) {
            delete statElements[p];
            continue;
        }
        statElements[p] = container.querySelector(".stat-value");
    }
}

function initDebilities() {
    for (let p in debilityElements) {
        debilityElements[p] = document.getElementById("debility-" + p);
        debilityElements[p].style.display = "none";
    }
    debilityElements["none"].style.display = "";
}

function initExperience() {
    experience = document.getElementById("experience");
    let template = experience.querySelector(".dot");
    let container = experience.querySelector(".wrapper");
    for (let i = 0; i < MAX_EXPERIENCE - 1; i++) {
        let dot = template.cloneNode(true);
        container.insertBefore(dot, container.lastChild);
    }
}

function initProgressTrack() {
    progressCard = document.getElementById("progress-card");

    progressTrackTemplate = document.getElementById("progress-track-template");
    progressTrackTemplate.remove();

    let boxTemplate = progressTrackTemplate.querySelector(".box");
    let ticks = boxTemplate.querySelectorAll(".tick");
    for (let j = 0; j < ticks.length; j++) {
        ticks[j].style.display = "none";
    }

    let container = progressTrackTemplate.querySelector(".wrapper");
    for (let i = 0; i < MAX_PROGRESS - 1; i++) {
        let box = boxTemplate.cloneNode(true);
        container.insertBefore(box, container.lastChild);
    }
}

function initBonds() {
    bondCard = document.getElementById("bond-card")
    let bondContainer = bondCard.querySelector(".track-container");
    bondProgressTrack = createProgressTrack(null, null, false);
    bondContainer.append(bondProgressTrack);

    bondTemplate = document.getElementById("bond-template");
    bondTemplate.remove();
}

/**
 * @param {Asset} asset
 */
function createAsset(asset) {
    let newAsset = assetTemplate.cloneNode(true);

    newAsset.querySelector(".name").textContent = asset.name;

    let upgrades = newAsset.querySelector(".upgrades");
    for (let i = 0; i < upgrades.children.length; i++) {
        let empty = upgrades.children[i].querySelector(".empty");
        let filled = upgrades.children[i].querySelector(".filled");
        if (asset.upgrades[i]) {
            empty.style.display = "none";
            filled.style.display = "block";
        } else {
            empty.style.display = "block";
            filled.style.display = "none";
        }
    }

    let properties = newAsset.querySelector(".properties");
    for (let p in asset.properties) {
        if (asset.properties[p] === undefined) {
            continue;
        }

        let e = document.createElement("div");
        e.textContent = asset.properties[p].name + ": " + asset.properties[p].value;
        properties.appendChild(e);
    }

    return newAsset;
}

function createProgressTrack(name, rank, roll) {
    let newTrack = progressTrackTemplate.cloneNode(true);
    if (name == null && rank == null) {
        newTrack.querySelector(".meta").remove();
    } else {
        newTrack.querySelector(".name").textContent = name + " (" + rank + ")";
    }
    return newTrack;
}

function updateProgressTrack(track, value) {
    let ticks = track.querySelectorAll(".tick");
    for (let i = 0; i < MAX_PROGRESS * 4; i++) {
        if (i < value) {
            ticks[i].style.display = "block";
        } else {
            ticks[i].style.display = "none";
        }
    }
}

function resizeDropdowns() {
    // update dropdown menu widths
    let menus = document.querySelectorAll(".js-resize-menu");
    for (let i = 0; i < menus.length; i++) {
        let id = menus[i].dataset.selectId;
        let width = document.getElementById(id).offsetWidth;
        menus[i].style.width = width + "px";
    }
}

function handleKeyDown(event) {
    if (event.key == "Control") {
        isControlPressed = true;
    } else if (isControlPressed) {
        if (event.key == "Enter") {
            if (edittingEvent == null) {
                handleSubmitEvent();
            } else {
                handleSaveEditEvent();
            }
        } else if (event.key == "m") {
            modeSwitch.on = !modeSwitch.on;
        } 
    }
}

function handleKeyUp(event) {
    if (event.key == "Control") {
        isControlPressed = false;
    }
}

function handleSelectOracle(type) {
    let input = doOracleRoll(type);
    addEvent(session.history.length, input, EventType.Roll);

    let moment = new Moment(input, EventType.Roll);
    moment.addAction(new OracleAction(type));
    session.addMoment(moment);
    saveSession();
}
function doOracleRoll(type) {
    let result = getOracleValue(ORACLE[type]);
    return "Ask the Oracle (" + type + "): " + result;
}
function getOracleValue(value) {
    if (typeof (value) == "string") {
        return value;
    } else if (Array.isArray(value)) {
        let result = getOracleValue(value[0]);
        for (let i = 1; i < value.length; i++) {
            result += getOracleValue(value[i]);
        }
        return result;
    }

    let die = new rpgDiceRoller.DiceRoll("1d100");
    let dieValue = die.rolls[0][0];
    if (value[dieValue] === undefined) {
        for (let p in value) {
            if (dieValue < p) {
                return getOracleValue(value[p]);
            }
        }
    }
    return getOracleValue(value[dieValue]);
}

function doRoll(statAdd, genericAdd, source) {
    let moment = new Moment("", EventType.Roll);
    moment.addAction(new RollAction(statAdd, genericAdd, source));
    session.addMoment(moment);
    addEvent(session.history.length - 1, moment.input, EventType.Roll);
    saveSession();
}

function handleSubmitEvent() {
    let input = entryInput.value;
    let type = (modeSwitch.on) ? EventType.Meta : EventType.Fiction
    addEvent(session.history.length, input, type);

    let moment = createMoment(input, type);
    session.addMoment(moment);

    entryInput.value = null;
    saveSession();
    refresh();
}

function createEvent(content, type) {
    let newEvent = undefined;
    if (type == EventType.Meta) {
        newEvent = metaEventTemplate.cloneNode(true);
        newEvent.querySelector(".edit").addEventListener("click", () => handleEditEvent(newEvent));
        newEvent.querySelector(".reroll").remove();
    } else if (type == EventType.Roll) {
        newEvent = metaEventTemplate.cloneNode(true);
        newEvent.querySelector(".reroll").addEventListener("click", () => handleRerollEvent(newEvent));
        newEvent.querySelector(".edit").remove();
    } else if (type == EventType.Fiction) {
        newEvent = fictionEventTemplate.cloneNode(true);
        newEvent.querySelector(".edit").addEventListener("click", () => handleEditEvent(newEvent));
    } else {
        console.error(type + " not implemented!");
        return;
    }
    delete newEvent.id;
    newEvent.querySelector(".delete").addEventListener("click", () => handleDeleteEvent(newEvent));
    newEvent.querySelector(".content").innerText = content;
    return newEvent;
}

function addEvent(index, input, type) {
    let newEvent = createEvent(input, type);
    newEvent.dataset.index = index;
    eventHistory.appendChild(newEvent);
    newEvent.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function handleRerollEvent(eventElement) {
    let moment = session.history[eventElement.dataset.index];
    let action = moment.actions[0];
    if (action instanceof RollAction) {
        action.reroll();
        action.applyAction(session.state, moment);
    } else if (action instanceof OracleAction) {
        moment.input = doOracleRoll(action.oracleType);
    } else {
        console.log("Unable to reroll " + typeof(action));
    }
    eventElement.querySelector(".content").innerText = moment.input;
}

function handleEditEvent(eventElement) {
    submitButton.style.display = "none";
    saveButton.style.display = "inline";
    cancelButton.style.display = "inline";

    if (edittingEvent == null) {
        oldInput = entryInput.value;
        oldMode = modeSwitch.on;
    } else {
        edittingEvent.style.backgroundColor = oldEditEventColor.background;
        edittingEvent.style.borderColor = oldEditEventColor.border;
    }
    edittingEvent = eventElement;
    oldEditEventColor.background = eventElement.style.backgroundColor;
    oldEditEventColor.border = eventElement.style.borderColor;
    eventElement.style.backgroundColor = "var(--mdc-theme-primary-light, #ff0000)";
    eventElement.style.borderColor = "var(--mdc-theme-primary-light, #ff0000)";

    let moment = session.history[edittingEvent.dataset.index];
    entryInput.value = moment.input;
    modeSwitch.on = (moment.type == EventType.Meta);

    eventElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function handleCancelEditEvent() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    edittingEvent.style.backgroundColor = oldEditEventColor.background;
    edittingEvent.style.borderColor = oldEditEventColor.border;

    edittingEvent = null;
    entryInput.value = oldInput;
    modeSwitch.on = oldMode;
}

function handleSaveEditEvent() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    edittingEvent.style.backgroundColor = oldEditEventColor.background;
    edittingEvent.style.borderColor = oldEditEventColor.border;

    edittingEvent.querySelector(".content").innerText = entryInput.value;

    session.gotoMoment(edittingEvent.dataset.index - 1);

    let type = (modeSwitch.on) ? EventType.Meta : EventType.Fiction
    let moment = createMoment(entryInput.value, type);
    session.updateMoment(edittingEvent.dataset.index, moment);
    session.gotoPresentMoment();

    let newEvent = createEvent(entryInput.value, type);
    newEvent.dataset.index = edittingEvent.dataset.index;
    eventHistory.insertBefore(newEvent, edittingEvent);
    edittingEvent.remove();

    saveSession();
    refresh();

    edittingEvent = null;
    entryInput.value = oldInput;
    modeSwitch.on = oldMode;
}

function handleDeleteEvent(eventElement) {
    let handler = (action) => { 
        confirmDialog.root_.removeEventListener("MDCDialog:closed", handler);
        if (action.detail.action != "accept") {
            return;
        }
        session.gotoMoment(eventElement.dataset.index - 1);
        session.removeMoment(eventElement.dataset.index);
        session.gotoPresentMoment();

        eventElement.remove();
        let eventElements = eventHistory.querySelectorAll(".event-base");
        for (let i = eventElement.dataset.index - 1; i < eventElements.length; i++) {
            let child = eventElements[i];
            child.dataset.index = i + 1;
        }

        saveSession();
        refresh();
    };
    confirmDialog.root_.addEventListener("MDCDialog:closed", handler);
    confirmDialog.content_.textContent = "Are you sure you want to delete this event?";
    confirmDialog.open();
}

function clearEventHistory() {
    let events = eventHistory.querySelectorAll("#event-history .event-base");
    for (let i = 0; i < events.length; i++) {
        events[i].remove();
    }
}

function refresh() {
    // stats
    for (let p in statElements) {
        statElements[p].textContent = session.state.stats[p];
    }

    // experience
    let dots = experience.querySelectorAll(".dot");
    for (let i = 0; i < dots.length; i++) {
        let empty = dots[i].querySelector(".empty");
        let spent = dots[i].querySelector(".spent");
        let available = dots[i].querySelector(".available");

        empty.style.display = "none";
        spent.style.display = "none";
        available.style.display = "none";

        if (i < session.state.stats.experience) {
            if (i < session.state.stats.experienceSpent) {
                available.style.display = "block";
            } else {
                spent.style.display = "block";
            }
        } else {
            empty.style.display = "block";
        }
    }

    // bonds
    updateProgressTrack(bondProgressTrack, session.state.stats.bonds);

    let bondList = bondCard.querySelector(".bond-list");
    let bonds = bondList.querySelectorAll("div");
    for (let i = 0; i < bonds.length; i++) {
        bonds[i].remove();
    }
    for (let p in session.state.bonds) {
        let bond = bondTemplate.cloneNode(true);
        bond.querySelector(".content").textContent = session.state.bonds[p].name;
        bondList.appendChild(bond);
    }

    // progress cards
    let progressList = progressCard.querySelector(".tracks");
    while (progressList.children.length > 0) {
        let last = progressList.children.length - 1;
        progressList.children[last].remove();
    }
    for (let p in session.state.progress) {
        let state = session.state.progress[p];
        if (session.state.progress[p] == undefined) {
            continue;
        }

        if (progressList.children.length > 0) {
            let divider = document.createElement("hr");
            divider.classList.add("card-divider");
            progressList.appendChild(divider);
        }

        let track = createProgressTrack(state.name, state.rank, true);
        updateProgressTrack(track, state.value);
        progressList.appendChild(track);
    }

    // progress sources
    let sourceList = document.getElementById("roll-source-list");
    let sources = sourceList.querySelectorAll("li");
    for (let i = 1; i < sources.length; i++) {
        sources[i].remove();
    }
    for (let p in session.state.progress) {
        if (session.state.progress[p] === undefined) {
            continue;
        }

        let e = document.createElement("li");
        e.classList.add("mdc-list-item")
        e.classList.add("mdc-list-item--selected");
        e.textContent = session.state.progress[p].name;
        e.dataset.value = p;
        sourceList.appendChild(e);
    }
    let select = document.getElementById("roll-source");
    select.MDCSelect.selectedIndex = 0;

    // debilities
    debilityElements.none.style.display = "";
    for (let p in session.state.debilities) {
        if (session.state.debilities[p]) {
            debilityElements[p].style.display = "";
            debilityElements.none.style.display = "none";
        } else {
            debilityElements[p].style.display = "none";
        }
    }

    // name
    characterName.textContent = session.state.characterName;

    // assets
    let assetList = assetCard.querySelector(".assets");
    while (assetList.children.length > 0) {
        let last = assetList.children.length - 1;
        assetList.children[last].remove();
    }
    for (let p in session.state.assets) {
        let state = session.state.assets[p];
        if (session.state.assets[p] == undefined) {
            continue;
        }

        if (assetList.children.length > 0) {
            let divider = document.createElement("hr");
            divider.classList.add("card-divider");
            assetList.appendChild(divider);
        }

        let asset = createAsset(state);
        assetList.appendChild(asset);
    }
}

function createMoment(input, type) {
    let moment = new Moment(input, type);

    let result = input.match(/\[(.*?)\]/g);
    if (result != null) {
        for (let i = 0; i < result.length; i++) {
            let args = result[i]
                .replace("[", "")
                .replace("]", "")
                .split(/\s(?=(?:(?:[^"]*"){2})*(?:[^"])*$)/);

            for (let j = 0; j < args.length; j++) {
                args[j] = args[j].replace(/^"(.+(?="$))"$/, '$1');
            };

            if (args[0] == "bond") {
                moment.addAction(addBond(args));
            } else if (args[0] == "unbond") {
                moment.addAction(removeBond(args));
            } else if (args[0] == "asset") {
                moment.addAction(updateAsset(args));
            } else if (args[0] == "progress") {
                moment.addAction(progress(args));
            } else if (args[0] == "rename") {
                moment.addAction(renameCharacter(args));
            } else if (args[0] == "is") {
                moment.addAction(addDebility(args));
                moment.addAction(new StatAction("momentumMax", "-", 1));
                moment.addAction(new StatAction("momentumReset", "-", 1));
            } else if (args[0] == "not") {
                moment.addAction(removeDebility(args));
                moment.addAction(new StatAction("momentumMax", "+", 1));
                moment.addAction(new StatAction("momentumReset", "+", 1));
            } else if (STATS[args[0]] !== undefined) {
                moment.addAction(changeStat(args));
            } else {
                // invalid command
            }
        }
    }

    return moment;
}

function updateAsset(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let action = new AssetAction(id);
    action.assetName = args[1];

    if (args.length == 2) {
        // no arguments, so just add asset
        action.action = "add";
        return action;
    }

    if (!isNaN(args[2])) {
        // first argument is a number, assume this is an upgrade
        action.action = "upgrade";
        action.upgradeIndex = Number(args[2]) - 1;
        return action;
    }

    action.action = "update";
    action.propertyId = args[2].toLowerCase();
    action.propertyName = args[2];
    
    action.propertyModifier = "=";
    let value = args[3];
    if (isNaN(value)) {    
        action.propertyValue = value;
    } else {
        if (value[0] == "+" || value[0] == "-") {
            action.propertyModifier = value[0];
        }
        action.propertyValue = Math.abs(value);
    }

    return action;
}

function renameCharacter(args) {
    if (args[1] == undefined) {
        return;
    }

    return new CharacterNameAction(args[1]);
}

function removeDebility(args) {
    if (args[1] == undefined) {
        return;
    }

    let debilityName = args[1].toLowerCase();
    if (DEBILITIES[debilityName] === undefined) {
        return;
    }

    return new DebilityAction(debilityName, false);
}

function addDebility(args) {
    if (args[1] == undefined) {
        return;
    }

    let debilityName = args[1].toLowerCase();
    if (DEBILITIES[debilityName] === undefined) {
        return;
    }

    return new DebilityAction(debilityName, true);
}

function progress(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let option = (args[2] === undefined) ? undefined : args[2].toLowerCase();
    let progress = new ProgressAction(id);

    if (option === undefined) {
        // mark progress
        progress.action = "progress";
    } else if (!isNaN(option)) {
        // mark progress with param
        progress.modifier = "=";
        if (option[0] == "+" || option[0] == "-") {
            progress.modifier = option[0];
        }
        progress.action = "tick";
        progress.value = Math.abs(option);
    } else if (option == "complete") {
        // flag as complete
        progress.action = "complete";
    } else {
        // start new progress
        progress.action = "add";
        progress.rank = option;
        progress.progressName = args[1];
    }

    return progress;
}

function removeBond(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let bond = new BondAction(id);
    bond.action = "remove";
    return bond;
}

function addBond(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let bond = new BondAction(id);
    bond.action = "add";
    bond.bondName = args[1];
    return bond;
}

function changeStat(args) {
    if (args[1] == undefined) {
        return;
    }

    let statName = args[0];
    let value = Math.abs(args[1]);
    let modifier = "=";
    if (args[1][0] == "+" || args[1][0] == "-") {
        modifier = args[1][0];
    }

    return new StatAction(statName, modifier, value);
}