import { IS_BROWSER } from '$fresh/runtime.ts'
import { Configuration, setup } from '$twind'
import * as colors from '$twind/colors'

export * from '$twind'

export const config: Configuration = {
    darkMode: 'class',
    mode: 'silent',

    theme: {
        extend: {
            fontFamily: {
                'lato': ['Lato', 'sans-serif']
            },
            backgroundImage: {
                'yeah-yeah': 'url(/daby.jpg)'
            },
            colors: colors,
        }
    },

    // https://twind.dev/handbook/configuration.html#custom-fonts-and-imports
    preflight: {
        '@import': `url('https://fonts.googleapis.com/css2?family=Lato&display=swap')`,
    }
    
}
if (IS_BROWSER) setup(config)
