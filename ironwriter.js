"use strict";

let isControlPressed = false;

window.addEventListener("load", handleInit);

function handleInit() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let submitButton = document.getElementById("submit-log");
    submitButton.addEventListener("click", handleSubmitLog);
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
    let logContent = logElement.value;
    logElement.value = null;

    let logTemplate = document.getElementById("log-template");
    let newLog = logTemplate.cloneNode(true);
    newLog.querySelector("#content").innerText = logContent

    let historyElement = document.getElementById("log-history");
    historyElement.appendChild(newLog);

    newLog.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}