import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

const planets = [];
class Planet{
	constructor(radius, orbitalRadius,pos, color,segments, acceleration){
		this.radius = radius;
		this.oradius = orbitalRadius;
		this.color = color;
		this.pos = pos
		this.segments = segments;
		this.acc = acceleration;
		this.angle = 0;
	}
	orbit(){
		if(this.getMesh){
			this.mesh.rotation.y += this.acc;
		}
	}
	set setMesh(mesh){
		this.mesh = mesh
	}
	get getMesh(){
		return this.mesh;
	}
	createMesh(){
		const curve = new THREE.CatmullRomCurve3(
			[new THREE.Vector3(this.oradius, 0 ,0),
			new THREE.Vector3(this.oradius - 0.5,(-13 + -2 * this.pos) - 1,0),
			new THREE.Vector3(0, (-13 + -2 * this.pos), 0),],
			false,
			"catmullrom",
			0.1
		)
		//Create a tube along the points (or the curve mentioned above)
		const tgeometry = new THREE.TubeGeometry( curve, 30, .3, 10, false );
		const tmaterial = new THREE.MeshBasicMaterial( { color: this.color } );
		const tmesh = new THREE.Mesh( tgeometry, tmaterial );
		const geometry = new THREE.SphereGeometry(this.radius, this.segments, this.segments);
		const material = new THREE.MeshBasicMaterial({color:this.color});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.copy(new THREE.Vector3(this.oradius, 0 ,0))
		tmesh.add(mesh);
		this.setMesh = tmesh;
		return this.getMesh;
	}
	createOrbit(){
		const points = [];

		// Generate points for the orbit (based on a circular path)
		for (let i = 0; i <= this.segments; i++) {
			const theta = (i / this.segments) * Math.PI * 2; // Angle in radians
			const x = this.oradius * Math.cos(theta); // X position
			const z = this.oradius * Math.sin(theta); // Z position (Y = 0 for a flat orbit)
			points.push(new THREE.Vector3(x, 0, z)); // Push the points into the array
		}

		// Create geometry from points
		const geometry = new THREE.BufferGeometry().setFromPoints(points);

		// Create a material for the orbit line
		const material = new THREE.LineBasicMaterial({ color: 0xffffff });

		// Create a line object using geometry and material
		const orbitLine = new THREE.Line(geometry, material);

		return orbitLine;
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

const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0,0,0);
scene.add(light);

//Sun
const sunGeo = new THREE.SphereGeometry(10,32,32);
const sunMat = new THREE.MeshBasicMaterial({color:0xffff00});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

const sunSupportGeo = new THREE.CylinderGeometry(1,1,30,32,32);
const sunSupportMat = new THREE.MeshBasicMaterial({color:0xffd700});
const sunSupport = new THREE.Mesh(sunSupportGeo, sunSupportMat);
sunSupport.position.set(0,-15,0);
scene.add(sunSupport);

//Instantiate the planets
const mercury = new Planet(1, 15, 0,  0x555555, 32, 0.1);
planets.push(mercury);

const venus = new Planet(2, 25,1, 0xaaaa00, 32, 0.01);
planets.push(venus)

const earth = new Planet(2, 35,2,0x0000ff, 32, 0.02);
planets.push(earth);

const mars = new Planet(2.5, 45,3, 0xff0000, 32, 0.04);
planets.push(mars);

const jupiter = new Planet(3.5, 65,3, 0xd2b48c, 32, 0.01);
planets.push(jupiter);


function init(){
	for(let i = 0; i < planets.length; i++){
		planets[i].createMesh();
		scene.add(planets[i].createMesh());
		scene.add(planets[i].createOrbit());
	}
}
function animate(){
	requestAnimationFrame(animate);
	
	for(let i = 0; i < planets.length; i++){
		planets[i].orbit();
	}
	controls.update();
	renderer.render(scene, cam);
}
init();
animate();


