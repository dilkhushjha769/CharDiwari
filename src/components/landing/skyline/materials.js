import { Color, ShaderMaterial } from "three"
import { RISE_SECONDS } from "./plan"

// One uniform set shared by every material, so the intro, the search highlight
// and theme changes are each a single write per frame.
export function createUniforms() {
  return {
    uIntro: { value: 0 }, // seconds since the intro started
    uTime: { value: 0 }, // drives the window twinkle
    uHighlight: { value: new Array(8).fill(1) }, // 0..1 per project tower
    uBase: { value: new Color() },
    uInk: { value: new Color() },
    uShadow: { value: new Color() },
    uBrick: { value: new Color() },
    uWindow: { value: new Color() },
    uFog: { value: new Color() },
    uSideShade: { value: 0.1 },
    uRoofLift: { value: 0 },
    uBrickTint: { value: 0.05 },
    uEdgeAlpha: { value: 0.3 },
    uUnlitAlpha: { value: 0.07 },
    uLitShare: { value: 0.1 },
    uFogNear: { value: 40 },
    uFogFar: { value: 66 },
  }
}

const common = /* glsl */ `
  uniform float uIntro;
  uniform float uHighlight[8];
  attribute float aDelay;
  attribute float aTower;
  varying float vHighlight;
  varying float vDepth;

  // Ease-out quart: a fast start that settles softly, like the UI's ease-out-strong.
  float riseProgress() {
    float t = clamp((uIntro - aDelay) / ${RISE_SECONDS.toFixed(2)}, 0.0, 1.0);
    return 1.0 - pow(1.0 - t, 4.0);
  }

  float towerHighlight() {
    return aTower < 0.0 ? 0.0 : uHighlight[int(aTower + 0.5)];
  }

  vec4 risenPosition(out float y) {
    vec3 p = position;
    p.y *= riseProgress();
    y = p.y;
    vHighlight = towerHighlight();
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mvPosition.z;
    return projectionMatrix * mvPosition;
  }
`

const fog = /* glsl */ `
  uniform float uFogNear;
  uniform float uFogFar;
  float fogAmount(float depth) {
    return smoothstep(uFogNear, uFogFar, depth);
  }
`

const faces = {
  vertexShader: /* glsl */ `
    ${common}
    varying vec3 vNormal;
    varying float vY;
    void main() {
      float y;
      vNormal = normal;
      gl_Position = risenPosition(y);
      vY = y;
    }
  `,
  fragmentShader: /* glsl */ `
    ${fog}
    uniform vec3 uBase;
    uniform vec3 uInk;
    uniform vec3 uShadow;
    uniform vec3 uBrick;
    uniform vec3 uFog;
    uniform float uSideShade;
    uniform float uRoofLift;
    uniform float uBrickTint;
    varying vec3 vNormal;
    varying float vY;
    varying float vHighlight;
    varying float vDepth;
    void main() {
      // A card massing model: lightest roofs, two shades of wall, and a soft
      // darkening where each block meets the ground.
      vec3 color = vNormal.y > 0.5
        ? mix(uBase, uInk, uRoofLift)
        : mix(uBase, uShadow, uSideShade * (abs(vNormal.x) > 0.5 ? 0.55 : 1.0));
      color = mix(color, uShadow, uSideShade * 0.6 * (1.0 - smoothstep(0.0, 1.6, vY)));
      color = mix(color, uBrick, vHighlight * uBrickTint);
      color = mix(color, uFog, fogAmount(vDepth) * 0.85);
      gl_FragColor = vec4(color, 1.0);
      #include <colorspace_fragment>
    }
  `,
}

const edges = {
  vertexShader: /* glsl */ `
    ${common}
    attribute float aSiteDelay;
    varying float vSite;
    void main() {
      float y;
      vSite = smoothstep(aSiteDelay, aSiteDelay + 0.35, uIntro);
      gl_Position = risenPosition(y);
    }
  `,
  fragmentShader: /* glsl */ `
    ${fog}
    uniform vec3 uInk;
    uniform vec3 uBrick;
    uniform float uEdgeAlpha;
    varying float vHighlight;
    varying float vDepth;
    varying float vSite;
    void main() {
      vec3 color = mix(uInk, uBrick, vHighlight);
      float alpha = mix(uEdgeAlpha, 0.75, vHighlight) * vSite * (1.0 - fogAmount(vDepth) * 0.8);
      gl_FragColor = vec4(color, alpha);
      #include <colorspace_fragment>
    }
  `,
}

const windows = {
  vertexShader: /* glsl */ `
    ${common}
    attribute float aSeed;
    varying float vSeed;
    varying float vShow;
    void main() {
      float y;
      vSeed = aSeed;
      vShow = smoothstep(aDelay + ${(RISE_SECONDS * 0.6).toFixed(2)}, aDelay + ${(RISE_SECONDS + 0.25).toFixed(2)}, uIntro);
      gl_Position = risenPosition(y);
    }
  `,
  fragmentShader: /* glsl */ `
    ${fog}
    uniform vec3 uInk;
    uniform vec3 uWindow;
    uniform vec3 uBrick;
    uniform float uTime;
    uniform float uUnlitAlpha;
    uniform float uLitShare;
    varying float vSeed;
    varying float vShow;
    varying float vHighlight;
    varying float vDepth;

    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    void main() {
      // Each window re-rolls on its own slow clock (about every two minutes), so
      // across the city only a few switch at any moment.
      float phase = floor(uTime * 0.008 + vSeed * 17.0);
      float lit = step(hash(vSeed * 91.7 + phase * 7.13), mix(uLitShare, uLitShare * 2.5, vHighlight));
      vec3 litColor = mix(uWindow, uBrick, vHighlight * 0.35);
      vec3 color = mix(uInk, litColor, lit);
      float alpha = mix(uUnlitAlpha, 0.9, lit) * vShow * (1.0 - fogAmount(vDepth) * 0.8);
      gl_FragColor = vec4(color, alpha);
      #include <colorspace_fragment>
    }
  `,
}

export function createMaterials(uniforms) {
  return {
    // Solid faces hide the lines behind them; the polygon offset lets edges on
    // the same plane draw cleanly on top.
    faces: new ShaderMaterial({
      ...faces,
      uniforms,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
    windows: new ShaderMaterial({ ...windows, uniforms, transparent: true, depthWrite: false }),
    edges: new ShaderMaterial({ ...edges, uniforms, transparent: true, depthWrite: false }),
  }
}
