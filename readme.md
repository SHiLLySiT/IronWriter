# Overview
IronWriter is an open-source writing tool for solo playthroughs of the free tabletop RPG [Ironsworn](https://www.ironswornrpg.com/). Focus on writing your story and let IronWriter automatically manage your character sheet.

__IMPORTANT NOTE__: IronWriter is currently in active development and should be considered unstable until the v1.0 milestone is reached, so please export and backup any data important to you. Backward compatibility is not guaranteed. 

## Current Features
* Use simple markup embedded in your story to automatically update your character sheet
* Track all stats, momentum, status, and debilities
* Track progress on your vows, journeys, and combat
* Editing an event will update all events that follow it
* Remove events
* Track bonds and overall progress track
* Integrated dice rolls
* Roll against oracle tables
* Reroll oracle/dice
* Import/Export
* Save session to browser cache
* Track assets

## Table of Contents
* [Quick Start](#Quick-start)
* [Keyboard Shortcuts](#Keyboard-Shortcuts)
* [Documentation](#Documentation)
    * [Tags](#Tags)
        * [Renaming your character](#Renaming-your-character)
        * [Changing Stats](#Changing-Stats)
        * [Adding and Removing Debilities](#Adding-and-Removing-Debilities)
        * [Marking Progress](#Marking-Progress)
        * [Making Bonds](#Making-Bonds)
        * [Managing Assets](#Managing-Assets)

# Quick start
* Visit www.alexlarioza.com/IronWriter or clone this repo and open [index.html](index.html) in your browser.
* As you write your story, progress is automatically saved to your browser's local storage so be aware that clearing site data __will__ delete your save data.
* Use the import/export feature to safely store the your session outside of your browser.

# Keyboard Shortcuts
* CTRL+Enter: Submit/Save event
* CTRL+M: Toggle mode

# Documentation
IronWriter represents moments or blocks of content in your stories as "events". How much content you choose to write into each card is up to you.

![alt text](/docs/images/events.gif)

There are two types of events - "fiction" and "meta". Functionally there is nothing different about them, but they are visually distinct to help separate your fictional elements from your meta actions during your session such as moves, question prompts, etc.

![alt text](/docs/images/mode-toggle.gif)

IronWriter uses special markup (referred to as "tags") to automatically update the character sheet. These tags should always be wrapped in square brackets `[]` but this documentation will leave them out for brevity. 

![alt text](/docs/images/markup.gif)

> [health -2][momentum -1] Blood begins to pour out of the wounds on my arm as the wolf attempts to rip it off. I reach for my dagger tucked in my belt.

> I pull the dagger from its sheath and stab the wolf in its neck.[progress wolf] It finally release my arm and whimpers in pain. Just as I think I'm about to make it out of this alive, three more wolfs come running out of the forest. [progress "Wolf Pack" formidable]

_For a full example, see the [example session](/docs/sample.md)._

Tags contain parameters which are used to control how the tags change the character sheet. Parameters are separated by spaces, so if you want to include spaces wrap the parameter in double quotes e.g. `rename "Brynn Tahir"`. In the documentation, parameters that are wrapped in carets `<parameter>` are required and those wrapped in curly braces `{parameters}` are optional.

All events are stored in a history stack so that when you edit an event, any subsequent ones that are dependent on it will be replayed on top of your changes.

![alt text](/docs/images/history.gif)

# Tags
## Renaming your character
Renames your character.
```
rename <character name>
```
### Parameters
* `<character name>` The desired name.

### Examples
* `rename Maura` Sets the character name to "Joe".
* `rename "Brynn Tahir"` Sets the character name to "Brynn Tahir".
    
## Changing Stats
Changes a stat's value. Note that the first parameter is not literally "stat" but the stat that you wish to change.
```
<stat> {modifier}<value>
```
### Stats
* edge
* heart
* iron
* shadow
* wits
* health
* supply
* spirit
* momentum
* experience
* experienceSpent

### Parameters
* `<stat>` The stat you wish to change.
* `<value>` The value to be applied to the specified `stat`.
* `{modifier}` How you want the `value` parameter to be applied. The following options can be used:
    * `+` Adds the specified `value`.
    * `-` Subtracts the specified `value`.
    * Not specifying a modifier sets the stat to the specified `value`.

### Examples
* `health +1` increases health by 1
* `spirit -2` decreases spirit by 2
* `iron 3` sets iron to 3

## Adding and Removing Debilities
Adds and removes debilities and automatically changes max momentum and momentum reset stats.
```
is <debility>
```
```
not <debility>
```
### Debilities
* wounded
* shaken
* unprepared
* encumbered
* maimed
* corrupted
* cursed
* tormented

### Parameters
* `<debility>` The debility that you is to add or remove.

### Examples
* `is wounded` Adds the wounded debility.
* `not wounded` Removes the wounded debility.

## Marking Progress
Starts, compeltes, or marks progress on a specific track.
```
progress <name> {modifier}
```

### Parameters
* `<name>` The name of the progress track.
* `{modifier}` How you wish to modify the track. The following options can be used:
    * `complete` Removes the progress track from your character sheet.
    * `challenge rank` The rank of a new progress track. The following options can be used:
        * `troublesome` Each progress is 12 ticks.
        * `dangerous` Each progress is 8 ticks.
        * `formidable` Each progress is 4 ticks.
        * `extreme` Each progress is 2 ticks.
        * `epic` Each progress is 1 ticks.
    * `{+/-}<value>` The number of ticks to add, remove, or set.
        * `+` Adds the specified `value`.
        * `-` Subtracts the specified `value`.
        * Not specifying a modifier sets the number of ticks to the specified `value`.
    * Not passing this parameter automatically adds the number of ticks as specified by the `challenge rank`.

### Examples
* `progress "Kill Martu" formidable` Creates a new progress track called "Kill Jorge" and sets it's rank to `formidable`
* `progress "Kill Martu"` Increases the number of ticks by 4.
* `progress "Kill Martu" +1` Increases the number of ticks by 1.
* `progress "Kill Martu" -2` Decreases the number of ticks by 2.
* `progress "Kill Martu" 8` Sets the number of ticks to 8.
* `progress "Kill Martu" complete` Removes the progress track called "Kill Jorge".

## Making Bonds
Adds a bond to your list of bonds and adds a tick to your bond progress track.
```
bond <name>
```
```
unbond <name>
```

### Parameters
* `<name>` Text describing the bond.

### Examples
* `bond Father` Adds a bond called "Father" and adds 1 tick to the bond progress track.
* `unbond Father` Removes the bond called "Father" and removes 1 tick from the bond progress track.
* `bond "Mai Lucia"` Adds a bond called "Mai Lucia" and adds 1 tick to the bond progress track.

## Managing Assets
Adds and updates your character's assets.
```
asset <name> <perk>
```
```
asset <name> <property> {modifier}<value>
```

### Parameters
* `<name>` The name of the asset.
* `<perk>` Unlocks the perk in the specified slot.
* `<property>` The name of an asset property.
* `{modifier}` How you want the `value` parameter to be applied. The following options can be used:
    * `+` (Number Only) Adds the specified `value`.
    * `-` (Number Only) Subtracts the specified `value`.
    * Not specifying a modifier sets the stat to the specified `value`.
* `<value>` The value of the property. Can be a number or text.

### Examples
* `asset Ritualist` Adds an asset called "Ritualist".
* `asset Ritualist 1` Unlocks the perk in slot "1" for asset called "Ritualist".
* `asset Hawk Health 1` Sets the "Health" property to "1" for the asset called "Hawk"
* `asset Hawk Health +10` Adds "10" to the "Health" property for the asset called "Hawk"
* `asset Hawk Health -5` Subtracts "5" from the "Health" property for the asset called "Hawk"
* `asset Wright Specialty Herbalism` Sets the "Specialty" property to "Herbalism" for the asset called "Wright".