import { Vec3 } from "@react-battleship/types";

export function normalize(vec3: Vec3) {
  // normalize a vector 3
  const length = Math.sqrt(vec3.x * vec3.x + vec3.y * vec3.y + vec3.z * vec3.z);
  return {
    x: vec3.x / length,
    y: vec3.y / length,
    z: vec3.z / length,
  };
}

export function randomVec3(): Vec3 {
  return {
    x: Math.random() - 0.5 * 1.5,
    y: 0,
    z: Math.random() - 0.5 * 1.5,
  };
}
