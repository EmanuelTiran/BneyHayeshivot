/* eslint-disable react/no-unknown-property -- React Three Fiber JSX uses Three.js properties. */
import { Component, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const clamp = THREE.MathUtils.clamp;
const MODEL_HEIGHT = 2.16;
const PITCH_LIMIT = 0.24;
const MODEL_URL = import.meta.env.BASE_URL + 'models/crown.glb';

function disposeModel(model) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), images = new Set();
  model.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
  });
  materials.forEach(material => {
    Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
    material.dispose();
  });
  geometries.forEach(geometry => geometry.dispose());
  textures.forEach(texture => { if (texture.image?.close) images.add(texture.image); texture.dispose(); });
  images.forEach(bitmap => bitmap.close());
}

function CrownScene({ interaction, reducedMotion, visible }) {
  const root = useRef();
  const time = useRef(0);
  const projection = useRef(new THREE.Matrix4());
  const [loadError, setLoadError] = useState(null);
  const { gl, scene, camera, size, invalidate } = useThree();
  useEffect(() => {
    camera.fov = window.innerWidth <= 640 ? 36 : 34;
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, invalidate]);

  useEffect(() => {
    const parent = root.current;
    let cancelled = false, model;
    new GLTFLoader().load(MODEL_URL, gltf => {
      if (cancelled) { disposeModel(gltf.scene); return; }
      try {
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const height = bounds.getSize(new THREE.Vector3()).y;
        if (!Number.isFinite(height) || height <= 0) throw new Error('Invalid crown model bounds');
        gltf.scene.position.sub(bounds.getCenter(new THREE.Vector3()));
        model = new THREE.Group(); model.scale.setScalar(MODEL_HEIGHT / height);
        model.add(gltf.scene); parent.add(model); invalidate();
      } catch (error) { disposeModel(gltf.scene); setLoadError(error); }
    }, undefined, error => { if (!cancelled) setLoadError(error); });
    // A late response is disposed; aborting a shared request can break StrictMode's second mount.
    return () => { cancelled = true; if (model) { parent.remove(model); disposeModel(model); } };
  }, [invalidate]);

  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl), studio = new THREE.Scene();
    studio.background = new THREE.Color('#303845');
    [
      { position: [-3, 4, 4], size: [4, 5], color: '#fff1cd', intensity: 3.3 },
      { position: [4, 2, 1], size: [2, 4], color: '#c5d3ff', intensity: 1.6 },
      { position: [0, 5, 0], size: [4, 4], color: '#fff8e8', intensity: 3 },
      { position: [1, 3, -4], size: [3, 4], color: '#fff1c9', intensity: 3 },
      { position: [-3, -1, 2], size: [2, 0.6], color: '#ffd37b', intensity: 1.3 },
    ].forEach(({ position, size: panelSize, color, intensity }) => {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(...panelSize), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
      panel.position.set(...position); panel.lookAt(0, 0.9, 0); studio.add(panel);
    });
    const environment = generator.fromScene(studio, 0.04);
    scene.environment = environment.texture;
    studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    generator.dispose(); invalidate();
    return () => { scene.environment = null; environment.dispose(); };
  }, [gl, scene, invalidate]);

  useEffect(() => {
    invalidate();
    if (!visible || reducedMotion) return;
    const timer = window.setInterval(() => { if (!document.hidden) invalidate(); }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [visible, reducedMotion, invalidate]);

  useFrame((state, delta) => {
    if (!visible) return;
    const input = interaction.current, dt = Math.min(delta, 0.05);
    if (!reducedMotion) time.current += dt;
    if (!input.dragging && !reducedMotion) {
      input.yaw += input.velocity * dt + (input.hovered ? 0.13 * dt : 0);
      const nextTilt = input.tilt + input.tiltVelocity * dt;
      input.tilt = clamp(nextTilt, -PITCH_LIMIT, PITCH_LIMIT);
      input.velocity *= Math.exp(-7 * dt);
      input.tiltVelocity = nextTilt === input.tilt ? input.tiltVelocity * Math.exp(-7 * dt) : 0;
    }
    const yaw = input.yaw + (reducedMotion ? 0 : input.pointerX * 0.035);
    const tilt = clamp(input.tilt + (reducedMotion ? 0 : input.pointerY * 0.025), -PITCH_LIMIT, PITCH_LIMIT);
    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-9 * dt);
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, yaw, smoothing);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, tilt, smoothing);
    // Keep the projected base above the card while rotating about the model's center.
    const pitch = root.current.rotation.x, bottom = -MODEL_HEIGHT / 2, radius = MODEL_HEIGHT * 0.48;
    const e = projection.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).elements;
    const foot = window.innerWidth <= 640 ? -0.78 : -0.82;
    let offset = -Infinity;
    for (const side of [-1, 1]) {
      const y = bottom * Math.cos(pitch) - side * radius * Math.sin(pitch);
      const z = bottom * Math.sin(pitch) + side * radius * Math.cos(pitch);
      offset = Math.max(offset, (foot * (e[7] * y + e[11] * z + e[15]) - (e[5] * y + e[9] * z + e[13])) / (e[5] - foot * e[7]));
    }
    root.current.position.y = offset + (reducedMotion ? 0 : 0.014 * (1 + Math.sin(time.current * 0.8)));
  });
  if (loadError) throw loadError;
  return <>
    <ambientLight intensity={0.18} />
    <directionalLight position={[-3, 4, 5]} color="#ffe3a3" intensity={2.1} />
    <directionalLight position={[4, 2, 2]} color="#9db8ff" intensity={0.7} />
    <directionalLight position={[1, 3, -4]} color="#fff1c9" intensity={1.6} />
    <pointLight position={[-1, -0.25, 1.8]} color="#ffc857" intensity={0.75} decay={2} />
    <group ref={root} rotation={[0.025, -0.18, 0]} />
  </>;
}

class CrownBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="crown-fallback" aria-hidden="true">♛</div> : this.props.children; }
}

export default function Crown3D() {
  const stage = useRef(), capture = useRef();
  const interaction = useRef({ yaw: -0.18, tilt: 0.025, velocity: 0, tiltVelocity: 0, pointerX: 0, pointerY: 0, hovered: false, dragging: false, id: null });
  const wake = useRef(() => {});
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(true);
  const resetDrag = () => {
    const input = interaction.current, id = input.id;
    Object.assign(input, { dragging: false, id: null, velocity: 0, tiltVelocity: 0 });
    if (id !== null && capture.current?.hasPointerCapture(id)) capture.current.releasePointerCapture(id);
    const canvas = stage.current?.querySelector('canvas');
    if (canvas) canvas.style.cursor = 'grab';
    capture.current = null; wake.current();
  };
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReducedMotion(query.matches); interaction.current.velocity = 0; interaction.current.tiltVelocity = 0; };
    query.addEventListener('change', change);
    const hero = stage.current.closest('.home-hero');
    const move = event => {
      if (event.pointerType === 'touch' || interaction.current.dragging) return;
      const bounds = hero.getBoundingClientRect();
      interaction.current.pointerX = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
      interaction.current.pointerY = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
      wake.current();
    };
    const leave = () => { interaction.current.pointerX = 0; interaction.current.pointerY = 0; wake.current(); };
    const cancel = () => {
      const input = interaction.current, id = input.id;
      Object.assign(input, { dragging: false, id: null, velocity: 0, tiltVelocity: 0, hovered: false });
      if (id !== null && capture.current?.hasPointerCapture(id)) capture.current.releasePointerCapture(id);
      capture.current = null;
      const canvas = stage.current?.querySelector('canvas');
      if (canvas) canvas.style.cursor = 'grab';
      wake.current();
    };
    window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', cancel);
    hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerleave', leave);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(stage.current);
    return () => {
      query.removeEventListener('change', change);
      hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', cancel);
      observer.disconnect();
    };
  }, []);

  return <div ref={stage} className="crown-stage" role="img" aria-label="כתר מלכותי מוזהב עם אבני ספיר ופנינים"
    onPointerEnter={event => { if (event.pointerType !== 'touch') { interaction.current.hovered = true; wake.current(); } }}
    onPointerLeave={() => { interaction.current.hovered = false; wake.current(); }}
    onPointerDown={event => {
      const input = interaction.current;
      if (event.button !== 0 || input.dragging || event.target.tagName !== 'CANVAS') return;
      event.stopPropagation(); if (event.pointerType !== 'touch') event.preventDefault();
      Object.assign(input, { dragging: true, id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), velocity: 0, tiltVelocity: 0 });
      capture.current = event.target; event.target.setPointerCapture(event.pointerId);
      event.target.style.cursor = 'grabbing'; wake.current();
    }}
    onPointerMove={event => {
      const input = interaction.current;
      if (!input.dragging || input.id !== event.pointerId) return;
      event.stopPropagation();
      const now = performance.now(), elapsed = Math.max((now - input.time) / 1000, 0.008);
      const dx = event.clientX - input.x, dy = event.pointerType === 'touch' ? 0 : event.clientY - input.y;
      input.yaw += dx * 0.009; input.tilt = clamp(input.tilt + dy * 0.002, -PITCH_LIMIT, PITCH_LIMIT);
      input.velocity = reducedMotion ? 0 : clamp(dx * 0.009 / elapsed, -2, 2);
      input.tiltVelocity = reducedMotion ? 0 : clamp(dy * 0.002 / elapsed, -0.6, 0.6);
      input.x = event.clientX; input.y = event.clientY; input.time = now; wake.current();
    }}
    onPointerUp={event => {
      const input = interaction.current;
      if (input.id !== event.pointerId) return;
      const bounds = capture.current.getBoundingClientRect();
      input.hovered = event.pointerType !== 'touch' && event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      input.dragging = false; input.id = null;
      if (performance.now() - input.time > 100 || reducedMotion) { input.velocity = 0; input.tiltVelocity = 0; }
      if (capture.current.hasPointerCapture(event.pointerId)) capture.current.releasePointerCapture(event.pointerId);
      capture.current.style.cursor = 'grab'; capture.current = null; wake.current();
    }}
    onPointerCancel={resetDrag}
    onLostPointerCapture={event => { if (interaction.current.id === event.pointerId) resetDrag(); }}>
    <span className="crown-wide-halo hidden" aria-hidden="true" />
    <span className="crown-load-sweep hidden" aria-hidden="true" />
    <CrownBoundary>
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1.18, 5.2], fov: 34 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={<div className="crown-fallback" aria-hidden="true">♛</div>}
        onCreated={({ camera, invalidate, gl }) => {
          camera.lookAt(0, 0.95, 0); camera.updateMatrixWorld();
          gl.setClearColor(0x000000, 0); gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.1;
          if ('transmissionResolutionScale' in gl) gl.transmissionResolutionScale = 0.5;
          wake.current = invalidate;
        }}>
        <CrownScene interaction={interaction} reducedMotion={reducedMotion} visible={visible} />
      </Canvas>
    </CrownBoundary>
  </div>;
}
