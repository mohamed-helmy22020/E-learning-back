const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const handleUpload = async (file, public_id, folder) => {
    const res = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
        public_id,
        overwrite: true,
        folder: folder || "",
    });
    return res;
};

const handleUploadFromBuffer = async (profilePicture, options) => {
    const b64 = Buffer.from(profilePicture.buffer).toString("base64");
    let dataURI = "data:" + profilePicture.mimetype + ";base64," + b64;

    return await handleUpload(dataURI, options.public_id, options.folder);
};

module.exports = { handleUpload, handleUploadFromBuffer };
