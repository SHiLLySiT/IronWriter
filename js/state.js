"use strict";

/*
    IronWriter is an open-source writing tool for solo playthroughs of the free tabletop RPG Ironsworn.
    Copyright (C) 2019 Alex Larioza

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program. If not, see https://github.com/SHiLLySiT/IronWriter/blob/master/LICENSE.txt.
*/
class Session {
    constructor() {
        this.version = VERSION;
        this.state = new GameState();
        /**
         * @type {Moment[]}
         */
        this.history = [];
        this.momentIndex = -1;
        /**
         * @type {string, Bookmark[]}
         */
        this.bookmarks = {};
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
        this.removeBookmark(index);
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

    /**
     * @param {number} index
     */
    removeBookmark(index) {
        for(let i = index, j = this.history.length; i < j; i++) {
            for(let a of this.history[i].actions) {
                if (a.type !== "BookmarkAction") { continue; }
                a.eventIndex--;
            }
        }
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

        /**
         * @type {Object.<string, InventoryItem>}
         */
        this.items = {};
    }
}

class Resource {
    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
        /**
         * @type {Object.<string, ResourceProperty>}
         */
        this.properties = {};
    }
}

class ResourceProperty {
    constructor() {
        this.name = "";
        this.value = undefined;
    }
}

class Asset extends Resource {
    /**
     * @param {string} name
     */
    constructor(name) {
        super(name);
        this.upgrades = [false, false, false];
    }
}

class InventoryItem extends Resource {
    /**
     * @param {string} name
     */
    constructor(name, quantity = 1) {
        super(name);

        let quantityProp = new ResourceProperty();
        quantityProp.name = "Quantity";
        quantityProp.value = quantity;
        /**
         * @type {Object.<string, ResourceProperty>}
         */
        this.properties = {
            "quantity": quantityProp
        };
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

class Bookmark {
    /**
     * @param {string} name
     * @param {string} type
     */
    constructor(name, type) {
        this.name = name;
        this.type = type;
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

    bookmarkArgs() {
        return ["auto-bookmark", this.bookmarkName(), this.bookmarkType()];
    }

    bookmarkName() {
    }

    bookmarkType() {
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
                let prop = new ResourceProperty();
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

class InventoryAction extends Action {
    /**
     * @param {string} inventoryId
     */
    constructor(inventoryId) {
        super();
        this.type = "InventoryAction";
        this.inventoryId = inventoryId;
        this.action = "";
        this.inventoryName = "";
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
            //Assume the action's propertyValue is the quantity
            gameState.items[this.inventoryId] = new InventoryItem(this.inventoryName, this.propertyValue);
        } else if (this.action == "remove") {
            delete gameState.items[this.inventoryId];
        } else if (this.action == "update") {
            if (gameState.items[this.inventoryId] === undefined) {
                return;
            }

            let prop = gameState.items[this.inventoryId].properties[this.propertyId];
            if (prop === undefined) {
                let prop = new ResourceProperty();
                prop.name = this.propertyName;
                prop.value = this.propertyValue;
                gameState.items[this.inventoryId].properties[this.propertyId] = prop;
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
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        gameState.items[this.inventoryId] = moment.state.items[this.inventoryId];
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

    bookmarkName() {
       switch(this.action) {
            case "add": return "Started: " + this.progressName;
            case "tick": // use fallthrough so tick & progress do the same thing
            case "progress": return "Progressed: " + this.progressName;
            case "complete": return "Completed: " + this.progressName;
        }
    }

    bookmarkType() {
        return "progress_" + this.action;
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

    bookmarkName() {
        switch(this.action) {
            case "add": return "Bond: " + this.bondName;
            case "remove": return "Unbond: " + this.bondName;
        }
    }

    bookmarkType() {
        switch(this.action) {
            case "add": return "bond";
            case "remove": return "unbond";
        }
    }
}

class BookmarkAction extends Action {
     /**
     * @param {number} index
     * @params {boolean} isAutomatic
     */
    constructor(index, isAutomatic = false) {
        super();
        this.type = "BookmarkAction";
        this.eventIndex = index;
        this.isAutomatic = isAutomatic;
        this.action = "";
        this.bookmarkName = "";
        this.bookmarkType = "fiction";
    }

    applyAction(gameState, moment) {
        // Bookmarks do not change state
        let b = new Bookmark(this.bookmarkName, this.bookmarkType);
        if(session.bookmarks[this.eventIndex] == undefined) {
            session.bookmarks[this.eventIndex] = [b];
        } else {
            session.bookmarks[this.eventIndex].push(b);
        }
    }

    /**
     * @param {GameState} gameState
     * @param {Moment} moment
     */
    unapplyAction(gameState, moment) {
        delete session.bookmarks[this.eventIndex];
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
        if (totalAction <= this.challenge[0] && totalAction <= this.challenge[1]) {
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
    "InventoryAction": InventoryAction,
    "BookmarkAction": BookmarkAction,
}
