import { Card, Flex, Tabs, Theme } from '@radix-ui/themes';
import { Html } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, use, useEffect, useRef, useState } from 'react';
import { applyPitchYawLimits } from '../../../../../../core/blitz/applyPitchYawLimits';
import { modelDefinitions } from '../../../../../../core/blitzkrieg/modelDefinitions';
import { theme } from '../../../../../../stitches.config';
import mutateTankopedia, {
  TankopediaMode,
  useTankopedia,
} from '../../../../../../stores/tankopedia';
import { Loader } from '../../../../components/Loader';
import { Controls } from '../Control';
import { Lighting } from '../Lighting';
import { RotationInputs } from '../RotationInputs';
import { SceneProps } from '../SceneProps';
import { Options } from './components/Options';
import { TankArmor } from './components/TankArmor';
import { TankModel } from './components/TankModel';

export function TankDisplay() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const awaitedModelDefinitions = use(modelDefinitions);
  const canvasWrapper = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mode = useTankopedia((state) => state.mode);
  const protagonist = useTankopedia((state) => {
    if (!state.areTanksAssigned) return;
    return state.protagonist;
  });

  function handlePointerDown() {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }
  function handlePointerMove(event: PointerEvent) {
    event.preventDefault();
  }
  function handlePointerUp(event: PointerEvent) {
    event.preventDefault();

    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }

  useEffect(() => {
    function handleFullScreenChange() {
      setIsFullScreen(document.fullscreenElement !== null);
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  });

  useEffect(() => {
    if (!protagonist) return void 0;

    const tankModelDefinition = awaitedModelDefinitions[protagonist.tank.id];
    const turretModelDefinition =
      tankModelDefinition.turrets[protagonist.turret.id];
    const gunModelDefinition = turretModelDefinition.guns[protagonist.gun.id];

    mutateTankopedia((draft) => {
      [draft.model.physical.pitch, draft.model.physical.yaw] =
        applyPitchYawLimits(
          draft.model.physical.pitch,
          draft.model.physical.yaw,
          gunModelDefinition.pitch,
          turretModelDefinition.yaw,
        );
    });
  }, [protagonist?.gun, protagonist?.turret]);

  if (!protagonist) return null;

  return (
    <Theme radius={isFullScreen ? 'none' : undefined}>
      <Card
        style={{
          position: 'relative',
          border: isFullScreen ? 'none' : 'unset',
        }}
        ref={canvasWrapper}
      >
        <Theme radius="full" style={{ height: '100%' }}>
          <Flex
            style={{
              height: isFullScreen ? '100%' : '75vh',
              maxHeight: isFullScreen ? 'unset' : 576,
            }}
            direction="column"
            gap="2"
          >
            <Tabs.Root
              value={mode}
              onValueChange={(mode) => {
                mutateTankopedia((draft) => {
                  draft.mode = mode as TankopediaMode;
                });
              }}
            >
              <Tabs.List>
                <Tabs.Trigger value="model">Model</Tabs.Trigger>
                <Tabs.Trigger value="armor">Armor</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>

            <div style={{ height: '100%' }}>
              <Canvas
                shadows
                ref={canvas}
                camera={{ fov: 20 }}
                onPointerDown={handlePointerDown}
                gl={{ logarithmicDepthBuffer: true }}
              >
                <Controls />
                <SceneProps />
                <Lighting />

                <Suspense
                  fallback={
                    <Html center position={[0, 1.5, 0]}>
                      <Loader
                        naked
                        color={theme.colors.textHighContrast_purple}
                      />
                    </Html>
                  }
                >
                  <TankModel />
                  <TankArmor />
                </Suspense>
              </Canvas>
            </div>

            <Options canvas={canvasWrapper} isFullScreen={isFullScreen} />

            <RotationInputs />
          </Flex>
        </Theme>
      </Card>
    </Theme>
  );
}
