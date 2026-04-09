"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const surfaceVertexShader = `
uniform float uTime;
uniform vec2 uMouse;

varying vec2 vUv;
varying float vElevation;
varying vec3 vWorldPosition;

float layeredWave(vec2 p, float time) {
  float swell = sin(p.x * 1.05 + time * 0.22);
  float drift = sin(p.y * 0.74 - time * 0.18);
  float ripple = sin(length(p * vec2(1.0, 1.35)) * 2.2 - time * 0.24);
  float cross = sin((p.x + p.y) * 0.42 + time * 0.1);
  return swell * 0.58 + drift * 0.34 + ripple * 0.2 + cross * 0.16;
}

void main() {
  vUv = uv;

  vec3 pos = position;
  vec2 wavePos = position.xy;

  float primary = layeredWave(wavePos * vec2(0.42, 0.56), uTime);
  float secondary = layeredWave((wavePos + vec2(3.6, -2.4)) * vec2(0.2, 0.28), uTime * 0.72);
  float tertiary = layeredWave((wavePos - vec2(2.2, 3.4)) * vec2(0.12, 0.18), uTime * 0.46);
  float pointerLift = exp(-length((uv - uMouse) * vec2(1.8, 4.2))) * 0.18;

  float elevation = primary * 0.9 + secondary * 0.5 + tertiary * 0.3 + pointerLift;
  pos.z += elevation * 1.22;
  pos.x += sin(position.y * 0.12 + uTime * 0.08) * 0.08;

  vElevation = elevation;

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const surfaceFragmentShader = `
uniform vec3 uBaseColor;
uniform vec3 uGlowColor;
uniform vec3 uShadowColor;

varying vec2 vUv;
varying float vElevation;
varying vec3 vWorldPosition;

void main() {
  vec3 dx = dFdx(vWorldPosition);
  vec3 dy = dFdy(vWorldPosition);
  vec3 normal = normalize(cross(dx, dy));
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);

  vec3 lightA = normalize(vec3(-0.32, 0.92, 0.2));
  vec3 lightB = normalize(vec3(0.58, 0.35, 0.74));

  float diffuseA = max(dot(normal, lightA), 0.0);
  float diffuseB = max(dot(normal, lightB), 0.0) * 0.35;
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
  float crest = smoothstep(-0.55, 1.1, vElevation);
  float depthFade = smoothstep(1.0, 0.08, abs(vUv.y - 0.52));

  vec3 color = mix(uShadowColor, uBaseColor, crest * 0.8 + 0.1);
  color += uGlowColor * fresnel * 0.92;
  color += uGlowColor * (diffuseA + diffuseB) * 0.16;
  color += vec3(0.95, 1.0, 0.98) * fresnel * 0.08;

  float alpha = 0.28 + crest * 0.34 + fresnel * 0.24;
  alpha *= 0.8 + depthFade * 0.2;

  gl_FragColor = vec4(color, alpha);
}
`;

const wireFragmentShader = `
uniform vec3 uGlowColor;

varying vec2 vUv;
varying float vElevation;

void main() {
  float crest = smoothstep(-0.45, 0.95, vElevation);
  float fade = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));

  vec3 color = mix(uGlowColor * 0.72, vec3(0.95, 1.0, 0.98), 0.14);
  float alpha = (0.04 + crest * 0.09) * fade;

  gl_FragColor = vec4(color, alpha);
}
`;

export default function PremiumWaveField({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvasHost = canvasHostRef.current;

    if (!container || !canvasHost) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerCurrent = new THREE.Vector2(0, 0);
    const lookAtTarget = new THREE.Vector3(0, -1.2, 0);
    const clock = new THREE.Clock();

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.pointerEvents = "none";
    canvasHost.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#020403", 0.1);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 2.6, 7.6);

    const geometry = new THREE.PlaneGeometry(28, 18, 240, 180);
    const sharedUniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.52, 0.34) },
      uBaseColor: { value: new THREE.Color("#42D293").convertSRGBToLinear() },
      uGlowColor: { value: new THREE.Color("#9CF7D4").convertSRGBToLinear() },
      uShadowColor: { value: new THREE.Color("#06100b").convertSRGBToLinear() },
    };

    const surfaceMaterial = new THREE.ShaderMaterial({
      uniforms: sharedUniforms,
      vertexShader: surfaceVertexShader,
      fragmentShader: surfaceFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const wireMaterial = new THREE.ShaderMaterial({
      uniforms: sharedUniforms,
      vertexShader: surfaceVertexShader,
      fragmentShader: wireFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      wireframe: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const waveSurface = new THREE.Mesh(geometry, surfaceMaterial);
    const waveWire = new THREE.Mesh(geometry, wireMaterial);
    const waveGroup = new THREE.Group();
    waveGroup.add(waveSurface);
    waveGroup.add(waveWire);
    waveGroup.rotation.x = -Math.PI * 0.69;
    waveGroup.position.set(0.2, -1.8, -0.5);
    scene.add(waveGroup);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) {
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onPointerMove = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) {
        return;
      }

      pointerTarget.x = (event.clientX / innerWidth - 0.5) * 2;
      pointerTarget.y = (event.clientY / innerHeight - 0.5) * 2;
    };

    const onPointerLeave = () => {
      pointerTarget.set(0, 0);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    resize();

    let frameId = 0;

    const renderFrame = () => {
      const elapsed = clock.getElapsedTime();
      const time = prefersReducedMotion ? 0 : elapsed;

      pointerCurrent.lerp(pointerTarget, prefersReducedMotion ? 1 : 0.028);
      sharedUniforms.uTime.value = time;
      sharedUniforms.uMouse.value.set(0.52 + pointerCurrent.x * 0.16, 0.34 - pointerCurrent.y * 0.1);

      waveGroup.rotation.z = pointerCurrent.x * 0.1;
      waveGroup.position.x = 0.2 + pointerCurrent.x * 0.45;
      waveGroup.position.y = -1.8 + Math.sin(time * 0.18) * 0.08;

      camera.position.x = pointerCurrent.x * 0.42;
      camera.position.y = 2.6 + pointerCurrent.y * 0.12;
      camera.position.z = 7.6 + Math.cos(time * 0.12) * 0.06;
      camera.lookAt(lookAtTarget);

      renderer.render(scene, camera);

      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);

      geometry.dispose();
      surfaceMaterial.dispose();
      wireMaterial.dispose();
      renderer.dispose();

      if (canvasHost.contains(renderer.domElement)) {
        canvasHost.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #000000 0%, #030705 24%, #070d0a 52%, #0a0a0a 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(66,210,147,0.22) 0%, rgba(66,210,147,0.12) 22%, rgba(66,210,147,0) 48%)",
        }}
      />
      <div
        ref={canvasHostRef}
        className="absolute inset-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.96) 0%, rgba(0,0,0,1) 26%, rgba(0,0,0,0.88) 60%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.96) 0%, rgba(0,0,0,1) 26%, rgba(0,0,0,0.88) 60%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 14%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 30%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.04) 18%, rgba(0,0,0,0.28) 56%, rgba(0,0,0,0.82) 100%)",
        }}
      />
    </div>
  );
}
