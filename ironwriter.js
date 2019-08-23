"use strict";

const VERSION = "0.1.0";
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
}

class Session {
    constructor() {
        this.version = VERSION;
        this.state = new GameState();
        /**
         * @type {Moment}
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

        this.stats = {};
        for (let p in STATS) {
            this.stats[p] = 0;
        }

        this.debilities = {};
        for (let p in DEBILITIES) {
            this.debilities[p] = false;
        }

        this.progress = {};
        this.bonds = {};
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

class StatAction extends Action {
    
    constructor(stats) {
        super();
        this.type = "StatAction";
        this.stats = stats;
    }

   /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        for (let p in this.stats) {
            if (this.stats[p].modifier == "+") {
                gameState.stats[p] += this.stats[p].value;
            } else if (this.stats[p].modifier == "-") {
                gameState.stats[p] -= this.stats[p].value;
            } else {
                gameState.stats[p] = this.stats[p].value;
            }
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
        for (let p in this.stats) {
            gameState.stats[p] = moment.state.stats[p];
        }
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
    constructor(debilities) {
        super();
        this.type = "DebilityAction";
        this.debilities = debilities;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        for (let p in this.debilities) {
            gameState.debilities[p] = this.debilities[p];
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        for (let p in this.debilities) {
            gameState.debilities[p] = moment.state.debilities[p];
        }
    }
}

class ProgressAction extends Action {
    constructor(progress) {
        super();
        this.type = "ProgressAction";
        this.progress = progress;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        for (let p in this.progress) {
            if (this.progress[p].action == "add") {
                if (gameState.progress[p] !== undefined) {
                    continue;
                }

                gameState.progress[p] = {
                    rank: this.progress[p].rank,
                    name: this.progress[p].name,
                    value: 0,
                };
            } else {
                if (gameState.progress[p] === undefined) {
                    continue;
                }

                if (this.progress[p].action == "complete") {
                    delete gameState.progress[p];
                } else if (this.progress[p].action == "progress") {
                    let state = gameState.progress[p];
                    state.value = state.value + CHALLENGE_RANKS[state.rank];
                } else if (this.progress[p].action == "tick") {
                    let state = gameState.progress[p];
                    if (this.progress[p].modifier == "+") {
                        state.value += this.progress[p].value;
                    } else if (this.progress[p].modifier == "-") {
                        state.value -= this.progress[p].value;
                    } else {
                        state.value = this.progress[p].value;
                    }
                }
            }
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        for (let p in this.progress) {
            if (this.progress[p].action == "add") {
                gameState.progress[p] = moment.state.progress[p];
            } else if (this.progress[p].action == "complete") {
                gameState.progress[p] = moment.state.progress[p];
            } else {
                if (gameState.progress[p] === undefined) {
                    continue;
                }

                else if (this.progress[p].action == "progress") {
                    let state = gameState.progress[p];
                    state.value = state.value - CHALLENGE_RANKS[state.rank];
                } else if (this.progress[p].action == "tick") {
                    let state = gameState.progress[p];
                    state.value = state.value - this.progress[p].value;
                }
            }
        }
    }
}

class BondAction extends Action {
    constructor(bonds) {
        super();
        this.type = "BondAction";
        this.bonds = bonds;
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        for (let p in this.bonds) {
            let action = this.bonds[p].action;
            let value = this.bonds[p].value;
            if (action == "add") {
                if (gameState.bonds[p] === undefined) {
                    gameState.bonds[p] = value;
                    gameState.stats.bonds++;
                }
            } else if (action == "remove") {
                if (gameState.bonds[p] !== undefined) {
                    delete gameState.bonds[p];
                    gameState.stats.bonds--;
                }
            }
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        for (let p in this.bonds) {
            let action = this.bonds[p].action;
            let value = this.bonds[p].value;
            if (action == "add") {
                if (moment.state.bonds[p] === undefined) {
                    delete gameState.bonds[p];
                    gameState.stats.bonds--;
                }
            } else if (action == "remove") {
                if (moment.state.bonds[p] !== undefined) {
                    gameState.bonds[p] = value;
                    gameState.stats.bonds++;
                }
            }
        }
    }
}

class OracleAction extends Action {
    /**
     * @param {string} type
     */
    constructor(type) {
        super();
        this.type = "OracleAction";
        this.oracle = {
            type: type
        };
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
     * @param {string} add
     */
    constructor(add) {
        super();
        this.type = "RollAction";
        this.roll = {
            add: add,
            challenge: [0, 0],
            action: 0,
        }
        this.reroll();
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    applyAction(gameState, moment) {
        let adds = -1;
        if (this.roll.add !== undefined && this.roll.add !== null) {
            if (this.roll.add.type == "stat") {
                adds = gameState.stats[this.roll.add.name];
            } else if (this.roll.add.type == "progress") {
                if (gameState.progress[this.roll.add.name] === undefined) {
                    // TODO: is there a more elegant way to handle this situation?
                    moment.input = "Unable to resolve roll; progress track '" + this.roll.add.name + "' was removed or renamed";
                    return;
                }
                let ticks = gameState.progress[this.roll.add.name].value;
                adds = Math.floor(ticks / 4);
            }
        }

        let result = "> Weak";
        let totalAction = this.roll.action + adds;
        if (totalAction < this.roll.challenge[0] && totalAction < this.roll.challenge[1]) {
            result = "> Miss"
        } else if (totalAction > this.roll.challenge[0] && totalAction > this.roll.challenge[1]) {
            result = "> Strong"
        }

        let challengeOutput = "2d10: [" + this.roll.challenge[0] + ", " + this.roll.challenge[1] + "]";
        let actionOutput = "1d6: [" + this.roll.action + "]";
        if (adds > -1) {
            actionOutput += " + " + adds + " " + this.roll.add.name + " = " + totalAction;
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
        this.roll.challenge = new rpgDiceRoller.DiceRoll("2d10").rolls[0];
        this.roll.action = new rpgDiceRoller.DiceRoll("1d6").rolls[0][0];
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
let rollButton = undefined;
let oracleMenu = undefined;
let fictionEventTemplate = undefined;
let rollEventTemplate = undefined;
let entryInput = undefined;
let eventHistory = undefined;
let progressCard = undefined;
let progressTrackTemplate = undefined;
let bondCard = undefined;
let bondTemplate = undefined;
let characterName = undefined;

let isControlPressed = false;
let bondProgressTrack = undefined;
let edittingEvent = null;

let session = new Session();

window.addEventListener("load", handleInit);

function handleInit() {
    window.mdc.autoInit();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    entryInput = document.getElementById("event-input");

    eventHistory = document.getElementById("event-history");

    fictionEventTemplate = document.getElementById("fiction-event-template");
    fictionEventTemplate.remove();

    rollEventTemplate = document.getElementById("roll-event-template");
    rollEventTemplate.remove();

    characterName = document.getElementById("character-name");

    document.getElementById("import").addEventListener("click", () => {
        importSession();
    });

    document.getElementById("export").addEventListener("click", () => {
        exportSession();
    });

    document.getElementById("new").addEventListener("click", () => {
        newSession();
    });

    document.getElementById("help").addEventListener("click", () => {
        window.open("https://github.com/SHiLLySiT/IronWriter");
    });

    document.getElementById("version").textContent = "v" + VERSION;

    rollButton = document.getElementById("roll").querySelector("button");
    rollButton.addEventListener("click", handleRollClick);

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
    initOracle();

    let str = localStorage.getItem("session");
    if (str === undefined || str === null) {
        newSession();
        refresh();
    } else {
        loadSession(str);
    }
}

function newSession() {
    session = new Session();
        
    let debilities = {};
    for (let p in DEBILITIES) {
        debilities[p] = false;
    }

    let stats = {
        momentum: { modifier: "=", value: 2 },
        momentumReset: { modifier: "=", value: 2 },
        momentumMax: { modifier: "=", value: 10 },
        health: { modifier: "=", value: 5 },
        supply: { modifier: "=", value: 5 },
        spirit: { modifier: "=", value: 5 },
    };

    let initialMoment = new Moment("", EventType.None);
    initialMoment.addAction(new CharacterNameAction("New Character"));
    initialMoment.addAction(new StatAction(stats));
    session.addMoment(initialMoment);

    saveSession();
    clearEventHistory();
    refresh();
}

function importSession() {
    let linkElement = document.createElement("input");
    linkElement.setAttribute("type", "file");
    linkElement.click();
    linkElement.addEventListener("change", () => {
        let file = event.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file);
        reader.addEventListener("load", () => {
           loadSession(reader.result); 
        });
    });
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

function initOracle() {
    let oracleButton = document.getElementById("oracle").querySelector("button");
    oracleButton.addEventListener("click", handleOracleClick);

    let menuElement = document.querySelector("#oracle .mdc-menu");
    oracleMenu = mdc.menu.MDCMenu.attachTo(menuElement);
    oracleMenu.hoistMenuToBody();

    let container = menuElement.querySelector("ul");
    let template = menuElement.querySelector("li");
    template.remove();

    for (let type in ORACLE) {
        if (ORACLE[type] == null) {
            let node = document.createElement("li");
            node.classList.add("mdc-list-divider");
            node.setAttribute("role", "separator");
            container.appendChild(node);
        } else {
            let item = template.cloneNode(true);
            item.querySelector("span").textContent = type;
            item.addEventListener("click", () => handleSelectOracle(type));
            container.appendChild(item);
        }
    }
}

function initStats() {
    for (let p in statElements) {
        let container = document.getElementById("stat-" + p);
        if (container === null) {
            delete statElements[p];
            continue;
        }

        let rollButton = container.querySelector("button");
        if (rollButton !== null) {
            rollButton.addEventListener("click", () => handleStatRollClick(p));
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

function createProgressTrack(name, rank, roll) {
    let newTrack = progressTrackTemplate.cloneNode(true);
    newTrack.querySelector(".name").textContent = name;
    newTrack.querySelector(".rank").textContent = rank;
    let button = newTrack.querySelector("button");
    button.style.display = (roll) ? "block" : "none";
    button.addEventListener("click", () => handleProgressRollClick(name));
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

function handleKeyDown(event) {
    if (event.key == "Control") {
        isControlPressed = true;
    } else if (isControlPressed && event.key == "Enter") {
        if (edittingEvent == null) {
            handleSubmitEvent();
        } else {
            handleSaveEditEvent();
        }
    }
}

function handleKeyUp(event) {
    if (event.key == "Control") {
        isControlPressed = false;
    }
}

function handleSelectOracle(type) {
    oracleMenu.open = false;

    let input = doOracleRoll(type);
    addEvent(session.history.length, input, EventType.Meta);

    let moment = new Moment(input, EventType.Meta);
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

function handleProgressRollClick(progressName) {
    let moment = new Moment("", EventType.Meta);
    moment.addAction(new RollAction({ type: "progress", name: progressName.toLowerCase() }));
    session.addMoment(moment);
    addEvent(session.history.length - 1, moment.input, EventType.Meta);
    saveSession(); 
}

function handleStatRollClick(stat) {
    let moment = new Moment("", EventType.Meta);
    moment.addAction(new RollAction({ type: "stat", name: stat }));
    session.addMoment(moment);
    addEvent(session.history.length - 1, moment.input, EventType.Meta);
    saveSession();  
}

function handleRollClick() {
    let moment = new Moment("", EventType.Meta);
    moment.addAction(new RollAction({ type: "none" }));
    session.addMoment(moment);
    addEvent(session.history.length - 1, moment.input, EventType.Meta);
    saveSession();
}

function handleOracleClick() {
    oracleMenu.open = !oracleMenu.open;
}

function handleSubmitEvent() {
    let input = entryInput.value;
    addEvent(session.history.length, input, EventType.Fiction);

    let moment = createMoment(input);
    session.addMoment(moment);

    entryInput.value = null;
    saveSession();
    refresh();
}

function addEvent(index, input, type) {
    let newEvent = undefined;
    if (type == EventType.Meta) {
        newEvent = rollEventTemplate.cloneNode(true);
        newEvent.querySelector(".reroll").addEventListener("click", () => handleRerollEvent(newEvent));
    } else if (type == EventType.Fiction) {
        newEvent = fictionEventTemplate.cloneNode(true);
        newEvent.querySelector(".edit").addEventListener("click", () => handleEditEvent(newEvent));
    } else {
        console.error(type + " not implemented!");
        return;
    }
    delete newEvent.id;

    newEvent.querySelector(".delete").addEventListener("click", () => handleDeleteEvent(newEvent));
    newEvent.dataset.index = index;
    newEvent.querySelector(".content").innerText = input
    eventHistory.appendChild(newEvent);
    newEvent.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function handleRerollEvent(eventElement) {
    let moment = session.history[eventElement.dataset.index];
    let action = moment.actions[0];
    if (action.roll !== undefined) {
        action.reroll();
        action.applyAction(session.state, moment);
    } else if (action.oracle !== undefined) {
        moment.input = doOracleRoll(action.oracle.type);
    }
    eventElement.querySelector(".content").innerText = moment.input;
}

function handleEditEvent(eventElement) {
    submitButton.style.display = "none";
    saveButton.style.display = "inline";
    cancelButton.style.display = "inline";

    if (edittingEvent != null) {
        edittingEvent.style.backgroundColor = "#FFFFFF";
    }
    edittingEvent = eventElement;
    eventElement.style.backgroundColor = "var(--mdc-theme-primary-light, #ff0000)";
    entryInput.value = eventElement.querySelector(".content").innerText;
}

function handleCancelEditEvent() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    edittingEvent.style.backgroundColor = "#FFFFFF";

    edittingEvent = null;
    entryInput.value = null;
}

function handleSaveEditEvent() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    edittingEvent.style.backgroundColor = "#FFFFFF";

    edittingEvent.querySelector(".content").innerText = entryInput.value;

    session.gotoMoment(edittingEvent.dataset.index - 1);
    let moment = createMoment(entryInput.value);
    session.updateMoment(edittingEvent.dataset.index, moment);
    session.gotoPresentMoment();

    let eventElements = eventHistory.querySelectorAll(".event-base");
    for (let i = edittingEvent.dataset.index - 1; i < eventElements.length; i++) {
        eventElements[i].querySelector(".content").innerText = session.history[i + 1].input;
    }

    saveSession();
    refresh();

    edittingEvent = null;
    entryInput.value = null;
}

function handleDeleteEvent(eventElement) {
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

    var list = bondCard.querySelector(".bond-list");
    let bonds = list.querySelectorAll("li");
    for (let i = 0; i < bonds.length; i++) {
        bonds[i].remove();
    }
    for (let p in session.state.bonds) {
        let bond = bondTemplate.cloneNode(true);
        bond.querySelector(".content").textContent = session.state.bonds[p];
        list.appendChild(bond);
    }

    // progress
    var list = progressCard.querySelector(".tracks");
    let progress = list.querySelectorAll(".progress-track");
    for (let i = 0; i < progress.length; i++) {
        progress[i].remove();
    }
    for (let p in session.state.progress) {
        let state = session.state.progress[p];
        if (session.state.progress[p] == undefined) {
            continue;
        }
        let track = createProgressTrack(state.name, state.rank, true);
        updateProgressTrack(track, state.value);
        list.appendChild(track);
    }

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
}

function createMoment(input) {
    let moment = new Moment(input, EventType.Fiction);

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
            } else if (args[0] == "progress") {
                moment.addAction(progress(args));
            } else if (args[0] == "rename") {
                moment.addAction(renameCharacter(args));
            } else if (args[0] == "is") {
                moment.addAction(addDebility(args));
                moment.addAction(new StatAction({
                    momentumMax: { modifier: "-", value: 1 },
                    momentumReset: { modifier: "-", value: 1 },
                }));
            } else if (args[0] == "not") {
                moment.addAction(removeDebility(args));
                moment.addAction(new StatAction({
                    momentumMax: { modifier: "+", value: 1 },
                    momentumReset: { modifier: "+", value: 1 },
                }));
            } else if (STATS[args[0]] !== undefined) {
                moment.addAction(changeStat(args));
            } else {
                // invalid command
            }
        }
    }

    return moment;
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

    let debilityName = args[1];
    if (DEBILITIES[debilityName] === undefined) {
        return;
    }

    let debilities = {};
    debilities[debilityName] = false;
    return new DebilityAction(debilities);
}

function addDebility(args) {
    if (args[1] == undefined) {
        return;
    }

    let debilityName = args[1];
    if (DEBILITIES[debilityName] === undefined) {
        return;
    }

    let debilities = {};
    debilities[debilityName] = true;
    return new DebilityAction(debilities);
}

function progress(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let option = (args[2] === undefined) ? undefined : args[2].toLowerCase();
    let progress = {};

    if (option === undefined) {
        // mark progress
        progress[id] = {
            action: "progress",
        };
    } else if (!isNaN(option)) {
        // mark progress with param
        let modifier = "=";
        if (option[0] == "+" || option[0] == "-") {
            modifier = option[0];
        }
        progress[id] = {
            action: "tick",
            modifier: modifier,
            value: Math.abs(option),
        };
    } else if (option == "complete") {
        // flag as complete
        progress[id] = {
            action: "complete",
        };
    } else {
        // start new progress
        progress[id] = {
            action: "add",
            name: args[1],
            rank: option,
        };
    }

    return new ProgressAction(progress);
}

function removeBond(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let bonds = {};
    bonds[id] = {
        action: "remove",
        value: args[1]
    }
    return new BondAction(bonds);
}

function addBond(args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let bonds = {};
    bonds[id] = {
        action: "add",
        value: args[1]
    }
    return new BondAction(bonds);
}

function changeStat(args) {
    if (args[1] == undefined) {
        return;
    }

    let statName = args[0];
    let stats = {};
    
    let modifier = "=";
    if (args[1][0] == "+" || args[1][0] == "-") {
        modifier = args[1][0];
    }

    stats[statName] = {
        modifier: modifier,
        value: Math.abs(args[1]),
    }

    return new StatAction(stats);
}