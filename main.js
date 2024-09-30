import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'


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
		const zOrbital = r * Math.sin(this.nu);  // y in the orbital plane
		return new THREE.Vector3(xOrbital, 0, zOrbital);  // z is zero in the orbital plane
	}
}



class Body{
	constructor(central_object_mesh, radius,pos, color, segments, acceleration, orbit, name){
		this.name = name;
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
		this.orbit.setTrueAnomaly =  this.orbit.getTrueAnomaly + this.acc;
		let pos = this.orbit.calculatePosition();
		pos = this.orbit.applyOrbitalRotations(pos);
		this.centre.getWorldPosition(this.globalCentrepos);
		this.getPlanetMesh.position.copy(pos);
		this.getPlanetMesh.getWorldPosition(this.globalPlanetpos);
		this.globalHorEndpos.set(this.globalPlanetpos.x, this.globalPlanetpos.y - 19, this.globalPlanetpos.z)
		this.getVerTubeMesh.position.set(pos.x, pos.y - 19, pos.z);
		this.getVerTubeMesh.scale.z = this.globalHorEndpos.distanceTo(this.globalPlanetpos);
		this.getVerTubeMesh.lookAt(this.globalPlanetpos);
		this.getHorTubeMesh.position.set(0,-19,0);
		this.getHorTubeMesh.scale.z = this.globalCentrepos.distanceTo(this.globalPlanetpos);
		this.getHorTubeMesh.lookAt(this.globalHorEndpos);


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
	get getPosition(){
		return this.position;
	}
	set setPlanetMesh(mesh){
		this.planetMesh = mesh;
	}
	get getPlanetMesh(){
		return this.planetMesh;
	}
	get getHorTubeMesh(){
		return this.tubeMesh;
	}
	get getVerTubeMesh(){
		return this.VtubeMesh;
	}
	createMesh(){
		let position = this.orbit.calculatePosition();
		this.setPosition = position
		this.setPosition = this.orbit.applyOrbitalRotations(this.getPosition);
		// const strtPos = new THREE.Vector3(position.x, position.y - height/2 - this.radius, position.z);
		// const curve = new THREE.CatmullRomCurve3(
		// 	[strtPos,
		// 	new THREE.Vector3(position.x,(position.y - height/2 - this.radius) - 3,position.z),
		// 	new THREE.Vector3(position.x + 5,(position.y - height/2 - this.radius) - 3,position.z),],
		// 	false,
		// 	"catmullrom",
		// 	0.1
		// )


		const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
		const material = new THREE.MeshBasicMaterial({color:this.color});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(position)
		this.setPlanetMesh = mesh;
		console.log(`The position of the calculated of the ${this.name}: X: ${position.x} Y: ${position.y} Z: ${position.z}`);
		console.log(`The positions of ${this.name}: X: ${mesh.position.x} Y: ${mesh.position.y} Z: ${mesh.position.z}`);
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
		this.globalHorEndpos.set(this.globalPlanetpos.x, this.globalPlanetpos.y - 19, this.globalPlanetpos.z)
		this.centre.add(verStand)
		this.centre.add(horStand)
		horStand.position.set(0,-19,0);
		verStand.position.set(position.x, position.y - 19, position.z);
		horStand.scale.z = this.globalCentrepos.distanceTo(this.globalPlanetpos);
		verStand.scale.z = this.globalHorEndpos.distanceTo(this.globalPlanetpos);
		horStand.lookAt(this.globalPlanetpos.x, this.globalPlanetpos.y - 19, this.globalPlanetpos.z);
		verStand.lookAt(this.globalPlanetpos);
		this.setHorTubeMesh = horStand;
		this.setVerTubeMesh = verStand;

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
const sunGeo = new THREE.SphereGeometry(10,32,32);
const sunMat = new THREE.MeshBasicMaterial({color:0xffff00});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

const sunSupportGeo = new THREE.CylinderGeometry(.5,.5,30,32,32);
const sunSupportMat = new THREE.MeshBasicMaterial({color:0xffd700});
const sunSupport = new THREE.Mesh(sunSupportGeo, sunSupportMat);
sunSupport.position.set(0,-15,0);
scene.add(sunSupport);

//Instantiate the planets
const mercuryOrbit = new Orbit(40,7.005,29.124,0.2056,48.331)
const mercury = new Body(sun,0.3, 0,  0x555555, 32, 0.005, mercuryOrbit, "Mercury");
planets.push(mercury);

const venusOrbit = new Orbit(60, 3.394, 54.884, 0.0067, 76.680);
const venus = new Body(sun, 2.5, 1, 0xaaaa00, 32, 0.073, venusOrbit, "Venus");
planets.push(venus)

const earthOrbit = new Orbit(80, 0.00, 114.2, 0.0167, 348.74)
const earth = new Body(sun, 2.6,2,0x0000ff, 32, 0.001, earthOrbit, "Earth");
planets.push(earth);

const marsOrbit = new Orbit(100, 1.85, 286.5, 0.0934, 49.56);
const mars = new Body(sun, 1.4, 3, 0xff0000, 32, 0.050, marsOrbit, "Mars");
planets.push(mars);

const jupiterOrbit = new Orbit(150, 2.31, 273.9, 0.0489, 100.45);
const jupiter = new Body(sun, 4,4, 0xd2b48c, 32, 0.027, jupiterOrbit, "Jupiter");
planets.push(jupiter);

const saturnOrbit = new Orbit(200, 2.49, 339.4, 0.0565, 113.71);
const saturn = new Body(sun, 3.5, 5, 0x444400, 32, 0.020,saturnOrbit, "Saturn");
planets.push(saturn);

const uranusOrbit = new Orbit(220, 0.77, 96.9, 0.0463, 74.02)
const uranus = new Body(sun, 2, 6, 0xeeffee, 32, 0.014, uranusOrbit, "Uranus");
planets.push(uranus);

const neptuneOrbit = new Orbit(240, 1.77, 253.0, 0.0097, 131.72)
const neptune = new Body(sun, 2.6,7, 0x33ff33, 32, 0.011, neptuneOrbit, "Neptune");
planets.push(neptune)

const plutoOrbit = new Orbit(250, 17.14, 113.74, 0.248, 110.30)
const pluto = new Body(sun, 0.5, 8, 0x666666, 32,0.010, plutoOrbit, "Pluto");
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
const moon = new Body(earth.getPlanetMesh, 2, 0, 0x333333,32,0.1, moonOrbit, "Moon");
moons.push(moon);
initMoons()

animate();


