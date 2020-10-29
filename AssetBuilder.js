const fs = require('fs-extra')
const path = require('path');
var glob = require("glob")
const util = require('util');
const Configs = require('./Configs');


let AssetBuilder = function (input_root, output_root) {
    input_root = input_root || "";
    output_root = output_root || "";
    input_root = input_root.replace(/\\/g, "/");
    output_root = output_root.replace(/\\/g, "/");
    console.log("input_root:", input_root);
    console.log("output_root:", output_root);
    this.input_root = input_root;
    this.output_root = output_root;

    fs.removeSync(output_root);

}
AssetBuilder.prototype.searchFiles = function (callback) {
    let self = this;
    this.searchConfig_next(Configs, 0, function () {
        callback && callback();
    });
}
// search files by glob
// @param {array} searchPath: 

AssetBuilder.prototype.searchConfig_next = function (Configs, index, callback) {
    let self = this;
    let len = Configs.length;
    if (len == 0 || index > (len - 1)) {
        callback && callback();
        return
    }
    let config = Configs[index];

    let input_arr = config.searchPath;
    console.log("====== search config:", config.outputName);

    this.searchFiles_next(input_arr, 0, [], function (output_arr) {
        self.writeToFile(config, output_arr, function () {
            self.searchConfig_next(Configs, index + 1, callback);
        });
    });
}
AssetBuilder.prototype.writeToFile = function (config, output_arr, callback) {
    console.log("output_arr.length:", output_arr.length);
    let arr = [];
    for (let i = 0; i < output_arr.length; i++) {
        let filename = output_arr[i];
        filename = filename.replace(this.input_root, "");

        if (filename && filename[0] == "/") {
            filename = filename.substring(1);
        }
        arr.push(filename);
    }

    let id = config.outputName;
    let assetFilePath = output_root + "/" + id + ".json";

    fs.ensureFileSync(assetFilePath);

    var json = JSON.stringify(arr,null,2);
    fs.writeFile(assetFilePath, json, 'utf8', function (err) {
        if (!err) {
            console.log("write done:", assetFilePath)
        } else {
            console.log("write error:", err)
        }

        callback && callback()
    });
}
AssetBuilder.prototype.searchFiles_next = function (input_arr, index, output_arr, callback) {
    let self = this;
    let len = input_arr.length;
    if (len == 0 || index > (len - 1)) {
        callback && callback(output_arr);
        return
    }
    let filepath = input_arr[index];
    filepath = this.input_root + "/" + filepath;
    console.log("search path:%s", filepath)
    glob(filepath , {}, function (err, files) {
        output_arr = output_arr.concat(files);
        self.searchFiles_next(input_arr, index + 1, output_arr, callback);
    })
}

let args = process.argv;
// create an instance
let input_root = args[2] || path.resolve(__dirname, "..");
let output_root = path.resolve(__dirname, "dist");
let asset_builder = new AssetBuilder(input_root, output_root);
asset_builder.searchFiles();