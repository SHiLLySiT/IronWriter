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

let deltaStates = [];
let currentState = new GameState();

window.addEventListener("load", handleInit);

function handleInit() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let submitButton = document.getElementById("submit-log");
    submitButton.addEventListener("click", handleSubmitLog);

    let cancelButton = document.getElementById("cancel-log");
    cancelButton.style.display = "none";

    let saveButton = document.getElementById("save-log");
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
        handleSubmitLog();
    }
}

function handleKeyUp(event) {
    if (event.key == "Control") {
        isControlPressed = false;
    }
}

function handleSubmitLog() {
    let logElement = document.getElementById("log-content");
    let input = logElement.value;

    addLog(input);

    let deltaState = buildState(input);
    deltaStates.push(deltaState);
    applyState(deltaState);

    logElement.value = null;
    refresh();
}

function addLog(input) {
    let logTemplate = document.getElementById("log-template");
    let newLog = logTemplate.cloneNode(true);
    newLog.querySelector(".content").innerText = input

    let historyElement = document.getElementById("log-history");
    historyElement.appendChild(newLog);

    newLog.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
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

function buildState(input) {
    let state = new GameState();
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
    return state;
}

function changeStat(state, args) {
    if (args[1][0] == "+" || args[1][0] == "-") {
        state.stats[args[0]] = Number(args[1]);
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