import * as THREE from "https://cdn.skypack.dev/three@0.141.0";

let score = 0;
const scoreDisplay=document.getElementById("score")
const gameOverDisplay=document.getElementById("game-over")

const updateScore=()=>{
  scoreDisplay.innerText=`score : ${score}`;
}
const showGameOver=()=>{
  gamerOverDisplay.style.display="block"


}

const createWorld = (target) => {
  const renderer = new THREE.WebGLRenderer();
  document.querySelector(target).appendChild(renderer.domElement);
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  
  const light = new THREE.PointLight(0xffffff, 1, 0);
  scene.add(light);
  
  const setCanvasSize = () => 
  {
    camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  }
  setCanvasSize();
  window.onresize = setCanvasSize;

  return {renderer, scene, camera, light}
}

const {renderer, scene, camera, light} = createWorld("#demo");

const createCube = (color = 0xffffff) => {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshPhongMaterial({color});
  
  return new THREE.Mesh(geometry, material);
}

const Direction = {
  LEFT: new THREE.Vector3(-1, 0, 0),
  RIGHT: new THREE.Vector3(1, 0, 0),
  UP: new THREE.Vector3(0, 1, 0),
  DOWN: new THREE.Vector3(0, -1, 0),
};

const DirectionMap = {
  "ArrowLeft": Direction.LEFT,
  "ArrowRight": Direction.RIGHT,
  "ArrowUp": Direction.UP,
  "ArrowDown": Direction.DOWN,
}

const DirectionOpposites = {
  "ArrowLeft": Direction.RIGHT,
  "ArrowRight": Direction.LEFT,
  "ArrowUp": Direction.DOWN,
  "ArrowDown": Direction.UP,
}

const createSnake = (parts) => {
  const meshes = [];
  
  parts.forEach(part => {
    const mesh = createCube();
    mesh.position.copy(part);
    meshes.push(mesh);
    scene.add(mesh);
  });
  
  const grow = () => {
    const mesh = createCube();
    mesh.position.copy(meshes[meshes.length - 1].position);
    meshes.push(mesh);
    scene.add(mesh);
  }
  
  return {
    meshes,
    nextDirection: Direction.RIGHT,
    direction: Direction.RIGHT,
    grow
  }
}

const createMap = (size) => {
  const geometry = new THREE.PlaneGeometry(size.x, size.y);
  const material = new THREE.MeshBasicMaterial({color: 0x222222});
  const plane = new THREE.Mesh(geometry, material);
  plane.position.x = size.x / 2;
  plane.position.y = size.y / 2;
  plane.position.z = -0.5;
  scene.add(plane);
  
  const top = createCube(0xff6666);
  const bottom = createCube(0xff6666);
  top.scale.x = bottom.scale.x = size.x;
  top.scale.z = bottom.scale.z = 1.5;
  top.position.x = bottom.position.x = size.x / 2;
  top.position.y = -0.5;
  bottom.position.y = size.y + 0.5;
  scene.add(top);
  scene.add(bottom);
  
  const left = createCube(0xff6666);
  const right = createCube(0xff6666);
  left.scale.z = right.scale.z = 1.5;
  left.scale.y = right.scale.y = size.y + 2;
  left.position.y = right.position.y = size.y / 2;
  right.position.x = -0.5;
  left.position.x = size.x + 0.5;
  scene.add(left);
  scene.add(right);
}

const worldSize = new THREE.Vector3(40, 26, 0);
const snakes = [];
let gameSpeed = 300;
let lastMovement = 0;
let isGameOver = false;

createMap(worldSize);

const snakeParts = Array.from({length: 4}).map((_, index) => new THREE.Vector3(10 - index, worldSize.y / 2, 0));
const player = createSnake(snakeParts);
snakes.push(player);

const positionHelper = new THREE.Vector3();
const createRandomPoint = () => {
  positionHelper.x = Math.floor(Math.random() * worldSize.x);
  positionHelper.y = Math.floor(Math.random() * worldSize.y);
  
  return positionHelper;
}

const isBlockerPoint = (point) => {
  const hasCollision = snakes.some((snake) => 
    snake.meshes.some(({position}) =>
      point != position && position.x === point.x && position.y === point.y
    )
  );
  return hasCollision;
}

const getRandomAvailablePoint = () => {
  let maxCount = 100;
  while (isBlockerPoint(positionHelper) || maxCount-- > 0)
  {
    createRandomPoint();
  }
  return positionHelper;
}

const item = createCube(0xffff66);
scene.add(item);
item.position.copy(getRandomAvailablePoint());

window.onkeydown = (e) => 
{
  if (DirectionMap[e.key])
    if (DirectionOpposites[e.key] != player.direction)
      player.nextDirection = DirectionMap[e.key];
}

camera.position.set(worldSize.x / 2, -10, 50);
camera.lookAt(worldSize.x / 2, worldSize.y / 2, 0);
light.position.copy(camera.position);

renderer.render(scene, camera);

let startTime;
let previousTimeStamp = 0;

const step = (timestamp) => {
  if (isGameOver) return;
  
  if (!startTime)
  {
    startTime = lastMovement = timestamp;
  }
  if (!timestamp) timestamp = 0;
  const elapsed = timestamp - startTime;
  const delta = (timestamp - previousTimeStamp) / 1000
  
  if (timestamp - lastMovement >= gameSpeed)
  {
    lastMovement += timestamp - lastMovement;
    snakes.forEach((snake) => {
      const {meshes, nextDirection} = snake;
      for (let i = meshes.length - 1; i > 0; i--)
        meshes[i].position.copy(meshes[i - 1].position);
      meshes[0].position.add(nextDirection);
      snake.direction = nextDirection;
    })
    
    const playerHeadPosition = player.meshes[0].position;
    // se detecta 
    if (item.position.x === playerHeadPosition.x && item.position.y === playerHeadPosition.y)
    {
      item.position.copy(getRandomAvailablePoint());
      player.grow();
      gameSpeed = Math.max(150, gameSpeed - 25);
      score++;
      updateScore()
    }
    
//Dectecta colison

    if (
      [worldSize.x, 0].includes(playerHeadPosition.x)
      || [worldSize.y, 0].includes(playerHeadPosition.y)
      || isBlockerPoint(playerHeadPosition)
    ) {
      isGameOver = true;
      showGameOver();
    }
  }
  
  renderer.render(scene, camera);
  previousTimeStamp = timestamp;
  window.requestAnimationFrame(step);
}

step();


let scoreText;
let scoreValueText;

// Crear el texto del score
const createScoreText = () => {
  const loader = new THREE.FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new THREE.TextGeometry('Score:', {
      font: font,
      size: 1,
      height: 0.1,
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    scoreText = new THREE.Mesh(textGeometry, textMaterial);
    scoreText.position.set(1, worldSize.y - 2, 0);
    scene.add(scoreText);

    // Texto para el valor numérico del score
    const valueGeometry = new THREE.TextGeometry(score.toString(), {
      font: font,
      size: 1,
      height: 0.1,
    });
    scoreValueText = new THREE.Mesh(valueGeometry, textMaterial);
    scoreValueText.position.set(7, worldSize.y - 2, 0);
    scene.add(scoreValueText);
  });
};