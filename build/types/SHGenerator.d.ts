import { RGB } from "./RGB";
/**
 * The options that can be passed to the `generateSH` function.
 */
export declare type SHOptions = {
    /**
     * Whether or not the spherical harmonics are generated as an irradiance map. Defaults to true.
     */
    irradiance?: boolean;
};
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
export declare function generateSH(hdrImageData: Float32Array | Uint8ClampedArray, width: number, height: number, onComplete: (sh: RGB[]) => void, onProgress?: (r: number) => void, options?: SHOptions): void;
