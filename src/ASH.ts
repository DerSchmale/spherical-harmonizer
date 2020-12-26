import { RGB } from "./RGB";

/**
 * Encodes the sh harmonics as an .ASH file (as used by Knald Lys and Helix3D).
 */
export function encodeASH(sh: RGB[]): string
{
	let str = "# Generated with @derschmale/spherical-harmonizer\n";

	let n = 0;
	for (let l = 0; l < 3; ++l) {
		str += "\nl=" + l + ":\n";
		for (let m = -l; m <= l; ++m) {
			str += "m=" + m + ": ";
			str += sh[n].r + " " + sh[n].g + " " + sh[n].b + "\n";
			++n;
		}
	}

	return str;
}
