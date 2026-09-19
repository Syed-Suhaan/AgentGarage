"use client";

import { useEffect, useRef } from "react";

const PALETTES: Record<string, [number, number, number][]> = {
  // Step 1: Monochrome liquid chrome (Image 2)
  ink: [
    [15 / 255, 15 / 255, 14 / 255],
    [74 / 255, 74 / 255, 72 / 255],
    [168 / 255, 168 / 255, 164 / 255],
    [246 / 255, 246 / 255, 245 / 255],
  ],
  // Step 2: Lilac / violet liquid chrome (Image 3)
  violet: [
    [32 / 255, 24 / 255, 47 / 255],
    [107 / 255, 90 / 255, 154 / 255],
    [195 / 255, 162 / 255, 176 / 255],
    [244 / 255, 232 / 255, 220 / 255],
  ],
  // Step 3: Electric blue liquid chrome (Image 4)
  blue: [
    [7 / 255, 20 / 255, 58 / 255],
    [31 / 255, 79 / 255, 214 / 255],
    [143 / 255, 176 / 255, 255 / 255],
    [234 / 255, 240 / 255, 255 / 255],
  ],
  // Step 4: Psychedelic emerald / cyan / purple (Image 5)
  sun: [
    [59 / 255, 118 / 255, 255 / 255],
    [41 / 255, 239 / 255, 183 / 255],
    [66 / 255, 36 / 255, 199 / 255],
    [228 / 255, 228 / 255, 222 / 255],
  ],
};

const VERT_SRC = `
attribute vec2 p;
varying vec2 v;
void main() {
  v = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;
varying vec2 v;
uniform vec2 u_res;
uniform float u_time, u_scale, u_warp, u_stretch, u_orb, u_spin, u_rush, u_glass, u_bands;
uniform vec3 u_c0, u_c1, u_c2, u_c3;

vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x){ return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 p){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(p + dot(p, C.yy));
  vec2 x0 = p - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 q = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(q * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main(){
  vec2 uv = v;
  float aspect = u_res.x / u_res.y;
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec2 c = v * 2.0 - 1.0;
  float r = length(c);
  float alpha = 1.0 - smoothstep(0.975, 1.0, r);
  if (alpha <= 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float z = sqrt(max(0.0, 1.0 - r * r));
  n = vec3(c, z);

  vec3 R = refract(vec3(0.0, 0.0, -1.0), n, 1.0 / 1.45);
  float tt = (-1.3 - z) / min(R.z, -0.05);
  vec2 hit = c + R.xy * tt;
  uv = vec2(hit.x * 1.4 + 0.5 + u_spin, hit.y * 1.4 + 0.5);

  uv.y *= u_stretch;
  float t = u_time;
  vec2 d1 = t * vec2(0.016, -0.012);
  vec2 d2 = t * vec2(-0.010, 0.018);
  vec2 q = vec2(snoise(uv * u_scale + d1), snoise(uv * u_scale + vec2(5.2, 1.3) + d1 * 0.8));
  vec2 w = vec2(snoise(uv * u_scale + u_warp * 0.65 * q + vec2(1.7, 9.2) + d2),
                snoise(uv * u_scale + u_warp * 0.65 * q + vec2(8.3, 2.8) + d2 * 0.9));
  float f = snoise(uv * u_scale + u_warp * 0.65 * w + t * 0.014);
  float p = clamp(f * 0.5 + 0.48, 0.0, 1.0);

  float focus = smoothstep(0.2, 0.6, snoise(uv * u_scale * 0.5 + vec2(4.3, 7.9) + d2 * 0.4)) * 0.5;
  float deepEdge = mix(0.45, 0.30, focus);
  float warmA = mix(0.32, 0.42, focus);
  float warmB = mix(0.72, 0.60, focus);

  vec3 deep = u_c0;
  vec3 pale = u_c2;
  vec3 warm = u_c3;
  vec3 col;

  float qBands = abs(fract(p * u_bands + 0.25) * 2.0 - 1.0);
  col = mix(deep, warm, smoothstep(0.2, 0.45, qBands));
  col = mix(col, pale, smoothstep(0.5, 0.75, qBands));
  col = mix(col, u_c1, smoothstep(0.8, 0.97, qBands));

  float glow = smoothstep(0.2, 0.4, p) * smoothstep(0.85, 0.5, p);
  col = mix(col, vec3(1.0), glow * 0.1);

  vec3 Rrefl = reflect(vec3(0.0, 0.0, -1.0), n);
  float F = 0.04 + 0.96 * pow(1.0 - n.z, 5.0);
  col = mix(col, vec3(0.97, 0.97, 0.96), F * 0.8);

  float strip = smoothstep(0.3, 0.24, abs(Rrefl.y - 0.08)) * smoothstep(-1.0, 0.2, -Rrefl.z);
  col = mix(col, vec3(1.0), strip * (0.6 + 0.4 * F));

  float spec = pow(max(0.0, dot(Rrefl, normalize(vec3(-0.45, 0.6, -0.65)))), 60.0);
  col += spec * 0.5;
  col *= 1.0 - smoothstep(0.86, 1.0, r) * 0.25;

  gl_FragColor = vec4(col * alpha, alpha);
}
`;

interface ZoahOrbProps {
  palette: "ink" | "violet" | "blue" | "sun";
  spin?: number;
  className?: string;
}

export function ZoahOrb({ palette, spin = 0, className = "" }: ZoahOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paletteRef = useRef(palette);
  const spinRef = useRef(spin);
  const currPalette = useRef<[number, number, number][]>(
    (PALETTES[palette] || PALETTES.ink).map((c) => [c[0], c[1], c[2]])
  );

  paletteRef.current = palette;
  spinRef.current = spin;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
    if (!gl) return;

    function compile(glContext: WebGLRenderingContext, type: number, src: string) {
      const s = glContext.createShader(type)!;
      glContext.shaderSource(s, src);
      glContext.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT_SRC));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC));
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("Orb shader error:", gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const U: Record<string, WebGLUniformLocation> = {};
    [
      "u_res",
      "u_time",
      "u_scale",
      "u_warp",
      "u_stretch",
      "u_orb",
      "u_spin",
      "u_rush",
      "u_glass",
      "u_bands",
      "u_c0",
      "u_c1",
      "u_c2",
      "u_c3",
    ].forEach((name) => {
      U[name] = gl.getUniformLocation(prog, name)!;
    });

    let animId = 0;
    const startTime = performance.now();

    const render = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const clientSize = canvas.clientWidth || canvas.parentElement?.clientWidth || 700;
      const size = Math.max(Math.round(clientSize * dpr), 100);
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
        gl.viewport(0, 0, size, size);
      }

      // Smoothly interpolate colors to target palette
      const target = PALETTES[paletteRef.current] || PALETTES.ink;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          currPalette.current[i][j] += (target[i][j] - currPalette.current[i][j]) * 0.08;
        }
      }

      gl.uniform2f(U.u_res, canvas.width, canvas.height);
      gl.uniform1f(U.u_time, elapsed * 0.5);
      gl.uniform1f(U.u_scale, 1.2);
      gl.uniform1f(U.u_warp, 1.0);
      gl.uniform1f(U.u_stretch, 1.4);
      gl.uniform1f(U.u_orb, 1.0);
      gl.uniform1f(U.u_spin, spinRef.current * 0.015 + elapsed * 0.02);
      gl.uniform1f(U.u_rush, 0.0);
      gl.uniform1f(U.u_glass, 1.0);
      gl.uniform1f(U.u_bands, 2.0);

      gl.uniform3fv(U.u_c0, currPalette.current[0]);
      gl.uniform3fv(U.u_c1, currPalette.current[1]);
      gl.uniform3fv(U.u_c2, currPalette.current[2]);
      gl.uniform3fv(U.u_c3, currPalette.current[3]);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      gl.deleteProgram(prog);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
