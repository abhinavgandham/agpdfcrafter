const { handleFileConvert } = require('../middleware/fileConvert');

/**
 * Function call the conversion middleware upon hitting the convert endpoint.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object containing the conversion status.
 */
const convertFile = async (req, res) => {
    try {
        // Call the convert middleware
        await handleFileConvert(req, res)
    } catch(error) {
        return res.status(500).json({message: "An unexpected error occured."})
    }
}

module.exports = {convertFile};