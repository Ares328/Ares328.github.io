import WindowManager from './WindowManager.js'

let name
let set = false
const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}


if (new URLSearchParams(window.location.search).get("clear"))
{
	localStorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			init();
		}
	};

	function init ()
	{
		initialized = true;

		// add a short timeout because window.offsetX reports wrong values before a short period 
		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)	
	}

	function setupScene ()
	{
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
		
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.add( camera );

		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true, alpha: true});
		renderer.setPixelRatio(pixR);
	    
	  world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );
	}

	function setupWindowManager ()
	{
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		// here you can add your custom metadata to each windows instance
		let metaData = {foo: "bar"};

		// this will init the windowmanager and add this window to the centralised pool of windows
		windowManager.init(metaData);

		// call update windows initially (it will later be called by the win change callback)
		windowsUpdated();
	}

	function windowsUpdated ()
	{
		updateNumberOfCubes();
	}

  function isEven(n) {
    return n % 2 == 0;
 }

	function updateNumberOfCubes ()
	{
		let wins = windowManager.getWindows();

		// remove all cubes
		cubes.forEach((c) => {
			world.remove(c);
		})

		cubes = [];
		// add new cubes based on the current window setup
		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];
			let c = new t.Color();
			c.setHSL(i * .1, 1.0, .5);

      // Define the number of points for the heart shape
      const numPoints = 100;

      // Define the 2D heart shape for the first half
      const heartShapeFirstHalf = [];
      for (let i = 0; i < numPoints; i++) {
        const t = i / numPoints * Math.PI;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -13 * Math.cos(t) + 5 * Math.cos(2 * t) + 2 * Math.cos(3 * t) + Math.cos(4 * t);
        const z = 0;

        heartShapeFirstHalf.push(new THREE.Vector3(x * 20, y * 20, z * 20));
        heartShapeFirstHalf.push(new THREE.Vector3(x * 21, y * 21, z * 21));
        heartShapeFirstHalf.push(new THREE.Vector3(x * 19, y * 19, z * 19));
        heartShapeFirstHalf.push(new THREE.Vector3(x * 19.5, y * 19.5, z * 19.5));
        heartShapeFirstHalf.push(new THREE.Vector3(x * 20.5, y * 20.5, z * 20.5));
        heartShapeFirstHalf.push(new THREE.Vector3(x * 3, y * 3, z * 3));
      }

      // Mirror the points to create the second half of the heart shape
      const heartShapeSecondHalf = heartShapeFirstHalf.map(point => {
        return new THREE.Vector3(-point.x, point.y, point.z);
      });
      
      let material
      let geometry
      if (isEven(i)) {
        geometry = new t.BufferGeometry().setFromPoints(heartShapeFirstHalf);
        material = new t.PointsMaterial({ color: "#DC143C", size: 0.1 });
      } else {
        geometry = new t.BufferGeometry().setFromPoints(heartShapeSecondHalf);
        material = new t.PointsMaterial({ color: "#8B0000", size: 0.1 });
      }

      if (isEven(wins.length)) {
        if (set === false) {
          name = "(Quinten)"
          document.getElementById("NAME").innerHTML = name
          set = true;
          
        }
      } else {
        if (set === false) {
          name = "(Anastasia)"
          document.getElementById("NAME").innerHTML = name
          set = true;
        }
      }


      let cube = new t.Points(geometry, material);
			cube.position.x = win.shape.x + (win.shape.w * .5);
			cube.position.y = win.shape.y + (win.shape.h * .5);

			world.add(cube);
			cubes.push(cube);
		}
	}

	function updateWindowShape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}


	function render ()
	{
		let t = getTime();

		windowManager.update();


		// calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
		let falloff = .05;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		// set the world position to the offset
		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();


		// loop through all our cubes and update their positions based on current window positions
		for (let i = 0; i < cubes.length; i++)
		{
			let cube = cubes[i];
			let win = wins[i];
			let _t = t;// + i * .2;
      if (cubes[1]) {
        if (Math.trunc(cubes[0].position.x) == Math.trunc(cubes[1]?.position?.x)) {
          var body = document.body;
          document.getElementById("NAME").innerHTML = "(Quintie & Ani)"
          body.classList.add("active");
        } else {
          var body = document.body;
          document.getElementById("NAME").innerHTML = name
          body.classList.remove("active")
        }
      } 

			let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}

			cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
			cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
			//  cube.rotation.x = 3.5;
			cube.rotation.y = _t * .3;
		};

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}


	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}