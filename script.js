// Three.js - WebXR - Basic w/background and GLTF loader
// from https://threejs.org/examples/webxr_vr_dragging

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

    const fov = 50;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 10000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 1.6, 0);
    const params = (new URL(document.location)).searchParams;
    const allowvr = params.get('allowvr') === 'true';
    if (allowvr) {
        renderer.xr.enabled = true;
        document.body.appendChild(VRButton.createButton(renderer));
        document.querySelector('#vr').style.display = 'none';
    }

    const scene = new THREE.Scene();
    {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            'https://threejs.org/manual/examples/resources/images/grid-1024.png',
            'https://threejs.org/manual/examples/resources/images/grid-1024.png',
            'https://threejs.org/manual/examples/resources/images/grid-1024.png',
            'https://threejs.org/manual/examples/resources/images/grid-1024.png',
            'https://threejs.org/manual/examples/resources/images/grid-1024.png',
            'https://threejs.org/manual/examples/resources/images/grid-1024.png',
        ]);
        scene.background = texture;
    }

    {
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    const loader = new GLTFLoader();
    loader.load('recentred_scene.glb', function (gltf) {
        // Center the model
        const bbox = new THREE.Box3().setFromObject(gltf.scene);
        const center = bbox.getCenter(new THREE.Vector3());
        console.log(center);
        const offset = new THREE.Vector3(0, -2, 5);
        center.add(offset);
        gltf.scene.position.sub(center);
        console.log(center);
        const model = gltf.scene;
        scene.add(model);
        console.log(model.position);

        // Variables for joystick rotation
        let isDragging = false;
        let previousMousePosition = {
            x: 0,
            y: 0
        };

        // Event listeners for joystick rotation
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mousemove', onMouseMove);

        function onMouseDown(event) {
            isDragging = true;
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }

        function onMouseUp() {
            isDragging = false;
        }

        function onMouseMove(event) {
            if (isDragging) {
                const deltaMove = {
                    x: event.clientX - previousMousePosition.x,
                    y: event.clientY - previousMousePosition.y
                };

                const deltaRotationQuaternion = new THREE.Quaternion()
                    .setFromEuler(new THREE.Euler(
                        toRadians(deltaMove.y * 1),
                        toRadians(deltaMove.x * 1),
                        0,
                        'XYZ'
                    ));

                model.quaternion.multiplyQuaternions(deltaRotationQuaternion, model.quaternion);

                previousMousePosition = {
                    x: event.clientX,
                    y: event.clientY
                };
            }
        }

        function toRadians(angle) {
            return angle * (Math.PI / 180);
        }
    });

    let initialPosition; // Initial position of the user
    let angleThreshold = Math.PI / 4; // Angle threshold to switch to 2D image

    // Event listener for VR user movement
    renderer.xr.addEventListener('sessionstart', onSessionStart);

    function onSessionStart() {
        initialPosition = renderer.xr.getCamera(camera).position.clone();
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        const userPosition = renderer.xr.getCamera(camera).position.clone();
        const angle = Math.abs(userPosition.angleTo(initialPosition));

        // Check if the user has crossed the angle threshold
        if (angle > angleThreshold) {
            model.visible = false; // Hide the 3D model
            // Display the 2D image or perform any necessary actions
            // You can use CSS to show the image or create a separate DOM element for it
            // For example:
            const imageElement = document.querySelector('#image');
            if (imageElement) {
                imageElement.style.display = 'block'; // Show the 2D image
            } else {
                const imageSrc = 'path_to_your_image.jpg'; // Provide the path to your 2D image
                const img = document.createElement('img');
                img.src = imageSrc;
                img.id = 'image';
                img.style.display = 'block';
                document.body.appendChild(img); // Append the image to the body or a specific container
            }
        } else {
            model.visible = true; // Show the 3D model
            // Hide the 2D image or perform any necessary actions
            // For example:
            const imageElement = document.querySelector('#image');
            if (imageElement) {
                imageElement.style.display = 'none'; // Hide the 2D image
            }
        }

        renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(render);
}

main();
