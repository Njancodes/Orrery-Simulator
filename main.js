import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { InteractionManager } from 'three.interactive';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';

const planets = [];
const prevAcc = [];
const moons = [];
let planetIndex = -1;
const astronomical_unit_conversion = 35;

class Orbit{
	constructor(semiMajorAxis,orbitalInclination,argumentOfPerigee,eccentricity,ascendingNode){
		this.a = semiMajorAxis;  // Semi-major axis
		this.e = eccentricity;  // Eccentricity
		this.i = THREE.MathUtils.degToRad(orbitalInclination);  // Inclination in radians
		this.omega = THREE.MathUtils.degToRad(argumentOfPerigee);  // Argument of periapsis
		this.Omega = THREE.MathUtils.degToRad(ascendingNode);  // Longitude of ascending node
		this.nu = 0;  // Initial true anomaly
	}
	set setSMA(sma){
		this.a = sma
	}
	set setAN(an){
		this.Omega = an
	}
	set setE(ece){
		this.e = ece
	}
	set setAOP(aop){
		this.omega = aop
	}
	set setOI(oi){
		this.i = oi
	}
	set setTrueAnomaly(n){
		this.nu = n;
	}
	get getTrueAnomaly(){
		return this.nu
	}
	applyOrbitalRotations(position) {
		// Create Euler rotations
		const inclinationRotation = new THREE.Matrix4().makeRotationX(this.i);
		const periapsisRotation = new THREE.Matrix4().makeRotationY(this.omega);
		const ascendingNodeRotation = new THREE.Matrix4().makeRotationY(this.Omega);
		// Apply rotations
		position.applyMatrix4(inclinationRotation);
		position.applyMatrix4(periapsisRotation);
		position.applyMatrix4(ascendingNodeRotation);
		return position;
	}
	
	calculatePosition() {
		const r = (this.a * (1 - this.e ** 2)) / (1 + this.e * Math.cos(this.nu));  // Radial distance
		const xOrbital = r * Math.cos(this.nu);  // x in the orbital plane
		const zOrbital = r * Math.sin(this.nu);  // y in the orbital plane
		return new THREE.Vector3(xOrbital, 0, zOrbital);  // z is zero in the orbital plane
	}
}



class Body{
	constructor(central_object_mesh, mesh, color,segments, pos, acceleration, orbit, name){
		this.name = name;
		this.centre = central_object_mesh;
		this.pos = pos;
		this.mesh = mesh
		this.color = color;
		this.segments = segments
		this.acc = acceleration;
		this.angle = 0;
		this.orbit = orbit
	}
	removeMesh(mesh){
		this.centre.remove(mesh);
	}
	propagate(){
		this.orbit.setTrueAnomaly =  this.orbit.getTrueAnomaly + this.acc;
		let pos = this.orbit.calculatePosition();
		pos = this.orbit.applyOrbitalRotations(pos);
		this.centre.getWorldPosition(this.globalCentrepos);
		this.getPlanetMesh.position.copy(pos);
		this.getPlanetMesh.getWorldPosition(this.globalPlanetpos);
		this.globalHorEndpos.set(this.globalPlanetpos.x, this.globalPlanetpos.y - 19  - this.pos, this.globalPlanetpos.z)
		this.getVerTubeMesh.position.set(pos.x, pos.y - 19  - this.pos, pos.z);
		this.getVerTubeMesh.scale.z = this.globalHorEndpos.distanceTo(this.globalPlanetpos);
		this.getVerTubeMesh.lookAt(this.globalPlanetpos);
		this.getHorTubeMesh.position.set(0,-19 - this.pos,0);
		this.getHorTubeMesh.scale.z = this.globalCentrepos.distanceTo(this.globalPlanetpos);
		this.getHorTubeMesh.lookAt(this.globalHorEndpos);


	}
	set setName(na){
		this.name = na
	}
	set setHorTubeMesh(mesh){
		this.tubeMesh = mesh;
	}
	set setVerTubeMesh(mesh){
		this.VtubeMesh = mesh;
	}
	set setPosition(position){
		this.position = position;
	}
	set setPos(pos){
		this.pos = pos
	}
	get getPosition(){
		return this.position;
	}
	set setPlanetMesh(mesh){
		this.mesh = mesh;
	}
	get getPlanetMesh(){
		return this.mesh;
	}
	set setOrbitalLine(line){
		this.orbitalLine = line;
	}
	get getOrbitalLine(){
		return this.orbitalLine;
	}
	get getHorTubeMesh(){
		return this.tubeMesh;
	}
	get getVerTubeMesh(){
		return this.VtubeMesh;
	}
	set setAcc(ac){
		this.acc  = ac
	}
	get getAcc(){
		return this.acc
	}
	set setColor(col){
		this.color = col
	}
	createMesh(){
		let position = this.orbit.calculatePosition();
		this.setPosition = position
		this.setPosition = this.orbit.applyOrbitalRotations(this.getPosition);

		this.mesh.position.copy(position)
		this.setPlanetMesh = this.mesh;
		this.centre.add(this.getPlanetMesh);
		
		const horStandGeo = new THREE.CylinderGeometry(1, 1, 1).translate(0, 0.5, 0).rotateX(Math.PI * 0.5);
		const horStandMat = new THREE.MeshBasicMaterial({color:this.color});
		const horStand = new THREE.Mesh(horStandGeo, horStandMat);
		const verStand = new THREE.Mesh(horStandGeo, horStandMat);
		verStand.scale.set(0.1,0.1,1);
		horStand.scale.set(0.1, 0.1, 1);
		this.globalCentrepos = new THREE.Vector3();
		this.globalPlanetpos = new THREE.Vector3();
		this.globalHorEndpos = new THREE.Vector3();

		this.centre.getWorldPosition(this.globalCentrepos);
		this.getPlanetMesh.getWorldPosition(this.globalPlanetpos);
		this.globalHorEndpos.set(this.globalPlanetpos.x, this.globalPlanetpos.y - 19 - this.pos, this.globalPlanetpos.z)
		this.centre.add(verStand)
		this.centre.add(horStand)
		horStand.position.set(0,-19 - this.pos,0);
		verStand.position.set(position.x, position.y - 19 - this.pos, position.z);
		horStand.scale.z = this.globalCentrepos.distanceTo(this.globalPlanetpos);
		verStand.scale.z = this.globalHorEndpos.distanceTo(this.globalPlanetpos);
		horStand.lookAt(this.globalPlanetpos.x, this.globalPlanetpos.y - 19 - this.pos, this.globalPlanetpos.z);
		verStand.lookAt(this.globalPlanetpos);
		this.setHorTubeMesh = horStand;
		this.setVerTubeMesh = verStand;

	}
	createOrbit(){
		const points = [];
		console.log("Anotehr Heaven Reached")
		for (let i = 0; i <= this.segments; i++) {
			this.orbit.setTrueAnomaly = (i / this.segments) * 2 * Math.PI;  // True anomaly (from 0 to 2π)
			let position = this.orbit.calculatePosition();
			position = this.orbit.applyOrbitalRotations(position);
			points.push(position);  // Set Y to 0 for XZ plane orbit
		}

		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = new THREE.LineBasicMaterial({color:this.color});
		this.setOrbitalLine = new THREE.Line(geometry, material);
		this.centre.add(this.getOrbitalLine);
	}
}


const gui = new dat.GUI();
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
const canvas = renderer.domElement
document.body.appendChild(canvas);

const scene = new THREE.Scene();
const createScene = new THREE.Scene();
const loadScene = new THREE.Scene();
const scenes = [scene, createScene, loadScene];
let sceneIndex = 0;


const cam = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight, 0.1, 2000);

const interactionManager = new InteractionManager(renderer, cam, canvas);

cam.position.x = -8
cam.position.y = 200
cam.position.z = 28;

//Debug Tools
const controls = new OrbitControls(cam, renderer.domElement);
controls.enableDamping = true; // Smooth the movement
controls.dampingFactor = 0.05;
controls.enableZoom = true; // Enable zooming
controls.autoRotate = true; // Auto-rotate around the scene
controls.autoRotateSpeed = 0.5; // Rotation speed

const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0,0,0);
scene.add(light);
let ambientLight = new THREE.AmbientLight(new THREE.Color('hsl(0, 0%, 100%)'), 0.75);
createScene.add(ambientLight);
// Central Object (size, height of the column, material, mesh)
let curr_center;

const fileInput = document.getElementById('modelInput');
const filePlanetInput = document.getElementById('modelPlanetInput');

// Initialize GLTFLoader (or any other loader)
const loader = new GLTFLoader();

const sunGeo = new THREE.SphereGeometry(10,32,32);
const sunMat = new THREE.MeshBasicMaterial({color:0xffff00});
const sun = new THREE.Mesh(sunGeo, sunMat);
const sun2 = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);
let model = sun2;

// Function to load model when file is selected
fileInput.addEventListener('change', function (event) {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.readAsArrayBuffer(file);
		reader.onload = function (e) {
			const arrayBuffer = e.target.result;

			// Load the GLTF model
			loader.parse(arrayBuffer, '', function (gltf) {
				if (model) createScene.remove(model); // Remove existing model
				interactionManager.add(model)
				interactionManager.remove(newButtonMesh)
				interactionManager.remove(loadButtonMesh)
				model.addEventListener('click',()=>{
					centreFolder.show();
				})
				createScene.remove(sun2);
				model = gltf.scene;
				createScene.add(model);
				return model;
			});
		};
	}
});

filePlanetInput.addEventListener('change',(event)=>{
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		reader.readAsArrayBuffer(file);
		reader.onload = function (e) {
			const arrayBuffer = e.target.result;

			// Load the GLTF model
			loader.parse(arrayBuffer, '', function (gltf) {
				planets[planetIndex].removeMesh(planets[planetIndex].mesh)
				planets[planetIndex].removeMesh(planets[planetIndex].getHorTubeMesh);
				planets[planetIndex].removeMesh(planets[planetIndex].getVerTubeMesh);
				let m = gltf.scene
				planets[planetIndex].setPlanetMesh = m;
				planets[planetIndex].createMesh()
			});
		};
	}
})

// Parameters object to control the column and central object
const guiCenterControls = {
	columnHeight: 30,
	columnColor: '#ffd700',
	loadModel: function () { document.getElementById('modelInput').click();}, // Trigger file input
	addPlanet: function () {
		const mercuryOrbit = new Orbit(.4*astronomical_unit_conversion,7.005,29.124,0.2056,48.331)
		const body = new Body(createScene.children[0],new THREE.Mesh(new THREE.SphereGeometry(3,32,32),new THREE.MeshBasicMaterial({color:0x333333})),0x333333,64,0,0.01,mercuryOrbit,"Sample")
		interactionManager.add(body.getPlanetMesh);
		body.getPlanetMesh.addEventListener("click",()=>{
			console.log("Change the Planet's Parameters")
			centreFolder.hide()
			planetFolder.show()
			planetIndex = planets.indexOf(body);
		})
		body.createMesh()
		body.createOrbit()
		planets.push(body);
	}
};

const guiPlanetControls = {
	name: "Planet",               // Name of the object
	position: 0,                  // Position (value from 0 to 33)
	scale: 1,
	semiMajorAxis: 1.5,           // Semi-major axis (AU or other unit)
	orbitalInclination: 0,        // Orbital inclination (degrees)
	argumentOfPerigee: 0,         // Argument of perigee (degrees)
	eccentricity: 0.0167,         // Eccentricity (unitless)
	ascensionNode: 0,             // Ascension node (degrees)
	columnColor: '#333333',
	radius:1,
	pause: function(){
		if(planets[planetIndex].getAcc !== 0){
			prevAcc[planetIndex] = planets[planetIndex].getAcc
			planets[planetIndex].setAcc = 0
		}else{
			planets[planetIndex].setAcc = prevAcc[planetIndex]
		}
		
	},
	loadModel: function () { document.getElementById('modelPlanetInput').click(); }, // Trigger file input
	addMoon: function () {
		const mercuryOrbit = new Orbit(this.semiMajorAxis*astronomical_unit_conversion,this.orbitalInclination,this.argumentOfPerigee,this.eccentricity,this.ascensionNode)
		const body = new Body(planets[planetIndex].getPlanetMesh,new THREE.Mesh(new THREE.BoxGeometry(1,1,1,32,32,32),new THREE.MeshBasicMaterial({color:0x333333})),0x333333,32,0,0.01,mercuryOrbit,"Sample")
		interactionManager.add(body.getPlanetMesh);
		body.getPlanetMesh.addEventListener("click",()=>{
			console.log("Change the Planet's Parameters")

		})
		body.createMesh()
		body.createOrbit()
		moons.push(body);
	}
};


const centreFolder = gui.addFolder("Centre's Properties");
const planetFolder = gui.addFolder("Planet's Properties");

// Add button to load model
centreFolder.add(guiCenterControls, 'loadModel').name('Change 3D Model');

centreFolder.hide()
planetFolder.hide()
// Column Controls (Height and Color)
centreFolder.add(guiCenterControls, 'columnHeight', 1, 100).name('Column Height').onChange(value => {

	sunSupport.scale.set(1, value / 30, 1); // Scale the height of the column
	sunSupport.position.set(0,-value/2,0);

});
centreFolder.add(guiCenterControls, 'addPlanet').name("Create A Planet");
centreFolder.addColor(guiCenterControls, 'columnColor').name('Column Color').onChange(value => {
	sunSupport.material.color.set(value)
});

planetFolder.add(guiPlanetControls, 'name').name('Name').onChange(value => {
	planets[planetIndex].setName = value
});
planetFolder.add(guiPlanetControls, 'scale',0, 10).name('Scale').onChange(value => {
	planets[planetIndex].getPlanetMesh.scale.set(value,value,value)
});
planetFolder.add(guiPlanetControls, 'position', 0, 33).name('Position').onChange(value => {
	planets[planetIndex].setPos = value
	planets[planetIndex].removeMesh(planets[planetIndex])
	planets[planetIndex].removeMesh(planets[planetIndex].getHorTubeMesh)
	planets[planetIndex].removeMesh(planets[planetIndex].getVerTubeMesh)
	planets[planetIndex].createMesh();
});

// Orbital Parameters
planetFolder.add(guiPlanetControls, 'semiMajorAxis', 0.1, 10).name('Semi-Major Axis').onChange(value =>{
	planets[planetIndex].orbit.setSMA = value*astronomical_unit_conversion;
	planets[planetIndex].removeMesh(planets[planetIndex].getOrbitalLine)
	planets[planetIndex].createOrbit()
});
planetFolder.add(guiPlanetControls, 'orbitalInclination', 0, 360).name('Orbital Inclination').onChange(value =>{
	planets[planetIndex].orbit.setOI = value;
	planets[planetIndex].removeMesh(planets[planetIndex].getOrbitalLine)
	planets[planetIndex].createOrbit()
});
planetFolder.add(guiPlanetControls, 'argumentOfPerigee', 0, 360).name('Argument of Perigee').onChange(value =>{
	planets[planetIndex].orbit.setAOP = value;
	planets[planetIndex].removeMesh(planets[planetIndex].getOrbitalLine)
	planets[planetIndex].createOrbit()
});
planetFolder.add(guiPlanetControls, 'eccentricity', 0, 1).name('Eccentricity').onChange(value =>{
	planets[planetIndex].orbit.setE = value;
	planets[planetIndex].removeMesh(planets[planetIndex].getOrbitalLine)
	planets[planetIndex].createOrbit()
});
planetFolder.add(guiPlanetControls, 'ascensionNode', 0, 360).name('Ascension Node').onChange(value =>{
	planets[planetIndex].orbit.setAN = value;
	planets[planetIndex].removeMesh(planets[planetIndex].getOrbitalLine)
	planets[planetIndex].createOrbit()
});

// Column Controls (Height and Color)
planetFolder.addColor(guiPlanetControls, 'columnColor').name('Column Color').onChange(value => {
	planets[planetIndex].setColor = value
	planets[planetIndex].getPlanetMesh.material.color.set(value)
	planets[planetIndex].removeMesh(planets[planetIndex].getPlanetMesh);
	planets[planetIndex].removeMesh(planets[planetIndex].getHorTubeMesh);
	planets[planetIndex].removeMesh(planets[planetIndex].getVerTubeMesh);
	planets[planetIndex].removeMesh(planets[planetIndex].getOrbitalLine);
	planets[planetIndex].createMesh()
	planets[planetIndex].createOrbit()
});

// Add control for loading a model for the central object
planetFolder.add(guiPlanetControls, 'loadModel').name('Load Planet Object');
planetFolder.add(guiPlanetControls, 'pause').name('Pause Movement');


const sunSupportGeo = new THREE.CylinderGeometry(.5,.5,30,32,32);
const sunSupportMat = new THREE.MeshBasicMaterial({color:0xffd700});
const sunSupport = new THREE.Mesh(sunSupportGeo, sunSupportMat);
sunSupport.position.set(0,-15,0);
scene.add(sunSupport);

const fontLoader = new FontLoader();


const newButtonGeo = new THREE.BoxGeometry(30,20,10,32,32,32);
const newButtonMat = new THREE.MeshBasicMaterial({color:0x555555});
const newButtonMesh = new THREE.Mesh(newButtonGeo, newButtonMat)
newButtonMesh.rotateX(Math.PI/2)
const newButtonOrbit = new Orbit(1.5*astronomical_unit_conversion,7.005,29.124,0,48.331)
const newButton = new Body(sun,newButtonMesh,0x555555,32,0,0.01,newButtonOrbit,"NewButton");
newButton.createMesh();
newButton.createOrbit()

const loadButtonGeo = new THREE.BoxGeometry(30,20,10,32,32,32);
const loadButtonMat = new THREE.MeshBasicMaterial({color:0x555555});
const loadButtonMesh = new THREE.Mesh(loadButtonGeo, loadButtonMat)
loadButtonMesh.rotateX(Math.PI/2)
const loadButtonOrbit = new Orbit(3*astronomical_unit_conversion,10,29.124,0,48.331)
const loadButton = new Body(sun,loadButtonMesh,0x555555,32,1,-0.005,loadButtonOrbit,"LoadButton");
loadButton.createMesh();
loadButton.createOrbit()




fontLoader.load('./fonts/League Spartan_Regular.json', function(font){
	const createText = new TextGeometry( "Create\n Orrery", {

		font: font,
		size: 5,
		depth: 5,
		curveSegments: 32,
		bevelThickness: 2,
		bevelSize: 2,
		bevelEnabled: false

	} );
	const loadText = new TextGeometry( "Load\n Orrery", {

		font: font,

		size: 5,
		depth: 5,
		curveSegments: 32,

		bevelThickness: 2,
		bevelSize: 2,
		bevelEnabled: false

	} );

	createText.computeBoundingBox();
	loadText.computeBoundingBox();

	const centerOffsetC = - 0.5 * ( createText.boundingBox.max.x - createText.boundingBox.min.x );
	const centerOffsetL = - 0.5 * ( loadText.boundingBox.max.x - loadText.boundingBox.min.x );

	const createTextMesh = new THREE.Mesh( createText, new THREE.MeshBasicMaterial({color:0xffffff}) );
	const loadTextMesh = new THREE.Mesh( loadText, new THREE.MeshBasicMaterial({color:0xffffff}) );



	newButtonMesh.add(createTextMesh);
	loadButtonMesh.add(loadTextMesh);

	createTextMesh.position.x = centerOffsetC;
	createTextMesh.position.y = -4;
	createTextMesh.position.z = -1;
	createTextMesh.rotateX(Math.PI)
	loadTextMesh.position.x = centerOffsetL;
	loadTextMesh.position.y = -4;
	loadTextMesh.position.z = -1;
	loadTextMesh.rotateX(Math.PI)
	
})


newButtonMesh.addEventListener('click',(event)=>{
	console.log("Create")
	sceneIndex = 1
	console.log("Hi")
	createScene.add(light)
	createScene.add(sun2);
	interactionManager.add(sun2)
	sun2.addEventListener('click',()=>{
		centreFolder.show();
	})
	createScene.add(sunSupport);
})
loadButtonMesh.addEventListener('click',(event)=>{
	console.log("Load")
	sceneIndex = 2
})
interactionManager.add(newButtonMesh);
interactionManager.add(loadButtonMesh);



//Instantiate the planets
// const mercuryOrbit = new Orbit(.4*astronomical_unit_conversion,7.005,29.124,0.2056,48.331)
// const mercury = new Body(sun,0.3, 0,  0x555555, 32, 0.005, mercuryOrbit, "Mercury");
// planets.push(mercury);

// const venusOrbit = new Orbit(.7*astronomical_unit_conversion, 3.394, 54.884, 0.0067, 76.680);
// const venus = new Body(sun, 2.5, 1, 0xaaaa00, 32, 0.073, venusOrbit, "Venus");
// planets.push(venus)

// const earthOrbit = new Orbit(astronomical_unit_conversion, 0.00, 114.2, 0.0167, 348.74)
// const earth = new Body(sun, 2.6,2,0x0000ff, 32, 0.001, earthOrbit, "Earth");
// planets.push(earth);

// const marsOrbit = new Orbit(1.5*astronomical_unit_conversion, 1.85, 286.5, 0.0934, 49.56);
// const mars = new Body(sun, 1.4, 3, 0xff0000, 32, 0.050, marsOrbit, "Mars");
// planets.push(mars);

// const jupiterOrbit = new Orbit(5.2*astronomical_unit_conversion, 2.31, 273.9, 0.0489, 100.45);
// const jupiter = new Body(sun, 4,4, 0xd2b48c, 32, 0.027, jupiterOrbit, "Jupiter");
// planets.push(jupiter);

// const saturnOrbit = new Orbit(9.5*astronomical_unit_conversion, 2.49, 339.4, 0.0565, 113.71);
// const saturn = new Body(sun, 3.5, 5, 0x444400, 32, 0.020,saturnOrbit, "Saturn");
// planets.push(saturn);

// const uranusOrbit = new Orbit(19.1*astronomical_unit_conversion, 0.77, 96.9, 0.0463, 74.02)
// const uranus = new Body(sun, 2, 6, 0xeeffee, 32, 0.014, uranusOrbit, "Uranus");
// planets.push(uranus);

// const neptuneOrbit = new Orbit(30*astronomical_unit_conversion, 1.77, 253.0, 0.0097, 131.72)
// const neptune = new Body(sun, 2.6,7, 0x33ff33, 32, 0.011, neptuneOrbit, "Neptune");
// planets.push(neptune)

// const plutoOrbit = new Orbit(39*astronomical_unit_conversion, 17.14, 113.74, 0.248, 110.30)
// const pluto = new Body(sun, 0.5, 8, 0x666666, 32,0.010, plutoOrbit, "Pluto");
// planets.push(pluto);

function animate(){
	requestAnimationFrame(animate);
	newButton.propagate()
	loadButton.propagate()
	interactionManager.update();
	planets.forEach((planet)=>{
		planet.propagate()
	})
	//console.log(cam.position)
	controls.update();
	renderer.render(scenes[sceneIndex], cam);
}

animate();