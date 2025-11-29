import * as yup from 'yup';

export const createRoomValidators = yup.object({
  gridSize: yup.number().required('Grid size is required').min(3).max(12),
  playerCount: yup
    .number()
    .required('Player count is required')
    .min(2)
    .max(12)
    .test('max-by-grid', 'Players cannot exceed grid size', function (value) {
      const { gridSize } = this.parent;
      return value <= gridSize;
    }),
});
