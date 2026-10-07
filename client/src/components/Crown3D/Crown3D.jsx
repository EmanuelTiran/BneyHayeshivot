/* eslint-disable react/no-unknown-property -- React Three Fiber JSX uses Three.js properties. */
import { Component, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;

// Bake ornament transforms and merge by material: four draw calls for the crown.
function createCrown() {
  const parts = { gold: [], velvet: [], sapphire: [], pearl: [] };
  const add = (geometry, material, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) => {
    if (material !== 'velvet') geometry.deleteAttribute('uv');
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
      new THREE.Vector3(...scale),
    );
    geometry.applyMatrix4(matrix);
    parts[material].push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
  };
  const bead = (position, size = 0.035, material = 'pearl') =>
    add(new THREE.SphereGeometry(size, 8, 6), material, position);
  const tube = (points, radius = 0.025) => add(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 28, radius, 6, false), 'gold',
  );
  const ring = (radius, thickness, y) => add(new THREE.TorusGeometry(radius, thickness, 10, 96), 'gold', [0, y, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  const local = (x, y, z, angle) => [x * Math.cos(angle) + z * Math.sin(angle), y, -x * Math.sin(angle) + z * Math.cos(angle)];

  // Broad dark-enamel band with substantial rolled gold mouldings.
  add(new THREE.CylinderGeometry(1.03, 1.03, 0.34, 96, 1, true), 'velvet', [0, 0.21, 0]);
  [0.025, 0.395].forEach(y => ring(1.03, 0.065, y));
  [0.095, 0.33].forEach(y => {
    ring(1.042, 0.014, y);
    for (let i = 0; i < 80; i++) bead(local(0, y, 1.065, i * TAU / 80), 0.018);
  });

  // Low velvet shoulders and gathered folds, rather than a tall smooth cone.
  const cap = new THREE.SphereGeometry(1, 64, 32, 0, TAU, 0, Math.PI / 2);
  const vertices = cap.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i);
    const y = vertices.getY(i);
    const angle = Math.atan2(x, z);
    const radius = 0.94 * Math.pow(Math.max(0, 1 - y * y), 0.36);
    const fold = 1 + 0.045 * Math.cos(angle * 12) * Math.sin(y * Math.PI);
    vertices.setXYZ(i, Math.sin(angle) * radius * fold, y * 0.84 + 0.41, Math.cos(angle) * radius * fold);
  }
  cap.computeVertexNormals();
  add(cap, 'velvet');

  // Oval brilliant-cut stones: table, crown, girdle and pavilion facets.
  const gemPositions = [], gemColors = [];
  const gemRings = [[0, 0.5], [0.43, 0.5], [0.82, 0.28], [1, 0], [0.72, -0.3], [0, -0.6]];
  const gemPoint = (ringIndex, sector) => {
    const [r, z] = gemRings[ringIndex];
    const a = sector * TAU / 12;
    return [r * Math.cos(a), r * Math.sin(a), z];
  };
  const facet = (a, b, c, shade) => {
    gemPositions.push(...a, ...b, ...c);
    for (let k = 0; k < 3; k++) gemColors.push(shade * 0.7, shade * 0.85, shade);
  };
  for (let r = 0; r < gemRings.length - 1; r++) {
    for (let j = 0; j < 12; j++) {
      const shade = 0.48 + ((j * 7 + r * 3) % 11) * 0.075;
      if (r === 0) facet(gemPoint(r, j), gemPoint(r + 1, j), gemPoint(r + 1, j + 1), 0.95);
      else if (r === gemRings.length - 2) facet(gemPoint(r, j), gemPoint(r + 1, j), gemPoint(r, j + 1), shade);
      else {
        facet(gemPoint(r, j), gemPoint(r + 1, j), gemPoint(r + 1, j + 1), shade);
        facet(gemPoint(r, j), gemPoint(r + 1, j + 1), gemPoint(r, j + 1), shade * 0.85);
      }
    }
  }
  const gem = new THREE.BufferGeometry();
  gem.setAttribute('position', new THREE.Float32BufferAttribute(gemPositions, 3));
  gem.setAttribute('color', new THREE.Float32BufferAttribute(gemColors, 3));
  gem.computeVertexNormals();
  const jewel = (angle, y, radius, size) => {
    const position = local(0, y, radius, angle);
    add(new THREE.SphereGeometry(1, 16, 12), 'gold', position, [size * 0.92, size * 1.3, size * 0.3], [0, angle, 0]);
    add(new THREE.TorusGeometry(size, 0.023, 8, 32), 'gold', local(0, y, radius + 0.04, angle), [0.79, 1.14, 1], [0, angle, 0]);
    add(gem.clone(), 'sapphire', local(0, y, radius + 0.07, angle), [size * 0.73, size * 1.08, size * 0.55], [0, angle, 0]);
    for (let j = 0; j < 18; j++) {
      const a = j * TAU / 18;
      bead(local(Math.sin(a) * size * 0.93, y + Math.cos(a) * size * 1.3, radius + 0.065, angle), size * 0.105);
      bead(local(Math.sin(a) * size * 1.04, y + Math.cos(a) * size * 1.44, radius + 0.018, angle), size * 0.08, 'gold');
    }
  };

  // Raised fleur-de-lis leaves, with curved side lobes and engraved stems.
  const leaf = new THREE.Shape();
  leaf.moveTo(0, 0);
  leaf.bezierCurveTo(-0.055, 0.12, -0.15, 0.2, -0.07, 0.31);
  leaf.quadraticCurveTo(-0.025, 0.36, 0, 0.46);
  leaf.quadraticCurveTo(0.025, 0.36, 0.07, 0.31);
  leaf.bezierCurveTo(0.15, 0.2, 0.055, 0.12, 0, 0);
  const curl = new THREE.Shape();
  curl.moveTo(0, 0);
  curl.bezierCurveTo(0.1, 0.1, 0.08, 0.3, 0.27, 0.28);
  curl.bezierCurveTo(0.42, 0.26, 0.38, 0.07, 0.24, 0.075);
  curl.bezierCurveTo(0.18, 0.075, 0.17, 0.13, 0.22, 0.15);
  curl.bezierCurveTo(0.28, 0.11, 0.31, 0.2, 0.25, 0.215);
  curl.bezierCurveTo(0.13, 0.23, 0.16, 0.04, 0, 0);
  const relief = shape => new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.02, bevelThickness: 0.022, curveSegments: 12 });
  const fleur = (angle, y, radius, size = 1) => {
    add(new THREE.ExtrudeGeometry(leaf, { depth: 0.045, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.018, bevelThickness: 0.018, curveSegments: 12 }), 'gold', local(0, y, radius, angle), [size, size, size], [0, angle, 0]);
    [-1, 1].forEach(side => {
      add(relief(curl), 'gold', local(0, y, radius + 0.025, angle), [side * size * 0.85, size * 0.95, size], [0, angle, 0]);
      tube([[0, 0, 0], [side * 0.09, 0.19, 0], [side * 0.23, 0.23, 0], [side * 0.22, 0.13, 0], [side * 0.13, 0.14, 0]].map(([x, dy, z]) => local(x * size, y + dy * size, radius + z + 0.04, angle)), 0.033 * size);
    });
    tube([[0, y + 0.02, radius + 0.063], [0, y + size * 0.23, radius + 0.08], [0, y + size * 0.4, radius + 0.06]].map(([x, dy, z]) => local(x, dy, z, angle)), 0.012 * size);
    bead(local(0, y + 0.025, radius + 0.075, angle), 0.037 * size, 'gold');
  };

  for (let i = 0; i < 12; i++) {
    const angle = i * TAU / 12;
    if (i % 2 === 0) jewel(angle, 0.215, 1.061, 0.125);
    else {
      for (let j = 0; j < 6; j++) {
        const a = j * TAU / 6;
        add(new THREE.SphereGeometry(0.055, 10, 8), 'gold', local(Math.sin(a) * 0.075, 0.215 + Math.cos(a) * 0.075, 1.06, angle), [0.7, 1.25, 0.45], [0, angle, -a]);
      }
      bead(local(0, 0.215, 1.11, angle), 0.043);
    }
    fleur(angle, i % 2 === 0 ? 0.79 : 0.48, 1.025, i % 2 === 0 ? 0.85 : 0.67);
    // Scalloped gold gallery between the fleur-de-lis points.
    const scallop = [];
    for (let j = 0; j <= 20; j++) {
      const t = j / 20;
      scallop.push(local(0, 0.61 - 0.16 * Math.sin(t * Math.PI), 1.025, angle + t * TAU / 12));
    }
    tube(scallop, 0.045);
    tube(scallop.map(([x, y, z]) => [x * 1.025, y - 0.037, z * 1.025]), 0.016);
    if (i % 2 === 0) {
      jewel(angle, 0.71, 1.09, 0.205);
      // Acanthus wreaths surround the larger stones and fill the open gallery.
      for (let j = 0; j < 4; j++) {
        [-1, 1].forEach(side => {
          add(relief(leaf), 'gold', local(side * (0.18 + j * 0.009), 0.45 + j * 0.12, 1.06, angle), [0.45, 0.45, 0.6], [0, angle, side * (-0.85 + j * 0.15)]);
        });
      }
    }
    const between = angle + TAU / 24;
    bead(local(0, 0.215, 1.085, between), 0.035);
    [-1, 1].forEach(side => add(relief(leaf), 'gold', local(side * 0.055, 0.215, 1.057, between), [0.32, 0.32, 0.5], [0, between, side * -Math.PI / 2]));
  }

  // Six broad, elliptical arch ribbons; raised edges and pearls define their profile.
  for (let i = 0; i < 6; i++) {
    const angle = i * TAU / 6;
    const path = t => [0, 0.53 + 0.88 * Math.sin(t * Math.PI / 2), 1.075 * Math.cos(t * Math.PI / 2)];
    const ribbon = [], indices = [];
    for (let j = 0; j <= 40; j++) {
      const [x, y, z] = path(j / 40);
      ribbon.push(...local(x - 0.12, y, z, angle), ...local(x + 0.12, y, z, angle));
      if (j < 40) { const k = j * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(ribbon, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    add(geometry, 'gold');
    [-0.12, -0.095, 0.095, 0.12].forEach(x => tube(Array.from({ length: 25 }, (_, j) => {
      const [, y, z] = path(j / 24); return local(x, y, z, angle);
    }), Math.abs(x) === 0.12 ? 0.023 : 0.009));
    for (let j = 0; j < 16; j++) {
      const [, y, z] = path(j / 16);
      bead(local(0, y + 0.027, z + 0.026, angle), 0.037);
      bead(local(0, y + 0.017, z + 0.012, angle), 0.048, 'gold');
    }
  }
  ring(0.14, 0.035, 1.41);
  fleur(0, 1.43, 0, 1.24);
  fleur(Math.PI, 1.43, 0, 1.24);
  jewel(0, 1.55, 0.095, 0.09);
  jewel(Math.PI, 1.55, 0.095, 0.09);
  bead([0, 1.76, 0.08], 0.047);
  bead([0, 1.76, -0.08], 0.047);
  [-1, 1].forEach(side => {
    for (let j = 0; j < 8; j++) {
      const t = j / 7 * Math.PI;
      bead([side * (0.13 + Math.sin(t) * 0.2), 1.64 + Math.cos(t) * 0.12, 0.045], 0.021);
    }
  });
  gem.dispose();

  // Seeded woven microtexture, generated locally; no image assets are fetched.
  const weave = new Uint8Array(128 * 128);
  let seed = 17;
  for (let i = 0; i < weave.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    weave[i] = 95 + (seed >>> 25) + (i % 2 ? 20 : 0);
  }
  const velvetBump = new THREE.DataTexture(weave, 128, 128, THREE.RedFormat);
  velvetBump.wrapS = velvetBump.wrapT = THREE.RepeatWrapping;
  velvetBump.repeat.set(12, 10);
  velvetBump.needsUpdate = true;

  const materials = {
    gold: new THREE.MeshPhysicalMaterial({ color: '#e5ae43', metalness: 0.94, roughness: 0.22, clearcoat: 0.3, envMapIntensity: 1.1, side: THREE.DoubleSide }),
    velvet: new THREE.MeshPhysicalMaterial({ color: '#0a245f', roughness: 0.98, sheen: 0.4, sheenColor: '#183d87', sheenRoughness: 0.9, envMapIntensity: 0.28, bumpMap: velvetBump, bumpScale: 0.017 }),
    sapphire: new THREE.MeshPhysicalMaterial({ color: '#062c9b', vertexColors: true, metalness: 0.18, roughness: 0.085, clearcoat: 1, envMapIntensity: 0.8 }),
    pearl: new THREE.MeshPhysicalMaterial({ color: '#f5e8d1', metalness: 0.05, roughness: 0.27, clearcoat: 0.6, iridescence: 0.12 }),
  };
  const group = new THREE.Group();
  group.scale.set(1.13, 1, 1.13);
  Object.entries(parts).forEach(([name, geometries]) => {
    group.add(new THREE.Mesh(mergeGeometries(geometries), materials[name]));
    geometries.forEach(geometry => geometry.dispose());
  });
  return group;
}

function CrownScene({ interaction, reducedMotion, visible }) {
  const root = useRef();
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const crown = createCrown();
    root.current.add(crown);
    const generator = new THREE.PMREMGenerator(gl);
    // Dark studio with broad warm light cards gives the metal reflected contrast.
    const studio = new THREE.Scene();
    studio.background = new THREE.Color('#10131c');
    [
      { position: [-3, 3, 3], size: [3, 4], color: '#fff0d1', intensity: 5 },
      { position: [3, 2, 1], size: [1, 4], color: '#fff4df', intensity: 3 },
      { position: [0, 5, 0], size: [3, 3], color: '#ffffff', intensity: 3 },
      { position: [1, 2, -4], size: [2, 3], color: '#c1d2ff', intensity: 2 },
    ].forEach(({ position, size, color, intensity }) => {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
      panel.position.set(...position);
      panel.lookAt(0, 0.9, 0);
      studio.add(panel);
    });
    const environment = generator.fromScene(studio, 0.04);
    scene.environment = environment.texture;
    studio.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
    generator.dispose();
    invalidate();
    const parent = root.current;
    return () => {
      parent.remove(crown);
      crown.traverse(object => { object.geometry?.dispose(); object.material?.bumpMap?.dispose(); object.material?.dispose(); });
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, scene, invalidate]);

  useEffect(() => { invalidate(); }, [visible, reducedMotion, invalidate]);
  useFrame((state, delta) => {
    const input = interaction.current;
    const dt = Math.min(delta, 0.05);
    if (!input.dragging && !reducedMotion) {
      input.yaw += input.velocity * dt;
      input.velocity *= Math.exp(-7 * dt);
    }
    const idleYaw = !reducedMotion && !input.dragging ? Math.sin(state.clock.elapsedTime * 0.7) * 0.008 : 0;
    const yaw = input.yaw + (reducedMotion ? 0 : input.pointerX * 0.12) + idleYaw;
    const tilt = clamp(input.tilt + (reducedMotion ? 0 : input.pointerY * 0.035), -0.09, 0.09);
    const smoothing = reducedMotion ? 1 : 1 - Math.exp(-9 * dt);
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, yaw, smoothing);
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, tilt, smoothing);
    if (visible && (!reducedMotion || input.dragging)) invalidate();
  });

  const endDrag = event => {
    const input = interaction.current;
    if (input.id !== event.pointerId) return;
    input.dragging = false;
    input.id = null;
    if (performance.now() - input.time > 100 || reducedMotion) input.velocity = 0;
    event.target.releasePointerCapture?.(event.pointerId);
    gl.domElement.style.cursor = 'grab';
    invalidate();
  };
  return <>
    <ambientLight intensity={0.12} />
    <directionalLight position={[-3, 4, 5]} color="#fff0cf" intensity={2.1} />
    <directionalLight position={[3, 2, -2]} color="#a3baff" intensity={0.85} />
    <directionalLight position={[1, 0.5, 4]} color="#ffe6ad" intensity={0.45} />
    <group ref={root}
      onPointerDown={event => {
        if (event.button !== 0 || interaction.current.dragging) return;
        event.stopPropagation();
        event.nativeEvent.preventDefault();
        Object.assign(interaction.current, { dragging: true, id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), velocity: 0 });
        event.target.setPointerCapture(event.pointerId);
        gl.domElement.style.cursor = 'grabbing';
        invalidate();
      }}
      onPointerMove={event => {
        const input = interaction.current;
        if (!input.dragging || input.id !== event.pointerId) return;
        event.stopPropagation();
        const now = performance.now();
        const dx = event.clientX - input.x;
        input.yaw += dx * 0.009;
        input.tilt = clamp(input.tilt + (event.clientY - input.y) * 0.001, -0.055, 0.055);
        input.velocity = reducedMotion ? 0 : clamp(dx * 0.009 / Math.max((now - input.time) / 1000, 0.008), -2, 2);
        input.x = event.clientX; input.y = event.clientY; input.time = now;
        invalidate();
      }}
      onPointerUp={endDrag}
    />
  </>;
}

class CrownBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="crown-fallback" aria-hidden="true">♛</div> : this.props.children; }
}

export default function Crown3D() {
  const stage = useRef();
  const interaction = useRef({ yaw: 0, tilt: 0, velocity: 0, pointerX: 0, pointerY: 0, dragging: false, id: null });
  const wake = useRef(() => {});
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReducedMotion(query.matches); interaction.current.velocity = 0; };
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
      Object.assign(interaction.current, { dragging: false, id: null, velocity: 0 });
      const canvas = stage.current?.querySelector('canvas');
      if (canvas) canvas.style.cursor = 'grab';
      wake.current();
    };
    window.addEventListener('blur', cancel);
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', leave);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(stage.current);
    return () => {
      query.removeEventListener('change', change);
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', cancel);
      observer.disconnect();
    };
  }, []);
  const resetDrag = () => {
    interaction.current.dragging = false;
    interaction.current.id = null;
    interaction.current.velocity = 0;
    const canvas = stage.current?.querySelector('canvas');
    if (canvas) canvas.style.cursor = 'grab';
    wake.current();
  };
  return <div ref={stage} className="crown-stage" role="img" aria-label="כתר מלכותי מוזהב עם אבני ספיר ופנינים" onPointerCancel={resetDrag} onLostPointerCapture={() => { interaction.current.dragging = false; interaction.current.id = null; }}>
    <span className="crown-wide-halo hidden" aria-hidden="true" />
    <span className="crown-load-sweep hidden" aria-hidden="true" />
    <CrownBoundary>
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1.25, 5.4], fov: 30 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={<div className="crown-fallback" aria-hidden="true">♛</div>}
        onCreated={({ camera, invalidate, gl }) => {
          camera.lookAt(0, 0.98, 0);
          gl.setClearColor(0x000000, 0);
          gl.toneMappingExposure = 0.9;
          wake.current = invalidate;
        }}>
        <CrownScene interaction={interaction} reducedMotion={reducedMotion} visible={visible} />
      </Canvas>
    </CrownBoundary>
  </div>;
}
