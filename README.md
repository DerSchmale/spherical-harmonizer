# Spherical Harmonizer

A Typescript library to generate L2 spherical harmonics.

## Example 

[Web interface](http://derschmale.github.io/spherical-harmonizer/example)


## Documentation

[Code reference](http://derschmale.github.io/spherical-harmonizer/docs)

There's only one relevant method to be called:

`generateSH(data, width, height, onComplete, onProgress, options)`

- `data`: A `Float32Array` with packed RGB data or a `Uint8ClampedArray` containing packed RGBA 
  data, containing the panorama image.
- `width`: The width of the image contained in `data`.
- `height`: The height of the image contained in `data`.
- `onComplete`: A function called when the generation is complete. An array of `RGB` values will be
  passed, one for each SH coefficient.
- `onProgress` (optional): Called with a value from 0 - 1.
- `options` (optional): An object containing options for generations (irradiance).

Here's an example:

```
import { decodeRGBE } from "@derschmale/io-rgbe";
import { generateSH } from "@derschmale/spherical-harmonizer"; 


function convert(arrayBuffer) {
    const hdr = decodeRGBE(new DataView(arrayBuffer));
    generateSH(hdr.data, hdr.width, hdr.height, onComplete);
}

function onComplete(sh)
{
    // do something with sh coefficients
}

const request = new XMLHttpRequest();
request.open("GET", "/panorama.hdr", true);
request.responseType = "arraybuffer";
request.onload = _ => {
    const arrayBuffer = request.response; // Note: not oReq.responseText
    if (arrayBuffer)
        convert(arrayBuffer);
};

request.send(null);




```


## Building

Building the code is simples:
```
npm install
npm run build
```
