import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'

const cameraReset = atom<number>({
  key: 'cameraReset',
  default: 0,
})

export const useCameraResetValue = () => useRecoilValue(cameraReset)
export const useCameraReset = () => useRecoilState(cameraReset)
