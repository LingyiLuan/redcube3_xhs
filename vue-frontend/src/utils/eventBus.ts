import mitt from 'mitt'

type Events = {
  'open-login-modal': { returnUrl?: string } | undefined
  'open-learning-map-login': void
}

const emitter = mitt<Events>()

export function useEventBus() {
  return emitter
}

