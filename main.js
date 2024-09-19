import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

const planets = [];
const moons = [];

class Orbit{
	constructor(semiMajorAxis,orbitalInclination,argumentOfPerigee,eccentricity,ascendingNode){
		this.a = semiMajorAxis;  // Semi-major axis
		this.e = eccentricity;  // Eccentricity
		this.i = THREE.MathUtils.degToRad(orbitalInclination);  // Inclination in radians
		this.omega = THREE.MathUtils.degToRad(argumentOfPerigee);  // Argument of periapsis
		this.Omega = THREE.MathUtils.degToRad(ascendingNode);  // Longitude of ascending node
		this.nu = 0;  // Initial true anomaly
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
		const yOrbital = r * Math.sin(this.nu);  // y in the orbital plane
		return new THREE.Vector3(xOrbital, 0, yOrbital);  // z is zero in the orbital plane
	}
}

class Body{
	constructor(central_object_mesh, radius,pos, color, segments, acceleration, orbit){
		this.centre = central_object_mesh;
		this.radius = radius;
		this.color = color;
		this.pos = pos;
		this.segments = segments;
		this.acc = acceleration;
		this.angle = 0;
		this.orbit = orbit
	}
	propagate(){
		this.orbit.setTrueAnomaly =  this.orbit.getTrueAnomaly + 0.01;
		let position = this.orbit.calculatePosition();
		position = this.orbit.applyOrbitalRotations(position);
		this.getPlanetMesh.position.copy(position);
	}
	set setTubeMesh(mesh){
		this.tubeMesh = mesh;
	}
	set setPlanetMesh(mesh){
		this.planetMesh = mesh;
	}
	get getPlanetMesh(){
		return this.planetMesh;
	}
	get getTubeMesh(){
		return this.tubeMesh;
	}
	createMesh(){
		// const curve = new THREE.CatmullRomCurve3(
		// 	[new THREE.Vector3(this.oradius, this.height ,0),
		// 	new THREE.Vector3(this.oradius,(-13 + -2 * this.pos),0),
		// 	new THREE.Vector3(0, (-13 + -2 * this.pos), 0),],
		// 	false,
		// 	"catmullrom",
		// 	0.1
		// )
		// //Create a tube along the points (or the curve mentioned above)
		// const tgeometry = new THREE.TubeGeometry( curve, 30, .2, 10, false );
		// const tmaterial = new THREE.MeshBasicMaterial( { color: this.color } );
		// const tmesh = new THREE.Mesh( tgeometry, tmaterial );
		const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
		const material = new THREE.MeshBasicMaterial({color:this.color});
		const mesh = new THREE.Mesh(geometry, material);
		this.setPlanetMesh = mesh;
		this.centre.add(this.getPlanetMesh);
	}
	createOrbit(){
		const points = [];
    
		for (let i = 0; i <= this.segments; i++) {
			this.orbit.setTrueAnomaly = (i / this.segments) * 2 * Math.PI;  // True anomaly (from 0 to 2π)
			let position = this.orbit.calculatePosition();
			position = this.orbit.applyOrbitalRotations(position);
			points.push(position);  // Set Y to 0 for XZ plane orbit
		}
		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const material = new THREE.LineBasicMaterial({color:this.color});
		const orbitalLine = new THREE.Line(geometry, material);
		this.centre.add(orbitalLine);
	}
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
const canvas = renderer.domElement
document.body.appendChild(canvas);

const scene = new THREE.Scene();

const cam = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight, 0.1, 1000);

cam.position.z = 30;

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

//Sun
const sunGeo = new THREE.SphereGeometry(20,32,32);
const sunMat = new THREE.MeshBasicMaterial({color:0xffff00});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

const sunSupportGeo = new THREE.CylinderGeometry(1,1,30,32,32);
const sunSupportMat = new THREE.MeshBasicMaterial({color:0xffd700});
const sunSupport = new THREE.Mesh(sunSupportGeo, sunSupportMat);
sunSupport.position.set(0,-15,0);
scene.add(sunSupport);

//Instantiate the planets
const mercuryOrbit = new Orbit(40,7.005,29.124,0.2056,48.331)
const mercury = new Body(sun,1, 0,  0x555555, 32, 0.1, mercuryOrbit);
planets.push(mercury);

const venusOrbit = new Orbit(60, 3.394, 54.884, 0.0067, 76.680);
const venus = new Body(sun, 2.5, 1, 0xaaaa00, 32, 0.073, venusOrbit);
planets.push(venus)

const earthOrbit = new Orbit(80, 0.00, 114.2, 0.0167, 348.74)
const earth = new Body(sun, 2.6,2,0x0000ff, 32, 0.062, earthOrbit);
planets.push(earth);

const marsOrbit = new Orbit(100, 1.85, 286.5, 0.0934, 49.56);
const mars = new Body(sun, 1.4, 3, 0xff0000, 32, 0.050, marsOrbit);
planets.push(mars);

const jupiterOrbit = new Orbit(150, 2.31, 273.9, 0.0489, 100.45);
const jupiter = new Body(sun, 28,4, 0xd2b48c, 32, 0.027, jupiterOrbit);
planets.push(jupiter);

const saturnOrbit = new Orbit(200, 2.49, 339.4, 0.0565, 113.71);
const saturn = new Body(sun, 23, 5, 0x444400, 32, 0.020,saturnOrbit);
planets.push(saturn);

const uranusOrbit = new Orbit(220, 0.77, 96.9, 0.0463, 74.02)
const uranus = new Body(sun, 10, 6, 0xeeffee, 32, 0.014, uranusOrbit);
planets.push(uranus);

const neptuneOrbit = new Orbit(240, 1.77, 253.0, 0.0097, 131.72)
const neptune = new Body(sun, 10,7, 0x33ff33, 32, 0.011, neptuneOrbit);
planets.push(neptune)

const plutoOrbit = new Orbit(250, 17.14, 113.74, 0.248, 110.30)
const pluto = new Body(sun, 0.5, 8, 0x666666, 32,0.010, plutoOrbit);
planets.push(pluto);


function initPlanets(){
	for(let i = 0; i < planets.length; i++){
		planets[i].createMesh();
		planets[i].createOrbit();
	}

}

function initMoons(){
	for(let i = 0; i < moons.length; i++){
		moons[i].createMesh();
		moons[i].createOrbit();
	}
}

function animate(){
	requestAnimationFrame(animate);
	for(let i = 0; i < planets.length; i++){
		planets[i].propagate();
	}
	for(let i = 0; i < moons.length; i++){
		moons[i].propagate();
	}
	controls.update();
	renderer.render(scene, cam);
}
initPlanets();
const moonOrbit = new Orbit(10, 5.15, 134.9, 0.0549, 125.08)
const moon = new Body(earth.getPlanetMesh, 2, 0, 0x333333,32,0.0021, moonOrbit);
moons.push(moon);
moon.createOrbit()
initMoons()

animate();


