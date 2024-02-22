import { useEffect, useRef } from 'react';
import { Euler, Group, Mesh, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils';
import { ArmorMesh } from '../../../../../../../../../components/ArmorMesh';
import { I_HAT, J_HAT, K_HAT } from '../../../../../../../../../constants/axis';
import {
  ModelTransformEventData,
  modelTransformEvent,
} from '../../../../../../../../../core/blitzkrieg/modelTransform';
import { nameToArmorId } from '../../../../../../../../../core/blitzkrieg/nameToArmorId';
import { resolveArmor } from '../../../../../../../../../core/blitzkrieg/resolveThickness';
import { useArmor } from '../../../../../../../../../hooks/useArmor';
import { useModelDefinitions } from '../../../../../../../../../hooks/useModelDefinitions';
import { useDuel } from '../../../../../../../../../stores/duel';
import { useTankopediaTemporary } from '../../../../../../../../../stores/tankopedia';

export function ArmorHighlighting() {
  const protagonist = useDuel((state) => state.protagonist!);
  const wrapper = useRef<Group>(null);
  const modelDefinitions = useModelDefinitions();
  const gunContainer = useRef<Group>(null);
  const turretContainer = useRef<Group>(null);
  const initialTankopediaState = useTankopediaTemporary.getState();

  useEffect(() => {
    const hullOrigin = new Vector3(
      trackModelDefinition.origin[0],
      trackModelDefinition.origin[1],
      -trackModelDefinition.origin[2],
    ).applyAxisAngle(I_HAT, Math.PI / 2);
    const turretOrigin = new Vector3(
      tankModelDefinition.turretOrigin[0],
      tankModelDefinition.turretOrigin[1],
      -tankModelDefinition.turretOrigin[2],
    ).applyAxisAngle(I_HAT, Math.PI / 2);
    const turretPosition = new Vector3();
    const turretRotation = new Euler();
    const gunPosition = new Vector3();
    const gunRotation = new Euler();

    function handleModelTransform({ pitch, yaw }: ModelTransformEventData) {
      if (yaw === undefined) return;

      gunPosition
        .set(0, 0, 0)
        .sub(hullOrigin)
        .sub(turretOrigin)
        .sub(gunOrigin)
        .applyAxisAngle(I_HAT, pitch)
        .add(gunOrigin)
        .add(turretOrigin)
        .add(hullOrigin);
      gunRotation.set(pitch, 0, 0);
      gunContainer.current?.position.copy(gunPosition);
      gunContainer.current?.rotation.copy(gunRotation);
      turretPosition
        .set(0, 0, 0)
        .sub(hullOrigin)
        .sub(turretOrigin)
        .applyAxisAngle(new Vector3(0, 0, 1), yaw);
      turretRotation.set(0, 0, yaw);

      if (tankModelDefinition.turretRotation) {
        const initialPitch = -degToRad(
          tankModelDefinition.turretRotation.pitch,
        );
        const initialYaw = -degToRad(tankModelDefinition.turretRotation.yaw);
        const initialRoll = -degToRad(tankModelDefinition.turretRotation.roll);

        turretPosition
          .applyAxisAngle(I_HAT, initialPitch)
          .applyAxisAngle(J_HAT, initialRoll)
          .applyAxisAngle(K_HAT, initialYaw);
        turretRotation.x += initialPitch;
        turretRotation.y += initialRoll;
        turretRotation.z += initialYaw;
      }

      turretPosition.add(turretOrigin).add(hullOrigin);
      turretContainer.current?.position.copy(turretPosition);
      turretContainer.current?.rotation.copy(turretRotation);
    }
    const unsubscribe = useTankopediaTemporary.subscribe(
      (state) => state.mode,
      (mode) => {
        if (wrapper.current) wrapper.current.visible = mode === 'armor';
      },
    );

    handleModelTransform(useTankopediaTemporary.getState().model.pose);
    modelTransformEvent.on(handleModelTransform);

    return () => {
      modelTransformEvent.off(handleModelTransform);
      unsubscribe();
    };
  }, []);

  const armorGltf = useArmor(protagonist.tank.id);
  const armorNodes = Object.values(armorGltf.nodes);
  const tankModelDefinition = modelDefinitions[protagonist.tank.id];
  const trackModelDefinition = tankModelDefinition.tracks[protagonist.track.id];
  const turretModelDefinition =
    tankModelDefinition.turrets[protagonist.turret.id];
  const gunModelDefinition = turretModelDefinition.guns[protagonist.gun.id];
  const hullOrigin = new Vector3(
    trackModelDefinition.origin[0],
    trackModelDefinition.origin[1],
    -trackModelDefinition.origin[2],
  );
  const turretOrigin = new Vector3(
    tankModelDefinition.turretOrigin[0],
    tankModelDefinition.turretOrigin[1],
    -tankModelDefinition.turretOrigin[2],
  ).applyAxisAngle(I_HAT, Math.PI / 2);
  const gunOrigin = new Vector3(
    turretModelDefinition.gunOrigin[0],
    turretModelDefinition.gunOrigin[1],
    -turretModelDefinition.gunOrigin[2],
  ).applyAxisAngle(I_HAT, Math.PI / 2);
  const maxThickness = Math.max(
    trackModelDefinition.thickness,
    gunModelDefinition.thickness,
    ...armorNodes
      .map((node) => {
        const armorId = nameToArmorId(node.name);
        return resolveArmor(tankModelDefinition.armor, armorId).thickness;
      })
      .filter(Boolean),
  );

  return (
    <group
      ref={wrapper}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={initialTankopediaState.mode === 'armor'}
      position={hullOrigin}
    >
      {armorNodes.map((node) => {
        const isHull = node.name.startsWith('hull_');
        const isVisible = isHull;
        const armorId = nameToArmorId(node.name);
        const { spaced, thickness } = resolveArmor(
          tankModelDefinition.armor,
          armorId,
        );

        if (!isVisible || thickness === undefined || spaced) return null;

        return (
          <ArmorMesh
            maxThickness={maxThickness}
            key={node.uuid}
            geometry={(node as Mesh).geometry}
            thickness={thickness}
          />
        );
      })}

      <group ref={turretContainer}>
        {armorNodes.map((node) => {
          const isCurrentTurret = node.name.startsWith(
            `turret_${turretModelDefinition.model.toString().padStart(2, '0')}`,
          );
          const isVisible = isCurrentTurret;
          const armorId = nameToArmorId(node.name);
          const { spaced, thickness } = resolveArmor(
            turretModelDefinition.armor,
            armorId,
          );

          if (!isVisible || thickness === undefined || spaced) return null;

          return (
            <ArmorMesh
              maxThickness={maxThickness}
              key={node.uuid}
              geometry={(node as Mesh).geometry}
              position={turretOrigin}
              thickness={thickness}
            />
          );
        })}

        <group ref={gunContainer}>
          {armorNodes.map((node) => {
            const isCurrentGun = node.name.startsWith(
              `gun_${gunModelDefinition.model.toString().padStart(2, '0')}`,
            );
            const isVisible = isCurrentGun;
            const armorId = nameToArmorId(node.name);
            const { spaced, thickness } = resolveArmor(
              gunModelDefinition.armor,
              armorId,
            );

            if (!isVisible || thickness === undefined || spaced) return null;

            return (
              <ArmorMesh
                maxThickness={maxThickness}
                key={node.uuid}
                geometry={(node as Mesh).geometry}
                position={turretOrigin.clone().add(gunOrigin)}
                thickness={thickness}
              />
            );
          })}
        </group>
      </group>
    </group>
  );
}
