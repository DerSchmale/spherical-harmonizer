import {decodeRGBE} from "@derschmale/io-rgbe";
import {generateSH} from "@derschmale/spherical-harmonizer";

document.body.addEventListener("drop", onDrop);
document.body.addEventListener("dragover", onDragOver);

function onDragOver(event)
{
    event.preventDefault();
}

function onDrop(event)
{
    event.preventDefault();

    let files = [];

    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                files.push(event.dataTransfer.items[i].getAsFile());
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
            files.push(event.dataTransfer.files[i]);
        }
    }

    let promise = Promise.resolve();

    document.getElementById("errorContainer").classList.add("hidden");
    document.getElementById("startContainer").classList.add("hidden");
    document.getElementById("progress").classList.remove("hidden");

    const numFiles = files.length;
    for (let i = 0; i < numFiles; ++i) {
        promise = promise.then(() => processFile(files[i], i, numFiles));
    }

    promise
        .then(() =>
        {
            document.getElementById("progress").classList.add("hidden");
            document.getElementById("startContainer").classList.remove("hidden");
        })
        .catch(err => showError(err.message));
}

function processFile(file, fileIndex, numFiles)
{
    const name = file.name.substring(0, file.name.indexOf(".")) + ".ash";

    return new Promise((resolve, reject) =>
    {
        const fileReader = new FileReader();
        fileReader.onload = event =>
            processHDR(event.target.result, fileIndex, numFiles)
                .then(sh => {
                    saveToAsh(sh, name);
                    resolve();
                })
                .catch(reject);
        fileReader.readAsArrayBuffer(file);
    });
}

function processHDR(data, fileIndex, numFiles)
{
    return new Promise((resolve, reject) =>
    {
        try {
            const hdr = decodeRGBE(new DataView(data));
            generateSH(
                hdr.data, hdr.width, hdr.height,
                resolve, r =>
                {
                    onProgress((fileIndex + r) / numFiles)
                },
                {
                    irradiance: document.getElementById("irradianceCheck").checked
                }
            );
        } catch (e) {
            reject(e);
        }
    });
}

function onProgress(ratio)
{
    let progress = document.getElementById("progressProgress");
    progress.style.width = Math.floor(ratio * 100) + "%";
}

function saveToAsh(sh, name)
{
    let str = "# Generated with Helix\n";

    let n = 0;
    for (let l = 0; l < 3; ++l) {
        str += "\nl=" + l + ":\n";
        for (let m = -l; m <= l; ++m) {
            str += "m=" + m + ": ";
            str += sh[n].r + " " + sh[n].g + " " + sh[n].b + "\n";
            ++n;
        }
    }

    download(str, name);
}

function download(ashContents, name)
{
    const blob = new Blob([ashContents], {type: "text/plain;charset=utf-8"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.style = "display: none";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function showError(message)
{
    document.getElementById("errorContainer").classList.remove("hidden");
    document.getElementById("startContainer").classList.add("hidden");
    document.getElementById("progress").classList.add("hidden");
    document.getElementById("errorMessage").innerHTML = message;
}
