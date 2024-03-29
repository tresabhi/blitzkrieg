import { Vector3Tuple } from 'three';
import { BoundingBox } from './modelDefinitions';

export function unionBoundingBox(a: BoundingBox, b: BoundingBox) {
  return {
    min: a.min.map((a, index) => Math.min(a, b.min[index])) as Vector3Tuple,
    max: a.max.map((a, index) => Math.max(a, b.max[index])) as Vector3Tuple,
  } satisfies BoundingBox;
}
