# HexEmpireAI

This project is based off of the flash game Hex Empire, but it's played by artificial intelligence. The goal of the game is to defeat all the other players and conquer the world.

<div style="display:inline-block;">
<img src="https://raw.githubusercontent.com/samuelyuan/HexEmpireAI/master/screenshots/map.png" alt="map" width="400" height="300" />
</div>

Rules
---

The game starts with 4 players, one in each corner, with a single army in the capital. Each army will be represented as armySize/morale, where morale is gained and lost depending on whether the player gains or loses territory. The turns are in counterclockwise order starting from Redosia (the red player) and each player can only move 5 armies per turn. In order to defeat their enemies, the enemy capital must be captured.

The map has cities and ports, which should be captured to increase morale. Cities can provide more reinforcements at the end of each turn to increase the size of the army and ports can allow the player to pass through to the sea.


Getting Started
---

1. Clone the project

2. Install npm dependencies
```
cd HexEmpireAI
npm install
```

3. Run nodejs
```
node server.js
```
