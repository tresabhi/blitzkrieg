import { useLoader } from '@react-three/fiber';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Group, Vector3 } from 'three';
import { GLTFLoader } from 'three-stdlib';
import { X_AXIS } from '../../../../../constants/axis';
import {
  ModelDefinitions,
  modelDefinitions,
} from '../../../../../core/blitzkrieg/modelDefinitions';
import mutateTankopedia, {
  useTankopedia,
} from '../../../../../stores/tankopedia';
import { GunContainer } from './GunContainer';
import { HullContainer } from './HullContainer';
import { TurretContainer } from './TurretContainer';

interface TankModelProps {
  tankId: number;
  turretId: number;
  gunId: number;
}

export const TankModel = forwardRef<Group, TankModelProps>(
  ({ tankId, turretId, gunId }, ref) => {
    // "TypeError: dispatcher.use is not a function"
    // const awaitedModelDefinitions = use(modelDefinitions);
    const [awaitedModelDefinitions, setAwaitedModelDefinitions] = useState<
      ModelDefinitions | undefined
    >(undefined);
    const gltf = useLoader(GLTFLoader, `/test/${tankId}.glb`);
    const model = useTankopedia((state) => state.model);
    const hullContainer = useRef<Group>(null);
    const turretContainer = useRef<Group>(null);
    const gunContainer = useRef<Group>(null);

    useImperativeHandle(ref, () => hullContainer.current!);
    useEffect(() => {
      (async () => {
        setAwaitedModelDefinitions(await modelDefinitions);
      })();
    }, []);

    if (!awaitedModelDefinitions) return null;

    const tankModelDefinition = awaitedModelDefinitions[tankId];
    const turretModelDefinition = tankModelDefinition.turrets[turretId];
    const gunModelDefinition = turretModelDefinition.guns[gunId];
    const turretOrigin = new Vector3(
      tankModelDefinition.turretOrigin[0],
      tankModelDefinition.turretOrigin[1],
      -tankModelDefinition.turretOrigin[2],
    ).applyAxisAngle(X_AXIS, Math.PI / 2);
    const gunOrigin = new Vector3(
      turretModelDefinition.gunOrigin[0],
      turretModelDefinition.gunOrigin[1],
      -turretModelDefinition.gunOrigin[2],
    ).applyAxisAngle(X_AXIS, Math.PI / 2);

    return (
      <HullContainer
        objects={gltf.scene.children[0].children}
        yaw={model.hullYaw}
        ref={hullContainer}
        onYawStart={() =>
          mutateTankopedia((draft) => {
            draft.model.controlsEnabled = false;
          })
        }
        onYawEnd={(yaw) => {
          mutateTankopedia((draft) => {
            draft.model.controlsEnabled = true;
            draft.model.hullYaw = yaw;
          });
        }}
        onTrackStart={() => {
          mutateTankopedia((draft) => {
            draft.model.controlsEnabled = false;
          });
        }}
        onTrackEnd={() => {
          mutateTankopedia((draft) => {
            draft.model.controlsEnabled = true;
          });
        }}
      >
        <TurretContainer
          initialTurretRotation={tankModelDefinition.turretRotation}
          gunOrigin={gunOrigin}
          ref={turretContainer}
          objects={gltf.scene.children[0].children}
          model={turretModelDefinition.model}
          onYawStart={() =>
            mutateTankopedia((state) => {
              state.model.controlsEnabled = false;
            })
          }
          yawLimits={turretModelDefinition.yaw}
          pitchLimits={gunModelDefinition.pitch}
          pitch={model.gunPitch}
          onYawEnd={(pitch, yaw) => {
            mutateTankopedia((state) => {
              state.model.controlsEnabled = true;
              state.model.gunPitch = pitch;
              state.model.turretYaw = yaw;
            });
          }}
          gunContainer={gunContainer}
          turretOrigin={turretOrigin}
          yaw={model.turretYaw}
        >
          <GunContainer
            ref={gunContainer}
            initialTurretRotation={tankModelDefinition.turretRotation}
            onPitchStart={() => {
              mutateTankopedia((state) => {
                state.model.controlsEnabled = false;
              });
            }}
            pitchLimits={gunModelDefinition.pitch}
            turretContainer={turretContainer}
            yaw={model.turretYaw}
            onPitchEnd={(pitch, yaw) => {
              mutateTankopedia((state) => {
                state.model.controlsEnabled = true;
                state.model.gunPitch = pitch;
                state.model.turretYaw = yaw;
              });
            }}
            yawLimits={turretModelDefinition.yaw}
            gunOrigin={gunOrigin}
            pitch={model.gunPitch}
            model={gunModelDefinition.model}
            objects={gltf.scene.children[0].children}
            turretOrigin={turretOrigin}
          />
        </TurretContainer>
      </HullContainer>
    );
  },
);