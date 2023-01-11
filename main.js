const scene = new THREE.Scene();
const distance = 500;

counterDOM = document.getElementById('counter')
endDOM = document.getElementById('end_window')

// Setup camera
const camera = new THREE.OrthographicCamera( window.innerWidth/-2, window.innerWidth/2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 10000 );
camera.rotation.x = 50*Math.PI/180;
camera.rotation.y = 20*Math.PI/180;
camera.rotation.z = 10*Math.PI/180;
const initialCameraPositionY = -Math.tan(camera.rotation.x)*distance;
const initialCameraPositionX = Math.tan(camera.rotation.y)*Math.sqrt(distance**2 + initialCameraPositionY**2);
camera.position.y = initialCameraPositionY;
camera.position.x = initialCameraPositionX;
camera.position.z = distance;

const zoom = 1.5;
const chickenSize = 15;
const positionWidth = 42;
const columns = 17;
const boardWidth = positionWidth*columns;
const stepTime = 200; // Miliseconds it takes for the chicken to take a step forward, backward, left or right
let lanes;
let currentLane;
let currentColumn;
let previousTimestamp;
let startMoving;
let moves;
let stepStartTimestamp;
let windowHalfX;
let windowHalfY;
let total_gairs = 293;
let accident_time = 0;

const carFrontTexture = new Texture(40,80,[{x: 0, y: 10, w: 30, h: 60 }]);
const carBackTexture = new Texture(40,80,[{x: 10, y: 10, w: 30, h: 60 }]);
const carRightSideTexture = new Texture(110,40,[{x: 10, y: 0, w: 50, h: 30 }, {x: 70, y: 0, w: 30, h: 30 }]);
const carLeftSideTexture = new Texture(110,40,[{x: 10, y: 10, w: 50, h: 30 }, {x: 70, y: 10, w: 30, h: 30 }]);
const truckFrontTexture = new Texture(30,30,[{x: 15, y: 0, w: 10, h: 30 }]);
const truckRightSideTexture = new Texture(25,30,[{x: 0, y: 15, w: 10, h: 10 }]);
const truckLeftSideTexture = new Texture(25,30,[{x: 0, y: 5, w: 10, h: 10 }]);

// lane generation 
const generateLanes = () => [-15,-14,-13,-12,-11,-10,-9,-8,-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((index) => {
    const lane = new Lane(index);
    lane.mesh.position.y = index*positionWidth*zoom;
    scene.add( lane.mesh );
    return lane;
}).filter((lane) => lane.index >= 0);

const addLane = () => {
    const index = lanes.length;
    const lane = new Lane(index);
    lane.mesh.position.y = index*positionWidth*zoom;
    scene.add(lane.mesh);
    lanes.push(lane);
}

const chicken = new Chicken();
scene.add( chicken );

const laneTypes = ['car', 'truck', 'forest'];
const laneSpeeds = [2, 2.5, 3];
const vechicleColors = [0x3a5311, 0x234f1e];
const threeHeights = [20,45,60];

const initaliseValues = () => {
    lanes = generateLanes()

    currentLane = 0;
    currentColumn = Math.floor(columns/2);

    previousTimestamp = null;

    startMoving = false;
    moves = [];
    stepStartTimestamp;

    chicken.position.x = 0;
    chicken.position.y = 0;
    startMoving = true;
    camera.position.y = initialCameraPositionY;
    camera.position.x = initialCameraPositionX;
}

initaliseValues();

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: false // true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

document.addEventListener('mousemove', onDocumentMouseMove, false);
document.addEventListener('resize', onWindowResize, false);
document.addEventListener('click', onClick, false);

function onClick() {
    if ((Date.now() - accident_time) < 200) return;
    if (window.getComputedStyle(document.getElementById('start_window')).visibility !== "hidden") {
      document.getElementById('start_window').style.visibility = 'hidden';
      return;
    }
    if (window.getComputedStyle(document.getElementById('end_window')).visibility !== "hidden") {
      document.getElementById('end_window').style.visibility = 'hidden';
      currentLane = -1;
      move('forward');
      return;
    }
    
    move('forward');
}


function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 10;
    mouseY = (event.clientY - windowHalfY) * 10;
}

function render() {
    //camera.lookAt(scene.position);
    renderer.render(scene, camera);
}
// Light setup
hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
scene.add(hemiLight)
dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(-100, -100, 200);
dirLight.castShadow = true;
scene.add(dirLight);
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
var d = 500;
dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;
// var helper = new THREE.CameraHelper( dirLight.shadow.camera );
// var helper = new THREE.CameraHelper( camera );
// scene.add(helper)
backLight = new THREE.DirectionalLight(0x000000, .4);
backLight.position.set(200, 200, 50);
backLight.castShadow = true;
scene.add(backLight)

function Texture(width, height, rects) {
    const canvas = document.createElement( "canvas" );
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext( "2d" );
    context.fillStyle = "#ffffff";
    context.fillRect( 0, 0, width, height );
    context.fillStyle = "rgba(0,0,0,0.6)";  
    rects.forEach(rect => {
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
    });
    return new THREE.CanvasTexture(canvas);
}

function Wheel() {
    const wheel = new THREE.Mesh( 
      new THREE.BoxGeometry( 12*zoom, 33*zoom, 12*zoom ), 
      new THREE.MeshLambertMaterial( { color: 0x333333, flatShading: true } ) 
    );
    wheel.position.z = 6*zoom;
    return wheel;
}

// car stuff
function Car() {
  const car = new THREE.Group();
  const color = [0x909671, 0x75776e, 0x383b28][Math.floor(Math.random() * 3)];
  
  const main = new THREE.Mesh(
    new THREE.BoxGeometry( 60*zoom, 30*zoom, 15*zoom ), 
    new THREE.MeshPhongMaterial( { color: color, flatShading: true } )
  );
  main.position.z = 12*zoom;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main)
  
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry( 35*zoom, 30*zoom, 12*zoom ), 
    [
      new THREE.MeshPhongMaterial( { color: color, flatShading: true, map: carBackTexture } ),
      new THREE.MeshPhongMaterial( { color: color, flatShading: true, map: carFrontTexture } ),
      new THREE.MeshPhongMaterial( { color: color, flatShading: true, map: carRightSideTexture } ),
      new THREE.MeshPhongMaterial( { color: color, flatShading: true, map: carLeftSideTexture } ),
      new THREE.MeshPhongMaterial( { color: color, flatShading: true } ), // top
      new THREE.MeshPhongMaterial( { color: color, flatShading: true } ) // bottom
    ]
  );
  cabin.position.x = 12*zoom; // 6
  cabin.position.z = 25.5*zoom;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add( cabin );
  
  const spareWheel = new THREE.Mesh(
    new THREE.BoxGeometry( 15*zoom, 15*zoom, 10*zoom ), 
    new THREE.MeshPhongMaterial( { color: 0x333333, flatShading: true } )
  );
  spareWheel.position.x = -18*zoom;
  spareWheel.position.z = 20*zoom;
  spareWheel.castShadow = true;
  spareWheel.receiveShadow = true;
  car.add( spareWheel );

  const frontWheel = new Wheel();
  frontWheel.position.x = -18*zoom;
  car.add( frontWheel );

  const backWheel = new Wheel();
  backWheel.position.x = 18*zoom;
  car.add( backWheel );

  car.castShadow = true;
  car.receiveShadow = false;
  
  return car;
}
// truck stuff
function Truck() {
    const truck = new THREE.Group();
    const color = [0x495e35][Math.floor(Math.random() * 1)]; // vechicleColors[Math.floor(Math.random() * vechicleColors.length)];
    const base = new THREE.Mesh(
        new THREE.BoxGeometry( 100*zoom, 25*zoom, 5*zoom ), 
        new THREE.MeshLambertMaterial( { color: 0xb4c6fc, flatShading: true } )
    );
    base.position.z = 10*zoom;
    truck.add(base)

    const cargo = new THREE.Mesh(
      new THREE.BoxGeometry( 75*zoom, 35*zoom, 40*zoom ), 
      new THREE.MeshPhongMaterial( { color: color, flatShading: true } )
    );
    cargo.position.x = 15*zoom;
    cargo.position.z = 30*zoom;
    cargo.castShadow = true;
    cargo.receiveShadow = true;
    truck.add(cargo)

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry( 25*zoom, 30*zoom, 30*zoom ), 
      [
        new THREE.MeshPhongMaterial( { color, flatShading: true } ), // back
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckFrontTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckRightSideTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true, map: truckLeftSideTexture } ),
        new THREE.MeshPhongMaterial( { color, flatShading: true } ), // top
        new THREE.MeshPhongMaterial( { color, flatShading: true } ) // bottom
      ]
    );
    cabin.position.x = -40*zoom;
    cabin.position.z = 20*zoom;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truck.add( cabin );
    
    const frontWheel = new Wheel();
    frontWheel.position.x = -38*zoom;
    truck.add( frontWheel );
  
    //const middleWheel = new Wheel();
    //middleWheel.position.x = -10*zoom;
    //truck.add( middleWheel );

    const backWheel = new Wheel();
    backWheel.position.x = 25*zoom;
    truck.add( backWheel );
    
    return truck;  
  }
// tree stuff
function Three() {
    const three = new THREE.Group();
    
    const trunk = new THREE.Mesh(
      new THREE.BoxGeometry( 15*zoom, 15*zoom, 20*zoom ), 
      new THREE.MeshPhongMaterial( { color: 0x4d2926, flatShading: true } )
    );
    trunk.position.z = 10*zoom;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    three.add(trunk);

    height = threeHeights[Math.floor(Math.random()*threeHeights.length)];

    const crown = new THREE.Mesh(
        new THREE.BoxGeometry( 30*zoom, 30*zoom, height*zoom ), 
        new THREE.MeshLambertMaterial( { color: 0x7aa21d, flatShading: true } )
    );
    crown.position.z = (height/2+20)*zoom;
    crown.castShadow = true;
    crown.receiveShadow = false;
    three.add(crown);
    
    return three;  
}
// player stuff
function Chicken() {
    const chicken = new THREE.Group();
    
    const body = new THREE.Mesh(
      new THREE.BoxGeometry( chickenSize*zoom, chickenSize*zoom, 20*zoom ), 
      new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } )
    );
    body.position.z = 10*zoom;
    body.castShadow = true;
    body.receiveShadow = true;
    chicken.add(body);

    const rowel = new THREE.Mesh(
        new THREE.BoxGeometry( 18*zoom, 18*zoom, 8*zoom ), 
        new THREE.MeshLambertMaterial( { color: 0x689065, flatShading: true } )
    );
    rowel.position.z = 21*zoom;
    rowel.castShadow = true;
    rowel.receiveShadow = false;
    chicken.add(rowel);
    
    return chicken;  
}
// plain road
function Road() {
    const road = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.PlaneGeometry( boardWidth*zoom, positionWidth*zoom ), 
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0x454A59);
    middle.receiveShadow = true;
    road.add(middle);

    const left = createSection(0x393D49);
    left.position.x = - boardWidth*zoom;
    road.add(left);

    const right = createSection(0x393D49);
    right.position.x = boardWidth*zoom;
    road.add(right);
    
    return road;
}
// plain grass
function Grass() {
    const grass = new THREE.Group();

    const createSection = color => new THREE.Mesh(
        new THREE.BoxGeometry( boardWidth*zoom, positionWidth*zoom, 3*zoom ), 
        new THREE.MeshPhongMaterial( { color } )
    );

    const middle = createSection(0xbaf455);
    middle.receiveShadow = true;
    grass.add(middle);

    const left = createSection(0x99C846);
    left.position.x = - boardWidth*zoom;
    grass.add(left);

    const right = createSection(0x99C846);
    right.position.x = boardWidth*zoom;
    grass.add(right);

    grass.position.z = 1.5*zoom;
    return grass;
}

// generates the random lane based on index given
function Lane(index) {
    this.index = index;
    this.type = index <= 0 ? 'field' : laneTypes[Math.floor(Math.random()*laneTypes.length)];

    switch(this.type) {
        case 'field': {
            this.type = 'field';
            this.mesh = new Grass();
            break;
        }
        case 'forest': {
            this.mesh = new Grass();
            
            this.occupiedPositions = new Set();
            this.threes = [1,2,3,4].map(() => {
                const three = new Three();
                let position;
                do {
                    position = Math.floor(Math.random()*columns);
                }while(this.occupiedPositions.has(position)||position==8)
                this.occupiedPositions.add(position);
                three.position.x = (position*positionWidth+positionWidth/2)*zoom-boardWidth*zoom/2;
                this.mesh.add( three );
                return three;
            })
            break;
        }
        case 'car' : {
            this.mesh = new Road();
            this.direction = Math.random() >= 0.5;
            
            const occupiedPositions = new Set();
            this.vechicles = [1,2,3].map(() => {
                const vechicle = new Car();
                let position;
                do {
                    position = Math.floor(Math.random()*columns/2);
                }while(occupiedPositions.has(position))
                occupiedPositions.add(position);
                vechicle.position.x = (position*positionWidth*2+positionWidth/2)*zoom-boardWidth*zoom/2;
                if(!this.direction) vechicle.rotation.z = Math.PI;
                this.mesh.add( vechicle );
                return vechicle;
            })

            this.speed = laneSpeeds[Math.floor(Math.random()*laneSpeeds.length)];
            break;
        }
        case 'truck' : {
            this.mesh = new Road();
            this.direction = Math.random() >= 0.5;
            
            const occupiedPositions = new Set();
            this.vechicles = [1,2].map(() => {
                const vechicle = new Truck();
                let position;
                do {
                    position = Math.floor(Math.random()*columns/3);
                }while(occupiedPositions.has(position))
                occupiedPositions.add(position);
                vechicle.position.x = (position*positionWidth*3+positionWidth/2)*zoom-boardWidth*zoom/2;
                if(!this.direction) vechicle.rotation.z = Math.PI;
                this.mesh.add( vechicle );
                return vechicle;
            })

            this.speed = laneSpeeds[Math.floor(Math.random()*laneSpeeds.length)];
            break;
        }
    }
}
//document.getElementById('body').addEventListener("click", () => move('forward'));
/*document.querySelector("#retry").addEventListener("click", () => {
    lanes.forEach(lane => scene.remove( lane.mesh ));
    initaliseValues();
    endDOM.style.visibility = 'hidden';
});

document.getElementById('forward').addEventListener("click", () => move('forward'));

document.getElementById('backward').addEventListener("click", () => move('backward'));

document.getElementById('left').addEventListener("click", () => move('left'));

document.getElementById('right').addEventListener("click", () => move('right'));

window.addEventListener("keydown", event => {
    if (event.keyCode == '38') {
        // up arrow
        move('forward');
    }
    else if (event.keyCode == '40') {
        // down arrow
        move('backward');
    }
    else if (event.keyCode == '37') {
       // left arrow
       move('left');
    }
    else if (event.keyCode == '39') {
       // right arrow
       move('right');
    }
});*/

function move(direction) {
    const finalPositions = moves.reduce((position,move) => {
        if(move === 'forward') return {lane: position.lane+1, column: position.column};
        if(move === 'backward') return {lane: position.lane-1, column: position.column};
        if(move === 'left') return {lane: position.lane, column: position.column-1};
        if(move === 'right') return {lane: position.lane, column: position.column+1};
    }, {lane: currentLane, column: currentColumn})

    if (direction === 'forward') {
        if(lanes[finalPositions.lane+1].type === 'forest' && lanes[finalPositions.lane+1].occupiedPositions.has(finalPositions.column)) return;
        if(!stepStartTimestamp) startMoving = true;
        addLane();
    }
    else if (direction === 'backward') {
        if(finalPositions.lane === 0) return;
        if(lanes[finalPositions.lane-1].type === 'forest' && lanes[finalPositions.lane-1].occupiedPositions.has(finalPositions.column)) return;
        if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'left') {
       if(finalPositions.column === 0) return;
       if(lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column-1)) return;
       if(!stepStartTimestamp) startMoving = true;
    }
    else if (direction === 'right') {
       if(finalPositions.column === columns - 1 ) return;
       if(lanes[finalPositions.lane].type === 'forest' && lanes[finalPositions.lane].occupiedPositions.has(finalPositions.column+1)) return;
       if(!stepStartTimestamp) startMoving = true;
    }
    moves.push(direction);
}

function animate(timestamp) {
    requestAnimationFrame( animate );
    
    if(!previousTimestamp) previousTimestamp = timestamp;
    const delta = timestamp - previousTimestamp;
    previousTimestamp = timestamp;
  
    // Animate cars and trucks moving on the lane
    lanes.forEach(lane => {
        if(lane.type === 'car' || lane.type === 'truck') {
            const aBitBeforeTheBeginingOfLane = -boardWidth*zoom/2 - positionWidth*2*zoom;
            const aBitAfterTheEndOFLane = boardWidth*zoom/2 + positionWidth*2*zoom;
            lane.vechicles.forEach(vechicle => {
                if(lane.direction) {
                    vechicle.position.x = vechicle.position.x < aBitBeforeTheBeginingOfLane ? aBitAfterTheEndOFLane : vechicle.position.x -= lane.speed/16*delta;
                }else{
                    vechicle.position.x = vechicle.position.x > aBitAfterTheEndOFLane ? aBitBeforeTheBeginingOfLane : vechicle.position.x += lane.speed/16*delta;
                }
            });
        }
    });

    if(startMoving) {
        stepStartTimestamp = timestamp;
        startMoving = false;
    }

    if(stepStartTimestamp) {
        const moveDeltaTime = timestamp - stepStartTimestamp;
        const moveDeltaDistance = Math.min(moveDeltaTime/stepTime,1)*positionWidth*zoom;
        const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime/stepTime,1)*Math.PI)*8*zoom;
        switch(moves[0]) {
            case 'forward': {
                camera.position.y = initialCameraPositionY + currentLane*positionWidth*zoom + moveDeltaDistance;        
                chicken.position.y = currentLane*positionWidth*zoom + moveDeltaDistance; // initial chicken position is 0
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'backward': {
                camera.position.y = initialCameraPositionY + currentLane*positionWidth*zoom - moveDeltaDistance;
                chicken.position.y = currentLane*positionWidth*zoom - moveDeltaDistance;
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'left': {
                camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance;        
                chicken.position.x = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 - moveDeltaDistance; // initial chicken position is 0
                chicken.position.z = jumpDeltaDistance;
                break;
            }
            case 'right': {
                camera.position.x = initialCameraPositionX + (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance;        
                chicken.position.x = (currentColumn*positionWidth+positionWidth/2)*zoom -boardWidth*zoom/2 + moveDeltaDistance; 
                chicken.position.z = jumpDeltaDistance;
                break;
            }
        }
        // Once a step has ended
        if(moveDeltaTime > stepTime) {
            switch(moves[0]) {
                case 'forward': {
                    currentLane++;
                    counterDOM.innerHTML = String(currentLane).replaceAll('0','O');    
                    break;
                }
                case 'backward': {
                    currentLane--;
                    counterDOM.innerHTML = String(currentLane).replaceAll('0','O');    
                    break;
                }
                case 'left': {
                    currentColumn--;
                    break;
                }
                case 'right': {
                    currentColumn++;
                    break;
                }
            }
            moves.shift();
            // If more steps are to be taken then restart counter otherwise stop stepping
            stepStartTimestamp = moves.length === 0 ? null : timestamp;
        }
    }

    // Hit test
    if(lanes[currentLane].type === 'car' || lanes[currentLane].type === 'truck') {
        const chickenMinX = chicken.position.x - chickenSize*zoom/2;
        const chickenMaxX = chicken.position.x + chickenSize*zoom/2;
        const vechicleLength = { car: 60, truck: 105}[lanes[currentLane].type]; 
        lanes[currentLane].vechicles.forEach(vechicle => {
            const carMinX = vechicle.position.x - vechicleLength*zoom/2;
            const carMaxX = vechicle.position.x + vechicleLength*zoom/2;
            if(chickenMaxX > carMinX && chickenMinX < carMaxX && window.getComputedStyle(document.getElementById('end_window')).visibility == "hidden") {
		    document.getElementById('end_message').innerHTML = ["uh oh you si liao gg", "can rod liao", "your encik will be proud", "walk also cannot walk properly", "you excuse traffic lights ah", "now you really kena knock it down", "eh yo ord lo"][Math.floor(Math.random() * 10)]
		    document.getElementById('score').innerHTML = String(currentLane-1).replaceAll('0','O');
		    total_gairs = total_gairs +1;
		    document.getElementById('total_gair').innerHTML = String(total_gairs).replaceAll('0','O');
                endDOM.style.visibility = 'visible';
		    accident_time = Date.now();
            }
        });
    
    }
    renderer.render( scene, camera );	
}

requestAnimationFrame( animate );
