import unsplashBackgrounds from './unsplash'
import localBackgrounds from './local'
import { rgbToHex } from '../../utils'
import { eventDebounce } from '../../utils/debounce'
import { BROWSER } from '../../defaults'

type FilterOptions = {
	blur?: number
	brightness?: number
	isEvent?: true
}

type UpdateOptions = {
	freq?: string
	refresh?: HTMLSpanElement
}

export default function initBackground(data: Sync.Storage, local: Local.Storage) {
	const type = data.background_type || 'unsplash'
	const blur = data.background_blur
	const brightness = data.background_bright

	backgroundFilter({ blur, brightness })

	if (BROWSER === 'safari') {
		const bgfirst = document.getElementById('background') as HTMLDivElement
		const bgsecond = document.getElementById('background-bis') as HTMLDivElement

		bgfirst.style.transform = 'scale(1.1) translateX(0px) translate3d(0, 0, 0)'
		bgsecond.style.transform = 'scale(1.1) translateX(0px) translate3d(0, 0, 0)'
	}

	type === 'local' ? localBackgrounds() : unsplashBackgrounds({ unsplash: data.unsplash, cache: local.unsplashCache })
}

//
//
//

export function imgBackground(url: string, color?: string) {
	const img = new Image()

	// Set the crossOrigin attribute to handle CORS when average color needed
	if (!color) img.crossOrigin = 'Anonymous'

	img.onload = () => {
		const bgoverlay = document.getElementById('background_overlay') as HTMLDivElement
		const bgfirst = document.getElementById('background') as HTMLDivElement
		const bgsecond = document.getElementById('background-bis') as HTMLDivElement
		const loadBis = bgfirst.style.opacity === '1'
		const bgToChange = loadBis ? bgsecond : bgfirst

		bgfirst.style.opacity = loadBis ? '0' : '1'
		bgToChange.style.backgroundImage = `url(${url})`

		bgoverlay.style.opacity = '1'


		if (!color) color = getAverageColor(img)

		// clock.style.color = color? color: '#fff';
		// Function to convert hex color to rgba with specified opacity and whiteness
		const hexToRgbaWithWhiteness = (hex: string, opacity: number, whiteness: number): string => {

			const sanitizedHex = hex.startsWith('#') ? hex.slice(1) : hex;
			const bigint = parseInt(sanitizedHex, 16);

			const r = (bigint >> 16) & 255;
			const g = (bigint >> 8) & 255;
			const b = bigint & 255;

			if ((r + g + b) / 3 < 50) {
				const whitenedR = Math.round(r);
				const whitenedG = Math.round(g);
				const whitenedB = Math.round(b);
				return `rgba(${whitenedR}, ${whitenedG}, ${whitenedB}, ${opacity})`;
			} else {
				const whitenedR = Math.round(r - (r * whiteness));
				const whitenedG = Math.round(g - (g * whiteness));
				const whitenedB = Math.round(b - (b * whiteness));
				return `rgba(${whitenedR}, ${whitenedG}, ${whitenedB}, ${opacity})`;
			}


		};

		//  50% opacity and 20% whiteness
		const colorWithWhiteness = hexToRgbaWithWhiteness(color as string, 0.4, 0.18);

		if (color) {
			console.log(colorWithWhiteness);
			console.log(color);

			document.querySelector('background_overlay')?.setAttribute('content', colorWithWhiteness)
			setTimeout(() => document.documentElement.style.setProperty('--average-color', colorWithWhiteness!), 400)
		}

	}

	img.src = url
	img.remove()
}

export function backgroundFilter({ blur, brightness, isEvent }: FilterOptions) {
	const hasbright = typeof brightness === 'number'
	const hasblur = typeof blur === 'number'

	if (hasblur) document.documentElement.style.setProperty('--background-blur', blur.toString() + 'px')
	if (hasbright) document.documentElement.style.setProperty('--background-brightness', brightness.toString())

	if (hasblur) {
		document.body.classList.toggle('blurred', blur > 16)
	}

	if (isEvent && hasblur) eventDebounce({ background_blur: blur })
	if (isEvent && hasbright) eventDebounce({ background_bright: brightness })
}

export function updateBackgroundOption({ freq, refresh }: UpdateOptions) {
	const i_type = document.getElementById('i_type') as HTMLInputElement
	const isLocal = i_type.value === 'local'

	if (freq !== undefined) {
		isLocal ? localBackgrounds({ freq }) : unsplashBackgrounds(undefined, { every: freq })
	}

	if (refresh) {
		isLocal ? localBackgrounds({ refresh }) : unsplashBackgrounds(undefined, { refresh })
	}
}

export function getAverageColor(img: HTMLImageElement) {
	try {
		// Create a canvas element
		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')

		const MAX_DIMENSION = 100 // resizing the image for better performance

		// Calculate the scaling factor to maintain aspect ratio
		const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height)

		// Set canvas dimensions to the scaled image dimensions
		canvas.width = img.width * scale
		canvas.height = img.height * scale

		// Draw the image onto the canvas
		ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

		// Get the image data from the canvas
		const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
		const data = imageData?.data

		let r = 0,
			g = 0,
			b = 0
		let count = 0

		// Loop through the image data and sum the color values
		if (data) {
			for (let i = 0; i < data.length; i += 4) {
				r += data[i]
				g += data[i + 1]
				b += data[i + 2]
				count++
			}
		}

		// Calculate the average color
		r = Math.floor(r / count)
		g = Math.floor(g / count)
		b = Math.floor(b / count)

		// Output the average color in RGB format
		console.log(rgbToHex(r, g, b))
		return rgbToHex(r, g, b)
	} catch (error) {
		console.error('Error accessing image data:', error)
	}
}

// function backgroundFreq() {
// 	//
// }

// function refreshBackground() {
// 	//
// }