const { handleFileConvert } = require('../middleware/fileConvert');

const convertFile = async (req, res) => {
    try {
        // Call the convert middleware
        await handleFileConvert(req, res)
    } catch(error) {
        return res.status(500).json({message: "An unexpected error occured."})
    }
}

module.exports = {convertFile};