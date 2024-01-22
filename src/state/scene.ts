import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'

const camControls = atom<'reset' | 'enabled' | 'disabled'>({
  key: 'camControls',
  default: 'disabled',
})

export const useCamControlsValue = () => useRecoilValue(camControls)
export const useCamControls = () => useRecoilState(camControls)
export const useSetCamControls = () => useSetRecoilState(camControls)
