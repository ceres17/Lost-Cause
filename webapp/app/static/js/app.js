// debug
console.log(mazeHex)
console.log(mapWidth, mapHeight)
const mazeScale = 128


class Maze {

    constructor(mapHeight, mapWidth, mazeHex) {
        this.adjacencyList = [];
        this.height = mapHeight;
        this.width = mapWidth;
        this.mazeHex = mazeHex;
        this.createTree()
        }

    createTree() {
        // converting hex back into the spanning tree
        let index = 0;
        for (let row = 1; row <= mapHeight; row++) {
            let rowList = [];
            for (let column = 1; column <= mapWidth; column++) {

                // each hex character corresponds to one node of the maze
                let hex = this.mazeHex[index]

                let walls = {top: 1, bottom: 1, left: 1, right: 1}

                // converting hex to binary, nibble will represent the walls of the node
                let bin = (parseInt(hex, 16).toString(2)).padStart(4, '0')
                walls.top = parseInt(bin[0])
                walls.bottom = parseInt(bin[1])
                walls.left = parseInt(bin[2])
                walls.right = parseInt(bin[3])

                rowList.push(walls)

                index += 1
            }
            this.adjacencyList.push(rowList)
        }
    }

    getWalls(currentTileX, currentTileY, prevTileX, prevTileY, walls){
        // if the next node is going to be between two nodes
        if (Math.floor(currentTileX) !== currentTileX && prevTileX !== currentTileX) {
            walls =  { top: 1, bottom: 1, left: 0, right: 0 }

        } else if (Math.floor(currentTileY) !== currentTileY && prevTileY !== currentTileY) {
            walls =  { top: 0, bottom: 0, left: 1, right: 1 }

        } else if (prevTileX !== currentTileX || prevTileY !== currentTileY) {
            walls = this.adjacencyList[currentTileY - 1][currentTileX - 1]
        }
        return walls
    }

    output(){
        console.log(this.adjacencyList)
    }

}

class Entity {
    constructor(y, x, identifier) {
        this.x = x;
        this.y = y;
        this.speed = 0;
        this.prevTileX = 0;
        this.prevTileY = 0;
        this.currentTileX = 0;
        this.currentTileY = 0;
        this.determineCurrentTile()
        this.walls = maze.getWalls(this.currentTileX, this.currentTileY, this.prevTileX, this.prevTileY);
        this.self = document.querySelector(identifier);
    }

    // function to round a number to the nearest 0.5
    roundTileCoord(tileCoord) {
        if (tileCoord - Math.floor(tileCoord) > 0.5) {
            tileCoord = Math.floor(tileCoord) + 0.5
        } else {
            tileCoord = Math.floor(tileCoord)
        }
        return tileCoord
    }

    determineCurrentTile(){
        // store previous node to know where its walls where
        this.prevTileX = this.currentTileX;
        this.prevTileY = this.currentTileY;

        // work out which tile in the spanning tree the player is in
        this.currentTileX = this.roundTileCoord((this.x / mazeScale) + 1);
        this.currentTileY = this.roundTileCoord((this.y / mazeScale) + 1);
    }

    determineWalls() {
        this.determineCurrentTile()
        return maze.getWalls(this.currentTileX, this.currentTileY, this.prevTileX, this.prevTileY, this.walls)
    }

    checkCollision(originalX, originalY, tileOriginX, tileOriginY) {
        // maze wall collisions
        // top, bottom, left, right

        this.walls = this.determineWalls()

        // left
        if (this.x < tileOriginX + 1) {
            if (this.walls.left === 1) {
                this.x = originalX;
            } else if (this.walls.left === 0 && this.y < tileOriginY + 1) {
                // corner correction
                this.x = originalX;
            }
        }
        // right
        if (this.x > tileOriginX + 32) {
            if (this.walls.right === 1) {
                this.x = originalX;
            } else if (this.walls.right === 0 && this.y > tileOriginY + 41) {
                this.x = originalX;
            }
        }
        // top
        if (this.y < tileOriginY + 1) {
            if (this.walls.top === 1) {
                this.y = originalY;
            } else if (this.walls.top === 0 && this.x < tileOriginX + 1) {
                this.y = originalY;
            }
        }
        // bottom
        if (this.y > tileOriginY + 41) {
            if (this.walls.bottom === 1) {
                this.y = originalY;
            } else if (this.walls.bottom === 0 && this.x > tileOriginX + 32) {
                this.y = originalY;
            }
        }
    }

    move(direction) {
        // storing position from previous frame in case new position is blocked
        let originalX = this.x;
        let originalY = this.y;

        // get the coordinates of the tile and data from spanning tree
        let tileOriginX = (this.currentTileX - 1) * mazeScale;
        let tileOriginY = (this.currentTileY - 1) * mazeScale;
        switch (direction) {
            case directions.right:
                this.x += this.speed;
                break;
            case directions.left:
                this.x -= this.speed;
                break;
            case directions.down:
                this.y += this.speed;
                break;
            case directions.up:
                this.y -= this.speed;
                break;
        }
        this.checkCollision(originalX, originalY, tileOriginX, tileOriginY)
    }

}

class Player extends Entity {
    constructor() {
        super(27, 16, '.character');
        this.speed = 1
        this.map = document.querySelector('.map')
    }

    move(pixelSize){
        let mapX = this.x;
        let mapY = this.y;

        console.log(this.y, this.x, this.currentTileY, this.currentTileX, this.walls)

        let held_direction = held_directions[0];
        if (held_direction){
            super.move(held_direction)
            this.self.setAttribute("facing", held_direction)
            this.self.setAttribute("walking", "true");
        } else {
            this.self.setAttribute("walking", "false");
        }

        // smooth camera movement - moves the map against the player while the player is in the centre of the map
        if (mapX < 112) { mapX = 112; } // left
        if (mapX > imgWidth - 112) { mapX = imgWidth - 112; } // right
        if (mapY < 112) { mapY = 112; } // tops
        if (mapY > imgHeight - 112) { mapY = imgHeight - 112; } // bottom
        let camera_top = pixelSize * 112;
        let camera_left = pixelSize * 112;

        // moving the map and player
        this.map.style.transform = `translate3d( ${-mapX * pixelSize + camera_left}px, ${-mapY * pixelSize + camera_top}px, 0 )`;
        this.self.style.transform = `translate3d( ${this.x * pixelSize}px, ${this.y * pixelSize}px, 0 )`;

        }
}

const maze = new Maze(mapHeight, mapWidth, mazeHex)
maze.output()

let player = new Player()

// setting css properties to correct values
let root = document.querySelector(':root');
root.style.setProperty('--map-width', mapWidth);
root.style.setProperty('--map-height', mapHeight);

// initial variable declarations
let held_directions = [];
const imgWidth = (maze.width * mazeScale) - 64
const imgHeight = (maze.height * mazeScale) - 64

// determines where the character (and maze) is positioned every frame
const gameLoop = function () {

    // getting the pixel size being used from the css - varies depending on how large the browser window is
    let pixelSize = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
    );

    player.move(pixelSize)

}

// steps through every frame
const step = function () {
    gameLoop()
    window.requestAnimationFrame(function () {
        step()
    })
}
step()

// mapping keys to movement directions
const directions = {
    up: "up",
    down: "down",
    left: "left",
    right: "right",
}
const keys = {
    'w': directions.up,
    'a': directions.left,
    'd': directions.right,
    's': directions.down,
    'ArrowUp': directions.up,
    'ArrowLeft': directions.left,
    'ArrowRight': directions.right,
    'ArrowDown': directions.down,
}


// event listeners for keys being pressed and released
document.addEventListener('keydown', function (e) {
    let dir = keys[e.key];
    // adds last key pressed to the start of the held_directions array
    if (dir && held_directions.indexOf(dir) === -1) {
        held_directions.unshift(dir);
    }
})

document.addEventListener('keyup', function (e) {
    let dir = keys[e.key];
    let index = held_directions.indexOf(dir);
    // removes key from help_directions when it stops being pressed
    if (index > -1) {
        held_directions.splice(index, 1)
    }
})