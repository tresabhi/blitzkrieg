import { equipmentDefinitions } from '../core/blitzkrieg/equipmentDefinitions';
import { useAwait } from './useAwait';

export function useEquipmentPreset(preset: string) {
  const awaitedEquipmentDefinitions = useAwait(equipmentDefinitions);
  console.log(awaitedEquipmentDefinitions);
  return awaitedEquipmentDefinitions.presets[preset];
}
