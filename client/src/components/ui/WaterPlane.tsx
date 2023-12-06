import { Color, Mesh, ShaderMaterial } from "three";
import { MeshProps } from "@react-three/fiber/dist/declarations/src/three-types";
import { forwardRef, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export const WaterPlane = forwardRef<Mesh, MeshProps & { size: number }>(
  ({ size, ...props }, ref) => {
    const materialRef = useRef<ShaderMaterial>(null);
    useFrame((_state, delta) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value += delta;
      }
    });

    const shader = useMemo(
      () => ({
        uniforms: {
          uAmount: { value: 10 },
          uColor: { value: new Color("#3baed0") },
          uColorDarker: { value: new Color("#2b8ba6") },
          uTime: { value: 0 },
        },
        fragmentShader: `varying vec2 vUv;
uniform vec3 uColor;
uniform vec3 uColorDarker;
uniform float uTime;
uniform float uAmount;

vec2 random2(vec2 p) {
  return fract(
    sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) *
      43758.5453
  );
}

float cellular(vec2 p) {
  vec2 i_st = floor(p);
  vec2 f_st = fract(p);
  float m_dist = 10.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 neighbor = vec2(float(i), float(j));
      vec2 point = random2(i_st + neighbor);
      point = 0.5 + 0.5 * sin(6.2831 * point + uTime);
      vec2 diff = neighbor + point - f_st;
      float dist = length(diff);
      if (dist < m_dist) {
        m_dist = dist;
      }
    }
  }
  return m_dist;
}

void main() {
  float c = cellular(8.0 * (vUv * vec2(uAmount * 10.0)));
  vec3 col = mix(uColorDarker, uColor, smoothstep(0.4, 1.3, c));
  gl_FragColor = vec4(col, 1.0);
}`,
        vertexShader: `varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
}`,
      }),
      [],
    );

    return (
      <mesh {...props} ref={ref}>
        <planeGeometry args={[size, size]} />
        <shaderMaterial attach="material" {...shader} ref={materialRef} />
      </mesh>
    );
  },
);
