import { stringify } from 'flatted'
import { objectPick } from '@antfu/utils'
import { defineNuxtPlugin } from '#app'

function h<K extends keyof HTMLElementTagNameMap>(
  type: K,
  props: Partial<Omit<HTMLElementTagNameMap[K], 'style'>> & {
    style?: Partial<CSSStyleDeclaration>
  } = {},
  children?: HTMLElement[],
  setup?: (el: HTMLElementTagNameMap[K]) => void,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(type)
  const { style, ...attrs } = props
  Object.assign(el, attrs)
  if (style)
    Object.assign(el.style, style)
  if (children)
    children.forEach(c => el.appendChild(c))
  if (setup)
    setup(el)
  return el
}

export default defineNuxtPlugin((nuxt) => {
  if (typeof document === 'undefined')
    return

  const CLIENT_PATH = '/__nuxt_devtools__/client/'
  const ENTRY_PATH = '/__nuxt_devtools__/entry/'

  nuxt.hook('page:finish', sendPayload)
  nuxt.hook('app:mounted', () => {
    sendPayload()
    sendPages()
  })

  function sendPayload() {
    post('setPayload', {
      url: location.pathname,
      time: Date.now(),
      ...nuxt.payload,
    })
  }
  function sendPages() {
    post('setPages',
      (nuxt.vueApp.config.globalProperties.$router?.getRoutes() || [])
        .map(i => objectPick(i, ['path', 'name', 'meta', 'props', 'children'])),
    )
  }

  function post(method: string, data: any) {
    return fetch(ENTRY_PATH, {
      method: 'POST',
      body: JSON.stringify({
        method,
        data: stringify(data),
      }),
    })
      .catch()
  }

  const iframe = h('iframe', {
    src: CLIENT_PATH,
    className: 'nuxt-devtools-iframe',
    style: {
      height: '100%',
      width: '100%',
      borderRadius: '0.5rem',
      overflow: 'auto',
      outline: 'none',
      zIndex: '9999',
      border: '1px solid rgba(125,125,125,0.2)',
      boxShadow: '3px 5px 8px rgba(0,0,0,0.05)',
    },
  })

  const container = h('div', {
    style: {
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      left: '10px',
      height: '600px',
      maxHeight: 'calc(100vh - 20px)',
      width: 'calc(100vw - 20px)',
    },
  },
  [
    iframe,
    // close button
    h('button', {
      className: 'nuxt-devtools-close-button',
      style: {
        position: 'absolute',
        top: '0',
        right: '0',
        zIndex: '99999',
        height: '2.5rem',
        width: '2.5rem',
        padding: '5px',
      },
    }, [], el => el.addEventListener('click', toggle)),
  ])

  function toggle() {
    if (Array.from(document.body.children).includes(container)) {
      container.style.display = container.style.display === 'none' ? 'block' : 'none'
    }
    else {
      document.body.appendChild(container)
      iframe.contentDocument.body.parentElement.className = document.body.parentElement.className
    }
  }

  const button = h('button',
    {
      title: 'Open Nuxt DevTools',
      className: 'nuxt-devtools-button',
    },
    [
      h('img', {
        src: `${CLIENT_PATH}nuxt-invert.svg`,
        style: {
          height: '20px',
          width: '20px',
          margin: 'auto',
        },
      }),
    ],
    el => el.addEventListener('click', toggle),
  )

  const style = h('style', {
    innerHTML: `
.nuxt-devtools-button {
  position: fixed;
  bottom: -5px;
  left: calc(50% - 25px);
  background: #1DCC84;
  border-radius: 100px 100px 0 0;
  border: 1px solid rgba(125,125,125,0.2);
  box-shadow: 3px 5px 10px rgba(0,0,0,0.1);
  z-index: 999999;
  height: 30px;
  width: 40px;
  cursor: pointer;
  display: flex;
  padding: 0;
  align-items: center;
  transition: all 0.2s ease-in-out;
}
.nuxt-devtools-button:hover {
  background: #19af72;
  bottom: 0;
}
.nuxt-devtools-close-button {
  opacity: 0.5;
}
.nuxt-devtools-close-button:hover {
  opacity: 1;
}
`,
  })

  document.body.appendChild(button)
  document.head.appendChild(style)
})
