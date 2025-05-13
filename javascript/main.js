document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed.");

    //make the global variable
    let size; // Luis feedback - Global variable for plane size

    if (typeof THREE === 'undefined') {
        console.error("Three.js library not loaded (DOMContentLoaded check). Ensure script tag is correct and integrity hash (if used) is valid.");
        return;
    } else {
        console.log("Three.js library found. Revision:", THREE.REVISION);

        const imageContainer = document.getElementById("bannerContainer");
        const imageElement = document.getElementById("bannerImage");

        if (imageContainer && imageElement) {
            console.log("Found #bannerContainer:", imageContainer);
            console.log("Found #bannerImage:", imageElement);
            console.log("Image source:", imageElement.src);

            let easeFactor = 0.02;
            let scene, camera, renderer, planeMesh;
            let mousePosition = { x: 0.5, y: 0.5 };
            let targetMousePosition = { x: 0.5, y: 0.5 };
            let aberrationIntensity = 0.0;
            let prevPosition = { x: 0.5, y: 0.5 };
            let animationRunning = false;

            const vertexShader = `
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `;

            const fragmentShader = `
                varying vec2 vUv;
                uniform sampler2D u_texture;
                uniform vec2 u_mouse;
                uniform vec2 u_prevMouse;
                uniform float u_aberrationIntensity;

                void main() {
                    vec2 gridUV = floor(vUv * vec2(20.0, 20.0)) / vec2(20.0, 20.0);
                    vec2 centerOfPixel = gridUV + vec2(1.0/20.0, 1.0/20.0);

                    vec2 mouseDirection = u_mouse - u_prevMouse;
                    vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
                    float pixelDistanceToMouse = length(pixelToMouseDirection);
                    float strength = smoothstep(0.3, 0.0, pixelDistanceToMouse);

                    vec2 uvOffset = strength * - mouseDirection * 10.0;
                    vec2 uv = vUv - uvOffset;

                    vec4 colorR = texture2D(u_texture, uv + vec2(strength * u_aberrationIntensity * 0.25, 0.0));
                    vec4 colorG = texture2D(u_texture, uv);
                    vec4 colorB = texture2D(u_texture, uv - vec2(strength * u_aberrationIntensity * 0.25, 0.0));

                    gl_FragColor = vec4(colorR.r, colorG.g, colorB.b, 1.0);
                }
            `;

            function getPlaneSizeAtZ(depth, camera) { // Teacher's Feedback: Moved function here
                const vFOV = THREE.MathUtils.degToRad(camera.fov); // vertical fov in radians
                const height = 2 * Math.tan(vFOV / 2) * depth;
                const width = height * camera.aspect;
                return { width, height };
            }

            function initializeScene(texture) {
                // console.log("Initializing scene...");
                scene = new THREE.Scene();

                const aspectRatio = imageContainer.offsetWidth / imageContainer.offsetHeight;
                camera = new THREE.PerspectiveCamera(80, aspectRatio, 0.01, 10);
                camera.position.z = 1;

                //add this as a global variable to be use below
                size = getPlaneSizeAtZ(camera.position.z, camera); // Teacher's Feedback

                let shaderUniforms = {
                    u_mouse: { type: "v2", value: new THREE.Vector2(0.5, 0.5) },
                    u_prevMouse: { type: "v2", value: new THREE.Vector2(0.5, 0.5) },
                    u_aberrationIntensity: { type: "f", value: 0.0 },
                    u_texture: { type: "t", value: texture }
                };

                planeMesh = new THREE.Mesh(
                    //change the PlaneGeometry arguments to size.width, size.height
                    new THREE.PlaneGeometry(size.width, size.height), // Teacher's Feedback
                    new THREE.ShaderMaterial({
                        uniforms: shaderUniforms,
                        vertexShader,
                        fragmentShader
                    })
                );

                scene.add(planeMesh);

                try {
                    renderer = new THREE.WebGLRenderer({ alpha: true });
                    renderer.setSize(imageContainer.offsetWidth, imageContainer.offsetHeight);
                    imageContainer.appendChild(renderer.domElement);
                    imageElement.style.display = 'none';
                } catch (error) {
                    console.error("Error creating WebGL Renderer:", error);
                    imageContainer.innerHTML = "<p style='color: black; background: white; text-align: center; padding: 20px;'>WebGL failed to initialize. Please ensure your browser supports WebGL and it is enabled.</p>";
                    renderer = null;
                }

                handleResize();
                window.addEventListener('resize', handleResize);
            }

            function handleResize() {


                if (!renderer || !camera) return;
                const width = imageContainer.offsetWidth;
                const height = imageContainer.offsetHeight;

                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();

                size = getPlaneSizeAtZ(camera.position.z, camera); // Teacher's Feedback
                //force the planeMesh to rezise
                if (planeMesh && planeMesh.geometry) { 
                    if (planeMesh.geometry.parameters.width !== size.width || planeMesh.geometry.parameters.height !== size.height) {
                        planeMesh.geometry.dispose(); // Dispose of the old geometry
                        planeMesh.geometry = new THREE.PlaneGeometry(size.width, size.height);
                    }

                }
                // console.log("Resized renderer and camera to:", width, height);
            }

            let frameCount = 0;

            function animateScene() {
                if (!renderer || !planeMesh || !planeMesh.material) {
                    if (frameCount % 120 === 0) {
                        console.warn("Animation stopped: Renderer or PlaneMesh not available.");
                    }
                    frameCount++;
                    return;
                }

                if (frameCount % 60 === 0) {
                    // console.log(`Animating... Frame: ${frameCount}, Mouse: (${mousePosition.x.toFixed(2)}, ${mousePosition.y.toFixed(2)}), Target: (${targetMousePosition.x.toFixed(2)}, ${targetMousePosition.y.toFixed(2)}), Aberration: ${aberrationIntensity.toFixed(2)}`);
                }

                animationRunning = true;
                requestAnimationFrame(animateScene);

                mousePosition.x += (targetMousePosition.x - mousePosition.x) * easeFactor;
                mousePosition.y += (targetMousePosition.y - mousePosition.y) * easeFactor;

                planeMesh.material.uniforms.u_mouse.value.set(mousePosition.x, 1.0 - mousePosition.y);
                planeMesh.material.uniforms.u_prevMouse.value.set(prevPosition.x, 1.0 - prevPosition.y);

                aberrationIntensity = Math.max(0.0, aberrationIntensity - 0.05);
                planeMesh.material.uniforms.u_aberrationIntensity.value = aberrationIntensity;

                try {
                    renderer.render(scene, camera);
                } catch (renderError) {
                    console.error("Error during renderer.render():", renderError);
                }

                prevPosition = { ...mousePosition };
                frameCount++;
            }

            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
                imageElement.src,
                (loadedTexture) => {
                    // console.log("Texture loaded successfully.");
                    initializeScene(loadedTexture);
                    if (renderer && !animationRunning) {
                        animateScene();
                    }
                },
                undefined,
                (error) => {
                    console.error("Error loading texture for distortion effect:", error);
                    imageContainer.innerHTML = "<p style='color: black; background: white; text-align: center; padding: 20px;'>Error loading the banner image for the effect.</p>";
                }
            );

            imageContainer.addEventListener("mousemove", handleMouseMove);
            imageContainer.addEventListener("mouseenter", handleMouseEnter);
            imageContainer.addEventListener("mouseleave", handleMouseLeave);

            function handleMouseMove(event) {
                let rect = imageContainer.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    targetMousePosition.x = (event.clientX - rect.left) / rect.width;
                    targetMousePosition.y = (event.clientY - rect.top) / rect.height;
                    aberrationIntensity = 1;
                    easeFactor = 0.02;
                } else {
                    console.warn("Mouse Move ignored - banner container has zero width or height.");
                }
            }

            function handleMouseEnter(event) {
                let rect = imageContainer.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    mousePosition.x = targetMousePosition.x = (event.clientX - rect.left) / rect.width;
                    mousePosition.y = targetMousePosition.y = (event.clientY - rect.top) / rect.height;
                    prevPosition = { ...mousePosition };
                    easeFactor = 0.02;
                } else {
                    console.warn("Mouse Enter ignored - banner container has zero width or height.");
                }
            }

            function handleMouseLeave() {
                // console.log("Mouse Leave");
            }
        } else {
            console.warn("Image container or image element not found. Skipping Three.js initialisation.");
        }
    }
});