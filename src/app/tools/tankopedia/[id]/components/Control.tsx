import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { OrbitControls as OrbitControlsClass } from 'three-stdlib';
import { applyPitchYawLimits } from '../../../../../core/blitz/applyPitchYawLimits';
import { hasEquipment } from '../../../../../core/blitzkrieg/hasEquipment';
import { modelDefinitions } from '../../../../../core/blitzkrieg/modelDefinitions';
import { Pose, poseEvent } from '../../../../../core/blitzkrieg/pose';
import { useAwait } from '../../../../../hooks/useAwait';
import { useDuel } from '../../../../../stores/duel';
import { useTankopediaPersistent } from '../../../../../stores/tankopedia';

const poseDistances: Record<Pose, number> = {
  [Pose.HullDown]: 15,
  [Pose.FaceHug]: 5,
  [Pose.Default]: -1,
};

export function Controls() {
  const camera = useThree((state) => state.camera);
  const orbitControls = useRef<OrbitControlsClass>(null);
  const awaitedModelDefinitions = useAwait(modelDefinitions);
  const protagonist = useDuel((state) => state.protagonist!);
  const antagonist = useDuel((state) => state.antagonist!);
  const protagonistModelDefinition =
    awaitedModelDefinitions[protagonist.tank.id];
  const protagonistTrackModelDefinition =
    awaitedModelDefinitions[protagonist.tank.id].tracks[protagonist.track.id];
  const antagonistModelDefinition = awaitedModelDefinitions[antagonist.tank.id];
  const protagonistTurretModelDefinition =
    protagonistModelDefinition.turrets[protagonist.turret.id];
  const antagonistTurretModelDefinition =
    antagonistModelDefinition.turrets[antagonist.turret.id];
  const protagonistGunModelDefinition =
    protagonistTurretModelDefinition.guns[protagonist.gun.id];
  const protagonistHullOrigin = new Vector3(
    protagonistTrackModelDefinition.origin[0],
    protagonistTrackModelDefinition.origin[1],
    -protagonistTrackModelDefinition.origin[2],
  );
  const protagonistTurretOrigin = new Vector3(
    protagonistModelDefinition.turretOrigin[0],
    protagonistModelDefinition.turretOrigin[1],
    -protagonistModelDefinition.turretOrigin[2],
  );
  const protagonistGunOrigin = new Vector3(
    protagonistTurretModelDefinition.gunOrigin[0],
    protagonistTurretModelDefinition.gunOrigin[1],
    -protagonistTurretModelDefinition.gunOrigin[2],
  );
  const antagonistGunHeight =
    protagonistTrackModelDefinition.origin[1] +
    antagonistModelDefinition.turretOrigin[1] +
    antagonistTurretModelDefinition.gunOrigin[1];
  // const hasSetInitialPose = useRef(false);

  useEffect(() => {
    camera.position.set(-4, 4, -16);
    orbitControls.current?.target.set(0, 1.25, 0);
  }, [camera]);

  useEffect(() => {
    const unsubscribeTankopedia = useTankopediaPersistent.subscribe(
      (state) => state.model.visual.controlsEnabled,
      (enabled) => {
        if (orbitControls.current) orbitControls.current.enabled = enabled;
      },
    );

    async function handlePoseEvent(event: Pose) {
      const hasImprovedVerticalStabilizer = await hasEquipment(122);

      switch (event) {
        case Pose.HullDown: {
          const [pitch] = applyPitchYawLimits(
            -Infinity,
            0,
            protagonistGunModelDefinition.pitch,
            protagonistTurretModelDefinition.yaw,
            hasImprovedVerticalStabilizer,
          );

          camera.position
            .set(0, 0, 0)
            .add(protagonistHullOrigin)
            .add(protagonistTurretOrigin)
            .add(protagonistGunOrigin)
            .add(
              new Vector3(
                0,
                poseDistances[event] * Math.sin(pitch),
                poseDistances[event] * -Math.cos(pitch),
              ),
            );
          camera.lookAt(
            protagonistHullOrigin
              .clone()
              .add(protagonistTurretOrigin)
              .add(protagonistGunOrigin),
          );
          orbitControls.current?.target.set(0, antagonistGunHeight, 0);

          break;
        }

        case Pose.FaceHug: {
          const [pitch] = applyPitchYawLimits(
            0,
            0,
            protagonistGunModelDefinition.pitch,
            protagonistTurretModelDefinition.yaw,
            hasImprovedVerticalStabilizer,
          );

          camera.position
            .set(0, 0, 0)
            .add(protagonistHullOrigin)
            .add(protagonistTurretOrigin)
            .add(protagonistGunOrigin)
            .add(
              new Vector3(
                0,
                poseDistances[event] * Math.sin(pitch),
                poseDistances[event] * -Math.cos(pitch),
              ),
            );
          orbitControls.current?.target
            .set(0, 0, 0)
            .add(protagonistHullOrigin)
            .add(protagonistTurretOrigin)
            .add(protagonistGunOrigin)
            .add(
              new Vector3(
                0,
                0.5 * poseDistances[event] * Math.sin(pitch),
                0.5 * poseDistances[event] * -Math.cos(pitch),
              ),
            );

          break;
        }

        case Pose.Default: {
          camera.position.set(-4, 4, -16);
          orbitControls.current?.target.set(0, 1.25, 0);
          break;
        }
      }
    }

    poseEvent.on(handlePoseEvent);

    return () => {
      unsubscribeTankopedia();
      poseEvent.off(handlePoseEvent);
    };
  }, [camera, protagonist.tank.id, antagonist.tank.id]);

  return (
    <OrbitControls
      maxDistance={20}
      minDistance={5}
      ref={orbitControls}
      enabled={useTankopediaPersistent.getState().model.visual.controlsEnabled}
      rotateSpeed={0.25}
      enableDamping={false}
    />
  );
}
