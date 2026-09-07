import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/*
  AsciiFluidBg — Navier-Stokes fluid simulation rendered as ASCII glyphs.
  Each screen-space cell samples the fluid's velocity magnitude and picks a
  glyph from a canvas-generated atlas (" .:-=+*#%@", light to dense).
  Adapted for Ruom: glyph color is output in raw sRGB (bypassing three's
  linear color management) so the hex passed in is exactly what appears on
  screen, and glyphs are alpha-composited over the page background.
*/

const face_vert = /* glsl */ `
attribute vec3 position;
uniform vec2 px;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main(){
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  uv = vec2(0.5) + pos.xy * 0.5;
  gl_Position = vec4(pos, 1.0);
}
`;

const line_vert = /* glsl */ `
attribute vec3 position;
uniform vec2 px;
precision highp float;
varying vec2 uv;
void main(){
  vec3 pos = position;
  uv = 0.5 + pos.xy * 0.5;
  vec2 n = sign(pos.xy);
  pos.xy = abs(pos.xy) - px * 1.0;
  pos.xy *= n;
  gl_Position = vec4(pos, 1.0);
}
`;

const mouse_vert = /* glsl */ `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const advection_frag = /* glsl */ `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform bool isBFECC;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 uv;
void main(){
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  if(isBFECC == false){
    vec2 vel = texture2D(velocity, uv).xy;
    vec2 uv2 = uv - vel * dt * ratio;
    vec2 newVel = texture2D(velocity, uv2).xy;
    gl_FragColor = vec4(newVel, 0.0, 0.0);
  } else {
    vec2 spot_new = uv;
    vec2 vel_old = texture2D(velocity, uv).xy;
    vec2 spot_old = spot_new - vel_old * dt * ratio;
    vec2 vel_new1 = texture2D(velocity, spot_old).xy;
    vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
    vec2 error = spot_new2 - spot_new;
    vec2 spot_new3 = spot_new - error / 2.0;
    vec2 vel_2 = texture2D(velocity, spot_new3).xy;
    vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
    vec2 newVel2 = texture2D(velocity, spot_old2).xy;
    gl_FragColor = vec4(newVel2, 0.0, 0.0);
  }
}
`;

// output stage: velocity magnitude per cell selects a glyph from the atlas
const ascii_frag = /* glsl */ `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D glyphAtlas;
uniform vec2 uRes;
uniform float uCell;
uniform vec3 uColor;
uniform float uNumGlyphs;
varying vec2 uv;
void main(){
  vec2 fragCoord = uv * uRes;
  vec2 cellId = floor(fragCoord / uCell);
  vec2 cellCenterUv = (cellId + 0.5) * uCell / uRes;
  vec2 vel = texture2D(velocity, clamp(cellCenterUv, 0.0, 1.0)).xy;
  float mag = clamp(length(vel) * 3.0, 0.0, 1.0);
  float gIndex = floor(mag * (uNumGlyphs - 1.0) + 0.5);
  vec2 localUv = fract(fragCoord / uCell);
  vec2 atlasUv = vec2((gIndex + localUv.x) / uNumGlyphs, localUv.y);
  float glyph = texture2D(glyphAtlas, atlasUv).r;
  gl_FragColor = vec4(uColor * glyph, glyph);
}
`;

const divergence_frag = /* glsl */ `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main(){
  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
  float divergence = (x1 - x0 + y1 - y0) / 2.0;
  gl_FragColor = vec4(divergence / dt);
}
`;

const externalForce_frag = /* glsl */ `
precision highp float;
uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`;

const poisson_frag = /* glsl */ `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, uv).r;
  float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
  gl_FragColor = vec4(newP);
}
`;

const pressure_frag = /* glsl */ `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;
  vec2 v      = texture2D(velocity, uv).xy;
  vec2 gradP  = vec2(p0 - p1, p2 - p3) * 0.5;
  v = v - gradP * dt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

const viscous_frag = /* glsl */ `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D velocity_new;
uniform float v;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  vec2 old  = texture2D(velocity, uv).xy;
  vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
  vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
  vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
  vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
  vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
  newv /= 4.0 * (1.0 + v * dt);
  gl_FragColor = vec4(newv, 0.0, 0.0);
}
`;

type Uniforms = Record<string, { value: unknown }>;

// UI primary is hsl(19 100% 50%) == #ff6a00; the background runs a step
// darker so buttons and accents still pop against it.
const DEFAULT_DARK_COLOR = "#e05e00";
const DEFAULT_LIGHT_COLOR = "#b34700";
const GLYPHS = " .:-=+*#%@";

// Parse hex straight to 0-1 sRGB components. THREE.Color would convert the
// value into linear working space, which renders noticeably darker on a
// RawShaderMaterial that writes colors to the framebuffer without conversion.
const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
};

function makeGlyphAtlas(chars: string, cell: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = cell * chars.length;
  canvas.height = cell;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = `${Math.floor(cell * 0.82)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], i * cell + cell / 2, cell / 2 + cell * 0.05);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function isDarkMode() {
  if (document.documentElement.classList.contains("dark")) return true;
  if (document.documentElement.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

class CommonGL {
  width = 1;
  height = 1;
  pixelRatio = 1;
  renderer: THREE.WebGLRenderer | null = null;
  clock: THREE.Clock | null = null;
  time = 0;
  delta = 0;
  container: HTMLElement | null = null;

  init(container: HTMLElement) {
    this.container = container;
    this.pixelRatio = 1;
    this.resize();
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    const el = this.renderer.domElement;
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.display = "block";
    this.clock = new THREE.Clock();
    this.clock.start();
  }

  resize() {
    if (!this.container) return;
    const r = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    this.renderer?.setSize(this.width, this.height, false);
  }

  update() {
    if (!this.clock) return;
    this.delta = this.clock.getDelta();
    this.time += this.delta;
  }
}

class MouseGL {
  coords = new THREE.Vector2();
  coords_old = new THREE.Vector2();
  diff = new THREE.Vector2();
  mouseMoved = false;
  isInside = false;
  isAutoActive = false;
  autoIntensity = 2.0;
  timer: ReturnType<typeof setTimeout> | null = null;
  container: HTMLElement | null = null;
  onInteract: (() => void) | null = null;

  private _move = this._onMove.bind(this);
  private _leave = () => {
    this.isInside = false;
  };
  private _touch = this._onTouch.bind(this);

  init(container: HTMLElement) {
    this.container = container;
    window.addEventListener("mousemove", this._move);
    window.addEventListener("touchmove", this._touch, { passive: true });
    window.addEventListener("touchstart", this._touch, { passive: true });
    document.addEventListener("mouseleave", this._leave);
  }

  dispose() {
    window.removeEventListener("mousemove", this._move);
    window.removeEventListener("touchmove", this._touch);
    window.removeEventListener("touchstart", this._touch);
    document.removeEventListener("mouseleave", this._leave);
  }

  private _onMove(e: MouseEvent) {
    if (!this.container) return;
    const r = this.container.getBoundingClientRect();
    this.isInside =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom;
    if (!this.isInside) return;
    this.onInteract?.();
    this._set(e.clientX, e.clientY);
  }

  private _onTouch(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    this.onInteract?.();
    this._set(t.clientX, t.clientY);
  }

  private _set(cx: number, cy: number) {
    if (!this.container) return;
    if (this.timer) clearTimeout(this.timer);
    const r = this.container.getBoundingClientRect();
    const nx = (cx - r.left) / r.width;
    const ny = (cy - r.top) / r.height;
    this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
    this.mouseMoved = true;
    this.timer = setTimeout(() => {
      this.mouseMoved = false;
    }, 100);
  }

  setNormalized(x: number, y: number) {
    this.coords.set(x, y);
    this.mouseMoved = true;
  }

  update() {
    this.diff.subVectors(this.coords, this.coords_old);
    this.coords_old.copy(this.coords);
    if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
    if (this.isAutoActive) this.diff.multiplyScalar(this.autoIntensity);
  }
}

class ShaderPass {
  scene: THREE.Scene;
  camera: THREE.Camera;
  material: THREE.RawShaderMaterial | null = null;
  geometry: THREE.BufferGeometry | null = null;
  uniforms: Uniforms;
  output: THREE.WebGLRenderTarget | null;
  renderer: () => THREE.WebGLRenderer | null;

  constructor(
    renderer: () => THREE.WebGLRenderer | null,
    vertShader: string,
    fragShader: string,
    uniforms: Uniforms,
    output: THREE.WebGLRenderTarget | null = null,
  ) {
    this.renderer = renderer;
    this.uniforms = uniforms;
    this.output = output;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.material = new THREE.RawShaderMaterial({
      vertexShader: vertShader,
      fragmentShader: fragShader,
      uniforms,
    });
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.scene.add(new THREE.Mesh(this.geometry, this.material));
  }

  render(to: THREE.WebGLRenderTarget | null = this.output) {
    const r = this.renderer();
    if (!r) return;
    r.setRenderTarget(to);
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
  }

  dispose() {
    this.material?.dispose();
    this.geometry?.dispose();
  }
}

class AutoDriver {
  enabled: boolean;
  speed: number;
  resumeDelay: number;
  current = new THREE.Vector2();
  target = new THREE.Vector2();
  lastTime = performance.now();
  private _tmp = new THREE.Vector2();
  private _mouse: MouseGL;
  private _getLastInteraction: () => number;

  constructor(
    mouse: MouseGL,
    getLastInteraction: () => number,
    speed = 0.4,
    resumeDelay = 1200,
  ) {
    this._mouse = mouse;
    this._getLastInteraction = getLastInteraction;
    this.speed = speed;
    this.resumeDelay = resumeDelay;
    this.enabled = true;
    this._pickTarget();
  }

  private _pickTarget() {
    this.target.set(
      (Math.random() * 2 - 1) * 0.8,
      (Math.random() * 2 - 1) * 0.8,
    );
  }

  update() {
    if (!this.enabled) return;
    const now = performance.now();
    const idleMs = now - this._getLastInteraction();
    if (idleMs < this.resumeDelay) {
      this._mouse.isAutoActive = false;
      return;
    }
    this._mouse.isAutoActive = true;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const dir = this._tmp.subVectors(this.target, this.current);
    const dist = dir.length();
    if (dist < 0.02) {
      this._pickTarget();
      return;
    }
    dir.normalize();
    this.current.addScaledVector(dir, Math.min(this.speed * dt, dist));
    this._mouse.setNormalized(this.current.x, this.current.y);
  }
}

interface SimOpts {
  resolution: number;
  mouse_force: number;
  cursor_size: number;
  dt: number;
  BFECC: boolean;
  isBounce: boolean;
  isViscous: boolean;
  viscous: number;
  iterations_viscous: number;
  iterations_poisson: number;
}

class FluidSim {
  opts: SimOpts;
  fboSize = new THREE.Vector2();
  cellScale = new THREE.Vector2();
  boundarySpace = new THREE.Vector2();
  fbos: Record<string, THREE.WebGLRenderTarget | null> = {};
  gl: CommonGL;
  mouse: MouseGL;

  advection!: { pass: ShaderPass; line: THREE.LineSegments };
  externalForce!: {
    scene: THREE.Scene;
    camera: THREE.Camera;
    mesh: THREE.Mesh;
  };
  viscousPass!: {
    pass: ShaderPass;
    output0: THREE.WebGLRenderTarget | null;
    output1: THREE.WebGLRenderTarget | null;
  };
  divergencePass!: ShaderPass;
  poissonPass!: {
    pass: ShaderPass;
    output0: THREE.WebGLRenderTarget | null;
    output1: THREE.WebGLRenderTarget | null;
  };
  pressurePass!: ShaderPass;

  constructor(gl: CommonGL, mouse: MouseGL, opts: Partial<SimOpts> = {}) {
    this.gl = gl;
    this.mouse = mouse;
    this.opts = {
      resolution: 0.4,
      mouse_force: 10,
      cursor_size: 100,
      dt: 0.011,
      BFECC: true,
      isBounce: false,
      isViscous: false,
      viscous: 30,
      iterations_viscous: 32,
      iterations_poisson: 32,
      ...opts,
    };
    this._calcSize();
    this._createFBOs();
    this._createPasses();
  }

  private _r = () => this.gl.renderer;

  private _calcSize() {
    const w = Math.max(1, Math.round(this.opts.resolution * this.gl.width));
    const h = Math.max(1, Math.round(this.opts.resolution * this.gl.height));
    this.cellScale.set(1 / w, 1 / h);
    this.fboSize.set(w, h);
  }

  private _makeFBO() {
    return new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, {
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    });
  }

  private _createFBOs() {
    for (const n of ["vel_0", "vel_1", "vel_v0", "vel_v1", "div", "p0", "p1"])
      this.fbos[n] = this._makeFBO();
  }

  private _createPasses() {
    const { fbos, cellScale, fboSize, opts, _r: r } = this;

    const advUniforms: Uniforms = {
      boundarySpace: { value: cellScale },
      px: { value: cellScale },
      fboSize: { value: fboSize },
      velocity: { value: fbos.vel_0!.texture },
      dt: { value: opts.dt },
      isBFECC: { value: true },
    };
    const advPass = new ShaderPass(
      r,
      face_vert,
      advection_frag,
      advUniforms,
      fbos.vel_1,
    );
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0,
          -1, -1, 0,
        ]),
        3,
      ),
    );
    const bMat = new THREE.RawShaderMaterial({
      vertexShader: line_vert,
      fragmentShader: advection_frag,
      uniforms: advUniforms,
    });
    const bLine = new THREE.LineSegments(bGeo, bMat);
    advPass.scene.add(bLine);
    this.advection = { pass: advPass, line: bLine };

    const efScene = new THREE.Scene();
    const efCam = new THREE.Camera();
    const efMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.RawShaderMaterial({
        vertexShader: mouse_vert,
        fragmentShader: externalForce_frag,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        uniforms: {
          px: { value: cellScale },
          force: { value: new THREE.Vector2() },
          center: { value: new THREE.Vector2() },
          scale: {
            value: new THREE.Vector2(opts.cursor_size, opts.cursor_size),
          },
        },
      }),
    );
    efScene.add(efMesh);
    this.externalForce = { scene: efScene, camera: efCam, mesh: efMesh };

    const viscPass = new ShaderPass(
      r,
      face_vert,
      viscous_frag,
      {
        boundarySpace: { value: cellScale },
        velocity: { value: fbos.vel_1!.texture },
        velocity_new: { value: fbos.vel_v0!.texture },
        v: { value: opts.viscous },
        px: { value: cellScale },
        dt: { value: opts.dt },
      },
      fbos.vel_v1,
    );
    this.viscousPass = {
      pass: viscPass,
      output0: fbos.vel_v0,
      output1: fbos.vel_v1,
    };

    this.divergencePass = new ShaderPass(
      r,
      face_vert,
      divergence_frag,
      {
        boundarySpace: { value: cellScale },
        velocity: { value: fbos.vel_v0!.texture },
        px: { value: cellScale },
        dt: { value: opts.dt },
      },
      fbos.div,
    );

    const poisPass = new ShaderPass(
      r,
      face_vert,
      poisson_frag,
      {
        boundarySpace: { value: cellScale },
        pressure: { value: fbos.p0!.texture },
        divergence: { value: fbos.div!.texture },
        px: { value: cellScale },
      },
      fbos.p1,
    );
    this.poissonPass = { pass: poisPass, output0: fbos.p0, output1: fbos.p1 };

    this.pressurePass = new ShaderPass(
      r,
      face_vert,
      pressure_frag,
      {
        boundarySpace: { value: cellScale },
        pressure: { value: fbos.p0!.texture },
        velocity: { value: fbos.vel_v0!.texture },
        px: { value: cellScale },
        dt: { value: opts.dt },
      },
      fbos.vel_0,
    );
  }

  resize() {
    this._calcSize();
    for (const k in this.fbos)
      this.fbos[k]!.setSize(this.fboSize.x, this.fboSize.y);
  }

  update() {
    const { opts, mouse, fbos } = this;
    const r = this.gl.renderer;
    if (!r) return;

    this.boundarySpace.copy(
      opts.isBounce ? new THREE.Vector2() : this.cellScale,
    );

    {
      const u = this.advection.pass.uniforms;
      u.dt.value = opts.dt;
      u.isBFECC.value = opts.BFECC;
      this.advection.line.visible = opts.isBounce;
      this.advection.pass.render();
    }

    {
      const mf = opts.mouse_force;
      const cs = opts.cursor_size;
      const cx = this.cellScale.x;
      const cy = this.cellScale.y;
      const clampedX = Math.min(
        Math.max(mouse.coords.x, -1 + cs * cx * 2 + cx * 2),
        1 - cs * cx * 2 - cx * 2,
      );
      const clampedY = Math.min(
        Math.max(mouse.coords.y, -1 + cs * cy * 2 + cy * 2),
        1 - cs * cy * 2 - cy * 2,
      );
      const u = (this.externalForce.mesh.material as THREE.RawShaderMaterial)
        .uniforms;
      u.force.value.set((mouse.diff.x / 2) * mf, (mouse.diff.y / 2) * mf);
      u.center.value.set(clampedX, clampedY);
      u.scale.value.set(cs, cs);
      r.setRenderTarget(fbos.vel_1);
      r.render(this.externalForce.scene, this.externalForce.camera);
      r.setRenderTarget(null);
    }

    let velFBO: THREE.WebGLRenderTarget | null = fbos.vel_1;
    if (opts.isViscous) {
      const { pass, output0, output1 } = this.viscousPass;
      const u = pass.uniforms;
      u.v.value = opts.viscous;
      u.dt.value = opts.dt;
      let fbo_in = output0,
        fbo_out = output1;
      for (let i = 0; i < opts.iterations_viscous; i++) {
        if (i % 2 === 0) {
          fbo_in = output0;
          fbo_out = output1;
        } else {
          fbo_in = output1;
          fbo_out = output0;
        }
        u.velocity_new.value = fbo_in!.texture;
        pass.render(fbo_out);
      }
      velFBO = fbo_out;
    }

    (
      this.divergencePass.uniforms as Uniforms & {
        velocity: { value: THREE.Texture };
      }
    ).velocity.value = velFBO!.texture;
    this.divergencePass.render();

    {
      const { pass, output0, output1 } = this.poissonPass;
      let p_in = output0,
        p_out = output1;
      for (let i = 0; i < opts.iterations_poisson; i++) {
        if (i % 2 === 0) {
          p_in = output0;
          p_out = output1;
        } else {
          p_in = output1;
          p_out = output0;
        }
        pass.uniforms.pressure.value = p_in!.texture;
        pass.render(p_out);
      }
      this.pressurePass.uniforms.pressure.value = p_out!.texture;
      this.pressurePass.uniforms.velocity.value = velFBO!.texture;
    }

    this.pressurePass.render();
  }

  dispose() {
    for (const k in this.fbos) this.fbos[k]?.dispose();
    this.advection.pass.dispose();
    this.divergencePass.dispose();
    this.pressurePass.dispose();
  }
}

export interface AsciiFluidBgProps extends React.ComponentProps<"div"> {
  darkColor?: string;
  lightColor?: string;
  /** glyph set, light -> dense. default " .:-=+*#%@" */
  glyphs?: string;
  /** cell size in device pixels each glyph occupies */
  cellSize?: number;
  /** sim resolution multiplier 0–1; lower = faster */
  resolution?: number;
  mouseForce?: number;
  cursorSize?: number;
  /** auto-moves fluid when idle, yields to cursor */
  autoDemo?: boolean;
  children?: React.ReactNode;
}

export function AsciiFluidBg({
  darkColor = DEFAULT_DARK_COLOR,
  lightColor = DEFAULT_LIGHT_COLOR,
  glyphs = GLYPHS,
  cellSize = 14,
  resolution = 0.4,
  mouseForce = 9,
  cursorSize = 120,
  autoDemo = true,
  children,
  className,
  ...props
}: AsciiFluidBgProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const gl = new CommonGL();
    gl.init(container);
    container.prepend(gl.renderer!.domElement);

    const mouse = new MouseGL();
    mouse.init(container);
    mouse.autoIntensity = 2.4;

    const dark = isDarkMode();
    const atlas = makeGlyphAtlas(glyphs, 64);
    // Raw sRGB components — see hexToRgb.
    const colorVec = hexToRgb(dark ? darkColor : lightColor);

    const sim = new FluidSim(gl, mouse, {
      resolution,
      mouse_force: mouseForce,
      cursor_size: cursorSize,
      dt: 0.008,
      BFECC: false,
      isBounce: false,
      isViscous: false,
      iterations_poisson: 8,
    });

    const outputUniforms: Uniforms = {
      velocity: { value: sim.fbos.vel_0!.texture },
      glyphAtlas: { value: atlas },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(gl.width, gl.height) },
      uCell: { value: cellSize },
      uNumGlyphs: { value: glyphs.length },
      uColor: { value: new THREE.Vector3(colorVec.r, colorVec.g, colorVec.b) },
      boundarySpace: { value: new THREE.Vector2() },
      px: { value: new THREE.Vector2() },
    };
    const outputScene = new THREE.Scene();
    const outputCam = new THREE.Camera();
    const outputMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.RawShaderMaterial({
        vertexShader: face_vert,
        fragmentShader: ascii_frag,
        transparent: true,
        depthWrite: false,
        uniforms: outputUniforms,
      }),
    );
    outputScene.add(outputMesh);

    const themeObserver = new MutationObserver(() => {
      const nowDark = isDarkMode();
      const c = hexToRgb(nowDark ? darkColor : lightColor);
      (outputUniforms.uColor.value as THREE.Vector3).set(c.r, c.g, c.b);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let lastInteraction = performance.now();
    mouse.onInteract = () => {
      lastInteraction = performance.now();
    };
    const driver = autoDemo
      ? new AutoDriver(mouse, () => lastInteraction, 0.45, 1200)
      : null;

    const handleResize = () => {
      gl.resize();
      sim.resize();
      (outputUniforms.uRes.value as THREE.Vector2).set(gl.width, gl.height);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    let raf = 0;
    let running = true;

    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      driver?.update();
      mouse.update();
      gl.update();
      outputUniforms.uTime.value = gl.time;
      sim.update();
      const r = gl.renderer;
      if (r) {
        // Glyphs are alpha-composited, so clear the previous frame first —
        // otherwise it bleeds through everywhere the new frame is empty.
        r.setRenderTarget(null);
        r.clear();
        r.render(outputScene, outputCam);
      }
    };
    loop();

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        running = true;
        loop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      mouse.dispose();
      sim.dispose();
      atlas.dispose();
      (outputMesh.material as THREE.Material).dispose();
      outputMesh.geometry.dispose();
      const canvas = gl.renderer?.domElement;
      gl.renderer?.dispose();
      if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [
    darkColor,
    lightColor,
    glyphs,
    cellSize,
    resolution,
    mouseForce,
    cursorSize,
    autoDemo,
  ]);

  return (
    <div
      ref={mountRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-background",
        className,
      )}
      {...props}
    >
      {children && (
        <div className="relative z-10 w-full h-full">{children}</div>
      )}
    </div>
  );
}
