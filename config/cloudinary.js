const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});
async function handleUpload(file, public_id, folder) {
    const res = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
        public_id,
        overwrite: true,
        folder: folder || "",
    });
    return res;
}

module.exports = handleUpload;
