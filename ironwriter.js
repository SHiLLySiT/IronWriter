"use strict";

class GameState {
    constructor() {
        this.content = "";

        this.stats = {
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
        }
        
        this.debilities = {
            wounded: false,
            shaken: false,
            unprepared: false,
            encumbered: false,
            maimed: false,
            corrupted: false,
            cursed: false,
            tormented: false,
        };

        this.progress = {};
        this.bonds = {};
    }
}

const CHALLENGE_RANKS = {
    troublesome: 12,
    dangerous: 8,
    formidable: 4,
    extreme: 2,
    epic: 1,
};

let isControlPressed = false;

let statElements = {
    edge: undefined,
    heart: undefined,
    iron: undefined,
    shadow: undefined,
    wits: undefined,
    health: undefined,
    supply: undefined,
    spirit: undefined,
    momentum: undefined,
    momentumMax: undefined,
    momentumReset: undefined,
}

let debilityElements = {
    none: undefined,
    wounded: undefined,
    shaken: undefined,
    unprepared: undefined,
    encumbered: undefined,
    maimed: undefined,
    corrupted: undefined,
    cursed: undefined,
    tormented: undefined,
}

const MAX_EXPERIENCE = 30;
const MAX_PROGRESS = 10;

let experience = undefined;
let submitButton = undefined;
let cancelButton = undefined;
let saveButton = undefined;
let logTemplate = undefined;
let logInput = undefined;
let logHistory = undefined;
let progressCard = undefined;
let progressTrackTemplate = undefined;
let bondCard = undefined;
let bondTemplate = undefined;

let bondProgressTrack = undefined;
let deltaStates = [];
let currentState = new GameState();
let currentDeltaIndex = 0;
let editLog = null;

window.addEventListener("load", handleInit);

function handleInit() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    logInput = document.getElementById("log-input");

    logHistory = document.getElementById("log-history");

    logTemplate = document.getElementById("log-template");
    logTemplate.remove();

    submitButton = document.getElementById("submit-log");
    submitButton.addEventListener("click", handleSubmitLog);

    cancelButton = document.getElementById("cancel-log");
    cancelButton.addEventListener("click", handleCancelLog);
    cancelButton.style.display = "none";

    saveButton = document.getElementById("save-log");
    saveButton.addEventListener("click", handleSaveLog);
    saveButton.style.display = "none";

    initProgressTrack();
    initExperience();
    initDebilities();
    initStats();
    initBonds();

    deltaStates.push(new GameState());
    refresh();
}

function initStats() {
    for (let p in statElements) {
        statElements[p] = document.getElementById("stat-" + p);
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
        if (editLog == null) {
            handleSubmitLog();
        } else {
            handleSaveLog();
        }
    }
}

function handleKeyUp(event) {
    if (event.key == "Control") {
        isControlPressed = false;
    }
}

function handleSubmitLog() {
    let input = logInput.value;
    addLog(input);

    let deltaState = new GameState();
    buildState(deltaState, input);
    deltaStates.push(deltaState);
    currentDeltaIndex = deltaStates.length - 1;
    applyState(deltaState);

    logInput.value = null;
    refresh();
}

function addLog(input) {
    let newLog = logTemplate.cloneNode(true);
    delete newLog.id;
    newLog.dataset.index = deltaStates.length;
    newLog.querySelector(".content").innerText = input
    newLog.querySelector(".edit").addEventListener("click", () => handleEditLog(newLog));
    newLog.querySelector(".reroll").addEventListener("click", () => handleRerollLog(newLog));
    newLog.querySelector(".delete").addEventListener("click", () => handleDeleteLog(newLog));

    logHistory.appendChild(newLog);

    newLog.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function handleEditLog(log) {
    submitButton.style.display = "none";
    saveButton.style.display = "inline";
    cancelButton.style.display = "inline";

    if (editLog != null) {
        editLog.style.backgroundColor = "#FFFFFF";
    }
    editLog = log;
    log.style.backgroundColor = "var(--mdc-theme-primary-light, #ff0000)";
    logInput.value = log.querySelector(".content").innerText;
}

function handleCancelLog() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    editLog.style.backgroundColor = "#FFFFFF";
    
    editLog = null;
    logInput.value = null;
}

function handleSaveLog() {
    submitButton.style.display = "block";
    saveButton.style.display = "none";
    cancelButton.style.display = "none";
    editLog.style.backgroundColor = "#FFFFFF";

    editLog.querySelector(".content").innerText = logInput.value;

    gotoState(editLog.dataset.index - 1);
    var state = deltaStates[editLog.dataset.index];
    buildState(state, logInput.value);
    gotoState(deltaStates.length - 1);

    refresh();

    editLog = null;
    logInput.value = null;
}

function handleRerollLog(log) {
    // TODO: reroll any dice rolls in log
}

function handleDeleteLog(log) {
    gotoState(log.dataset.index - 1);
    deltaStates.splice(log.dataset.index, 1);
    gotoState(deltaStates.length - 1);

    log.remove();
    let logs = logHistory.querySelectorAll("div");
    for (let i = log.dataset.index - 1; i < logs.length - 1; i++) {
        let child = logs[i];
        child.dataset.index = i;
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
            unapplyState(deltaStates[i]);
        }
    } else if (dir == 1) {
        for (let i = currentDeltaIndex; i <= index; i++) {
            applyState(deltaStates[i]);
        }
    }
    currentDeltaIndex = index;
}

function applyState(deltaState) {
    // stats
    for (let p in currentState.stats) {
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
        let action = deltaState.progress[p].action;
        let value = deltaState.progress[p].value;
        if (action == "add") {
            if (currentState.progress[p] === undefined) {
                currentState.progress[p] = value;
            }
        } else if (action == "complete") {
            if (currentState.progress[p] !== undefined) {
                currentState.progress[p].complete = true;
            }
        } else if (action == "change") {
            if (currentState.progress[p] !== undefined) {
                let rank = currentState.progress[p].rank;
                currentState.progress[p].value += CHALLENGE_RANKS[rank];
            }
        }
    }

    // TODO: other props
}

function unapplyState(deltaState) {
    // stats
    for (let p in currentState.stats) {
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
        let action = deltaState.progress[p].action;
        let value = deltaState.progress[p].value;
        if (action == "add") {
            if (currentState.progress[p] !== undefined) {
                delete currentState.progress[p];
            }
        } else if (action == "complete") {
            if (currentState.progress[p] !== undefined) {
                currentState.progress[p].complete = false;
            }
        } else if (action == "change") {
            if (currentState.progress[p] !== undefined) {
                let rank = currentState.progress[p].rank;
                currentState.progress[p].value -= CHALLENGE_RANKS[rank];
            }
        }
    }

    // TODO: other props
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
        if (currentState.progress[p].complete) {
            continue;
        }
        let name = currentState.progress[p].name;
        let rank = currentState.progress[p].rank;
        let value = currentState.progress[p].value;
        let track = createProgressTrack(name, rank);
        updateProgressTrack(track, value);
        list.appendChild(track);
    }
}

function buildState(state, input) {
    state.content = input;
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
            } else if (state.stats[args[0]] !== undefined) {
                changeStat(state, args);
            } else {
                // invalid command
            }
        }
    }
}

function progress(state, args) {
    if (args[1] == undefined) {
        return;
    }

    let id = args[1].toLowerCase();
    let option = (args[2] === undefined) ? undefined : args[2].toLowerCase();

    if (option == "complete") {
        // flag as complete
        state.progress[id] = { 
            action: "complete", 
            value: null,
        };
    } else if (option == "clear") {
        // clear progress
        // TODO: how to handle an undo of a clear?
    } else if (option === undefined) {
        // make progress
        state.progress[id] = {
            action: "change", 
        }
    } else {
        // start new progress
        let progress = {
            name: args[1],
            rank: option,
            value: 0,
            complete: false,
        };
    
        state.progress[id] = {
            action: "add", 
            value: progress
        };
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

    if (args[1][0] == "+" || args[1][0] == "-") {
        if (args[1].length == 1) {
            return;
        }
        state.stats[args[0]] += Number(args[1]);
    } else {
        state.stats[args[0]] = Number(args[1]) - currentState.stats[args[0]];
    }
}