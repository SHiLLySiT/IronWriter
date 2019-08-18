"use strict";

class ProgressState {
    constructor() {
        this.ticks = 0;
        this.name = "";
        this.challenge = "";
    }
}

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
        }
        
        this.vows = [];
        this.progress = [];
        this.debilities = [];
        this.bonds = new ProgressState();
    }
}

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

let submitButton = undefined;
let cancelButton = undefined;
let saveButton = undefined;
let logTemplate = undefined;
let logInput = undefined;
let logHistory = undefined;

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

    let progressTrackTemplate = document.getElementById("progress-track-template");
    progressTrackTemplate.style.display = "none";
    initProgressTrack(progressTrackTemplate);

    initExperience();
    initDebilities();
    initStats();

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
    const MAX_EXPERIENCE = 30;
    let experience = document.getElementById("experience");
    let template = experience.querySelector(".dot");
    let container = experience.querySelector(".wrapper");
    for (let i = 0; i < MAX_EXPERIENCE - 1; i++) {
        let dot = template.cloneNode(true);
        container.insertBefore(dot, container.lastChild);
    }
}

function initProgressTrack(track) {
    const MAX_PROGRESS = 10;
    let template = track.querySelector(".box");
    let container = track.querySelector(".wrapper");
    for (let i = 0; i < MAX_PROGRESS - 1; i++) {
        let box = template.cloneNode(true);
        container.insertBefore(box, container.lastChild);
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
    newLog.id = undefined;
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
    for (let p in currentState.stats) {
        currentState.stats[p] += deltaState.stats[p];
    }
    // TODO: other props
}

function unapplyState(deltaState) {
    for (let p in currentState.stats) {
        currentState.stats[p] -= deltaState.stats[p];
    }
    // TODO: other props
}

function refresh() {
    for (let p in statElements) {
        statElements[p].textContent = currentState.stats[p];
    }
    // TODO: other props
}

function buildState(state, input) {
    state.content = input;
    let result = input.match(/\[(.*?)\]/g);
    if (result != null) {
        for (let i = 0; i < result.length; i++) {
            let args = result[i]
                .replace("[", "")
                .replace("]", "")
                .split(/\s(?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (state.stats[args[0]] !== undefined) {
                changeStat(state, args);
            }
        }
    }
}

function changeStat(state, args) {
    if (args[1][0] == "+" || args[1][0] == "-") {
        state.stats[args[0]] += Number(args[1]);
    } else {
        state.stats[args[0]] = Number(args[1]) - currentState.stats[args[0]];
    }
}

/*
# SYNTAX

## EXAMPLE
"The the highwayman stabs you with his sword [health -1]"

## COMMANDS
experience +1
setname "John Doe"
progress "highwayman"
health +1
spirit -1
momentum reset
supply 1
wounded
!cursed
additem "Great Bow"
additem Arrow 10
roll 2d5+1
oracle region
> game text
# banner text


*/