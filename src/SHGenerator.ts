// https://en.wikipedia.org/wiki/Table_of_spherical_harmonics#Real_spherical_harmonics
import { RGB } from "./RGB";

/**
 * @ignore
 */
const l0 = 0.5 * Math.sqrt(1.0 / Math.PI);
/**
 * @ignore
 */
const l1 = 0.5 * Math.sqrt(3.0 / Math.PI);
/**
 * @ignore
 */
const l2_1 = 0.5 * Math.sqrt(15.0 / Math.PI);
/**
 * @ignore
 */
const l2_2 = 0.25 * Math.sqrt(5.0 / Math.PI);
/**
 * @ignore
 */
const l2_3 = 0.25 * Math.sqrt(15.0 / Math.PI);

/**
 * @ignore
 */
const irrConstants = [
	Math.PI,
	Math.PI * 2 / 3,
	Math.PI * 2 / 3,
	Math.PI * 2 / 3,
	Math.PI / 4,
	Math.PI / 4,
	Math.PI / 4,
	Math.PI / 4,
	Math.PI / 4
];

/**
 * @ignore
 */
const shConstants = [
	l0,

	l1,
	l1,
	l1,

	l2_1,
	l2_1,
	l2_2,
	l2_1,
	l2_3
];

/**
 * The options that can be passed to the `generateSH` function.
 */
export type SHOptions = {
	/**
	 * Whether or not the spherical harmonics are generated as an irradiance map. Defaults to true.
	 */
	irradiance?: boolean
}

/**
 * Converts regular image data to floating point data.
 * @ignore
 */
function convertToFloats(data: Uint8ClampedArray)
{
	const len = data.length;
	const f32 = new Float32Array(len / 4 * 3);

	for (let i = 0, j = 0; i < len; i += 3, j += 4) {
		f32[i] = Math.pow(data[j] / 0xff, 2.2);
		f32[i + 1] = Math.pow(data[j + 1] / 0xff, 2.2);
		f32[i + 2] = Math.pow(data[j + 2] / 0xff, 2.2);
	}

	return f32;
}

/**
 * Converts HDRI (equirectangular / panorama) image to its SH representation.
 * @param hdrImageData The Float32Array (for hdr) or Uint8ClampedArray (for ldr) image data as a
 * flat list. Float32Arrays should only contains packed RGB data, while Uint8ClampedArray are RGBA.
 *
 * @param width The width of the image.
 * @param height The height of the image.
 * @param onComplete A function that's called when processing is complete.
 * @param onProgress An optional function that's called when processing updates.
 * @param options An optional SHOptions object.
 */
export function generateSH(
	hdrImageData: Float32Array | Uint8ClampedArray, width: number, height: number,
	onComplete: (sh: RGB[]) => void, onProgress?: (r: number) => void,
	options?: SHOptions
)
{
	// TODO: Implement as a worker instead of using green threading
	options = options || {};
	if (options.irradiance === undefined) options.irradiance = true;

	let f32data = hdrImageData instanceof Uint8ClampedArray? convertToFloats(hdrImageData) : hdrImageData;

	const sh: RGB[] = [];

	for (let i = 0; i < 9; ++i)
		sh[i] = {r: 0, g: 0, b: 0};

	doPart(sh, f32data, width, height, onComplete, onProgress, options, 0, 0);
}

/**
 * @ignore
 */
function doPart(sh: RGB[], data: Float32Array, width: number, height: number,
				onComplete: (sh: RGB[]) => void, onProgress: (r: number) => void,
				options: SHOptions, index: number, totalWeight: number)
{
	const numSamples = width * height;

	for (let i = 0; i < 10000; ++i) {
		totalWeight += accumulate(sh, index, data, width, height);

		if (++index === numSamples) {
			setTimeout(finish, 0, sh, totalWeight, onComplete, onProgress, options);
			return;
		}
	}

	if (onProgress)
		onProgress(index / numSamples);

	setTimeout(doPart, 0, sh, data, width, height, onComplete, onProgress, options, index, totalWeight);
}

/**
 * @ignore
 */
const tmp = new Float32Array(9);

/**
 * @ignore
 */
function accumulate(sh: RGB[], index: number, data: Float32Array, width: number, height: number): number
{
	const x = index % width;
	const y = Math.floor(index / width);
	const p3 = index * 3;
	const r = data[p3], g = data[p3 + 1], b = data[p3 + 2]

	// + .5 to match helix's panorama orientation
	const u = -(x / width * 2.0 - 1.0) + .5;
	const v = y / height * 2.0 - 1.0;
	const phi = v * Math.PI / 2;
	const cosPhi = Math.cos(phi);
	const nx = Math.cos(u * Math.PI) * cosPhi;
	const ny = -Math.sin(phi);
	const nz = Math.sin(u * Math.PI) * cosPhi;

	tmp[0] = shConstants[0];

	tmp[1] = shConstants[1] * ny;
	tmp[2] = shConstants[2] * nz;
	tmp[3] = shConstants[3] * nx;

	tmp[4] = shConstants[4] * nx * ny;
	tmp[5] = shConstants[5] * ny * nz;
	tmp[6] = shConstants[6] * (3.0 * nz * nz - 1.0);
	tmp[7] = shConstants[7] * nz * nx;
	tmp[8] = shConstants[8] * (nx * nx - ny * ny);

	const w = cosPhi;	// cos(phi) is the differential solid angle

	for (let i = 0; i < 9; ++i) {
		const v = sh[i];
		v.r += tmp[i] * r * w;
		v.g += tmp[i] * g * w;
		v.b += tmp[i] * b * w;
	}

	return w;
}

/**
 * @ignore
 */
function finish(sh: RGB[], totalWeight: number,
				onComplete: (sh: RGB[]) => void, onProgress: (r: number) => void,
				options: SHOptions)
{
		for (let i = 0; i < 9; ++i) {
			let sc = options.irradiance? irrConstants[i] : 1.0;
			sc *= Math.PI * 4.0 / totalWeight;

			sh[i].r *= sc;
			sh[i].g *= sc;
			sh[i].b *= sc;
		}

		if (onProgress)
			onProgress(1);

		if (onComplete)
			onComplete(sh);
}
