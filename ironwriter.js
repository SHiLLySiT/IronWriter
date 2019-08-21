"use strict";

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

class DeltaState {
    constructor() {
        this.input = "";
        this.characterName = undefined;
        this.stats = {};
        this.debilities = {};
        this.progress = {};
        this.bonds = {};
        this.roll = undefined;
    }
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

const MAX_EXPERIENCE = 30;
const MAX_PROGRESS = 10;

let isControlPressed = false;
let bondProgressTrack = undefined;
let deltaStates = [];
let currentState = new GameState();
let currentDeltaIndex = 0;
let edittingEvent = null;

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

    let initialState = new DeltaState();
    initialState.characterName = "New Character";
    for (let p in DEBILITIES) {
        initialState.debilities[p] = false;
    }
    deltaStates.push(initialState);

    applyState(initialState);
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

    for (let p in ORACLE) {
        let item = template.cloneNode(true);
        item.querySelector("span").textContent = p;
        item.addEventListener("click", () => {
            oracleMenu.open = false;
            let input = doOracleRoll(p);
            addEvent(input, "roll");

            let deltaState = new DeltaState();
            deltaState.input = input;
            deltaState.roll = {
                type: "oracle",
                oracle: p,
            };
            deltaStates.push(deltaState);
            currentDeltaIndex = deltaStates.length - 1;
        });
        container.appendChild(item);
    }
}

function initStats() {
    for (let p in statElements) {
        let element = document.getElementById("stat-" + p);
        if (element === null) {
            delete statElements[p];
        } else {
            statElements[p] = element;
        }
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
    bondProgressTrack = createProgressTrack(null, null);
    bondContainer.append(bondProgressTrack);

    bondTemplate = document.getElementById("bond-template");
    bondTemplate.remove();
}

function createProgressTrack(name, rank) {
    let newTrack = progressTrackTemplate.cloneNode(true);
    newTrack.querySelector(".name").textContent = name;
    newTrack.querySelector(".rank").textContent = rank;
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

function doActionRoll() {
    let challenge = new rpgDiceRoller.DiceRoll("2d10");
    let action = new rpgDiceRoller.DiceRoll("1d6");

    let result = "weak";
    if (action.rolls[0][0] < challenge.rolls[0][0] && action.rolls[0][0] < challenge.rolls[0][1]) {
        result = "miss"
    } else if (action.rolls[0][0] > challenge.rolls[0][0] && action.rolls[0][0] > challenge.rolls[0][1]) {
        result = "strong"
    }

    return challenge.output + "\n" + action.output + "\n" + result;
}

function handleRollClick() {
    let input = doActionRoll();
    addEvent(input, "roll");

    let deltaState = new DeltaState();
    deltaState.input = input;
    deltaState.roll = {
        type: "action",
    };
    deltaStates.push(deltaState);
    currentDeltaIndex = deltaStates.length - 1;
}

function handleOracleClick() {
    oracleMenu.open = !oracleMenu.open;
}

function handleSubmitEvent() {
    let input = entryInput.value;
    addEvent(input, "fiction");

    let deltaState = new DeltaState();
    buildState(deltaState, input);
    deltaStates.push(deltaState);
    currentDeltaIndex = deltaStates.length - 1;
    applyState(deltaState);

    entryInput.value = null;
    refresh();
}

function addEvent(input, type) {
    let newEvent = undefined;
    if (type == "roll") {
        newEvent = rollEventTemplate.cloneNode(true);
        newEvent.querySelector(".reroll").addEventListener("click", () => handleRerollEvent(newEvent));
    } else if (type == "fiction") {
        newEvent = fictionEventTemplate.cloneNode(true);
        newEvent.querySelector(".edit").addEventListener("click", () => handleEditEvent(newEvent));
    } else {
        console.error(type + " not implemented!");
        return;
    }
    delete newEvent.id;

    newEvent.querySelector(".delete").addEventListener("click", () => handleDeleteEvent(newEvent));
    newEvent.dataset.index = deltaStates.length;
    newEvent.querySelector(".content").innerText = input
    eventHistory.appendChild(newEvent);
    newEvent.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function handleRerollEvent(eventElement) {

    let state = deltaStates[eventElement.dataset.index];
    if (state.roll.type == "action") {
        state.input = doActionRoll();
    } else if (state.roll.type == "oracle") {
        state.input = doOracleRoll(state.roll.oracle);
    }
    eventElement.querySelector(".content").innerText = state.input;
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

    gotoState(edittingEvent.dataset.index - 1);
    let state = new DeltaState();
    buildState(state, entryInput.value);
    deltaStates[edittingEvent.dataset.index] = state;
    gotoState(deltaStates.length - 1);

    refresh();

    edittingEvent = null;
    entryInput.value = null;
}

function handleDeleteEvent(eventElement) {
    gotoState(eventElement.dataset.index - 1);
    deltaStates.splice(eventElement.dataset.index, 1);
    gotoState(deltaStates.length - 1);

    eventElement.remove();
    let eventElements = eventHistory.querySelectorAll(".event-base");
    for (let i = eventElement.dataset.index - 1; i < eventElements.length; i++) {
        let child = eventElements[i];
        child.dataset.index = i + 1;
    }

    refresh();

    if (currentDeltaIndex > deltaStates.length - 1) {
        currentDeltaIndex = deltaStates.length - 1;
    }
}

function gotoState(index) {
    let dir = Math.sign(index - currentDeltaIndex);
    if (dir == -1) {
        for (let i = currentDeltaIndex; i > index; i--) {
            unapplyState(deltaStates[i], deltaStates[i - 1]);
        }
    } else if (dir == 1) {
        for (let i = currentDeltaIndex + 1; i <= index; i++) {
            applyState(deltaStates[i]);
        }
    }
    currentDeltaIndex = index;
}

function applyState(deltaState) {
    // stats
    for (let p in deltaState.stats) {
        currentState.stats[p] += deltaState.stats[p];
    }

    // bonds
    for (let p in deltaState.bonds) {
        let action = deltaState.bonds[p].action;
        let value = deltaState.bonds[p].value;
        if (action == "add") {
            if (currentState.bonds[p] === undefined) {
                currentState.bonds[p] = value;
                currentState.stats.bonds++;
            }
        } else if (action == "remove") {
            if (currentState.bonds[p] !== undefined) {
                delete currentState.bonds[p];
                currentState.stats.bonds--;
            }
        }
    }

    // progress
    for (let p in deltaState.progress) {
        let list = deltaState.progress[p]
        for (let i = 0; i < list.length; i++) {
            let action = list[i].action;
            if (action == "add") {
                if (currentState.progress[p] === undefined) {
                    currentState.progress[p] = {
                        name: list[i].name,
                        history: [],
                    };
                }

                currentState.progress[p].history.push({
                    rank: list[i].rank,
                    value: 0,
                    complete: false,
                });
            } else {
                let progressTrack = currentState.progress[p];
                if (progressTrack === undefined) {
                    continue;
                }

                let state = progressTrack.history[progressTrack.history.length - 1];
                if (action == "complete") {
                    state.complete = true;
                } else if (action == "progress") {
                    let deltaValue = list[i].value;
                    state.value = state.value + (CHALLENGE_RANKS[state.rank] * deltaValue);
                } else if (action == "tick") {
                    let deltaValue = list[i].value;
                    state.value = state.value + deltaValue;
                }
            }
        }
    }

    // debilities
    for (let p in deltaState.debilities) {
        currentState.debilities[p] = deltaState.debilities[p];
    }

    // name
    if (deltaState.characterName !== undefined) {
        currentState.characterName = deltaState.characterName;
    }
}

function unapplyState(deltaState, prevDeltaState) {
    // stats
    for (let p in deltaState.stats) {
        currentState.stats[p] -= deltaState.stats[p];
    }

    // bonds
    for (let p in deltaState.bonds) {
        let action = deltaState.bonds[p].action;
        let value = deltaState.bonds[p].value;
        if (action == "add") {
            if (currentState.bonds[p] !== undefined) {
                delete currentState.bonds[p];
                currentState.stats.bonds--;
            }
        } else if (action == "remove") {
            if (currentState.bonds[p] === undefined) {
                currentState.bonds[p] = value;
                currentState.stats.bonds++;
            }
        }
    }

    // progress
    for (let p in deltaState.progress) {
        let list = deltaState.progress[p]
        for (let i = 0; i < list.length; i++) {
            let action = list[i].action;
            if (action == "add") {
                if (currentState.progress[p] !== undefined) {
                    currentState.progress[p].history.pop();
                    if (currentState.progress[p].history.length == 0) {
                        delete currentState.progress[p];
                    }
                }
            } else {
                let progressTrack = currentState.progress[p];
                if (progressTrack === undefined) {
                    continue;
                }

                let state = progressTrack.history[progressTrack.history.length - 1];
                if (action == "complete") {
                    state.complete = false;
                } else if (action == "progress") {
                    let deltaValue = list[i].value;
                    state.value = state.value - (CHALLENGE_RANKS[state.rank] * deltaValue);
                } else if (action == "tick") {
                    let deltaValue = list[i].value;
                    state.value = state.value - deltaValue;
                }
            }
        }
    }

    // debilities
    for (let p in prevDeltaState.debilities) {
        currentState.debilities[p] = prevDeltaState.debilities[p];
    }

    // name
    if (prevDeltaState.characterName !== undefined) {
        currentState.characterName = prevDeltaState.characterName;
    }
}

function refresh() {
    // stats
    for (let p in statElements) {
        statElements[p].textContent = currentState.stats[p];
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

        if (i < currentState.stats.experience) {
            if (i < currentState.stats.experienceSpent) {
                available.style.display = "block";
            } else {
                spent.style.display = "block";
            }
        } else {
            empty.style.display = "block";
        }
    }

    // bonds
    updateProgressTrack(bondProgressTrack, currentState.stats.bonds);

    var list = bondCard.querySelector(".bond-list");
    let bonds = list.querySelectorAll("li");
    for (let i = 0; i < bonds.length; i++) {
        bonds[i].remove();
    }
    for (let p in currentState.bonds) {
        let bond = bondTemplate.cloneNode(true);
        bond.querySelector(".content").textContent = currentState.bonds[p];
        list.appendChild(bond);
    }

    // progress
    var list = progressCard.querySelector(".tracks");
    let progress = list.querySelectorAll(".progress-track");
    for (let i = 0; i < progress.length; i++) {
        progress[i].remove();
    }
    for (let p in currentState.progress) {
        let progressTrack = currentState.progress[p];
        let state = progressTrack.history[progressTrack.history.length - 1];
        if (state.complete) {
            continue;
        }

        let track = createProgressTrack(progressTrack.name, state.rank);
        updateProgressTrack(track, state.value);
        list.appendChild(track);
    }

    // debilities
    debilityElements.none.style.display = "";
    for (let p in currentState.debilities) {
        if (currentState.debilities[p]) {
            debilityElements[p].style.display = "";
            debilityElements.none.style.display = "none";
        } else {
            debilityElements[p].style.display = "none";
        }
    }

    // name
    characterName.textContent = currentState.characterName;
}

function buildState(state, input) {
    state.input = input;
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
                addBond(state, args);
            } else if (args[0] == "unbond") {
                removeBond(state, args);
            } else if (args[0] == "progress") {
                progress(state, args);
            } else if (args[0] == "rename") {
                renameCharacter(state, args);
            } else if (args[0] == "debility") {
                debility(state, args);
            } else if (STATS[args[0]] !== undefined) {
                changeStat(state, args);
            } else {
                // invalid command
            }
        }
    }
}

function renameCharacter(state, args) {
    if (args[1] == undefined) {
        return;
    }

    state.characterName = args[1];
}

function debility(state, args) {
    if (args[1] == undefined) {
        return;
    }

    if (args[1].length == 1) {
        return;
    }

    let modifier = args[1][0];
    let debility = args[1].substring(1);
    if (DEBILITIES[debility] === undefined) {
        return;
    }

    if (modifier == "+") {
        state.debilities[debility] = true;
    } else if (modifier == "-") {
        state.debilities[debility] = false;
    }
}

function progress(state, args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let option = (args[2] === undefined) ? undefined : args[2].toLowerCase();

    if (state.progress[id] == undefined) {
        state.progress[id] = [];
    }

    if (option === undefined) {
        // mark progress
        state.progress[id].push({
            action: "progress",
            value: 1,
        });
    } else if (!isNaN(option)) {
        // mark progress with param
        state.progress[id].push({
            action: "tick",
            value: Number(option),
        });
    } else if (option == "complete") {
        // flag as complete
        state.progress[id].push({
            action: "complete",
        });
    } else {
        // start new progress
        state.progress[id].push({
            action: "add",
            name: args[1],
            rank: option,
        });
    }
}

function removeBond(state, args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    state.bonds[id] = {
        action: "remove",
        value: args[1]
    };
}

function addBond(state, args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    state.bonds[id] = {
        action: "add",
        value: args[1]
    };
}

function changeStat(state, args) {
    if (args[1] == undefined) {
        return;
    }

    let statName = args[0];
    if (state.stats[statName] == undefined) {
        state.stats[statName] = 0;
    }
    state.stats[statName] += Number(args[1]);
}