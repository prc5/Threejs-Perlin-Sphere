var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);

var renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth - 25, window.innerHeight - 20);

renderer.gammaInput = true;
renderer.gammaOutput = true;

renderer.render(scene, camera);

scene.background = new THREE.Color(0x555555);

document.body.appendChild(renderer.domElement);

// Controll
camera.position.z = 10; // Camera position

var xElements = 100;
var yElements = 100;
var scale = 5;
var zoom = 6;
var seed = 0.015;
var t = 0;
var fps = 30;

// Shape's geometries
var envMap = new THREE.TextureLoader().load('bck.png');
envMap.mapping = THREE.SphericalReflectionMapping;

var geometry = new THREE.SphereGeometry(1, xElements, yElements);
var material = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 1,
    metalness: 0.7,
    //envMap: envMap
})

var roughnessMap = new THREE.TextureLoader().load('roughnessMap.png');
roughnessMap.magFilter = THREE.LinearFilter;
material.roughnessMap = roughnessMap;

roughnessMap.magFilter = THREE.NearestFilter;
material.roughnessMap = roughnessMap;

var sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

//sphere.rotation.x = -0.05

// Lights
var light = new THREE.PointLight(0xffffff, 1, 1000);
light.position.set(50, 50, 50);
scene.add(light);

// Max function
function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

// Perlin noise
//var simplex = new SimplexNoise();
var xoff = 0;
var yoff = 0;
var zoff = 0;
var geo;
var direction;
var way;
var newPos;
var perlinMap;
var startPos = new THREE.Vector3(0, 0, 0);

function perlinNoise() {
    var index = 0;
    for (var g = 0; g < Math.sqrt(geometry.vertices.length); g++) {
        xoff = t;
        for (var f = 0; f < Math.sqrt(geometry.vertices.length); f++) {
            if (index < geometry.vertices.length) {
                geo = new THREE.Vector3(geometry.vertices[index].x, geometry.vertices[index].y, geometry.vertices[index].z);
                direction = new THREE.Vector3();
                way = direction.subVectors(geo, startPos).normalize();
                newPos = new THREE.Vector3();
                perlinMap = map_range(noise(xoff, yoff, zoff), 0, 1, -scale, scale);
                newPos.addVectors(startPos, way.multiplyScalar(zoom + perlinMap / 3));
                geometry.vertices[index] = newPos;
            }
            xoff += seed;
            index += 1;
        }
        yoff += seed;
        zoff += seed / 4;
    }
}


// Postprocessing	
var bloomStrength = 0.8;
var bloomRadius = 0.2;
var bloomThreshold = 0.3;

var composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));

//var vignette = new THREE.ShaderPass(THREE.VignetteShader);
//vignette.uniforms['darkness'].value = 0.1;
//composer.addPass(vignette);

var effectFilm = new THREE.FilmPass(0.45, 0.025, 648, false);
composer.addPass(effectFilm);

var copyShader = new THREE.ShaderPass(THREE.CopyShader);
copyShader.renderToScreen = true;


var bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomStrength, bloomRadius, bloomThreshold);

composer.setSize(window.innerWidth, window.innerHeight);

composer.addPass(bloomPass);
composer.addPass(copyShader);

// Animate 
var now;
var then = Date.now();
var interval = 1000 / fps;
var delta;


function animate() {
    requestAnimationFrame(animate);
    now = Date.now();
    delta = now - then;
    if (delta > interval) {
        then = now - (delta % interval);
        perlinNoise();
        geometry.dynamic = true;
        geometry.verticesNeedUpdate = true; 
        geometry.elementsNeedUpdate = true; 
        geometry.dispose(); 
        t += 0.003;
        zoff = t;
        yoff = t;
        composer.render();
    }
}

animate();
