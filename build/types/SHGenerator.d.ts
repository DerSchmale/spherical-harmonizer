import { RGB } from "./RGB";
export declare type SHOptions = {
    irradiance?: boolean;
};
export declare function generateSH(hdrImageData: Float32Array | Uint8ClampedArray, width: number, height: number, onComplete: (sh: RGB[]) => void, onProgress?: (r: number) => void, options?: SHOptions): void;
