export type Player = {
  id: string;
  name: string;
  isPlaying: boolean;
  position: Vec3;
  rotation: Vec4;
  linkToTwitter: boolean;
};

export type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type Vec4 = {
  x: number;
  y: number;
  z: number;
  w: number;
};
