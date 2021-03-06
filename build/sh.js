var SH = (function (exports) {
	'use strict';

	/**
	 * Encodes the sh harmonics as an .ASH file (as used by Knald Lys and Helix3D).
	 */
	function encodeASH(sh) {
	    var str = "# Generated with @derschmale/spherical-harmonizer\n";
	    var n = 0;
	    for (var l = 0; l < 3; ++l) {
	        str += "\nl=" + l + ":\n";
	        for (var m = -l; m <= l; ++m) {
	            str += "m=" + m + ": ";
	            str += sh[n].r + " " + sh[n].g + " " + sh[n].b + "\n";
	            ++n;
	        }
	    }
	    return str;
	}

	/**
	 * @ignore
	 */
	var l0 = 0.5 * Math.sqrt(1.0 / Math.PI);
	/**
	 * @ignore
	 */
	var l1 = 0.5 * Math.sqrt(3.0 / Math.PI);
	/**
	 * @ignore
	 */
	var l2_1 = 0.5 * Math.sqrt(15.0 / Math.PI);
	/**
	 * @ignore
	 */
	var l2_2 = 0.25 * Math.sqrt(5.0 / Math.PI);
	/**
	 * @ignore
	 */
	var l2_3 = 0.25 * Math.sqrt(15.0 / Math.PI);
	/**
	 * @ignore
	 */
	var irrConstants = [
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
	var shConstants = [
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
	 * Converts regular image data to floating point data.
	 * @ignore
	 */
	function convertToFloats(data) {
	    var len = data.length;
	    var f32 = new Float32Array(len / 4 * 3);
	    for (var i = 0, j = 0; i < len; i += 3, j += 4) {
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
	function generateSH(hdrImageData, width, height, onComplete, onProgress, options) {
	    // TODO: Implement as a worker instead of using green threading
	    options = options || {};
	    if (options.irradiance === undefined)
	        options.irradiance = true;
	    var f32data = hdrImageData instanceof Uint8ClampedArray ? convertToFloats(hdrImageData) : hdrImageData;
	    var sh = [];
	    for (var i = 0; i < 9; ++i)
	        sh[i] = { r: 0, g: 0, b: 0 };
	    doPart(sh, f32data, width, height, onComplete, onProgress, options, 0, 0);
	}
	/**
	 * @ignore
	 */
	function doPart(sh, data, width, height, onComplete, onProgress, options, index, totalWeight) {
	    var numSamples = width * height;
	    for (var i = 0; i < 10000; ++i) {
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
	var tmp = new Float32Array(9);
	/**
	 * @ignore
	 */
	function accumulate(sh, index, data, width, height) {
	    var x = index % width;
	    var y = Math.floor(index / width);
	    var p3 = index * 3;
	    var r = data[p3], g = data[p3 + 1], b = data[p3 + 2];
	    // + .5 to match helix's panorama orientation
	    var u = -(x / width * 2.0 - 1.0) + .5;
	    var v = y / height * 2.0 - 1.0;
	    var phi = v * Math.PI / 2;
	    var cosPhi = Math.cos(phi);
	    var nx = Math.cos(u * Math.PI) * cosPhi;
	    var ny = -Math.sin(phi);
	    var nz = Math.sin(u * Math.PI) * cosPhi;
	    tmp[0] = shConstants[0];
	    tmp[1] = shConstants[1] * ny;
	    tmp[2] = shConstants[2] * nz;
	    tmp[3] = shConstants[3] * nx;
	    tmp[4] = shConstants[4] * nx * ny;
	    tmp[5] = shConstants[5] * ny * nz;
	    tmp[6] = shConstants[6] * (3.0 * nz * nz - 1.0);
	    tmp[7] = shConstants[7] * nz * nx;
	    tmp[8] = shConstants[8] * (nx * nx - ny * ny);
	    var w = cosPhi; // cos(phi) is the differential solid angle
	    for (var i = 0; i < 9; ++i) {
	        var v_1 = sh[i];
	        v_1.r += tmp[i] * r * w;
	        v_1.g += tmp[i] * g * w;
	        v_1.b += tmp[i] * b * w;
	    }
	    return w;
	}
	/**
	 * @ignore
	 */
	function finish(sh, totalWeight, onComplete, onProgress, options) {
	    for (var i = 0; i < 9; ++i) {
	        var sc = options.irradiance ? irrConstants[i] : 1.0;
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

	exports.encodeASH = encodeASH;
	exports.generateSH = generateSH;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

}({}));
